package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os/exec"
	"strings"
	"time"
)

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

func main() {
	addr := flag.String("addr", "127.0.0.1:8080", "local listen address")
	upstream := flag.String("upstream", "", "optional OpenAI-compatible upstream base URL")
	redactor := flag.String("redactor", "", "optional path to the prompt-redactor executable")
	flag.Parse()

	client := &http.Client{Timeout: 90 * time.Second}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	http.HandleFunc("/v1/chat/completions", func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(io.LimitReader(r.Body, 8<<20))
		if err != nil {
			http.Error(w, "could not read request", http.StatusBadRequest)
			return
		}

		printRequest(body, *redactor)

		if strings.TrimSpace(*upstream) == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadGateway)
			_, _ = w.Write([]byte(`{"error":{"message":"Prompt Inspector captured the request. Start with -upstream to forward it to a provider.","type":"prompt_inspector_capture_only"}}`))
			return
		}

		target, err := upstreamURL(*upstream)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}

		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, target, bytes.NewReader(body))
		if err != nil {
			http.Error(w, "could not create upstream request", http.StatusBadGateway)
			return
		}

		copyHeaders(req.Header, r.Header)
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "upstream request failed: "+err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		copyHeaders(w.Header(), resp.Header)
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
	})

	log.Printf("Prompt Inspector listening on http://%s", *addr)
	if strings.TrimSpace(*upstream) == "" {
		log.Printf("capture-only mode: requests are printed but not forwarded")
	} else {
		log.Printf("forwarding chat completions to %s", *upstream)
	}
	log.Fatal(http.ListenAndServe(*addr, nil))
}

func upstreamURL(base string) (string, error) {
	u, err := url.Parse(strings.TrimRight(base, "/"))
	if err != nil || u.Scheme == "" || u.Host == "" {
		return "", fmt.Errorf("invalid upstream URL")
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/v1/chat/completions"
	return u.String(), nil
}

func copyHeaders(dst, src http.Header) {
	for key, values := range src {
		if strings.EqualFold(key, "Host") || strings.EqualFold(key, "Content-Length") {
			continue
		}
		for _, value := range values {
			dst.Add(key, value)
		}
	}
}

func redactText(input, redactorPath string) string {
	if strings.TrimSpace(redactorPath) == "" {
		return input
	}
	cmd := exec.Command(redactorPath)
	cmd.Stdin = strings.NewReader(input)
	out, err := cmd.Output()
	if err != nil {
		log.Printf("redactor failed; showing original text: %v", err)
		return input
	}
	return strings.TrimSpace(string(out))
}

func printRequest(body []byte, redactorPath string) {
	var req chatRequest
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("captured non-standard JSON body (%d bytes)", len(body))
		fmt.Println(redactText(string(body), redactorPath))
		return
	}

	fmt.Printf("\n=== PROMPT INSPECTOR ===\n")
	fmt.Printf("model: %s\nmessages: %d\n", req.Model, len(req.Messages))
	for i, msg := range req.Messages {
		fmt.Printf("\n[%02d] %s\n", i, strings.ToUpper(msg.Role))
		switch value := msg.Content.(type) {
		case string:
			fmt.Println(redactText(value, redactorPath))
		default:
			pretty, _ := json.MarshalIndent(value, "", "  ")
			fmt.Println(redactText(string(pretty), redactorPath))
		}
	}
	fmt.Printf("\n=== END REQUEST ===\n")
}

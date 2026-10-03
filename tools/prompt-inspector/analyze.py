#!/usr/bin/env python3
"""Offline analyzer for JSONL records exported by Prompt Inspector."""

import argparse
import json
from collections import Counter
from pathlib import Path

MARKERS = ("[HISTORICAL EQUIPMENT]", "[ACTION VARIETY]", "[DYNAMIC ESCALATION]")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    args = parser.parse_args()
    records = [json.loads(line) for line in args.file.read_text().splitlines() if line.strip()]
    roles = Counter()
    markers = Counter()
    chars = 0
    for record in records:
        for message in record.get("messages", []):
            roles[str(message.get("role", "unknown"))] += 1
            text = str(message.get("content", ""))
            chars += len(text)
            for marker in MARKERS:
                if marker in text:
                    markers[marker] += 1
    print(f"records: {len(records)}")
    print(f"message characters: {chars}")
    print("roles:", dict(roles))
    print("module markers:", dict(markers))

if __name__ == "__main__":
    main()

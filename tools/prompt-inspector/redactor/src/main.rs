use std::io::{self, Read};

fn redact(input: &str) -> String {
    input
        .split_whitespace()
        .map(|word| {
            let lower = word.to_ascii_lowercase();
            if lower.starts_with("sk-") || lower.starts_with("bearer") {
                "[REDACTED]".to_string()
            } else {
                word.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).expect("read stdin");
    println!("{}", redact(&input));
}

#[cfg(test)]
mod tests {
    use super::redact;
    #[test]
    fn redacts_key_like_tokens() {
        assert_eq!(redact("token sk-example"), "token [REDACTED]");
    }
}

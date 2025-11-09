use std::collections::HashSet;

use regex::Regex;

pub fn summary_markdown(markdown: &str, max_length: usize) -> String {
    let mut is_space = false;
    let mut in_block1 = false;
    let mut in_block2 = false;
    let mut in_block3 = false;

    markdown
        .chars()
        .map(|ch| match ch {
            _ if in_block1 || in_block2 || in_block3 => '\0',
            ' ' if is_space => '\0',
            ' ' if !is_space => {
                is_space = true;
                ch
            }
            '\n' | '\r' | '\t' if !is_space => {
                is_space = true;
                ' '
            }
            '\n' | '\t' | '\r' | '_' | '*' | '`' | '#' | '!' => '\0',
            '(' => {
                in_block1 = true;
                '\0'
            }
            ')' => {
                in_block1 = false;
                '\0'
            }
            '[' => {
                in_block2 = true;
                '\0'
            }
            ']' => {
                in_block2 = false;
                '\0'
            }
            '<' => {
                in_block3 = true;
                '\0'
            }
            '>' => {
                in_block3 = false;
                '\0'
            }
            _ => {
                is_space = false;
                ch
            }
        })
        .filter(|ch| *ch != '\0')
        .take(max_length)
        .collect::<String>()
        .trim()
        .to_string()
}

pub fn collect_markdown_languages(md: &str) -> Vec<String> {
    let re = Regex::new(r"(?m)^```([a-zA-Z0-9_\-]+)").unwrap();
    let mut set = HashSet::new();

    for cap in re.captures_iter(md) {
        if let Some(lang) = cap.get(1) {
            set.insert(lang.as_str().to_string());
        }
    }

    let mut result: Vec<_> = set.into_iter().collect();
    result.sort_unstable();
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_summary_markdown() {
        let markdown = "# Title\n\nThis is a summary.\n\nThis is a paragraph.\n\nThis is another paragraph.\n\nThis is a list:\n\n- Item 1\n- Item 2\n- Item 3\n\nThis is a code block:\n\n```rust\nfn main() {\n    println!(\"Hello, world!\");\n}\n```\n\nThis is a link: [Rust](https://www.rust-lang.org/).\n\nThis is an image:![Rust Logo](https://www.rust-lang.org/logos/rust-logo-128x128-blk.png).";
        let expected = "Title This is a summary. This is a paragraph. This is another paragraph. This is a list: - Item 1 - Item 2 - Item 3 This is a code block: rust fn main";
        assert_eq!(summary_markdown(markdown, 100000), expected);
    }

    #[test]
    fn test_collect_markdown_languages() {
        let md = r#"
# Example

```rust
fn main() {}
````

```js
console.log("hi");
```

```ts
let x: number = 42;
```

```rust
println!("again");
```

```ts
let x: number = 42;
```

```
(no language)
```

"#;
        let langs = collect_markdown_languages(md);
        assert_eq!(langs, vec!["js", "rust", "ts"]);
    }
}

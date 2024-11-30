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

pub fn from_bool(b: bool) -> Option<String> {
    if b {
        Some('1'.to_string())
    } else {
        Some('0'.to_string())
    }
}

pub fn to_bool(s: Option<String>) -> bool {
    if let Some(s) = s {
        s == '1'.to_string()
    } else {
        false
    }
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
}

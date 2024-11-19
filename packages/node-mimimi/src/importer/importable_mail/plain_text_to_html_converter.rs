use regex::Regex;

/// Convert plain text to html and apply the following special formatting:
/// 1. support **line breaks**,
///    by adding **<br>**
/// 2. support **indented plain text blocks** (marked with '>'),
///    by adding **<blockquote>** <<indented plain text block>> **</blockquote>**
/// 3. **escapes** "&" with "&amp;", "<" with "&lt;", and ">" with "&gt;"
///
/// This code is ported from tutadb PlainTextToHtmlConverter
pub(super) fn plain_text_to_html(plain_text: &str) -> String {
	let mut result: String = String::from("");
	let separator: Regex = Regex::new("\r?\n").expect("invalid regex"); // todo! move to const
	let lines = separator.split(plain_text);
	let mut previous_quote_level = 0;
	for (i, line) in lines.enumerate() {
		let line_quote_level = get_line_quote_level(line.to_string());

		if i > 0 && (previous_quote_level == line_quote_level) {
			// only append an explicit newline (<br>) if the quoteLevel does not change (implicit newline in case of <blockquote>)
			result.push_str("<br>")
		}

		result.push_str(
			"</blockquote>"
				.repeat(
					(previous_quote_level - line_quote_level)
						.try_into()
						.unwrap_or(0),
				)
				.as_str(),
		);
		result.push_str(
			"<blockquote>"
				.repeat(
					(line_quote_level - previous_quote_level)
						.try_into()
						.unwrap_or(0),
				)
				.as_str(),
		);

		if line_quote_level > 0 {
			if line.len() > line_quote_level as usize {
				let quote_block_start_index: usize = (line_quote_level + 1) as usize;
				let indented_line: &str = &line[quote_block_start_index..];
				let escaped_line = escape_plain_text_line(indented_line);
				result.push_str(&escaped_line)
			}
		} else {
			let escaped_line = escape_plain_text_line(line);
			result.push_str(&escaped_line); // skip '> ', '>> ', ...
		}
		previous_quote_level = line_quote_level
	}

	result.push_str(
		"</blockquote>"
			.repeat((previous_quote_level).try_into().unwrap_or(0))
			.as_str(),
	);

	result
}

fn escape_plain_text_line(line: &str) -> String {
	let escaped_line = line.replace("&", "&amp;");
	let escaped_line = escaped_line.replace("<", "&lt;");

	escaped_line.replace(">", "&gt;")
}

fn get_line_quote_level(line: String) -> i32 {
	let mut line_open_blockquotes = 0;
	for char in line.chars() {
		if char == '>' {
			line_open_blockquotes += 1;
		} else if char == ' ' {
			break;
		} else {
			line_open_blockquotes = 0;
			break;
		}
	}
	line_open_blockquotes
}

#[cfg(test)]
mod test {
	use crate::importer::importable_mail::plain_text_to_html_converter::plain_text_to_html;

	/**
	 * Adds <html> and <body> tags to the given html
	 */
	fn add_html_page_tags(html: String) -> String {
		format!(
			"<html>\r\n\
  <head>\r\n\
    <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\r\n\
  </head>\r\n\
  <body>\r\n\
{}\
  </body>\r\n\
</html>\r\n",
			html
		)
	}

	#[test]
	pub fn convert_to_html() {
		assert_eq!("Test-Mail im Plain-Text und mit komischen Zeichen: &amp; \"~öä⥣Ի³@<br>weiter gehts in der naechsten Zeile",
                   plain_text_to_html("Test-Mail im Plain-Text und mit komischen Zeichen: & \"~öä⥣Ի³@\r\nweiter gehts in der naechsten Zeile"));

		assert_eq!(
			"<blockquote>simple blockquote</blockquote>",
			plain_text_to_html("> simple blockquote")
		);

		assert_eq!(
			"<blockquote>blockquote <br>with line break</blockquote>",
			plain_text_to_html("> blockquote \r\n> with line break")
		);

		assert_eq!(
			"<blockquote><blockquote>blockquote </blockquote>with line break</blockquote>",
			plain_text_to_html(">> blockquote \r\n> with line break")
		);

		assert_eq!(
			"<blockquote>blockquote <blockquote>with line break</blockquote></blockquote>",
			plain_text_to_html("> blockquote \r\n>> with line break")
		);

		assert_eq!("<blockquote><blockquote><blockquote>blockquote </blockquote></blockquote></blockquote> with line break",
                   plain_text_to_html(">>> blockquote \r\n with line break"));

		// quote without text
		assert_eq!("<blockquote></blockquote>", plain_text_to_html(">"));

		// quote without text but newline
		assert_eq!(
			"<blockquote><br></blockquote>",
			plain_text_to_html(">\r\n>")
		);
	}

	#[test]
	pub fn test_add_html_page_tags() {
		let expected = "<html>\r\n\
  <head>\r\n\
    <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\r\n\
  </head>\r\n\
  <body>\r\n\
<span>Test-Mail im Plain-Text</span>\
</body>\r\n\
</html>\r\n";
		assert_eq!(
			expected,
			add_html_page_tags("<span>Test-Mail im Plain-Text</span>".to_string())
		);
	}
}

import o from "@tutao/otest"
import { plainTextToHtml } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/PlainTextToHtmlConverter"

o.spec("plainTextToHtml", () => {
	o.test("converts empty string to empty string", () => {
		o.check(plainTextToHtml("")).equals("")
	})

	o.test("converts single line without special chars", () => {
		o.check(plainTextToHtml("Hello world")).equals("Hello world")
	})

	o.test("escapes HTML special characters", () => {
		o.check(plainTextToHtml("This & that <div> > text")).equals("This &amp; that &lt;div&gt; &gt; text")
	})

	o.test("converts newline to <br>", () => {
		o.check(plainTextToHtml("Line1\nLine2")).equals("Line1<br>Line2")
	})

	o.test("handles Windows line endings (\\r\\n)", () => {
		o.check(plainTextToHtml("Line1\r\nLine2")).equals("Line1<br>Line2")
	})

	o.test("handles multiple lines with blank lines", () => {
		o.check(plainTextToHtml("First\n\nThird")).equals("First<br><br>Third")
	})

	o.test("wraps simple blockquote (single '> ') in <blockquote>", () => {
		o.check(plainTextToHtml("> quoted text")).equals("<blockquote>quoted text</blockquote>")
	})

	o.test("handles nested blockquotes (increasing levels)", () => {
		const input = ">> level2\n> level1"
		o.check(plainTextToHtml(input)).equals("<blockquote><blockquote>level2</blockquote>level1</blockquote>")
	})

	o.test("handles decreasing quote levels across lines", () => {
		const input = "> level1\n>> level2\n> level1 again"
		const result = plainTextToHtml(input)
		o.check(result).equals("<blockquote>level1<blockquote>level2</blockquote>level1 again</blockquote>")
	})

	o.test("adds <br> between lines with the same quote level", () => {
		const input = "> line1\n> line2"
		o.check(plainTextToHtml(input)).equals("<blockquote>line1<br>line2</blockquote>")
	})

	o.test("does not add <br> between lines with different quote levels", () => {
		const input = "Normal line\n> quoted line\nAnother normal"
		o.check(plainTextToHtml(input)).equals("Normal line<blockquote>quoted line</blockquote>Another normal")
	})

	o.test("handles empty quoted line (only '> ')", () => {
		const input = "> \n> second"
		o.check(plainTextToHtml(input)).equals("<blockquote><br>second</blockquote>")
	})

	o.test("handles spaces after '>' as part of content", () => {
		o.check(plainTextToHtml(">   indented")).equals("<blockquote>  indented</blockquote>")
	})

	o.test("treats '>' without following space as literal greater‑than, not a quote", () => {
		o.check(plainTextToHtml(">no space")).equals("&gt;no space")
		o.check(plainTextToHtml(">>no space")).equals("&gt;&gt;no space")
	})

	o.test("escapes content inside blockquotes", () => {
		o.check(plainTextToHtml("> <script>alert('XSS')</script>")).equals("<blockquote>&lt;script&gt;alert('XSS')&lt;/script&gt;</blockquote>")
	})

	o.test("handles multiple consecutive lines with increasing then decreasing quote levels", () => {
		const input = "Start\n> level1\n>> level2\n> level1\nEnd"
		o.check(plainTextToHtml(input)).equals("Start<blockquote>level1<blockquote>level2</blockquote>level1</blockquote>End")
	})

	o.test("correctly closes multiple blockquote levels at end of input", () => {
		const input = ">> deep\n> still"
		o.check(plainTextToHtml(input)).equals("<blockquote><blockquote>deep</blockquote>still</blockquote>")
	})

	o.test("handles lines that are just '>' (space only)", () => {
		o.check(plainTextToHtml("> \n> after")).equals("<blockquote><br>after</blockquote>")
	})
})

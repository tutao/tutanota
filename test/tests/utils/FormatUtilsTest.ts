import o from "@tutao/otest"
import { tokenize, urlEncodeHtmlTags } from "../../../src/platform-kit/utils"

o.spec("FormatUtils test", () => {
	o.test("when called with HTML tags they are replaced with HTML entities", function () {
		o.check(urlEncodeHtmlTags(`hi& <tag>content " '</tag>`)).equals("hi&amp; &lt;tag&gt;content &quot; &#039;&lt;/tag&gt;")
	})

	o.test("when called with a string that has control characters they are removed", function () {
		o.check(urlEncodeHtmlTags("ABC\tршيشسبنمت\x08\x7f\x9F")).equals("ABCршيشسبنمت")
	})
})

import o from "@tutao/otest"
import { detectLanguage } from "../../../src/mail/editor/TemplateLanguage.js"
import { LanguageNames } from "../../../src/misc/LanguageViewModel.js"

o.spec("TemplateLanguageTest", function () {
	o("test", function () {
		o(detectLanguage("")).deepEquals(null)

		// email body have a case-insensitive "thank you"
		o(detectLanguage("I was trying to reach you on weekend. Thank you")).deepEquals(LanguageNames.en)

		o(detectLanguage("Danke! hAllo")).deepEquals(LanguageNames.de)

		o(detectLanguage("i am sudip ghimire")).deepEquals(null)
	})
})

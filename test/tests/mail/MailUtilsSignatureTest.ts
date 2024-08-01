import o from "@tutao/otest"
import { EmailSignatureType } from "../../../src/common/api/common/TutanotaConstants.js"
import { mockAttribute, unmockAttribute } from "@tutao/tutanota-test-utils"
import { downcast } from "@tutao/tutanota-utils"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../../src/common/misc/HtmlSanitizer.js"
import type { LoginController } from "../../../src/common/api/main/LoginController.js"
import { appendEmailSignature, prependEmailSignature } from "../../../src/mail-app/mail/signature/Signature.js"
import { LINE_BREAK } from "../../../src/common/mailFunctionality/SharedMailUtils.js"

const TEST_DEFAULT_SIGNATURE = "--\nDefault signature"
o.spec("MailUtilsSignatureTest", function () {
	const mockedAttributes: any[] = []
	o.before(function () {
		mockedAttributes.push(
			mockAttribute(lang, lang.get, function (key, obj) {
				if (key === "defaultEmailSignature_msg") {
					return TEST_DEFAULT_SIGNATURE
				}

				throw new Error("unexpected translation key: " + key)
			}),
		)
		mockedAttributes.push(
			mockAttribute(htmlSanitizer, htmlSanitizer.sanitizeHTML, function (text) {
				return {
					html: text,
					externalContent: [],
					inlineImageCids: [],
					links: [],
				}
			}),
		)
	})
	o.after(function () {
		for (const mockedAttribute of mockedAttributes) {
			unmockAttribute(mockedAttribute)
		}
	})
	o("append - no signature", function () {
		const properties = downcast({
			emailSignatureType: EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE,
			customEmailSignature: "",
		})
		o(appendEmailSignature("", properties)).equals("")
		o(appendEmailSignature("123", properties)).equals("123")
	})
	o("append - default signature", function () {
		const properties = downcast({
			emailSignatureType: EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT,
			customEmailSignature: "abc",
		})
		o(appendEmailSignature("", properties)).equals(LINE_BREAK + LINE_BREAK + TEST_DEFAULT_SIGNATURE)
		o(appendEmailSignature("123", properties)).equals("123" + LINE_BREAK + LINE_BREAK + TEST_DEFAULT_SIGNATURE)
	})
	o("append - custom signature", function () {
		const properties = downcast({
			emailSignatureType: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM,
			customEmailSignature: "abc",
		})
		o(appendEmailSignature("", properties)).equals(LINE_BREAK + "abc")
		o(appendEmailSignature("123", properties)).equals("123" + LINE_BREAK + "abc")
	})
	o("prepend - no signature", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE, "abc", true)
		o(prependEmailSignature("", loginController)).equals("")
		o(prependEmailSignature("123", loginController)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - default signature", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT, "abc", true)
		o(prependEmailSignature("", loginController)).equals(LINE_BREAK + LINE_BREAK + TEST_DEFAULT_SIGNATURE)
		o(prependEmailSignature("123", loginController)).equals(LINE_BREAK + LINE_BREAK + TEST_DEFAULT_SIGNATURE + LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - default signature - do not add signature for external user", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT, "abc", false)
		o(prependEmailSignature("", loginController)).equals("")
		o(prependEmailSignature("123", loginController)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - custom signature", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM, "abc", true)
		o(prependEmailSignature("", loginController)).equals(LINE_BREAK + "abc")
		o(prependEmailSignature("123", loginController)).equals(LINE_BREAK + "abc" + LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - custom signature - do not add signature for external user", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM, "abc", false)
		o(prependEmailSignature("", loginController)).equals("")
		o(prependEmailSignature("123", loginController)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
})

function createLoginController(signatureType: EmailSignatureType, signature: string, internalUser: boolean): LoginController {
	const properties = downcast({
		emailSignatureType: signatureType,
		customEmailSignature: signature,
	})
	const loginController = downcast({
		getUserController() {
			return {
				isInternalUser: () => internalUser,
				props: properties,
			}
		},
	})
	return loginController
}

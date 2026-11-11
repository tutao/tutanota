import o, { mockAttribute, unmockAttribute } from "@tutao/otest"
import { downcast } from "../../../src/platform-kit/utils"
import { lang } from "../../../src/ui/utils/LanguageViewModel.js"
import { getHtmlSanitizer } from "../../../src/applications/common/misc/HtmlSanitizer.js"
import type { LoginController } from "../../../src/applications/common/api/main/LoginController.js"
import {
	appendEmailSignature,
	markSignature,
	prependEmailSignature,
	replaceEmailSignature,
	SignatureContext,
} from "../../../src/applications/mail-app/mail/signature/Signature.js"
import { LINE_BREAK } from "../../../src/applications/common/mailFunctionality/SharedMailUtils.js"

import { EmailSignatureType } from "../../../src/entities/tutanota/Utils"
import { createCustomEmailSignature } from "@tutao/entities/tutanota"

function markedSignature(value: string, name: string = "Custom"): string {
	return markSignature(createCustomEmailSignature({ name, value }))
}

function signature(value: string, name: string = "Custom") {
	return createCustomEmailSignature({ name, value })
}

const TEST_DEFAULT_SIGNATURE = "--\nDefault signature"
o.spec("MailUtilsSignatureTest", function () {
	const mockedAttributes: any[] = []
	o.before(function () {
		const htmlSanitizer = getHtmlSanitizer()
		mockedAttributes.push(
			mockAttribute(lang, lang.get, function (key, obj) {
				if (key === "defaultEmailSignature_msg") {
					return TEST_DEFAULT_SIGNATURE
				}

				if (key === "emailSignatureTypeDefault_msg") {
					return "Default"
				}
				if (key === "emailSignatureTypeCustom_msg") {
					return "Custom"
				}

				throw new Error("unexpected translation key: " + key)
			}),
		)

		// this is cursed, we should refactor to not have to mock global sanitizer
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
			emailSignatureTypeForNewMails: EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE,
			customEmailSignature: "",
		})
		o(appendEmailSignature("", properties, [], SignatureContext.NewMail)).equals("")
		o(appendEmailSignature("123", properties, [], SignatureContext.NewMail)).equals("123")
	})
	o("append - default signature", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT,
			customEmailSignature: "abc",
		})
		o(appendEmailSignature("", properties, [], SignatureContext.NewMail)).equals(
			LINE_BREAK + markedSignature(LINE_BREAK + TEST_DEFAULT_SIGNATURE, "Default"),
		)
		o(appendEmailSignature("123", properties, [], SignatureContext.NewMail)).equals(
			"123" + LINE_BREAK + markedSignature(LINE_BREAK + TEST_DEFAULT_SIGNATURE, "Default"),
		)
	})
	o("append - custom signature", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM,
			customEmailSignature: "abc",
		})
		o(appendEmailSignature("", properties, [], SignatureContext.NewMail)).equals(LINE_BREAK + markedSignature("abc"))
		o(appendEmailSignature("123", properties, [], SignatureContext.NewMail)).equals("123" + LINE_BREAK + markedSignature("abc"))
	})
	o("append - custom signature from list", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM,
			customEmailSignature: "legacy",
			defaultSignatureNameForNewMessages: "second",
		})
		const signatures = downcast([
			{ name: "first", value: "abc" },
			{ name: "second", value: "def" },
		])
		o(appendEmailSignature("123", properties, signatures, SignatureContext.NewMail)).equals("123" + LINE_BREAK + markedSignature("def", "second"))
	})
	o("append and prepend use the setting of their context", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM,
			defaultSignatureNameForNewMessages: "first",
			emailSignatureTypeForRepliesAndForwards: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM,
			defaultSignatureNameForRepliesAndForwards: "second",
			customEmailSignature: "legacy",
		})
		const signatures = downcast([
			{ name: "first", value: "abc" },
			{ name: "second", value: "def" },
		])
		const loginController = downcast({ getUserController: () => ({ isInternalUser: () => true, props: properties }) })
		o(appendEmailSignature("", properties, signatures, SignatureContext.NewMail)).equals(LINE_BREAK + markedSignature("abc", "first"))
		o(appendEmailSignature("", properties, signatures, SignatureContext.ReplyOrForward)).equals(LINE_BREAK + markedSignature("def", "second"))
		o(prependEmailSignature("", loginController, signatures, SignatureContext.ReplyOrForward)).equals(LINE_BREAK + markedSignature("def", "second"))
	})
	o("replace - existing signature", function () {
		const body = "123" + LINE_BREAK + markedSignature("abc")
		o(replaceEmailSignature(body, signature("def"))).equals("123" + LINE_BREAK + markedSignature("def"))
		o(replaceEmailSignature(body, null)).equals("123" + LINE_BREAK)
	})
	o("replace - keep modified existing signature", function () {
		const body = "123" + LINE_BREAK + markedSignature("abc edited", "first")
		o(replaceEmailSignature(body, signature("def", "second"), true)).equals(
			"123" + LINE_BREAK + "<div>abc edited</div>" + LINE_BREAK + markedSignature("def", "second"),
		)
	})
	o("replace - existing signature updates marker name", function () {
		o(replaceEmailSignature(markedSignature("abc", "first"), signature("def", "second"))).equals(markedSignature("def", "second"))
	})
	o("replace - no existing signature", function () {
		o(replaceEmailSignature("123", signature("def"))).equals("123" + LINE_BREAK + markedSignature("def"))
		o(replaceEmailSignature("123", null)).equals("123")
	})
	o("replace - no existing signature with quote", function () {
		const body = '<blockquote class="tutanota_quote">q</blockquote>'
		o(replaceEmailSignature(body, signature("def"))).equals(LINE_BREAK + markedSignature("def") + LINE_BREAK + LINE_BREAK + body)
	})
	o("prepend - no signature", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE, "abc", true)
		o(prependEmailSignature("", loginController, [], SignatureContext.ReplyOrForward)).equals("")
		o(prependEmailSignature("123", loginController, [], SignatureContext.ReplyOrForward)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - default signature", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT, "abc", true)
		o(prependEmailSignature("", loginController, [], SignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature(LINE_BREAK + TEST_DEFAULT_SIGNATURE, "Default"),
		)
		o(prependEmailSignature("123", loginController, [], SignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature(LINE_BREAK + TEST_DEFAULT_SIGNATURE, "Default") + LINE_BREAK + LINE_BREAK + LINE_BREAK + "123",
		)
	})
	o("prepend - default signature - do not add signature for external user", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT, "abc", false)
		o(prependEmailSignature("", loginController, [], SignatureContext.ReplyOrForward)).equals("")
		o(prependEmailSignature("123", loginController, [], SignatureContext.ReplyOrForward)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - custom signature", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM, "abc", true)
		o(prependEmailSignature("", loginController, [], SignatureContext.ReplyOrForward)).equals(LINE_BREAK + markedSignature("abc"))
		o(prependEmailSignature("123", loginController, [], SignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("abc") + LINE_BREAK + LINE_BREAK + LINE_BREAK + "123",
		)
	})
	o("prepend - custom signature - do not add signature for external user", function () {
		const loginController = createLoginController(EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM, "abc", false)
		o(prependEmailSignature("", loginController, [], SignatureContext.ReplyOrForward)).equals("")
		o(prependEmailSignature("123", loginController, [], SignatureContext.ReplyOrForward)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
})

function createLoginController(signatureType: EmailSignatureType, signature: string, internalUser: boolean): LoginController {
	const properties = downcast({
		emailSignatureTypeForNewMails: signatureType,
		emailSignatureTypeForRepliesAndForwards: signatureType,
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

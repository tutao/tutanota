import o, { mockAttribute, unmockAttribute } from "@tutao/otest"
import { downcast } from "../../../src/platform-kit/utils"
import { lang } from "../../../src/ui/utils/LanguageViewModel.js"
import { getHtmlSanitizer } from "../../../src/applications/common/misc/HtmlSanitizer.js"
import type { LoginController } from "../../../src/applications/common/api/main/LoginController.js"
import {
	appendEmailSignature,
	createCompanyEmailSignature,
	EmailSignature,
	EmailSignatureContext,
	markEmailSignature,
	markQuoteInfoLine,
	prependEmailSignature,
	replaceEmailSignature,
} from "../../../src/applications/mail-app/mail/signature/Signature.js"
import { LINE_BREAK } from "../../../src/applications/common/mailFunctionality/SharedMailUtils.js"

import { EmailSignatureType } from "../../../src/entities/tutanota/Utils"

function markedSignature(name: string, value: string, type: EmailSignatureType): string {
	return markEmailSignature(signature(name, value, type))
}

function signature(name: string, value: string, type: EmailSignatureType, id: IdTuple | null = null): EmailSignature {
	return { name, value, type, id }
}

const FIRST_ID: IdTuple = ["list", "first"]
const SECOND_ID: IdTuple = ["list", "second"]

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

				if (key === "companySignature_label") {
					return "Company Signature"
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
			emailSignatureTypeForNewMails: EmailSignatureType.NONE,
			customEmailSignature: "",
		})
		o(appendEmailSignature("", properties, [], EmailSignatureContext.NewMail)).equals("")
		o(appendEmailSignature("123", properties, [], EmailSignatureContext.NewMail)).equals("123")
	})
	o("append - default signature", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.DEFAULT,
			customEmailSignature: "abc",
		})
		o(appendEmailSignature("", properties, [], EmailSignatureContext.NewMail)).equals(
			LINE_BREAK + markedSignature("Default", LINE_BREAK + TEST_DEFAULT_SIGNATURE, EmailSignatureType.DEFAULT),
		)
		o(appendEmailSignature("123", properties, [], EmailSignatureContext.NewMail)).equals(
			"123" + LINE_BREAK + markedSignature("Default", LINE_BREAK + TEST_DEFAULT_SIGNATURE, EmailSignatureType.DEFAULT),
		)
	})
	o("append - custom signature", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.CUSTOM,
			defaultCustomEmailSignatureForNewMessages: FIRST_ID,
		})
		const signatures = [signature("Custom", "abc", EmailSignatureType.CUSTOM, FIRST_ID)]
		o(appendEmailSignature("", properties, signatures, EmailSignatureContext.NewMail)).equals(
			LINE_BREAK + markedSignature("Custom", "abc", EmailSignatureType.CUSTOM),
		)
		o(appendEmailSignature("123", properties, signatures, EmailSignatureContext.NewMail)).equals(
			"123" + LINE_BREAK + markedSignature("Custom", "abc", EmailSignatureType.CUSTOM),
		)
	})
	o("append - custom signature from list", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.CUSTOM,
			defaultCustomEmailSignatureForNewMessages: SECOND_ID,
		})
		const signatures = [signature("first", "abc", EmailSignatureType.CUSTOM, FIRST_ID), signature("second", "def", EmailSignatureType.CUSTOM, SECOND_ID)]
		o(appendEmailSignature("123", properties, signatures, EmailSignatureContext.NewMail)).equals(
			"123" + LINE_BREAK + markedSignature("second", "def", EmailSignatureType.CUSTOM),
		)
	})
	o("append and prepend use the setting of their context", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.CUSTOM,
			defaultCustomEmailSignatureForNewMessages: FIRST_ID,
			emailSignatureTypeForRepliesAndForwards: EmailSignatureType.CUSTOM,
			defaultCustomEmailSignatureForRepliesAndForwards: SECOND_ID,
		})
		const signatures = [signature("first", "abc", EmailSignatureType.CUSTOM, FIRST_ID), signature("second", "def", EmailSignatureType.CUSTOM, SECOND_ID)]
		const loginController = downcast({ getUserController: () => ({ isInternalUser: () => true, props: properties }) })
		o(appendEmailSignature("", properties, signatures, EmailSignatureContext.NewMail)).equals(
			LINE_BREAK + markedSignature("first", "abc", EmailSignatureType.CUSTOM),
		)
		o(appendEmailSignature("", properties, signatures, EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("second", "def", EmailSignatureType.CUSTOM),
		)
		o(prependEmailSignature("", loginController, signatures, EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("second", "def", EmailSignatureType.CUSTOM),
		)
	})
	o("company signature is used for the type COMPANY", function () {
		const properties = downcast({
			emailSignatureTypeForNewMails: EmailSignatureType.COMPANY,
			emailSignatureTypeForRepliesAndForwards: EmailSignatureType.COMPANY,
		})
		const loginController = downcast({ getUserController: () => ({ isInternalUser: () => true, props: properties }) })
		const companyEmailSignature = createCompanyEmailSignature("company")
		o(appendEmailSignature("", properties, [companyEmailSignature], EmailSignatureContext.NewMail)).equals(
			LINE_BREAK + markedSignature("Company Signature", "company", EmailSignatureType.COMPANY),
		)
		o(prependEmailSignature("", loginController, [companyEmailSignature], EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("Company Signature", "company", EmailSignatureType.COMPANY),
		)
	})
	o("company signature is not used for other types", function () {
		const properties = downcast({ emailSignatureTypeForNewMails: EmailSignatureType.NONE })
		o(appendEmailSignature("", properties, [createCompanyEmailSignature("company")], EmailSignatureContext.NewMail)).equals("")
	})
	o("replace - existing signature", function () {
		const body = "123" + LINE_BREAK + markedSignature("Custom", "abc", EmailSignatureType.CUSTOM)
		o(replaceEmailSignature(body, signature("Custom", "def", EmailSignatureType.CUSTOM))).equals(
			"123" + LINE_BREAK + markedSignature("Custom", "def", EmailSignatureType.CUSTOM),
		)
		o(replaceEmailSignature(body, null)).equals("123" + LINE_BREAK)
	})
	o("replace - keep modified existing signature", function () {
		const body = "123" + LINE_BREAK + markedSignature("first", "abc edited", EmailSignatureType.CUSTOM)
		o(replaceEmailSignature(body, signature("second", "def", EmailSignatureType.CUSTOM), true)).equals(
			"123" + LINE_BREAK + "<div>abc edited</div>" + LINE_BREAK + markedSignature("second", "def", EmailSignatureType.CUSTOM),
		)
	})
	o("replace - existing signature updates marker name", function () {
		o(replaceEmailSignature(markedSignature("first", "abc", EmailSignatureType.CUSTOM), signature("second", "def", EmailSignatureType.COMPANY))).equals(
			markedSignature("second", "def", EmailSignatureType.CUSTOM),
		)
	})
	o("replace - no existing signature", function () {
		o(replaceEmailSignature("123", signature("Custom", "def", EmailSignatureType.CUSTOM))).equals(
			"123" + LINE_BREAK + markedSignature("Custom", "def", EmailSignatureType.CUSTOM),
		)
		o(replaceEmailSignature("123", null)).equals("123")
	})
	o("replace - no existing signature in a reply is placed between the new message and the quoted mail", function () {
		const quote = markQuoteInfoLine("date by sender:") + '<blockquote class="tutanota_quote">q</blockquote>'
		const signatureHtml = markedSignature("Custom", "def", EmailSignatureType.CUSTOM)
		o(replaceEmailSignature("new message<br>" + quote, signature("Custom", "def", EmailSignatureType.CUSTOM))).equals(
			"new message<br>" + LINE_BREAK + signatureHtml + LINE_BREAK + LINE_BREAK + quote,
		)
	})
	o("replace - no existing signature in a reply without a new message", function () {
		const quote = markQuoteInfoLine("date by sender:") + '<blockquote class="tutanota_quote">q</blockquote>'
		o(replaceEmailSignature(quote, signature("Custom", "def", EmailSignatureType.CUSTOM))).equals(
			LINE_BREAK + markedSignature("Custom", "def", EmailSignatureType.CUSTOM) + LINE_BREAK + LINE_BREAK + quote,
		)
	})
	o("prepend - no signature", function () {
		const loginController = createLoginController(EmailSignatureType.NONE, "abc", true)
		o(prependEmailSignature("", loginController, [], EmailSignatureContext.ReplyOrForward)).equals("")
		o(prependEmailSignature("123", loginController, [], EmailSignatureContext.ReplyOrForward)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - default signature", function () {
		const loginController = createLoginController(EmailSignatureType.DEFAULT, "abc", true)
		o(prependEmailSignature("", loginController, [], EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("Default", LINE_BREAK + TEST_DEFAULT_SIGNATURE, EmailSignatureType.DEFAULT),
		)
		o(prependEmailSignature("123", loginController, [], EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK +
				markedSignature("Default", LINE_BREAK + TEST_DEFAULT_SIGNATURE, EmailSignatureType.DEFAULT) +
				LINE_BREAK +
				LINE_BREAK +
				LINE_BREAK +
				"123",
		)
	})
	o("prepend - default signature - do not add signature for external user", function () {
		const loginController = createLoginController(EmailSignatureType.DEFAULT, "abc", false)
		o(prependEmailSignature("", loginController, [], EmailSignatureContext.ReplyOrForward)).equals("")
		o(prependEmailSignature("123", loginController, [], EmailSignatureContext.ReplyOrForward)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
	o("prepend - custom signature", function () {
		const loginController = createLoginController(EmailSignatureType.CUSTOM, "abc", true)
		const signatures = [signature("Custom", "abc", EmailSignatureType.CUSTOM, FIRST_ID)]
		o(prependEmailSignature("", loginController, signatures, EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("Custom", "abc", EmailSignatureType.CUSTOM),
		)
		o(prependEmailSignature("123", loginController, signatures, EmailSignatureContext.ReplyOrForward)).equals(
			LINE_BREAK + markedSignature("Custom", "abc", EmailSignatureType.CUSTOM) + LINE_BREAK + LINE_BREAK + LINE_BREAK + "123",
		)
	})
	o("prepend - custom signature - do not add signature for external user", function () {
		const loginController = createLoginController(EmailSignatureType.CUSTOM, "abc", false)
		o(prependEmailSignature("", loginController, [], EmailSignatureContext.ReplyOrForward)).equals("")
		o(prependEmailSignature("123", loginController, [], EmailSignatureContext.ReplyOrForward)).equals(LINE_BREAK + LINE_BREAK + LINE_BREAK + "123")
	})
})

function createLoginController(signatureType: EmailSignatureType, signature: string, internalUser: boolean): LoginController {
	const properties = downcast({
		emailSignatureTypeForNewMails: signatureType,
		emailSignatureTypeForRepliesAndForwards: signatureType,
		defaultCustomEmailSignatureForNewMessages: FIRST_ID,
		defaultCustomEmailSignatureForRepliesAndForwards: FIRST_ID,
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

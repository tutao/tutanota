import { InfoLink, lang } from "../../../../ui/utils/LanguageViewModel"
import { getHtmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import type { UserController } from "../../../common/api/main/UserController"
import type { LoginController } from "../../../common/api/main/LoginController"
import { EnvProvider } from "../../../../platform-kit/app-env"
import { LINE_BREAK } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { CustomEmailSignatureTypeRef, TutanotaProperties } from "@tutao/entities/tutanota"
import { loadCompanyEmailSignatureHtml } from "./CompanyEmailSignature"
import type { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { EmailSignatureType } from "../../../../entities/tutanota/Utils"
import { isSameId } from "@tutao/meta"
import { isDarkTheme } from "../../../../ui/theme"
import { applyDarkThemeFix } from "../view/MailGuiUtils"

EnvProvider.assertMainOrNode()

export const EMAIL_SIGNATURE_MARKER_ATTRIBUTE = "data-tuta-email-signature"
const QUOTE_INFO_LINE_MARKER_ATTRIBUTE = "data-tuta-quote-info-line"

export const enum EmailSignatureContext {
	NewMail = "NewMail",
	ReplyOrForward = "ReplyOrForward",
}

export type EmailSignatureSetting = {
	type: EmailSignatureType
	id: IdTuple | null // non-null for custom signatures
}

export type EmailSignature = {
	type: EmailSignatureType
	id: IdTuple | null // non-null for custom signatures
	name: string
	value: string
}

export function getSignatureSetting(props: TutanotaProperties, context: EmailSignatureContext): EmailSignatureSetting {
	const newMailSetting = {
		type: props.emailSignatureTypeForNewMails as EmailSignatureType,
		id: props.defaultCustomEmailSignatureForNewMessages,
	}
	const repliesAndForwardSetting = {
		type: (props.emailSignatureTypeForRepliesAndForwards ?? props.emailSignatureTypeForNewMails) as EmailSignatureType,
		id: props.defaultCustomEmailSignatureForRepliesAndForwards,
	}
	return context === EmailSignatureContext.NewMail ? newMailSetting : repliesAndForwardSetting
}

export function setSignatureSetting(props: TutanotaProperties, context: EmailSignatureContext, setting: EmailSignatureSetting) {
	if (context === EmailSignatureContext.NewMail) {
		props.emailSignatureTypeForNewMails = setting.type
		props.defaultCustomEmailSignatureForNewMessages = setting.id ?? null
	} else {
		props.emailSignatureTypeForRepliesAndForwards = setting.type
		props.defaultCustomEmailSignatureForRepliesAndForwards = setting.id ?? null
	}
}

export function getDefaultEmailSignature(): EmailSignature {
	return {
		name: lang.getTranslation("emailSignatureTypeDefault_msg").text,
		value:
			// add one line break to the default signature to add one empty line between signature and body
			LINE_BREAK +
			getHtmlSanitizer().sanitizeHTML(
				lang.getTranslation("defaultEmailSignature_msg", {
					"{1}": `<a href=${InfoLink.HomePageFreeSignup}>${InfoLink.HomePageFreeSignup}</a>`,
				}).text,
			).html,
		type: EmailSignatureType.DEFAULT,
		id: null,
	}
}

export function isCompanyEmailSignature(signature: EmailSignature): boolean {
	return signature.type === EmailSignatureType.COMPANY
}

export function createCompanyEmailSignature(html: string): EmailSignature {
	return { name: lang.getTranslationText("companySignature_label"), value: html, type: EmailSignatureType.COMPANY, id: null }
}

export async function loadCustomEmailSignatures(entityClient: EntityClient, userController: UserController): Promise<EmailSignature[]> {
	const properties = userController.props
	const companyEmailSignatureHtml = await loadCompanyEmailSignatureHtml(entityClient, userController.user).catch((e) => {
		console.warn("could not load company signature", e)
		return null
	})
	const companyEmailSignature = companyEmailSignatureHtml != null ? [createCompanyEmailSignature(companyEmailSignatureHtml)] : []
	if (properties.customEmailSignatures == null) {
		return companyEmailSignature
	}
	const customEmailSignatures = await entityClient.loadAll(CustomEmailSignatureTypeRef, properties.customEmailSignatures)
	return customEmailSignatures
		.map((customSignature): EmailSignature => {
			return {
				name: customSignature.name,
				value: customSignature.value,
				type: EmailSignatureType.CUSTOM,
				id: customSignature._id,
			}
		})
		.concat(companyEmailSignature)
}

function getEmailSignatureBySetting(
	tutanotaProperties: TutanotaProperties,
	customEmailSignatures: readonly EmailSignature[],
	context: EmailSignatureContext,
): EmailSignature | null {
	const { type, id } = getSignatureSetting(tutanotaProperties, context)

	if (type === EmailSignatureType.COMPANY) {
		return customEmailSignatures.find(isCompanyEmailSignature) ?? null
	} else if (type === EmailSignatureType.DEFAULT) {
		return getDefaultEmailSignature()
	} else if (type === EmailSignatureType.CUSTOM) {
		return id != null ? (customEmailSignatures.find((signature) => signature.id && isSameId(signature.id, id)) ?? null) : null
	} else {
		return null
	}
}

export function markEmailSignature(signature: EmailSignature): string {
	const div = document.createElement("div")
	div.setAttribute(EMAIL_SIGNATURE_MARKER_ATTRIBUTE, signature.name)
	div.innerHTML = signature.value
	return div.outerHTML
}

export function markQuoteInfoLine(infoHtml: string): string {
	return `<div ${QUOTE_INFO_LINE_MARKER_ATTRIBUTE}="true">${infoHtml}</div>`
}

export function appendEmailSignature(
	body: string,
	properties: TutanotaProperties,
	emailSignatures: readonly EmailSignature[],
	context: EmailSignatureContext,
): string {
	const signature = getEmailSignatureBySetting(properties, emailSignatures, context)

	if (signature) {
		// ensure that signature is on the next line
		return body + LINE_BREAK + markEmailSignature(signature)
	} else {
		return body
	}
}

export function getAppliedSignatureElement(root: ParentNode): Element | null {
	return root.querySelector(`[${EMAIL_SIGNATURE_MARKER_ATTRIBUTE}]`)
}

export function getSelectedEmailSignatureName(body: string): string | null {
	const template = document.createElement("template")
	template.innerHTML = body

	return getAppliedSignatureElement(template.content)?.getAttribute(EMAIL_SIGNATURE_MARKER_ATTRIBUTE) ?? null
}

export function replaceEmailSignature(body: string, signature: EmailSignature | null, keepExistingContent: boolean = false): string {
	const template = document.createElement("template")
	template.innerHTML = body
	const existing = template.content.querySelectorAll(`[${EMAIL_SIGNATURE_MARKER_ATTRIBUTE}]`)
	if (existing.length > 0) {
		const [first, ...rest] = Array.from(existing)
		for (const element of rest) {
			element.remove()
		}
		if (!signature) {
			first.remove()
		} else if (keepExistingContent) {
			first.removeAttribute(EMAIL_SIGNATURE_MARKER_ATTRIBUTE)
			first.insertAdjacentHTML("afterend", LINE_BREAK + markEmailSignature(signature))
		} else {
			first.setAttribute(EMAIL_SIGNATURE_MARKER_ATTRIBUTE, signature.name)
			first.innerHTML = signature.value
		}
		return template.innerHTML
	}

	if (!signature) {
		return body
	}
	// the signature should be between the new message and the quoted mail of a reply or forward
	const quoteInfo = template.content.querySelector(`[${QUOTE_INFO_LINE_MARKER_ATTRIBUTE}]`)
	if (quoteInfo) {
		quoteInfo.insertAdjacentHTML("beforebegin", LINE_BREAK + markEmailSignature(signature) + LINE_BREAK + LINE_BREAK)
		return template.innerHTML
	}
	return body + LINE_BREAK + markEmailSignature(signature)
}

export function prependEmailSignature(
	body: string,
	logins: LoginController,
	customEmailSignatures: readonly EmailSignature[],
	context: EmailSignatureContext,
): string {
	// add space between signature and existing body
	let bodyWithSignature = ""
	let signature = getEmailSignatureBySetting(logins.getUserController().props, customEmailSignatures, context)

	if (body) {
		bodyWithSignature = LINE_BREAK + LINE_BREAK + LINE_BREAK + body
	}

	if (logins.getUserController().isInternalUser() && signature) {
		// ensure that signature is on the next line
		bodyWithSignature = LINE_BREAK + markEmailSignature(signature) + bodyWithSignature
	}

	return bodyWithSignature
}

export function getSignaturePreviewHtml(sanitizedSignatureHtml: string): string {
	if (!isDarkTheme()) {
		return sanitizedSignatureHtml
	}
	const template = document.createElement("template")
	template.innerHTML = sanitizedSignatureHtml
	const container = document.createElement("div")
	container.appendChild(applyDarkThemeFix(template.content))
	return container.innerHTML
}

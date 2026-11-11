import { InfoLink, lang } from "../../../../ui/utils/LanguageViewModel"
import { getHtmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import type { LoginController } from "../../../common/api/main/LoginController"
import { EnvProvider } from "../../../../platform-kit/app-env"
import { LINE_BREAK } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { createCustomEmailSignature, CustomEmailSignature, CustomEmailSignatureTypeRef, TutanotaProperties } from "@tutao/entities/tutanota"
import type { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { EmailSignatureType } from "../../../../entities/tutanota/Utils"

import { getSignatureSetting } from "../../settings/EditSignatureDialog"

EnvProvider.assertMainOrNode()

export const SIGNATURE_MARKER_ATTRIBUTE = "data-tuta-signature"

export const enum SignatureContext {
	NewMail,
	ReplyOrForward,
}

export type SignatureSetting = {
	type: EmailSignatureType
	name: string | null // non-null for custom signatures
}

export function getDefaultSignature(): string {
	// add one line break to the default signature to add one empty line between signature and body
	return (
		LINE_BREAK +
		getHtmlSanitizer().sanitizeHTML(
			lang.get("defaultEmailSignature_msg", {
				"{1}": `<a href=${InfoLink.HomePageFreeSignup}>${InfoLink.HomePageFreeSignup}</a>`,
			}),
		).html
	)
}

export async function loadCustomEmailSignatures(entityClient: EntityClient, properties: TutanotaProperties): Promise<CustomEmailSignature[]> {
	if (properties.customEmailSignatures == null) {
		return []
	}
	return await entityClient.loadAll(CustomEmailSignatureTypeRef, properties.customEmailSignatures)
}

function getEmailSignature(
	tutanotaProperties: TutanotaProperties,
	customEmailSignatures: readonly CustomEmailSignature[],
	context: SignatureContext,
): CustomEmailSignature | null {
	const { type, name } = getSignatureSetting(tutanotaProperties, context)

	if (type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		return createCustomEmailSignature({ name: lang.getTranslation("emailSignatureTypeDefault_msg").text, value: getDefaultSignature() })
	} else if (type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
		return name != null ? (customEmailSignatures.find((signature) => signature.name === name) ?? null) : null
	} else {
		return null
	}
}

export function markSignature(signature: CustomEmailSignature): string {
	const div = document.createElement("div")
	div.setAttribute(SIGNATURE_MARKER_ATTRIBUTE, signature.name)
	div.innerHTML = signature.value
	return div.outerHTML
}

export function appendEmailSignature(
	body: string,
	properties: TutanotaProperties,
	customEmailSignatures: readonly CustomEmailSignature[],
	context: SignatureContext,
): string {
	const signature = getEmailSignature(properties, customEmailSignatures, context)

	if (signature) {
		// ensure that signature is on the next line
		return body + LINE_BREAK + markSignature(signature)
	} else {
		return body
	}
}

export function getAppliedSignatureElement(root: ParentNode): Element | null {
	return root.querySelector(`[${SIGNATURE_MARKER_ATTRIBUTE}]`)
}

export function getSelectedEmailSignatureName(body: string): string | null {
	const template = document.createElement("template")
	template.innerHTML = body

	return getAppliedSignatureElement(template.content)?.getAttribute(SIGNATURE_MARKER_ATTRIBUTE) ?? null
}

export function replaceEmailSignature(body: string, signature: CustomEmailSignature | null, keepExistingContent: boolean = false): string {
	const template = document.createElement("template")
	template.innerHTML = body
	const existing = template.content.querySelectorAll(`[${SIGNATURE_MARKER_ATTRIBUTE}]`)
	if (existing.length > 0) {
		const [first, ...rest] = Array.from(existing)
		rest.forEach((element) => element.remove())
		if (!signature) {
			first.remove()
		} else if (keepExistingContent) {
			first.removeAttribute(SIGNATURE_MARKER_ATTRIBUTE)
			first.insertAdjacentHTML("afterend", LINE_BREAK + markSignature(signature))
		} else {
			first.setAttribute(SIGNATURE_MARKER_ATTRIBUTE, signature.name)
			first.innerHTML = signature.value
		}
		return template.innerHTML
	}

	if (!signature) {
		return body
	}
	if (template.content.querySelector("blockquote.tutanota_quote") != null) {
		return LINE_BREAK + markSignature(signature) + LINE_BREAK + LINE_BREAK + body
	}
	return body + LINE_BREAK + markSignature(signature)
}

export function prependEmailSignature(
	body: string,
	logins: LoginController,
	customEmailSignatures: readonly CustomEmailSignature[],
	context: SignatureContext,
): string {
	// add space between signature and existing body
	let bodyWithSignature = ""
	let signature = getEmailSignature(logins.getUserController().props, customEmailSignatures, context)

	if (body) {
		bodyWithSignature = LINE_BREAK + LINE_BREAK + LINE_BREAK + body
	}

	if (logins.getUserController().isInternalUser() && signature) {
		// ensure that signature is on the next line
		bodyWithSignature = LINE_BREAK + markSignature(signature) + bodyWithSignature
	}

	return bodyWithSignature
}

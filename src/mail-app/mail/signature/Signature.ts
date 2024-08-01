import { InfoLink, lang } from "../../../common/misc/LanguageViewModel"
import type { TutanotaProperties } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { EmailSignatureType as TutanotaConstants } from "../../../common/api/common/TutanotaConstants"
import { htmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import type { LoginController } from "../../../common/api/main/LoginController"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { LINE_BREAK } from "../../../common/mailFunctionality/SharedMailUtils.js"

assertMainOrNode()

export function getDefaultSignature(): string {
	// add one line break to the default signature to add one empty line between signature and body
	return (
		LINE_BREAK +
		htmlSanitizer.sanitizeHTML(
			lang.get("defaultEmailSignature_msg", {
				"{1}": InfoLink.HomePage,
			}),
		).html
	)
}

export function getEmailSignature(tutanotaProperties: TutanotaProperties): string {
	// provide the user signature, even for shared mail groups
	const type = tutanotaProperties.emailSignatureType

	if (type === TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		return getDefaultSignature()
	} else if (TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM === type) {
		return tutanotaProperties.customEmailSignature
	} else {
		return ""
	}
}

export function appendEmailSignature(body: string, properties: TutanotaProperties): string {
	const signature = getEmailSignature(properties)

	if (signature) {
		// ensure that signature is on the next line
		return body + LINE_BREAK + signature
	} else {
		return body
	}
}

export function prependEmailSignature(body: string, logins: LoginController): string {
	// add space between signature and existing body
	let bodyWithSignature = ""
	let signature = getEmailSignature(logins.getUserController().props)

	if (body) {
		bodyWithSignature = LINE_BREAK + LINE_BREAK + LINE_BREAK + body
	}

	if (logins.getUserController().isInternalUser() && signature) {
		// ensure that signature is on the next line
		bodyWithSignature = LINE_BREAK + signature + bodyWithSignature
	}

	return bodyWithSignature
}

import { htmlSanitizer } from "../../misc/HtmlSanitizer"
import QRCode from "qrcode-svg"
import { KeyVerificationQrPayload } from "./KeyVerificationQrPayload"
import { PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"

export function renderFingerprintAsText(fingerprint: PublicKeyFingerprint): string {
	return fingerprint.fingerprint
}

export function renderFingerprintAsQrCode(selfMailAddress: string, selfFingerprint: PublicKeyFingerprint): string {
	const payload: KeyVerificationQrPayload = { mailAddress: selfMailAddress, fingerprint: selfFingerprint.fingerprint }

	const qrCode = new QRCode({
		height: 180,
		width: 180,
		content: JSON.stringify(payload),
		padding: 0,
		xmlDeclaration: false,
	})

	return htmlSanitizer.sanitizeSVG(qrCode.svg()).html
}

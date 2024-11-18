import { htmlSanitizer } from "../../misc/HtmlSanitizer"
import QRCode from "qrcode-svg"
import { KeyVerificationQrPayload } from "./KeyVerificationQrPayload"

export function renderFingerprintAsText(fingerprint: string): string {
	return fingerprint
}

export function renderFingerprintAsQrCode(selfMailAddress: string, selfFingerprint: string): string {
	const payload: KeyVerificationQrPayload = { mailAddress: selfMailAddress, fingerprint: selfFingerprint }

	const qrCode = new QRCode({
		height: 150,
		width: 150,
		content: JSON.stringify(payload),
		padding: 0,
		xmlDeclaration: false,
	})

	return htmlSanitizer.sanitizeSVG(qrCode.svg()).html
}

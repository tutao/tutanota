import { htmlSanitizer } from "../../misc/HtmlSanitizer"
import QRCode from "qrcode-svg"

export function renderFingerprintAsText(fingerprint: string): string {
	return fingerprint
}

export function renderFingerprintAsQrCode(fingerprint: string): string {
	const qrCode = new QRCode({
		height: 150,
		width: 150,
		content: fingerprint,
		padding: 0,
		xmlDeclaration: false,
	})

	return htmlSanitizer.sanitizeSVG(qrCode.svg()).html
}
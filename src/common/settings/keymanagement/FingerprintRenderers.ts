import { getHtmlSanitizer } from "../../misc/HtmlSanitizer"
import QRCode from "qrcode-svg"
import { KeyVerificationQrPayload } from "./KeyVerificationQrPayload"
import { Hex } from "@tutao/tutanota-utils"

export function renderFingerprintAsQrCode(selfMailAddress: string, fingerprint: Hex): string {
	const payload: KeyVerificationQrPayload = { mailAddress: selfMailAddress, fingerprint }

	const qrCode = new QRCode({
		height: 180,
		width: 180,
		content: JSON.stringify(payload),
		padding: 0,
		xmlDeclaration: false,
	})

	return getHtmlSanitizer().sanitizeSVG(qrCode.svg()).html
}

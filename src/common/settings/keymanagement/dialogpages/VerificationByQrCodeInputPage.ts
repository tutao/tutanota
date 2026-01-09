import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationModel } from "../KeyVerificationModel"
import type { QRCode } from "jsqr"
import { IdentityKeyQrVerificationResult, IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"
import { TitleSection } from "../../../gui/TitleSection"
import { QrCodeScanner, QrCodeScannerErrorType } from "../../../gui/QrCodeScanner"

export type QrCodePageErrorType = "camera_permission_denied" | "malformed_qr" | "email_not_found" | "camera_not_found" | "video_source_error" | "unknown"

export type GoToErrorPageHandler = (et: QrCodePageErrorType) => void

type VerificationByQrCodePageAttrs = {
	model: KeyVerificationModel
	goToSuccessPage: () => void
	goToErrorPage: GoToErrorPageHandler
	goToMismatchPage: () => void
}

export class VerificationByQrCodeInputPage implements Component<VerificationByQrCodePageAttrs> {
	view(vnode: Vnode<VerificationByQrCodePageAttrs>): Children {
		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title: lang.get("keyManagement.qrVerification_label"),
				subTitle: lang.get("keyManagement.verificationByQrCodeScan_label"),
			}),
			m(QrCodeScanner, {
				onScan: (code) => this.handleQrCodeScan(vnode.attrs, code),
				onError: (errorType) => this.handleScannerError(vnode.attrs, errorType),
				requestCameraPermission: () => vnode.attrs.model.requestCameraPermission(),
			}),
		])
	}

	private async handleQrCodeScan(attrs: VerificationByQrCodePageAttrs, code: QRCode) {
		const verificationResult = await attrs.model.validateQrCodeAddress(code)
		if (verificationResult === IdentityKeyQrVerificationResult.QR_OK) {
			await attrs.model.trust(IdentityKeyVerificationMethod.qr)
			attrs.goToSuccessPage()
		} else {
			if (verificationResult === IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH) {
				attrs.goToMismatchPage()
			} else {
				attrs.goToErrorPage(this.resultToErrorType(verificationResult))
			}
		}
	}

	private handleScannerError(attrs: VerificationByQrCodePageAttrs, errorType: QrCodeScannerErrorType) {
		attrs.goToErrorPage(errorType)
		m.redraw()
	}

	resultToErrorType(kr: IdentityKeyQrVerificationResult | undefined): QrCodePageErrorType {
		switch (kr) {
			case IdentityKeyQrVerificationResult.QR_MAIL_ADDRESS_NOT_FOUND: {
				return "email_not_found"
			}
			case IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD: {
				return "malformed_qr"
			}
		}
		return "unknown"
	}
}

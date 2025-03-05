import m, { Component, Vnode } from "mithril"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { theme } from "../../../gui/theme"
import { QrCodePageErrorType } from "./VerificationByQrCodeInputPage"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"

type VerificationErrorPageAttrs = {
	model: KeyVerificationModel
	error: QrCodePageErrorType | null
	retryAction: () => void
}

export class VerificationErrorPage implements Component<VerificationErrorPageAttrs> {
	view(vnode: Vnode<VerificationErrorPageAttrs>) {
		let title = lang.get("keyManagement.unknownError_title")
		let subTitle = lang.get("keyManagement.cameraNotFound_title")

		switch (vnode.attrs.error) {
			case "camera_not_found": {
				title = lang.get("keyManagement.cameraNotFound_title")
				subTitle = lang.get("keyManagement.cameraNotFound_msg")
				break
			}
			case "camera_permission_denied": {
				title = lang.get("keyManagement.cameraPermissionDenied_title")
				subTitle = lang.get("keyManagement.cameraPermissionDenied_msg")
				break
			}
			case "email_not_found": {
				title = lang.get("keyManagement.qrMailAddressNotFound_title")
				subTitle = lang.get("keyManagement.qrMailAddressNotFound_msg")
				break
			}
			case "malformed_qr": {
				title = lang.get("keyManagement.qrCodeInvalid_title")
				subTitle = lang.get("keyManagement.qrCodeInvalid_msg")
				break
			}
			case "qr_code_mistmatch": {
				title = lang.get("keyManagement.qrFingerprintMismatch_title")
				subTitle = lang.get("keyManagement.qrFingerprintMismatch_msg")
				break
			}
			case "video_source_error": {
				title = lang.get("keyManagement.verificationErrorTitle_label")
				subTitle = lang.get("keyManagement.videoSourceError_msg")
				break
			}
			default: {
				break
			}
		}

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle,
				icon: Icons.AlertCircle,
				iconOptions: { color: theme.error_color },
			}),
			m(LoginButton, {
				label: "retry_action",
				onclick: async () => {
					// we're treating this like a fresh usage test invocation
					await vnode.attrs.model.test.start(KeyVerificationMethodType.qr)

					vnode.attrs.retryAction()
				},
			}),
		])
	}
}

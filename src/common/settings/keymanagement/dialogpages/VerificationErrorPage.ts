import m, { Component, Vnode } from "mithril"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { theme } from "../../../gui/theme"
import { QrCodePageErrorType } from "./VerificationByQrCodeInputPage"
import { IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"

type VerificationErrorPageAttrs = {
	model: KeyVerificationModel
	error: QrCodePageErrorType | null
	retryAction: () => void
}

export class VerificationErrorPage implements Component<VerificationErrorPageAttrs> {
	view(vnode: Vnode<VerificationErrorPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let subTitle = lang.get("unknownError_msg")

		switch (vnode.attrs.error) {
			case "camera_not_found": {
				subTitle = lang.get("keyManagement.cameraNotFound_msg")
				break
			}
			case "camera_permission_denied": {
				subTitle = lang.get("keyManagement.cameraPermissionNeeded_msg")
				break
			}
			case "email_not_found": {
				subTitle = lang.get("keyManagement.qrMailAddressNotFound_msg")
				break
			}
			case "malformed_qr": {
				subTitle = lang.get("keyManagement.qrCodeInvalid_msg")
				break
			}
			case "video_source_error": {
				subTitle = lang.get("keyManagement.videoSourceError_msg")
				break
			}
			default: {
				break
			}
		}

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle,
				icon: Icons.CloseCircleOutline,
				iconOptions: { color: theme.error },
			}),
			m(LoginButton, {
				label: "retry_action",
				onclick: async () => {
					// we're treating this like a fresh usage test invocation
					await vnode.attrs.model.handleMethodSwitch(IdentityKeyVerificationMethod.qr)
					vnode.attrs.retryAction()
				},
			}),
		])
	}
}

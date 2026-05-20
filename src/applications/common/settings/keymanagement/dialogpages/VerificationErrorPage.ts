import m, { Component, Vnode } from "mithril"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { TitleSection } from "../../../../../ui/TitleSection"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { PrimaryButton } from "../../../../../ui/base/buttons/VariantButtons.js"
import { theme } from "../../../../../ui/theme"
import { QrCodePageErrorType } from "./VerificationByQrCodeInputPage"
import { IdentityKeyVerificationMethod } from "../../../../../platform-kit/app-env"

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
				icon: Icons.FailureOutline,
				iconOptions: { color: theme.error },
			}),
			m(PrimaryButton, {
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

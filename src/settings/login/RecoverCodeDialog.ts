import { InfoLink, lang } from "../../misc/LanguageViewModel.js"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import type { Hex } from "@tutao/tutanota-utils"
import { neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import m, { Children, Vnode } from "mithril"
import { assertMainOrNode, isApp } from "../../api/common/Env.js"
import { copyToClipboard } from "../../misc/ClipboardUtils.js"
import { Button } from "../../gui/base/Button.js"
import { AccessBlockedError, NotAuthenticatedError } from "../../api/common/error/RestError.js"
import { locator } from "../../api/main/MainLocator.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { User } from "../../api/entities/sys/TypeRefs.js"
import { getEtId, isSameId } from "../../api/common/utils/EntityUtils.js"
import { logins } from "../../api/main/LoginController.js"
import { GroupType } from "../../api/common/TutanotaConstants.js"

type Action = "get" | "create"
assertMainOrNode()

export function showRecoverCodeDialogAfterPasswordVerificationAndInfoDialog(user: User) {
	// We only show the recovery code if it is for the current user and it is a global admin
	if (!isSameId(getEtId(logins.getUserController().user), getEtId(user)) || !user.memberships.find((gm) => gm.groupType === GroupType.Admin)) {
		return
	}

	const isRecoverCodeAvailable = user.auth && user.auth.recoverCode != null
	Dialog.showActionDialog({
		title: lang.get("recoveryCode_label"),
		type: DialogType.EditMedium,
		child: () => m(".pt", lang.get("recoveryCode_msg")),
		allowOkWithReturn: true,
		okAction: (dialog: Dialog) => {
			dialog.close()
			showRecoverCodeDialogAfterPasswordVerification(isRecoverCodeAvailable ? "get" : "create", false)
		},
		okActionTextId: isRecoverCodeAvailable ? "show_action" : "setUp_action",
	})
}

export function showRecoverCodeDialogAfterPasswordVerification(action: Action, showMessage: boolean = true) {
	const userManagementFacade = locator.userManagementFacade
	const dialog = Dialog.showRequestPasswordDialog({
		action: (pw) => {
			return (action === "get" ? userManagementFacade.getRecoverCode(pw) : userManagementFacade.createRecoveryCode(pw))
				.then((recoverCode) => {
					dialog.close()
					showRecoverCodeDialog(recoverCode, showMessage)
					return ""
				})
				.catch(ofClass(NotAuthenticatedError, () => lang.get("invalidPassword_msg")))
				.catch(ofClass(AccessBlockedError, () => lang.get("tooManyAttempts_msg")))
		},
		cancel: {
			textId: "cancel_action",
			action: noOp,
		},
	})
}

export function showRecoverCodeDialog(recoverCode: Hex, showMessage: boolean): Promise<void> {
	return new Promise((resolve) => {
		Dialog.showActionDialog({
			title: lang.get("recoveryCode_label"),
			child: {
				view: () => {
					return m(RecoverCodeField, {
						showMessage,
						recoverCode,
					})
				},
			},
			allowCancel: false,
			allowOkWithReturn: true,
			okAction: (dialog: Dialog) => {
				dialog.close()
				resolve()
			},
			type: DialogType.EditMedium,
		})
	})
}

export type RecoverCodeFieldAttrs = {
	showMessage: boolean
	recoverCode: Hex
	showButtons?: boolean
	showImage?: string
}

export class RecoverCodeField {
	view(vnode: Vnode<RecoverCodeFieldAttrs>): Children {
		const lnk = InfoLink.RecoverCode

		let { recoverCode, showButtons, showMessage, showImage } = vnode.attrs
		showButtons = showButtons ?? true

		return [
			showMessage
				? showImage
					? m(".flex-space-around.flex-wrap", [
							m(
								".flex-grow-shrink-half.plr-l.flex-center.align-self-center",
								m(".pt.pb", [
									lang.get("recoveryCode_msg"),
									m("", [m("small", lang.get("moreInfo_msg") + " "), m("small.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)])]),
								]),
							),
							m(
								".flex-grow-shrink-half.plr-l.flex-center.align-self-center",
								m("img.pt.bg-white.pt.pb", {
									src: showImage,
									style: {
										width: "200px",
									},
								}),
							),
					  ])
					: m(".pt.pb", [
							lang.get("recoveryCode_msg"),
							m("", [m("small", lang.get("moreInfo_msg") + " "), m("small.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)])]),
					  ])
				: m("", lang.get("emptyString_msg")),
			m(
				".text-break.monospace.selectable.flex.flex-wrap.border.pt.pb.plr",
				neverNull(recoverCode.match(/.{4}/g)).map((el, i) => m("span.pr-s.no-wrap" + (i % 2 === 0 ? "" : ""), el)),
			),
			showButtons
				? m(".flex.flex-end.mt-m", [
						m(Button, {
							label: "copy_action",
							icon: () => Icons.Clipboard,
							click: () => copyToClipboard(recoverCode),
						}),
						isApp() || typeof window.print !== "function"
							? null
							: m(Button, {
									label: "print_action",
									icon: () => Icons.Print,
									click: () => window.print(),
							  }),
				  ])
				: null,
		]
	}
}

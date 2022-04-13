import {InfoLink, lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {Dialog, DialogType} from "../gui/base/Dialog"
import type {Hex} from "@tutao/tutanota-utils"
import {neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import m, {Children, Vnode} from "mithril"
import {assertMainOrNode, isApp} from "../api/common/Env"
import {Icons} from "../gui/base/icons/Icons"
import {copyToClipboard} from "../misc/ClipboardUtils"
import {ButtonN} from "../gui/base/ButtonN"
import {AccessBlockedError, NotAuthenticatedError} from "../api/common/error/RestError"
import {locator} from "../api/main/MainLocator"

type Action = "get" | "create"
assertMainOrNode()

export function showRecoverCodeDialogAfterPasswordVerification(action: Action, showMessage: boolean = true) {
	const userManagementFacade = locator.userManagementFacade
	const dialog = Dialog.showRequestPasswordDialog({
		action: (pw) => {
			return (action === "get" ? userManagementFacade.getRecoverCode(pw) : userManagementFacade.createRecoveryCode(pw))
				.then(recoverCode => {
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
		}
	})
}

export function showRecoverCodeDialog(recoverCode: Hex, showMessage: boolean): Promise<void> {
	return new Promise(resolve => {
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
}

export class RecoverCodeField {
	view(vnode: Vnode<RecoverCodeFieldAttrs>): Children {
		const lnk = InfoLink.RecoverCode
		return [
			vnode.attrs.showMessage
				? m(".pt.pb", [
					lang.get("recoveryCode_msg"),
					m("", [m("small", lang.get("moreInfo_msg") + " "), m("small.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)])]),
				])
				: m("", lang.get("emptyString_msg")),
			m(
				".text-break.monospace.selectable.flex.flex-wrap.border.pt.pb.plr",
				neverNull(vnode.attrs.recoverCode.match(/.{4}/g)).map((el, i) => m("span.pr-s.no-wrap" + (i % 2 === 0 ? "" : ""), el)),
			),
			m(".flex.flex-end.mt-m", [
				m(ButtonN, {
					label: "copy_action",
					icon: () => Icons.Clipboard,
					click: () => copyToClipboard(vnode.attrs.recoverCode),
				}),
				isApp() || typeof window.print !== "function"
					? null
					: m(ButtonN, {
						label: "print_action",
						icon: () => Icons.Print,
						click: () => window.print(),
					}),
			]),
		]
	}
}
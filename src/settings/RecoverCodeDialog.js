//@flow

import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {neverNull} from "../api/common/utils/Utils"
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {assertMainOrNode, isApp} from "../api/Env"
import {Icons} from "../gui/base/icons/Icons"
import {copyToClipboard} from "../misc/ClipboardUtils"
import {ButtonN} from "../gui/base/ButtonN"
import {AccessBlockedError, NotAuthenticatedError} from "../api/common/error/RestError"

type Action = 'get' | 'create'

assertMainOrNode()

export function showRecoverCodeDialogAfterPasswordVerification(action: Action, showMessage: boolean = true) {
	const errorMessage: Stream<string> = stream(lang.get("emptyString_msg"))
	Dialog.showRequestPasswordDialog(errorMessage)
	      .map(pw => showProgressDialog("loading_msg", action === 'get'
		      ? worker.getRecoveryCode(pw)
		      : worker.createRecoveryCode(pw))
		      .then(recoverCode => {
			      errorMessage("")
			      showRecoverCodeDialog(recoverCode, showMessage)
		      })
		      .catch(NotAuthenticatedError, () => errorMessage(lang.get("invalidPassword_msg")))
		      .catch(AccessBlockedError, () => errorMessage(lang.get("tooManyAttempts_msg")))
	      )
}

export function showRecoverCodeDialog(recoverCode: Hex, showMessage: boolean): Promise<void> {
	return new Promise((resolve) => {
		Dialog.showActionDialog({
			title: lang.get("recoveryCode_label"),
			child: {
				view: () => {
					return m(RecoverCodeField, {showMessage, recoverCode})
				}
			},
			allowCancel: false,
			allowOkWithReturn: true,
			okAction: (dialog) => {
				dialog.close()
				resolve()
			},
			type: DialogType.EditMedium
		})
	})
}

export type RecoverCodeFieldAttrs = {
	showMessage: boolean,
	recoverCode: Hex
}

export class RecoverCodeField {
	view(vnode: Vnode<RecoverCodeFieldAttrs>): Children {
		const lnk = lang.getInfoLink("recoverCode_link")
		return [
			vnode.attrs.showMessage
				? m(".pt.pb", [
					lang.get("recoveryCode_msg"),
					m("", [
						m("small", lang.get("moreInfo_msg") + " "),
						m("small.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)]),
					])
				])
				: m("", lang.get("emptyString_msg")),
			m(".text-break.monospace.selectable.flex.flex-wrap.border.pt.pb.plr",
				neverNull(vnode.attrs.recoverCode.match(/.{4}/g)).map((el, i) => m("span.pr-s.no-wrap" + (i % 2 === 0 ? "" : ""), el))),
			m(".flex.flex-end.mt-m", [
				m(ButtonN, {
					label: "copy_action",
					icon: () => Icons.Copy,
					click: () => copyToClipboard(vnode.attrs.recoverCode)
				}),
				isApp() || typeof window.print !== 'function' ? null : m(ButtonN, {
					label: "print_action",
					icon: () => Icons.Print,
					click: () => window.print()
				}),
			])
		]
	}
}
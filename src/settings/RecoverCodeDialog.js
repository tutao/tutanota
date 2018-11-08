//@flow

import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {AccessBlockedError, NotAuthenticatedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {neverNull} from "../api/common/utils/Utils"
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {assertMainOrNode} from "../api/Env"

type Action = 'get' | 'create'

assertMainOrNode()

export function show(action: Action, showMessage: boolean = true) {
	const errorMessageStream = stream("")
	const dialog = Dialog.showRequestPasswordDialog((passwordField) => {
		showProgressDialog("loading_msg",
			action === 'get' ? worker.getRecoveryCode(passwordField.value()) : worker.createRecoveryCode(passwordField.value()))
			.then((recoverCode) => {
				dialog.close()
				return showRecoverCodeDialog(recoverCode, showMessage)
			})
			.catch(NotAuthenticatedError, () => {
				errorMessageStream(lang.get("invalidPassword_msg"))
				passwordField.focus()
			})
			.catch(AccessBlockedError, () => {
				errorMessageStream(lang.get("tooManyAttempts_msg"))
				passwordField.focus()
			})
	}, errorMessageStream, () => { dialog.close()})
}

export function showRecoverCodeDialog(recoverCode: Hex, showMessage: boolean): Promise<void> {
	return new Promise((resolve) => {
		Dialog.showActionDialog({
			title: lang.get("recoverCode_label"),
			child: {
				view: () => {
					return [
						showMessage ? m(".pt.pb", lang.get("recoverCode_msg")) : m("", lang.get("emptyString_msg")),
						m(".text-break.monospace.selectable.flex.flex-wrap",
							neverNull(recoverCode.match(/.{4}/g)).map((el, i) => m("span.pr-s.no-wrap" + (i % 2 === 0 ? "" : ""), el)))
					]
				}
			},
			allowCancel: false,
			okAction: (dialog) => {
				dialog.close()
				resolve()
			},
			type: DialogType.EditMedium
		})
	})
}
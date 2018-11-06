//@flow

import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {AccessBlockedError, NotAuthenticatedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {Dialog} from "../gui/base/Dialog"
import {neverNull} from "../api/common/utils/Utils"
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {assertMainOrNode} from "../api/Env"

type Action = 'get' | 'create'

assertMainOrNode()

export function show(action: Action) {
	const errorMessageStream = stream("")
	const dialog = Dialog.showRequestPasswordDialog((passwordField) => {
		showProgressDialog("loading_msg",
			action === 'get' ? worker.getRecoveryCode(passwordField.value()) : worker.createRecoveryCode(passwordField.value()))
			.then((recoverCode) => {
				dialog.close()
				return showRecoverCodeDialog(recoverCode)
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

export function showRecoverCodeDialog(recoverCode: Hex): Promise<void> {
	return new Promise((resolve) => {
		Dialog.showActionDialog({
			title: lang.get("recoverCode_label"),
			child: {
				view: () => {
					return [
						m(".pt.pb", lang.get("recoverCode_msg")),
						m(".text-break.monospace.selectable",
							neverNull(recoverCode.match(/.{2}/g)).map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el)))
					]
				}
			},
			allowCancel: false,
			okAction: (dialog) => {
				dialog.close()
				resolve()
			}
		})
	})
}
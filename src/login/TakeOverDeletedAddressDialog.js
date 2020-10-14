//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	InvalidDataError,
	NotAuthenticatedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {isMailAddress} from "../misc/FormatValidator"
import {lang} from "../misc/LanguageViewModel"
import {TextFieldN} from "../gui/base/TextFieldN"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {assertMainOrNode} from "../api/Env"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import {worker} from "../api/main/WorkerClient"

assertMainOrNode()

export function showTakeOverDialog(mailAddress: string, password: string): Dialog {
	const targetAccountAddress = stream("")

	const editor = new HtmlEditor("recoveryCode_label")
	editor.setMode(Mode.HTML)
	editor.setHtmlMonospace(true)
	editor.setMinHeight(80)
	editor.showBorders()

	const takeoverDialog = Dialog.showActionDialog({
		title: lang.get("help_label"),
		type: DialogType.EditSmall,
		child: {
			view: () => {
				return [
					m(".mt", lang.get("takeOverUnusedAddress_msg",)),
					m("span", [
						lang.get('moreInfo_msg') + " ",
						m("a", {
							href: "https://tutanota.com/faq/#inactive-accounts",
							target: "_blank"
						}, "https://tutanota.com/faq/#inactive-accounts")
					]),
					m(TextFieldN, {label: "targetAddress_label", value: targetAccountAddress}),
					m(editor)
				]
			}
		},
		okAction: () => {
			const cleanTargetAccountAddress = targetAccountAddress().trim().toLowerCase()
			const cleanMailAddress = mailAddress.trim().toLowerCase()
			const cleanRecoveryCode = editor.getValue().replace(/\s/g, '').toLowerCase()
			if (!isMailAddress(cleanMailAddress, true)) {
				Dialog.error("mailAddressInvalid_msg")
			} else if (!isMailAddress(cleanTargetAccountAddress, true)) {
				Dialog.error("mailAddressInvalid_msg")
			} else {
				showProgressDialog("pleaseWait_msg",
					worker.initialized
					      .then(() => worker.takeOverDeletedAddress(cleanMailAddress, password, cleanRecoveryCode, cleanTargetAccountAddress ? cleanTargetAccountAddress : null)))
					.then(() => Dialog.error("takeoverSuccess_msg"))
					.then(() => {
						takeoverDialog.close()
						m.route.set("/login", {loginWith: cleanTargetAccountAddress, noAutoLogin: true})
					}).catch(e => handleError(e))
			}
		},
		cancelAction: () => m.route.set("/login")
	})
	return takeoverDialog
}

function handleError(e: Error) {
	return Promise
		.reject(e)
		.catch(NotAuthenticatedError, () => {
			Dialog.error("loginFailed_msg")
		})
		.catch(AccessBlockedError, () => {
			Dialog.error("loginFailedOften_msg")
		})
		.catch(InvalidDataError, () => {
			Dialog.error("takeoverAccountInvalid_msg")
		})
		.catch(AccessDeactivatedError, e => {
			Dialog.error('loginFailed_msg')
		})
		.catch(TooManyRequestsError, e => {
			Dialog.error('tooManyAttempts_msg')
		})
}
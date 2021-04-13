//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {createDropdown} from "../../gui/base/DropdownN.js"
import {AccessBlockedError, AccessDeactivatedError, NotAuthenticatedError, TooManyRequestsError} from "../../api/common/error/RestError"
import {showProgressDialog} from "../../gui/ProgressDialog"
import {isMailAddress} from "../../misc/FormatValidator"
import {Type} from "../../gui/base/TextFieldN"
import {lang} from "../../misc/LanguageViewModel"
import {PasswordForm} from "../../settings/PasswordForm"
import {Icons} from "../../gui/base/icons/Icons"
import {deviceConfig} from "../../misc/DeviceConfig"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {Dialog, DialogType} from "../../gui/base/Dialog"
import {assertMainOrNode} from "../../api/common/Env"
import {secondFactorHandler} from "../../misc/SecondFactorHandler"
import {HtmlEditor, Mode} from "../../gui/editor/HtmlEditor"
import {worker} from "../../api/main/WorkerClient"
import {client} from "../../misc/ClientDetector"
import {CancelledError} from "../../api/common/error/CancelledError"

assertMainOrNode()

export type ResetAction = "password" | "secondFactor"

export function show(mailAddress?: ?string, resetAction?: ResetAction): Dialog {
	const selectedAction: Stream<?ResetAction> = stream(resetAction)
	let passwordForm = new PasswordForm(false, true, true);
	const passwordValueStream = stream("")
	const emailAddressStream = stream(mailAddress || "")

	const resetPasswordAction: ButtonAttrs = {
		label: "recoverSetNewPassword_action",
		click: () => {
			selectedAction("password")
		},
		type: ButtonType.Dropdown
	}

	const resetSecondFactorAction: ButtonAttrs = {
		label: "recoverResetFactors_action",
		click: () => {
			selectedAction("secondFactor")
		},
		type: ButtonType.Dropdown
	}


	const resetActionClickHandler = createDropdown(() => [resetPasswordAction, resetSecondFactorAction], 300)
	const resetActionButtonAttrs: ButtonAttrs = {
		label: "action_label",
		click: resetActionClickHandler,
		icon: () => Icons.Edit
	}

	const selectedValueLabelStream = selectedAction.map(v => {
		if (v === "password") {
			return lang.get("recoverSetNewPassword_action")
		} else if (v === "secondFactor") {
			return lang.get("recoverResetFactors_action")
		} else {
			return lang.get("choose_label")
		}
	})

	const editor = new HtmlEditor("recoveryCode_label")
	editor.setMode(Mode.HTML)
	editor.setHtmlMonospace(true)
	editor.setMinHeight(80)
	editor.showBorders()

	const recoverDialog = Dialog.showActionDialog({
		title: lang.get("recover_label"),
		type: DialogType.EditSmall,
		child: {
			view: () => {
				return [
					m(TextFieldN, {label: "mailAddress_label", value: emailAddressStream}),
					m(editor),
					m(TextFieldN, {
							label: "action_label",
							value: selectedValueLabelStream,
							injectionsRight: () => m(ButtonN, resetActionButtonAttrs),
							disabled: true
						}
					),
					selectedAction() == null
						? null
						: selectedAction() === "password"
						? m(passwordForm)
						: m(TextFieldN,
							{
								label: "password_label",
								type: Type.Password,
								value: passwordValueStream
							})
				]
			}
		},
		okAction: () => {
			const cleanMailAddress = emailAddressStream().trim().toLowerCase()
			const cleanRecoverCodeValue = editor.getValue().replace(/\s/g, '').toLowerCase()
			if (!isMailAddress(cleanMailAddress, true)) {
				Dialog.error("mailAddressInvalid_msg")
			} else if (cleanRecoverCodeValue === "") {
				Dialog.error("recoveryCodeEmpty_msg")
			} else if (selectedAction() === "password") {
				const errorMessageId = passwordForm.getErrorMessageId()
				if (errorMessageId) {
					Dialog.error(errorMessageId)
				} else {
					showProgressDialog("pleaseWait_msg",
						worker.initialized.then(() => {
							return worker.recoverLogin(
								cleanMailAddress,
								cleanRecoverCodeValue,
								passwordForm.getNewPassword(),
								client.getIdentifier())
						}))
						.then(() => {
							recoverDialog.close()
							deviceConfig.delete(cleanMailAddress)
							m.route.set("/login", {loginWith: cleanMailAddress, noAutoLogin: true})
						})
						.catch(e => handleError(e))
						.finally(() => secondFactorHandler.closeWaitingForSecondFactorDialog())
				}
			} else if (selectedAction() === "secondFactor") {
				const passwordValue = passwordValueStream()
				showProgressDialog("pleaseWait_msg",
					worker.initialized
					      .then(() => worker.resetSecondFactors(cleanMailAddress, passwordValue, cleanRecoverCodeValue)))
					.then(() => {
						recoverDialog.close()
						deviceConfig.delete(cleanMailAddress)
						m.route.set("/login", {loginWith: cleanMailAddress, noAutoLogin: true})
					})
					.catch(e => handleError(e))
			}
		},
		cancelAction: () => m.route.set("/login", {noAutoLogin: true})
	})
	return recoverDialog
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
		.catch(CancelledError, () => {
			// Thrown when second factor dialog is cancelled
			m.redraw()
		})
		.catch(AccessDeactivatedError, e => {
			Dialog.error('loginFailed_msg')
		})
		.catch(TooManyRequestsError, e => {
			Dialog.error('tooManyAttempts_msg')
		})
}
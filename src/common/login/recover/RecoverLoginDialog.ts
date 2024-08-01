import m from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { AccessBlockedError, AccessDeactivatedError, NotAuthenticatedError, TooManyRequestsError } from "../../api/common/error/RestError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { isMailAddress } from "../../misc/FormatValidator.js"
import { Autocomplete, TextField, TextFieldType } from "../../gui/base/TextField.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { PasswordForm, PasswordModel } from "../../settings/PasswordForm.js"
import { Icons } from "../../gui/base/icons/Icons"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import { HtmlEditor, HtmlEditorMode } from "../../gui/editor/HtmlEditor"
import { client } from "../../misc/ClientDetector.js"
import { CancelledError } from "../../api/common/error/CancelledError"
import { locator } from "../../api/main/CommonLocator"
import { windowFacade } from "../../misc/WindowFacade.js"
import { assertMainOrNode } from "../../api/common/Env"
import { createDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { PasswordField } from "../../misc/passwords/PasswordField.js"

assertMainOrNode()
export type ResetAction = "password" | "secondFactor"

export function show(mailAddress?: string | null, resetAction?: ResetAction): Dialog {
	const selectedAction: Stream<ResetAction | null> = stream(resetAction ?? null)
	const passwordModel = new PasswordModel(locator.usageTestController, locator.logins, { checkOldPassword: false, enforceStrength: true })
	const passwordValueStream = stream("")
	const emailAddressStream = stream(mailAddress || "")
	const resetPasswordAction: DropdownButtonAttrs = {
		label: "recoverSetNewPassword_action",
		click: () => selectedAction("password"),
	}
	const resetSecondFactorAction: DropdownButtonAttrs = {
		label: "recoverResetFactors_action",
		click: () => selectedAction("secondFactor"),
	}
	const resetActionClickHandler = createDropdown({
		lazyButtons: () => [resetPasswordAction, resetSecondFactorAction],
		width: 300,
	})
	const resetActionButtonAttrs: IconButtonAttrs = {
		title: "action_label",
		click: resetActionClickHandler,
		icon: Icons.Edit,
		size: ButtonSize.Compact,
	}
	const selectedValueLabelStream = selectedAction.map((v) => {
		if (v === "password") {
			return lang.get("recoverSetNewPassword_action")
		} else if (v === "secondFactor") {
			return lang.get("recoverResetFactors_action")
		} else {
			return lang.get("choose_label")
		}
	})
	const editor = new HtmlEditor("recoveryCode_label")
	editor.setMode(HtmlEditorMode.HTML)
	editor.setHtmlMonospace(true)
	editor.setMinHeight(80)
	editor.showBorders()
	const recoverDialog = Dialog.showActionDialog({
		title: lang.get("recover_label"),
		type: DialogType.EditSmall,
		child: {
			view: () => {
				return [
					m(TextField, {
						label: "mailAddress_label",
						value: emailAddressStream(),
						autocompleteAs: Autocomplete.email,
						type: TextFieldType.Email,
						oninput: emailAddressStream,
					}),
					m(editor),
					m(TextField, {
						label: "action_label",
						value: selectedValueLabelStream(),
						oninput: selectedValueLabelStream,
						injectionsRight: () => m(IconButton, resetActionButtonAttrs),
						isReadOnly: true,
					}),
					selectedAction() == null
						? null
						: selectedAction() === "password"
						? m(PasswordForm, { model: passwordModel })
						: m(PasswordField, {
								value: passwordValueStream(),
								autocompleteAs: Autocomplete.currentPassword,
								oninput: passwordValueStream,
						  }),
				]
			},
		},
		okAction: async () => {
			const cleanMailAddress = emailAddressStream().trim().toLowerCase()
			const cleanRecoverCodeValue = editor.getValue().replace(/\s/g, "").toLowerCase()

			if (!isMailAddress(cleanMailAddress, true)) {
				Dialog.message("mailAddressInvalid_msg")
			} else if (cleanRecoverCodeValue === "") {
				Dialog.message("recoveryCodeEmpty_msg")
			} else if (selectedAction() === "password") {
				const errorMessageId = passwordModel.getErrorMessageId()

				if (errorMessageId) {
					Dialog.message(errorMessageId)
				} else {
					showProgressDialog(
						"pleaseWait_msg",
						locator.loginFacade.recoverLogin(cleanMailAddress, cleanRecoverCodeValue, passwordModel.getNewPassword(), client.getIdentifier()),
					)
						.then(async () => {
							recoverDialog.close()
							await deleteCredentialsByMailAddress(cleanMailAddress)
							windowFacade.reload({})
						})
						.catch((e) => handleError(e))
						.finally(() => locator.secondFactorHandler.closeWaitingForSecondFactorDialog())
				}
			} else if (selectedAction() === "secondFactor") {
				const passwordValue = passwordValueStream()
				showProgressDialog("pleaseWait_msg", locator.loginFacade.resetSecondFactors(cleanMailAddress, passwordValue, cleanRecoverCodeValue))
					.then(async () => {
						recoverDialog.close()
						await deleteCredentialsByMailAddress(cleanMailAddress)
						windowFacade.reload({})
					})
					.catch((e) => handleError(e))
			}
		},
		cancelAction: () =>
			m.route.set("/login", {
				noAutoLogin: true,
			}),
	})
	return recoverDialog
}

async function deleteCredentialsByMailAddress(cleanMailAddress: string) {
	const allCredentials = await locator.credentialsProvider.getInternalCredentialsInfos()
	const credentials = allCredentials.find((c) => c.login === cleanMailAddress)

	if (credentials) {
		await locator.credentialsProvider.deleteByUserId(credentials.userId)
	}
}

function handleError(e: Error) {
	if (e instanceof NotAuthenticatedError) {
		Dialog.message("loginFailed_msg")
	} else if (e instanceof AccessBlockedError || e instanceof AccessDeactivatedError) {
		Dialog.message("loginFailedOften_msg")
	} else if (e instanceof CancelledError) {
		// Thrown when second factor dialog is cancelled
		m.redraw()
	} else if (e instanceof TooManyRequestsError) {
		Dialog.message("tooManyAttempts_msg")
	} else {
		throw e
	}
}

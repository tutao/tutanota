import m from "mithril"
import stream from "mithril/stream"
import { AccessBlockedError, AccessDeactivatedError, InvalidDataError, NotAuthenticatedError, TooManyRequestsError } from "../../api/common/error/RestError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { isMailAddress } from "../../misc/FormatValidator.js"
import { InfoLink, lang } from "../../misc/LanguageViewModel.js"
import { Autocomplete, TextField, TextFieldType } from "../../gui/base/TextField.js"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import { locator } from "../../api/main/CommonLocator"
import { assertMainOrNode } from "../../api/common/Env"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink.js"
import { RecoverCodeInput } from "../../settings/login/RecoverCodeDialog.js"

assertMainOrNode()

export function showTakeOverDialog(mailAddress: string, password: string): Dialog {
	const targetAccountAddress = stream("")
	const recoverCodeInput = new RecoverCodeInput()
	const takeoverDialog = Dialog.showActionDialog({
		title: "help_label",
		type: DialogType.EditSmall,
		child: {
			view: () => {
				return [
					m(".mt-16", lang.get("takeOverUnusedAddress_msg")),
					m(MoreInfoLink, { link: InfoLink.InactiveAccounts }),
					m(TextField, {
						label: "targetAddress_label",
						value: targetAccountAddress(),
						autocompleteAs: Autocomplete.email,
						type: TextFieldType.Email,
						oninput: targetAccountAddress,
					}),
					m(recoverCodeInput),
				]
			},
		},
		okAction: () => {
			const cleanTargetAccountAddress = targetAccountAddress().trim().toLowerCase()
			const cleanMailAddress = mailAddress.trim().toLowerCase()
			const cleanRecoveryCode = recoverCodeInput.getValue().replace(/\s/g, "").toLowerCase()

			if (!isMailAddress(cleanMailAddress, true)) {
				Dialog.message("mailAddressInvalid_msg")
			} else if (!isMailAddress(cleanTargetAccountAddress, true)) {
				Dialog.message("mailAddressInvalid_msg")
			} else {
				showProgressDialog(
					"pleaseWait_msg",
					locator.loginFacade.takeOverDeletedAddress(cleanMailAddress, password, cleanRecoveryCode, cleanTargetAccountAddress),
				)
					.then(() => Dialog.message("takeoverSuccess_msg"))
					.then(() => {
						takeoverDialog.close()
						m.route.set("/login", {
							loginWith: cleanTargetAccountAddress,
							noAutoLogin: true,
						})
					})
					.catch((e) => handleError(e))
			}
		},
		cancelAction: () =>
			m.route.set("/login", {
				noAutoLogin: true,
			}),
	})
	return takeoverDialog
}

function handleError(e: Error) {
	if (e instanceof NotAuthenticatedError) {
		Dialog.message("loginFailed_msg")
	} else if (e instanceof AccessBlockedError || e instanceof AccessDeactivatedError) {
		Dialog.message("loginFailedOften_msg")
	} else if (e instanceof InvalidDataError) {
		Dialog.message("takeoverAccountInvalid_msg")
	} else if (e instanceof TooManyRequestsError) {
		Dialog.message("tooManyAttempts_msg")
	} else {
		throw e
	}
}

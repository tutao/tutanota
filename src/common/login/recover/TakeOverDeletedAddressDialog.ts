import m from "mithril"
import stream from "mithril/stream"
import { AccessBlockedError, AccessDeactivatedError, InvalidDataError, NotAuthenticatedError, TooManyRequestsError } from "../../api/common/error/RestError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { isMailAddress } from "../../misc/FormatValidator.js"
import { InfoLink, lang } from "../../misc/LanguageViewModel.js"
import { Autocomplete, TextField, TextFieldType } from "../../gui/base/TextField.js"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import { HtmlEditor, HtmlEditorMode } from "../../gui/editor/HtmlEditor"
import { locator } from "../../api/main/CommonLocator"
import { assertMainOrNode } from "../../api/common/Env"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink.js"

assertMainOrNode()

export function showTakeOverDialog(mailAddress: string, password: string): Dialog {
	const targetAccountAddress = stream("")
	const editor = new HtmlEditor("recoveryCode_label")
	editor.setMode(HtmlEditorMode.HTML)
	editor.setHtmlMonospace(true)
	editor.setMinHeight(80)
	editor.showBorders()
	const takeoverDialog = Dialog.showActionDialog({
		title: lang.get("help_label"),
		type: DialogType.EditSmall,
		child: {
			view: () => {
				return [
					m(".mt", lang.get("takeOverUnusedAddress_msg")),
					m(MoreInfoLink, { link: InfoLink.InactiveAccounts }),
					m(TextField, {
						label: "targetAddress_label",
						value: targetAccountAddress(),
						autocompleteAs: Autocomplete.email,
						type: TextFieldType.Email,
						oninput: targetAccountAddress,
					}),
					m(editor),
				]
			},
		},
		okAction: () => {
			const cleanTargetAccountAddress = targetAccountAddress().trim().toLowerCase()
			const cleanMailAddress = mailAddress.trim().toLowerCase()
			const cleanRecoveryCode = editor.getValue().replace(/\s/g, "").toLowerCase()

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

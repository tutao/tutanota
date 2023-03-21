import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import { InvalidDataError, LockedError, PreconditionFailedError } from "../api/common/error/RestError"
import { Autocomplete, TextField, TextFieldType } from "../gui/base/TextField.js"
import { neverNull, ofClass } from "@tutao/tutanota-utils"
import { getCleanedMailAddress } from "../misc/parsing/MailAddressParser"
import { locator } from "../api/main/MainLocator"
import { getEtId } from "../api/common/utils/EntityUtils"

export function showDeleteAccountDialog() {
	let why = ""
	let takeover = ""
	let password = ""
	Dialog.showActionDialog({
		title: lang.get("adminDeleteAccount_action"),
		child: {
			view: () =>
				m("#delete-account-dialog", [
					m(TextField, {
						label: "deleteAccountReason_label",
						value: why,
						oninput: (value) => (why = value),
						helpLabel: () => lang.get("deleteAccountReasonInfo_msg"),
					}),
					m(TextField, {
						label: "targetAddress_label",
						value: takeover,
						oninput: (value) => (takeover = value),
						helpLabel: () => lang.get("takeoverMailAddressInfo_msg"),
					}),
					m(TextField, {
						label: "password_label",
						value: password,
						autocompleteAs: Autocomplete.currentPassword,
						oninput: (value) => (password = value),
						helpLabel: () => lang.get("passwordEnterNeutral_msg"),
						type: TextFieldType.Password,
					}),
				]),
		},
		okAction: () => {
			deleteAccount(why, takeover, password).then((isDeleted) => {
				if (isDeleted) {
					deleteSavedCredentials()
				}
			})
		},
		allowCancel: true,
		okActionTextId: "delete_action",
	})
}

function deleteAccount(reason: string, takeover: string, password: string): Promise<boolean> {
	let cleanedTakeover = takeover === "" ? "" : getCleanedMailAddress(takeover)

	if (cleanedTakeover === null) {
		return Dialog.message("mailAddressInvalid_msg").then(() => false)
	} else {
		const messageFn = () =>
			cleanedTakeover === ""
				? lang.get("deleteAccountConfirm_msg")
				: lang.get("deleteAccountWithTakeoverConfirm_msg", {
						"{1}": cleanedTakeover,
				  })

		return Dialog.confirm(messageFn).then((ok) => {
			if (ok) {
				return locator.loginFacade
					.deleteAccount(password, reason, neverNull(cleanedTakeover))
					.then(() => true)
					.catch(ofClass(PreconditionFailedError, () => Dialog.message("passwordWrongInvalid_msg").then(() => false)))
					.catch(ofClass(InvalidDataError, () => Dialog.message("takeoverAccountInvalid_msg").then(() => false)))
					.catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg").then(() => false)))
			} else {
				return false
			}
		})
	}
}

function deleteSavedCredentials() {
	locator.credentialsProvider.deleteByUserId(getEtId(locator.logins.getUserController().user))
}

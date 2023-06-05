import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import { InvalidDataError, LockedError, PreconditionFailedError } from "../api/common/error/RestError"
import { Autocomplete, TextField, TextFieldType } from "../gui/base/TextField.js"
import { neverNull, ofClass } from "@tutao/tutanota-utils"
import { getCleanedMailAddress } from "../misc/parsing/MailAddressParser"
import { locator } from "../api/main/MainLocator"
import { getEtId } from "../api/common/utils/EntityUtils"
import { CloseEventBusOption } from "../api/common/TutanotaConstants.js"

export function showDeleteAccountDialog() {
	let why = ""
	let takeover = ""
	let password = ""
	const userId = getEtId(locator.logins.getUserController().user)
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
		okAction: async () => {
			const isDeleted = await deleteAccount(why, takeover, password)
			if (isDeleted) {
				await locator.credentialsProvider.deleteByUserId(userId)
				m.route.set("/login", { noAutoLogin: true })
			}
		},
		allowCancel: true,
		okActionTextId: "delete_action",
	})
}

async function deleteAccount(reason: string, takeover: string, password: string): Promise<boolean> {
	const cleanedTakeover = takeover === "" ? "" : getCleanedMailAddress(takeover)

	if (cleanedTakeover === null) {
		await Dialog.message("mailAddressInvalid_msg")
		return false
	} else {
		const messageFn = () =>
			cleanedTakeover === ""
				? lang.get("deleteAccountConfirm_msg")
				: lang.get("deleteAccountWithTakeoverConfirm_msg", {
						"{1}": cleanedTakeover,
				  })

		const ok = await Dialog.confirm(messageFn)
		if (!ok) return false
		// this is necessary to prevent us from applying websocket events to an already deleted/closed offline DB
		// which is an immediate crash on ios
		await locator.connectivityModel.close(CloseEventBusOption.Terminate)
		try {
			await locator.loginFacade.deleteAccount(password, reason, neverNull(cleanedTakeover))
			return true
		} catch (e) {
			if (e instanceof PreconditionFailedError) await Dialog.message("passwordWrongInvalid_msg")
			if (e instanceof InvalidDataError) await Dialog.message("takeoverAccountInvalid_msg")
			if (e instanceof LockedError) await Dialog.message("operationStillActive_msg")
			return false
		}
	}
}

// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InvalidDataError, LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {TextField, Type} from "../gui/base/TextField"
import {getCleanedMailAddress} from "../misc/Formatter"
import {neverNull} from "../api/common/utils/Utils"
import {deviceConfig} from "../misc/DeviceConfig"
import {logins} from "../api/main/LoginController"

export function showDeleteAccountDialog() {
	let why = new TextField("deleteAccountReason_label", () => lang.get("deleteAccountReasonInfo_msg"))
	let takeover = new TextField("targetAddress_label", () => lang.get("takeoverMailAddressInfo_msg"))
	let passwordField = new TextField("password_label", () => lang.get("passwordEnterNeutral_msg"))
		.setType(Type.Password)

	Dialog.showActionDialog({
		title: lang.get("adminDeleteAccount_action"),
		child: {
			view: () => m("#delete-account-dialog", [
				m(why),
				m(takeover),
				m(passwordField),
			])
		},
		okAction: () => {
			deleteAccount(why.value(), takeover.value(), passwordField.value())
				.then((isDeleted) => {
					if (isDeleted) {
						cleanupPassword(passwordField)
						deleteSavedCredentials()
					}
				})
		},
		allowCancel: true,
		okActionTextId: "delete_action"
	})
}

function deleteAccount(reason: string, takeover: string, password: string): Promise<boolean> {
	let cleanedTakeover = (takeover === "")
		? ""
		: getCleanedMailAddress(takeover)

	if (cleanedTakeover === null) {
		return Dialog.error("mailAddressInvalid_msg").then(() => false)
	} else {
		const messageFn = () => cleanedTakeover === ""
			? lang.get("deleteAccountConfirm_msg")
			: lang.get("deleteAccountWithTakeoverConfirm_msg", {"{1}": cleanedTakeover})
		return Dialog.confirm(messageFn)
		             .then(ok => {
			             if (ok) {
				             return worker.deleteAccount(password, reason, neverNull(cleanedTakeover)).then(() => true)
				                          .catch(PreconditionFailedError, () => Dialog.error("passwordWrongInvalid_msg").then(() => false))
				                          .catch(InvalidDataError, () => Dialog.error("takeoverAccountInvalid_msg").then(() => false))
				                          .catch(LockedError, () => Dialog.error("operationStillActive_msg").then(() => false))
			             } else {
				             return false
			             }
		             })
	}
}

function cleanupPassword(password: TextField) {
	password.value("")
	if (password._domInput) {
		password._domInput.value = ""
	}
}

function deleteSavedCredentials() {
	const credentials = deviceConfig.getByUserId(logins.getUserController().user._id)
	if (credentials) {
		deviceConfig.delete(credentials.mailAddress)
	}
}
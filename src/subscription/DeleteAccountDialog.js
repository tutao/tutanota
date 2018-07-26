// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {TextField, Type} from "../gui/base/TextField"
import {getCleanedMailAddress, isMailAddress} from "../misc/Formatter"
import {neverNull} from "../api/common/utils/Utils"

export function showDeleteAccountDialog() {
	let why = new TextField("deleteAccountReason_label", () => lang.get("deleteAccountReasonInfo_msg"))
	let takeover = new TextField("takeoverMailAddress_label", () => lang.get("takeoverMailAddressInfo_msg"))
	let password = new TextField("password_label", () => lang.get("passwordEnterNeutral_msg"))
		.setType(Type.Password)

	Dialog.smallActionDialog(lang.get("adminDeleteAccount_action"), {
		view: () => m("#delete-account-dialog", [
			m(why),
			m(takeover),
			m(password),
		])
	}, () => deleteAccount(why.value(), takeover.value(), password.value()), true, "delete_action")
}

function deleteAccount(reason: string, takeover: string, password: string) {
	if (takeover !== "" && !isMailAddress(takeover, false)) {
		Dialog.error("mailAddressInvalid_msg")
		return
	}
	takeover = neverNull(getCleanedMailAddress(takeover))
	Dialog.confirm(() => takeover === "" ? lang.get("deleteAccountConfirm_msg") : lang.get("deleteAccountWithTakeoverConfirm_msg", {"{1}": takeover})).then(ok => {
		if (ok) {
			worker.deleteAccount(password, reason, takeover)
				.catch(PreconditionFailedError, e => Dialog.error("passwordWrongInvalid_msg"))
				.catch(InvalidDataError, e => Dialog.error("takeoverAccountInvalid_msg"))
		}
	})
}
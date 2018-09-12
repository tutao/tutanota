// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {TextField, Type} from "../gui/base/TextField"
import {getCleanedMailAddress} from "../misc/Formatter"
import {neverNull} from "../api/common/utils/Utils"

export function showDeleteAccountDialog() {
	let why = new TextField("deleteAccountReason_label", () => lang.get("deleteAccountReasonInfo_msg"))
	let takeover = new TextField("takeoverMailAddress_label", () => lang.get("takeoverMailAddressInfo_msg"))
	let password = new TextField("password_label", () => lang.get("passwordEnterNeutral_msg"))
		.setType(Type.Password)

	Dialog.showActionDialog({
		title: lang.get("adminDeleteAccount_action"),
		child: {
			view: () => m("#delete-account-dialog", [
				m(why),
				m(takeover),
				m(password),
			])
		},
		okAction: () => deleteAccount(why.value(), takeover.value(), password.value()),
		allowCancel: true,
		okActionTextId: "delete_action"
	})
}

function deleteAccount(reason: string, takeover: string, password: string) {
	let cleanedTakeover = (takeover === "")
		? ""
		: getCleanedMailAddress(takeover)

	if (cleanedTakeover === null) {
		Dialog.error("mailAddressInvalid_msg")
	} else {
		Dialog.confirm(() => cleanedTakeover === ""
			? lang.get("deleteAccountConfirm_msg")
			: lang.get("deleteAccountWithTakeoverConfirm_msg", {"{1}": cleanedTakeover}))
		      .then(ok => {
			      if (ok) {
				      worker.deleteAccount(password, reason, neverNull(cleanedTakeover))
				            .catch(PreconditionFailedError, e => Dialog.error("passwordWrongInvalid_msg"))
				            .catch(InvalidDataError, e => Dialog.error("takeoverAccountInvalid_msg"))
			      }
		      })
	}
}
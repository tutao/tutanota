// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InvalidDataError, LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import {neverNull} from "@tutao/tutanota-utils"
import {logins} from "../api/main/LoginController"
import {getCleanedMailAddress} from "../misc/parsing/MailAddressParser"
import {ofClass} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"
import {getEtId} from "../api/common/utils/EntityUtils"

export function showDeleteAccountDialog() {
	let why = ""
	const whyFieldAttrs = {
		label: "deleteAccountReason_label",
		value: stream(why),
		oninput: (value) => why = value,
		helpLabel: () => lang.get("deleteAccountReasonInfo_msg"),
	}

	let takeover = ""
	const takeoverFieldAttrs = {
		label: "targetAddress_label",
		value: stream(takeover),
		oninput: (value) => takeover = value,
		helpLabel: () => lang.get("takeoverMailAddressInfo_msg"),
	}

	let password = ""
	const passwordFieldAttrs = {
		label: "password_label",
		value: stream(password),
		oninput: (value) => password = value,
		helpLabel: () => lang.get("passwordEnterNeutral_msg"),
		type: Type.Password,
	}

	Dialog.showActionDialog({
		title: lang.get("adminDeleteAccount_action"),
		child: {
			view: () => m("#delete-account-dialog", [
				m(TextFieldN, whyFieldAttrs),
				m(TextFieldN, takeoverFieldAttrs),
				m(TextFieldN, passwordFieldAttrs),
			])
		},
		okAction: () => {
			deleteAccount(why, takeover, password)
				.then((isDeleted) => {
					if (isDeleted) {
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
				             return locator.loginFacade.deleteAccount(password, reason, neverNull(cleanedTakeover)).then(() => true)
				                          .catch(ofClass(PreconditionFailedError, () => Dialog.error("passwordWrongInvalid_msg").then(() => false)))
				                          .catch(ofClass(InvalidDataError, () => Dialog.error("takeoverAccountInvalid_msg").then(() => false)))
				                          .catch(ofClass(LockedError, () => Dialog.error("operationStillActive_msg").then(() => false)))
			             } else {
				             return false
			             }
		             })
	}
}

function deleteSavedCredentials() {
	locator.credentialsProvider.deleteByUserId(getEtId(logins.getUserController().user))
}
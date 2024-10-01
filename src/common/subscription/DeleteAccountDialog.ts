import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import { InvalidDataError, LockedError, PreconditionFailedError } from "../api/common/error/RestError"
import { Autocomplete, TextField, TextFieldType } from "../gui/base/TextField.js"
import { neverNull } from "@tutao/tutanota-utils"
import { getCleanedMailAddress } from "../misc/parsing/MailAddressParser"
import { locator } from "../api/main/CommonLocator"
import { getEtId } from "../api/common/utils/EntityUtils"
import { CloseEventBusOption } from "../api/common/TutanotaConstants.js"
import { SurveyData } from "../api/entities/sys/TypeRefs.js"
import { PasswordField } from "../misc/passwords/PasswordField.js"
import { isIOSApp } from "../api/common/Env.js"
import { client } from "../misc/ClientDetector"

export function showDeleteAccountDialog(surveyData: SurveyData | null = null) {
	let takeover = ""
	let password = ""
	const userId = getEtId(locator.logins.getUserController().user)

	Dialog.showActionDialog({
		title: lang.get("adminDeleteAccount_action"),
		child: {
			view: () =>
				m("#delete-account-dialog", [
					!(isIOSApp() && client.isCalendarApp())
						? m(TextField, {
								label: "targetAddress_label",
								value: takeover,
								type: TextFieldType.Email,
								oninput: (value) => (takeover = value),
								helpLabel: () => lang.get("takeoverMailAddressInfo_msg"),
						  })
						: null,
					m(PasswordField, {
						value: password,
						autocompleteAs: Autocomplete.currentPassword,
						oninput: (value) => (password = value),
						status: {
							type: "neutral",
							text: "passwordEnterNeutral_msg",
						},
					}),
				]),
		},
		okAction: async () => {
			const isDeleted = await deleteAccount(takeover, password, surveyData)
			if (isDeleted) {
				await locator.credentialsProvider.deleteByUserId(userId)
				m.route.set("/login", { noAutoLogin: true })
			}
		},
		allowCancel: true,
		okActionTextId: "delete_action",
	})
}

async function deleteAccount(takeover: string, password: string, surveyData: SurveyData | null = null): Promise<boolean> {
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
			await locator.loginFacade.deleteAccount(password, neverNull(cleanedTakeover), surveyData)
			return true
		} catch (e) {
			if (e instanceof PreconditionFailedError) await Dialog.message("passwordWrongInvalid_msg")
			if (e instanceof InvalidDataError) await Dialog.message("takeoverAccountInvalid_msg")
			if (e instanceof LockedError) await Dialog.message("operationStillActive_msg")
			return false
		}
	}
}

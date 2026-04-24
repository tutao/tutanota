import { AccountDeletionPageState } from "../DeleteAccountDialogNew"
import m, { Children, Component, Vnode } from "mithril"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { PrimaryButton } from "../../../gui/base/buttons/VariantButtons"
import { neverNull } from "@tutao/tutanota-utils"
import { lang } from "../../../misc/LanguageViewModel"
import { SurveyData } from "../../../api/entities/sys/TypeRefs"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"
import { Dialog } from "../../../gui/base/Dialog"
import { locator } from "../../../api/main/CommonLocator"
import { CloseEventBusOption } from "../../../api/common/TutanotaConstants"
import { InvalidDataError, LockedError, PreconditionFailedError } from "../../../api/common/error/RestError"
import { showProgressDialog } from "../../../gui/dialogs/ProgressDialog"

type Props = {
	data: AccountDeletionPageState
}
export class AccountDeletionPage implements Component<Props> {
	private password = ""
	view({
		attrs: {
			data: { takeOverMailAddress, primaryMailAddress, userPassword },
		},
	}: Vnode<Props>): Children {
		return m(".pt-16.pb-16.plr-8.normal-font-size", [
			m(TitleSection, {
				icon: Icons.QuestionmarkFilled,
				title: "",
				subTitle: m(".normal-font-size", lang.getTranslation("accountDeletionFinalQuestion_msg", { "{mailAddress}": primaryMailAddress }).text),
			}),
			m(".pt-16", [
				m(PrimaryButton, {
					label: "adminDeleteAccount_action",
					class: "flex-grow",
					onclick: () => deleteAccount(takeOverMailAddress, userPassword),
				}),
				takeOverMailAddress
					? m(".smaller .pt-8", lang.getTranslation("addressAddedTo_msg", { "{mailAddress}": takeOverMailAddress }).text)
					: m(".smaller .pt-8", lang.getTranslation("addressCantBeReused_msg").text),
			]),
		])
	}
}

async function deleteAccount(takeover: string, password: string, surveyData: SurveyData | null = null) {
	const cleanedTakeover = takeover === "" ? "" : getCleanedMailAddress(takeover)
	// this is necessary to prevent us from applying websocket events to an already deleted/closed offline DB
	// which is an immediate crash on ios
	await locator.connectivityModel.close(CloseEventBusOption.Terminate)
	await showProgressDialog("pleaseWait_msg", locator.loginFacade.deleteAccount(password, neverNull(cleanedTakeover), surveyData))
		.then(() => m.route.set("/login"))
		.catch((e) => {
			if (e instanceof PreconditionFailedError) Dialog.message("passwordWrongInvalid_msg")
			if (e instanceof InvalidDataError) Dialog.message("takeoverAccountInvalid_msg")
			if (e instanceof LockedError) Dialog.message("operationStillActive_msg")
		})
}

import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Checkbox } from "../../../common/gui/base/Checkbox.js"
import { lang } from "../../../common/misc/LanguageViewModel"
import m from "mithril"
import { MailReportType, ReportMovedMailsType } from "../../../common/api/common/TutanotaConstants"
import { ButtonAttrs, ButtonType } from "../../../common/gui/base/Button.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import type { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { showSnackBar } from "../../../common/gui/base/SnackBar"
import { MailModel } from "../model/MailModel.js"

import { newPromise } from "@tutao/tutanota-utils/dist/Utils"

function confirmMailReportDialog(mailModel: MailModel, mailboxDetails: MailboxDetail): Promise<boolean> {
	return newPromise((resolve) => {
		let shallRememberDecision = false
		const child = () =>
			m(Checkbox, {
				label: () => lang.get("rememberDecision_msg"),
				checked: shallRememberDecision,
				onChecked: (v) => (shallRememberDecision = v),
				helpLabel: "changeMailSettings_msg",
			})

		async function updateSpamReportSetting(areMailsReported: boolean) {
			if (shallRememberDecision) {
				const reportMovedMails = areMailsReported ? ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM : ReportMovedMailsType.NEVER
				await mailModel.saveReportMovedMails(mailboxDetails.mailboxGroupRoot, reportMovedMails)
			}

			resolve(areMailsReported)
			dialog.close()
		}

		const yesButton: ButtonAttrs = {
			label: "yes_label",
			click: () => updateSpamReportSetting(true),
			type: ButtonType.Primary,
		}
		const noButton: ButtonAttrs = {
			label: "no_label",
			click: () => updateSpamReportSetting(false),
			type: ButtonType.Secondary,
		}

		// onclose is called when dialog is closed by ESC or back button. In this case we don't want to report spam.
		const onclose = () => {
			resolve(false)
		}

		const dialog = Dialog.confirmMultiple(
			lang.makeTranslation("unencryptedTransmission_msg", lang.get("unencryptedTransmission_msg") + " " + lang.get("allowOperation_msg")),
			[noButton, yesButton],
			onclose,
			child,
		)
	})
}

/**
 * Check if the user wants to report mails as spam when they are moved to the spam folder and report them.
 * May open a dialog for confirmation and otherwise shows a Snackbar before reporting to the server.
 */
export async function reportMailsAutomatically(
	mailReportType: MailReportType,
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	mailboxDetails: MailboxDetail,
	mails: () => Promise<ReadonlyArray<Mail>>,
	skipShowingSnackbar: boolean = false,
): Promise<void> {
	const shouldReportMails = await getReportConfirmation(mailReportType, mailboxModel, mailModel, mailboxDetails)
	if (shouldReportMails) {
		await actuallyReportMails(mailReportType, mailModel, mails, skipShowingSnackbar)
	}
}

export async function getReportConfirmation(
	mailReportType: MailReportType,
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	mailboxDetails: MailboxDetail,
): Promise<boolean> {
	if (mailReportType !== MailReportType.SPAM) {
		return false
	}

	const mailboxProperties = await mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	let isReportable = false

	if (!mailboxProperties || mailboxProperties.reportMovedMails === ReportMovedMailsType.ALWAYS_ASK) {
		isReportable = await confirmMailReportDialog(mailModel, mailboxDetails)
	} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM) {
		isReportable = true
	} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.NEVER) {
		// no report
	}

	return isReportable
}

export async function actuallyReportMails(
	mailReportType: MailReportType,
	mailModel: MailModel,
	mails: () => Promise<ReadonlyArray<Mail>>,
	skipShowingSnackbar: boolean = false,
): Promise<void> {
	// decides if a snackbar is shown to prevent the server request
	if (skipShowingSnackbar) {
		mailModel.reportMails(mailReportType, mails)
	} else {
		let undoClicked = false
		showSnackBar({
			message: "undoMailReport_msg",
			button: {
				label: "cancel_action",
				click: () => (undoClicked = true),
			},
			onClose: () => {
				if (!undoClicked) {
					mailModel.reportMails(mailReportType, mails)
				}
			},
		})
	}
}

import type {MailboxProperties} from "../../api/entities/tutanota/TypeRefs.js"
import stream from "mithril/stream"
import type {CheckboxAttrs} from "../../gui/base/CheckboxN"
import {CheckboxN} from "../../gui/base/CheckboxN"
import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import {MailReportType, ReportMovedMailsType} from "../../api/common/TutanotaConstants"
import {loadMailboxProperties, saveReportMovedMails} from "../../misc/MailboxPropertiesUtils"
import {ButtonAttrs, ButtonType} from "../../gui/base/ButtonN"
import {Dialog} from "../../gui/base/Dialog"
import type {MailModel} from "../model/MailModel"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {showSnackBar} from "../../gui/base/SnackBar"

function confirmMailReportDialog(mailboxProperties: MailboxProperties | null): Promise<boolean> {
	return new Promise(resolve => {
		let shallRememberDecision = false
		const rememberDecisionCheckboxAttrs: CheckboxAttrs = {
			label: () => lang.get("rememberDecision_msg"),
			checked: shallRememberDecision,
			onChecked: (v) => shallRememberDecision = v,
			helpLabel: () => lang.get("changeMailSettings_msg"),
		}

		const child = () => m(CheckboxN, rememberDecisionCheckboxAttrs)

		function updateSpamReportSetting(areMailsReported: boolean) {
			if (shallRememberDecision) {
				const reportMovedMails = areMailsReported ? ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM : ReportMovedMailsType.NEVER
				saveReportMovedMails(mailboxProperties, reportMovedMails)
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
			() => lang.get("unencryptedTransmission_msg") + " " + lang.get("allowOperation_msg"),
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
export async function reportMailsAutomatically(mailReportType: MailReportType, mailModel: MailModel, mails: ReadonlyArray<Mail>): Promise<void> {
	if (mailReportType !== MailReportType.SPAM) {
		return
	}

	const mailboxProperties = await loadMailboxProperties()
	let allowUndoing = true // decides if a snackbar is shown to prevent the server request

	let isReportable = false

	if (!mailboxProperties || mailboxProperties.reportMovedMails === ReportMovedMailsType.ALWAYS_ASK) {
		isReportable = await confirmMailReportDialog(mailboxProperties)
		allowUndoing = false
	} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM) {
		isReportable = true
	} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.NEVER) {
		// no report
	}

	if (isReportable) {
		// only show the snackbar to undo the report if the user was not asked already
		if (allowUndoing) {
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
				}
			})
		} else {
			mailModel.reportMails(mailReportType, mails)
		}
	}
}
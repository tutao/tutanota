import stream from "mithril/stream"
import { TextField, TextFieldType } from "../gui/base/TextField.js"
import { lang } from "./LanguageViewModel"
import { Dialog, DialogType } from "../gui/base/Dialog"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import m from "mithril"
import { Checkbox } from "../gui/base/Checkbox.js"
import { Button, ButtonType } from "../gui/base/Button.js"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander"
import { downcast, ErrorInfo, errorToString, neverNull, typedKeys, uint8ArrayToString } from "@tutao/tutanota-utils"
import { locator } from "../api/main/MainLocator"
import { AccountType, ConversationType, Keys, MailMethod } from "../api/common/TutanotaConstants"
import { copyToClipboard } from "./ClipboardUtils"
import { px } from "../gui/size"
import { isApp, isDesktop, Mode } from "../api/common/Env"
import { RecipientType } from "../api/common/recipients/Recipient.js"
import { Attachment } from "../mail/editor/SendMailModel.js"
import { createLogFile } from "../api/common/Logger.js"
import { DataFile } from "../api/common/DataFile.js"

type FeedbackContent = {
	message: string
	subject: string
	logs: Array<Attachment>
}

export async function promptForFeedbackAndSend(e: ErrorInfo): Promise<{ ignored: boolean }> {
	const loggedIn = locator.logins.isUserLoggedIn()
	let ignoreChecked = false
	let sendLogs = true
	const logs = await getLogAttachments()

	return new Promise((resolve) => {
		const preparedContent = prepareFeedbackContent(e, loggedIn)
		const detailsExpanded = stream(false)
		let userMessage = ""
		let errorOkAction = (dialog: Dialog) => {
			preparedContent.message = userMessage + "\n" + preparedContent.message
			resolve(preparedContent)
			dialog.close()
		}

		notificationOverlay.show(
			{
				view: () =>
					m("", [
						"An error occurred",
						m(Checkbox, {
							label: () => "Ignore the error for this session",
							checked: ignoreChecked,
							onChecked: (checked) => (ignoreChecked = checked),
						}),
					]),
			},
			{
				label: "close_alt",
				click: () => resolve(null),
			},
			[
				{
					label: () => "Send report",
					click: () => showReportDialog(),
					type: ButtonType.Secondary,
				},
			],
		)

		function showReportDialog() {
			Dialog.showActionDialog({
				okActionTextId: "send_action",
				title: lang.get("sendErrorReport_action"),
				type: DialogType.EditMedium,
				child: {
					view: () => {
						return [
							m(TextField, {
								label: "yourMessage_label",
								helpLabel: () => lang.get("feedbackOnErrorInfo_msg"),
								value: userMessage,
								type: TextFieldType.Area,
								oninput: (value) => (userMessage = value),
							}),
							m(Checkbox, {
								label: () => lang.get("sendLogs_action"),
								helpLabel: () => lang.get("sendLogsInfo_msg"),
								checked: sendLogs,
								onChecked: (checked) => (sendLogs = checked),
							}),
							m(
								".flex.flex-column.space-around.items-center",
								logs.map((l) =>
									m(Button, {
										label: () => l.name,
										type: ButtonType.Bubble,
										click: () => showLogDialog(l.name, uint8ArrayToString("utf-8", (l as DataFile).data)),
									}),
								),
							),
							m(
								".flex-end",
								m(
									".right",
									m(ExpanderButton, {
										label: "details_label",
										expanded: detailsExpanded(),
										onExpandedChange: detailsExpanded,
									}),
								),
							),
							m(
								ExpanderPanel,
								{
									expanded: detailsExpanded(),
								},
								m(".selectable", [
									m(".selectable", preparedContent.subject),
									preparedContent.message.split("\n").map((l) => (l.trim() === "" ? m(".pb", "") : m("", l))),
								]),
							),
						]
					},
				},
				okAction: errorOkAction,
				cancelAction: () => resolve(null),
			})
		}
	}).then((content: FeedbackContent) => {
		const ret = { ignored: ignoreChecked }
		if (!content) return ret
		if (sendLogs) content.logs = logs
		else content.logs = []
		sendFeedbackMail(content)
		return ret
	})
}

/**
 * show the contents of a log file in a large dialog.
 * @param heading the title of the dialog
 * @param text the text to display
 */
async function showLogDialog(heading: string, text: string) {
	let logDialog: Dialog
	const closeLogDialog = () => logDialog?.close()

	logDialog = Dialog.largeDialog(
		{
			right: [
				{
					label: "ok_action",
					click: closeLogDialog,
					type: ButtonType.Secondary,
				},
			],
			middle: () => heading,
		},
		{
			view: () => m(".white-space-pre.pt.pb.selectable", text),
		},
	)
		.addShortcut({
			key: Keys.ESC,
			exec: closeLogDialog,
			help: "close_alt",
		})
		.setCloseHandler(closeLogDialog)
		.show()
}

export async function showErrorDialogNotLoggedIn(e: ErrorInfo): Promise<void> {
	const content = prepareFeedbackContent(e, false)
	const expanded = stream(false)
	const message = content.subject + "\n\n" + content.message

	const info = () => [
		m(
			".flex.col.items-end.plr",
			{
				style: {
					marginTop: "-16px",
				},
			},
			[
				m(
					"div.mr-negative-xs",
					m(ExpanderButton, {
						expanded: expanded(),
						onExpandedChange: expanded,
						label: "showMore_action",
					}),
				),
			],
		),
		m(
			ExpanderPanel,
			{
				expanded: expanded(),
			},
			[
				m(
					".flex-end.plr",
					m(Button, {
						label: "copy_action",
						click: () => copyToClipboard(message),
						type: ButtonType.Secondary,
					}),
				),
				m(
					".plr.selectable.pb.scroll.text-pre",
					{
						style: {
							height: px(200),
						},
					},
					message,
				),
			],
		),
	]

	return Dialog.message("unknownError_msg", info)
}

export async function sendFeedbackMail(content: FeedbackContent): Promise<void> {
	const name = ""
	const mailAddress = "reports@tutao.de"
	// We want to treat what we have as text, not as HTML so we escape it. This is an easy way to do it.
	const escapedBody = new Option(content.message).innerHTML
	const logins = locator.logins
	const draft = await locator.mailFacade.createDraft({
		subject: content.subject,
		bodyText: escapedBody.split("\n").join("<br>"),
		senderMailAddress: neverNull(logins.getUserController().userGroupInfo.mailAddress),
		senderName: "",
		toRecipients: [
			{
				name,
				address: mailAddress,
			},
		],
		ccRecipients: [],
		bccRecipients: [],
		conversationType: ConversationType.NEW,
		previousMessageId: null,
		attachments: content.logs,
		confidential: true,
		replyTos: [],
		method: MailMethod.NONE,
	})
	await locator.mailFacade.sendDraft(
		draft,
		[
			{
				name,
				address: mailAddress,
				type: RecipientType.INTERNAL,
				contact: null,
			},
		],
		"de",
	)
}

function prepareFeedbackContent(error: ErrorInfo, loggedIn: boolean): FeedbackContent {
	const timestamp = new Date()
	let { message, client, type } = clientInfoString(timestamp, loggedIn)

	if (error) {
		message += errorToString(error)
	}

	const subject = `Feedback v${env.versionNumber} - ${error && error.name ? error.name : "?"} - ${type} - ${client}`
	return {
		message,
		subject,
		logs: [],
	}
}

export function clientInfoString(
	timestamp: Date,
	loggedIn: boolean,
): {
	message: string
	client: string
	type: string
} {
	const type = loggedIn
		? neverNull(typedKeys(AccountType).find((typeName) => AccountType[typeName] === locator.logins.getUserController().user.accountType))
		: "UNKNOWN"

	const client = (() => {
		switch (env.mode) {
			case Mode.Browser:
			case Mode.Test:
				return env.mode
			default:
				return env.platformId ?? ""
		}
	})()

	let message = `\n\n Client: ${client}`
	message += `\n Type: ${type}`
	message += `\n Tutanota version: ${env.versionNumber}`
	message += `\n Timestamp (UTC): ${timestamp.toUTCString()}`
	message += `\n User agent:\n${navigator.userAgent}` + "\n"
	return {
		message,
		client,
		type,
	}
}

export async function getLogAttachments(timestamp?: Date): Promise<Array<Attachment>> {
	const logs: Array<Attachment> = []
	const global = downcast<Window>(window)

	if (global.logger) {
		const mainEntries = global.logger.getEntries()
		const mainLogFile = createLogFile(mainEntries.join("\n"), "main", timestamp?.getTime())
		logs.push(mainLogFile)
		const workerLogEntries = await locator.workerFacade.getLog()
		const workerLogFile = await createLogFile(workerLogEntries.join("\n"), "worker", timestamp?.getTime())
		logs.push(workerLogFile)
	}

	if (isDesktop() || isApp()) {
		const nativeLog = await locator.commonSystemFacade.getLog()
		const nativeLogFile = createLogFile(nativeLog, isDesktop() ? "desktop" : "device", timestamp?.getTime())
		logs.push(nativeLogFile)
	}

	return logs
}

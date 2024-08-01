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
import { locator } from "../api/main/CommonLocator"
import { AccountType, ConversationType, Keys, MailMethod } from "../api/common/TutanotaConstants"
import { copyToClipboard } from "./ClipboardUtils"
import { px } from "../gui/size"
import { isApp, isDesktop, Mode } from "../api/common/Env"
import { RecipientType } from "../api/common/recipients/Recipient.js"
import { createLogFile } from "../api/common/Logger.js"
import { DataFile } from "../api/common/DataFile.js"
import { convertTextToHtml } from "./Formatter.js"
import { ReportErrorService } from "../api/entities/monitor/Services.js"
import { createErrorReportData, createErrorReportFile, createReportErrorIn } from "../api/entities/monitor/TypeRefs.js"
import { ErrorReportClientType } from "./ClientConstants.js"
import { client } from "./ClientDetector.js"
import { BubbleButton } from "../gui/base/buttons/BubbleButton.js"

type FeedbackContent = {
	message: string
	subject: string
	logs: Array<DataFile>
}

/**
 * Displays a notification overlay that some error has occurred with an option to send an error report or dismiss the notification. In either case the
 * error can be ignored.
 *
 * If report is pressed then it shows a report dialog with message field and an overview of the sent data.
 */
export async function showErrorNotification(e: ErrorInfo): Promise<{ ignored: boolean }> {
	const loggedIn = locator.logins.isUserLoggedIn()

	const logs = await getLogAttachments()

	const { decision, ignore } = await showErrorOverlay()
	if (decision === "cancel") {
		return { ignored: ignore }
	}

	const preparedContent = prepareFeedbackContent(e, loggedIn)

	const reportDialogResult = await showReportDialog(preparedContent.subject, preparedContent.message, logs)
	if (reportDialogResult.decision === "cancel") {
		return { ignored: ignore }
	}
	preparedContent.logs = reportDialogResult.sendLogs ? logs : []
	preparedContent.message = reportDialogResult.userMessage + "\n" + preparedContent.message

	sendToServer(e, reportDialogResult.userMessage, reportDialogResult.sendLogs ? logs : [])
	sendFeedbackMail(preparedContent)

	return { ignored: ignore }
}

async function showErrorOverlay(): Promise<{ decision: "send" | "cancel"; ignore: boolean }> {
	let ignore = false
	const decision: "send" | "cancel" = await new Promise((resolve) => {
		notificationOverlay.show(
			{
				view: () =>
					m("", [
						"An error occurred",
						m(Checkbox, {
							label: () => "Ignore the error for this session",
							checked: ignore,
							onChecked: (checked) => (ignore = checked),
						}),
					]),
			},
			{
				label: "close_alt",
				click: () => resolve("cancel"),
			},
			[
				{
					label: () => "Send report",
					click: () => resolve("send"),
					type: ButtonType.Secondary,
				},
			],
		)
	})
	return { decision, ignore }
}

function showReportDialog(
	subject: string,
	message: string,
	logs: readonly DataFile[],
): Promise<{ decision: "send"; sendLogs: boolean; userMessage: string } | { decision: "cancel" }> {
	let sendLogs = true
	let detailsExpanded = false
	let userMessage = ""

	const dialogContent = {
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
						m(BubbleButton, {
							label: () => l.name,
							onclick: () => showLogDialog(l.name, uint8ArrayToString("utf-8", (l as DataFile).data)),
						}),
					),
				),
				m(
					".flex-end",
					m(
						".right",
						m(ExpanderButton, {
							label: "details_label",
							expanded: detailsExpanded,
							onExpandedChange: (expanded) => (detailsExpanded = expanded),
						}),
					),
				),
				m(
					ExpanderPanel,
					{
						expanded: detailsExpanded,
					},
					m(".selectable", [m(".selectable", subject), message.split("\n").map((l) => (l.trim() === "" ? m(".pb", "") : m("", l)))]),
				),
			]
		},
	}

	return new Promise((resolve) => {
		Dialog.showActionDialog({
			okActionTextId: "send_action",
			title: lang.get("sendErrorReport_action"),
			type: DialogType.EditMedium,
			child: dialogContent,
			okAction: (dialog: Dialog) => {
				resolve({ decision: "send", sendLogs, userMessage })
				dialog.close()
			},
			cancelAction: () => resolve({ decision: "cancel" }),
		})
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
		bodyText: convertTextToHtml(escapedBody),
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

async function sendToServer(error: ErrorInfo, userMessage: string | null, logs: DataFile[]) {
	function getReportingClientType(): ErrorReportClientType {
		if (env.mode === Mode.Browser) {
			return ErrorReportClientType.Browser
		} else {
			switch (env.platformId) {
				case "ios":
					return ErrorReportClientType.Ios
				case "android":
					return ErrorReportClientType.Android
				case "darwin":
					return ErrorReportClientType.MacOS
				case "linux":
					return ErrorReportClientType.Linux
				case "win32":
					return ErrorReportClientType.Windows
				default:
					return ErrorReportClientType.Linux
			}
		}
	}

	const clientType = getReportingClientType()

	const errorData = createReportErrorIn({
		data: createErrorReportData({
			clientType,
			appVersion: env.versionNumber,
			userId: locator.logins.getUserController().userId,
			errorClass: error.name ?? "?",
			errorMessage: error.message,
			userMessage: userMessage,
			stackTrace: error.stack ?? "",
			additionalInfo: client.userAgent,
			time: new Date(),
		}),
		files: logs.map((log) => {
			const stringData = uint8ArrayToString("utf-8", log.data)
			return createErrorReportFile({
				name: log.name,
				content: stringData,
			})
		}),
	})
	await locator.serviceExecutor.post(ReportErrorService, errorData)
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

export async function getLogAttachments(timestamp?: Date): Promise<Array<DataFile>> {
	const logs: Array<DataFile> = []
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

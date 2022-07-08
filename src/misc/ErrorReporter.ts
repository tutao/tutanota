import {logins} from "../api/main/LoginController"
import stream from "mithril/stream"
import {TextField, TextFieldType} from "../gui/base/TextField.js"
import {lang} from "./LanguageViewModel"
import {Dialog, DialogType} from "../gui/base/Dialog"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import m from "mithril"
import {Checkbox} from "../gui/base/Checkbox.js"
import {Button, ButtonType} from "../gui/base/Button.js"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {errorToString, neverNull, typedKeys} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"
import {AccountType, ConversationType, MailMethod} from "../api/common/TutanotaConstants"
import {copyToClipboard} from "./ClipboardUtils"
import {px} from "../gui/size"
import {Mode} from "../api/common/Env"
import {RecipientType} from "../api/common/recipients/Recipient.js"
import {ErrorInfo} from "@tutao/tutanota-utils"

type FeedbackContent = {
	message: string
	subject: string
}

export function promptForFeedbackAndSend(e: ErrorInfo): Promise<{ignored: boolean}> {
	const loggedIn = logins.isUserLoggedIn()
	let ignoreChecked = false

	return new Promise(resolve => {
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
							onChecked: (checked) => {
								ignoreChecked = checked
							}
						}),
					]),
			},
			{
				label: "close_alt",
				click: () => {
					resolve(null)
				},
			},
			[
				{
					label: () => "Send report",
					click: () => {
						showReportDialog()
					},
					type: ButtonType.Secondary,
				},
			],
		)

		function showReportDialog() {
			Dialog.showActionDialog({
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
								oninput: value => {
									userMessage = value
								},
							}),
							m(
								".flex-end",
								m(
									".right",
									m(ExpanderButtonN, {
										label: "details_label",
										expanded: detailsExpanded(),
										onExpandedChange: detailsExpanded,
									}),
								),
							),
							m(
								ExpanderPanelN,
								{
									expanded: detailsExpanded(),
								},
								m(".selectable", [
									m(".selectable", preparedContent.subject),
									preparedContent.message.split("\n").map(l => (l.trim() === "" ? m(".pb-m", "") : m("", l))),
								]),
							),
						]
					},
				},
				okAction: errorOkAction,
				cancelAction: () => {
					resolve(null)
				},
			})
		}
	}).then(content => {
		if (content) {
			sendFeedbackMail(content as FeedbackContent)
		}
		return {ignored: ignoreChecked}
	})
}

export function showErrorDialogNotLoggedIn(e: ErrorInfo): Promise<void> {
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
					m(ExpanderButtonN, {
						expanded: expanded(),
						onExpandedChange: expanded,
						label: "showMore_action",
					}),
				),
			],
		),
		m(
			ExpanderPanelN,
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
	const draft = await locator.mailFacade.createDraft(
		{
			subject: content.subject,
			bodyText: content.message.split("\n").join("<br>"),
			senderMailAddress: neverNull(logins.getUserController().userGroupInfo.mailAddress),
			senderName: "",
			toRecipients: [
				{
					name,
					address: mailAddress,

				}
			],
			ccRecipients: [],
			bccRecipients: [],
			conversationType: ConversationType.NEW,
			previousMessageId: null,
			attachments: [],
			confidential: true,
			replyTos: [],
			method: MailMethod.NONE
		},
	)
	await locator.mailFacade.sendDraft(
		draft,
		[
			{
				name,
				address: mailAddress,
				type: RecipientType.INTERNAL,
				contact: null
			},
		],
		"de",
	)
}

function prepareFeedbackContent(error: ErrorInfo, loggedIn: boolean): FeedbackContent {
	const timestamp = new Date()
	let {message, client, type} = clientInfoString(timestamp, loggedIn)

	if (error) {
		message += errorToString(error)
	}

	const subject = `Feedback v${env.versionNumber} - ${error && error.name ? error.name : "?"} - ${type} - ${client}`
	return {
		message,
		subject,
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
		? neverNull(typedKeys(AccountType).find(typeName => AccountType[typeName] === logins.getUserController().user.accountType))
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
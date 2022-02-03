import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	ConnectionError,
	InsufficientStorageError,
	InvalidSoftwareVersionError,
	NotAuthenticatedError,
	ServiceUnavailableError,
	SessionExpiredError,
} from "../api/common/error/RestError"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {TextFieldAttrs, TextFieldN, TextFieldType} from "../gui/base/TextFieldN"
import m from "mithril"
import {lang} from "./LanguageViewModel"
import {assertMainOrNode, Mode} from "../api/common/Env"
import {AccountType, ConversationType, MailMethod} from "../api/common/TutanotaConstants"
import {errorToString, neverNull, noOp, ofClass, typedKeys} from "@tutao/tutanota-utils"
import {logins, SessionType} from "../api/main/LoginController"
import {OutOfSyncError} from "../api/common/error/OutOfSyncError"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {IndexingNotSupportedError} from "../api/common/error/IndexingNotSupportedError"
import {windowFacade} from "./WindowFacade"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {locator} from "../api/main/MainLocator"
import {QuotaExceededError} from "../api/common/error/QuotaExceededError"
import {copyToClipboard} from "./ClipboardUtils"
import {px} from "../gui/size"
import {UserError} from "../api/main/UserError"
import {showMoreStorageNeededOrderDialog} from "./SubscriptionDialogs"
import {createDraftRecipient} from "../api/entities/tutanota/DraftRecipient"

assertMainOrNode()
type FeedbackContent = {
	message: string
	subject: string
}
let unknownErrorDialogActive = false
let notConnectedDialogActive = false
let invalidSoftwareVersionActive = false
let loginDialogActive = false
let isLoggingOut = false
let serviceUnavailableDialogActive = false
let shownQuotaError = false
let showingImportError = false
const ignoredMessages = ["webkitExitFullScreen", "googletag", "avast_submit"]

export function handleUncaughtError(e: Error) {
	if (isLoggingOut) {
		// ignore all errors while logging out
		return
	}

	// This is from the s.js and it shouldn't change. Unfortunately it is a plain Error.
	if (e.message.includes("(SystemJS https://git.io/JvFET#")) {
		handleImportError()
		return
	}

	if (e instanceof ConnectionError) {
		if (!notConnectedDialogActive) {
			notConnectedDialogActive = true

			var checkForMaintenance = function () {
				var img = document.createElement("img")

				img.onload = function () {
					Dialog.message("serverDownForMaintenance_msg").then(() => {
						notConnectedDialogActive = false
					})
				}

				img.onerror = function () {
					Dialog.message("serverNotReachable_msg").then(() => {
						notConnectedDialogActive = false
					})
				}

				img.src = "https://tutanota.com/images/maintenancecheck.png"
			}

			checkForMaintenance()
		}
	} else if (e instanceof InvalidSoftwareVersionError) {
		if (!invalidSoftwareVersionActive) {
			invalidSoftwareVersionActive = true
			Dialog.message("outdatedClient_msg").then(() => (invalidSoftwareVersionActive = false))
		}
	} else if (
		e instanceof NotAuthenticatedError ||
		e instanceof AccessBlockedError ||
		e instanceof AccessDeactivatedError ||
		e instanceof AccessExpiredError
	) {
		// If we session is closed (e.g. password is changed) we log user out forcefully so we reload the page
		if (!loginDialogActive) {
			windowFacade.reload({})
		}
	} else if (e instanceof SessionExpiredError) {
		if (!loginDialogActive) {
			locator.loginFacade.resetSession()
			loginDialogActive = true
			const errorMessage: Stream<string> = stream(lang.get("emptyString_msg"))
			Dialog.showRequestPasswordDialog(errorMessage, {
				allowCancel: false,
			}).map(pw => {
				// SessionType is Login because it can (seemingly) only happen for long-running (normal) sessions.
				showProgressDialog(
					"pleaseWait_msg",
					logins.createSession(neverNull(logins.getUserController().userGroupInfo.mailAddress), pw, SessionType.Login),
				)
					.then(() => {
						errorMessage("")
						loginDialogActive = false
					})
					.catch(ofClass(AccessBlockedError, e => errorMessage(lang.get("loginFailedOften_msg"))))
					.catch(ofClass(NotAuthenticatedError, e => errorMessage(lang.get("loginFailed_msg"))))
					.catch(ofClass(AccessDeactivatedError, e => errorMessage(lang.get("loginFailed_msg"))))
					.catch(
						ofClass(ConnectionError, e => {
							errorMessage(lang.get("emptyString_msg"))
							throw e
						}),
					)
					.finally(() => locator.secondFactorHandler.closeWaitingForSecondFactorDialog())
			})
		}
	} else if (e instanceof OutOfSyncError) {
		Dialog.message("dataExpired_msg")
	} else if (e instanceof InsufficientStorageError) {
		if (logins.getUserController().isGlobalAdmin()) {
			showMoreStorageNeededOrderDialog(logins, "insufficientStorageAdmin_msg")
		} else {
			const errorMessage = () => lang.get("insufficientStorageUser_msg") + " " + lang.get("contactAdmin_msg")

			Dialog.message(errorMessage)
		}
	} else if (e instanceof ServiceUnavailableError) {
		if (!serviceUnavailableDialogActive) {
			serviceUnavailableDialogActive = true
			Dialog.message("serviceUnavailable_msg").then(() => {
				serviceUnavailableDialogActive = false
			})
		}
	} else if (e instanceof IndexingNotSupportedError) {
		console.log("Indexing not supported", e)
		locator.search.indexingSupported = false
	} else if (e instanceof QuotaExceededError) {
		if (!shownQuotaError) {
			shownQuotaError = true
			Dialog.message("storageQuotaExceeded_msg")
		}
	} else if (ignoredError(e)) {
		// ignore, this is not our code
	} else {
		if (!unknownErrorDialogActive) {
			unknownErrorDialogActive = true

			// only logged in users can report errors
			if (logins.isUserLoggedIn()) {
				promptForFeedbackAndSend(e)
			} else {
				console.log("Unknown error", e)
				showErrorDialogNotLoggedIn(e)
			}
		}
	}
}

function ignoredError(e: Error): boolean {
	return e.message != null && ignoredMessages.some(s => e.message.includes(s))
}

export function promptForFeedbackAndSend(e: Error): Promise<FeedbackContent | void> {
	const loggedIn = logins.isUserLoggedIn()
	return new Promise(resolve => {
		const preparedContent = prepareFeedbackContent(e, loggedIn)
		const detailsExpanded = stream(false)
		let userMessage = ""
		const userMessageTextFieldAttrs: TextFieldAttrs = {
			label: "yourMessage_label",
			helpLabel: () => lang.get("feedbackOnErrorInfo_msg"),
			value: stream(userMessage),
			type: TextFieldType.Area,
			oninput: value => (userMessage = value),
		}

		let errorOkAction = (dialog: Dialog) => {
			unknownErrorDialogActive = false
			preparedContent.message = userMessage + "\n" + preparedContent.message
			resolve(preparedContent)
			dialog.close()
		}

		const ignoreChecked = stream<boolean>()
		notificationOverlay.show(
			{
				view: () =>
					m("", [
						"An error occurred",
						m(CheckboxN, {
							label: () => "Ignore the error for this session",
							checked: ignoreChecked,
						}),
					]),
			},
			{
				label: "close_alt",
				click: () => {
					addToIgnored()
					unknownErrorDialogActive = false
					resolve(null)
				},
			},
			[
				{
					label: () => "Send report",
					click: () => {
						addToIgnored()
						showReportDialog()
					},
					type: ButtonType.Secondary,
				},
			],
		)

		function addToIgnored() {
			if (ignoreChecked()) {
				ignoredMessages.push(e.message)
			}
		}

		function showReportDialog() {
			Dialog.showActionDialog({
				title: lang.get("sendErrorReport_action"),
				type: DialogType.EditMedium,
				child: {
					view: () => {
						return [
							m(TextFieldN, userMessageTextFieldAttrs),
							m(
								".flex-end",
								m(
									".right",
									m(ExpanderButtonN, {
										label: "details_label",
										expanded: detailsExpanded,
									}),
								),
							),
							m(
								ExpanderPanelN,
								{
									expanded: detailsExpanded,
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
					unknownErrorDialogActive = false
					resolve(null)
				},
			})
		}
	}).then(content => {
		if (content) {
			sendFeedbackMail(content as FeedbackContent)
		}
	})
}

function prepareFeedbackContent(error: Error, loggedIn: boolean): FeedbackContent {
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
				createDraftRecipient({
					name,
					mailAddress,
				}),
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
				mailAddress,
				password: "",
				isExternal: false,
			},
		],
		"de",
	)
}

/**
 * Trying to handle errors during logout can cause unhandled error loops, so we just want to ignore them
 */
export function disableErrorHandlingDuringLogout() {
	isLoggingOut = true
	showProgressDialog("loggingOut_msg", new Promise(noOp))
}

function showErrorDialogNotLoggedIn(e: Error) {
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
						expanded,
						label: "showMore_action",
					}),
				),
			],
		),
		m(
			ExpanderPanelN,
			{
				expanded,
			},
			[
				m(
					".flex-end.plr",
					m(ButtonN, {
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

	Dialog.message("unknownError_msg", info).then(() => {
		unknownErrorDialogActive = false
	})
}

function handleImportError() {
	if (showingImportError) {
		return
	}

	showingImportError = true
	const message =
		"There was an error while loading part of the app. It might be that you are offline, running an outdated version, or your browser is blocking the request."
	Dialog.choice(() => message, [
		{
			text: "close_alt",
			value: false,
		},
		{
			text: "reloadPage_action",
			value: true,
		},
	]).then(reload => {
		showingImportError = false

		if (reload) {
			windowFacade.reload({})
		}
	})
}

if (typeof window !== "undefined") {
	// @ts-ignore
	window.tutao.testError = () => handleUncaughtError(new Error("test error!"))
}

export function showUserError(error: UserError): Promise<void> {
	return Dialog.message(() => error.message)
}
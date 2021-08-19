// @flow
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	ConnectionError,
	InsufficientStorageError,
	InvalidSoftwareVersionError,
	NotAuthenticatedError,
	ServiceUnavailableError,
	SessionExpiredError
} from "../api/common/error/RestError"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import m from "mithril"
import {lang} from "./LanguageViewModel"
import {assertMainOrNode, Mode} from "../api/common/Env"
import {AccountType, ConversationType, MailMethod} from "../api/common/TutanotaConstants"
import {errorToString, neverNull, noOp} from "../api/common/utils/Utils"
import {logins} from "../api/main/LoginController"
import {client} from "./ClientDetector"
import {OutOfSyncError} from "../api/common/error/OutOfSyncError"
import stream from "mithril/stream/stream.js"
import {SecondFactorPendingError} from "../api/common/error/SecondFactorPendingError"
import {secondFactorHandler} from "./SecondFactorHandler"
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
import {showMoreStorageNeededOrderDialog} from "./SubscriptionDialogs";
import {ofClass} from "../api/common/utils/PromiseUtils"
import {createDraftRecipient} from "../api/entities/tutanota/DraftRecipient"

assertMainOrNode()

type FeedbackContent = {|
	message: string,
	subject: string
|}

let unknownErrorDialogActive = false
let notConnectedDialogActive = false
let invalidSoftwareVersionActive = false
let loginDialogActive = false
let isLoggingOut = false
let serviceUnavailableDialogActive = false
let shownQuotaError = false
let showingImportError = false

const ignoredMessages = [
	"webkitExitFullScreen",
	"googletag",
	"avast_submit"
]

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
					Dialog.error("serverDownForMaintenance_msg").then(() => {
						notConnectedDialogActive = false
					})
				}
				img.onerror = function () {
					Dialog.error("serverNotReachable_msg").then(() => {
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
			Dialog.error("outdatedClient_msg").then(() => invalidSoftwareVersionActive = false)
		}
	} else if (e instanceof NotAuthenticatedError || e instanceof AccessBlockedError || e
		instanceof AccessDeactivatedError || e instanceof AccessExpiredError) {
		if (!loginDialogActive) {
			windowFacade.reload({})
		}
	} else if (e instanceof SessionExpiredError) {
		if (!loginDialogActive) {
			worker.resetSession()
			loginDialogActive = true
			const errorMessage: Stream<string> = stream(lang.get("emptyString_msg"))
			Dialog.showRequestPasswordDialog(errorMessage, {allowCancel: false})
			      .map(pw => {
					      showProgressDialog("pleaseWait_msg",
						      logins.createSession(neverNull(logins.getUserController().userGroupInfo.mailAddress),
							      pw, client.getIdentifier(), false, true))
						      .then(() => {
							      errorMessage("")
							      loginDialogActive = false
						      })
						      .catch(ofClass(AccessBlockedError, e => errorMessage(lang.get('loginFailedOften_msg'))))
						      .catch(ofClass(NotAuthenticatedError, e => errorMessage(lang.get('loginFailed_msg'))))
						      .catch(ofClass(AccessDeactivatedError, e => errorMessage(lang.get('loginFailed_msg'))))
						      .catch(ofClass(ConnectionError, e => {
							      errorMessage(lang.get('emptyString_msg'))
							      throw e
						      }))
						      .finally(() => secondFactorHandler.closeWaitingForSecondFactorDialog())
				      }
			      )
		}
	} else if (e instanceof SecondFactorPendingError) {
		secondFactorHandler.showWaitingForSecondFactorDialog(e.data.sessionId, e.data.challenges, e.data.mailAddress)
	} else if (e instanceof OutOfSyncError) {
		Dialog.error("dataExpired_msg")
	} else if (e instanceof InsufficientStorageError) {
		if (logins.getUserController().isGlobalAdmin()) {
			showMoreStorageNeededOrderDialog(logins, "insufficientStorageAdmin_msg")
		} else {
			const errorMessage = () => lang.get("insufficientStorageUser_msg") + " " + lang.get("contactAdmin_msg")
			Dialog.error(errorMessage)
		}
	} else if (e instanceof ServiceUnavailableError) {
		if (!serviceUnavailableDialogActive) {
			serviceUnavailableDialogActive = true;
			Dialog.error("serviceUnavailable_msg").then(() => {
				serviceUnavailableDialogActive = false;
			})
		}
	} else if (e instanceof IndexingNotSupportedError) {
		console.log("Indexing not supported", e)
		locator.search.indexingSupported = false
	} else if (e instanceof QuotaExceededError) {
		if (!shownQuotaError) {
			shownQuotaError = true
			Dialog.error("storageQuotaExceeded_msg")
		}
	} else if (ignoredError(e)) {// ignore, this is not our code
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

export function promptForFeedbackAndSend(e: Error): Promise<?FeedbackContent> {
	const loggedIn = logins.isUserLoggedIn()
	return new Promise(resolve => {
		const preparedContent = prepareFeedbackContent(e, loggedIn)
		const detailsExpanded = stream(false)

		let userMessage = ""
		const userMessageTextFieldAttrs = {
			label: "yourMessage_label",
			helpLabel: () => lang.get("feedbackOnErrorInfo_msg"),
			value: stream(userMessage),
			type: Type.Area,
			oninput: (value) => userMessage = value,
		}

		let errorOkAction = (dialog) => {
			unknownErrorDialogActive = false
			preparedContent.message = userMessage + "\n" + preparedContent.message
			resolve(preparedContent)
			dialog.close()
		}

		const ignoreChecked = stream()
		notificationOverlay.show({
				view: () =>
					m("", [
						"An error occurred",
						m(CheckboxN, {
							label: () => "Ignore the error for this session",
							checked: ignoreChecked
						})
					])
			},
			{
				label: "close_alt", click: () => {
					addToIgnored()
					unknownErrorDialogActive = false
					resolve()
				}
			},
			[
				{
					label: () => "Send report",
					click: () => {
						addToIgnored()
						showReportDialog()
					},
					type: ButtonType.Secondary
				}
			])

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
							m(".flex-end",
								m(".right",
									m(ExpanderButtonN, {
										label: "details_label",
										expanded: detailsExpanded,
									})
								)
							),
							m(ExpanderPanelN, {expanded: detailsExpanded},
								m(".selectable", [
									m(".selectable", preparedContent.subject),
									preparedContent.message.split("\n").map(l => l.trim() === "" ? m(".pb-m", "") : m("", l))
								]))
						]
					}
				},
				okAction: errorOkAction,
				cancelAction: () => {
					unknownErrorDialogActive = false
					resolve(null)
				}
			})
		}
	}).then(content => {
		if (content) {
			sendFeedbackMail(content)
		}
	})
}

function prepareFeedbackContent(error: Error, loggedIn: bool): FeedbackContent {
	const timestamp = new Date()
	let {message, client, type} = clientInfoString(timestamp, loggedIn)
	if (error) {
		message += errorToString(error)
	}
	const subject = `Feedback v${env.versionNumber} - ${(error && error.name) ? error.name : '?'} - ${type} - ${client}`
	return {
		message,
		subject
	}
}

export function clientInfoString(timestamp: Date, loggedIn: bool): {message: string, client: string, type: string} {
	const type = loggedIn
		? neverNull(Object.keys(AccountType)
		                  .find(typeName => (AccountType[typeName] === logins.getUserController().user.accountType)))
		: "UNKNOWN"
	const client = (() => {
		let client = env.platformId
		switch (env.mode) {
			case Mode.App:
			case Mode.Desktop:
				client = env.platformId
				break
			case Mode.Browser:
			case Mode.Test:
				client = env.mode
		}
		return client ? client : ""
	})()

	let message = `\n\n Client: ${client}`
	message += `\n Type: ${type}`
	message += `\n Tutanota version: ${env.versionNumber}`
	message += `\n Timestamp (UTC): ${timestamp.toUTCString()}`
	message += `\n User agent:\n${navigator.userAgent}` + "\n"
	return {message, client, type}
}


export async function sendFeedbackMail(content: FeedbackContent): Promise<void> {
	const name = ""
	const mailAddress = "reports@tutao.de"

	const draft = await worker.createMailDraft(
		content.subject,
		content.message.split("\n").join("<br>"),
		neverNull(logins.getUserController().userGroupInfo.mailAddress),
		"",
		[createDraftRecipient({name, mailAddress})],
		[],
		[],
		ConversationType.NEW,
		null,
		[],
		true,
		[],
		MailMethod.NONE,
	)
	await worker.sendMailDraft(draft, [{name, mailAddress, password: "", isExternal: false}], "de")
}

export function loggingOut() {
	isLoggingOut = true
	showProgressDialog("loggingOut_msg", new Promise(noOp))
}

function showErrorDialogNotLoggedIn(e) {
	const content = prepareFeedbackContent(e, false)
	const expanded = stream(false)
	const message = content.subject + "\n\n" + content.message
	const info = () => [
		m(".flex.col.items-end.plr", {
			style: {marginTop: "-16px"},
		}, [
			m("div.mr-negative-xs", m(ExpanderButtonN, {expanded, label: "showMore_action"})),
		]),
		m(ExpanderPanelN, {expanded}, [
			m(".flex-end.plr", m(ButtonN, {
					label: "copy_action",
					click: () => copyToClipboard(message),
					type: ButtonType.Secondary,
				}),
			),
			m(".plr.selectable.pb.scroll.text-pre", {style: {height: px(200)}}, message)
		])
	]
	Dialog.error("unknownError_msg", info).then(() => {
		unknownErrorDialogActive = false
	})
}

function handleImportError() {
	if (showingImportError) {
		return
	}
	showingImportError = true
	const message = "There was an error while loading part of the app. It might be that you are offline, running an outdated version, or your browser is blocking the request."
	Dialog.choice(
		() => message,
		[
			{text: "close_alt", value: false},
			{text: "reloadPage_action", value: true},
		]
	).then((reload) => {
		showingImportError = false
		if (reload) {
			windowFacade.reload({})
		}
	})
}

if (typeof window !== "undefined") {
	window.tutao.testError = () => handleUncaughtError(new Error("test error!"))
}


export function showUserError(error: UserError): Promise<void> {
	return Dialog.error(() => error.message)
}
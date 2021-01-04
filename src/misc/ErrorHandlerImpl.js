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
import {TextField, Type} from "../gui/base/TextField"
import m from "mithril"
import {lang} from "./LanguageViewModel"
import {assertMainOrNode, getHttpOrigin, isIOSApp, Mode} from "../api/Env"
import {AccountType, ApprovalStatus, ConversationType, MailMethod} from "../api/common/TutanotaConstants"
import {errorToString, neverNull} from "../api/common/utils/Utils"
import {createRecipientInfo} from "../mail/MailUtils"
import {logins} from "../api/main/LoginController"
import {client} from "./ClientDetector"
import {OutOfSyncError} from "../api/common/error/OutOfSyncError"
import stream from "mithril/stream/stream.js"
import {SecondFactorPendingError} from "../api/common/error/SecondFactorPendingError"
import {secondFactorHandler} from "../login/SecondFactorHandler"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {IndexingNotSupportedError} from "../api/common/error/IndexingNotSupportedError"
import {showUpgradeWizard} from "../subscription/UpgradeSubscriptionWizard"
import {windowFacade} from "./WindowFacade"
import {formatPrice} from "../subscription/SubscriptionUtils"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {locator} from "../api/main/MainLocator"
import {QuotaExceededError} from "../api/common/error/QuotaExceededError"
import {copyToClipboard} from "./ClipboardUtils"
import {px} from "../gui/size"
import {generatedIdToTimestamp} from "../api/common/utils/Encoding"
import {UserError} from "../api/common/error/UserError"

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
						      .catch(AccessBlockedError, e => errorMessage(lang.get('loginFailedOften_msg')))
						      .catch(NotAuthenticatedError, e => errorMessage(lang.get('loginFailed_msg')))
						      .catch(AccessDeactivatedError, e => errorMessage(lang.get('loginFailed_msg')))
						      .catch(ConnectionError, e => {
							      errorMessage(lang.get('emptyString_msg'))
							      throw e
						      })
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
			Dialog.error("insufficientStorageAdmin_msg").then(() => {
				// tutao.locator.navigator.settings()
				// tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_STORAGE)
			})
		} else {
			Dialog.error("insufficientStorageUser_msg")
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

		let textField = new TextField("yourMessage_label", () => lang.get("feedbackOnErrorInfo_msg"))
		textField.type = Type.Area
		let errorOkAction = (dialog) => {
			unknownErrorDialogActive = false
			preparedContent.message = textField.value() + "\n" + preparedContent.message
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
							m(textField),
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


export function sendFeedbackMail(content: FeedbackContent): Promise<void> {
	const recipient = createRecipientInfo("reports@tutao.de", "", null)
	return worker.createMailDraft(
		content.subject,
		content.message.split("\n").join("<br>"),
		neverNull(logins.getUserController().userGroupInfo.mailAddress),
		"",
		[recipient],
		[],
		[],
		ConversationType.NEW,
		null,
		[],
		true,
		[],
		MailMethod.NONE,
	).then(draft => {
		return worker.sendMailDraft(draft, [recipient], "de")
	})
}

/**
 * Shows warnings if the invoices is not paid or the registration is not approved yet.
 * @param includeInvoiceNotPaidForAdmin If true, also shows a warning for an admin if the invoice is not paid (use at login), if false does not show this warning (use when sending an email).
 * @param defaultStatus This status is used if the actual status on the customer is "0"
 * @returns True if the user may still send emails, false otherwise.
 */
export function checkApprovalStatus(includeInvoiceNotPaidForAdmin: boolean, defaultStatus: ?string): Promise<boolean> {
	if (!logins.getUserController().isInternalUser()) { // external users are not authorized to load the customer
		return Promise.resolve(true)
	}
	return logins.getUserController().loadCustomer().then(customer => {
		let status = (customer.approvalStatus === "0" && defaultStatus) ? defaultStatus : customer.approvalStatus
		if ([
			ApprovalStatus.REGISTRATION_APPROVAL_NEEDED,
			ApprovalStatus.DELAYED,
			ApprovalStatus.REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED
		].indexOf(status) !== -1) {
			return Dialog.error("waitingForApproval_msg").return(false)
		} else if (status === ApprovalStatus.DELAYED_AND_INITIALLY_ACCESSED) {
			if ((new Date().getTime() - generatedIdToTimestamp(customer._id)) > (2 * 24 * 60 * 60 * 1000)) {
				return Dialog.error("requestApproval_msg").return(true)
			} else {
				return Dialog.error("waitingForApproval_msg").return(false)
			}
		} else if (status === ApprovalStatus.INVOICE_NOT_PAID) {
			if (logins.getUserController().isGlobalAdmin()) {
				if (includeInvoiceNotPaidForAdmin) {
					return Dialog.error(() => {
						return lang.get("invoiceNotPaid_msg", {"{1}": getHttpOrigin()})
					}).then(() => {
						// TODO: navigate to payment site in settings
						//m.route.set("/settings")
						//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
					}).return(true)
				} else {
					return true
				}
			} else {
				return Dialog.error("invoiceNotPaidUser_msg").return(false)
			}
		} else if (status === ApprovalStatus.SPAM_SENDER) {
			Dialog.error("loginAbuseDetected_msg") // do not logout to avoid that we try to reload with mail editor open
			return false
		} else if (status === ApprovalStatus.PAID_SUBSCRIPTION_NEEDED) {
			let message = lang.get(customer.businessUse ? "businessUseUpgradeNeeded_msg" : "upgradeNeeded_msg")
			return Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message, lang.getInfoLink("premiumProBusiness_link"))
			             .then(confirmed => {
				             if (confirmed) {
					             showUpgradeWizard()
					             return false
				             } else {
					             return true
				             }
			             })
		} else {
			return true
		}
	})
}

export function showNotAvailableForFreeDialog(isInPremiumIncluded: boolean) {
	if (isIOSApp()) {
		Dialog.error("notAvailableInApp_msg")
	} else {
		let message = lang.get(!isInPremiumIncluded ? "onlyAvailableForPremiumNotIncluded_msg" : "onlyAvailableForPremium_msg") + " "
			+ lang.get("premiumOffer_msg", {"{1}": formatPrice(1, true)})
		Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message, lang.getInfoLink("premiumProBusiness_link"))
		      .then(confirmed => {
			      if (confirmed) {
				      showUpgradeWizard()
			      }
		      })
	}
}

export function loggingOut() {
	isLoggingOut = true
	showProgressDialog("loggingOut_msg", Promise.fromCallback(cb => null))
}

function showErrorDialogNotLoggedIn(e) {
	const content = prepareFeedbackContent(e, false)
	const expanded = stream(false)
	const message = content.subject + "\n\n" + content.message
	const info = () => [
		m(".flex.col.items-end.plr", {
			style: {marginTop: "-16px"},
		}, [
			m("div", {style: {marginRight: px(-3)}}, m(ExpanderButtonN, {expanded, label: "showMore_action"})),
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

if (typeof window !== "undefined") {
	window.tutao.testError = () => handleUncaughtError(new Error("test error!"))
}


export function showUserError(error: UserError): Promise<void> {
	return Dialog.error(() => error.message)
}
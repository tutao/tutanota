import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	ConnectionError,
	InsufficientStorageError,
	InvalidSoftwareVersionError,
	NotAuthenticatedError,
	RequestTimeoutError,
	ServiceUnavailableError,
	SessionExpiredError,
} from "../api/common/error/RestError"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "./LanguageViewModel"
import { assertMainOrNode, isDesktop, isOfflineStorageAvailable } from "../api/common/Env"
import { neverNull, noOp } from "@tutao/tutanota-utils"
import { logins } from "../api/main/LoginController"
import { OutOfSyncError } from "../api/common/error/OutOfSyncError"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { IndexingNotSupportedError } from "../api/common/error/IndexingNotSupportedError"
import { windowFacade } from "./WindowFacade"
import { locator } from "../api/main/MainLocator"
import { QuotaExceededError } from "../api/common/error/QuotaExceededError"
import { UserError } from "../api/main/UserError"
import { showMoreStorageNeededOrderDialog } from "./SubscriptionDialogs"
import { showSnackBar } from "../gui/base/SnackBar"
import { Credentials } from "./credentials/Credentials"
import { promptForFeedbackAndSend, showErrorDialogNotLoggedIn } from "./ErrorReporter"
import { CancelledError } from "../api/common/error/CancelledError"
import { getLoginErrorMessage } from "./LoginUtils"
import { isOfflineError } from "../api/common/utils/ErrorCheckUtils.js"
import { SessionType } from "../api/common/SessionType.js"
import { OfflineDbClosedError } from "../api/common/error/OfflineDbClosedError.js"

assertMainOrNode()

let unknownErrorDialogActive = false
let notConnectedDialogActive = false
let invalidSoftwareVersionActive = false
let loginDialogActive = false
let isLoggingOut = false
let serviceUnavailableDialogActive = false
let requestTimeoutDialogActive = false
let shownQuotaError = false
let showingImportError = false
const ignoredMessages = ["webkitExitFullScreen", "googletag", "avast_submit"]

export async function handleUncaughtErrorImpl(e: Error) {
	if (isLoggingOut) {
		// ignore all errors while logging out
		return
	}

	// This is from the s.js and it shouldn't change. Unfortunately it is a plain Error.
	if (
		e.message.includes("(SystemJS https://github.com/systemjs/systemjs/blob/master/docs/errors.md#") ||
		e.message.includes("(SystemJS https://git.io/JvFET#3)") // points to the above url
	) {
		handleImportError()
		return
	}

	if (e instanceof UserError) {
		return showUserError(e)
	}

	if (isOfflineError(e)) {
		showOfflineMessage()
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
		// If the session is closed (e.g. password is changed) we log user out forcefully so we reload the page
		if (logins.isUserLoggedIn()) {
			logoutIfNoPasswordPrompt()
		}
	} else if (e instanceof SessionExpiredError) {
		reloginForExpiredSession()
	} else if (e instanceof OutOfSyncError) {
		const isOffline = isOfflineStorageAvailable() && logins.isUserLoggedIn() && logins.getUserController().sessionType === SessionType.Persistent

		await Dialog.message("outOfSync_label", lang.get(isOffline ? "dataExpiredOfflineDb_msg" : "dataExpired_msg"))

		const { userId } = logins.getUserController()
		if (isDesktop()) {
			await locator.interWindowEventSender?.localUserDataInvalidated(userId)
			await locator.sqlCipherFacade?.deleteDb(userId)
		}
		await logins.logout(false)
		await windowFacade.reload({ noAutoLogin: true })
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
	} else if (e instanceof RequestTimeoutError) {
		if (!requestTimeoutDialogActive) {
			requestTimeoutDialogActive = true
			Dialog.message("requestTimeout_msg").then(() => {
				requestTimeoutDialogActive = false
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
	} else if (e instanceof OfflineDbClosedError) {
		if (!loginDialogActive) {
			throw e
		}
	} else if (ignoredError(e)) {
		// ignore, this is not our code
	} else {
		if (!unknownErrorDialogActive) {
			unknownErrorDialogActive = true

			// only logged in users can report errors because we send mail for that.
			if (logins.isUserLoggedIn()) {
				const { ignored } = await promptForFeedbackAndSend(e)
				unknownErrorDialogActive = false
				if (ignored) {
					ignoredMessages.push(e.message)
				}
			} else {
				console.log("Unknown error", e)
				showErrorDialogNotLoggedIn(e).then(() => (unknownErrorDialogActive = false))
			}
		}
	}
}

function showOfflineMessage() {
	if (!notConnectedDialogActive) {
		notConnectedDialogActive = true
		showSnackBar({
			message: "serverNotReachable_msg",
			button: {
				label: "ok_action",
				click: () => {},
			},
			onClose: () => {
				notConnectedDialogActive = false
			},
		})
	}
}

function logoutIfNoPasswordPrompt() {
	if (!loginDialogActive) {
		windowFacade.reload({})
	}
}

export async function reloginForExpiredSession() {
	if (!loginDialogActive) {
		// Make sure that partial login part is complete before we will try to make a new session.
		// Otherwise we run into a race condition where login failure arrives before we initialize userController.
		await logins.waitForPartialLogin()
		console.log("RELOGIN", logins.isUserLoggedIn())
		const sessionType = logins.getUserController().sessionType
		const userId = logins.getUserController().user._id
		locator.loginFacade.resetSession()
		loginDialogActive = true

		const dialog = Dialog.showRequestPasswordDialog({
			action: async (pw) => {
				let credentials: Credentials
				try {
					credentials = await logins.createSession(neverNull(logins.getUserController().userGroupInfo.mailAddress), pw, sessionType)
				} catch (e) {
					if (
						e instanceof CancelledError ||
						e instanceof AccessBlockedError ||
						e instanceof NotAuthenticatedError ||
						e instanceof AccessDeactivatedError ||
						e instanceof ConnectionError
					) {
						const { getLoginErrorMessage } = await import("../misc/LoginUtils.js")
						return lang.getMaybeLazy(getLoginErrorMessage(e, false))
					} else {
						throw e
					}
				} finally {
					// Once login succeeds we need to manually close the dialog
					locator.secondFactorHandler.closeWaitingForSecondFactorDialog()
				}
				// Fetch old credentials to preserve database key if it's there
				const oldCredentials = await locator.credentialsProvider.getCredentialsByUserId(userId)
				await locator.sqlCipherFacade?.closeDb()
				await locator.credentialsProvider.deleteByUserId(userId, { deleteOfflineDb: false })
				if (sessionType === SessionType.Persistent) {
					await locator.credentialsProvider.store({ credentials: credentials, databaseKey: oldCredentials?.databaseKey })
				}
				loginDialogActive = false
				dialog.close()
				return ""
			},
			cancel: {
				textId: "logout_label",
				action() {
					windowFacade.reload({})
				},
			},
		})
	}
}

function ignoredError(e: Error): boolean {
	return e.message != null && ignoredMessages.some((s) => e.message.includes(s))
}

/**
 * Trying to handle errors during logout can cause unhandled error loops, so we just want to ignore them
 */
export function disableErrorHandlingDuringLogout() {
	isLoggingOut = true
	showProgressDialog("loggingOut_msg", new Promise(noOp))
}

function handleImportError() {
	if (showingImportError) {
		return
	}

	showingImportError = true
	const message =
		"There was an error while loading part of the app. It might be that you are offline, running an outdated version, or your browser is blocking the request."
	Dialog.choice(
		() => message,
		[
			{
				text: "close_alt",
				value: false,
			},
			{
				text: "reloadPage_action",
				value: true,
			},
		],
	).then((reload) => {
		showingImportError = false

		if (reload) {
			windowFacade.reload({})
		}
	})
}

if (typeof window !== "undefined") {
	// @ts-ignore
	window.tutao.testError = () => handleUncaughtErrorImpl(new Error("test error!"))
}

export function showUserError(error: UserError): Promise<void> {
	return Dialog.message(() => error.message)
}

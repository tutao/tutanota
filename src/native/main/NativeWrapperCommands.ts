import {Request} from "../../api/common/MessageDispatcher"
import {CloseEventBusOption, SECOND_MS} from "../../api/common/TutanotaConstants"
import {showSpellcheckLanguageDialog} from "../../gui/dialogs/SpellcheckLanguageDialog"
import {CancelledError} from "../../api/common/error/CancelledError"
import {noOp, ofClass} from "@tutao/tutanota-utils"
import m from "mithril";

type JsRequest = Request<JsRequestType>

/**
 * create a mail editor as requested from the native side, ie because a
 * mailto-link was clicked or the "Send as mail" option
 * in LibreOffice/Windows Explorer was used.
 *
 * if a mailtoUrl is given:
 *  * the other arguments will be ignored.
 *  * confidential will be set to false
 *
 */
async function createMailEditor(msg: JsRequest): Promise<void> {
	const locator = await getInitializedLocator()
	const {newMailEditorFromTemplate, newMailtoUrlMailEditor} = await import("../../mail/editor/MailEditor.js")
	const {logins} = await import("../../api/main/LoginController.js")
	const signatureModule = await import("../../mail/signature/Signature")
	const [filesUris, text, addresses, subject, mailToUrl] = msg.args
	await logins.waitForUserLogin()
	const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
	let editor

	if (mailToUrl) {
		editor = await newMailtoUrlMailEditor(mailToUrl, false, mailboxDetails).catch(ofClass(CancelledError, noOp))
		if (!editor) return
	} else {
		const files = await locator.fileApp.getFilesMetaData(filesUris)
		const address = (addresses && addresses[0]) || ""
		const recipients = address
			? {
				to: [
					{
						name: "",
						address: address,
					},
				],
			}
			: {}
		editor = await newMailEditorFromTemplate(
			mailboxDetails,
			recipients,
			subject || (files.length > 0 ? files[0].name : ""),
			signatureModule.appendEmailSignature(text || "", logins.getUserController().props),
			files,
		)
	}

	editor.show()
}

const showAlertDialog = (msg: JsRequest): Promise<void> => {
	return import("../../gui/base/Dialog.js").then(module => {
		return module.Dialog.message(msg.args[0])
	})
}

const openMailbox = (msg: JsRequest): Promise<void> => {
	return import("./OpenMailboxHandler.js").then(module => {
		return module.openMailbox(msg.args[0], msg.args[1], msg.args[2])
	})
}

const openCalendar = (msg: JsRequest): Promise<void> => {
	return import("./OpenMailboxHandler.js").then(module => module.openCalendar(msg.args[0]))
}

const handleBackPress = (): Promise<boolean> => {
	return import("./DeviceButtonHandler.js").then(module => {
		return module.handleBackPress()
	})
}

const keyboardSizeChanged = (msg: JsRequest): Promise<void> => {
	return import("../../misc/WindowFacade.js").then(module => {
		return module.windowFacade.onKeyboardSizeChanged(Number(msg.args[0]))
	})
}

const print = (): Promise<void> => {
	window.print()
	return Promise.resolve()
}

const openFindInPage = (): Promise<void> => {
	return import("../../gui/SearchInPageOverlay.js").then(module => {
		module.searchInPageOverlay.open()
		return Promise.resolve()
	})
}

const applySearchResultToOverlay = (msg: JsRequest): Promise<void> => {
	return import("../../gui/SearchInPageOverlay.js").then(module => {
		module.searchInPageOverlay.applyNextResult(msg.args[0])
		return Promise.resolve()
	})
}

const addShortcuts = (msg: JsRequest): Promise<void> => {
	msg.args.forEach(a => (a.exec = () => true))
	return import("../../misc/KeyManager.js").then(module => {
		module.keyManager.registerDesktopShortcuts(msg.args)
	})
}

async function reportError(msg: JsRequest): Promise<void> {
	const {promptForFeedbackAndSend} = await import("../../misc/ErrorReporter.js")
	const {logins} = await import("../../api/main/LoginController.js")
	await logins.waitForUserLogin()
	await promptForFeedbackAndSend(msg.args[0] as Error)
}

let disconnectTimeoutId: TimeoutID | null

async function visibilityChange(msg: JsRequest): Promise<void> {
	console.log("native visibility change", msg.args[0])
	const locator = await getInitializedLocator()

	if (msg.args[0]) {
		if (disconnectTimeoutId != null) {
			clearTimeout(disconnectTimeoutId)
			disconnectTimeoutId = null
		}

		locator.worker.tryReconnectEventBus(false, true)
	} else {
		disconnectTimeoutId = setTimeout(() => {
			locator.worker.closeEventBus(CloseEventBusOption.Pause)
		}, 30 * SECOND_MS)
	}
}

async function invalidateAlarms(msg: JsRequest): Promise<void> {
	const locator = await getInitializedLocator()
	await locator.pushService.invalidateAlarms()
}

async function appUpdateDownloaded(msg: JsRequest): Promise<void> {
	const locator = await getInitializedLocator()
	locator.native.handleUpdateDownload()
}

/**
 * this is only used in the admin client to sync the DB view with the inbox
 */
async function openCustomer(msg: JsRequest): Promise<void> {
	const mailAddress = msg.args[0]

	if (typeof mailAddress === "string" && m.route.get().startsWith("/customer")) {
		m.route.set(`/customer?query=${encodeURIComponent(mailAddress)}`)
		console.log("switching to customer", mailAddress)
	}
}

async function getInitializedLocator() {
	const {locator} = await import("../../api/main/MainLocator")
	await locator.initialized
	return locator
}

/**
 * /**
 * this updates the link-reveal on hover when the main thread detects that
 * the hovered url changed. Will _not_ update if hovering a in link app (starts with 2nd argument)
 */
function updateTargetUrl(msg: JsRequest): Promise<void> {
	const url = msg.args[0]
	const appPath = msg.args[1]
	let linkToolTip = document.getElementById("link-tt")

	if (!linkToolTip) {
		linkToolTip = document.createElement("DIV")
		linkToolTip.id = "link-tt"
		;(document.body as any).appendChild(linkToolTip)
	}

	if (url === "" || url.startsWith(appPath)) {
		linkToolTip.className = ""
	} else {
		linkToolTip.innerText = url
		linkToolTip.className = "reveal"
	}

	return Promise.resolve()
}

function showSpellcheckDropdown(msg: JsRequest): Promise<string> {
	return showSpellcheckLanguageDialog()
}

export const appCommands = {
	createMailEditor,
	showAlertDialog,
	openMailbox,
	openCalendar,
	invalidateAlarms,
	keyboardSizeChanged,
	visibilityChange,
	handleBackPress,
} as const

export const desktopCommands = {
	createMailEditor,
	showAlertDialog,
	openMailbox,
	openCalendar,
	invalidateAlarms,
	print,
	openFindInPage,
	applySearchResultToOverlay,
	reportError,
	addShortcuts,
	appUpdateDownloaded,
	openCustomer,
	updateTargetUrl,
	showSpellcheckDropdown,
} as const
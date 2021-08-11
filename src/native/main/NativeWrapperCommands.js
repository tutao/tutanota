// @flow
import {Request} from "../../api/common/WorkerProtocol"
import {getFilesData} from "../common/FileApp"
import {CloseEventBusOption, SECOND_MS} from "../../api/common/TutanotaConstants"
import {nativeApp} from "../common/NativeWrapper"
import {showSpellcheckLanguageDialog} from "../../gui/dialogs/SpellcheckLanguageDialog"

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
async function createMailEditor(msg: Request): Promise<void> {
	const [
		{locator},
		{newMailEditorFromTemplate, newMailtoUrlMailEditor},
		{logins},
		signatureModule
	] = await Promise.all([
		import('../../api/main/MainLocator.js'),
		import('../../mail/editor/MailEditor.js'),
		import('../../api/main/LoginController.js'),
		import("../../mail/signature/Signature")
	])
	const [filesUris, text, addresses, subject, mailToUrl] = msg.args

	await logins.waitForUserLogin()

	const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
	if (mailToUrl) {
		const editor = await newMailtoUrlMailEditor(mailToUrl, false, mailboxDetails)
		editor.show()
		return
	}

	const files = await getFilesData(filesUris)
	const address = addresses && addresses[0] || ""
	const recipients = address ? {to: [{name: "", address: address}]} : {}
	const editor = await newMailEditorFromTemplate(
		mailboxDetails,
		recipients,
		subject || (files.length > 0 ? files[0].name : ""),
		signatureModule.appendEmailSignature(text || "", logins.getUserController().props),
		files
	)
	editor.show()
}

const showAlertDialog = (msg: Request): Promise<void> => {
	return import('../../gui/base/Dialog.js').then(module => {
			return module.Dialog.error(msg.args[0])
		}
	)
}

const openMailbox = (msg: Request): Promise<void> => {
	return import('./OpenMailboxHandler.js').then(module => {
			return module.openMailbox(msg.args[0], msg.args[1], msg.args[2])
		}
	)
}

const openCalendar = (msg: Request): Promise<void> => {
	return import('./OpenMailboxHandler.js')
		.then(module => module.openCalendar(msg.args[0]))
}

const handleBackPress = (): Promise<boolean> => {
	return import('./DeviceButtonHandler.js')
		.then(module => {
				return module.handleBackPress()
			}
		)
}

const keyboardSizeChanged = (msg: Request): Promise<void> => {
	return import('../../misc/WindowFacade.js').then(module => {
		return module.windowFacade.onKeyboardSizeChanged(Number(msg.args[0]))
	})
}

const print = (): Promise<void> => {
	window.print()
	return Promise.resolve()
}

const openFindInPage = (): Promise<void> => {
	return import('../../gui/SearchInPageOverlay.js').then(module => {
		module.searchInPageOverlay.open()
		return Promise.resolve()
	})
}

const applySearchResultToOverlay = (result: any): Promise<void> => {
	return import('../../gui/SearchInPageOverlay.js').then(module => {
		const {activeMatchOrdinal, matches} = result.args[0]
		module.searchInPageOverlay.applyNextResult(activeMatchOrdinal, matches)
		return Promise.resolve()
	})
}

const addShortcuts = (msg: any): Promise<void> => {
	msg.args.forEach(a => a.exec = () => true)
	return import('../../misc/KeyManager.js').then(module => {
		module.keyManager.registerDesktopShortcuts(msg.args)
	})
}

function getFilesData(filesUris: string[]): Promise<Array<FileReference>> {
	return Promise.all(filesUris.map(uri =>
		Promise.all([getName(uri), getMimeType(uri), getSize(uri)]).then(([name, mimeType, size]) => {
			return {
				_type: "FileReference",
				name,
				mimeType,
				size,
				location: uri
			}
		})));
}

function reportError(msg: Request): Promise<*> {
	return Promise.all(
		[
			import('../../misc/ErrorHandlerImpl.js'),
			import('../../api/main/LoginController.js')
		]
	).then(([{promptForFeedbackAndSend}, {logins}]) => {
			return logins.waitForUserLogin()
			             .then(() => promptForFeedbackAndSend(msg.args[0]))
		}
	)
}

let disconnectTimeoutId: ?TimeoutID

function visibilityChange(msg: Request): Promise<void> {
	console.log("native visibility change", msg.args[0])
	return import('../../api/main/WorkerClient.js').then(({worker}) => {
		if (msg.args[0]) {
			if (disconnectTimeoutId != null) {
				clearTimeout(disconnectTimeoutId)
				disconnectTimeoutId = null
			}
			worker.tryReconnectEventBus(false, true)
		} else {
			disconnectTimeoutId = setTimeout(() => {
				worker.closeEventBus(CloseEventBusOption.Pause)
			}, 30 * SECOND_MS)
		}
	})
}

function invalidateAlarms(msg: Request): Promise<void> {
	return import('./PushServiceApp.js').then(({pushServiceApp}) => {
		return pushServiceApp.invalidateAlarms()
	})
}

function appUpdateDownloaded(msg: Request): Promise<void> {
	nativeApp.handleUpdateDownload()
	return Promise.resolve()
}

/**
 * this is only used in the admin client to sync the DB view with the inbox
 */
function openCustomer(msg: Request): Promise<void> {
	const mailAddress = msg.args[0]
	if (typeof mailAddress === 'string' && tutao.m.route.get().startsWith("/customer")) {
		tutao.m.route.set(`/customer?query=${encodeURIComponent(mailAddress)}`)
		console.log('switching to customer', mailAddress)
	}

	return Promise.resolve()
}

/**
 * /**
 * this updates the link-reveal on hover when the main thread detects that
 * the hovered url changed. Will _not_ update if hovering a in link app (starts with 2nd argument)
 */
function updateTargetUrl(msg: Request): Promise<void> {
	const url = msg.args[0]
	const appPath = msg.args[1]
	let linkToolTip = document.getElementById("link-tt")
	if (!linkToolTip) {
		linkToolTip = document.createElement("DIV")
		linkToolTip.id = "link-tt";
		(document.body: any).appendChild(linkToolTip)
	}
	if (url === "" || url.startsWith(appPath)) {
		linkToolTip.className = ""
	} else {
		linkToolTip.innerText = url
		linkToolTip.className = "reveal"
	}

	return Promise.resolve()
}

function showSpellcheckDropdown(msg: Request): Promise<string> {
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
}

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
	showSpellcheckDropdown
}

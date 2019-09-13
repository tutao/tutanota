// @flow
import {Request} from "../api/common/WorkerProtocol"
import {getMimeType, getName, getSize} from "./FileApp"
import {CloseEventBusOption, SECOND_MS} from "../api/common/TutanotaConstants"
import {nativeApp} from "./NativeWrapper"
import type {LoginController} from "../api/main/LoginController"

const createMailEditor = (msg: Request): Promise<void> => {
	return Promise.all([
		import('../api/main/MainLocator.js'),
		import('../mail/MailEditor.js'),
		import('../mail/MailUtils.js'),
		import('../api/main/LoginController.js')
	]).then(([mainLocatorModule, mailEditorModule, mailUtilsModule, {logins}]) => {
		const [filesUris, text, addresses, subject, mailToUrl] = msg.args
		return logins.waitForUserLogin()
		             .then(() => Promise.join(
			             mailToUrl ? [] : getFilesData(filesUris),
			             mainLocatorModule.locator.mailModel.getUserMailboxDetails(),
			             (files, mailboxDetails) => {
				             const address = addresses && addresses[0] || ""
				             const recipients = address ? {to: [{name: "", address: address}]} : {}
				             const editorPromise = mailToUrl
					             ? mailEditorModule.newMailtoUrlMailEditor(mailToUrl, false, mailboxDetails)
					             : mailEditorModule.newMailEditorFromTemplate(
						             mailboxDetails,
						             recipients,
						             subject || (files.length > 0 ? files[0].name : ""),
						             mailUtilsModule.appendEmailSignature(text || "", logins.getUserController().props),
						             files
					             )
				             return editorPromise.then(editor => editor.show())
			             })
		             )
	})
}

const showAlertDialog = (msg: Request): Promise<void> => {
	return import('../gui/base/Dialog.js').then(module => {
			return module.Dialog.error(msg.args[0])
		}
	)
}

const openMailbox = (msg: Request): Promise<void> => {
	return import('../native/OpenMailboxHandler.js').then(module => {
			return module.openMailbox(msg.args[0], msg.args[1], msg.args[2])
		}
	)
}

const openCalendar = (msg: Request): Promise<void> => {
	return import('../native/OpenMailboxHandler.js')
		.then(module => module.openCalendar(msg.args[0]))
}

const handleBackPress = (): Promise<boolean> => {
	return import('../native/DeviceButtonHandler.js')
		.then(module => {
				return module.handleBackPress()
			}
		)
}

const keyboardSizeChanged = (msg: Request): Promise<void> => {
	return import('../misc/WindowFacade.js').then(module => {
		return module.windowFacade.onKeyboardSizeChanged(Number(msg.args[0]))
	})
}

const print = (): Promise<void> => {
	window.print()
	return Promise.resolve()
}

const openFindInPage = (): Promise<void> => {
	return import('../gui/base/SearchInPageOverlay.js').then(module => {
		module.searchInPageOverlay.open()
		return Promise.resolve()
	})
}

const applySearchResultToOverlay = (result: any): Promise<void> => {
	return import('../gui/base/SearchInPageOverlay.js').then(module => {
		const {activeMatchOrdinal, matches} = result.args[0]
		module.searchInPageOverlay.applyNextResult(activeMatchOrdinal, matches)
		return Promise.resolve()
	})
}

const addShortcuts = (msg: any): Promise<void> => {
	msg.args.forEach(a => a.exec = () => true)
	return import('../misc/KeyManager.js').then(module => {
		module.keyManager.registerDesktopShortcuts(msg.args)
	})
}

function getFilesData(filesUris: string[]): Promise<Array<FileReference>> {
	return Promise.all(filesUris.map(uri =>
		Promise.join(getName(uri), getMimeType(uri), getSize(uri), (name, mimeType, size) => {
			return {
				_type: "FileReference",
				name,
				mimeType,
				size,
				location: uri
			}
		})));
}

function reportError(msg: Request): Promise<void> {
	return Promise.join(
		import('../misc/ErrorHandlerImpl.js'),
		import('../api/main/LoginController.js'),
		({promptForFeedbackAndSend}, {logins}) => {
			return logins.waitForUserLogin()
			             .then(() => promptForFeedbackAndSend(msg.args[0], false))
		}
	)
}

let disconnectTimeoutId: ?TimeoutID

function visibilityChange(msg: Request): Promise<void> {
	console.log("native visibility change", msg.args[0])
	return import('../api/main/WorkerClient.js').then(({worker}) => {
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
	appUpdateDownloaded
}

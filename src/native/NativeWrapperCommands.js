// @flow
import {Request} from "../api/common/WorkerProtocol"
import {getMimeType, getName, getSize} from "./FileApp"
import {asyncImport} from "../api/common/utils/Utils"
import {CloseEventBusOption, SECOND_MS} from "../api/common/TutanotaConstants"
import type {MailEditor} from "../mail/MailEditor"

const createMailEditor = (msg: Request) => {
	return Promise.all([
		_asyncImport('src/mail/MailModel.js'),
		_asyncImport('src/mail/MailEditor.js'),
		_asyncImport('src/mail/MailUtils.js'),
		_asyncImport('src/api/main/LoginController.js')
	]).spread((mailModelModule, mailEditorModule, mailUtilsModule, {logins}) => {
		const [filesUris, text, addresses, subject, mailToUrl] = msg.args
		return logins.waitForUserLogin()
		             .then(() => Promise.join(
			             mailToUrl ? [] : getFilesData(filesUris),
			             mailModelModule.mailModel.getUserMailboxDetails(),
			             (files, mailboxDetails) => {
				             const editor: MailEditor = new mailEditorModule.MailEditor(mailboxDetails)
				             let editorInit
				             if (mailToUrl) {
					             editorInit = editor.initWithMailtoUrl(mailToUrl, false)
				             } else {
					             const address = addresses ? addresses.shift() : ""
					             const recipients = address ? {to: [{name: "", address: address}]} : {}
					             const finalSubject = subject || (files.length > 0 ? files[0].name : "")
					             editorInit = editor.initWithTemplate(recipients, finalSubject,
						             (text || "") + mailUtilsModule.getEmailSignature(), null)
				             }
				             return editorInit.then(() => {
					             editor.attachFiles(files)
					             editor.show()
				             })
			             }
			             )
		             )
	})
}

const showAlertDialog = (msg: Request): Promise<void> => {
	return _asyncImport('src/gui/base/Dialog.js').then(module => {
			return module.Dialog.error(msg.args[0])
		}
	)
}

const openMailbox = (msg: Request): Promise<void> => {
	return _asyncImport('src/native/OpenMailboxHandler.js').then(module => {
			return module.openMailbox(msg.args[0], msg.args[1], msg.args[2])
		}
	)
}

const openCalendar = (msg: Request): Promise<void> => {
	return _asyncImport('src/native/OpenMailboxHandler.js')
		.then(module => module.openCalendar(msg.args[0]))
}

const handleBackPress = (): Promise<boolean> => {
	return _asyncImport('src/native/DeviceButtonHandler.js')
		.then(module => {
				return module.handleBackPress()
			}
		)
}

const keyboardSizeChanged = (msg: Request): Promise<void> => {
	return _asyncImport('src/misc/WindowFacade.js').then(module => {
		return module.windowFacade.onKeyboardSizeChanged(Number(msg.args[0]))
	})
}

const print = (): Promise<void> => {
	window.print()
	return Promise.resolve()
}

const openFindInPage = (): Promise<void> => {
	return _asyncImport('src/gui/base/SearchInPageOverlay.js').then(module => {
		module.searchInPageOverlay.open()
		return Promise.resolve()
	})
}

const applySearchResultToOverlay = (result: any): Promise<void> => {
	return _asyncImport('src/gui/base/SearchInPageOverlay.js').then(module => {
		const {activeMatchOrdinal, matches} = result.args[0]
		module.searchInPageOverlay.applyNextResult(activeMatchOrdinal, matches)
		return Promise.resolve()
	})
}

const addShortcuts = (msg: any) => {
	msg.args.forEach(a => a.exec = () => true)
	return _asyncImport('src/misc/KeyManager.js').then(module => {
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
		_asyncImport('src/misc/ErrorHandlerImpl.js'),
		_asyncImport('src/api/main/LoginController.js'),
		({promptForFeedbackAndSend}, {logins}) => {
			return logins.waitForUserLogin()
			             .then(() => promptForFeedbackAndSend(msg.args[0], false))
		}
	)
}

function _asyncImport(path): Promise<any> {
	return asyncImport(typeof module !== "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}${path}`)
}

let disconnectTimeoutId: ?TimeoutID

function visibilityChange(msg: Request): Promise<void> {
	console.log("native visibility change", msg.args[0])
	return _asyncImport('src/api/main/WorkerClient.js').then(({worker}) => {
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
	return _asyncImport('src/native/PushServiceApp.js').then(({pushServiceApp}) => {
		return pushServiceApp.invalidateAlarms()
	})
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
	addShortcuts
}

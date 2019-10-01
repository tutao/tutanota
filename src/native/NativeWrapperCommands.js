// @flow
import {Request} from "../api/common/WorkerProtocol"
import {getMimeType, getName, getSize} from "./FileApp"
import {asyncImport} from "../api/common/utils/Utils"

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
			             mailModelModule.mailModel.init(),
			             (files) => {
				             const editor = new mailEditorModule.MailEditor(mailModelModule.mailModel.getUserMailboxDetails())
				             let editorInit
				             if (mailToUrl) {
					             editorInit = editor.initWithMailtoUrl(mailToUrl, false)
				             } else {
					             const address = addresses ? addresses.shift() : null
					             const finalSubject = subject || (files.length > 0 ? files[0].name : "")
					             editorInit = editor.initWithTemplate(null, address, finalSubject,
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

export const appCommands = {
	createMailEditor,
	handleBackPress,
	showAlertDialog,
	openMailbox,
	openCalendar,
	keyboardSizeChanged
}

export const desktopCommands = {
	createMailEditor,
	showAlertDialog,
	openMailbox,
	openCalendar,
	print,
	openFindInPage,
	reportError
}

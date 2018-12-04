//@flow
import {Queue, Request} from "../api/common/WorkerProtocol"
import {ConnectionError} from "../api/common/error/RestError"
import {asyncImport, defer, neverNull} from "../api/common/utils/Utils"
import {isMainOrNode, Mode} from "../api/Env"
import {getMimeType, getName, getSize} from "./FileApp"
import {base64ToUint8Array, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"

/**
 * Invokes native functions of an app. In case this is executed from a worker scope, the invocations are passed to the
 * main thread (as native functions bound to a webview are only available from that scope).
 */
class NativeWrapper {

	_initialized = defer();

	_workerQueue: ?Queue;
	_nativeQueue: ?Queue;

	constructor() {

	}

	init() {
		if (isMainOrNode() && env.mode === Mode.App) {
			window.tutao.nativeApp = this // the native part must be able to invoke this.invokeNative without invoking System.import

			this._nativeQueue = new Queue(({
				postMessage: function (msg: Request) {
					window.nativeApp.invoke(JSON.stringify(msg))
				}
			}: any))
			this._nativeQueue.setCommands({
				createMailEditor: (msg: Request) => {
					return Promise.all([
						_asyncImport('src/mail/MailModel.js'),
						_asyncImport('src/mail/MailEditor.js'),
						_asyncImport('src/mail/MailUtils.js'),
						_asyncImport('src/api/main/LoginController.js')
					]).spread((mailModelModule, mailEditorModule, mailUtilsModule, {logins}) => {
						const [filesUris, text, addresses, subject, mailToUrl] = msg.args
						return logins.waitForUserLogin()
						             .then(() => Promise.join(
							             mailToUrl ? [] : this._getFilesData(filesUris),
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
				},
				handleBackPress: (): Promise<boolean> => {
					return _asyncImport('src/native/DeviceButtonHandler.js')
						.then(module => {
								return module.handleBackPress()
							}
						)
				},
				showAlertDialog: (msg: Request): Promise<void> => {
					return _asyncImport('src/gui/base/Dialog.js').then(module => {
							return module.Dialog.error(msg.args[0])
						}
					)
				},
				openMailbox: (msg: Request): Promise<void> => {
					return _asyncImport('src/native/OpenMailboxHandler.js').then(module => {
							return module.openMailbox(msg.args[0], msg.args[1])
						}
					)
				},
				keyboardSizeChanged: (msg: Request): Promise<void> => {
					return _asyncImport('src/misc/WindowFacade.js').then(module => {
						return module.windowFacade.onKeyboardSizeChanged(Number(msg.args[0]))
					})
				}
			})
			this.invokeNative(new Request("init", [])).then(platformId => {
				env.platformId = platformId
				this._initialized.resolve()
			});
		}
	}

	_getFilesData(filesUris: string[]): Promise<Array<FileReference>> {
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

	invokeNative(msg: Request): Promise<any> {
		if (this._workerQueue) {
			// worker queue is only set in worker scope
			return this._workerQueue.postMessage(new Request("execNative", [msg.type, msg.args]))
		} else {
			return neverNull(this._nativeQueue).postMessage(msg)
		}
	}

	handleMessageFromNative(msg64: string) {
		const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64))
		neverNull(this._nativeQueue)._handleMessage(JSON.parse(msg))
	}

	_replacement(char: string) {

	}

	setWorkerQueue(queue: Queue) {
		this._workerQueue = queue;
		this._nativeQueue = null
	}

	initialized() {
		return this._initialized.promise
	}
}

function _createConnectionErrorHandler(rejectFunction) {
	return function (errorString) {
		if (errorString.indexOf("java.net.SocketTimeoutException") === 0 ||
			errorString.indexOf("javax.net.ssl.SSLException") === 0 ||
			errorString.indexOf("java.io.EOFException") === 0 ||
			errorString.indexOf("java.net.UnknownHostException") === 0) {
			rejectFunction(new ConnectionError(errorString))
		} else {
			rejectFunction(new Error(errorString))
		}
	}
}


const _asyncImport = (path): Promise<any> =>
	asyncImport(typeof module !== "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}${path}`)

export const nativeApp = new NativeWrapper()
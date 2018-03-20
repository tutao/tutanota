//@flow
import {Queue, Request} from "../api/common/WorkerProtocol"
import {ConnectionError} from "../api/common/error/RestError"
import {neverNull, asyncImport} from "../api/common/utils/Utils"
import {Mode, isMainOrNode} from "../api/Env"
import {getName, getMimeType, getSize} from "./FileApp"

/**
 * Invokes native functions of an app. In case this is executed from a worker scope, the invocations are passed to the
 * main thread (as native functions bound to a webview are only available from that scope).
 */
class NativeWrapper {

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
			}:any))
			this._nativeQueue.setCommands({
				updatePushIdentifier: (msg: Request) => {
					return asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/native/PushServiceApp.js`).then(module => {
						module.pushServiceApp.updatePushIdentifier(msg.args[0])
					})
				},
				createMailEditor: (msg: Request) => {
					return Promise.all([
						importModule('src/mail/MailModel.js'),
						importModule('src/mail/MailEditor.js'),
						importModule('src/mail/MailUtils.js'),
						importModule('src/api/main/LoginController.js')
					]).spread((mailModelModule, mailEditorModule, mailUtilsModule, {logins}) => {
						return logins.waitForUserLogin().then(() => Promise.all(msg.args[0]
							.map(uri => Promise.join(getName(uri), getMimeType(uri), getSize(uri), (name, mimeType, size) => {
								return {
									_type: "FileReference",
									name,
									mimeType,
									size,
									location: uri
								}
							}))))
							.then(files => {
								const editor = new mailEditorModule.MailEditor(mailModelModule.mailModel.getUserMailboxDetails())
								return editor.initWithTemplate(null, null, files.length > 0 ? files[0].name : "",
									mailUtilsModule.getEmailSignature(), null)
									.then(() => {
										editor._attachFiles(files)
										editor.show()
									})
							})
					})
				},
			})
			this.invokeNative(new Request("init", [])).then(platformId => env.platformId = platformId);
		}
	}

	invokeNative(msg: Request): Promise<any> {
		if (this._workerQueue) {
			// worker queue is only set in worker scope
			return this._workerQueue.postMessage(new Request("execNative", [msg.type, msg.args]))
		} else {
			return neverNull(this._nativeQueue).postMessage(msg)
		}
	}

	handleMessageFromNative(msg: string) {
		// replace illegal chars in json strings (some special strings like \t are replaced during a native invocation with their corresponding unicode chars)
		let fixedMsg = msg.replace(/([\b\f\n\r\t])/g, (match) => {
			switch (match) {
				case "\b":
					return "\\b"
				case "\f":
					return "\\f"
				case "\n":
					return "\\n"
				case "\r":
					return "\\r"
				case "\t":
					return "\\t"
				default:
					throw new Error("illegal match " + match + " of " + msg)
			}
		})
		neverNull(this._nativeQueue)._handleMessage(JSON.parse(fixedMsg))
	}

	_replacement(char: string) {

	}

	setWorkerQueue(queue: Queue) {
		this._workerQueue = queue;
		this._nativeQueue = null
	}
}

function _createConnectionErrorHandler(rejectFunction) {
	return function (errorString) {
		if (errorString.indexOf("java.net.SocketTimeoutException") == 0 ||
			errorString.indexOf("javax.net.ssl.SSLException") == 0 ||
			errorString.indexOf("java.io.EOFException") == 0 ||
			errorString.indexOf("java.net.UnknownHostException") == 0) {
			rejectFunction(new ConnectionError(errorString))
		} else {
			rejectFunction(new Error(errorString))
		}
	}
}


const importModule = (path): Promise<any> =>
	asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}${path}`)

export const nativeApp = new NativeWrapper()
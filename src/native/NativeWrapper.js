//@flow
import {Queue, Request} from "../api/common/WorkerProtocol"
import {ConnectionError} from "../api/common/error/RestError"
import {defer, neverNull, noOp} from "../api/common/utils/Utils"
import {isMainOrNode, Mode} from "../api/Env"
import {base64ToUint8Array, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {appCommands, desktopCommands} from './NativeWrapperCommands.js'

/**
 * Invokes native functions of an app. In case this is executed from a worker scope, the invocations are passed to the
 * main thread (as native functions bound to a webview are only available from that scope).
 */
class NativeWrapper {

	_initialized = defer();

	_workerQueue: ?Queue;
	_nativeQueue: ?Queue;
	_nativeAppProxy: any;

	constructor() {

		this._nativeAppProxy = new Proxy({}, {
			get: (obj, prop) => {
				return prop in window.nativeApp
					? window.nativeApp[prop]
					: noOp
			}
		})
	}

	init() {
		if (isMainOrNode() && (env.mode === Mode.App || env.mode === Mode.Desktop)) {
			window.tutao.nativeApp = this // the native part must be able to invoke this.invokeNative without invoking System.import

			this._nativeQueue = new Queue(({
				postMessage: function (msg: Request) {
					// window.nativeApp gets set on the native side, e.g. via
					// addJavascriptInterface in Native.java for android
					// or in preload.js for desktop
					window.nativeApp.invoke(JSON.stringify(msg))
				}
			}: any))
			this._nativeQueue.setCommands(env.mode === Mode.App ? appCommands : desktopCommands)
			this.invokeNative(new Request("init", []))
			    .then(platformId => {
				    env.platformId = platformId
				    this._initialized.resolve()
			    })
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

	startListening(msg: BridgeMessage, listener: Function) {
		this._nativeAppProxy.startListening(msg, listener)
	}

	stopListening(msg: BridgeMessage, listener: Function) {
		this._nativeAppProxy.stopListening(msg, listener)
	}

	/**
	 * invoked via eval()-type call (App)
	 * @param msg64
	 */
	handleMessageFromNative(msg64: string) {
		const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64))
		neverNull(this._nativeQueue)._handleMessage(JSON.parse(msg))
	}

	/**
	 * used by the preload script to save on encoding
	 * @param msg
	 */
	handleMessageObject = (msg: any) => {
		neverNull(this._nativeQueue)._handleMessage(msg)
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

export const nativeApp = new NativeWrapper()
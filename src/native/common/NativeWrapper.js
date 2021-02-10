//@flow
import {Queue, Request} from "../../api/common/WorkerProtocol"
import type {DeferredObject} from "../../api/common/utils/Utils"
import {defer, neverNull} from "../../api/common/utils/Utils"
import {isMainOrNode, Mode} from "../../api/common/Env"
import {base64ToUint8Array, utf8Uint8ArrayToString} from "../../api/common/utils/Encoding"

/**
 * Invokes native functions of an app.
 *
 * Used from both main and worker threads.
 *
 * In case this is executed from a worker scope, the invocations are passed to the
 * main thread (as native functions bound to a webview are only available from that scope).
 */
class NativeWrapper {

	_initialized: DeferredObject<void> = defer();
	_appUpdateListener: () => void;

	_workerQueue: ?Queue;
	_nativeQueue: ?Queue;

	init() {
		if (isMainOrNode() && (env.mode === Mode.App || env.mode === Mode.Desktop || env.mode === Mode.Admin)) {
			window.tutao.nativeApp = this // the native part must be able to invoke this.invokeNative without invoking System.import

			const queue = this._nativeQueue = new Queue(({
				postMessage: function (msg: Request) {
					// window.nativeApp gets set on the native side, e.g. via
					// addJavascriptInterface in Native.java for android
					// or in preload.js for desktop
					window.nativeApp.invoke(JSON.stringify(msg))
				}
			}: any))
			import("../main/NativeWrapperCommands").then(({appCommands, desktopCommands}) => {
				queue.setCommands(env.mode === Mode.App ? appCommands : desktopCommands)
				return this.invokeNative(new Request("init", []))
				           .then(platformId => {
					           env.platformId = platformId
					           this._initialized.resolve()
				           })
			})
		}
	}

	/**
	 * saves a listener method to be called when an
	 * app update has been downloaded on the native side
	 */
	setAppUpdateListener(listener: ()=>void): void {
		this._appUpdateListener = listener
	}

	/**
	 * call the update listener if set
	 */
	handleUpdateDownload(): void {
		this._appUpdateListener && this._appUpdateListener()
	}

	invokeNative(msg: Request): Promise<any> {
		if (this._workerQueue) {
			// worker queue is only set in worker scope
			return this._workerQueue.postMessage(new Request("execNative", [msg.type, msg.args]))
		} else {
			return neverNull(this._nativeQueue).postMessage(msg)
		}
	}

	/**
	 * invoked via eval()-type call (App)
	 * @param msg64
	 */
	handleMessageFromNative(msg64: string) {
		const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64))
		neverNull(this._nativeQueue)._handleMessage(JSON.parse(msg))
	}

	setWorkerQueue(queue: Queue) {
		this._workerQueue = queue;
		this._nativeQueue = null
	}

	initialized(): Promise<void> {
		return this._initialized.promise
	}
}

export const nativeApp: NativeWrapper = new NativeWrapper()

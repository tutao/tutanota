//@flow
import {Queue, Request} from "../../api/common/WorkerProtocol"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {base64ToUint8Array, defer, neverNull, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import {assertWorkerOrNode, isMainOrNode, Mode} from "../../api/common/Env"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"

/**
 * Invokes native functions of an app.
 *
 * Used from both main and worker threads.
 *
 * In case this is executed from a worker scope, the invocations are passed to the
 * main thread (as native functions bound to a webview are only available from that scope).
 */
export class NativeWrapper {

	_initialized: DeferredObject<void> = defer();
	_appUpdateListener: () => void;

	_workerQueue: ?Queue;
	_nativeQueue: ?Queue;

	initOnMain() {
		if (!isMainOrNode()) return
		let postMessage;
		if (env.mode === Mode.App) {
			// the native part must be able to invoke this.handleMessageFromNative without invoking System.import
			window.tutao.nativeApp = this
			// window.nativeApp gets injected via addJavascriptInterface in Native.java
			postMessage = (msg: Request) => window.nativeApp.invoke(JSON.stringify(msg))
		} else if (env.mode === Mode.Desktop || env.mode === Mode.Admin) {
			// window.nativeApp is injected by the preload script in desktop mode
			// electron can handle message passing without jsonification
			window.nativeApp.attach(args => this.handleMessageObjectFromNative(args))
			postMessage = (msg: Request) => window.nativeApp.invoke(msg)
		} else {
			return
		}

		const queue = this._nativeQueue = new Queue(({postMessage}: any))
		import("../main/NativeWrapperCommands").then(({appCommands, desktopCommands}) => {
			queue.setCommands(env.mode === Mode.App ? appCommands : desktopCommands)
			return this._invokeNative(new Request("init", []))
			           .then(platformId => {
				           env.platformId = platformId
				           this._initialized.resolve()
			           })
		})
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

	async invokeNative(msg: Request): Promise<any> {
		await this.initialized()
		return this._invokeNative(msg)
	}

	_invokeNative(msg: Request): Promise<any> {
		if (this._workerQueue) {
			// worker queue is only set in worker scope
			return this._workerQueue.postMessage(new Request("execNative", [msg.type, msg.args]))
		} else {
			if (this._nativeQueue == null) {
				throw new ProgrammingError(`No queue, tried to send ${msg.type}`)
			}
			return this._nativeQueue.postMessage(msg)
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

	handleMessageObjectFromNative(obj: any) {
		neverNull(this._nativeQueue)._handleMessage(obj)
	}

	initOnWorker(queue: Queue) {
		assertWorkerOrNode()
		this._workerQueue = queue;
		this._nativeQueue = null
		this._initialized.resolve()
	}

	initialized(): Promise<void> {
		return this._initialized.promise
	}
}

export const nativeApp: NativeWrapper = new NativeWrapper()

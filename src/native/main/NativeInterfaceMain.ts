import {assertMainOrNode, isAdminClient, isAndroidApp, isDesktop, isIOSApp} from "../../api/common/Env"
import type {Transport} from "../../api/common/MessageDispatcher"
import {MessageDispatcher, Request} from "../../api/common/MessageDispatcher"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer} from "@tutao/tutanota-utils"
import type {NativeInterface} from "../common/NativeInterface"
import {ExposedWebInterface} from "../common/NativeInterface"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {exposeLocal} from "../../api/common/WorkerProxy"
import {IosNativeTransport} from './IosNativeTransport.js'
import {AndroidNativeTransport} from "./AndroidNativeTransport.js"
import {DesktopNativeTransport} from "./DesktopNativeTransport.js"
import {WebGlobalDispatcher} from "../common/generatedipc/WebGlobalDispatcher.js"

assertMainOrNode()

export class NativeInterfaceMain implements NativeInterface {
	private readonly _dispatchDeferred: DeferredObject<MessageDispatcher<NativeRequestType, JsRequestType>> = defer()
	private _appUpdateListener: (() => void) | null = null

	constructor(
		private readonly webInterface: ExposedWebInterface,
		private readonly globalDispatcher: WebGlobalDispatcher,
	) {
	}

	async init() {
		let transport: Transport<NativeRequestType, JsRequestType>

		if (isAndroidApp()) {
			const androidTransport = new AndroidNativeTransport(window)
			androidTransport.start()
			transport = androidTransport
		} else if (isIOSApp()) {
			transport = new IosNativeTransport(window)
		} else if (isDesktop() || isAdminClient()) {
			transport = new DesktopNativeTransport(window.nativeApp)
		} else {
			throw new ProgrammingError("Tried to create a native interface in the browser")
		}

		// Ensure that we have messaged native with "init" before we allow anyone else to make native requests
		const queue = new MessageDispatcher<NativeRequestType, JsRequestType>(transport, {
			"facade": exposeLocal(this.webInterface),
			"ipc": (request: Request<JsRequestType>) => this.globalDispatcher.dispatch(request.args[0], request.args[1], request.args.slice(2))
		})
		await queue.postRequest(new Request("ipc", ["CommonSystemFacade", "initializeRemoteBridge"]))
		this._dispatchDeferred.resolve(queue)
	}

	// for testing
	async initWithQueue(queue: MessageDispatcher<NativeRequestType, JsRequestType>) {
		this._dispatchDeferred.resolve(queue)
	}

	/**
	 * Send a request to the native side.
	 */
	async invokeNative(requestType: NativeRequestType, args: ReadonlyArray<unknown>): Promise<any> {
		const dispatch = await this._dispatchDeferred.promise
		return dispatch.postRequest(new Request<NativeRequestType>(requestType, args))
	}

	/**
	 * Saves a listener method to be called when an app update has been downloaded on the native side.
	 */
	setAppUpdateListener(listener: () => void): void {
		this._appUpdateListener = listener
	}

	/**
	 * Call the update listener if set.
	 */
	handleUpdateDownload(): void {
		this._appUpdateListener?.()
	}
}
import { assertMainOrNode, isAdminClient, isAndroidApp, isDesktop, isIOSApp, ProgrammingError } from "@tutao/app-env"
import { MessageDispatcher } from "../../../app-kits/native-bridge/shared/MessageDispatcher.js"
import type { DeferredObject } from "@tutao/utils"
import { defer } from "@tutao/utils"
import { NativeInterface } from "../../../app-kits/native-bridge/common/NativeInterface.js"
import { WebGlobalDispatcher } from "../../../app-kits/native-bridge/common/generatedipc/dispatchers/WebGlobalDispatcher.js"
import { AndroidNativeTransport } from "../../../app-kits/native-bridge/main/AndroidNativeTransport.js"
import { DesktopNativeTransport } from "../../../app-kits/native-bridge/main/DesktopNativeTransport.js"
import { IosNativeTransport } from "../../../app-kits/native-bridge/main/IosNativeTransport.js"
import { Request, Transport } from "../../../app-kits/native-bridge/shared/MessageTypes"
import { objToError } from "../api/common/utils/ErrorUtils"

assertMainOrNode()

/** the side of the node-main interface that's running in the browser windows renderer/main thread. */
export class NativeInterfaceMain implements NativeInterface {
	private readonly _dispatchDeferred: DeferredObject<MessageDispatcher<NativeRequestType, JsRequestType>> = defer()
	private _appUpdateListener: (() => void) | null = null

	constructor(private readonly globalDispatcher: WebGlobalDispatcher) {}

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
		const queue = new MessageDispatcher<NativeRequestType, JsRequestType>(
			transport,
			{
				ipc: (request: Request<JsRequestType>) => this.globalDispatcher.dispatch(request.args[0], request.args[1], request.args.slice(2)),
			},
			"main-worker",
			objToError,
		)
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

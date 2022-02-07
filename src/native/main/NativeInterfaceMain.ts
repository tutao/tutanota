import {assertMainOrNode, isAdminClient, isAndroidApp, isApp, isDesktop, isIOSApp} from "../../api/common/Env"
import type {Commands, Message, Transport} from "../../api/common/MessageDispatcher"
import {MessageDispatcher, Request} from "../../api/common/MessageDispatcher"
import type {Base64, DeferredObject} from "@tutao/tutanota-utils"
import {base64ToUint8Array, defer, downcast, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import type {NativeInterface} from "../common/NativeInterface"
import {appCommands, desktopCommands} from "./NativeWrapperCommands"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {NativeApp} from "../../global"

assertMainOrNode()

type NativeMessage = Message<NativeRequestType>
type JsMessage = Message<JsRequestType>
type JsMessageHandler = (message: JsMessage) => unknown

/**
 * Transport for communication between android native and webview, using WebMessagePorts for two-way communication.
 * The interface `nativeApp.startWebMessageChannel` is defined in Native.java in order to initiate the setup of the port channel
 */

class AndroidNativeTransport implements Transport<NativeRequestType, JsRequestType> {
	private _messageHandler: JsMessageHandler | null = null
	private _deferredPort: DeferredObject<MessagePort> = defer()

	get port(): Promise<MessagePort> {
		return this._deferredPort.promise
	}

	/**
	 * Creates a global `window.onmessage` handler, and then tells native to create the messageport channel
	 */
	start() {
		// We will receive a message from native after the call to
		// window.nativeApp.startWebMessageChannel
		window.onmessage = (message: MessageEvent) => {
			// All further messages to and from native will be via this port
			const port = message.ports[0]

			port.onmessage = (messageEvent: MessageEvent) => {
				const handler = this._messageHandler

				if (handler) {
					// We can be sure we have a string here, because
					// Android only allows sending strings across MessagePorts
					const response = JSON.parse(messageEvent.data)
					handler(response)
				}
			}

			this._deferredPort.resolve(port)
		}

		// window.nativeApp is defined in Native.java using WebView.addJavaScriptInterface
		// The native side needs to initialize the WebMessagePorts
		// We have to tell it when we are ready, otherwise it will happen too early and we won't receive the message event
		window.nativeApp.startWebMessageChannel()
	}

	postMessage(message: NativeMessage): void {
		this.port.then(port => port.postMessage(JSON.stringify(message)))
	}

	setMessageHandler(handler: JsMessageHandler): void {
		this._messageHandler = handler
	}
}

/**
 * Transport for communication between ios native and webview
 * Messages are passed from native via as eval()-type call which invokes sendMessageFromApp, see WebViewBridge.swift
 * window.tutao.nativeApp is injected during webview initialization
 */

class IosNativeTransport implements Transport<NativeRequestType, JsRequestType> {
	private _messageHandler: JsMessageHandler | null = null

	constructor() {
		window.tutao.nativeApp = this
	}

	postMessage(message: NativeMessage) {
		window.nativeApp.invoke(JSON.stringify(message))
	}

	setMessageHandler(handler: JsMessageHandler): void {
		this._messageHandler = handler
	}

	sendMessageFromApp(msg64: Base64): void {
		const handler = this._messageHandler

		if (handler) {
			const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64))
			handler(JSON.parse(msg))
		}
	}
}


/**
 * Transport for communication between electron native and webview
 * Uses window.nativeApp, which is injected by the preload script in desktop mode
 * electron can handle message passing without jsonification
 */

export class DesktopTransport<OutgoingRequestType extends string = JsRequestType, IncomingRequestType extends string = NativeRequestType>
	implements Transport<OutgoingRequestType, IncomingRequestType> {
	constructor(private readonly nativeApp: NativeApp) {
	}

	postMessage(message: Message<OutgoingRequestType>) {
		this.nativeApp.invoke(message)
	}

	setMessageHandler(handler: (message: Message<IncomingRequestType>) => unknown): void {
		this.nativeApp.attach(handler)
	}
}

export class NativeInterfaceMain implements NativeInterface {
	private readonly _dispatchDeferred: DeferredObject<MessageDispatcher<NativeRequestType, JsRequestType>> = defer()
	private _appUpdateListener: (() => void) | null = null

	async init() {
		let transport: Transport<NativeRequestType, JsRequestType>

		if (isAndroidApp()) {
			const androidTransport = new AndroidNativeTransport()
			androidTransport.start()
			transport = androidTransport
		} else if (isIOSApp()) {
			transport = new IosNativeTransport()
		} else if (isDesktop() || isAdminClient()) {
			transport = new DesktopTransport(window.nativeApp)
		} else {
			throw new ProgrammingError("Tried to create a native interface in the browser")
		}

		// All possible commands are in a big pile together, but we only need certain ones for either app or desktop
		// Typescript doesn't like this, we could be more specific
		const commands = downcast<Commands<JsRequestType>>(isApp() ? appCommands : desktopCommands)
		// Ensure that we have messaged native with "init" before we allow anyone else to make native requests
		const queue = new MessageDispatcher<NativeRequestType, JsRequestType>(transport, commands)
		await queue.postRequest(new Request("init", []))

		this._dispatchDeferred.resolve(queue)
	}

	// for testing
	async initWithQueue(queue: MessageDispatcher<NativeRequestType, JsRequestType>) {
		this._dispatchDeferred.resolve(queue)
	}

	/**
	 * Send a request to the native side.
	 */
	async invokeNative(msg: Request<NativeRequestType>): Promise<any> {
		const dispatch = await this._dispatchDeferred.promise
		return dispatch.postRequest(msg)
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
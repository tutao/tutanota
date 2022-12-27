import { assertMainOrNode } from "../../api/common/Env.js"
import { Message, Transport } from "../../api/common/MessageDispatcher.js"
import { NativeApp } from "../../global.js"

assertMainOrNode()

/**
 * Transport for communication between electron native and webview
 * Uses window.nativeApp, which is injected by the preload script in desktop mode
 * electron can handle message passing without jsonification
 */

export class DesktopNativeTransport<OutgoingRequestType extends string = JsRequestType, IncomingRequestType extends string = NativeRequestType>
	implements Transport<OutgoingRequestType, IncomingRequestType>
{
	constructor(private readonly nativeApp: NativeApp) {}

	postMessage(message: Message<OutgoingRequestType>) {
		this.nativeApp.invoke(message)
	}

	setMessageHandler(handler: (message: Message<IncomingRequestType>) => unknown): void {
		this.nativeApp.attach(handler)
	}
}

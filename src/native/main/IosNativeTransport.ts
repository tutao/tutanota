import { Transport } from "../../api/common/threading/Transport.js"
import { decodeNativeMessage, encodeNativeMessage, JsMessageHandler, NativeMessage } from "../common/NativeLineProtocol.js"
import { Base64, base64ToUint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env.js"

assertMainOrNode()

/**
 * Transport for communication between ios native and webview
 * Messages are passed from native via as eval()-type call which invokes sendMessageFromApp, see WebViewBridge.swift
 * window.tutao.nativeApp is injected during webview initialization
 */

export class IosNativeTransport implements Transport<NativeRequestType, JsRequestType> {
	private messageHandler: JsMessageHandler | null = null

	constructor(private readonly window: Window) {
		this.window.tutao.nativeApp = this
	}

	postMessage(message: NativeMessage) {
		const encoded = encodeNativeMessage(message)
		// @ts-ignore this is set in the WebViewBrigde on Ios
		this.window.webkit.messageHandlers.nativeApp.postMessage(encoded)
	}

	setMessageHandler(handler: JsMessageHandler): void {
		this.messageHandler = handler
	}

	receiveMessageFromApp(msg64: Base64): void {
		const handler = this.messageHandler

		if (handler) {
			const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64))
			const parsed = decodeNativeMessage(msg)
			handler(parsed)
		} else {
			console.warn("Request from native but no handler is set!")
		}
	}
}

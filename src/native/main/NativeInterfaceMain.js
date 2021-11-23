// @flow
import {assertMainOrNode, isAdminClient, isApp, isDesktop} from "../../api/common/Env";
import type {Message, Transport} from "../../api/common/Queue"
import {Queue, Request} from "../../api/common/Queue";
import type {Base64} from "@tutao/tutanota-utils";
import {base64ToUint8Array, noOp, utf8Uint8ArrayToString} from "@tutao/tutanota-utils";
import type {NativeInterface} from "../common/NativeInterface"
import {appCommands, desktopCommands} from "./NativeWrapperCommands"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"

assertMainOrNode()

/**
 * Transport for communication between android/ios native and webview
 * Messages are passed from native via eval()-type calls which invoke sendMessageFromApp, see Native.java/WebViewBridge.swift
 * window.tutao.nativeApp is injected during webview initialization on both platforms
 */
class AppTransport implements Transport {

	_messageHandler: Message => mixed = noOp

	constructor() {
		window.tutao.nativeApp = this
	}

	postMessage(message: Message) {
		window.nativeApp.invoke(JSON.stringify(message))
	}

	setMessageHandler(handler: Message => mixed): mixed {
		this._messageHandler = handler
	}

	sendMessageFromApp(msg64: Base64): void {
		const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64))
		this._messageHandler(JSON.parse(msg))
	}
}

/**
 * Transport for communication between electron native and webview
 * Uses window.nativeApp, which is injected by the preload script in desktop mode
 * electron can handle message passing without jsonification
 */
class DesktopTransport implements Transport {
	postMessage(message: Message) {
		window.nativeApp.invoke(message)
	}

	setMessageHandler(handler: Message => mixed): mixed {
		window.nativeApp.attach(handler)
	}
}

export class NativeInterfaceMain implements NativeInterface {

	+_queue: Promise<Queue>
	_appUpdateListener: ?() => void

	constructor() {

		let transport
		if (isApp()) {
			transport = new AppTransport()
		} else if (isDesktop() || isAdminClient()) {
			transport = new DesktopTransport()
		} else {
			throw new ProgrammingError("Tried to create a native interface in the browser")
		}

		const commands = isApp() ? appCommands : desktopCommands

		// Ensure that we have messaged native with "init" before we allow anyone else to make native requests
		this._queue = Promise.resolve().then(async () => {
			const queue = new Queue(transport, commands)
			await queue.postRequest(new Request("init", []))
			return queue
		})
	}

	/**
	 * Send a request to the native side
	 */
	async invokeNative(msg: Request): Promise<any> {
		const queue = await this._queue
		return queue.postRequest(msg)
	}

	/**
	 * saves a listener method to be called when an
	 * app update has been downloaded on the native side
	 */
	setAppUpdateListener(listener: () => void): void {
		this._appUpdateListener = listener
	}

	/**
	 * call the update listener if set
	 */
	handleUpdateDownload(): void {
		this._appUpdateListener?.()
	}
}
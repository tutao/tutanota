import {Commands, MessageDispatcher, Request} from "../../api/common/MessageDispatcher.js"
import {exposeLocal} from "../../api/common/WorkerProxy"
import {assertNotNull} from "@tutao/tutanota-utils"
import {DesktopNativeTransport} from "./DesktopNativeTransport.js"
import {BrowserWebauthn} from "../../misc/2fa/webauthn/BrowserWebauthn.js"

export type WebToNativeRequest = "init"
export type NativeToWebRequest = "facade"

/**
 * this is hosted on the server, but will only be used inside a WebDialog for the desktop client.
 */
export class WebauthnNativeBridge {
	private readonly dispatcher: MessageDispatcher<WebToNativeRequest, NativeToWebRequest>
	private impl!: BrowserWebauthn

	constructor() {
		const nativeApp = assertNotNull(window.nativeAppWebDialog)
		const transport: DesktopNativeTransport<WebToNativeRequest, NativeToWebRequest> = new DesktopNativeTransport(nativeApp)
		const that = this
		const commands: Commands<NativeToWebRequest> = {
			"facade": exposeLocal({
				get WebAuthnFacade(): BrowserWebauthn {
					return that.impl
				}
			})
		}
		this.dispatcher = new MessageDispatcher<WebToNativeRequest, NativeToWebRequest>(transport, commands)
	}

	async init(impl: BrowserWebauthn): Promise<void> {
		this.impl = impl
		return this.dispatcher.postRequest(new Request("init", []))
	}
}
import { Commands, MessageDispatcher, Request } from "../../api/common/threading/MessageDispatcher.js"
import { exposeLocalDelayed } from "../../api/common/WorkerProxy"
import { assertNotNull, defer, DeferredObject } from "@tutao/tutanota-utils"
import { DesktopNativeTransport } from "./DesktopNativeTransport.js"
import { BrowserWebauthn } from "../../misc/2fa/webauthn/BrowserWebauthn.js"

export type WebToNativeRequest = "init"
export type NativeToWebRequest = "facade"

/**
 * this is hosted on the server, but will only be used inside a WebDialog for the desktop client.
 */
export class WebauthnNativeBridge {
	private readonly dispatcher: MessageDispatcher<WebToNativeRequest, NativeToWebRequest>
	private readonly impl: DeferredObject<BrowserWebauthn> = defer()

	constructor() {
		const nativeApp = assertNotNull(window.nativeAppWebDialog)
		const transport: DesktopNativeTransport<WebToNativeRequest, NativeToWebRequest> = new DesktopNativeTransport(nativeApp)
		const that = this
		const commands: Commands<NativeToWebRequest> = {
			facade: exposeLocalDelayed({
				WebAuthnFacade(): Promise<BrowserWebauthn> {
					return that.impl.promise
				},
			}),
		}
		this.dispatcher = new MessageDispatcher<WebToNativeRequest, NativeToWebRequest>(transport, commands, "webauthn-node")
	}

	async init(impl: BrowserWebauthn): Promise<void> {
		this.impl.resolve(impl)
		return this.dispatcher.postRequest(new Request("init", []))
	}
}

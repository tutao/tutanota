import {Commands, MessageDispatcher, Request} from "../../api/common/MessageDispatcher.js"
import {exposeLocal} from "../../api/common/WorkerProxy"
import {WebAuthn} from "../../misc/2fa/webauthn/WebAuthn.js"
import {assertNotNull} from "@tutao/tutanota-utils"
import {DesktopNativeTransport} from "./DesktopNativeTransport.js"

export type WebToNativeRequest = "init"
export type NativeToWebRequest = "facade"

export class WebauthnNativeBridge {
	private readonly dispatcher: MessageDispatcher<WebToNativeRequest, NativeToWebRequest>
	private impl!: WebAuthn

	constructor() {
		const nativeApp = assertNotNull(window.nativeAppWebDialog)
		const transport: DesktopNativeTransport<WebToNativeRequest, NativeToWebRequest> = new DesktopNativeTransport(nativeApp)
		const that = this
		const commands: Commands<NativeToWebRequest> = {
			"facade": exposeLocal({
				get webauthn(): WebAuthn {
					return that.impl
				}
			})
		}
		this.dispatcher = new MessageDispatcher<WebToNativeRequest, NativeToWebRequest>(transport, commands)
	}

	init(impl: WebAuthn): Promise<void> {
		this.impl = impl
		return this.dispatcher.postRequest(new Request("init", []))
	}
}
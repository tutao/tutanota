import {Commands, MessageDispatcher, Request} from "../../api/common/MessageDispatcher.js"
import {DesktopTransport} from "./NativeInterfaceMain.js"
import {exposeLocal} from "../../api/common/WorkerProxy"
import {IWebauthn} from "../../misc/2fa/webauthn/IWebauthn"
import {NativeApp} from "../../global"
import {assertNotNull} from "@tutao/tutanota-utils"

export type WebToNativeRequest = "init"
export type NativeToWebRequest = "facade"

export class WebauthnNativeBridge {
	private readonly dispatcher: MessageDispatcher<WebToNativeRequest, NativeToWebRequest>
	private impl!: IWebauthn

	constructor() {
		const nativeApp = assertNotNull(window.nativeAppWebDialog)
		const transport: DesktopTransport<WebToNativeRequest, NativeToWebRequest> = new DesktopTransport(nativeApp)
		const that = this
		const commands: Commands<NativeToWebRequest> = {
			"facade": exposeLocal({
				get webauthn(): IWebauthn {
					return that.impl
				}
			})
		}
		this.dispatcher = new MessageDispatcher<WebToNativeRequest, NativeToWebRequest>(transport, commands)
	}

	init(impl: IWebauthn): Promise<void> {
		this.impl = impl
		return this.dispatcher.postRequest(new Request("init", []))
	}
}
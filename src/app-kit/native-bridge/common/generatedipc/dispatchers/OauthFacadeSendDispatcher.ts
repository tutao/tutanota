/* generated file, don't edit. */

import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class OauthFacadeSendDispatcher implements OauthFacade {
	constructor(private readonly transport: NativeInterface) {}
	async openOauthWindow(...args: Parameters<OauthFacade["openOauthWindow"]>) {
		return this.transport.invokeNative("ipc", ["OauthFacade", "openOauthWindow", ...args])
	}
}

/* generated file, don't edit. */

import { WebAuthnFacade } from "./WebAuthnFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class WebAuthnFacadeSendDispatcher implements WebAuthnFacade {
	constructor(private readonly transport: NativeInterface) {}
	async register(...args: Parameters<WebAuthnFacade["register"]>) {
		return this.transport.invokeNative("ipc", ["WebAuthnFacade", "register", ...args])
	}
	async sign(...args: Parameters<WebAuthnFacade["sign"]>) {
		return this.transport.invokeNative("ipc", ["WebAuthnFacade", "sign", ...args])
	}
	async abortCurrentOperation(...args: Parameters<WebAuthnFacade["abortCurrentOperation"]>) {
		return this.transport.invokeNative("ipc", ["WebAuthnFacade", "abortCurrentOperation", ...args])
	}
	async isSupported(...args: Parameters<WebAuthnFacade["isSupported"]>) {
		return this.transport.invokeNative("ipc", ["WebAuthnFacade", "isSupported", ...args])
	}
	async canAttemptChallengeForRpId(...args: Parameters<WebAuthnFacade["canAttemptChallengeForRpId"]>) {
		return this.transport.invokeNative("ipc", ["WebAuthnFacade", "canAttemptChallengeForRpId", ...args])
	}
	async canAttemptChallengeForU2FAppId(...args: Parameters<WebAuthnFacade["canAttemptChallengeForU2FAppId"]>) {
		return this.transport.invokeNative("ipc", ["WebAuthnFacade", "canAttemptChallengeForU2FAppId", ...args])
	}
}

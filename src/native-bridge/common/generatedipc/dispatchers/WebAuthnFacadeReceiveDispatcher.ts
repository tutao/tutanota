/* generated file, don't edit. */

import { WebAuthnRegistrationChallenge } from "@tutao/native-bridge/generatedIpc/types"
import { WebAuthnSignChallenge } from "@tutao/native-bridge/generatedIpc/types"
import { WebAuthnFacade } from "@tutao/native-bridge/generatedIpc/types"

export class WebAuthnFacadeReceiveDispatcher {
	constructor(private readonly facade: WebAuthnFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "register": {
				const challenge: WebAuthnRegistrationChallenge = arg[0]
				return this.facade.register(challenge)
			}
			case "sign": {
				const challenge: WebAuthnSignChallenge = arg[0]
				return this.facade.sign(challenge)
			}
			case "abortCurrentOperation": {
				return this.facade.abortCurrentOperation()
			}
			case "isSupported": {
				return this.facade.isSupported()
			}
			case "canAttemptChallengeForRpId": {
				const rpId: string = arg[0]
				return this.facade.canAttemptChallengeForRpId(rpId)
			}
			case "canAttemptChallengeForU2FAppId": {
				const appId: string = arg[0]
				return this.facade.canAttemptChallengeForU2FAppId(appId)
			}
		}
	}
}

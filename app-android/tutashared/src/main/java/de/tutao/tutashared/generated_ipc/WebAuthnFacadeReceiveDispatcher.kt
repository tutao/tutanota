/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class WebAuthnFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: WebAuthnFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"register" -> {
				val challenge: WebAuthnRegistrationChallenge = json.decodeFromString(arg[0])
				val result: WebAuthnRegistrationResult = this.facade.register(
					challenge,
				)
				return json.encodeToString(result)
			}
			"sign" -> {
				val challenge: WebAuthnSignChallenge = json.decodeFromString(arg[0])
				val result: WebAuthnSignResult = this.facade.sign(
					challenge,
				)
				return json.encodeToString(result)
			}
			"abortCurrentOperation" -> {
				val result: Unit = this.facade.abortCurrentOperation(
				)
				return json.encodeToString(result)
			}
			"isSupported" -> {
				val result: Boolean = this.facade.isSupported(
				)
				return json.encodeToString(result)
			}
			"canAttemptChallengeForRpId" -> {
				val rpId: String = json.decodeFromString(arg[0])
				val result: Boolean = this.facade.canAttemptChallengeForRpId(
					rpId,
				)
				return json.encodeToString(result)
			}
			"canAttemptChallengeForU2FAppId" -> {
				val appId: String = json.decodeFromString(arg[0])
				val result: Boolean = this.facade.canAttemptChallengeForU2FAppId(
					appId,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for WebAuthnFacade: $method")
		}
	}
}

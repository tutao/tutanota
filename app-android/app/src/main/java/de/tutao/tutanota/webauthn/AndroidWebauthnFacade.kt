package de.tutao.tutanota.webauthn

import android.net.Uri
import android.util.Log
import de.tutao.tutanota.MainActivity
import de.tutao.tutanota.base64ToString
import de.tutao.tutanota.ipc.*
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AndroidWebauthnFacade(
		private val activity: MainActivity,
		private val json: Json
) : WebAuthnFacade {
	companion object {
		private const val TAG = "Webauthn"
	}

	override suspend fun sign(challenge: WebAuthnSignChallenge): WebAuthnSignResult {
		val response = sendRequest<_, TaggedWebauthnSignResult>(
				"sign",
				baseUrlToBrowserUrl(challenge.domain),
				challenge,
		)
		when (response) {
			is TaggedWebauthnSignResult.Success -> return response.value
			is TaggedWebauthnSignResult.Error -> throw WebauthnError(response.stack)
		}
	}

	override suspend fun register(challenge: WebAuthnRegistrationChallenge): WebAuthnRegistrationResult {
		val response = sendRequest<_, TaggedWebauthnRegistrationResult>(
				"register",
				baseUrlToBrowserUrl(challenge.domain),
				challenge,
		)
		when (response) {
			is TaggedWebauthnRegistrationResult.Success -> return response.value
			is TaggedWebauthnRegistrationResult.Error -> throw  WebauthnError(response.stack)
		}
	}

	private fun baseUrlToBrowserUrl(baseUrl: String) =
			Uri.parse(baseUrl).buildUpon().appendPath("webauthnmobile").build().toString()

	private suspend inline fun <reified Req, reified Res> sendRequest(
			action: String,
			baseUrl: String,
			value: Req
	): Res {
		// we should use the domain, right?
		val serializedChallenge = json.encodeToString(value)
		Log.d(TAG, "Challenge: $serializedChallenge")
		val url = Uri.parse(baseUrl)
				.buildUpon()
				.appendQueryParameter("action", action)
				.appendQueryParameter(
						"cbUrl",
						"intent://webauthn/#Intent;scheme=tutanota;package=de.tutao.tutanota.debug;S.result={result};end"
				)
				.appendQueryParameter("challenge", serializedChallenge)
				.build()
		val stringResult = activity.startWebauthn(url)
		val jsonResult = stringResult.base64ToString()
		Log.d(TAG, "got result: $jsonResult")
		// pass deserializer manually to not register it as polymorphic
		return json.decodeFromString(jsonResult)
	}

	override suspend fun abortCurrentOperation() {
		// no-op for now, we would like to bring our activity to the front but we can't do it while our activity is
		// not in the stack
	}

	override suspend fun isSupported(): Boolean = true

	override suspend fun canAttemptChallengeForRpId(rpId: String): Boolean = true

	override suspend fun canAttemptChallengeForU2FAppId(appId: String): Boolean = true
}

// Result type is duplicated because of serialization complications because generic sealed class required
// polymorphic serializer
@Serializable
sealed class TaggedWebauthnSignResult {
	@Serializable
	@SerialName("success")
	data class Success(val value: WebAuthnSignResult) : TaggedWebauthnSignResult()

	@Serializable
	@SerialName("error")
	data class Error(val name: String, val stack: String) : TaggedWebauthnSignResult()
}

// Result type is duplicated because of serialization complications
@Serializable
sealed class TaggedWebauthnRegistrationResult {
	@Serializable
	@SerialName("success")
	data class Success(val value: WebAuthnRegistrationResult) : TaggedWebauthnRegistrationResult()

	@Serializable
	@SerialName("error")
	data class Error(val name: String, val stack: String) : TaggedWebauthnRegistrationResult()
}

class WebauthnError(message: String) : Exception(message)
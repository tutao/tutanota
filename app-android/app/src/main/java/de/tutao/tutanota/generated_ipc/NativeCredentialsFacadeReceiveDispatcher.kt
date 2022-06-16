/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class NativeCredentialsFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: NativeCredentialsFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"encryptUsingKeychain" -> {
				val data: DataWrapper = json.decodeFromString(arg[0])
				val encryptionMode: CredentialEncryptionMode = json.decodeFromString(arg[1])
				val result: DataWrapper = this.facade.encryptUsingKeychain(
					data,
					encryptionMode,
				)
				return json.encodeToString(result)
			}
			"decryptUsingKeychain" -> {
				val encryptedData: DataWrapper = json.decodeFromString(arg[0])
				val encryptionMode: CredentialEncryptionMode = json.decodeFromString(arg[1])
				val result: DataWrapper = this.facade.decryptUsingKeychain(
					encryptedData,
					encryptionMode,
				)
				return json.encodeToString(result)
			}
			"getSupportedEncryptionModes" -> {
				val result: List<CredentialEncryptionMode> = this.facade.getSupportedEncryptionModes(
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativeCredentialsFacade: $method")
		}
	}
}

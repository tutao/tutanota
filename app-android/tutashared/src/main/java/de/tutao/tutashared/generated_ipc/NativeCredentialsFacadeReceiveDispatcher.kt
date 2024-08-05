/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class NativeCredentialsFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: NativeCredentialsFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"getSupportedEncryptionModes" -> {
				val result: List<CredentialEncryptionMode> = this.facade.getSupportedEncryptionModes(
				)
				return json.encodeToString(result)
			}
			"loadAll" -> {
				val result: List<PersistedCredentials> = this.facade.loadAll(
				)
				return json.encodeToString(result)
			}
			"store" -> {
				val credentials: UnencryptedCredentials = json.decodeFromString(arg[0])
				val result: Unit = this.facade.store(
					credentials,
				)
				return json.encodeToString(result)
			}
			"storeEncrypted" -> {
				val credentials: PersistedCredentials = json.decodeFromString(arg[0])
				val result: Unit = this.facade.storeEncrypted(
					credentials,
				)
				return json.encodeToString(result)
			}
			"loadByUserId" -> {
				val id: String = json.decodeFromString(arg[0])
				val result: UnencryptedCredentials? = this.facade.loadByUserId(
					id,
				)
				return json.encodeToString(result)
			}
			"deleteByUserId" -> {
				val id: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteByUserId(
					id,
				)
				return json.encodeToString(result)
			}
			"getCredentialEncryptionMode" -> {
				val result: CredentialEncryptionMode? = this.facade.getCredentialEncryptionMode(
				)
				return json.encodeToString(result)
			}
			"setCredentialEncryptionMode" -> {
				val encryptionMode: CredentialEncryptionMode = json.decodeFromString(arg[0])
				val result: Unit = this.facade.setCredentialEncryptionMode(
					encryptionMode,
				)
				return json.encodeToString(result)
			}
			"clear" -> {
				val result: Unit = this.facade.clear(
				)
				return json.encodeToString(result)
			}
			"migrateToNativeCredentials" -> {
				val credentials: List<PersistedCredentials> = json.decodeFromString(arg[0])
				val encryptionMode: CredentialEncryptionMode = json.decodeFromString(arg[1])
				val credentialsKey: DataWrapper = json.decodeFromString(arg[2])
				val result: Unit = this.facade.migrateToNativeCredentials(
					credentials,
					encryptionMode,
					credentialsKey,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativeCredentialsFacade: $method")
		}
	}
}

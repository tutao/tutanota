/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
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
			"loadAll" -> {
				val result: List<PersistedCredentials> = this.facade.loadAll(
				)
				return json.encodeToString(result)
			}
			"store" -> {
				val credentials: PersistedCredentials = json.decodeFromString(arg[0])
				val result: Unit = this.facade.store(
					credentials,
				)
				return json.encodeToString(result)
			}
			"loadByUserId" -> {
				val id: String = json.decodeFromString(arg[0])
				val result: PersistedCredentials? = this.facade.loadByUserId(
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
				val encryptionMode: CredentialEncryptionMode? = json.decodeFromString(arg[0])
				val result: Unit = this.facade.setCredentialEncryptionMode(
					encryptionMode,
				)
				return json.encodeToString(result)
			}
			"getCredentialsEncryptionKey" -> {
				val result: DataWrapper? = this.facade.getCredentialsEncryptionKey(
				)
				return json.encodeToString(result)
			}
			"setCredentialsEncryptionKey" -> {
				val credentialsEncryptionKey: DataWrapper? = json.decodeFromString(arg[0])
				val result: Unit = this.facade.setCredentialsEncryptionKey(
					credentialsEncryptionKey,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativeCredentialsFacade: $method")
		}
	}
}

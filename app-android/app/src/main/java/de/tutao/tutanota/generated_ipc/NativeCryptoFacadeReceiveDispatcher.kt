/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class NativeCryptoFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: NativeCryptoFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"rsaEncrypt" -> {
				val publicKey: RsaPublicKey = json.decodeFromString(arg[0])
				val data: DataWrapper = json.decodeFromString(arg[1])
				val seed: DataWrapper = json.decodeFromString(arg[2])
				val result: DataWrapper = this.facade.rsaEncrypt(
					publicKey,
					data,
					seed,
				)
				return json.encodeToString(result)
			}
			"rsaDecrypt" -> {
				val privateKey: RsaPrivateKey = json.decodeFromString(arg[0])
				val data: DataWrapper = json.decodeFromString(arg[1])
				val result: DataWrapper = this.facade.rsaDecrypt(
					privateKey,
					data,
				)
				return json.encodeToString(result)
			}
			"aesEncryptFile" -> {
				val key: DataWrapper = json.decodeFromString(arg[0])
				val fileUri: String = json.decodeFromString(arg[1])
				val iv: DataWrapper = json.decodeFromString(arg[2])
				val result: EncryptedFileInfo = this.facade.aesEncryptFile(
					key,
					fileUri,
					iv,
				)
				return json.encodeToString(result)
			}
			"aesDecryptFile" -> {
				val key: DataWrapper = json.decodeFromString(arg[0])
				val fileUri: String = json.decodeFromString(arg[1])
				val result: String = this.facade.aesDecryptFile(
					key,
					fileUri,
				)
				return json.encodeToString(result)
			}
			"generateRsaKey" -> {
				val seed: DataWrapper = json.decodeFromString(arg[0])
				val result: RsaKeyPair = this.facade.generateRsaKey(
					seed,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativeCryptoFacade: $method")
		}
	}
}

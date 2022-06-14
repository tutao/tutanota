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
				val publicKey: PublicKey = json.decodeFromString(arg[0])
				val base64Data: String = json.decodeFromString(arg[1])
				val base64Seed: String = json.decodeFromString(arg[2])
				val result: String = this.facade.rsaEncrypt(
					publicKey,
					base64Data,
					base64Seed,
				)
				return json.encodeToString(result)
			}
			"rsaDecrypt" -> {
				val privateKey: PrivateKey = json.decodeFromString(arg[0])
				val base64Data: String = json.decodeFromString(arg[1])
				val result: String = this.facade.rsaDecrypt(
					privateKey,
					base64Data,
				)
				return json.encodeToString(result)
			}
			"aesEncryptFile" -> {
				val key: String = json.decodeFromString(arg[0])
				val fileUri: String = json.decodeFromString(arg[1])
				val iv: String = json.decodeFromString(arg[2])
				val result: EncryptedFileInfo = this.facade.aesEncryptFile(
					key,
					fileUri,
					iv,
				)
				return json.encodeToString(result)
			}
			"aesDecryptFile" -> {
				val key: String = json.decodeFromString(arg[0])
				val fileUri: String = json.decodeFromString(arg[1])
				val result: String = this.facade.aesDecryptFile(
					key,
					fileUri,
				)
				return json.encodeToString(result)
			}
			"generateRsaKey" -> {
				val seed: String = json.decodeFromString(arg[0])
				val result: RsaKeyPair = this.facade.generateRsaKey(
					seed,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativeCryptoFacade: $method")
		}
	}
}

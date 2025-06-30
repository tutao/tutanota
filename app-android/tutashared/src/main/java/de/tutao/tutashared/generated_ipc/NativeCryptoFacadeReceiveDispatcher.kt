/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

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
			"argon2idGeneratePassphraseKey" -> {
				val passphrase: String = json.decodeFromString(arg[0])
				val salt: DataWrapper = json.decodeFromString(arg[1])
				val result: DataWrapper = this.facade.argon2idGeneratePassphraseKey(
					passphrase,
					salt,
				)
				return json.encodeToString(result)
			}
			"generateKyberKeypair" -> {
				val seed: DataWrapper = json.decodeFromString(arg[0])
				val result: KyberKeyPair = this.facade.generateKyberKeypair(
					seed,
				)
				return json.encodeToString(result)
			}
			"kyberEncapsulate" -> {
				val publicKey: KyberPublicKey = json.decodeFromString(arg[0])
				val seed: DataWrapper = json.decodeFromString(arg[1])
				val result: KyberEncapsulation = this.facade.kyberEncapsulate(
					publicKey,
					seed,
				)
				return json.encodeToString(result)
			}
			"kyberDecapsulate" -> {
				val privateKey: KyberPrivateKey = json.decodeFromString(arg[0])
				val ciphertext: DataWrapper = json.decodeFromString(arg[1])
				val result: DataWrapper = this.facade.kyberDecapsulate(
					privateKey,
					ciphertext,
				)
				return json.encodeToString(result)
			}
			"generateEd25519Keypair" -> {
				val result: IPCEd25519KeyPair = this.facade.generateEd25519Keypair(
				)
				return json.encodeToString(result)
			}
			"ed25519Sign" -> {
				val privateKey: IPCEd25519PrivateKey = json.decodeFromString(arg[0])
				val data: DataWrapper = json.decodeFromString(arg[1])
				val result: IPCEd25519Signature = this.facade.ed25519Sign(
					privateKey,
					data,
				)
				return json.encodeToString(result)
			}
			"ed25519Verify" -> {
				val publicKey: IPCEd25519PublicKey = json.decodeFromString(arg[0])
				val data: DataWrapper = json.decodeFromString(arg[1])
				val signature: IPCEd25519Signature = json.decodeFromString(arg[2])
				val result: Boolean = this.facade.ed25519Verify(
					publicKey,
					data,
					signature,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativeCryptoFacade: $method")
		}
	}
}

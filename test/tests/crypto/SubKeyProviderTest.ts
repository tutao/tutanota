import o, { assertThrows } from "@tutao/otest"
import { object } from "testdouble"
import { AppNameEnum, ClientTypeModel } from "../../../src/platform-kit/meta"
import { CryptoError } from "../../../src/platform-kit/crypto/error"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"
import {
	aes256RandomKey,
	generateKdfNonce,
	KdfNonce,
	SubKeyInfoWithoutSessionKey,
	SymmetricCipherVersion,
	VersionedKey,
} from "../../../src/platform-kit/crypto"
import { SubKeyInfo, SubKeyProvider } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/encryption/SubKeyProvider"

o.spec("SubKeyProviderTest", () => {
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let instanceTypeId: ClientTypeModel
	let versionedKey: VersionedKey
	let kdfNonce: KdfNonce

	o.before(() => {
		symmetricKeyDeriver = object()
		instanceTypeId = object()
		instanceTypeId.app = AppNameEnum.Tutanota
		instanceTypeId.name = "name"
		versionedKey = { object: aes256RandomKey(), version: 0 }
		kdfNonce = generateKdfNonce()
	})

	o.test("AesCbcThenHmac requires a sessionKey", async () => {
		const subKeyInfo: SubKeyInfo = new SubKeyInfoWithoutSessionKey(SymmetricCipherVersion.AesCbcThenHmac)
		const subKeyProvider: SubKeyProvider = new SubKeyProvider(subKeyInfo, symmetricKeyDeriver, instanceTypeId)
		const e = await assertThrows(CryptoError, async () => {
			subKeyProvider.getSubKeys()
		})
		o.check(e.message).equals("Encrypting tutanota/name requires a session key!")
	})

	o.test("AeadWithSessionKey requires a sessionKey", async () => {
		let subKeyInfo = new SubKeyInfoWithoutSessionKey(SymmetricCipherVersion.AeadWithSessionKey)
		const subKeyProvider: SubKeyProvider = new SubKeyProvider(subKeyInfo, symmetricKeyDeriver, instanceTypeId)
		const e = await assertThrows(CryptoError, async () => {
			subKeyProvider.getSubKeys()
		})

		o.check(e.message).equals("Encrypting tutanota/name requires a session key!")
	})
})

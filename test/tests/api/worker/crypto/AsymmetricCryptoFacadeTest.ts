import o from "../../../../../packages/otest/dist/otest.js"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { RsaImplementation } from "../../../../../src/common/api/worker/crypto/RsaImplementation.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoProtocolVersion } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { RSA_TEST_KEYPAIR } from "../facades/RsaPqPerformanceTest.js"
import { AesKey, bitArrayToUint8Array, EccKeyPair, KeyPairType, KyberPublicKey, PQKeyPairs, RsaKeyPair, rsaPublicKeyToHex } from "@tutao/tutanota-crypto"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { hexToUint8Array, Versioned } from "@tutao/tutanota-utils"
import { PublicKeys } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { PublicKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import { PublicKeyPutIn } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"

o.spec("AsymmetricCryptoFacadeTest", function () {
	let rsa: RsaImplementation
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cryptoWrapper: CryptoWrapper
	let serviceExecutor: IServiceExecutor

	let asymmetricCryptoFacade: AsymmetricCryptoFacade

	o.beforeEach(function () {
		rsa = object()
		pqFacade = object()
		keyLoaderFacade = object()
		cryptoWrapper = object()
		serviceExecutor = object()
		asymmetricCryptoFacade = new AsymmetricCryptoFacade(rsa, pqFacade, keyLoaderFacade, cryptoWrapper, serviceExecutor)
	})

	o.spec("decryptSymKeyWithKeyPair", function () {
		o("should raise a CryptoError when the protocol version is unknown", async function () {
			await assertThrows(CryptoError, async function () {
				await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(object(), "unknown" as CryptoProtocolVersion, object())
			})
		})

		o("should call RSA decryption when the protocol version is set to RSA", async function () {
			const pubEncSymKey: Uint8Array = object()

			when(rsa.decrypt(RSA_TEST_KEYPAIR.privateKey, pubEncSymKey)).thenResolve(new Uint8Array([1, 2, 3, 4]))

			await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(RSA_TEST_KEYPAIR, CryptoProtocolVersion.RSA, pubEncSymKey)

			verify(rsa.decrypt(RSA_TEST_KEYPAIR.privateKey, pubEncSymKey), { times: 1 })
		})

		o("should raise a Crypto Error when trying to decypher a RSA that is not an RSA KeyPair", async function () {
			const pubEncSymKey: Uint8Array = object()
			const keyPair = object<PQKeyPairs>()
			keyPair.keyPairType = KeyPairType.TUTA_CRYPT
			await assertThrows(CryptoError, async function () {
				await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keyPair, CryptoProtocolVersion.RSA, pubEncSymKey)
			})
		})

		o("should call tuta crypt decryption when the protocol version is set to TUTA_CRYPT", async function () {
			const pubEncSymKey: Uint8Array = object()
			const keyPair = object<PQKeyPairs>()
			keyPair.keyPairType = KeyPairType.TUTA_CRYPT

			when(pqFacade.decapsulateEncoded(pubEncSymKey, keyPair)).thenResolve({
				decryptedSymKeyBytes: new Uint8Array([1, 2, 3, 4]),
				senderIdentityPubKey: object(),
			})

			await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keyPair, CryptoProtocolVersion.TUTA_CRYPT, pubEncSymKey)

			verify(pqFacade.decapsulateEncoded(pubEncSymKey, keyPair), { times: 1 })
		})

		o("should raise a Crypto Error when trying to decypher a TutaCrypt that is not an TutaCrypt KeyPair", async function () {
			const pubEncSymKey: Uint8Array = object()
			const keyPair = object<RsaKeyPair>()
			keyPair.keyPairType = KeyPairType.RSA
			await assertThrows(CryptoError, async function () {
				await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keyPair, CryptoProtocolVersion.TUTA_CRYPT, pubEncSymKey)
			})
		})
	})

	o.spec("encryptPubSymKey", function () {
		const recipientKeyVersion = 1
		const senderKeyVersion = 2
		const senderGroupId = "senderGroupId"
		let symKey: AesKey
		let pubEncSymKeyBytes: Uint8Array
		let recipientKyberPublicKey: KyberPublicKey
		let senderPqKeyPair: Versioned<PQKeyPairs>
		let ephemeralKeyPair: EccKeyPair

		o.beforeEach(function () {
			recipientKyberPublicKey = object<KyberPublicKey>()
			symKey = [1, 2, 3, 4]
			pubEncSymKeyBytes = object<Uint8Array>()
			senderPqKeyPair = {
				object: { keyPairType: KeyPairType.TUTA_CRYPT, eccKeyPair: object(), kyberKeyPair: object() },
				version: senderKeyVersion,
			}
			ephemeralKeyPair = object()
			when(cryptoWrapper.generateEccKeyPair()).thenReturn(ephemeralKeyPair)
			when(keyLoaderFacade.loadCurrentKeyPair(senderGroupId)).thenResolve(senderPqKeyPair)
		})

		o("should raise a CryptoError when the key pair type is unknown", async function () {
			await assertThrows(CryptoError, async function () {
				await asymmetricCryptoFacade.encryptPubSymKey(symKey, object(), senderGroupId)
			})
		})

		o("should encrypt the sym key with the recipient PQ public key", async function () {
			const pubKyberKey = new Uint8Array([1, 2, 3, 4])
			const eccPublicKey = new Uint8Array([5, 6, 7, 8])
			const recipientPublicKeys: Versioned<PublicKeys> = {
				object: {
					pubKyberKey,
					pubEccKey: eccPublicKey,
					pubRsaKey: null,
				},
				version: recipientKeyVersion,
			}
			when(cryptoWrapper.bytesToKyberPublicKey(pubKyberKey)).thenReturn(recipientKyberPublicKey)
			when(
				pqFacade.encapsulateAndEncode(
					senderPqKeyPair.object.eccKeyPair,
					ephemeralKeyPair,
					{
						eccPublicKey,
						kyberPublicKey: recipientKyberPublicKey,
						keyPairType: KeyPairType.TUTA_CRYPT,
					},
					matchers.anything(),
				),
			).thenResolve(pubEncSymKeyBytes)

			const pubEncSymKey = await asymmetricCryptoFacade.encryptPubSymKey(symKey, recipientPublicKeys, senderGroupId)

			o(pubEncSymKey).deepEquals({
				pubEncSymKeyBytes,
				recipientKeyVersion,
				senderKeyVersion,
				cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
			})
		})

		o(
			"should encrypt the sym key with the recipient PQ public key and generate new sender ecc identity key pair (sender has only RSA key pair)",
			async function () {
				const newIdentityEccPair: EccKeyPair = { publicKey: object(), privateKey: object() }
				when(cryptoWrapper.generateEccKeyPair()).thenReturn(newIdentityEccPair, ephemeralKeyPair)
				const senderRsaKeyPair: Versioned<RsaKeyPair> = { object: RSA_TEST_KEYPAIR, version: senderKeyVersion }
				when(keyLoaderFacade.loadCurrentKeyPair(senderGroupId)).thenResolve(senderRsaKeyPair)
				const pubKyberKey = new Uint8Array([1, 2, 3, 4])
				const eccPublicKey = new Uint8Array([5, 6, 7, 8])
				const recipientPublicKeys: Versioned<PublicKeys> = {
					object: {
						pubKyberKey,
						pubEccKey: eccPublicKey,
						pubRsaKey: null,
					},
					version: recipientKeyVersion,
				}
				when(cryptoWrapper.bytesToKyberPublicKey(pubKyberKey)).thenReturn(recipientKyberPublicKey)
				when(
					pqFacade.encapsulateAndEncode(
						newIdentityEccPair,
						ephemeralKeyPair,
						{
							eccPublicKey,
							kyberPublicKey: recipientKyberPublicKey,
							keyPairType: KeyPairType.TUTA_CRYPT,
						},
						matchers.anything(),
					),
				).thenResolve(pubEncSymKeyBytes)
				const senderUserGroupKey = object<AesKey>()
				when(keyLoaderFacade.getCurrentSymGroupKey(senderGroupId)).thenResolve({ object: senderUserGroupKey, version: senderKeyVersion })
				const encryptedEccSenderPrivateKey = object<Uint8Array>()
				when(cryptoWrapper.encryptEccKey(senderUserGroupKey, newIdentityEccPair.privateKey)).thenReturn(encryptedEccSenderPrivateKey)

				const pubEncSymKey = await asymmetricCryptoFacade.encryptPubSymKey(symKey, recipientPublicKeys, senderGroupId)

				o(pubEncSymKey).deepEquals({
					pubEncSymKeyBytes,
					recipientKeyVersion,
					senderKeyVersion,
					cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
				})
				verify(
					serviceExecutor.put(
						PublicKeyService,
						matchers.argThat((arg: PublicKeyPutIn) => {
							return (
								arg.pubEccKey === newIdentityEccPair.publicKey &&
								arg.symEncPrivEccKey === encryptedEccSenderPrivateKey &&
								arg.keyGroup === senderGroupId
							)
						}),
					),
				)
			},
		)

		o("should encrypt the sym key with the recipient RSA public key", async function () {
			const recipientPublicKeys: Versioned<PublicKeys> = {
				object: {
					pubKyberKey: null,
					pubEccKey: null,
					pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
				},
				version: recipientKeyVersion,
			}

			when(
				rsa.encrypt(
					matchers.argThat((arg) => arg.keyPairType === KeyPairType.RSA),
					bitArrayToUint8Array(symKey),
				),
			).thenResolve(pubEncSymKeyBytes)

			const pubEncSymKey = await asymmetricCryptoFacade.encryptPubSymKey(symKey, recipientPublicKeys, senderGroupId)

			o(pubEncSymKey).deepEquals({
				pubEncSymKeyBytes,
				recipientKeyVersion,
				senderKeyVersion: null,
				cryptoProtocolVersion: CryptoProtocolVersion.RSA,
			})
		})

		o("raise a ProgrammingError when passing an RSA public key", async function () {
			await assertThrows(ProgrammingError, async function () {
				await asymmetricCryptoFacade.pqEncryptPubSymKey(
					object(),
					{
						object: {
							pubKyberKey: null,
							pubEccKey: null,
							pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
						},
						version: 2,
					},
					object(),
				)
			})
		})
	})
})

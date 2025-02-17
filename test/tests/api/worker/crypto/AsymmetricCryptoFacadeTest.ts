import o from "../../../../../packages/otest/dist/otest.js"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { RsaImplementation } from "../../../../../src/common/api/worker/crypto/RsaImplementation.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoProtocolVersion, EncryptionAuthStatus, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { RSA_TEST_KEYPAIR } from "../facades/RsaPqPerformanceTest.js"
import {
	AesKey,
	bitArrayToUint8Array,
	EccKeyPair,
	KeyPairType,
	KyberPublicKey,
	PQKeyPairs,
	PQPublicKeys,
	RsaEccPublicKey,
	RsaKeyPair,
	RsaPublicKey,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import { KeyLoaderFacade, parseKeyVersion } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { Versioned } from "@tutao/tutanota-utils"
import { PublicKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import { PubEncKeyData, PubEncKeyDataTypeRef, PublicKeyPutIn } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { createTestEntity } from "../../../TestUtils.js"
import { KeyVerificationFacade } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { PublicKeyIdentifier, PublicKeyProvider } from "../../../../../src/common/api/worker/facades/PublicKeyProvider.js"
import { KeyVersion } from "@tutao/tutanota-utils/dist/Utils.js"

o.spec("AsymmetricCryptoFacadeTest", function () {
	let rsa: RsaImplementation
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cryptoWrapper: CryptoWrapper
	let serviceExecutor: IServiceExecutor
	let keyVerificationFacade: KeyVerificationFacade
	let publicKeyProvider: PublicKeyProvider

	let asymmetricCryptoFacade: AsymmetricCryptoFacade

	o.beforeEach(function () {
		rsa = object()
		pqFacade = object()
		keyLoaderFacade = object()
		cryptoWrapper = object()
		serviceExecutor = object()
		keyVerificationFacade = object()
		publicKeyProvider = object()
		asymmetricCryptoFacade = new AsymmetricCryptoFacade(
			rsa,
			pqFacade,
			keyLoaderFacade,
			cryptoWrapper,
			serviceExecutor,
			async () => keyVerificationFacade,
			publicKeyProvider,
		)
	})

	o.spec("authenticateSender", function () {
		let identifier: string
		let identifierType: PublicKeyIdentifierType
		let senderIdentityPubKey: Uint8Array
		let senderKeyVersion: KeyVersion
		let pubKeyIdentifier: PublicKeyIdentifier

		o.beforeEach(() => {
			identifier = object<string>()
			identifierType = object<PublicKeyIdentifierType>()
			senderIdentityPubKey = new Uint8Array([1, 2, 3])
			senderKeyVersion = 0
			pubKeyIdentifier = {
				identifier,
				identifierType,
			}
		})

		o("should return TUTACRYPT_AUTHENTICATION_SUCCEEDED if the key matches", async function () {
			const rsaEccPublicKey: RsaEccPublicKey = {
				keyLength: 0,
				modulus: "",
				publicExponent: 0,
				version: 0,
				keyPairType: KeyPairType.RSA_AND_ECC,
				publicEccKey: senderIdentityPubKey,
			}
			when(publicKeyProvider.loadVersionedPubKey(pubKeyIdentifier, senderKeyVersion)).thenResolve(rsaEccPublicKey)

			const result = await asymmetricCryptoFacade.authenticateSender({ identifier, identifierType }, senderIdentityPubKey, senderKeyVersion)

			o(result).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
		})

		o("should return TUTACRYPT_AUTHENTICATION_FAILED if sender does not have an ecc identity key in the requested version", async function () {
			const rsaPublicKey: RsaPublicKey = object()
			rsaPublicKey.keyPairType = KeyPairType.RSA
			when(publicKeyProvider.loadVersionedPubKey(pubKeyIdentifier, senderKeyVersion)).thenResolve(rsaPublicKey)

			const result = await asymmetricCryptoFacade.authenticateSender({ identifier, identifierType }, senderIdentityPubKey, senderKeyVersion)

			o(result).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)
		})

		o("should return TUTACRYPT_AUTHENTICATION_FAILED if the key does not match", async function () {
			const rsaEccPublicKey: RsaEccPublicKey = {
				keyLength: 0,
				modulus: "",
				publicExponent: 0,
				version: 0,
				keyPairType: KeyPairType.RSA_AND_ECC,
				publicEccKey: new Uint8Array([4, 5, 6]),
			}
			when(publicKeyProvider.loadVersionedPubKey(pubKeyIdentifier, senderKeyVersion)).thenResolve(rsaEccPublicKey)

			const result = await asymmetricCryptoFacade.authenticateSender({ identifier, identifierType }, senderIdentityPubKey, senderKeyVersion)

			o(result).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)
		})
	})

	o.spec("decryptSymKeyWithKeyPairAndAuthenticate", function () {
		o("should throw CryptoError if authentication fails", async function () {
			const pubEncSymKey: Uint8Array = object()
			const symKey = new Uint8Array([1, 2, 3, 4])
			const keyPair = object<PQKeyPairs>()
			keyPair.keyPairType = KeyPairType.TUTA_CRYPT

			const senderKeyVersion = "1"
			const senderIdentifier = object<string>()
			const senderIdentifierType = PublicKeyIdentifierType.GROUP_ID
			const recipientIdentifier = object<string>()
			const recipientIdentifierType = PublicKeyIdentifierType.MAIL_ADDRESS
			const pubEncKeyData: PubEncKeyData = createTestEntity(PubEncKeyDataTypeRef, {
				pubEncSymKey,
				protocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
				senderKeyVersion,
				recipientIdentifier,
				recipientIdentifierType,
			})
			const rsaEccPublicKey: RsaEccPublicKey = {
				keyLength: 0,
				modulus: "",
				publicExponent: 0,
				version: 0,
				keyPairType: KeyPairType.RSA_AND_ECC,
				publicEccKey: new Uint8Array([4, 5, 6]),
			}
			when(pqFacade.decapsulateEncoded(pubEncSymKey, keyPair)).thenResolve({
				decryptedSymKeyBytes: symKey,
				senderIdentityPubKey: object(),
			})
			when(
				publicKeyProvider.loadVersionedPubKey(
					{
						identifierType: senderIdentifierType,
						identifier: senderIdentifier,
					},
					parseKeyVersion(senderKeyVersion),
				),
			).thenResolve(rsaEccPublicKey)

			await assertThrows(CryptoError, () =>
				asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(keyPair, pubEncKeyData, {
					identifier: senderIdentifier,
					identifierType: senderIdentifierType,
				}),
			)
		})

		o("should not try authentication when protocol is not TutaCrypt", async function () {
			const pubEncSymKey: Uint8Array = object()
			const pubEncKeyData: PubEncKeyData = createTestEntity(PubEncKeyDataTypeRef, {
				pubEncSymKey,
				protocolVersion: CryptoProtocolVersion.RSA,
				senderKeyVersion: null,
			})

			const senderIdentifier = object<string>()
			const senderIdentifierType = PublicKeyIdentifierType.GROUP_ID

			const symKey = new Uint8Array([1, 2, 3, 4])
			when(rsa.decrypt(RSA_TEST_KEYPAIR.privateKey, pubEncSymKey)).thenResolve(symKey)

			const result = await asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(RSA_TEST_KEYPAIR, pubEncKeyData, {
				identifier: senderIdentifier,
				identifierType: senderIdentifierType,
			})

			verify(publicKeyProvider, { times: 0 })
			o(result).deepEquals({ senderIdentityPubKey: null, decryptedAesKey: uint8ArrayToBitArray(symKey) })
		})
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
				await asymmetricCryptoFacade.asymEncryptSymKey(symKey, object(), senderGroupId)
			})
		})

		o("should encrypt the sym key with the recipient PQ public key", async function () {
			const recipientPublicKeys: Versioned<PQPublicKeys> = object()
			recipientPublicKeys.version = recipientKeyVersion
			recipientPublicKeys.object.keyPairType = KeyPairType.TUTA_CRYPT

			when(
				pqFacade.encapsulateAndEncode(senderPqKeyPair.object.eccKeyPair, ephemeralKeyPair, recipientPublicKeys.object, matchers.anything()),
			).thenResolve(pubEncSymKeyBytes)

			const pubEncSymKey = await asymmetricCryptoFacade.asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId)

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

				const recipientPublicKeys: Versioned<PQPublicKeys> = object()
				recipientPublicKeys.version = recipientKeyVersion
				recipientPublicKeys.object.keyPairType = KeyPairType.TUTA_CRYPT

				when(pqFacade.encapsulateAndEncode(newIdentityEccPair, ephemeralKeyPair, recipientPublicKeys.object, matchers.anything())).thenResolve(
					pubEncSymKeyBytes,
				)
				const senderUserGroupKey = object<AesKey>()
				when(keyLoaderFacade.getCurrentSymGroupKey(senderGroupId)).thenResolve({ object: senderUserGroupKey, version: senderKeyVersion })
				const encryptedEccSenderPrivateKey = object<Uint8Array>()
				when(cryptoWrapper.encryptEccKey(senderUserGroupKey, newIdentityEccPair.privateKey)).thenReturn(encryptedEccSenderPrivateKey)

				const pubEncSymKey = await asymmetricCryptoFacade.asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId)

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
			const recipientPublicKeys: Versioned<RsaPublicKey> = object()
			recipientPublicKeys.object.keyPairType = KeyPairType.RSA
			recipientPublicKeys.version = recipientKeyVersion

			when(
				rsa.encrypt(
					matchers.argThat((arg) => arg.keyPairType === KeyPairType.RSA),
					bitArrayToUint8Array(symKey),
				),
			).thenResolve(pubEncSymKeyBytes)

			const pubEncSymKey = await asymmetricCryptoFacade.asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId)

			o(pubEncSymKey).deepEquals({
				pubEncSymKeyBytes,
				recipientKeyVersion,
				senderKeyVersion: null,
				cryptoProtocolVersion: CryptoProtocolVersion.RSA,
			})
		})

		o("raise a ProgrammingError when passing an RSA public key", async function () {
			const versionedRsaPublicKey: Versioned<RsaPublicKey> = object()
			versionedRsaPublicKey.object.keyPairType = KeyPairType.RSA
			versionedRsaPublicKey.version = recipientKeyVersion

			await assertThrows(ProgrammingError, async function () {
				await asymmetricCryptoFacade.tutaCryptEncryptSymKey(object(), versionedRsaPublicKey, object())
			})
		})
	})
})

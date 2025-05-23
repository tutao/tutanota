import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { arrayEquals, getFirstOrThrow, hexToUint8Array, KeyVersion, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { PublicKeyIdentifier, PublicKeyProvider } from "../../../../../src/common/api/worker/facades/PublicKeyProvider.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { IdentityKeyService, PublicKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import {
	createIdentityKeyGetOut,
	createPublicKeyGetOut,
	createSystemKeysReturn,
	Group,
	GroupTypeRef,
	IdentityKeyGetOut,
	IdentityKeyPair,
	KeyMacTypeRef,
	PubDistributionKey,
	PublicKeyGetOut,
	PublicKeySignature,
	SystemKeysReturn,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import testData from "../crypto/CompatibilityTestData.json"
import {
	Aes256Key,
	bytesToEd25519PublicKey,
	bytesToKyberPublicKey,
	Ed25519PublicKey,
	EncryptedPqKeyPairs,
	hexToRsaPublicKey,
	KeyPairType,
	PQPublicKeys,
	RsaPublicKey,
	RsaX25519PublicKey,
} from "@tutao/tutanota-crypto"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { InvalidDataError, NotFoundError } from "../../../../../src/common/api/common/error/RestError"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { brandKeyMac, IdentityPubKeyAuthenticationParams, KeyAuthenticationFacade } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { createTestEntity } from "../../../TestUtils"
import { SigningKeyPairType, SigningPublicKey } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { EncryptionKeyVerificationState, IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants"
import { KeyVerificationFacade } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { KeyVerificationMismatchError } from "../../../../../src/common/api/common/error/KeyVerificationMismatchError"

const PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS = "alice@tuta.com"

o.spec("PublicKeyProviderTest", function () {
	let serviceExecutor: ServiceExecutor
	let entityClient: EntityClient
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let keyLoaderFacade: KeyLoaderFacade
	let publicKeyProvider: PublicKeyProvider

	let publicKeyIdentifier: PublicKeyIdentifier
	let currentVersion: KeyVersion

	let rsaPublicKey: Uint8Array
	let x25519PublicKey: Uint8Array
	let kyberPublicKey: Uint8Array
	let rawEd25519PublicKey: Uint8Array
	let ed25519PublicKey: Ed25519PublicKey
	let keyVerificationFacade: KeyVerificationFacade

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()
		keyAuthenticationFacade = object()
		keyLoaderFacade = object()
		keyVerificationFacade = object()
		publicKeyProvider = new PublicKeyProvider(serviceExecutor, entityClient, keyAuthenticationFacade, keyLoaderFacade, async () => keyVerificationFacade)

		const kyberTestData = getFirstOrThrow(testData.kyberEncryptionTests)
		kyberPublicKey = hexToUint8Array(kyberTestData.publicKey)
		const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
		rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
		const eccTestData = getFirstOrThrow(testData.x25519Tests)
		x25519PublicKey = hexToUint8Array(eccTestData.alicePublicKeyHex)

		rawEd25519PublicKey = hexToUint8Array(testData.ed25519Tests[0].alicePublicKeyHex)
		ed25519PublicKey = bytesToEd25519PublicKey(rawEd25519PublicKey)

		publicKeyIdentifier = object()
		publicKeyIdentifier.identifier = PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS
		publicKeyIdentifier.identifierType = PublicKeyIdentifierType.MAIL_ADDRESS

		currentVersion = 2

		when(keyVerificationFacade.isSupported()).thenResolve(true)
	})

	o.spec("loadCurrentPubKey", function () {
		o("success pq keys (manually verified)", async function () {
			const signature: PublicKeySignature = object()
			signature.signature = object()
			const publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(currentVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature,
			})
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(keyVerificationFacade.verify(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				EncryptionKeyVerificationState.VERIFIED_MANUAL,
			)

			const expectedPublicKey: Versioned<PQPublicKeys> = {
				version: 2,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: x25519PublicKey,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				},
			}
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys.publicEncryptionKey).deepEquals(expectedPublicKey)
			o(pubKeys.verificationState).equals(EncryptionKeyVerificationState.VERIFIED_MANUAL)
			verify(keyVerificationFacade.verify(publicKeyIdentifier.identifier, matchers.anything(), signature.signature), { times: 1 })
		})

		o("success rsa keys (manually verified)", async function () {
			const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
			const rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
			const signature: PublicKeySignature = object()
			signature.signature = object()
			const publicKeyGetOut = createPublicKeyGetOut({
				pubEccKey: null,
				pubKyberKey: null,
				pubRsaKey: rsaPublicKey,
				pubKeyVersion: "0",
				signature,
			})

			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(keyVerificationFacade.verify(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				EncryptionKeyVerificationState.VERIFIED_MANUAL,
			)

			const decodedRsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(rsaPublicKey))

			const expectedPublicKey: Versioned<RsaPublicKey> = {
				version: 0,
				object: {
					keyPairType: KeyPairType.RSA,
					version: 0,
					keyLength: 2048,
					modulus: decodedRsaPublicKey.modulus,
					publicExponent: decodedRsaPublicKey.publicExponent,
				},
			}
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys.publicEncryptionKey).deepEquals(expectedPublicKey)
			o(pubKeys.verificationState).equals(EncryptionKeyVerificationState.VERIFIED_MANUAL)
			verify(keyVerificationFacade.verify(publicKeyIdentifier.identifier, matchers.anything(), signature.signature), { times: 1 })
		})

		o("success pq keys (TOFU)", async function () {
			const signature: PublicKeySignature = object()
			signature.signature = object()
			const publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(currentVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature,
			})
			const identityKeyGetOut = createIdentityKeyGetOut({
				publicIdentityKey: new Uint8Array([1, 2, 3]),
				publicIdentityKeyVersion: "0",
			})
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(serviceExecutor.get(IdentityKeyService, matchers.anything())).thenResolve(identityKeyGetOut)
			when(keyVerificationFacade.verify(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				EncryptionKeyVerificationState.NO_ENTRY,
				EncryptionKeyVerificationState.VERIFIED_TOFU,
			)

			const expectedPublicKey: Versioned<PQPublicKeys> = {
				version: 2,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: x25519PublicKey,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				},
			}
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys.publicEncryptionKey).deepEquals(expectedPublicKey)
			o(pubKeys.verificationState).equals(EncryptionKeyVerificationState.VERIFIED_TOFU)
			verify(keyVerificationFacade.trust(publicKeyIdentifier.identifier, matchers.anything(), IdentityKeySourceOfTrust.TOFU))
			verify(keyVerificationFacade.verify(publicKeyIdentifier.identifier, matchers.anything(), signature.signature), { times: 2 })
		})

		o("no identity key, no signature (TOFU) result in NO_ENTRY", async function () {
			const publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(currentVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature: null,
			})
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(serviceExecutor.get(IdentityKeyService, matchers.anything())).thenReject(new NotFoundError("no identity key"))
			when(keyVerificationFacade.verify(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				EncryptionKeyVerificationState.NO_ENTRY,
			)

			const expectedPublicKey: Versioned<PQPublicKeys> = {
				version: 2,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: x25519PublicKey,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				},
			}
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys.publicEncryptionKey).deepEquals(expectedPublicKey)
			o(pubKeys.verificationState).equals(EncryptionKeyVerificationState.NO_ENTRY)
			verify(keyVerificationFacade.verify(publicKeyIdentifier.identifier, matchers.anything(), null), { times: 1 })
		})

		o("no identity key, existing signature (TOFU) result in KeyVerificationMismatch", async function () {
			const signature: PublicKeySignature = object()
			signature.signature = object()
			const publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(currentVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature,
			})
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(serviceExecutor.get(IdentityKeyService, matchers.anything())).thenReject(new NotFoundError("no identity key"))
			when(keyVerificationFacade.verify(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				EncryptionKeyVerificationState.NO_ENTRY,
			)

			const error = await assertThrows(KeyVerificationMismatchError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(error.message).equals("no identity key for: " + PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS)
			verify(keyVerificationFacade.verify(publicKeyIdentifier.identifier, matchers.anything(), signature.signature), { times: 1 })
		})

		o("rsa key in version other than 0", async function () {
			const pubRsaKey = object<Uint8Array>()
			currentVersion = 1
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: String(currentVersion),
					pubRsaKey,
					pubKyberKey: null,
					pubEccKey: null,
					signature: null,
				}),
			)
			await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
		})
	})

	o.spec("loadPubKey", function () {
		const requestedVersion = 1

		o("success", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: String(requestedVersion),
					pubRsaKey: null,
					pubKyberKey: kyberPublicKey,
					pubEccKey: x25519PublicKey,
					signature: null,
				}),
			)

			const expectedPublicKey: Versioned<PQPublicKeys> = {
				version: 1,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: x25519PublicKey,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				},
			}

			const pubKeys = await publicKeyProvider.loadPubKey(publicKeyIdentifier, requestedVersion)
			o(pubKeys.publicEncryptionKey).deepEquals(expectedPublicKey)
		})

		o("invalid version returned", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: String(currentVersion),
					pubRsaKey: null,
					pubKyberKey: kyberPublicKey,
					pubEccKey: x25519PublicKey,
					signature: null,
				}),
			)
			o(currentVersion).notEquals(requestedVersion)
			await assertThrows(InvalidDataError, async () => publicKeyProvider.loadPubKey(publicKeyIdentifier, requestedVersion))
		})

		o("rsa key in version other than 0", async function () {
			const pubRsaKey = object<Uint8Array>()
			currentVersion = 1
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: String(currentVersion),
					pubRsaKey,
					pubKyberKey: null,
					pubEccKey: null,
					signature: null,
				}),
			)
			await assertThrows(CryptoError, async () => publicKeyProvider.loadPubKey(publicKeyIdentifier, currentVersion))
		})
	})

	o.spec("version validation", function () {
		o("throws if the version is negative", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: "-1",
					pubRsaKey: object(),
					pubKyberKey: null,
					pubEccKey: null,
					signature: null,
				}),
			)

			const e = await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})

		o("throws if the version is not an integer", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: "1.5",
					pubRsaKey: object(),
					pubKyberKey: null,
					pubEccKey: null,
					signature: null,
				}),
			)

			const e = await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})
	})

	o.spec("loadPublicIdentityKeyFromGroup", function () {
		o("success", async function () {
			const userGroup: Group = object()
			userGroup._id = "userGroup"
			const identityKeyPair: IdentityKeyPair = object()
			identityKeyPair.publicEd25519Key = rawEd25519PublicKey
			identityKeyPair.identityKeyVersion = "0"
			const identityPublicKeyMac = brandKeyMac(
				createTestEntity(KeyMacTypeRef, {
					taggedKeyVersion: "0",
					taggingKeyVersion: "1",
					taggingGroup: userGroup._id,
					tag: object(),
				}),
			)

			const userGroupKey: Aes256Key = object()

			identityKeyPair.publicKeyMac = identityPublicKeyMac
			userGroup.identityKeyPair = identityKeyPair

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)
			when(keyLoaderFacade.loadSymGroupKey(matchers.anything(), matchers.anything())).thenResolve(userGroupKey)

			const actualPublicIdentityKey = await publicKeyProvider.loadPublicIdentityKeyFromGroup(userGroup._id)

			o(actualPublicIdentityKey?.object).deepEquals({ key: ed25519PublicKey, type: SigningKeyPairType.Ed25519 })
			verify(
				keyAuthenticationFacade.verifyTag(
					matchers.argThat((params: IdentityPubKeyAuthenticationParams) => {
						return (
							params.tagType === "IDENTITY_PUB_KEY_TAG" &&
							arrayEquals(params.untrustedKey.identityPubKey, ed25519PublicKey) &&
							params.sourceOfTrust.symmetricGroupKey === userGroupKey &&
							params.bindingData.groupId === userGroup._id &&
							String(params.bindingData.groupKeyVersion) === identityPublicKeyMac.taggingKeyVersion &&
							String(params.bindingData.publicIdentityKeyVersion) === identityPublicKeyMac.taggedKeyVersion
						)
					}),
					identityPublicKeyMac.tag,
				),
			)
		})

		o("if the tag does not match, an error is thrown", async function () {
			const userGroup: Group = object()
			userGroup._id = "userGroup"
			const identityKeyPair: IdentityKeyPair = object()
			identityKeyPair.publicEd25519Key = rawEd25519PublicKey
			identityKeyPair.identityKeyVersion = "0"
			const identityPublicKeyMac = brandKeyMac(
				createTestEntity(KeyMacTypeRef, {
					taggedKeyVersion: "0",
					taggingKeyVersion: "1",
					taggingGroup: userGroup._id,
					tag: object(),
				}),
			)

			const userGroupKey: Aes256Key = object()

			identityKeyPair.publicKeyMac = identityPublicKeyMac
			userGroup.identityKeyPair = identityKeyPair

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)
			when(keyLoaderFacade.loadSymGroupKey(matchers.anything(), matchers.anything())).thenResolve(userGroupKey)

			when(keyAuthenticationFacade.verifyTag(matchers.anything(), matchers.anything())).thenThrow(new CryptoError("invalid mac"))

			await assertThrows(CryptoError, async () => publicKeyProvider.loadPublicIdentityKeyFromGroup(userGroup._id))
		})

		o("if the user has no identity key, the method returns null", async function () {
			const userGroup: Group = object()
			userGroup._id = "userGroup"
			userGroup.identityKeyPair = null

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)

			const pk = await publicKeyProvider.loadPublicIdentityKeyFromGroup(userGroup._id)
			o(pk).equals(null)
		})
	})

	o.spec("loadPublicIdentityKey", function () {
		o("success", async function () {
			const identityKeyGetOut: IdentityKeyGetOut = object()
			identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
			identityKeyGetOut.publicIdentityKeyVersion = "5"
			when(serviceExecutor.get(IdentityKeyService, matchers.anything())).thenResolve(identityKeyGetOut)

			const identifier: PublicKeyIdentifier = {
				identifier: "alice@tuta.com",
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}
			const identityKey = await publicKeyProvider.loadPublicIdentityKey(identifier)

			const expectedIdentityKey: Versioned<SigningPublicKey> = {
				version: 5,
				object: {
					key: ed25519PublicKey,
					type: SigningKeyPairType.Ed25519,
				},
			}

			o(identityKey).deepEquals(expectedIdentityKey)
		})

		o("not found handled gracefully", async function () {
			const identityKeyGetOut: IdentityKeyGetOut = object()
			identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
			identityKeyGetOut.publicIdentityKeyVersion = "5"
			when(serviceExecutor.get(IdentityKeyService, matchers.anything())).thenReject(new NotFoundError("not found"))

			const identifier: PublicKeyIdentifier = {
				identifier: "alice@tuta.com",
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}
			const identityKey = await publicKeyProvider.loadPublicIdentityKey(identifier)

			o(identityKey).equals(null)
		})
	})
})

o.spec("PublicKeyProvider - convert keys", function () {
	let publicKeyProvider: PublicKeyProvider
	let rsaPublicKey: Uint8Array
	let x25519PublicKey: Uint8Array
	let kyberPublicKey: Uint8Array
	let serviceExecutor: ServiceExecutor
	let entityClient: EntityClient
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let keyLoaderFacade: KeyLoaderFacade
	let keyVerificationFacade: KeyVerificationFacade

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()
		keyAuthenticationFacade = object()
		keyLoaderFacade = object()
		keyVerificationFacade = object()

		publicKeyProvider = new PublicKeyProvider(serviceExecutor, entityClient, keyAuthenticationFacade, keyLoaderFacade, async () => keyVerificationFacade)

		const kyberTestData = getFirstOrThrow(testData.kyberEncryptionTests)
		kyberPublicKey = hexToUint8Array(kyberTestData.publicKey)
		const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
		rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
		const eccTestData = getFirstOrThrow(testData.x25519Tests)
		x25519PublicKey = hexToUint8Array(eccTestData.alicePublicKeyHex)
	})

	o("convert tuta-crypt public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: x25519PublicKey,
			pubKyberKey: kyberPublicKey,
			pubRsaKey: null,
			pubKeyVersion: "1",
			signature: null,
		})

		const fromPublicKeyGetOut = publicKeyProvider.convertFromPublicKeyGetOut(publicKeyGetOut)

		const expectedPublicKey: Versioned<PQPublicKeys> = {
			version: 1,
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				x25519PublicKey: x25519PublicKey,
			},
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyProvider.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey)
	})

	o("convert rsa public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: null,
			pubKyberKey: null,
			pubRsaKey: rsaPublicKey,
			pubKeyVersion: "1",
			signature: null,
		})
		const fromPublicKeyGetOut = publicKeyProvider.convertFromPublicKeyGetOut(publicKeyGetOut)

		const decodedRsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(rsaPublicKey))
		const expectedPublicKey: Versioned<RsaPublicKey> = {
			version: 1,
			object: {
				keyPairType: KeyPairType.RSA,
				version: 0,
				keyLength: 2048,
				modulus: decodedRsaPublicKey.modulus,
				publicExponent: decodedRsaPublicKey.publicExponent,
			},
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyProvider.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey)
	})

	o("convert rsa ecc public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: x25519PublicKey,
			pubKyberKey: null,
			pubRsaKey: rsaPublicKey,
			pubKeyVersion: "1",
			signature: null,
		})
		const fromPublicKeyGetOut = publicKeyProvider.convertFromPublicKeyGetOut(publicKeyGetOut)

		const decodedRsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(rsaPublicKey))
		const expectedPublicKey: Versioned<RsaX25519PublicKey> = {
			version: 1,
			object: {
				keyPairType: KeyPairType.RSA_AND_X25519,
				version: 0,
				keyLength: 2048,
				modulus: decodedRsaPublicKey.modulus,
				publicExponent: decodedRsaPublicKey.publicExponent,
				publicEccKey: x25519PublicKey,
			},
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyProvider.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey)
	})

	o("inconsistent public key data", async function () {
		// no public key
		let error = await assertThrows(Error, async () =>
			publicKeyProvider.convertFromPublicKeyGetOut(
				createPublicKeyGetOut({
					pubEccKey: null,
					pubKyberKey: null,
					pubRsaKey: null,
					pubKeyVersion: "1",
					signature: null,
				}),
			),
		)
		o(error.message).equals("Inconsistent public key")

		// only one ecc public key
		error = await assertThrows(Error, async () =>
			publicKeyProvider.convertFromPublicKeyGetOut(
				createPublicKeyGetOut({
					pubEccKey: x25519PublicKey,
					pubKyberKey: null,
					pubRsaKey: null,
					pubKeyVersion: "1",
					signature: null,
				}),
			),
		)

		o(error.message).equals("Inconsistent public key")

		// only one kyber key
		error = await assertThrows(Error, async () =>
			publicKeyProvider.convertFromPublicKeyGetOut(
				createPublicKeyGetOut({
					pubEccKey: null,
					pubKyberKey: kyberPublicKey,
					pubRsaKey: null,
					pubKeyVersion: "1",
					signature: null,
				}),
			),
		)
		o(error.message).equals("Inconsistent public key")
	})

	o("convert from pub distribution key", async function () {
		const pubDistributionKey: PubDistributionKey = object()
		pubDistributionKey.pubKyberKey = kyberPublicKey
		pubDistributionKey.pubEccKey = x25519PublicKey

		const fromDistributionKey = publicKeyProvider.convertFromPubDistributionKey(pubDistributionKey)
		const expectedPublicKey: Versioned<PQPublicKeys> = {
			version: 0, // always 0 for distribution keys.
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				x25519PublicKey: x25519PublicKey,
				kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
			},
		}
		o(fromDistributionKey).deepEquals(expectedPublicKey)
	})

	o("convert from encrypted pq key pairs", async function () {
		const encryptedPqKeyPairs: EncryptedPqKeyPairs = object()
		encryptedPqKeyPairs.pubKyberKey = kyberPublicKey
		encryptedPqKeyPairs.pubEccKey = x25519PublicKey

		const fromEncryptedPqKeyPairs = publicKeyProvider.convertFromEncryptedPqKeyPairs(encryptedPqKeyPairs, 1)
		const expectedPublicKey: Versioned<PQPublicKeys> = {
			version: 1,
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				x25519PublicKey: x25519PublicKey,
				kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
			},
		}
		o(fromEncryptedPqKeyPairs).deepEquals(expectedPublicKey)
	})
})

function toSystemReturn(publicKeyGetOut: PublicKeyGetOut): SystemKeysReturn {
	return createSystemKeysReturn({
		systemAdminPubKeyVersion: publicKeyGetOut.pubKeyVersion,
		systemAdminPubRsaKey: publicKeyGetOut.pubRsaKey,
		systemAdminPubKyberKey: publicKeyGetOut.pubKyberKey,
		systemAdminPubEccKey: publicKeyGetOut.pubEccKey,
		_type: object(),
		_format: object(),
		freeGroupKey: object(),
		freeGroupKeyVersion: object(),
		premiumGroupKey: object(),
		premiumGroupKeyVersion: object(),
		freeGroup: object(),
		premiumGroup: object(),
	})
}

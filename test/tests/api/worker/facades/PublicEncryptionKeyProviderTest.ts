import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { getFirstOrThrow, hexToUint8Array, KeyVersion, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import {
	MaybeSignedPublicKey,
	PublicEncryptionKeyProvider,
	PublicKeyIdentifier,
} from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { PublicKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import {
	createPublicKeyGetOut,
	createSystemKeysReturn,
	PubDistributionKey,
	PublicKeyGetOut,
	PublicKeySignature,
	PublicKeySignatureTypeRef,
	SystemKeysReturn,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import testData from "../crypto/CompatibilityTestData.json"
import { bytesToKyberPublicKey, EncryptedPqKeyPairs, hexToRsaPublicKey, KeyPairType, PQPublicKeys, RsaPublicKey } from "@tutao/tutanota-crypto"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { InvalidDataError } from "../../../../../src/common/api/common/error/RestError"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { KeyAuthenticationFacade } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants"
import { KeyVerificationFacade, VerifiedPublicEncryptionKey } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { createTestEntity } from "../../../TestUtils"
import { PublicEncryptionKeyCache } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyCache"

const PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS = "alice@tuta.com"

o.spec("PublicEncryptionKeyProviderTest", function () {
	let serviceExecutor: ServiceExecutor
	let publicEncryptionKeyProvider: PublicEncryptionKeyProvider

	let publicKeyIdentifier: PublicKeyIdentifier
	let currentVersion: KeyVersion

	let rsaPublicKey: Uint8Array
	let x25519PublicKey: Uint8Array
	let kyberPublicKey: Uint8Array
	let keyVerificationFacade: KeyVerificationFacade
	let publicEncryptionKeyCache: PublicEncryptionKeyCache

	o.beforeEach(function () {
		serviceExecutor = object()
		keyVerificationFacade = object()
		publicEncryptionKeyCache = object()
		publicEncryptionKeyProvider = new PublicEncryptionKeyProvider(serviceExecutor, async () => keyVerificationFacade, publicEncryptionKeyCache)

		const kyberTestData = getFirstOrThrow(testData.kyberEncryptionTests)
		kyberPublicKey = hexToUint8Array(kyberTestData.publicKey)
		const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
		rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
		const eccTestData = getFirstOrThrow(testData.x25519Tests)
		x25519PublicKey = hexToUint8Array(eccTestData.alicePublicKeyHex)

		publicKeyIdentifier = {
			identifier: PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		}
		currentVersion = 2
	})

	o.spec("loadCurrentPubKey", function () {
		o("success pq keys", async function () {
			const signature: PublicKeySignature = createTestEntity(PublicKeySignatureTypeRef, { signature: object() })
			const publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(currentVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature,
			})
			const expectedPublicKey: Versioned<PQPublicKeys> = {
				version: 2,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: x25519PublicKey,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				},
			}
			const expectedResult: VerifiedPublicEncryptionKey = {
				verificationState: object(),
				publicEncryptionKey: expectedPublicKey,
			}
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(
				keyVerificationFacade.verify(publicKeyIdentifier, {
					publicKey: expectedPublicKey,
					signature,
				}),
			).thenResolve(expectedResult)
			const result = await publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(publicKeyIdentifier)
			o(result).deepEquals(expectedResult)
		})

		o("success rsa keys", async function () {
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
			const expectedResult: VerifiedPublicEncryptionKey = {
				verificationState: object(),
				publicEncryptionKey: expectedPublicKey,
			}

			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)
			when(
				keyVerificationFacade.verify(publicKeyIdentifier, {
					publicKey: expectedPublicKey,
					signature,
				}),
			).thenResolve(expectedResult)

			const pubKeys = await publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(publicKeyIdentifier)
			o(pubKeys).deepEquals(expectedResult)
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
			await assertThrows(CryptoError, async () => publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(publicKeyIdentifier))
		})
	})

	o.spec("loadPublicEncryptionKey", function () {
		const requestedVersion = 1

		o("success", async function () {
			let publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(requestedVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature: object(),
			})
			when(publicEncryptionKeyCache.get(matchers.anything(), matchers.anything())).thenReturn(undefined)
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)

			const expectedPublicKey: MaybeSignedPublicKey = {
				publicKey: {
					version: 1,
					object: {
						keyPairType: KeyPairType.TUTA_CRYPT,
						x25519PublicKey: x25519PublicKey,
						kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
					},
				},
				signature: publicKeyGetOut.signature,
			}

			let expectedResult: VerifiedPublicEncryptionKey = object()
			when(keyVerificationFacade.verify(publicKeyIdentifier, expectedPublicKey)).thenResolve(expectedResult)

			const pubKeys = await publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, requestedVersion)
			o(pubKeys).deepEquals(expectedResult)
			verify(publicEncryptionKeyCache.put(publicKeyIdentifier, expectedPublicKey))
		})

		o("no version provided bypasses the cache but still puts the result", async function () {
			let publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(requestedVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature: object(),
			})
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)

			const expectedPublicKey: MaybeSignedPublicKey = {
				publicKey: {
					version: 1,
					object: {
						keyPairType: KeyPairType.TUTA_CRYPT,
						x25519PublicKey: x25519PublicKey,
						kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
					},
				},
				signature: publicKeyGetOut.signature,
			}

			let expectedResult: VerifiedPublicEncryptionKey = object()
			when(keyVerificationFacade.verify(publicKeyIdentifier, expectedPublicKey)).thenResolve(expectedResult)

			const pubKeys = await publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, null)
			o(pubKeys).deepEquals(expectedResult)
			verify(publicEncryptionKeyCache.get(matchers.anything(), matchers.anything()), { times: 0 })
			verify(serviceExecutor.get(PublicKeyService, matchers.anything()))
			verify(publicEncryptionKeyCache.put(publicKeyIdentifier, expectedPublicKey))
		})

		o("cache is used to prevent service requests", async function () {
			let publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(requestedVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
				signature: object(),
			})
			const expectedPublicKey: MaybeSignedPublicKey = {
				publicKey: {
					version: 1,
					object: {
						keyPairType: KeyPairType.TUTA_CRYPT,
						x25519PublicKey: x25519PublicKey,
						kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
					},
				},
				signature: publicKeyGetOut.signature,
			}
			when(publicEncryptionKeyCache.get(publicKeyIdentifier, requestedVersion)).thenReturn(expectedPublicKey)
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)

			let expectedResult: VerifiedPublicEncryptionKey = object()
			when(keyVerificationFacade.verify(publicKeyIdentifier, expectedPublicKey)).thenResolve(expectedResult)

			const pubKeys = await publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, requestedVersion)
			o(pubKeys).deepEquals(expectedResult)
			verify(publicEncryptionKeyCache.get(publicKeyIdentifier, requestedVersion))
			verify(serviceExecutor.get(PublicKeyService, matchers.anything()), { times: 0 })
			verify(publicEncryptionKeyCache.put(publicKeyIdentifier, expectedPublicKey))
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
			await assertThrows(InvalidDataError, async () => publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, requestedVersion))
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
			await assertThrows(CryptoError, async () => publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, currentVersion))
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

			const e = await assertThrows(CryptoError, async () => publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(publicKeyIdentifier))
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

			const e = await assertThrows(CryptoError, async () => publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})
	})
})

o.spec("PublicEncryptionKeyProvider - convert keys", function () {
	let publicKeyProvider: PublicEncryptionKeyProvider
	let rsaPublicKey: Uint8Array
	let x25519PublicKey: Uint8Array
	let kyberPublicKey: Uint8Array
	let serviceExecutor: ServiceExecutor
	let entityClient: EntityClient
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let keyLoaderFacade: KeyLoaderFacade
	let keyVerificationFacade: KeyVerificationFacade
	let publicEncryptionKeyCache: PublicEncryptionKeyCache

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()
		keyAuthenticationFacade = object()
		keyLoaderFacade = object()
		keyVerificationFacade = object()
		publicEncryptionKeyCache = object()

		publicKeyProvider = new PublicEncryptionKeyProvider(serviceExecutor, async () => keyVerificationFacade, publicEncryptionKeyCache)

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
			signature: object(),
		})

		const fromPublicKeyGetOut = publicKeyProvider.convertFromPublicKeyGetOut(publicKeyGetOut)

		const expectedPublicKey: MaybeSignedPublicKey = {
			publicKey: {
				version: 1,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
					x25519PublicKey: x25519PublicKey,
				},
			},
			signature: publicKeyGetOut.signature,
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyProvider.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey.publicKey)
	})

	o("convert rsa public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: null,
			pubKyberKey: null,
			pubRsaKey: rsaPublicKey,
			pubKeyVersion: "1",
			signature: object(),
		})
		const fromPublicKeyGetOut = publicKeyProvider.convertFromPublicKeyGetOut(publicKeyGetOut)

		const decodedRsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(rsaPublicKey))
		const expectedPublicKey: MaybeSignedPublicKey = {
			publicKey: {
				version: 1,
				object: {
					keyPairType: KeyPairType.RSA,
					version: 0,
					keyLength: 2048,
					modulus: decodedRsaPublicKey.modulus,
					publicExponent: decodedRsaPublicKey.publicExponent,
				},
			},
			signature: publicKeyGetOut.signature,
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyProvider.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey.publicKey)
	})

	o("convert rsa ecc public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: x25519PublicKey,
			pubKyberKey: null,
			pubRsaKey: rsaPublicKey,
			pubKeyVersion: "1",
			signature: object(),
		})
		const fromPublicKeyGetOut = publicKeyProvider.convertFromPublicKeyGetOut(publicKeyGetOut)

		const decodedRsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(rsaPublicKey))
		const expectedPublicKey: MaybeSignedPublicKey = {
			publicKey: {
				version: 1,
				object: {
					keyPairType: KeyPairType.RSA_AND_X25519,
					version: 0,
					keyLength: 2048,
					modulus: decodedRsaPublicKey.modulus,
					publicExponent: decodedRsaPublicKey.publicExponent,
					publicEccKey: x25519PublicKey,
				},
			},
			signature: publicKeyGetOut.signature,
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyProvider.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey.publicKey)
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

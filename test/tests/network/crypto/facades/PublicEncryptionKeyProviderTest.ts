import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { getFirstOrThrow, hexToUint8Array, KeyVersion, uint8ArrayToHex, Versioned } from "../../../../../src/platform-kit/utils"
import PublicEncryptionKeyProvider from "../../../../../src/platform-kit/base/base-crypto/PublicEncryptionKeyProvider.js"

import testData from "../../../api/worker/crypto/CompatibilityTestData.json"
import {
	bytesToKyberPublicKey,
	hexToRsaPublicKey,
	PQPublicKeys,
	PublicKeyIdentifier,
	PublicKeyIdentifierType,
	RsaPublicKey,
} from "../../../../../src/platform-kit/crypto"
import { RsaX25519PublicKey } from "../../../../../src/platform-kit/crypto/encryption/RsaKeyPair.js"
import { CryptoError } from "../../../../../src/platform-kit/crypto/error"
import { InvalidDataError } from "../../../../../src/platform-kit/rest-client/error"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"

import { KeyVerificationFacade, VerifiedPublicEncryptionKey } from "../../../../../src/platform-kit/base/facades/lazy/KeyVerificationFacade"
import { createTestEntity } from "../../../TestUtils"
import { PublicEncryptionKeyCache } from "../../../../../src/platform-kit/base/base-crypto/persistence/PublicEncryptionKeyCache"
import {
	createPublicKeyGetOut,
	createSystemKeysReturn,
	PubDistributionKey,
	PublicKeyGetOut,
	PublicKeyService,
	PublicKeySignature,
	PublicKeySignatureTypeRef,
	SystemKeysReturn,
} from "@tutao/entities/sys"
import { ServiceExecutor } from "../../../../../src/platform-kit/network/ServiceExecutor"
import { KeyAuthenticationFacade } from "../../../../../src/platform-kit/network/KeyAuthenticationFacade"
import { MaybeSignedPublicKey } from "../../../../../src/platform-kit/base/base-crypto/MaybeSignedPublicKey"
import { EncryptedPqKeyPairs } from "../../../../../src/platform-kit/crypto/encryption/EncryptedKeyPairs"

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
				object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
			}
			const expectedResult: VerifiedPublicEncryptionKey = {
				verificationState: object(),
				publicEncryptionKey: expectedPublicKey,
			}
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(publicKeyGetOut)
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
				object: new RsaPublicKey(0, 2048, decodedRsaPublicKey.modulus, decodedRsaPublicKey.publicExponent),
			}
			const expectedResult: VerifiedPublicEncryptionKey = {
				verificationState: object(),
				publicEncryptionKey: expectedPublicKey,
			}

			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(publicKeyGetOut)
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
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(
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
			when(publicEncryptionKeyCache.get(matchers.anything(), matchers.anything())).thenReturn(null)
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(publicKeyGetOut)

			const expectedPublicKey: MaybeSignedPublicKey = {
				publicKey: {
					version: 1,
					object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
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
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(publicKeyGetOut)

			const expectedPublicKey: MaybeSignedPublicKey = {
				publicKey: {
					version: 1,
					object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
				},
				signature: publicKeyGetOut.signature,
			}

			let expectedResult: VerifiedPublicEncryptionKey = object()
			when(keyVerificationFacade.verify(publicKeyIdentifier, expectedPublicKey)).thenResolve(expectedResult)

			const pubKeys = await publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, null)
			o(pubKeys).deepEquals(expectedResult)
			verify(publicEncryptionKeyCache.get(matchers.anything(), matchers.anything()), { times: 0 })
			verify(serviceExecutor.get(PublicKeyService, matchers.anything(), null))
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
					object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
				},
				signature: publicKeyGetOut.signature,
			}
			when(publicEncryptionKeyCache.get(publicKeyIdentifier, requestedVersion)).thenReturn(expectedPublicKey)
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(publicKeyGetOut)

			let expectedResult: VerifiedPublicEncryptionKey = object()
			when(keyVerificationFacade.verify(publicKeyIdentifier, expectedPublicKey)).thenResolve(expectedResult)

			const pubKeys = await publicEncryptionKeyProvider.loadPublicEncryptionKey(publicKeyIdentifier, requestedVersion)
			o(pubKeys).deepEquals(expectedResult)
			verify(publicEncryptionKeyCache.get(publicKeyIdentifier, requestedVersion))
			verify(serviceExecutor.get(PublicKeyService, matchers.anything(), null), { times: 0 })
			verify(publicEncryptionKeyCache.put(publicKeyIdentifier, expectedPublicKey))
		})

		o("invalid version returned", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(
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
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(
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
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(
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
			when(serviceExecutor.get(PublicKeyService, matchers.anything(), null)).thenResolve(
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
				object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
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
				object: new RsaPublicKey(0, 2048, decodedRsaPublicKey.modulus, decodedRsaPublicKey.publicExponent),
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
				object: new RsaX25519PublicKey(new RsaPublicKey(0, 2048, decodedRsaPublicKey.modulus, decodedRsaPublicKey.publicExponent), x25519PublicKey),
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
			object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
		}
		o(fromDistributionKey).deepEquals(expectedPublicKey)
	})

	o("convert from encrypted pq key pairs", async function () {
		const encryptedPqKeyPairs: EncryptedPqKeyPairs = object()

		;(encryptedPqKeyPairs as any).pubKyberKey = kyberPublicKey
		;(encryptedPqKeyPairs as any).pubEccKey = x25519PublicKey

		const fromEncryptedPqKeyPairs = publicKeyProvider.convertFromEncryptedPqKeyPairs(encryptedPqKeyPairs, 1)
		const expectedPublicKey: Versioned<PQPublicKeys> = {
			version: 1,
			object: new PQPublicKeys(x25519PublicKey, bytesToKyberPublicKey(kyberPublicKey)),
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

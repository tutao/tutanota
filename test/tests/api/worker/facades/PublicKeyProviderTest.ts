import o from "@tutao/otest"
import { matchers, object, when } from "testdouble"
import { getFirstOrThrow, hexToUint8Array, KeyVersion, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { PublicKeyIdentifier, PublicKeyProvider } from "../../../../../src/common/api/worker/facades/PublicKeyProvider.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { PublicKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import {
	createPublicKeyGetOut,
	createSystemKeysReturn,
	PubDistributionKey,
	PublicKeyGetOut,
	SystemKeysReturn,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import testData from "../crypto/CompatibilityTestData.json"
import {
	bytesToKyberPublicKey,
	EncryptedPqKeyPairs,
	hexToRsaPublicKey,
	KeyPairType,
	PQPublicKeys,
	RsaPublicKey,
	RsaX25519PublicKey,
} from "@tutao/tutanota-crypto"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { InvalidDataError } from "../../../../../src/common/api/common/error/RestError"

o.spec("PublicKeyProviderTest", function () {
	let serviceExecutor: ServiceExecutor
	let publicKeyProvider: PublicKeyProvider

	let publicKeyIdentifier: PublicKeyIdentifier
	let currentVersion: KeyVersion

	let rsaPublicKey: Uint8Array
	let x25519PublicKey: Uint8Array
	let kyberPublicKey: Uint8Array

	o.beforeEach(function () {
		serviceExecutor = object()
		publicKeyProvider = new PublicKeyProvider(serviceExecutor)

		const kyberTestData = getFirstOrThrow(testData.kyberEncryptionTests)
		kyberPublicKey = hexToUint8Array(kyberTestData.publicKey)
		const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
		rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
		const eccTestData = getFirstOrThrow(testData.x25519Tests)
		x25519PublicKey = hexToUint8Array(eccTestData.alicePublicKeyHex)

		publicKeyIdentifier = object()
		currentVersion = 2
	})

	o.spec("loadCurrentPubKey", function () {
		o("success pq keys", async function () {
			const publicKeyGetOut = createPublicKeyGetOut({
				pubKeyVersion: String(currentVersion),
				pubRsaKey: null,
				pubKyberKey: kyberPublicKey,
				pubEccKey: x25519PublicKey,
			})
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)

			const expectedPublicKey: Versioned<PQPublicKeys> = {
				version: 2,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: x25519PublicKey,
					kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				},
			}
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys).deepEquals(expectedPublicKey)
		})

		o("success rsa keys", async function () {
			const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
			const rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
			const publicKeyGetOut = createPublicKeyGetOut({
				pubEccKey: null,
				pubKyberKey: null,
				pubRsaKey: rsaPublicKey,
				pubKeyVersion: "0",
			})

			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(publicKeyGetOut)

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
			o(pubKeys).deepEquals(expectedPublicKey)
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
				}),
			)
			await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
		})
	})

	o.spec("loadPubKey", function () {
		const requestedVersion = 1

		o("success", async function () {
			const pubKyberKey = object<Uint8Array>()
			const pubEccKey = object<Uint8Array>()
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: String(requestedVersion),
					pubRsaKey: null,
					pubKyberKey: kyberPublicKey,
					pubEccKey: x25519PublicKey,
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
			o(pubKeys).deepEquals(expectedPublicKey)
		})

		o("invalid version returned", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({
					pubKeyVersion: String(currentVersion),
					pubRsaKey: null,
					pubKyberKey: kyberPublicKey,
					pubEccKey: x25519PublicKey,
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
				}),
			)
			await assertThrows(CryptoError, async () => publicKeyProvider.loadPubKey(publicKeyIdentifier, currentVersion))
		})
	})

	o.spec("version validation", function () {
		o("throws if the version is negative", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: "-1", pubRsaKey: object(), pubKyberKey: null, pubEccKey: null }),
			)

			const e = await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})

		o("throws if the version is not an integer", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: "1.5", pubRsaKey: object(), pubKyberKey: null, pubEccKey: null }),
			)

			const e = await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})
	})
})

o.spec("PublicKeyProvider - convert keys", function () {
	let publicKeyProvider: PublicKeyProvider
	let rsaPublicKey: Uint8Array
	let x25519PublicKey: Uint8Array
	let kyberPublicKey: Uint8Array
	let serviceExecutor: ServiceExecutor

	o.beforeEach(function () {
		serviceExecutor = object()
		publicKeyProvider = new PublicKeyProvider(serviceExecutor)

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

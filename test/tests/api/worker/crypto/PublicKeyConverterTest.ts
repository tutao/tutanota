import o from "@tutao/otest/dist/otest.js"
import { PublicKeyConverter } from "../../../../../src/common/api/worker/crypto/PublicKeyConverter.js"
import { createPublicKeyGetOut, createSystemKeysReturn, PublicKeyGetOut, SystemKeysReturn } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { getFirstOrThrow, hexToUint8Array, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { bytesToKyberPublicKey, hexToRsaPublicKey, KeyPairType, PQPublicKeys, RsaEccPublicKey, RsaPublicKey } from "@tutao/tutanota-crypto"
import testData from "./CompatibilityTestData.json"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { object } from "testdouble"

o.spec("PublicKeyConverterTest", function () {
	let publicKeyConverter: PublicKeyConverter
	let rsaPublicKey: Uint8Array
	let eccPublicKey: Uint8Array
	let kyberPublicKey: Uint8Array

	o.beforeEach(function () {
		publicKeyConverter = new PublicKeyConverter()

		const kyberTestData = getFirstOrThrow(testData.kyberEncryptionTests)
		kyberPublicKey = hexToUint8Array(kyberTestData.publicKey)
		const rsaTestData = getFirstOrThrow(testData.rsaEncryptionTests)
		rsaPublicKey = hexToUint8Array(rsaTestData.publicKey)
		const eccTestData = getFirstOrThrow(testData.x25519Tests)
		eccPublicKey = hexToUint8Array(eccTestData.alicePublicKeyHex)
	})

	o("convert tuta-crypt public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: eccPublicKey,
			pubKyberKey: kyberPublicKey,
			pubRsaKey: null,
			pubKeyVersion: "1",
		})

		const fromPublicKeyGetOut = publicKeyConverter.convertFromPublicKeyGetOut(publicKeyGetOut)

		const expectedPublicKey: Versioned<PQPublicKeys> = {
			version: 1,
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				kyberPublicKey: bytesToKyberPublicKey(kyberPublicKey),
				eccPublicKey: eccPublicKey,
			},
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyConverter.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey)
	})

	o("convert rsa public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: null,
			pubKyberKey: null,
			pubRsaKey: rsaPublicKey,
			pubKeyVersion: "1",
		})
		const fromPublicKeyGetOut = publicKeyConverter.convertFromPublicKeyGetOut(publicKeyGetOut)

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
		o(publicKeyConverter.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey)
	})

	o("convert rsa ecc public keys", async function () {
		const publicKeyGetOut = createPublicKeyGetOut({
			pubEccKey: eccPublicKey,
			pubKyberKey: null,
			pubRsaKey: rsaPublicKey,
			pubKeyVersion: "1",
		})
		const fromPublicKeyGetOut = publicKeyConverter.convertFromPublicKeyGetOut(publicKeyGetOut)

		const decodedRsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(rsaPublicKey))
		const expectedPublicKey: Versioned<RsaEccPublicKey> = {
			version: 1,
			object: {
				keyPairType: KeyPairType.RSA_AND_ECC,
				version: 0,
				keyLength: 2048,
				modulus: decodedRsaPublicKey.modulus,
				publicExponent: decodedRsaPublicKey.publicExponent,
				publicEccKey: eccPublicKey,
			},
		}
		o(fromPublicKeyGetOut).deepEquals(expectedPublicKey)
		o(publicKeyConverter.convertFromSystemKeysReturn(toSystemReturn(publicKeyGetOut))).deepEquals(expectedPublicKey)
	})

	o("inconsistent public key data", async function () {
		// no public key
		let error = await assertThrows(Error, async () =>
			publicKeyConverter.convertFromPublicKeyGetOut(
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
			publicKeyConverter.convertFromPublicKeyGetOut(
				createPublicKeyGetOut({
					pubEccKey: eccPublicKey,
					pubKyberKey: null,
					pubRsaKey: null,
					pubKeyVersion: "1",
				}),
			),
		)

		o(error.message).equals("Inconsistent public key")

		// only one kyber key
		error = await assertThrows(Error, async () =>
			publicKeyConverter.convertFromPublicKeyGetOut(
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

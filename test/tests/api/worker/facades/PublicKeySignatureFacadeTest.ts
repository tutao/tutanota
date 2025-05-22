import o from "@tutao/otest"
import { object, when } from "testdouble"
import { DeserializedPublicKeyForSigning, PublicKeySignatureFacade } from "../../../../../src/common/api/worker/facades/PublicKeySignatureFacade"
import { bytesToEd25519PublicKey } from "@tutao/tutanota-crypto"
import { PublicKeySignatureType } from "../../../../../src/common/api/common/TutanotaConstants"
import { parseKeyVersion } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { IdentityKeyPair } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { Ed25519Facade } from "../../../../../src/common/api/worker/facades/Ed25519Facade"

o.spec("PublicKeySignatureFacadeTest", function () {
	let ed25519Facade: Ed25519Facade
	let cryptoWrapper: CryptoWrapper
	let publicKeySignatureFacade: PublicKeySignatureFacade
	let tutaCryptKeyPair
	let rsaEccKeyPair
	let rsaOnlyKeyPair
	let keyPairVersion

	o.beforeEach(function () {
		ed25519Facade = object()
		cryptoWrapper = object()
		publicKeySignatureFacade = new PublicKeySignatureFacade(ed25519Facade, cryptoWrapper)
		let pubEccKey = new Uint8Array([1, 1, 1])
		let pubKyberKey = new Uint8Array([2, 2, 2])
		let pubRsaKey = new Uint8Array([3, 3, 3])
		tutaCryptKeyPair = object()
		tutaCryptKeyPair.pubEccKey = pubEccKey
		tutaCryptKeyPair.pubKyberKey = pubKyberKey
		tutaCryptKeyPair.pubRsaKey = null
		rsaEccKeyPair = object()
		rsaEccKeyPair.pubEccKey = pubEccKey
		rsaEccKeyPair.pubKyberKey = null
		rsaEccKeyPair.pubRsaKey = pubRsaKey
		rsaOnlyKeyPair = object()
		rsaOnlyKeyPair.pubEccKey = null
		rsaOnlyKeyPair.pubKyberKey = null
		rsaOnlyKeyPair.pubRsaKey = pubRsaKey

		keyPairVersion = "10"
	})
	o.spec("Roundtrip", function () {
		let expectedSignature
		let privateIdentityKey
		let publicIdentityKey
		let identityKeyPair: IdentityKeyPair

		o.beforeEach(function () {
			expectedSignature = new Uint8Array([11, 22, 33])
			privateIdentityKey = new Uint8Array([4, 4, 4])
			publicIdentityKey = new Uint8Array([5, 5, 5])
			identityKeyPair = object()
			identityKeyPair.publicEd25519Key = publicIdentityKey
		})

		o("roundTripTutaCrypt", async function () {
			const expectedMessage = publicKeySignatureFacade.serializePublicKeyForSigning(tutaCryptKeyPair, keyPairVersion)
			when(ed25519Facade.sign(privateIdentityKey, expectedMessage)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(bytesToEd25519PublicKey(publicIdentityKey), expectedSignature, expectedMessage)).thenResolve(true)

			const signature = await publicKeySignatureFacade.signPublicKey(tutaCryptKeyPair, privateIdentityKey, keyPairVersion)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(tutaCryptKeyPair, identityKeyPair, keyPairVersion, signature)).equals(true)
		})

		o("roundTripRsaEcc", async function () {
			const expectedMessage = publicKeySignatureFacade.serializePublicKeyForSigning(rsaEccKeyPair, keyPairVersion)
			when(ed25519Facade.sign(privateIdentityKey, expectedMessage)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(bytesToEd25519PublicKey(publicIdentityKey), expectedSignature, expectedMessage)).thenResolve(true)

			const signature = await publicKeySignatureFacade.signPublicKey(rsaEccKeyPair, privateIdentityKey, keyPairVersion)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(rsaEccKeyPair, identityKeyPair, keyPairVersion, signature)).equals(true)
		})

		o("roundTripRsaFormerGroupKey", async function () {
			const expectedMessage = publicKeySignatureFacade.serializePublicKeyForSigning(rsaOnlyKeyPair, keyPairVersion)
			publicKeySignatureFacade.deserializePublicKeyForSigning(expectedMessage)
			when(ed25519Facade.sign(privateIdentityKey, expectedMessage)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(bytesToEd25519PublicKey(publicIdentityKey), expectedSignature, expectedMessage)).thenResolve(true)

			const signature = await publicKeySignatureFacade.signPublicKey(rsaOnlyKeyPair, privateIdentityKey, keyPairVersion)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(rsaOnlyKeyPair, identityKeyPair, keyPairVersion, signature)).equals(true)
		})

		o("verify_fails", async function () {
			const expectedMessage = publicKeySignatureFacade.serializePublicKeyForSigning(tutaCryptKeyPair, keyPairVersion)
			when(ed25519Facade.sign(privateIdentityKey, expectedMessage)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(bytesToEd25519PublicKey(publicIdentityKey), expectedSignature, expectedMessage)).thenResolve(false)

			const signature = await publicKeySignatureFacade.signPublicKey(tutaCryptKeyPair, privateIdentityKey, keyPairVersion)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(tutaCryptKeyPair, identityKeyPair, keyPairVersion, signature)).equals(false)
		})
	})

	o.spec("Serialization", function () {
		o("serialize_deserialize_RsaFormerGroupKey", async function () {
			const message = publicKeySignatureFacade.serializePublicKeyForSigning(rsaOnlyKeyPair, keyPairVersion)
			const deserialized: DeserializedPublicKeyForSigning = publicKeySignatureFacade.deserializePublicKeyForSigning(message)

			o(deserialized.encryptionKeyPairVersion).equals(parseKeyVersion(keyPairVersion))
			o(deserialized.signatureType).equals(PublicKeySignatureType.RsaFormerGroupKey)
			o(deserialized.pubRsaKey).deepEquals(rsaOnlyKeyPair.pubRsaKey)
			o(deserialized.pubKyberKey).equals(null)
			o(deserialized.pubEccKey).equals(null)
		})

		o("serialize_deserialize", async function () {
			const message = publicKeySignatureFacade.serializePublicKeyForSigning(tutaCryptKeyPair, keyPairVersion)
			const deserialized: DeserializedPublicKeyForSigning = publicKeySignatureFacade.deserializePublicKeyForSigning(message)

			o(deserialized.encryptionKeyPairVersion).equals(parseKeyVersion(keyPairVersion))
			o(deserialized.signatureType).equals(PublicKeySignatureType.TutaCrypt)
			o(deserialized.pubEccKey).deepEquals(tutaCryptKeyPair.pubEccKey)
			o(deserialized.pubKyberKey).deepEquals(tutaCryptKeyPair.pubKyberKey)
			o(deserialized.pubRsaKey).equals(null)
		})
	})
})

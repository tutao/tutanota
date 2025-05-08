import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { DeserializedPublicKeyForSigning, PublicKeySignatureFacade } from "../../../../../src/common/api/worker/facades/PublicKeySignatureFacade"
import {
	Ed25519PrivateKey,
	Ed25519PublicKey,
	generateX25519KeyPair,
	KeyPairType,
	kyberPublicKeyToBytes,
	PQKeyPairs,
	PQPublicKeys,
	RsaKeyPair,
	RsaPublicKey,
	rsaPublicKeyToBytes,
	RsaX25519KeyPair,
	RsaX25519PublicKey,
} from "@tutao/tutanota-crypto"
import { PublicKeySignatureType } from "../../../../../src/common/api/common/TutanotaConstants"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { Ed25519Facade, EncodedEd25519Signature } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { KeyVersion, Versioned } from "@tutao/tutanota-utils"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade"
import { loadLibOQSWASM } from "../WASMTestUtils"
import { RSA_TEST_KEYPAIR } from "./RsaPqPerformanceTest"

o.spec("PublicKeySignatureFacadeTest", function () {
	let ed25519Facade: Ed25519Facade
	let cryptoWrapper: CryptoWrapper
	let publicKeySignatureFacade: PublicKeySignatureFacade
	let pqFacade: PQFacade
	let tutaCryptKeyPair: Versioned<PQKeyPairs>
	let tutaCryptPubKey: Versioned<PQPublicKeys>
	let rsaEccKeyPair: Versioned<RsaX25519KeyPair>
	let rsaEccPubKey: Versioned<RsaX25519PublicKey>
	let rsaOnlyKeyPair: Versioned<RsaKeyPair>
	let rsaOnlyPubKey: Versioned<RsaPublicKey>
	let keyPairVersion: KeyVersion

	o.before(async function () {
		const kyberFacade = new WASMKyberFacade(await loadLibOQSWASM())
		pqFacade = new PQFacade(kyberFacade)
	})

	o.beforeEach(async function () {
		ed25519Facade = object()
		cryptoWrapper = object()
		publicKeySignatureFacade = new PublicKeySignatureFacade(ed25519Facade, cryptoWrapper)
		keyPairVersion = 10
		tutaCryptKeyPair = { object: await pqFacade.generateKeyPairs(), version: keyPairVersion }
		tutaCryptPubKey = {
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				kyberPublicKey: tutaCryptKeyPair.object.kyberKeyPair.publicKey,
				x25519PublicKey: tutaCryptKeyPair.object.x25519KeyPair.publicKey,
			},
			version: tutaCryptKeyPair.version,
		}
		rsaOnlyKeyPair = { version: keyPairVersion, object: RSA_TEST_KEYPAIR }
		rsaOnlyPubKey = {
			version: rsaOnlyKeyPair.version,
			object: {
				...rsaOnlyKeyPair.object.publicKey,
				keyPairType: KeyPairType.RSA,
			},
		}
		const x25519KeyPair = generateX25519KeyPair()
		rsaEccKeyPair = {
			version: keyPairVersion,
			object: {
				...RSA_TEST_KEYPAIR,
				keyPairType: KeyPairType.RSA_AND_X25519,
				privateEccKey: x25519KeyPair.privateKey,
				publicEccKey: x25519KeyPair.publicKey,
			},
		}
		rsaEccPubKey = {
			version: rsaEccKeyPair.version,
			object: {
				...rsaEccKeyPair.object.publicKey,
				keyPairType: KeyPairType.RSA_AND_X25519,
				publicEccKey: rsaEccKeyPair.object.publicEccKey,
			},
		}
	})
	o.spec("Roundtrip", function () {
		let expectedSignature: EncodedEd25519Signature
		let privateIdentityKey: Versioned<Ed25519PrivateKey>
		let publicIdentityKey: Ed25519PublicKey

		o.beforeEach(function () {
			expectedSignature = object()
			privateIdentityKey = { object: object(), version: 2 }
			publicIdentityKey = object()
			// tutacrypt
			when(cryptoWrapper.verifyKyberPublicKey(tutaCryptKeyPair.object.kyberKeyPair)).thenReturn(tutaCryptPubKey.object.kyberPublicKey)
			when(cryptoWrapper.verifyPublicX25519Key(tutaCryptKeyPair.object.x25519KeyPair)).thenReturn(tutaCryptPubKey.object.x25519PublicKey)
			//rsaX25519
			when(
				cryptoWrapper.verifyPublicX25519Key({
					publicKey: rsaEccKeyPair.object.publicEccKey,
					privateKey: rsaEccKeyPair.object.privateEccKey,
				}),
			).thenReturn(rsaEccPubKey.object.publicEccKey)
			when(cryptoWrapper.verifyRsaPublicKey(rsaEccKeyPair.object)).thenReturn(rsaOnlyPubKey.object) // same pubkey as rsa only!
			//rsa
			when(cryptoWrapper.verifyRsaPublicKey(rsaOnlyKeyPair.object)).thenReturn(rsaOnlyPubKey.object)
		})

		o("roundTripTutaCrypt", async function () {
			const { encodedKeyPairForSigning } = publicKeySignatureFacade.serializePublicKeyForSigning(tutaCryptPubKey)
			when(ed25519Facade.sign(privateIdentityKey.object, encodedKeyPairForSigning)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(publicIdentityKey, expectedSignature, encodedKeyPairForSigning)).thenResolve(true)
			when(cryptoWrapper.verifyKyberPublicKey(tutaCryptKeyPair.object.kyberKeyPair)).thenReturn(tutaCryptPubKey.object.kyberPublicKey)
			when(cryptoWrapper.verifyKyberPublicKey(tutaCryptKeyPair.object.kyberKeyPair)).thenReturn(tutaCryptPubKey.object.kyberPublicKey)

			const signature = await publicKeySignatureFacade.signPublicKey(tutaCryptKeyPair, privateIdentityKey)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(tutaCryptPubKey, publicIdentityKey, signature.signature)).equals(true)
			o(signature.signatureType).equals(PublicKeySignatureType.TutaCrypt)
			o(signature.publicKeyVersion).equals(tutaCryptPubKey.version.toString())
			o(signature.signingKeyVersion).equals(privateIdentityKey.version.toString())
			verify(cryptoWrapper.verifyKyberPublicKey(matchers.anything()), { times: 1 })
			verify(cryptoWrapper.verifyPublicX25519Key(matchers.anything()), { times: 1 })
			verify(cryptoWrapper.verifyRsaPublicKey(matchers.anything()), { times: 0 })
		})

		o("roundTripRsaEcc", async function () {
			const { encodedKeyPairForSigning } = publicKeySignatureFacade.serializePublicKeyForSigning(rsaEccPubKey)
			when(ed25519Facade.sign(privateIdentityKey.object, encodedKeyPairForSigning)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(publicIdentityKey, expectedSignature, encodedKeyPairForSigning)).thenResolve(true)

			const signature = await publicKeySignatureFacade.signPublicKey(rsaEccKeyPair, privateIdentityKey)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(rsaEccPubKey, publicIdentityKey, signature.signature)).equals(true)
			o(signature.signatureType).equals(PublicKeySignatureType.RsaEcc)
			o(signature.publicKeyVersion).equals(rsaEccPubKey.version.toString())
			o(signature.signingKeyVersion).equals(privateIdentityKey.version.toString())
			verify(cryptoWrapper.verifyKyberPublicKey(matchers.anything()), { times: 0 })
			verify(cryptoWrapper.verifyPublicX25519Key(matchers.anything()), { times: 1 })
			verify(cryptoWrapper.verifyRsaPublicKey(matchers.anything()), { times: 1 })
		})

		o("roundTripRsaFormerGroupKey", async function () {
			const { encodedKeyPairForSigning } = publicKeySignatureFacade.serializePublicKeyForSigning(rsaOnlyPubKey)
			publicKeySignatureFacade.deserializePublicKeyForSigning(encodedKeyPairForSigning)
			when(ed25519Facade.sign(privateIdentityKey.object, encodedKeyPairForSigning)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(publicIdentityKey, expectedSignature, encodedKeyPairForSigning)).thenResolve(true)

			const signature = await publicKeySignatureFacade.signPublicKey(rsaOnlyKeyPair, privateIdentityKey)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(rsaOnlyPubKey, publicIdentityKey, signature.signature)).equals(true)
			o(signature.signatureType).equals(PublicKeySignatureType.RsaFormerGroupKey)
			o(signature.publicKeyVersion).equals(rsaOnlyPubKey.version.toString())
			o(signature.signingKeyVersion).equals(privateIdentityKey.version.toString())
			verify(cryptoWrapper.verifyKyberPublicKey(matchers.anything()), { times: 0 })
			verify(cryptoWrapper.verifyPublicX25519Key(matchers.anything()), { times: 0 })
			verify(cryptoWrapper.verifyRsaPublicKey(matchers.anything()), { times: 1 })
		})

		o("verify_fails", async function () {
			const { encodedKeyPairForSigning } = publicKeySignatureFacade.serializePublicKeyForSigning(tutaCryptPubKey)
			when(ed25519Facade.sign(privateIdentityKey.object, encodedKeyPairForSigning)).thenResolve(expectedSignature)
			when(ed25519Facade.verifySignature(publicIdentityKey, expectedSignature, encodedKeyPairForSigning)).thenResolve(false)

			const signature = await publicKeySignatureFacade.signPublicKey(tutaCryptKeyPair, privateIdentityKey)
			o(await publicKeySignatureFacade.verifyPublicKeySignature(tutaCryptPubKey, publicIdentityKey, signature.signature)).equals(false)
		})
	})

	o.spec("Serialization", function () {
		o("serialize_deserialize_RsaFormerGroupKey", async function () {
			const { encodedKeyPairForSigning, signatureType } = publicKeySignatureFacade.serializePublicKeyForSigning(rsaOnlyPubKey)
			o(signatureType).equals(PublicKeySignatureType.RsaFormerGroupKey)
			const deserialized: DeserializedPublicKeyForSigning = publicKeySignatureFacade.deserializePublicKeyForSigning(encodedKeyPairForSigning)

			o(deserialized.encryptionKeyPairVersion).equals(keyPairVersion)
			o(deserialized.signatureType).equals(PublicKeySignatureType.RsaFormerGroupKey)
			o(deserialized.pubRsaKey).deepEquals(rsaPublicKeyToBytes(rsaOnlyPubKey.object))
			o(deserialized.pubKyberKey).equals(null)
			o(deserialized.pubEccKey).equals(null)
		})

		o("serialize_deserialize", async function () {
			const { encodedKeyPairForSigning, signatureType } = publicKeySignatureFacade.serializePublicKeyForSigning(tutaCryptPubKey)
			o(signatureType).equals(PublicKeySignatureType.TutaCrypt)
			const deserialized: DeserializedPublicKeyForSigning = publicKeySignatureFacade.deserializePublicKeyForSigning(encodedKeyPairForSigning)

			o(deserialized.encryptionKeyPairVersion).equals(keyPairVersion)
			o(deserialized.signatureType).equals(PublicKeySignatureType.TutaCrypt)
			o(deserialized.pubEccKey).deepEquals(tutaCryptPubKey.object.x25519PublicKey)
			o(deserialized.pubKyberKey).deepEquals(kyberPublicKeyToBytes(tutaCryptPubKey.object.kyberPublicKey))
			o(deserialized.pubRsaKey).equals(null)
		})
	})
})

import o from "@tutao/otest"
import { KeyVerificationFacade } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { matchers, object, verify, when } from "testdouble"
import { concat, hexToUint8Array, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { EncryptionKeyVerificationState, IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants"
import { bytesToEd25519PublicKey, sha256Hash } from "@tutao/tutanota-crypto"
import testData from "../crypto/CompatibilityTestData.json"
import { SigningKeyPairType, SigningPublicKey } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { createTestEntity } from "../../../TestUtils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { KeyVerificationMismatchError } from "../../../../../src/common/api/common/error/KeyVerificationMismatchError"
import { PublicKeySignatureFacade } from "../../../../../src/common/api/worker/facades/PublicKeySignatureFacade"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { PublicIdentityKeyProvider } from "../../../../../src/common/api/worker/facades/PublicIdentityKeyProvider"
import { IdentityKeyTrustDatabase, TrustDBEntry } from "../../../../../src/common/api/worker/facades/IdentityKeyTrustDatabase"
import { MaybeSignedPublicKey, PublicKeyIdentifier } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider"
import { PublicKeySignatureTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"

const { anything } = matchers

const PUBLIC_KEY_BYTES = hexToUint8Array(testData.ed25519Tests[0].alicePublicKeyHex)
const PUBLIC_KEY = bytesToEd25519PublicKey(PUBLIC_KEY_BYTES)
const PUBLIC_KEY_FINGERPRINT = uint8ArrayToHex(sha256Hash(concat(new Uint8Array([0]), new Uint8Array([SigningKeyPairType.Ed25519]), PUBLIC_KEY_BYTES)))

let trustDBEntry: TrustDBEntry

o.spec("KeyVerificationFacadeTest", function () {
	let keyVerification: KeyVerificationFacade
	let publicKeySignatureFacade: PublicKeySignatureFacade
	let publicIdentityKeyProvider: PublicIdentityKeyProvider
	let identityKeyTrustDatabase: IdentityKeyTrustDatabase
	let publicKeyIdentifier: PublicKeyIdentifier
	let maybeSignedPublicKey: MaybeSignedPublicKey

	o.beforeEach(function () {
		publicKeySignatureFacade = object()
		publicIdentityKeyProvider = object()
		identityKeyTrustDatabase = object()

		publicKeyIdentifier = {
			identifier: object(),
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		}
		maybeSignedPublicKey = {
			signature: createTestEntity(PublicKeySignatureTypeRef, { signature: object() }),
			publicKey: object(),
		}
		trustDBEntry = {
			publicIdentityKey: {
				object: { key: PUBLIC_KEY, type: SigningKeyPairType.Ed25519 },
				version: 0,
			},
			sourceOfTrust: IdentityKeySourceOfTrust.Manual,
		}

		keyVerification = new KeyVerificationFacade(publicKeySignatureFacade, publicIdentityKeyProvider, identityKeyTrustDatabase)
	})

	o.spec("verification state gets resolved correctly", function () {
		o("identifier type != MAILADRESS results in NOT_SUPPORTED", async function () {
			publicKeyIdentifier.identifierType = PublicKeyIdentifierType.GROUP_ID
			const result = await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey)
			o(result.verificationState).equals(EncryptionKeyVerificationState.NOT_SUPPORTED)
			o(result.publicEncryptionKey).equals(maybeSignedPublicKey.publicKey)
			verify(publicIdentityKeyProvider.loadPublicIdentityKey(anything()), { times: 0 })
		})
		o("no identity key, no signature result in NO_ENTRY", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(null)
			maybeSignedPublicKey.signature = null
			const result = await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey)
			o(result.verificationState).equals(EncryptionKeyVerificationState.NO_ENTRY)
			o(result.publicEncryptionKey).equals(maybeSignedPublicKey.publicKey)
		})
		o("no identity key, existing signature result in KeyVerificationMismatch", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(null)
			await assertThrows(KeyVerificationMismatchError, async () => await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey))
		})
		o("idenity key but no signature results in KeyVerificationMissmatch", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(trustDBEntry)
			maybeSignedPublicKey.signature = null
			await assertThrows(KeyVerificationMismatchError, async () => await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey))
		})
		o("invalid signature results in KeyVerificationMissmatch", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(trustDBEntry)
			when(
				publicKeySignatureFacade.verifyPublicKeySignature(
					maybeSignedPublicKey.publicKey,
					trustDBEntry.publicIdentityKey.object,
					maybeSignedPublicKey.signature!.signature,
				),
			).thenResolve(false)
			await assertThrows(KeyVerificationMismatchError, async () => await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey))
		})
		o("valid signature returns correct verification state - manual", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(trustDBEntry)
			when(
				publicKeySignatureFacade.verifyPublicKeySignature(
					maybeSignedPublicKey.publicKey,
					trustDBEntry.publicIdentityKey.object.key,
					maybeSignedPublicKey.signature!.signature,
				),
			).thenResolve(true)
			const result = await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey)
			o(result.verificationState).equals(EncryptionKeyVerificationState.VERIFIED_MANUAL)
			o(result.publicEncryptionKey).equals(maybeSignedPublicKey.publicKey)
		})
		o("valid signature returns correct verification state - tofu", async function () {
			trustDBEntry.sourceOfTrust = IdentityKeySourceOfTrust.TOFU
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(trustDBEntry)
			when(
				publicKeySignatureFacade.verifyPublicKeySignature(
					maybeSignedPublicKey.publicKey,
					trustDBEntry.publicIdentityKey.object.key,
					maybeSignedPublicKey.signature!.signature,
				),
			).thenResolve(true)
			const result = await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey)
			o(result.verificationState).equals(EncryptionKeyVerificationState.VERIFIED_TOFU)
			o(result.publicEncryptionKey).equals(maybeSignedPublicKey.publicKey)
		})
		o("valid signature returns correct verification state - not supported", async function () {
			trustDBEntry.sourceOfTrust = IdentityKeySourceOfTrust.Not_Supported
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(trustDBEntry)
			when(
				publicKeySignatureFacade.verifyPublicKeySignature(
					maybeSignedPublicKey.publicKey,
					trustDBEntry.publicIdentityKey.object.key,
					maybeSignedPublicKey.signature!.signature,
				),
			).thenResolve(true)
			const result = await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey)
			o(result.verificationState).equals(EncryptionKeyVerificationState.NOT_SUPPORTED)
			o(result.publicEncryptionKey).equals(maybeSignedPublicKey.publicKey)
		})

		o("non-Ed25519 identity keys result in an error", async function () {
			trustDBEntry.publicIdentityKey.object.type = 10 as SigningKeyPairType
			when(publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)).thenResolve(trustDBEntry)
			when(
				publicKeySignatureFacade.verifyPublicKeySignature(
					maybeSignedPublicKey.publicKey,
					trustDBEntry.publicIdentityKey.object,
					maybeSignedPublicKey.signature!.signature,
				),
			).thenResolve(true)
			await assertThrows(ProgrammingError, async () => await keyVerification.verify(publicKeyIdentifier, maybeSignedPublicKey))
		})
	})

	o.spec("getManuallyVerifiedIdentities", function () {
		let trustDbEntries: Map<string, TrustDBEntry>
		const mailAddress = "trusted-entry@tuta.com"
		o.beforeEach(function () {
			trustDbEntries = new Map()
			trustDbEntries.set(mailAddress, trustDBEntry)
			when(identityKeyTrustDatabase.getManuallyVerifiedEntries()).thenResolve(trustDbEntries)
		})

		o("success - fingerprint is added to trust db entries", async function () {
			const result = await keyVerification.getManuallyVerifiedIdentities()
			o(result.size).equals(1)
			const trustIdentity = result.get(mailAddress)
			o(trustIdentity?.sourceOfTrust).deepEquals(trustDBEntry.sourceOfTrust)
			o(trustIdentity?.publicIdentityKey).deepEquals(trustDBEntry.publicIdentityKey)
			o(trustIdentity?.fingerprint).deepEquals(PUBLIC_KEY_FINGERPRINT)
		})
	})

	o.spec("fingerprint calculation is robust", function () {
		o("generic fingerprint calculation works", async function () {
			const fingerprint = await keyVerification.calculateFingerprint(trustDBEntry.publicIdentityKey)
			o(fingerprint).deepEquals(PUBLIC_KEY_FINGERPRINT)
		})

		o("key type and key version are embedded in fingerprint", function () {
			const verifyKeyMetadata = (concatenation: Uint8Array, keyVersion: number, keyType: SigningKeyPairType) => {
				o(concatenation.slice(0, 2)).deepEquals(new Uint8Array([keyVersion, keyType]))
			}

			let concatenation: Uint8Array
			let publicKey: Versioned<SigningPublicKey>

			publicKey = {
				version: 0,
				object: PUBLIC_KEY,
			}
			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, 0, SigningKeyPairType.Ed25519)

			publicKey = {
				version: 5,
				object: PUBLIC_KEY,
			}
			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, 5, SigningKeyPairType.Ed25519)
		})
	})
})

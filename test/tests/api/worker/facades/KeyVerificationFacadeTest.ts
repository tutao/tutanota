import o from "@tutao/otest"
import { KeyVerificationFacade, TrustedIdentity } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { matchers, object, verify, when } from "testdouble"
import { SqlType, TaggedSqlValue } from "../../../../../src/common/api/worker/offline/SqlValue"
import { concat, hexToUint8Array, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { IdentityKeySourceOfTrust, EncryptionKeyVerificationState } from "../../../../../src/common/api/common/TutanotaConstants"
import { bytesToEd25519PublicKey, PublicKey, sha256Hash } from "@tutao/tutanota-crypto"
import testData from "../crypto/CompatibilityTestData.json"
import { EncodedEd25519Signature, SigningKeyPairType, SigningPublicKey } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { Mode } from "../../../../../src/common/api/common/Env"
import { withOverriddenEnv } from "../../../TestUtils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { KeyVerificationMismatchError } from "../../../../../src/common/api/common/error/KeyVerificationMismatchError"
import { PublicKeySignatureFacade } from "../../../../../src/common/api/worker/facades/PublicKeySignatureFacade"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"

const { anything } = matchers

const PUBLIC_KEY_BYTES = hexToUint8Array(testData.ed25519Tests[0].alicePublicKeyHex)
const PUBLIC_KEY = bytesToEd25519PublicKey(PUBLIC_KEY_BYTES)
const PUBLIC_KEY_FINGERPRINT = uint8ArrayToHex(sha256Hash(concat(new Uint8Array([0]), new Uint8Array([SigningKeyPairType.Ed25519]), PUBLIC_KEY_BYTES)))
const PUBLIC_KEY_TRUSTED_IDENTITY: TrustedIdentity = {
	fingerprint: PUBLIC_KEY_FINGERPRINT,
	publicIdentityKey: {
		object: { key: PUBLIC_KEY, type: SigningKeyPairType.Ed25519 },
		version: 0,
	},
	sourceOfTrust: IdentityKeySourceOfTrust.Manual,
}

const TRUSTED_MAIL_ADDRESS = "trust-me@tuta.com"
const PUBLIC_KEY_FINGERPRINT_SQL_RESULT: Record<string, TaggedSqlValue> = {
	mailAddress: {
		type: SqlType.String,
		value: TRUSTED_MAIL_ADDRESS,
	},
	publicIdentityKey: {
		type: SqlType.Bytes,
		value: PUBLIC_KEY_BYTES,
	},
	identityKeyVersion: {
		type: SqlType.Number,
		value: 0,
	},
	identityKeyType: {
		type: SqlType.Number,
		value: SigningKeyPairType.Ed25519,
	},
	sourceOfTrust: {
		type: SqlType.Number,
		value: IdentityKeySourceOfTrust.Manual,
	},
}

o.spec("KeyVerificationFacadeTest", function () {
	let keyVerification: KeyVerificationFacade
	let sqlCipherFacade: SqlCipherFacade
	let publicKeySignatureFacade: PublicKeySignatureFacade

	let backupEnv: any

	o.beforeEach(function () {
		sqlCipherFacade = object()
		publicKeySignatureFacade = object()

		keyVerification = new KeyVerificationFacade(sqlCipherFacade, publicKeySignatureFacade)
	})

	o.spec("confirm trusted identity database works as intended", function () {
		o("identity database is empty", async function () {
			const sqlResult: Record<string, TaggedSqlValue>[] = []
			when(sqlCipherFacade.all(anything(), anything())).thenResolve(sqlResult)

			const result = await keyVerification.getTrustedIdentities()
			const expectation = new Map<string, TrustedIdentity>()

			o(result).deepEquals(expectation)

			verify(sqlCipherFacade.all("SELECT * FROM identity_store", []))
		})

		o("trusting an identity", async function () {
			await keyVerification.trust(TRUSTED_MAIL_ADDRESS, PUBLIC_KEY_TRUSTED_IDENTITY.publicIdentityKey, IdentityKeySourceOfTrust.Manual)

			const query =
				"\n\t\t\tINSERT INTO identity_store (mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust)\n\t\t\tVALUES (?, ?, ?, ?, ?)"
			const params: TaggedSqlValue[] = [
				{
					type: SqlType.String,
					value: TRUSTED_MAIL_ADDRESS,
				},
				{
					type: SqlType.Bytes,
					value: PUBLIC_KEY_BYTES,
				},
				{
					type: SqlType.Number,
					value: 0,
				},
				{
					type: SqlType.Number,
					value: SigningKeyPairType.Ed25519,
				},
				{
					type: SqlType.Number,
					value: IdentityKeySourceOfTrust.Manual,
				},
			]
			verify(sqlCipherFacade.run(query, params))
		})

		o("distrusting an identity", async function () {
			await keyVerification.untrust("untrust-me@tuta.com")

			const query = `DELETE FROM identity_store WHERE mailAddress = ?`
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "untrust-me@tuta.com" }]
			verify(sqlCipherFacade.run(query, params))
		})

		o("checking for trust", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)
			const trusted = await keyVerification.isTrusted(TRUSTED_MAIL_ADDRESS)

			const query = `SELECT * FROM identity_store WHERE mailAddress = ?`
			const params: TaggedSqlValue[] = [
				{
					type: SqlType.String,
					value: TRUSTED_MAIL_ADDRESS,
				},
			]
			verify(sqlCipherFacade.get(query, params))
			o(trusted).equals(true)
		})
	})

	o.spec("verification state gets resolved correctly", function () {
		o("manually trusted and verified keys result in VERIFIED_MANUAL", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)
			when(publicKeySignatureFacade.verifyPublicKeySignature(anything(), anything(), anything())).thenResolve(true)
			const encryptionPublicKey: Versioned<PublicKey> = object()
			const encodedSignature: EncodedEd25519Signature = object()
			const state = await keyVerification.verify(TRUSTED_MAIL_ADDRESS, encryptionPublicKey, encodedSignature)
			o(state).equals(EncryptionKeyVerificationState.VERIFIED_MANUAL)
		})

		o("tofu trusted and verified keys result in VERIFIED_TOFU", async function () {
			when(publicKeySignatureFacade.verifyPublicKeySignature(anything(), anything(), anything())).thenResolve(true)
			const TOFU_SQL_RESULT: Record<string, TaggedSqlValue> = {}
			Object.assign(TOFU_SQL_RESULT, PUBLIC_KEY_FINGERPRINT_SQL_RESULT, {
				sourceOfTrust: {
					type: SqlType.Number,
					value: IdentityKeySourceOfTrust.TOFU,
				},
			})
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(TOFU_SQL_RESULT)

			const encryptionPublicKey: Versioned<PublicKey> = object()
			const encodedSignature: EncodedEd25519Signature = object()
			const state = await keyVerification.verify(TRUSTED_MAIL_ADDRESS, encryptionPublicKey, encodedSignature)
			o(state).equals(EncryptionKeyVerificationState.VERIFIED_TOFU)
		})

		o("trusted but unverified keys result in MISMATCH", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)
			when(publicKeySignatureFacade.verifyPublicKeySignature(anything(), anything(), anything())).thenResolve(false)

			const encryptionPublicKey: Versioned<PublicKey> = object()
			const encodedSignature: EncodedEd25519Signature = object()

			await assertThrows(KeyVerificationMismatchError, async () => {
				await keyVerification.verify(TRUSTED_MAIL_ADDRESS, encryptionPublicKey, encodedSignature)
			})
		})

		o("untrusted keys result in NO_ENTRY", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(null)

			const encryptionPublicKey: Versioned<PublicKey> = object()
			const encodedSignature: EncodedEd25519Signature = object()

			const state = await keyVerification.verify(TRUSTED_MAIL_ADDRESS, encryptionPublicKey, encodedSignature)
			o(state).equals(EncryptionKeyVerificationState.NO_ENTRY)
			verify(publicKeySignatureFacade.verifyPublicKeySignature(anything(), anything(), anything()), { times: 0 })
		})

		o("trusted keys without retreived signatures result in a mismatch error", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)

			const encryptionPublicKey: Versioned<PublicKey> = object()
			const encodedSignature: EncodedEd25519Signature | null = null

			await assertThrows(KeyVerificationMismatchError, async () => {
				await keyVerification.verify(TRUSTED_MAIL_ADDRESS, encryptionPublicKey, encodedSignature)
			})
			verify(publicKeySignatureFacade.verifyPublicKeySignature(anything(), anything(), anything()), { times: 0 })
		})

		o("non-Ed25519 identity keys result in an error", async function () {
			const invalidTypeSqlResult: Record<string, TaggedSqlValue> = {}
			Object.assign(invalidTypeSqlResult, PUBLIC_KEY_FINGERPRINT_SQL_RESULT, {
				identityKeyType: {
					type: SqlType.Number,
					value: 10,
				},
			})
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(invalidTypeSqlResult)

			const encryptionPublicKey: Versioned<PublicKey> = object()
			const encodedSignature: EncodedEd25519Signature = object()

			await assertThrows(ProgrammingError, async () => {
				await keyVerification.verify(TRUSTED_MAIL_ADDRESS, encryptionPublicKey, encodedSignature)
			})
			verify(publicKeySignatureFacade.verifyPublicKeySignature(anything(), anything(), anything()), { times: 0 })
		})
	})

	o.spec("trusted identity acquisition", function () {
		o("acquire existing identity from trust database", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)

			const result = await keyVerification.getTrustedIdentity(TRUSTED_MAIL_ADDRESS)
			o(result).deepEquals(PUBLIC_KEY_TRUSTED_IDENTITY)

			const query = "SELECT * FROM identity_store WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: TRUSTED_MAIL_ADDRESS }]

			verify(sqlCipherFacade.get(query, params))
		})

		o("acquire non-existing identity from trust database", async function () {
			const result = await keyVerification.getTrustedIdentity("missing@example.com")
			o(result).equals(null)

			const query = "SELECT * FROM identity_store WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "missing@example.com" }]

			verify(sqlCipherFacade.get(query, params))
		})
	})

	o.spec("fingerprint calculation is robust", function () {
		o("generic fingerprint calculation works", async function () {
			const fingerprint = await keyVerification.calculateFingerprint(PUBLIC_KEY_TRUSTED_IDENTITY.publicIdentityKey)
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

	o("feature should be supported when on desktop", async function () {
		const isSupported = await withOverriddenEnv({ mode: Mode.Desktop }, () => keyVerification.isSupported())
		o(isSupported).equals(true)
	})

	o("feature should NOT be supported when on browser", async function () {
		const isSupported = await withOverriddenEnv({ mode: Mode.Browser }, () => keyVerification.isSupported())
		o(isSupported).equals(false)
	})

	o("database should NOT be queried when key verification is not supported", async function () {
		globalThis.env.mode = Mode.Browser
		await assertThrows(ProgrammingError, async () => {
			await keyVerification.verify(object(), object(), object())
		})
		verify(sqlCipherFacade.get(anything(), anything()), { times: 0 })
	})
})

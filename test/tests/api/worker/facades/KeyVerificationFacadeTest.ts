import o from "@tutao/otest"
import { KeyVerificationFacade, TrustedIdentity } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { matchers, object, verify, when } from "testdouble"
import { SqlType, TaggedSqlValue } from "../../../../../src/common/api/worker/offline/SqlValue"
import { concat, hexToUint8Array, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { KeyVerificationSourceOfTrust, KeyVerificationState } from "../../../../../src/common/api/common/TutanotaConstants"
import { bytesToEd25519PublicKey, PQPublicKeys, sha256Hash } from "@tutao/tutanota-crypto"
import testData from "../crypto/CompatibilityTestData.json"
import { Ed25519Facade, EncodedEd25519Signature, SigningKeyPairType, SigningPublicKey } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { Mode } from "../../../../../src/common/api/common/Env"
import { withOverriddenEnv } from "../../../TestUtils"

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
	sourceOfTrust: KeyVerificationSourceOfTrust.Manual,
}

const PUBLIC_KEY_FINGERPRINT_SQL_RESULT: Record<string, TaggedSqlValue> = {
	mailAddress: {
		type: SqlType.String,
		value: "test@example.com",
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
		value: KeyVerificationSourceOfTrust.Manual,
	},
}

const USER_GROUP_ID = "userGroupId"

o.spec("KeyVerificationFacadeTest", function () {
	let keyVerification: KeyVerificationFacade
	let sqlCipherFacade: SqlCipherFacade
	let ed25519Facade: Ed25519Facade

	let backupEnv: any

	o.beforeEach(function () {
		sqlCipherFacade = object()
		ed25519Facade = object()

		keyVerification = new KeyVerificationFacade(sqlCipherFacade, ed25519Facade)
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
			await keyVerification.trust("trust-me@tuta.com", PUBLIC_KEY_TRUSTED_IDENTITY.publicIdentityKey, KeyVerificationSourceOfTrust.Manual)

			const query =
				"\n\t\t\tINSERT INTO identity_store (mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust)\n\t\t\tVALUES (?, ?, ?, ?, ?)"
			const params: TaggedSqlValue[] = [
				{
					type: SqlType.String,
					value: "trust-me@tuta.com",
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
					value: KeyVerificationSourceOfTrust.Manual,
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
			await keyVerification.isTrusted("is-trusted@tuta.com")

			const query = `SELECT * FROM identity_store WHERE mailAddress = ?`
			const params: TaggedSqlValue[] = [
				{
					type: SqlType.String,
					value: "is-trusted@tuta.com",
				},
			]
			verify(sqlCipherFacade.get(query, params))
		})
	})

	o.spec("verification state gets resolved correctly", function () {
		o("trusted and verified keys result in VERIFIED", async function () {
			when(ed25519Facade.verify(anything(), anything(), anything())).thenResolve(true)
			const signature: EncodedEd25519Signature = object()
			const encryptionPublicKey: Versioned<PQPublicKeys> = object()
			const state = await keyVerification.verify(PUBLIC_KEY_TRUSTED_IDENTITY.publicIdentityKey, encryptionPublicKey, signature)
			o(state).equals(KeyVerificationState.VERIFIED)
		})

		o("trusted but unverified keys result in MISMATCH", async function () {
			when(ed25519Facade.verify(anything(), anything(), anything())).thenResolve(false)

			const signature: EncodedEd25519Signature = object()
			const encryptionPublicKey: Versioned<PQPublicKeys> = object()
			const state = await keyVerification.verify(PUBLIC_KEY_TRUSTED_IDENTITY.publicIdentityKey, encryptionPublicKey, signature)
			o(state).equals(KeyVerificationState.MISMATCH)
		})
	})

	o.spec("trusted identity acquisition", function () {
		o("acquire existing identity from trust database", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)

			const result = await keyVerification.getTrustedIdentity("test@example.com")
			o(result).deepEquals(PUBLIC_KEY_TRUSTED_IDENTITY)

			const query = "SELECT * FROM identity_store WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "test@example.com" }]

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
		const verificationState = await keyVerification.verify(object(), object(), object())
		o(verificationState).equals(KeyVerificationState.NO_ENTRY)
		verify(sqlCipherFacade.get(anything(), anything()), { times: 0 })
	})
})

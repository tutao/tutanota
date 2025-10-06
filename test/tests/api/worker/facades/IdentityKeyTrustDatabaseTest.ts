import o from "@tutao/otest"
import { SqlType, TaggedSqlValue } from "../../../../../src/common/api/worker/offline/SqlValue"
import { matchers, object, verify, when } from "testdouble"
import { TrustedIdentity } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { IdentityKeySourceOfTrust } from "../../../../../src/common/api/common/TutanotaConstants"
import { SigningKeyPairType } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { Mode } from "../../../../../src/common/api/common/Env"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { IdentityKeyTrustDatabase, TrustDBEntry } from "../../../../../src/common/api/worker/facades/IdentityKeyTrustDatabase"
import { hexToUint8Array } from "@tutao/tutanota-utils"
import testData from "../crypto/CompatibilityTestData.json"
import { bytesToEd25519PublicKey } from "@tutao/tutanota-crypto"
import { withOverriddenEnv } from "../../../TestUtils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { LoginFacade } from "../../../../../src/common/api/worker/facades/LoginFacade"
import { SessionType } from "../../../../../src/common/api/common/SessionType"

const { anything } = matchers
o.spec("IdentityKeyTrustDatabaseTest", function () {
	let sqlCipherFacade: SqlCipherFacade
	let loginFacade: LoginFacade
	let identityKeyTrustDatabase: IdentityKeyTrustDatabase

	const PUBLIC_KEY_BYTES = hexToUint8Array(testData.ed25519Tests[0].alicePublicKeyHex)
	const PUBLIC_KEY = bytesToEd25519PublicKey(PUBLIC_KEY_BYTES)
	const PUBLIC_KEY_TRUST_ENTRY: TrustDBEntry = {
		publicIdentityKey: {
			object: { key: PUBLIC_KEY, type: SigningKeyPairType.Ed25519 },
			version: 0,
		},
		sourceOfTrust: IdentityKeySourceOfTrust.Manual,
	}

	const TRUSTED_MAIL_ADDRESS = "trust-me@tuta.com"
	const PUBLIC_KEY_SQL_RESULT: Record<string, TaggedSqlValue> = {
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
	let backupEnv

	o.beforeEach(function () {
		sqlCipherFacade = object()
		loginFacade = object()
		identityKeyTrustDatabase = new IdentityKeyTrustDatabase(sqlCipherFacade, () => loginFacade)
		backupEnv = globalThis.env
	})
	o.afterEach(function () {
		globalThis.env = backupEnv
	})

	o.spec("trust", function () {
		o("manually trusting an identity", async function () {
			const result = await identityKeyTrustDatabase.trust(TRUSTED_MAIL_ADDRESS, PUBLIC_KEY_TRUST_ENTRY.publicIdentityKey, IdentityKeySourceOfTrust.Manual)
			o(result.sourceOfTrust).equals(IdentityKeySourceOfTrust.Manual)
			o(result.publicIdentityKey).deepEquals(PUBLIC_KEY_TRUST_ENTRY.publicIdentityKey)

			// @formatter:off
			const query =
				"\n\t\t\tINSERT OR REPLACE INTO identity_store (mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust)\n\t\t\tVALUES (?, ?, ?, ?, ?)"
			// @formatter:on
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
		o("trusting an identity with TOFU", async function () {
			const result = await identityKeyTrustDatabase.trust(TRUSTED_MAIL_ADDRESS, PUBLIC_KEY_TRUST_ENTRY.publicIdentityKey, IdentityKeySourceOfTrust.TOFU)
			o(result.sourceOfTrust).equals(IdentityKeySourceOfTrust.TOFU)
			o(result.publicIdentityKey).deepEquals(PUBLIC_KEY_TRUST_ENTRY.publicIdentityKey)

			// @formatter:off
			const query =
				"\n\t\t\tINSERT INTO identity_store (mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust)\n\t\t\tSELECT ?,\n\t\t\t\t?,\n\t\t\t\t?,\n\t\t\t\t?,\n\t\t\t\t?\n\t\t\tWHERE NOT EXISTS\n\t\t\t(SELECT 1 FROM identity_store WHERE mailAddress = ?\n\t\t\t\tAND publicIdentityKey = ?\n\t\t\t\tAND identityKeyVersion = ?\n\t\t\t\tAND identityKeyType = ?\n\t\t\t\tAND sourceOfTrust = ?)"
			// @formatter:on
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
					value: IdentityKeySourceOfTrust.TOFU,
				},
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
					value: IdentityKeySourceOfTrust.TOFU,
				},
			]
			verify(sqlCipherFacade.run(query, params))
		})
		o("trusting an identity with Not_supported throws", async function () {
			await assertThrows(
				ProgrammingError,
				async () =>
					await identityKeyTrustDatabase.trust(
						TRUSTED_MAIL_ADDRESS,
						PUBLIC_KEY_TRUST_ENTRY.publicIdentityKey,
						IdentityKeySourceOfTrust.Not_Supported,
					),
			)
			verify(sqlCipherFacade.run(matchers.anything(), matchers.anything()), { times: 0 })
		})
	})

	o.spec("confirm trusted identity database works as intended", function () {
		o("identity database is empty", async function () {
			const sqlResult: Record<string, TaggedSqlValue>[] = []
			when(sqlCipherFacade.all(anything(), anything())).thenResolve(sqlResult)

			const result = await identityKeyTrustDatabase.getManuallyVerifiedEntries()
			const expectation = new Map<string, TrustedIdentity>()

			o(result).deepEquals(expectation)

			// @formatter:off
			verify(sqlCipherFacade.all(`SELECT * FROM identity_store WHERE sourceOfTrust = ${IdentityKeySourceOfTrust.Manual.valueOf()}`, []))
			// @formatter:on
		})

		o("distrusting an identity", async function () {
			await identityKeyTrustDatabase.untrust("untrust-me@tuta.com")

			// @formatter:off
			const query = `DELETE FROM identity_store WHERE mailAddress = ?`
			// @formatter:on
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "untrust-me@tuta.com" }]
			verify(sqlCipherFacade.run(query, params))
		})
	})
	o.spec("trusted identity acquisition", function () {
		o("acquire existing identity from trust database", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_SQL_RESULT)

			const result = await identityKeyTrustDatabase.getTrustedEntry(TRUSTED_MAIL_ADDRESS)
			o(result).deepEquals(PUBLIC_KEY_TRUST_ENTRY)

			// @formatter:off
			const query = "SELECT * FROM identity_store WHERE mailAddress = ?"
			// @formatter:on
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: TRUSTED_MAIL_ADDRESS }]

			verify(sqlCipherFacade.get(query, params))
		})

		o("acquire non-existing identity from trust database", async function () {
			const result = await identityKeyTrustDatabase.getTrustedEntry("missing@example.com")
			o(result).equals(null)

			// @formatter:off
			const query = "SELECT * FROM identity_store WHERE mailAddress = ?"
			// @formatter:on
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "missing@example.com" }]

			verify(sqlCipherFacade.get(query, params))
		})
	})

	o("feature should be supported when on desktop", async function () {
		when(loginFacade.getSessionType()).thenResolve(SessionType.Persistent)
		const isSupported = await withOverriddenEnv({ mode: Mode.Desktop }, () => identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported())
		o(isSupported).equals(true)
	})

	o("feature should NOT be supported when on browser", async function () {
		when(loginFacade.getSessionType()).thenResolve(SessionType.Persistent)
		const isSupported = await withOverriddenEnv({ mode: Mode.Browser }, () => identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported())
		o(isSupported).equals(false)
	})

	o("feature should NOT be supported in login/temporary sessions", async function () {
		let isSupported: boolean

		when(loginFacade.getSessionType()).thenResolve(SessionType.Login)
		isSupported = await withOverriddenEnv({ mode: Mode.Desktop }, () => identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported())
		o(isSupported).equals(false)

		when(loginFacade.getSessionType()).thenResolve(SessionType.Temporary)
		isSupported = await withOverriddenEnv({ mode: Mode.Desktop }, () => identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported())
		o(isSupported).equals(false)
	})
})

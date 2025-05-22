import o from "@tutao/otest"
import { KeyVerificationFacade, PublicKeyFingerprint } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { matchers, object, verify, when } from "testdouble"
import { SqlType, TaggedSqlValue } from "../../../../../src/common/api/worker/offline/SqlValue"
import { PublicKeyGetOut, PublicKeyGetOutTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { concat, lazyAsync, stringToUtf8Uint8Array, Versioned } from "@tutao/tutanota-utils"
import {
	FeatureType,
	KeyVerificationSourceOfTruth,
	KeyVerificationState,
	PublicKeyIdentifierType,
} from "../../../../../src/common/api/common/TutanotaConstants"
import { NotFoundError } from "../../../../../src/common/api/common/error/RestError"
import { KeyPairType, PQPublicKeys, PublicKey } from "@tutao/tutanota-crypto"
import { PublicKeyIdentifier, PublicKeyProvider } from "../../../../../src/common/api/worker/facades/PublicKeyProvider"
import { CustomerFacade } from "../../../../../src/common/api/worker/facades/lazy/CustomerFacade"
import { Mode } from "../../../../../src/common/api/common/Env"
import { withOverriddenEnv } from "../../../TestUtils"

const { anything } = matchers

const PUBLIC_KEY_GET_OUT: PublicKeyGetOut = {
	_format: "0",
	_type: PublicKeyGetOutTypeRef,
	pubKeyVersion: "0",
	pubEccKey: stringToUtf8Uint8Array("ecc-key"),
	pubKyberKey: stringToUtf8Uint8Array("kyb-key"),
	pubRsaKey: null,
}
const PUBLIC_KEY: Versioned<PQPublicKeys> = {
	version: 0,
	object: {
		keyPairType: KeyPairType.TUTA_CRYPT,
		x25519PublicKey: stringToUtf8Uint8Array("ecc-key"),
		kyberPublicKey: {
			raw: stringToUtf8Uint8Array("kyb-key"),
		},
	},
}

const PUBLIC_KEY_FINGERPRINT_HASH = "0daeb9563c5e09f0033a93d4696d1d13bb8362572e6c14d779581586c5fb0e66"
const PUBLIC_KEY_FINGERPRINT: PublicKeyFingerprint = {
	fingerprint: PUBLIC_KEY_FINGERPRINT_HASH,
	keyPairType: KeyPairType.TUTA_CRYPT,
	keyVersion: 0,
}

const PUBLIC_KEY_FINGERPRINT_SQL_RESULT: Record<string, TaggedSqlValue> = {
	mailAddress: {
		type: SqlType.String,
		value: "test@example.com",
	},
	fingerprint: {
		type: SqlType.String,
		value: PUBLIC_KEY_FINGERPRINT_HASH,
	},
	keyVersion: {
		type: SqlType.Number,
		value: 0,
	},
	keyType: {
		type: SqlType.Number,
		value: KeyPairType.TUTA_CRYPT,
	},
}

o.spec("KeyVerificationFacadeTest", function () {
	let keyVerification: KeyVerificationFacade
	let sqlCipherFacade: SqlCipherFacade
	let publicKeyProvider: PublicKeyProvider
	let lazyCustomerFacade: lazyAsync<CustomerFacade>
	let customerFacade: CustomerFacade
	let versionedRecipientPublicKey: Versioned<PQPublicKeys>

	let backupEnv: any

	o.beforeEach(function () {
		customerFacade = object()
		sqlCipherFacade = object()
		publicKeyProvider = object()

		when(customerFacade.isEnabled(FeatureType.KeyVerification)).thenResolve(true)
		lazyCustomerFacade = () => Promise.resolve(customerFacade)

		keyVerification = new KeyVerificationFacade(lazyCustomerFacade, sqlCipherFacade, publicKeyProvider)

		when(publicKeyProvider.convertFromPublicKeyGetOut(PUBLIC_KEY_GET_OUT)).thenReturn(PUBLIC_KEY)
	})

	o.spec("confirm trusted identity database works as intended", function () {
		o("identity database is empty", async function () {
			const sqlResult: Record<string, TaggedSqlValue>[] = []
			when(sqlCipherFacade.all(anything(), anything())).thenResolve(sqlResult)

			const result = await keyVerification.getTrustedIdentities()
			const expectation = new Map<string, PublicKeyFingerprint>()

			o(result).deepEquals(expectation)
			verify(sqlCipherFacade.all("SELECT * FROM trusted_identities", []))
		})

		o("trusting an identity", async function () {
			await keyVerification.trust("trust-me@tuta.com", "a-fingerprint", 0, KeyPairType.TUTA_CRYPT)

			const query = "\n\t\t\tINSERT INTO trusted_identities (mailAddress, fingerprint, keyVersion, keyType)\n\t\t\tVALUES (?, ?, ?, ?)"
			const params: TaggedSqlValue[] = [
				{
					type: SqlType.String,
					value: "trust-me@tuta.com",
				},
				{
					type: SqlType.String,
					value: "a-fingerprint",
				},
				{
					type: SqlType.Number,
					value: 0,
				},
				{
					type: SqlType.Number,
					value: KeyPairType.TUTA_CRYPT,
				},
			]
			verify(sqlCipherFacade.run(query, params))
		})

		o("distrusting an identity", async function () {
			await keyVerification.untrust("untrust-me@tuta.com")

			const query = "DELETE FROM trusted_identities WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "untrust-me@tuta.com" }]
			verify(sqlCipherFacade.run(query, params))
		})

		o("checking for trust", async function () {
			await keyVerification.isTrusted("is-trusted@tuta.com")

			const query = "SELECT * FROM trusted_identities WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "is-trusted@tuta.com" }]
			verify(sqlCipherFacade.get(query, params))
		})
	})

	o.spec("verification state gets resolved correctly", function () {
		o("untrusted keys result in NO_ENTRY", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(null)

			const state = await keyVerification.resolveVerificationState("noentry@example.com", PUBLIC_KEY)
			o(state).equals(KeyVerificationState.NO_ENTRY)
		})

		o("request a public key when none is supplied", async function () {
			when(publicKeyProvider.loadCurrentPubKey(anything())).thenResolve(PUBLIC_KEY)

			await keyVerification.resolveVerificationState("test@example.com", null)

			verify(
				publicKeyProvider.loadCurrentPubKey({
					identifier: "test@example.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				} as PublicKeyIdentifier),
			)
		})

		o("missing public key responses result in MISMATCH", async function () {
			when(
				sqlCipherFacade.get(
					anything(),
					matchers.argThat((params: TaggedSqlValue[]) => {
						return typeof params[0] !== "undefined" && params[0].value == "missing@example.com"
					}),
				),
			).thenResolve({
				mailAddress: {
					type: SqlType.String,
					value: "missing@example.com",
				},
				fingerprint: {
					type: SqlType.String,
					value: PUBLIC_KEY_FINGERPRINT_HASH,
				},
				keyVersion: {
					type: SqlType.Number,
					value: 0,
				},
				keyType: {
					type: SqlType.Number,
					value: KeyPairType.TUTA_CRYPT,
				},
			})

			// Fail to receive the public key
			when(
				publicKeyProvider.loadCurrentPubKey({
					identifier: "missing@example.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			).thenReject(new NotFoundError(""))

			const state = await keyVerification.resolveVerificationState("missing@example.com", null)
			o(state).equals(KeyVerificationState.MISMATCH)
		})

		o("trusted and verified keys result in VERIFIED", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)

			const state = await keyVerification.resolveVerificationState("test@example.com", PUBLIC_KEY)
			o(state).equals(KeyVerificationState.VERIFIED)
		})

		o("trusted but unverified keys result in MISMATCH", async function () {
			const publicKeyGetOut: PublicKeyGetOut = object()

			const publicKey: Versioned<PQPublicKeys> = object()
			publicKey.object.keyPairType = KeyPairType.TUTA_CRYPT
			publicKey.object.kyberPublicKey.raw = stringToUtf8Uint8Array("kyb-fail-key")
			publicKey.object.x25519PublicKey = stringToUtf8Uint8Array("ecc-fail-key")

			const state = await keyVerification.resolveVerificationState("test@example.com", publicKey)
			o(state).equals(KeyVerificationState.MISMATCH)
		})
	})

	o.spec("fingerprint acquisition", function () {
		o("acquire existing fingerprint from trust database", async function () {
			when(sqlCipherFacade.get(anything(), anything())).thenResolve(PUBLIC_KEY_FINGERPRINT_SQL_RESULT)

			const result = await keyVerification.getFingerprint("test@example.com", KeyVerificationSourceOfTruth.LocalTrusted)
			o(result).deepEquals(PUBLIC_KEY_FINGERPRINT)

			const query = "SELECT * FROM trusted_identities WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "test@example.com" }]

			verify(sqlCipherFacade.get(query, params))
		})

		o("acquire non-existing fingerprint from trust database", async function () {
			const result = await keyVerification.getFingerprint("missing@example.com", KeyVerificationSourceOfTruth.LocalTrusted)
			o(result).equals(null)

			const query = "SELECT * FROM trusted_identities WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "missing@example.com" }]

			verify(sqlCipherFacade.get(query, params))
		})

		o("acquire existing fingerprint from public key provider", async function () {
			when(publicKeyProvider.loadCurrentPubKey(anything())).thenResolve(PUBLIC_KEY)

			const result = await keyVerification.getFingerprint("test@example.com", KeyVerificationSourceOfTruth.PublicKeyService)
			o(result).deepEquals(PUBLIC_KEY_FINGERPRINT)

			verify(
				publicKeyProvider.loadCurrentPubKey({
					identifier: "test@example.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			)
		})

		o("acquire non-existing fingerprint from public key provider", async function () {
			when(
				publicKeyProvider.loadCurrentPubKey({
					identifier: "missing@example.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			).thenReject(new NotFoundError(""))

			const result = await keyVerification.getFingerprint("missing@example.com", KeyVerificationSourceOfTruth.PublicKeyService)
			o(result).equals(null)

			verify(
				publicKeyProvider.loadCurrentPubKey({
					identifier: "missing@example.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			)
		})
	})

	o.spec("fingerprint calculation is robust", function () {
		o("generic fingerprint calculation works", function () {
			const fingerprint = keyVerification.calculateFingerprint(PUBLIC_KEY)
			o(fingerprint).deepEquals(PUBLIC_KEY_FINGERPRINT)
		})

		o("key type and key version are embedded in fingerprint", function () {
			const verifyKeyMetadata = (concatenation: Uint8Array, keyVersion: number, keyType: KeyPairType) => {
				o(concatenation.slice(0, 2)).deepEquals(concat(stringToUtf8Uint8Array(String(keyVersion)), stringToUtf8Uint8Array(String(keyType))))
			}

			let concatenation: Uint8Array
			let publicKey: Versioned<PublicKey>

			publicKey = {
				version: 0,
				object: {
					version: 0,
					keyLength: 0,
					keyPairType: KeyPairType.RSA,
					modulus: "",
					publicExponent: 0,
				},
			}

			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, publicKey.version, KeyPairType.RSA)

			publicKey.version = 1
			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, 1, KeyPairType.RSA)

			publicKey.version = 2
			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, 2, KeyPairType.RSA)

			publicKey = {
				version: 0,
				object: {
					keyPairType: KeyPairType.TUTA_CRYPT,
					x25519PublicKey: new Uint8Array([]),
					kyberPublicKey: { raw: new Uint8Array([]) },
				},
			}

			publicKey.object.keyPairType = KeyPairType.TUTA_CRYPT
			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, 0, KeyPairType.TUTA_CRYPT)

			publicKey = {
				version: 0,
				object: {
					version: 0,
					keyLength: 0,
					keyPairType: KeyPairType.RSA,
					modulus: "",
					publicExponent: 0,
					publicEccKey: new Uint8Array([]),
				},
			}

			publicKey.object.keyPairType = KeyPairType.RSA_AND_X25519
			concatenation = keyVerification.concatenateFingerprint(publicKey)
			verifyKeyMetadata(concatenation, 0, KeyPairType.RSA_AND_X25519)
		})
	})

	o("feature should be supported when on desktop and enabled", async function () {
		when(customerFacade.isEnabled(FeatureType.KeyVerification)).thenResolve(true)

		const isSupported = await withOverriddenEnv({ mode: Mode.Desktop }, () => keyVerification.isSupported())
		o(isSupported).equals(true)
	})

	o("feature should NOT be supported when on desktop and disabled", async function () {
		when(customerFacade.isEnabled(FeatureType.KeyVerification)).thenResolve(false)

		const isSupported = await withOverriddenEnv({ mode: Mode.Desktop }, () => keyVerification.isSupported())
		o(isSupported).equals(false)
	})

	o("feature should NOT be supported when on browser and enabled", async function () {
		when(customerFacade.isEnabled(FeatureType.KeyVerification)).thenResolve(true)

		const isSupported = await withOverriddenEnv({ mode: Mode.Browser }, () => keyVerification.isSupported())
		o(isSupported).equals(false)
	})

	o("database should NOT be queried when key verification is not supported", async function () {
		// Ensure isSupported() returns false
		when(customerFacade.isEnabled(FeatureType.KeyVerification)).thenResolve(false)

		const verificationState = await keyVerification.resolveVerificationState(object(), object())
		o(verificationState).equals(KeyVerificationState.NO_ENTRY)

		verify(sqlCipherFacade.get(anything(), anything()), { times: 0 })
	})
})

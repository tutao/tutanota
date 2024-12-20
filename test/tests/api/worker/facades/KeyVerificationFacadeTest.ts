import o from "@tutao/otest"
import { KeyVerificationDetails, KeyVerificationFacade, KeyVerificationState } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { matchers, object, verify, when } from "testdouble"
import { SqlType, TaggedSqlValue } from "../../../../../src/common/api/worker/offline/SqlValue"
import { PublicKeyGetIn, PublicKeyGetOut, PublicKeyGetOutTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { createTestEntity } from "../../../TestUtils"
import { KeyVerificationSourceOfTruth } from "../../../../../src/common/api/common/TutanotaConstants"
import { PublicKeyService } from "../../../../../src/common/api/entities/sys/Services"
import { NotFoundError } from "../../../../../src/common/api/common/error/RestError"

const { anything } = matchers

const PUBLIC_KEY: PublicKeyGetOut = {
	_format: "0",
	_type: PublicKeyGetOutTypeRef,
	pubKeyVersion: "0",
	pubEccKey: stringToUtf8Uint8Array("ecc-key"),
	pubKyberKey: stringToUtf8Uint8Array("kyb-key"),
	pubRsaKey: null,
}
const PUBLIC_KEY_FINGERPRINT = "2b5462c7b47b2ad22dc567b86e837b2ce3f649fbfbe1684631c83f5625202ea4"

o.spec("KeyVerificationFacadeTest", function () {
	let keyVerification: KeyVerificationFacade
	let serviceExecutor: IServiceExecutor
	let sqlCipherFacade: SqlCipherFacade

	o.beforeEach(function () {
		serviceExecutor = object()
		sqlCipherFacade = object()

		keyVerification = new KeyVerificationFacade(serviceExecutor, sqlCipherFacade)
		when(sqlCipherFacade.get(anything(), anything())).thenResolve(null)
		when(
			sqlCipherFacade.get(
				anything(),
				matchers.argThat((params) => {
					return params[0].value == "test@example.com"
				}),
			),
		).thenResolve({
			fingerprint: {
				type: SqlType.String,
				value: PUBLIC_KEY_FINGERPRINT,
			},
		})
		when(
			serviceExecutor.get(
				PublicKeyService,
				matchers.argThat((params: PublicKeyGetIn) => {
					return params.identifier == "test@example.com"
				}),
			),
		).thenResolve(PUBLIC_KEY)
		when(
			serviceExecutor.get(
				PublicKeyService,
				matchers.argThat((params: PublicKeyGetIn) => {
					return params.identifier == "missing@example.com"
				}),
			),
		).thenDo(() => {
			throw new NotFoundError("")
		})
	})

	o.spec("confirm trusted identity database works as intended", function () {
		o("identity database is empty", async function () {
			const sqlResult: Record<string, TaggedSqlValue>[] = []
			when(sqlCipherFacade.all(anything(), anything())).thenResolve(sqlResult)

			const result = await keyVerification.getTrustedIdentities()
			const expectation = new Map<string, KeyVerificationDetails>()

			o(result).deepEquals(expectation)
			verify(sqlCipherFacade.all("SELECT * FROM trusted_identities", []))
		})

		o("trusting an identity", async function () {
			await keyVerification.trust("trust-me@tuta.com", "a-fingerprint")

			const query =
				"\n\t\t\tINSERT INTO trusted_identities (mailAddress, fingerprint)\n\t\t\tVALUES (?, ?)\n" +
				"\t\t\tON CONFLICT(mailAddress) DO UPDATE SET mailAddress=excluded.mailAddress, fingerprint=excluded.fingerprint"
			const params: TaggedSqlValue[] = [
				{
					type: SqlType.String,
					value: "trust-me@tuta.com",
				},
				{
					type: SqlType.String,
					value: "a-fingerprint",
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
			const state = await keyVerification.resolveVerificationState("noentry@example.com", PUBLIC_KEY)
			o(state).equals(KeyVerificationState.NO_ENTRY)
		})

		o("trusted and verified keys result in VERIFIED", async function () {
			const state = await keyVerification.resolveVerificationState("test@example.com", PUBLIC_KEY)
			o(state).equals(KeyVerificationState.VERIFIED)
		})

		o("trusted but unverified keys result in MISMATCH", async function () {
			const state = await keyVerification.resolveVerificationState(
				"test@example.com",
				createTestEntity(PublicKeyGetOutTypeRef, { pubRsaKey: stringToUtf8Uint8Array("rsa-key") }),
			)
			o(state).equals(KeyVerificationState.MISMATCH)
		})
	})

	o.spec("fingerprint acquisition", function () {
		o("acquire existing fingerprint from trust database", async function () {
			const result = await keyVerification.getFingerprint("test@example.com", KeyVerificationSourceOfTruth.LocalTrusted)
			o(result).equals(PUBLIC_KEY_FINGERPRINT)

			const query = "SELECT fingerprint FROM trusted_identities WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "test@example.com" }]

			verify(sqlCipherFacade.get(query, params))
		})

		o("acquire non-existing fingerprint from trust database", async function () {
			const result = await keyVerification.getFingerprint("missing@example.com", KeyVerificationSourceOfTruth.LocalTrusted)
			o(result).equals(null)

			const query = "SELECT fingerprint FROM trusted_identities WHERE mailAddress = ?"
			const params: TaggedSqlValue[] = [{ type: SqlType.String, value: "missing@example.com" }]

			verify(sqlCipherFacade.get(query, params))
		})

		o("acquire existing fingerprint from public key service", async function () {
			const result = await keyVerification.getFingerprint("test@example.com", KeyVerificationSourceOfTruth.PublicKeyService)
			o(result).equals(PUBLIC_KEY_FINGERPRINT)

			verify(serviceExecutor.get(PublicKeyService, anything()))
		})

		o("acquire non-existing fingerprint from public key service", async function () {
			const result = await keyVerification.getFingerprint("missing@example.com", KeyVerificationSourceOfTruth.PublicKeyService)
			o(result).equals(null)

			verify(serviceExecutor.get(PublicKeyService, anything()))
		})
	})

	o.spec("fingerprint calculation is robust", function () {
		o("generic fingerprint calculation works", function () {
			const fingerprint = keyVerification.calculateFingerprint(PUBLIC_KEY)
			o(fingerprint).equals(PUBLIC_KEY_FINGERPRINT)
		})

		o("refuse to accept an empty key set", function () {
			const noValidKeyError = "Server did not return a single valid public key. (tested for RSA, ECC, Kyber)"
			const keys: PublicKeyGetOut = {
				_format: "0",
				_type: PublicKeyGetOutTypeRef,
				pubKeyVersion: "0",
				pubEccKey: null,
				pubKyberKey: null,
				pubRsaKey: null,
			}
			o(() => keyVerification.calculateFingerprint(keys)).throws(noValidKeyError)
		})

		// TODO: maybe calculateFingerprint() should also check some constraints (length, alphabet) for the keys passed in
	})
})

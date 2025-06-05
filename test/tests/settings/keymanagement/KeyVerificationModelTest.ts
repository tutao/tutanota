import o from "@tutao/otest"
import { KeyVerificationModel } from "../../../../src/common/settings/keymanagement/KeyVerificationModel"
import { KeyVerificationFacade } from "../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { MobileSystemFacade } from "../../../../src/common/native/common/generatedipc/MobileSystemFacade"
import { KeyVerificationUsageTestUtils } from "../../../../src/common/settings/keymanagement/KeyVerificationUsageTestUtils"
import { matchers, object, verify, when } from "testdouble"
import {
	IdentityKeyQrVerificationResult,
	IdentityKeySourceOfTrust,
	IdentityKeyVerificationMethod,
	PublicKeyIdentifierType,
} from "../../../../src/common/api/common/TutanotaConstants"
import { SigningPublicKey } from "../../../../src/common/api/worker/facades/Ed25519Facade"
import { Versioned } from "@tutao/tutanota-utils"
import { PermissionType } from "../../../../src/common/native/common/generatedipc/PermissionType"
import { QRCode } from "jsqr"
import { PublicIdentityKeyProvider } from "../../../../src/common/api/worker/facades/PublicIdentityKeyProvider"
import { TrustDBEntry } from "../../../../src/common/api/worker/facades/IdentityKeyTrustDatabase"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../src/common/api/common/error/ProgrammingError"

o.spec("KeyVerificationModelTest", function () {
	let keyVerificationModel: KeyVerificationModel
	let keyVerificationFacade: KeyVerificationFacade
	let mobileSystemFacade: MobileSystemFacade
	let keyVerificationTestUtils: KeyVerificationUsageTestUtils
	let publicIdentityKeyProvider: PublicIdentityKeyProvider

	o.beforeEach(function () {
		keyVerificationFacade = object()
		mobileSystemFacade = object()
		keyVerificationTestUtils = object()
		publicIdentityKeyProvider = object()

		keyVerificationModel = new KeyVerificationModel(keyVerificationFacade, mobileSystemFacade, keyVerificationTestUtils, publicIdentityKeyProvider)
	})

	o.spec("test handleMethodSwitch()", function () {
		o("start text verification", async function () {
			await keyVerificationModel.handleMethodSwitch(IdentityKeyVerificationMethod.text)

			verify(keyVerificationTestUtils.start(IdentityKeyVerificationMethod.text))
			verify(keyVerificationTestUtils.regret(), { times: 0 })

			o(keyVerificationModel.getChosenMethod()).equals(IdentityKeyVerificationMethod.text)
		})

		o("start qr verification", async function () {
			await keyVerificationModel.handleMethodSwitch(IdentityKeyVerificationMethod.qr)

			verify(keyVerificationTestUtils.start(IdentityKeyVerificationMethod.qr))
			verify(keyVerificationTestUtils.regret(), { times: 0 })

			o(keyVerificationModel.getChosenMethod()).equals(IdentityKeyVerificationMethod.qr)
		})

		o("start text verification with regret", async function () {
			await keyVerificationModel.handleMethodSwitch(IdentityKeyVerificationMethod.qr)
			await keyVerificationModel.handleMethodSwitch(IdentityKeyVerificationMethod.text)

			verify(keyVerificationTestUtils.start(IdentityKeyVerificationMethod.text))
			verify(keyVerificationTestUtils.regret())

			o(keyVerificationModel.getChosenMethod()).equals(IdentityKeyVerificationMethod.text)
		})
	})

	o.spec("test loadIdentityKeyForMailAddress()", function () {
		o("success", async function () {
			const trustDBEntry: TrustDBEntry = {
				publicIdentityKey: object(),
				sourceOfTrust: object(),
			}

			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(trustDBEntry)
			when(keyVerificationFacade.calculateFingerprint(trustDBEntry.publicIdentityKey)).thenReturn("aabbccdd")

			const publicIdentity = await keyVerificationModel.loadIdentityKeyForMailAddress("alice@tuta.com")

			verify(
				publicIdentityKeyProvider.loadPublicIdentityKey({
					identifier: "alice@tuta.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			)
			o(publicIdentity).deepEquals({
				fingerprint: "aabbccdd",
				key: trustDBEntry.publicIdentityKey,
				mailAddress: "alice@tuta.com",
			})
		})

		o("no identity key", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(null)

			const publicIdentity = await keyVerificationModel.loadIdentityKeyForMailAddress("alice@tuta.com")
			o(publicIdentity).equals(null)
		})
		o("no trust database results in programming error", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve({
				sourceOfTrust: IdentityKeySourceOfTrust.Not_Supported,
				publicIdentityKey: object(),
			})

			await assertThrows(ProgrammingError, async () => await keyVerificationModel.loadIdentityKeyForMailAddress("alice@tuta.com"))
		})
	})

	o.spec("test trust()", function () {
		o("success", async function () {
			const trustDBEntry: TrustDBEntry = {
				publicIdentityKey: object(),
				sourceOfTrust: object(),
			}

			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(trustDBEntry)

			await keyVerificationModel.loadIdentityKeyForMailAddress("alice@tuta.com")

			await keyVerificationModel.trust(IdentityKeyVerificationMethod.text)
			verify(keyVerificationFacade.trust("alice@tuta.com", trustDBEntry.publicIdentityKey, IdentityKeySourceOfTrust.Manual))
			verify(keyVerificationTestUtils.verified(IdentityKeyVerificationMethod.text))

			await keyVerificationModel.trust(IdentityKeyVerificationMethod.qr)
			verify(keyVerificationFacade.trust("alice@tuta.com", trustDBEntry.publicIdentityKey, IdentityKeySourceOfTrust.Manual))
			verify(keyVerificationTestUtils.verified(IdentityKeyVerificationMethod.qr))
		})
	})

	o.spec("test requestCameraPermission()", function () {
		o("permission already given", async function () {
			when(mobileSystemFacade.hasPermission(PermissionType.Camera)).thenResolve(true)
			const success = await keyVerificationModel.requestCameraPermission()

			verify(mobileSystemFacade.requestPermission(PermissionType.Camera), { times: 0 })
			o(success).equals(true)
		})

		o("permission not given, but granted successfully by user", async function () {
			when(mobileSystemFacade.hasPermission(PermissionType.Camera)).thenResolve(false)
			const success = await keyVerificationModel.requestCameraPermission()

			verify(mobileSystemFacade.requestPermission(PermissionType.Camera))
			o(success).equals(true)
		})

		o("permission not given, and denied by user", async function () {
			when(mobileSystemFacade.hasPermission(PermissionType.Camera)).thenResolve(false)
			when(mobileSystemFacade.requestPermission(PermissionType.Camera)).thenReject(new Error("error"))

			const success = await keyVerificationModel.requestCameraPermission()

			verify(mobileSystemFacade.requestPermission(PermissionType.Camera))
			o(success).equals(false)
		})
	})

	o.spec("test validateQrCodeAddress()", function () {
		o("success", async function () {
			const qrCode: QRCode = object()
			let result: IdentityKeyQrVerificationResult
			const trustDBEntry: TrustDBEntry = {
				publicIdentityKey: object(),
				sourceOfTrust: object(),
			}
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(trustDBEntry)
			when(keyVerificationFacade.calculateFingerprint(matchers.anything())).thenReturn("aabbccdd")

			qrCode.data = `{"mailAddress": "alice@tuta.com", "fingerprint": "aabbccdd"}`

			result = await keyVerificationModel.validateQrCodeAddress(qrCode)

			o(result).equals(IdentityKeyQrVerificationResult.QR_OK)
			o(keyVerificationModel.getKeyVerificationResult()).equals(IdentityKeyQrVerificationResult.QR_OK)
			verify(
				publicIdentityKeyProvider.loadPublicIdentityKey({
					identifier: "alice@tuta.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			)
			verify(keyVerificationFacade.calculateFingerprint(trustDBEntry.publicIdentityKey))
		})

		o("malformed JSON payload", async function () {
			const qrCode: QRCode = object()
			qrCode.data = "this is no json"

			const result = await keyVerificationModel.validateQrCodeAddress(qrCode)
			o(result).equals(IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD)
		})

		o("valid JSON payload with missing properties", async function () {
			const qrCode: QRCode = object()
			let result: IdentityKeyQrVerificationResult

			qrCode.data = `{"mailAddress": "alice@tuta.com"}`
			result = await keyVerificationModel.validateQrCodeAddress(qrCode)
			o(result).equals(IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD)

			qrCode.data = `{"fingerprint": "aabbccdd"}`
			result = await keyVerificationModel.validateQrCodeAddress(qrCode)
			o(result).equals(IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD)
		})

		o("no identity key for mail address", async function () {
			const qrCode: QRCode = object()
			let result: IdentityKeyQrVerificationResult
			const publicIdentityKey: Versioned<SigningPublicKey> = object()
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(null)

			qrCode.data = `{"mailAddress": "alice@tuta.com", "fingerprint": "aabbccdd"}`

			result = await keyVerificationModel.validateQrCodeAddress(qrCode)

			o(result).equals(IdentityKeyQrVerificationResult.QR_MAIL_ADDRESS_NOT_FOUND)
			o(keyVerificationModel.getKeyVerificationResult()).equals(IdentityKeyQrVerificationResult.QR_MAIL_ADDRESS_NOT_FOUND)
			verify(
				publicIdentityKeyProvider.loadPublicIdentityKey({
					identifier: "alice@tuta.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			)
			verify(keyVerificationFacade.calculateFingerprint(matchers.anything()), { times: 0 })
		})

		o("fingerprint mismatch", async function () {
			const qrCode: QRCode = object()
			let result: IdentityKeyQrVerificationResult
			const trustDBEntry: TrustDBEntry = {
				publicIdentityKey: object(),
				sourceOfTrust: object(),
			}
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(trustDBEntry)
			when(keyVerificationFacade.calculateFingerprint(matchers.anything())).thenReturn("another fingerprint")

			qrCode.data = `{"mailAddress": "alice@tuta.com", "fingerprint": "aabbccdd"}`

			result = await keyVerificationModel.validateQrCodeAddress(qrCode)

			o(result).equals(IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH)
			o(keyVerificationModel.getKeyVerificationResult()).equals(IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH)
			verify(
				publicIdentityKeyProvider.loadPublicIdentityKey({
					identifier: "alice@tuta.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}),
			)
			verify(keyVerificationFacade.calculateFingerprint(trustDBEntry.publicIdentityKey))
		})
	})
})

import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { assertNotNull, Hex, Versioned } from "@tutao/tutanota-utils"
import {
	IdentityKeyVerificationMethod,
	IdentityKeyQrVerificationResult,
	IdentityKeySourceOfTrust,
	PublicKeyIdentifierType,
} from "../../api/common/TutanotaConstants"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { KeyVerificationScanCompleteMetric, KeyVerificationUsageTestUtils } from "./KeyVerificationUsageTestUtils"
import { PublicKeyProvider } from "../../api/worker/facades/PublicKeyProvider"
import { SigningPublicKey } from "../../api/worker/facades/Ed25519Facade"
import { KeyVerificationQrPayload } from "./KeyVerificationQrPayload"
import { QRCode } from "jsqr"
import { PermissionType } from "../../native/common/generatedipc/PermissionType"

export type PublicIdentity = {
	fingerprint: Hex
	mailAddress: string
	key: Versioned<SigningPublicKey>
}

/**
 * This model tracks state across multiple pages in the key verification dialog.
 */
export class KeyVerificationModel {
	private publicIdentityKey: PublicIdentity | null = null

	// Tracking the wizard state
	mailAddressInput: string = ""
	private result: IdentityKeyQrVerificationResult | null = null

	// Relevant for the regret usage test only. Can be removed after testing is done.
	private chosenMethod: IdentityKeyVerificationMethod | null = null

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly test: KeyVerificationUsageTestUtils,
		private readonly publicKeyProvider: PublicKeyProvider,
	) {}

	private reset() {
		this.publicIdentityKey = null
		this.result = null
		this.mailAddressInput = ""
	}

	private setKeyVerificationResult(resultType: IdentityKeyQrVerificationResult): IdentityKeyQrVerificationResult {
		this.result = resultType
		return this.result
	}

	public async validateQrCodeAddress(qrCode: QRCode): Promise<IdentityKeyQrVerificationResult> {
		try {
			const payload: KeyVerificationQrPayload = JSON.parse(qrCode.data) as KeyVerificationQrPayload
			if (payload.mailAddress == null || payload.fingerprint == null) {
				return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD)
			}

			const identityKey = await this.loadIdentityKeyForMailAddress(payload.mailAddress)

			if (identityKey) {
				if (identityKey.fingerprint === payload.fingerprint) {
					// MalformedQrPayloadError: malformed payload
					return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_OK)
				} else {
					return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH)
				}
			} else {
				return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_MAIL_ADDRESS_NOT_FOUND)
			}
		} catch (e) {
			if (e instanceof SyntaxError) {
				// SyntaxError: JSON.parse failed
				return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD)
			} else {
				throw e
			}
		} finally {
			if (this.result === IdentityKeyQrVerificationResult.QR_OK) {
				await this.test.scan_complete(IdentityKeyVerificationMethod.qr, KeyVerificationScanCompleteMetric.Success)
			} else {
				await this.test.scan_complete(IdentityKeyVerificationMethod.qr, KeyVerificationScanCompleteMetric.Failure)
			}
		}
	}

	getPublicIdentity(): PublicIdentity | null {
		return this.publicIdentityKey
	}

	async loadIdentityKeyForMailAddress(mailAddress: string): Promise<PublicIdentity | null> {
		const identityKey = await this.publicKeyProvider.loadPublicIdentityKey({
			identifier: mailAddress,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		})
		if (identityKey === null) {
			this.publicIdentityKey = null
		} else {
			this.publicIdentityKey = {
				fingerprint: await this.keyVerificationFacade.calculateFingerprint(identityKey),
				key: identityKey,
				mailAddress: mailAddress,
			}
		}
		return this.publicIdentityKey
	}

	public async trust(method: IdentityKeyVerificationMethod) {
		const identityKey = assertNotNull(this.publicIdentityKey)
		await this.keyVerificationFacade.trust(identityKey.mailAddress, identityKey.key, IdentityKeySourceOfTrust.Manual)
		await this.test.verified(method)
	}

	public async handleMethodSwitch(newMethod: IdentityKeyVerificationMethod) {
		if (this.chosenMethod != null && this.chosenMethod !== newMethod) {
			// user regrets their previous choice
			await this.test.regret()
		}
		this.reset()
		await this.test.start(newMethod)
		this.chosenMethod = newMethod
	}

	public getChosenMethod(): IdentityKeyVerificationMethod | null {
		return this.chosenMethod
	}

	public getKeyVerificationResult(): IdentityKeyQrVerificationResult | null {
		return this.result
	}

	public async requestCameraPermission(): Promise<boolean> {
		const hasPermission = await this.mobileSystemFacade.hasPermission(PermissionType.Camera)
		if (hasPermission) {
			return true
		} else {
			try {
				await this.mobileSystemFacade.requestPermission(PermissionType.Camera)
				return true
			} catch (e) {
				return false
			}
		}
	}
}

import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { assertNotNull, Hex } from "@tutao/tutanota-utils"
import {
	IdentityKeyQrVerificationResult,
	IdentityKeySourceOfTrust,
	IdentityKeyVerificationMethod,
	PublicKeyIdentifierType,
} from "../../api/common/TutanotaConstants"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { KeyVerificationScanCompleteMetric, KeyVerificationUsageTestUtils } from "./KeyVerificationUsageTestUtils"
import { KeyVerificationQrPayload } from "./KeyVerificationQrPayload"
import { QRCode } from "jsqr"
import { PermissionType } from "../../native/common/generatedipc/PermissionType"
import { PublicIdentityKeyProvider } from "../../api/worker/facades/PublicIdentityKeyProvider"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { TrustDBEntry } from "../../api/worker/facades/IdentityKeyTrustDatabase"

export type PublicIdentity = {
	fingerprint: Hex
	mailAddress: string
	trustDbEntry: TrustDBEntry
}

/**
 * This model tracks state across multiple pages in the key verification dialog (when comparing identity key fingerprints).
 */
export class KeyVerificationModel {
	private publicIdentityKey: PublicIdentity | null = null

	// Tracking the wizard state
	mailAddressInput: string = ""
	fingerprintFromQrCode: string = ""
	private result: IdentityKeyQrVerificationResult | null = null

	// Relevant for the regret usage test only. Can be removed after testing is done.
	private chosenMethod: IdentityKeyVerificationMethod | null = null

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly test: KeyVerificationUsageTestUtils,
		private readonly publicIdentityKeyProvider: PublicIdentityKeyProvider,
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
			this.fingerprintFromQrCode = payload.fingerprint

			const cleanMailAddress = getCleanedMailAddress(payload.mailAddress)
			if (cleanMailAddress == null) {
				return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD)
			}

			const identityKey = await this.loadIdentityKeyForMailAddress(cleanMailAddress)

			if (identityKey) {
				return this.compareFingerprint()
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

	compareFingerprint() {
		if (assertNotNull(this.publicIdentityKey).fingerprint === this.fingerprintFromQrCode) {
			return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_OK)
		} else {
			return this.setKeyVerificationResult(IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH)
		}
	}

	getPublicIdentity(): PublicIdentity | null {
		return this.publicIdentityKey
	}

	async loadIdentityKeyForMailAddress(mailAddress: string): Promise<PublicIdentity | null> {
		const identityKey = await this.publicIdentityKeyProvider.loadPublicIdentityKey({
			identifier: mailAddress,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		})
		if (identityKey == null) {
			this.publicIdentityKey = null
		} else if (identityKey.sourceOfTrust === IdentityKeySourceOfTrust.Not_Supported) {
			throw new ProgrammingError("No access to trust database")
		} else {
			this.publicIdentityKey = {
				fingerprint: await this.keyVerificationFacade.calculateFingerprint(identityKey.publicIdentityKey),
				trustDbEntry: identityKey,
				mailAddress: mailAddress,
			}
		}
		return this.publicIdentityKey
	}

	public async trust(method: IdentityKeyVerificationMethod) {
		const identityKey = assertNotNull(this.publicIdentityKey)
		await this.keyVerificationFacade.trust(identityKey.mailAddress, identityKey.trustDbEntry.publicIdentityKey, IdentityKeySourceOfTrust.Manual)
		await this.test.verified(method)
	}

	async deleteAndReloadTrustedKey() {
		const identityKey = assertNotNull(this.publicIdentityKey)
		await this.keyVerificationFacade.untrust(identityKey.mailAddress)
		await this.loadIdentityKeyForMailAddress(identityKey.mailAddress)
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

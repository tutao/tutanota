import { EntityClient } from "../../../api/common/EntityClient.js"
import { createSecondFactor, GroupInfoTypeRef, U2fRegisteredDevice, User } from "../../../api/entities/sys/TypeRefs.js"
import { validateWebauthnDisplayName, WebauthnClient } from "../../../misc/2fa/webauthn/WebauthnClient.js"
import { TotpSecret } from "@tutao/tutanota-crypto"
import { assertNotNull, LazyLoaded, neverNull } from "@tutao/tutanota-utils"
import { isApp } from "../../../api/common/Env.js"
import { htmlSanitizer } from "../../../misc/HtmlSanitizer.js"
import { LanguageViewModel, TranslationKey } from "../../../misc/LanguageViewModel.js"
import { SecondFactorType } from "../../../api/common/TutanotaConstants.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import QRCode from "qrcode-svg"
import { LoginFacade } from "../../../api/worker/facades/LoginFacade.js"
import { UserError } from "../../../api/main/UserError.js"

export const enum VerificationStatus {
	Initial = "Initial",
	Progress = "Progress",
	Failed = "Failed",
	Success = "Success",
}

export const DEFAULT_U2F_NAME = "U2F"
export const DEFAULT_TOTP_NAME = "TOTP"

export enum NameValidationStatus {
	Valid,
	Invalid,
}

export const SecondFactorTypeToNameTextId: Record<SecondFactorType, TranslationKey> = Object.freeze({
	[SecondFactorType.totp]: "totpAuthenticator_label",
	[SecondFactorType.u2f]: "u2fSecurityKey_label",
	[SecondFactorType.webauthn]: "u2fSecurityKey_label",
})

export class SecondFactorEditModel {
	totpCode: string = ""
	selectedType: SecondFactorType
	name: string = ""
	nameValidationStatus: NameValidationStatus = NameValidationStatus.Valid
	verificationStatus: VerificationStatus = VerificationStatus.Initial
	readonly otpInfo: LazyLoaded<{
		qrCodeSvg: string | null
		url: string
	}>
	private u2fRegistrationData: U2fRegisteredDevice | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly user: User,
		private readonly mailAddress: string,
		private readonly webauthnClient: WebauthnClient,
		readonly totpKeys: TotpSecret,
		private readonly webauthnSupported: boolean,
		private readonly lang: LanguageViewModel,
		private readonly loginFacade: LoginFacade,
		private readonly hostname: string,
		private readonly domainConfig: DomainConfig,
		private readonly updateViewCallback: () => void,
	) {
		this.selectedType = webauthnSupported ? SecondFactorType.webauthn : SecondFactorType.totp
		this.setDefaultNameIfNeeded()
		this.otpInfo = new LazyLoaded(async () => {
			const url = await this.getOtpAuthUrl(this.totpKeys.readableKey)
			let totpQRCodeSvg

			if (!isApp()) {
				let qrcodeGenerator = new QRCode({
					height: 150,
					width: 150,
					content: url,
					padding: 2,
					// We don't want <xml> around the content, we actually enforce <svg> namespace, and we want it to be parsed as such.
					xmlDeclaration: false,
				})
				totpQRCodeSvg = htmlSanitizer.sanitizeSVG(qrcodeGenerator.svg()).html
			} else {
				totpQRCodeSvg = null
			}

			return {
				qrCodeSvg: totpQRCodeSvg,
				url,
			}
		})

		this.otpInfo.getAsync().then(() => this.updateViewCallback())
	}

	/**
	 * if the user cancels the second factor creation while it's already talking to webAuthn, we want to cancel that
	 * process before closing the dialog.
	 */
	abort() {
		// noinspection JSIgnoredPromiseFromCall
		this.webauthnClient.abortCurrentOperation()
	}

	/**
	 * validation message for use in dialog validators
	 */
	validationMessage(): TranslationKey | null {
		return this.nameValidationStatus === NameValidationStatus.Valid ? null : "textTooLong_msg"
	}

	/**
	 * get a list of supported second factor types
	 */
	getFactorTypesOptions(): Array<SecondFactorType> {
		const options: Array<SecondFactorType> = []
		options.push(SecondFactorType.totp)

		if (this.webauthnSupported) {
			options.push(SecondFactorType.webauthn)
		}
		return options
	}

	/**
	 * call when the selected second factor type changes
	 */
	onTypeSelected(newValue: SecondFactorType) {
		this.selectedType = newValue
		this.verificationStatus = newValue === SecondFactorType.webauthn ? VerificationStatus.Initial : VerificationStatus.Progress

		this.setDefaultNameIfNeeded()
		this.updateNameValidation()

		if (newValue !== SecondFactorType.webauthn) {
			// noinspection JSIgnoredPromiseFromCall
			this.webauthnClient.abortCurrentOperation()
		}
	}

	/**
	 * call when the display name of the second factor instance changes
	 */
	onNameChange(newValue: string): void {
		this.name = newValue
		this.updateNameValidation()
	}

	/**
	 * call when the validation code for setting up TOTP changes
	 */
	async onTotpValueChange(newValue: string) {
		this.totpCode = newValue
		let cleanedValue = newValue.replace(/ /g, "")

		if (cleanedValue.length === 6) {
			const expectedCode = Number(cleanedValue)
			this.verificationStatus = await this.tryCodes(expectedCode, this.totpKeys.key)
		} else {
			this.verificationStatus = VerificationStatus.Progress
		}
		this.updateViewCallback()
	}

	/**
	 * re-validates the input and makes the server calls to actually create a second factor
	 * returns the user that the second factor was created in case any follow-up operations
	 * are needed
	 */
	async save(): Promise<User | null> {
		this.setDefaultNameIfNeeded()
		if (this.selectedType === SecondFactorType.webauthn) {
			// Prevent starting in parallel
			if (this.verificationStatus === VerificationStatus.Progress) {
				return null
			}

			try {
				this.u2fRegistrationData = await this.webauthnClient.register(this.user._id, this.name)
				this.verificationStatus = VerificationStatus.Success
			} catch (e) {
				console.log("Webauthn registration failed: ", e)
				this.u2fRegistrationData = null
				this.verificationStatus = VerificationStatus.Failed
				return null
			}
		}

		this.updateViewCallback()

		if (this.selectedType === SecondFactorType.u2f) {
			throw new ProgrammingError(`invalid factor type: ${this.selectedType}`)
		}

		const sf = createSecondFactor({
			_ownerGroup: this.user._ownerGroup!,
			name: this.name,
			type: this.selectedType,
			otpSecret: null,
			u2f: null,
		})

		if (this.selectedType === SecondFactorType.webauthn) {
			if (this.verificationStatus !== VerificationStatus.Success) {
				throw new UserError("unrecognizedU2fDevice_msg")
			} else {
				sf.u2f = this.u2fRegistrationData
			}
		} else if (this.selectedType === SecondFactorType.totp) {
			if (this.verificationStatus === VerificationStatus.Failed) {
				throw new UserError("totpCodeWrong_msg")
			} else if (this.verificationStatus === VerificationStatus.Initial || this.verificationStatus === VerificationStatus.Progress) {
				throw new UserError("totpCodeEnter_msg")
			} else {
				sf.otpSecret = this.totpKeys.key
			}
		}
		await this.entityClient.setup(assertNotNull(this.user.auth).secondFactors, sf)
		return this.user
	}

	/** see https://github.com/google/google-authenticator/wiki/Key-Uri-Format */
	private async getOtpAuthUrl(secret: string): Promise<string> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.user.userGroup.groupInfo)
		const issuer = this.domainConfig.firstPartyDomain ? "Tutanota" : this.hostname
		const account = encodeURI(issuer + ":" + neverNull(userGroupInfo.mailAddress))
		const url = new URL("otpauth://totp/" + account)
		url.searchParams.set("issuer", issuer)
		url.searchParams.set("secret", secret.replace(/ /g, ""))
		url.searchParams.set("algorithm", "SHA1")
		url.searchParams.set("digits", "6")
		url.searchParams.set("period", "30")
		return url.toString()
	}

	/**
	 * re-check if the given display name is valid for the current second factor type
	 */
	private updateNameValidation(): void {
		this.nameValidationStatus =
			this.selectedType !== SecondFactorType.webauthn || validateWebauthnDisplayName(this.name)
				? NameValidationStatus.Valid
				: NameValidationStatus.Invalid
	}

	/**
	 * empty names sometimes lead to errors, so we make sure we have something semi-sensible set in the field.
	 */
	private setDefaultNameIfNeeded() {
		const trimmed = this.name.trim()
		if (this.selectedType === SecondFactorType.webauthn && (trimmed === DEFAULT_TOTP_NAME || trimmed.length === 0)) {
			this.name = DEFAULT_U2F_NAME
		} else if (this.selectedType === SecondFactorType.totp && (trimmed === DEFAULT_U2F_NAME || trimmed.length === 0)) {
			this.name = DEFAULT_TOTP_NAME
		}
	}

	/**
	 * check if the given validation code is the current, next or last code for the TOTP
	 */
	private async tryCodes(expectedCode: number, key: Uint8Array): Promise<VerificationStatus> {
		const time = Math.floor(new Date().getTime() / 1000 / 30)
		// We try out 3 codes: current minute, 30 seconds before and 30 seconds after.
		// If at least one of them works, we accept it.
		const number = await this.loginFacade.generateTotpCode(time, key)

		if (number === expectedCode) {
			return VerificationStatus.Success
		}

		const number2 = await this.loginFacade.generateTotpCode(time - 1, key)

		if (number2 === expectedCode) {
			return VerificationStatus.Success
		}

		const number3 = await this.loginFacade.generateTotpCode(time + 1, key)

		if (number3 === expectedCode) {
			return VerificationStatus.Success
		}

		return VerificationStatus.Failed
	}
}

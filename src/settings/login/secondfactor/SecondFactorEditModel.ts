import {EntityClient} from "../../../api/common/EntityClient.js"
import {createSecondFactor, GroupInfoTypeRef, U2fRegisteredDevice, User} from "../../../api/entities/sys/TypeRefs.js"
import {validateWebauthnDisplayName, WebauthnClient} from "../../../misc/2fa/webauthn/WebauthnClient.js"
import {TotpSecret} from "@tutao/tutanota-crypto"
import {assertNotNull, LazyLoaded, neverNull, noOp} from "@tutao/tutanota-utils"
import {isApp, isTutanotaDomain} from "../../../api/common/Env.js"
import {htmlSanitizer} from "../../../misc/HtmlSanitizer.js"
import {Dialog} from "../../../gui/base/Dialog.js"
import {lang, TranslationKey} from "../../../misc/LanguageViewModel.js"
import {SecondFactorType} from "../../../api/common/TutanotaConstants.js"
import {ProgrammingError} from "../../../api/common/error/ProgrammingError.js"
import {showProgressDialog} from "../../../gui/dialogs/ProgressDialog.js"
import QRCode from "qrcode-svg"
import {SelectorItem} from "../../../gui/base/DropDownSelector.js"
import {locator} from "../../../api/main/MainLocator.js"

export const enum VerificationStatus {
	Initial = "Initial",
	Progress = "Progress",
	Failed = "Failed",
	Success = "Success",
}

const DEFAULT_U2F_NAME = "U2F"
const DEFAULT_TOTP_NAME = "TOTP"

export enum NameValidationStatus {
	Valid,
	Invalid
}

/** Enum with user-visible types because we don't allow adding SecondFactorType.u2f anymore */
export const FactorTypes = {
	WEBAUTHN: SecondFactorType.webauthn,
	TOTP: SecondFactorType.totp,
} as const

export type FactorTypesEnum = Values<typeof FactorTypes>

export class SecondFactorEditModel {
	totpCode: string = ""
	selectedType: FactorTypesEnum
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
		private readonly updateViewCallback: () => void = noOp
	) {
		this.selectedType = webauthnSupported ? FactorTypes.WEBAUTHN : FactorTypes.TOTP
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
					// We don't want <xml> around the content, we actually enforce <svg> namespace and we want it to be parsed as such.
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

	abort() {
		// noinspection JSIgnoredPromiseFromCall
		this.webauthnClient.abortCurrentOperation()
	}

	validator() {
		return () => this.updateNameValidation()
	}

	validationMessage(): TranslationKey | null {
		return this.nameValidationStatus === NameValidationStatus.Valid
			? null
			: "textTooLong_msg"
	}

	getFactorTypesOptions() {
		const options: Array<SelectorItem<FactorTypesEnum>> = []
		options.push({
			name: lang.get("totpAuthenticator_label"),
			value: FactorTypes.TOTP,
		})

		if (this.webauthnSupported) {
			options.push({
				name: lang.get("u2fSecurityKey_label"),
				value: FactorTypes.WEBAUTHN,
			})
		}
		return options
	}

	onTypeSelected(newValue: FactorTypesEnum) {
		this.selectedType = newValue
		this.verificationStatus = newValue === FactorTypes.WEBAUTHN
			? VerificationStatus.Initial
			: VerificationStatus.Progress

		this.updateNameValidation()
		this.setDefaultNameIfNeeded()

		if (newValue !== FactorTypes.WEBAUTHN) {
			// noinspection JSIgnoredPromiseFromCall
			this.webauthnClient.abortCurrentOperation()
		}
	}

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
	}

	/**
	 * validates the input and makes the server calls to actually create a second factor
	 * if the validation passes.
	 */
	async save(callback: (user: User) => void): Promise<void> {
		this.setDefaultNameIfNeeded()
		if (this.selectedType === FactorTypes.WEBAUTHN) {
			// Prevent starting in parallel
			if (this.verificationStatus === VerificationStatus.Progress) {
				return
			}

			try {
				this.u2fRegistrationData = await this.webauthnClient.register(this.user._id, this.name)
				this.verificationStatus = VerificationStatus.Success
			} catch (e) {
				console.log("Webauthn registration failed: ", e)
				this.u2fRegistrationData = null
				this.verificationStatus = VerificationStatus.Failed
			}
		}

		this.updateViewCallback()
		const sf = createSecondFactor({
			_ownerGroup: this.user._ownerGroup,
			name: this.name,
		})

		if (this.selectedType === FactorTypes.WEBAUTHN) {
			sf.type = SecondFactorType.webauthn

			if (this.verificationStatus !== VerificationStatus.Success) {
				// noinspection ES6MissingAwait
				Dialog.message("unrecognizedU2fDevice_msg")
				return
			} else {
				sf.u2f = this.u2fRegistrationData
			}
		} else if (this.selectedType === FactorTypes.TOTP) {
			sf.type = SecondFactorType.totp

			if (this.verificationStatus !== VerificationStatus.Success) {
				// noinspection ES6MissingAwait
				Dialog.message("totpCodeEnter_msg")
				return
			} else {
				sf.otpSecret = this.totpKeys.key
			}
		} else {
			throw new ProgrammingError("")
		}

		await showProgressDialog("pleaseWait_msg", this.entityClient.setup(assertNotNull(this.user.auth).secondFactors, sf))
		callback(this.user)
	}

	/** see https://github.com/google/google-authenticator/wiki/Key-Uri-Format */
	private async getOtpAuthUrl(secret: string): Promise<string> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.user.userGroup.groupInfo)
		const issuer = isTutanotaDomain() ? "Tutanota" : location.hostname
		const account = encodeURI(issuer + ":" + neverNull(userGroupInfo.mailAddress))
		const url = new URL("otpauth://totp/" + account)
		url.searchParams.set("issuer", issuer)
		url.searchParams.set("secret", secret.replace(/ /g, ""))
		url.searchParams.set("algorithm", "SHA1")
		url.searchParams.set("digits", "6")
		url.searchParams.set("period", "30")
		return url.toString()
	}

	private updateNameValidation(): void {
		this.nameValidationStatus = this.selectedType !== SecondFactorType.webauthn || validateWebauthnDisplayName(this.name)
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

	private async tryCodes(expectedCode: number, key: Uint8Array): Promise<VerificationStatus> {
		const {loginFacade} = locator
		const time = Math.floor(new Date().getTime() / 1000 / 30)
		// We try out 3 codes: current minute, 30 seconds before and 30 seconds after.
		// If at least one of them works, we accept it.
		const number = await loginFacade.generateTotpCode(time, key)

		if (number === expectedCode) {
			return VerificationStatus.Success
		}

		const number2 = await loginFacade.generateTotpCode(time - 1, key)

		if (number2 === expectedCode) {
			return VerificationStatus.Success
		}

		const number3 = await loginFacade.generateTotpCode(time + 1, key)

		if (number3 === expectedCode) {
			return VerificationStatus.Success
		}

		return VerificationStatus.Failed
	}

}

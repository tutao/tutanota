import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import stream from "mithril/stream/stream.js"
import {GroupType, SecondFactorType} from "../api/common/TutanotaConstants"
import type {DropDownSelectorAttrs, SelectorItem} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {isApp, isTutanotaDomain} from "../api/common/Env"
import m, {Children} from "mithril"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {copyToClipboard} from "../misc/ClipboardUtils"
import {Icons} from "../gui/base/icons/Icons"
import QRCode from "qrcode"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {Icon, progressIcon} from "../gui/base/Icon"
import {theme} from "../gui/theme"
import {createSecondFactor} from "../api/entities/sys/SecondFactor"
import {assertNotNull, LazyLoaded, neverNull} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"
import type {User} from "../api/entities/sys/User"
import {getEtId, isSameId} from "../api/common/utils/EntityUtils"
import {logins} from "../api/main/LoginController"
import * as RecoverCodeDialog from "./RecoverCodeDialog"
import {WebauthnClient} from "../misc/2fa/webauthn/WebauthnClient"
import type {U2fRegisteredDevice} from "../api/entities/sys/U2fRegisteredDevice"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {EntityClient} from "../api/common/EntityClient"
import {ProgrammingError} from "../api/common/error/ProgrammingError"
import type {TotpSecret} from "@tutao/tutanota-crypto"

const enum VerificationStatus {
	Initial= "Initial",
	Progress = "Progress",
	Failed = "Failed",
	Success = "Success",
}

/** Enum with user-visible types because we don't allow adding SecondFactorType.u2f anymore */
const enum FactorTypes {
	WEBAUTHN= "WEBAUTHN",
	TOTP = "TOTP",
}

export class EditSecondFactorDialog {
	_dialog: Dialog
	_selectedType: FactorTypes
	_verificationStatus: VerificationStatus
	_u2fRegistrationData: U2fRegisteredDevice | null
	_name: string = ""
	_totpCode: string = ""
	_entityClient: EntityClient
	_user: User
	_mailAddress: string
	_webauthnSupport: boolean
	_totpKeys: TotpSecret
	_otpInfo: LazyLoaded<{
		qrCodeSvg: string | null
		url: string
	}>
	_webauthnAbortController: AbortController | null

	constructor(entityClient: EntityClient, user: User, mailAddress: string, webauthnSupport: boolean, totpKeys: TotpSecret) {
		this._entityClient = entityClient
		this._user = user
		this._mailAddress = mailAddress
		this._webauthnSupport = webauthnSupport
		this._totpKeys = totpKeys
		this._selectedType = webauthnSupport ? FactorTypes.WEBAUTHN : FactorTypes.TOTP
		this._otpInfo = new LazyLoaded(async () => {
			const url = await this._getOtpAuthUrl(this._totpKeys.readableKey)
			let totpQRCodeSvg

			if (!isApp()) {
				let qrcodeGenerator = new QRCode({
					height: 150,
					width: 150,
					content: url,
				})
				totpQRCodeSvg = htmlSanitizer.sanitize(qrcodeGenerator.svg(), {
					blockExternalContent: false,
				}).text
			} else {
				totpQRCodeSvg = null
			}

			return {
				qrCodeSvg: totpQRCodeSvg,
				url,
			}
		})

		this._otpInfo.getAsync().then(() => m.redraw())

		this._dialog = Dialog.createActionDialog({
			title: lang.get("add_action"),
			allowOkWithReturn: true,
			child: {
				view: () => this._render(),
			},
			okAction: () => this._save(),
			allowCancel: true,
			okActionTextId: "save_action",
			cancelAction: () => this._webauthnAbortController?.abort(),
		})
	}

	async _save() {
		if (this._selectedType === FactorTypes.WEBAUTHN) {
			// Prevent starting in parallel
			if (this._verificationStatus === VerificationStatus.Progress) {
				return
			}

			this._verificationStatus = VerificationStatus.Progress
			this._webauthnAbortController = new AbortController()
			const abortSignal = this._webauthnAbortController.signal

			try {
				this._u2fRegistrationData = await new WebauthnClient().register(this._user._id, this._name, this._mailAddress, abortSignal)
				this._verificationStatus = VerificationStatus.Success
			} catch (e) {
				console.log("Webauthn registration failed: ", e)
				this._u2fRegistrationData = null
				this._verificationStatus = VerificationStatus.Failed
			} finally {
				this._webauthnAbortController = null
			}
		}

		m.redraw()
		const sf = createSecondFactor({
			_ownerGroup: this._user._ownerGroup,
			name: this._name,
		})

		if (this._selectedType === FactorTypes.WEBAUTHN) {
			sf.type = SecondFactorType.webauthn

			if (this._verificationStatus !== VerificationStatus.Success) {
				Dialog.message("unrecognizedU2fDevice_msg")
				return
			} else {
				sf.u2f = this._u2fRegistrationData
			}
		} else if (this._selectedType === FactorTypes.TOTP) {
			sf.type = SecondFactorType.totp

			if (this._verificationStatus !== VerificationStatus.Success) {
				Dialog.message("totpCodeEnter_msg")
				return
			} else {
				sf.otpSecret = this._totpKeys.key
			}
		} else {
			throw new ProgrammingError("")
		}

		await showProgressDialog("pleaseWait_msg", this._entityClient.setup(assertNotNull(this._user.auth).secondFactors, sf))

		this._dialog.close()

		this._showRecoveryInfoDialog(this._user)
	}

	_render(): Children {
		const options: Array<SelectorItem<FactorTypes>> = []
		options.push({
			name: lang.get("totpAuthenticator_label"),
			value: FactorTypes.TOTP,
		})

		if (this._webauthnSupport) {
			options.push({
				name: lang.get("u2fSecurityKey_label"),
				value: FactorTypes.WEBAUTHN,
			})
		}

		const typeDropdownAttrs: DropDownSelectorAttrs<FactorTypes> = {
			label: "type_label",
			selectedValue: stream(this._selectedType),
			selectionChangedHandler: newValue => this._onTypeSelected(newValue),
			items: options,
			dropdownWidth: 300,
		}
		const nameFieldAttrs: TextFieldAttrs = {
			label: "name_label",
			helpLabel: () => lang.get("secondFactorNameInfo_msg"),
			value: stream(this._name),
			oninput: value => {
				this._name = value
			},
		}
		return [m(DropDownSelectorN, typeDropdownAttrs), m(TextFieldN, nameFieldAttrs), this._renderTypeSpecificFields()]
	}

	_renderTypeSpecificFields(): Children {
		switch (this._selectedType) {
			case FactorTypes.TOTP:
				return this._renderOtpFields()

			case FactorTypes.WEBAUTHN:
				return this._renderU2FFields()

			default:
				throw new ProgrammingError(`Invalid 2fa type: ${this._selectedType}`)
		}
	}

	_renderU2FFields(): Children {
		// Only show progress for u2f because success/error will show another dialog
		if (this._verificationStatus !== VerificationStatus.Progress) {
			return null
		} else {
			return m("p.flex.items-center", [m(".mr-s", this._statusIcon()), m("", this._statusMessage())])
		}
	}

	_renderOtpFields(): Children {
		const totpSecretFieldAttrs: TextFieldAttrs = {
			label: "totpSecret_label",
			helpLabel: () => lang.get(isApp() ? "totpTransferSecretApp_msg" : "totpTransferSecret_msg"),
			value: stream(this._totpKeys.readableKey),
			injectionsRight: () => m(ButtonN, copyButtonAttrs),
			disabled: true,
		}
		const copyButtonAttrs: ButtonAttrs = {
			label: "copy_action",
			click: () => copyToClipboard(this._totpKeys.readableKey),
			icon: () => Icons.Clipboard,
		}
		const totpCodeAttrs: TextFieldAttrs = {
			label: "totpCode_label",
			value: stream(this._totpCode),
			oninput: newValue => this._onTotpValueChange(newValue),
		}
		const openTOTPAppAttrs: ButtonAttrs = {
			label: "addOpenOTPApp_action",
			click: () => this._openOtpLink(),
			type: ButtonType.Login,
		}
		return m(".mb", [
			m(TextFieldN, totpSecretFieldAttrs),
			isApp() ? m(".pt", m(ButtonN, openTOTPAppAttrs)) : this._renderOtpQrCode(),
			m(TextFieldN, totpCodeAttrs),
		])
	}

	_renderOtpQrCode(): Children {
		const otpInfo = this._otpInfo.getSync()

		if (otpInfo) {
			const qrCodeSvg = assertNotNull(otpInfo.qrCodeSvg)
			// sanitized above
			return m(".flex-center", m.trust(qrCodeSvg))
		} else {
			return null
		}
	}

	async _openOtpLink() {
		const {url} = await this._otpInfo.getAsync()
		const successful = await locator.systemApp.openLinkNative(url)

		if (!successful) {
			Dialog.message("noAppAvailable_msg")
		}
	}

	async _onTotpValueChange(newValue: string) {
		this._totpCode = newValue
		let cleanedValue = newValue.replace(/ /g, "")

		if (cleanedValue.length === 6) {
			const expectedCode = Number(cleanedValue)
			this._verificationStatus = await this._tryCodes(expectedCode, this._totpKeys.key)
		} else {
			this._verificationStatus = VerificationStatus.Progress
		}
	}

	_onTypeSelected(newValue: FactorTypes) {
		this._selectedType = newValue
		this._verificationStatus = newValue === FactorTypes.WEBAUTHN ? VerificationStatus.Initial : VerificationStatus.Progress

		if (newValue !== FactorTypes.WEBAUTHN) {
			this._webauthnAbortController?.abort()
		}
	}

	static async loadAndShow(entityClient: EntityClient, user: LazyLoaded<User>, mailAddress: string): Promise<void> {
		const webAuthn = new WebauthnClient()
		const totpPromise = locator.loginFacade.generateTotpSecret()
		const webAuthnPromise = webAuthn.isSupported()
		const userPromise = user.getAsync()
		showProgressDialog("pleaseWait_msg", Promise.all([totpPromise, webAuthnPromise, userPromise])).then(([totpKeys, u2fSupport, user]) => {
			new EditSecondFactorDialog(entityClient, user, mailAddress, u2fSupport, totpKeys)._dialog.show()
		})
	}

	_showRecoveryInfoDialog(user: User) {
		// We only show the recovery code if it is for the current user and it is a global admin
		if (!isSameId(getEtId(logins.getUserController().user), getEtId(user)) || !user.memberships.find(gm => gm.groupType === GroupType.Admin)) {
			return
		}

		const isRecoverCodeAvailable = user.auth && user.auth.recoverCode != null
		Dialog.showActionDialog({
			title: lang.get("recoveryCode_label"),
			type: DialogType.EditMedium,
			child: () => m(".pt", lang.get("recoveryCode_msg")),
			allowOkWithReturn: true,
			okAction: dialog => {
				dialog.close()
				RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification(isRecoverCodeAvailable ? "get" : "create", false)
			},
			okActionTextId: isRecoverCodeAvailable ? "show_action" : "setUp_action",
		})
	}

	async _tryCodes(expectedCode: number, key: Uint8Array): Promise<VerificationStatus> {
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

	/** see https://github.com/google/google-authenticator/wiki/Key-Uri-Format */
	async _getOtpAuthUrl(secret: string): Promise<string> {
		const userGroupInfo = await this._entityClient.load(GroupInfoTypeRef, this._user.userGroup.groupInfo)
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

	_statusIcon(): Children {
		switch (this._verificationStatus) {
			case VerificationStatus.Progress:
				return progressIcon()

			case VerificationStatus.Success:
				return m(Icon, {
					icon: Icons.Checkmark,
					large: true,
					style: {
						fill: theme.content_accent,
					},
				})

			case VerificationStatus.Failed:
				return m(Icon, {
					icon: Icons.Cancel,
					large: true,
					style: {
						fill: theme.content_accent,
					},
				})

			default:
				return null
		}
	}

	_statusMessage(): string {
		if (this._selectedType === SecondFactorType.webauthn) {
			return this._verificationStatus === VerificationStatus.Success ? lang.get("registeredU2fDevice_msg") : lang.get("registerU2fDevice_msg")
		} else {
			if (this._verificationStatus === VerificationStatus.Success) {
				return lang.get("totpCodeConfirmed_msg")
			} else if (this._verificationStatus === VerificationStatus.Failed) {
				return lang.get("totpCodeWrong_msg")
			} else {
				return lang.get("totpCodeEnter_msg")
			}
		}
	}
}

export const SecondFactorTypeToNameTextId: Record<SecondFactorType, TranslationKey> = Object.freeze({
	[SecondFactorType.totp]: "totpAuthenticator_label",
	[SecondFactorType.u2f]: "u2fSecurityKey_label",
	[SecondFactorType.webauthn]: "u2fSecurityKey_label",
})
import {showProgressDialog} from "../../../gui/dialogs/ProgressDialog.js"
import {GroupType, SecondFactorType} from "../../../api/common/TutanotaConstants.js"
import type {DropDownSelectorAttrs} from "../../../gui/base/DropDownSelector.js"
import {DropDownSelector} from "../../../gui/base/DropDownSelector.js"
import type {TranslationKey} from "../../../misc/LanguageViewModel.js"
import {lang} from "../../../misc/LanguageViewModel.js"
import type {TextFieldAttrs} from "../../../gui/base/TextField.js"
import {TextField} from "../../../gui/base/TextField.js"
import {isApp} from "../../../api/common/Env.js"
import m, {Children} from "mithril"
import {Button, ButtonType} from "../../../gui/base/Button.js"
import {copyToClipboard} from "../../../misc/ClipboardUtils.js"
import {Icons} from "../../../gui/base/icons/Icons.js"
import {Dialog, DialogType} from "../../../gui/base/Dialog.js"
import {Icon, progressIcon} from "../../../gui/base/Icon.js"
import {theme} from "../../../gui/theme.js"
import type {User} from "../../../api/entities/sys/TypeRefs.js"
import {assertNotNull, LazyLoaded} from "@tutao/tutanota-utils"
import {locator} from "../../../api/main/MainLocator.js"
import {getEtId, isSameId} from "../../../api/common/utils/EntityUtils.js"
import {logins} from "../../../api/main/LoginController.js"
import * as RecoverCodeDialog from "../RecoverCodeDialog.js"
import {EntityClient} from "../../../api/common/EntityClient.js"
import {ProgrammingError} from "../../../api/common/error/ProgrammingError.js"
import {IconButton, IconButtonAttrs} from "../../../gui/base/IconButton.js"
import {ButtonSize} from "../../../gui/base/ButtonSize.js"
import {FactorTypes, FactorTypesEnum, NameValidationStatus, SecondFactorEditModel, VerificationStatus} from "./SecondFactorEditModel.js"
import {UserError} from "../../../api/main/UserError.js"

export const SecondFactorTypeToNameTextId: Record<SecondFactorType, TranslationKey> = Object.freeze({
	[SecondFactorType.totp]: "totpAuthenticator_label",
	[SecondFactorType.u2f]: "u2fSecurityKey_label",
	[SecondFactorType.webauthn]: "u2fSecurityKey_label",
})

export class SecondFactorEditDialog {
	private readonly dialog: Dialog

	constructor(
		private readonly model: SecondFactorEditModel
	) {
		this.dialog = Dialog.createActionDialog({
			title: lang.get("add_action"),
			allowOkWithReturn: true,
			child: {
				view: () => this.render(),
			},
			okAction: () => showProgressDialog("pleaseWait_msg", this.okAction()),
			allowCancel: true,
			okActionTextId: "save_action",
			cancelAction: () => this.model.abort(),
			validator: () => this.model.validationMessage()
		})
	}

	async okAction(): Promise<void> {
		try {
			const user = await this.model.save()
			if (user != null) this.finalize(user)
		} catch (e) {
			if (e instanceof UserError) {
				// noinspection ES6MissingAwait
				Dialog.message(() => e.message)
			}
		}
	}

	finalize(user: User): void {
		this.dialog.close()
		SecondFactorEditDialog.showRecoveryInfoDialog(user)
	}

	static async loadAndShow(entityClient: EntityClient, lazyUser: LazyLoaded<User>, mailAddress: string): Promise<void> {
		const dialog: SecondFactorEditDialog = await showProgressDialog("pleaseWait_msg", this.loadWebauthnClient(entityClient, lazyUser, mailAddress))
		dialog.dialog.show()
	}

	private static showRecoveryInfoDialog(user: User) {
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
			okAction: (dialog: Dialog) => {
				dialog.close()
				RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification(isRecoverCodeAvailable ? "get" : "create", false)
			},
			okActionTextId: isRecoverCodeAvailable ? "show_action" : "setUp_action",
		})
	}

	private render(): Children {
		const options = this.model.getFactorTypesOptions()

		const typeDropdownAttrs: DropDownSelectorAttrs<FactorTypesEnum> = {
			label: "type_label",
			selectedValue: this.model.selectedType,
			selectionChangedHandler: newValue => this.model.onTypeSelected(newValue),
			items: options,
			dropdownWidth: 300,
		}
		const nameFieldAttrs: TextFieldAttrs = {
			label: "name_label",
			helpLabel: () => this.renderHelpLabel(),
			value: this.model.name,
			oninput: value => this.model.onNameChange(value),
		}
		return [m(DropDownSelector, typeDropdownAttrs), m(TextField, nameFieldAttrs), this.renderTypeSpecificFields()]
	}

	private renderHelpLabel(): Children {
		return this.model.nameValidationStatus === NameValidationStatus.Valid
			? m("", lang.get("secondFactorNameInfo_msg"))
			: m(".primary", lang.get("textTooLong_msg"))
	}

	private renderTypeSpecificFields(): Children {
		switch (this.model.selectedType) {
			case FactorTypes.TOTP:
				return this.renderOtpFields()

			case FactorTypes.WEBAUTHN:
				return this.renderU2FFields()

			default:
				throw new ProgrammingError(`Invalid 2fa type: ${this.model.selectedType}`)
		}
	}

	private renderU2FFields(): Children {
		// Only show progress for u2f because success/error will show another dialog
		return this.model.verificationStatus !== VerificationStatus.Progress
			? null
			: m("p.flex.items-center", [m(".mr-s", this.statusIcon()), m("", this.statusMessage())])
	}

	private renderOtpFields(): Children {
		const copyButtonAttrs: IconButtonAttrs = {
			title: "copy_action",
			click: () => copyToClipboard(this.model.totpKeys.readableKey),
			icon: Icons.Clipboard,
			size: ButtonSize.Compact,
		}
		return m(".mb", [
			m(TextField, {
				label: "totpSecret_label",
				helpLabel: () => lang.get(isApp() ? "totpTransferSecretApp_msg" : "totpTransferSecret_msg"),
				value: this.model.totpKeys.readableKey,
				injectionsRight: () => m(IconButton, copyButtonAttrs),
				disabled: true,
			}),
			isApp()
				? m(".pt", m(Button, {
					label: "addOpenOTPApp_action",
					click: () => this.openOtpLink(),
					type: ButtonType.Login,
				}))
				: this.renderOtpQrCode(),
			m(TextField, {
				label: "totpCode_label",
				value: this.model.totpCode,
				oninput: newValue => this.model.onTotpValueChange(newValue),
			}),
		])
	}

	private renderOtpQrCode(): Children {
		const otpInfo = this.model.otpInfo.getSync()

		if (otpInfo) {
			const qrCodeSvg = assertNotNull(otpInfo.qrCodeSvg)
			// sanitized in the model
			return m(".flex-center.pt-m", m.trust(qrCodeSvg))
		} else {
			return null
		}
	}

	private async openOtpLink() {
		const {url} = await this.model.otpInfo.getAsync()
		const successful = await locator.systemFacade.openLink(url)

		if (!successful) {
			// noinspection ES6MissingAwait
			Dialog.message("noAppAvailable_msg")
		}
	}

	private static async loadWebauthnClient(entityClient: EntityClient, lazyUser: LazyLoaded<User>, mailAddress: string): Promise<SecondFactorEditDialog> {
		const totpKeys = await locator.loginFacade.generateTotpSecret()
		const user = await lazyUser.getAsync()
		const webauthnSupported = await locator.webAuthn.isSupported()
		const model = new SecondFactorEditModel(
			entityClient,
			user,
			mailAddress,
			locator.webAuthn,
			totpKeys,
			webauthnSupported,
			lang,
			locator.loginFacade
		)
		return new SecondFactorEditDialog(model)
	}

	private statusIcon(): Children {
		switch (this.model.verificationStatus) {
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

	private statusMessage(): string {
		if (this.model.selectedType === SecondFactorType.webauthn) {
			return this.model.verificationStatus === VerificationStatus.Success
				? lang.get("registeredU2fDevice_msg")
				: lang.get("registerU2fDevice_msg")
		} else {
			if (this.model.verificationStatus === VerificationStatus.Success) {
				return lang.get("totpCodeConfirmed_msg")
			} else if (this.model.verificationStatus === VerificationStatus.Failed) {
				return lang.get("totpCodeWrong_msg")
			} else {
				return lang.get("totpCodeEnter_msg")
			}
		}
	}
}
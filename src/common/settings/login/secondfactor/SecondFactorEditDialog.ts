import { showProgressDialog } from "../../../gui/dialogs/ProgressDialog.js"
import { SecondFactorType } from "../../../api/common/TutanotaConstants.js"
import type { DropDownSelectorAttrs } from "../../../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../../../gui/base/DropDownSelector.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import type { TextFieldAttrs } from "../../../gui/base/TextField.js"
import { Autocomplete, TextField } from "../../../gui/base/TextField.js"
import { isApp } from "../../../api/common/Env.js"
import m, { Children } from "mithril"
import { copyToClipboard } from "../../../misc/ClipboardUtils.js"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { Dialog } from "../../../gui/base/Dialog.js"
import { Icon, IconSize, progressIcon } from "../../../gui/base/Icon.js"
import { theme } from "../../../gui/theme.js"
import type { User } from "../../../api/entities/sys/TypeRefs.js"
import { assertNotNull, LazyLoaded } from "@tutao/tutanota-utils"
import { locator } from "../../../api/main/CommonLocator.js"
import * as RecoverCodeDialog from "../RecoverCodeDialog.js"
import { EntityClient } from "../../../api/common/EntityClient.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { IconButton, IconButtonAttrs } from "../../../gui/base/IconButton.js"
import { ButtonSize } from "../../../gui/base/ButtonSize.js"
import { NameValidationStatus, SecondFactorEditModel, SecondFactorTypeToNameTextId, VerificationStatus } from "./SecondFactorEditModel.js"
import { UserError } from "../../../api/main/UserError.js"
import { LoginButton } from "../../../gui/base/buttons/LoginButton.js"
import { NotAuthorizedError } from "../../../api/common/error/RestError"

export interface SecondFactorEditDialogAttrs {
	allowCancel?: boolean
	onTokenExpired?: () => unknown
	onComplete?: () => unknown
}

export class SecondFactorEditDialog {
	private readonly dialog: Dialog

	constructor(
		private readonly model: SecondFactorEditModel,
		private readonly attrs?: SecondFactorEditDialogAttrs,
	) {
		this.dialog = Dialog.createActionDialog({
			title: "add_action",
			allowOkWithReturn: true,
			child: {
				view: () => this.render(),
			},
			okAction: async () => {
				await showProgressDialog("pleaseWait_msg", this.okAction())
				attrs?.onComplete?.()
			},
			allowCancel: attrs?.allowCancel ?? true,
			okActionTextId: "save_action",
			cancelAction: () => this.model.abort(),
			validator: () => this.model.validationMessage(),
		})
	}

	async okAction(): Promise<void> {
		if (!this.dialog.visible) {
			return
		}
		try {
			const user = await this.model.save()
			if (user != null) this.finalize(user)
		} catch (e) {
			if (e instanceof UserError) {
				// noinspection ES6MissingAwait
				Dialog.message(lang.makeTranslation("error_msg", e.message))
			} else if (e instanceof NotAuthorizedError) {
				this.dialog.close()
				if (this.attrs?.onTokenExpired) {
					this.attrs?.onTokenExpired()
				} else {
					Dialog.message("contactFormSubmitError_msg")
				}
				return
			} else {
				throw e
			}
		}
	}

	finalize(user: User): void {
		this.dialog.close()
		RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerificationAndInfoDialog(user)
	}

	static async loadAndShow(entityClient: EntityClient, lazyUser: LazyLoaded<User>, token?: string, attrs?: SecondFactorEditDialogAttrs): Promise<void> {
		const dialog: SecondFactorEditDialog = await showProgressDialog("pleaseWait_msg", this.loadWebauthnClient(entityClient, lazyUser, token, attrs))
		dialog.dialog.show()
	}

	private render(): Children {
		const optionsItems = this.model.getFactorTypesOptions().map((o) => ({
			name: lang.get(SecondFactorTypeToNameTextId[o]),
			value: o,
		}))

		const typeDropdownAttrs: DropDownSelectorAttrs<SecondFactorType> = {
			label: "type_label",
			selectedValue: this.model.selectedType,
			selectionChangedHandler: (newValue) => this.model.onTypeSelected(newValue),
			items: optionsItems,
			dropdownWidth: 300,
		}
		const nameFieldAttrs: TextFieldAttrs = {
			label: "name_label",
			helpLabel: () => this.renderHelpLabel(),
			value: this.model.name,
			oninput: (value) => this.model.onNameChange(value),
		}
		return [m(DropDownSelector, typeDropdownAttrs), m(TextField, nameFieldAttrs), this.renderTypeSpecificFields()]
	}

	private renderHelpLabel(): Children {
		return this.model.nameValidationStatus === NameValidationStatus.Valid
			? m("", lang.get("secondFactorNameInfo_msg"))
			: m(".b.content-accent-fg", lang.get("textTooLong_msg"))
	}

	private renderTypeSpecificFields(): Children {
		switch (this.model.selectedType) {
			case SecondFactorType.totp:
				return this.renderOtpFields()

			case SecondFactorType.webauthn:
				return this.renderU2FFields()

			default:
				throw new ProgrammingError(`Invalid 2fa type: ${this.model.selectedType}`)
		}
	}

	private renderU2FFields(): Children {
		return this.model.verificationStatus === VerificationStatus.Initial
			? null
			: m("p.flex.items-center", [m(".mr-8", this.statusIcon()), m("", this.statusMessage())])
	}

	private renderOtpFields(): Children {
		const copyButtonAttrs: IconButtonAttrs = {
			title: "copy_action",
			click: () => copyToClipboard(this.model.totpKeys.readableKey),
			icon: Icons.Clipboard,
			size: ButtonSize.Compact,
		}
		return m(".mb-16", [
			m(TextField, {
				label: "totpSecret_label",
				helpLabel: () => lang.get(isApp() ? "totpTransferSecretApp_msg" : "totpTransferSecret_msg"),
				value: this.model.totpKeys.readableKey,
				injectionsRight: () => m(IconButton, copyButtonAttrs),
				isReadOnly: true,
			}),
			isApp()
				? m(
						".pt-16",
						m(LoginButton, {
							label: "addOpenOTPApp_action",
							onclick: () => this.openOtpLink(),
						}),
					)
				: this.renderOtpQrCode(),
			m(TextField, {
				label: "totpCode_label",
				value: this.model.totpCode,
				helpLabel: () => this.statusMessage(),
				autocompleteAs: Autocomplete.oneTimeCode,
				oninput: (newValue) => this.model.onTotpValueChange(newValue),
				onReturnKeyPressed: () => this.okAction(),
			}),
		])
	}

	private renderOtpQrCode(): Children {
		const otpInfo = this.model.otpInfo.getSync()

		if (otpInfo) {
			const qrCodeSvg = assertNotNull(otpInfo.qrCodeSvg)
			// sanitized in the model
			return m(".flex-center.pt-16", m.trust(qrCodeSvg))
		} else {
			return null
		}
	}

	private async openOtpLink() {
		const { url } = await this.model.otpInfo.getAsync()
		const successful = await locator.systemFacade.openLink(url)

		if (!successful) {
			// noinspection ES6MissingAwait
			Dialog.message("noAppAvailable_msg")
		}
	}

	private static async loadWebauthnClient(
		entityClient: EntityClient,
		lazyUser: LazyLoaded<User>,
		token?: string,
		attrs?: SecondFactorEditDialogAttrs,
	): Promise<SecondFactorEditDialog> {
		const totpKeys = await locator.loginFacade.generateTotpSecret()
		const user = await lazyUser.getAsync()
		const webauthnSupported = await locator.webAuthn.isSupported()
		const model = new SecondFactorEditModel(
			entityClient,
			user,
			locator.webAuthn,
			totpKeys,
			webauthnSupported,
			locator.loginFacade,
			location.hostname,
			locator.domainConfigProvider().getCurrentDomainConfig(),
			m.redraw,
			token,
		)
		return new SecondFactorEditDialog(model, attrs)
	}

	private statusIcon(): Children {
		switch (this.model.verificationStatus) {
			case VerificationStatus.Progress:
				return progressIcon()

			case VerificationStatus.Success:
				return m(Icon, {
					icon: Icons.Checkmark,
					size: IconSize.PX24,
					style: {
						fill: theme.primary,
					},
				})

			case VerificationStatus.Failed:
				return m(Icon, {
					icon: Icons.Cancel,
					size: IconSize.PX24,
					style: {
						fill: theme.primary,
					},
				})

			default:
				return null
		}
	}

	private statusMessage(): string {
		if (this.model.selectedType === SecondFactorType.webauthn) {
			return this.model.verificationStatus === VerificationStatus.Success ? lang.get("registeredU2fDevice_msg") : lang.get("unrecognizedU2fDevice_msg")
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

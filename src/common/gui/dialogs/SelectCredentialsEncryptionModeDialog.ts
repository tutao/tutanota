import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import { Dialog, DialogType } from "../base/Dialog"
import type { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import m, { Children, Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { DialogHeaderBar } from "../base/DialogHeaderBar"
import type { RadioSelectorAttrs, RadioSelectorOption } from "../base/RadioSelector"
import { RadioSelector } from "../base/RadioSelector"
import { ButtonType } from "../base/Button.js"
import { CredentialAuthenticationError } from "../../api/common/error/CredentialAuthenticationError"
import { KeyPermanentlyInvalidatedError } from "../../api/common/error/KeyPermanentlyInvalidatedError"
import { liveDataAttrs } from "../AriaUtils"
import type { DeferredObject } from "@tutao/tutanota-utils"
import { defer } from "@tutao/tutanota-utils"
import { windowFacade } from "../../misc/WindowFacade"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { BaseButton } from "../base/buttons/BaseButton.js"

export const DEFAULT_CREDENTIAL_ENCRYPTION_MODE = CredentialEncryptionMode.DEVICE_LOCK

export async function showCredentialsEncryptionModeDialog(credentialsProvider: CredentialsProvider): Promise<void> {
	await CredentialEncryptionMethodDialog.showAndWaitForSelection(credentialsProvider)
}

class CredentialEncryptionMethodDialog {
	private error: string | null
	private readonly finished: DeferredObject<void>
	private readonly dialog: Dialog

	private constructor(
		private readonly credentialsProvider: CredentialsProvider,
		private readonly supportedModes: ReadonlyArray<CredentialEncryptionMode>,
		private readonly previousSelection: CredentialEncryptionMode | null,
	) {
		this.error = null
		this.finished = defer()
		this.dialog = new Dialog(DialogType.EditMedium, {
			view: () => {
				// We need custom dialog because:
				// - We don't need large dialog
				// - We want our selector button in the body and not in the header and it must stick to the bottom of the dialog
				//   (large dialog scrolls its contents and that's *not* what we want for that button).
				return m("", [
					// Only allow skipping if it's first time user selects mode (not from settings)
					previousSelection == null
						? m(DialogHeaderBar, {
								left: () => [
									{
										label: "skip_action",
										click: () => this.onModeSelected(DEFAULT_CREDENTIAL_ENCRYPTION_MODE),
										type: ButtonType.Secondary,
									} as const,
								],
						  })
						: null,
					m(SelectCredentialsEncryptionModeView, {
						class: "scroll pt plr-l height-100p",
						error: this.error,
						onConfirm: (mode) => this.onModeSelected(mode),
						supportedModes: this.supportedModes,
						previousSelection: this.previousSelection ?? DEFAULT_CREDENTIAL_ENCRYPTION_MODE,
					}),
				])
			},
		}).addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => this.dialog.close(),
		})
		this.dialog.setCloseHandler(() => {
			this.finished.resolve()
			this.dialog.close()
		})
	}

	static async showAndWaitForSelection(credentialsProvider: CredentialsProvider) {
		const supportedModes = await credentialsProvider.getSupportedEncryptionModes()
		const previousSelection = await credentialsProvider.getCredentialEncryptionMode()
		const credentialsDialog = new CredentialEncryptionMethodDialog(credentialsProvider, supportedModes, previousSelection)

		credentialsDialog.dialog.show()

		await credentialsDialog.finished.promise
	}

	private async onModeSelected(mode: CredentialEncryptionMode) {
		try {
			await this.credentialsProvider.setCredentialEncryptionMode(mode)

			this.dialog.close()

			this.finished.resolve()
		} catch (e) {
			if (e instanceof CredentialAuthenticationError) {
				this.error = e.message
				m.redraw()
			} else if (e instanceof KeyPermanentlyInvalidatedError) {
				await this.credentialsProvider.clearCredentials(e)

				this.dialog.close()

				await Dialog.message("credentialsKeyInvalidated_msg")
				windowFacade.reload({})
			} else if (e instanceof CancelledError) {
				// if the user cancels, is unrecognized by Face ID, enters an incorrect device password, etc., we should not close the dialog
				// and instead let them try again or choose a different encryption mode
			} else {
				throw e
			}
		}
	}
}

type SelectCredentialEncryptionModeDialogAttrs = {
	class?: string
	previousSelection: CredentialEncryptionMode
	onConfirm: ((encryptionMode: CredentialEncryptionMode) => unknown) | null
	supportedModes: ReadonlyArray<CredentialEncryptionMode>
	error: string | null
	onModeSelected?: (mode: CredentialEncryptionMode) => unknown
}

export class SelectCredentialsEncryptionModeView implements Component<SelectCredentialEncryptionModeDialogAttrs> {
	private currentMode: CredentialEncryptionMode

	constructor({ attrs }: Vnode<SelectCredentialEncryptionModeDialogAttrs>) {
		this.currentMode = attrs.previousSelection
	}

	view({ attrs }: Vnode<SelectCredentialEncryptionModeDialogAttrs>): Children {
		const options = this.getSupportedOptions(attrs)

		const { onConfirm } = attrs
		return [
			m(
				".flex.col",
				{
					class: attrs.class,
				},
				[
					attrs.error ? m(".small.center.statusTextColor.pb-s", liveDataAttrs(), attrs.error) : null,
					m("", lang.get("credentialsEncryptionModeSelection_msg")),
					m(
						".mt",
						m(RadioSelector, {
							name: "credentialsEncryptionMode_label",
							options,
							selectedOption: this.currentMode,
							onOptionSelected: (mode: CredentialEncryptionMode) => {
								this.currentMode = mode
								attrs.onModeSelected?.(mode)
							},
						} satisfies RadioSelectorAttrs<CredentialEncryptionMode>),
					),
				],
			),
			onConfirm ? this.renderSelectButton(() => onConfirm(this.currentMode)) : null,
		]
	}

	private getSupportedOptions(attrs: SelectCredentialEncryptionModeDialogAttrs): Array<RadioSelectorOption<CredentialEncryptionMode>> {
		const generateOption = (name: TranslationKey, value: CredentialEncryptionMode): RadioSelectorOption<CredentialEncryptionMode> => ({
			name,
			value,
		})

		const options = [
			generateOption("credentialsEncryptionModeDeviceLock_label", CredentialEncryptionMode.DEVICE_LOCK),
			generateOption("credentialsEncryptionModeDeviceCredentials_label", CredentialEncryptionMode.SYSTEM_PASSWORD),
			generateOption("credentialsEncryptionModeBiometrics_label", CredentialEncryptionMode.BIOMETRICS),
			generateOption("credentialsEncryptionModeAppPassword_label", CredentialEncryptionMode.APP_PASSWORD),
		] as const
		return options.filter((option) => attrs.supportedModes.includes(option.value))
	}

	private renderSelectButton(onclick: () => unknown) {
		const label = lang.get("ok_action")
		return m(BaseButton, {
			label,
			text: label,
			class: "uppercase accent-bg full-width center b content-fg flash",
			style: {
				height: "60px",
			},
			onclick,
		})
	}
}

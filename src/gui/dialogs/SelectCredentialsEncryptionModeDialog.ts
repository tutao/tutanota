import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode"
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
	readonly _credentialsProvider: CredentialsProvider
	_error: string | null
	readonly _finished: DeferredObject<void>
	readonly _dialog: Dialog
	readonly _supportedModes: ReadonlyArray<CredentialEncryptionMode>
	readonly _previousSelection: CredentialEncryptionMode | null

	/** @private */
	constructor(
		credentialsProvider: CredentialsProvider,
		supportedModes: ReadonlyArray<CredentialEncryptionMode>,
		previousSelection: CredentialEncryptionMode | null,
	) {
		this._credentialsProvider = credentialsProvider
		this._supportedModes = supportedModes
		this._previousSelection = previousSelection
		this._error = null
		this._finished = defer()
		this._dialog = new Dialog(DialogType.EditMedium, {
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
										click: () => this._onModeSelected(DEFAULT_CREDENTIAL_ENCRYPTION_MODE),
										type: ButtonType.Secondary,
									} as const,
								],
						  })
						: null,
					m(SelectCredentialsEncryptionModeView, {
						class: "scroll pt plr-l height-100p",
						error: this._error,
						onConfirm: (mode) => this._onModeSelected(mode),
						supportedModes: this._supportedModes,
						previousSelection: this._previousSelection ?? DEFAULT_CREDENTIAL_ENCRYPTION_MODE,
					}),
				])
			},
		}).addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => this._dialog.close(),
		})
		this._dialog.setCloseHandler(() => {
			this._finished.resolve()
			this._dialog.close()
		})
	}

	static async showAndWaitForSelection(credentialsProvider: CredentialsProvider) {
		const supportedModes = await credentialsProvider.getSupportedEncryptionModes()
		const previousSelection = await credentialsProvider.getCredentialsEncryptionMode()
		const credentialsDialog = new CredentialEncryptionMethodDialog(credentialsProvider, supportedModes, previousSelection)

		credentialsDialog._dialog.show()

		await credentialsDialog._finished.promise
	}

	async _onModeSelected(mode: CredentialEncryptionMode) {
		try {
			await this._credentialsProvider.setCredentialsEncryptionMode(mode)

			this._dialog.close()

			this._finished.resolve()
		} catch (e) {
			if (e instanceof CredentialAuthenticationError) {
				this._error = e.message
				m.redraw()
			} else if (e instanceof KeyPermanentlyInvalidatedError) {
				await this._credentialsProvider.clearCredentials(e)

				this._dialog.close()

				await Dialog.message("credentialsKeyInvalidated_msg")
				windowFacade.reload({})
			} else if (e instanceof CancelledError) {
				// ignore. this can happen if we switch app pin -> device lock and the user cancels the pin prompt.
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
	_currentMode: CredentialEncryptionMode

	constructor({ attrs }: Vnode<SelectCredentialEncryptionModeDialogAttrs>) {
		this._currentMode = attrs.previousSelection
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
							selectedOption: this._currentMode,
							onOptionSelected: (mode: CredentialEncryptionMode) => {
								this._currentMode = mode
								attrs.onModeSelected?.(mode)
							},
						} satisfies RadioSelectorAttrs<CredentialEncryptionMode>),
					),
				],
			),
			onConfirm ? this.renderSelectButton(() => onConfirm(this._currentMode)) : null,
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

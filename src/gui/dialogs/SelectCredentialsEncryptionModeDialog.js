// @flow
import type {CredentialEncryptionModeEnum} from "../../misc/credentials/CredentialEncryptionMode"
import {CredentialEncryptionMode} from "../../misc/credentials/CredentialEncryptionMode"
import {Dialog, DialogType} from "../base/Dialog"
import type {ICredentialsProvider} from "../../misc/credentials/CredentialsProvider"
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {theme} from "../theme"
import {DialogHeaderBar} from "../base/DialogHeaderBar"
import type {RadioSelectorOption} from "../base/RadioSelector"
import {RadioSelector} from "../base/RadioSelector"
import {ButtonType} from "../base/ButtonN"
import {CredentialAuthenticationError} from "../../api/common/error/CredentialAuthenticationError"
import {KeyPermanentlyInvalidatedError} from "../../api/common/error/KeyPermanentlyInvalidatedError"
import {liveDataAttrs} from "../AriaUtils"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer} from "@tutao/tutanota-utils"

const DEFAULT_MODE = CredentialEncryptionMode.DEVICE_LOCK

export async function showCredentialsEncryptionModeDialog(credentialsProvider: ICredentialsProvider) {
	await CredentialEncryptionMethodDialog.showAndWaitForSelection(credentialsProvider)
}

class CredentialEncryptionMethodDialog {
	+_credentialsProvider: ICredentialsProvider

	_error: ?string
	+_finished: DeferredObject<void>
	+_dialog: Dialog
	+_supportedModes: $ReadOnlyArray<CredentialEncryptionModeEnum>
	+_previousSelection: ?CredentialEncryptionModeEnum

	/** @private */
	constructor(
		credentialsProvider: ICredentialsProvider,
		supportedModes: $ReadOnlyArray<CredentialEncryptionModeEnum>,
		previousSelection: ?CredentialEncryptionModeEnum,
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
						? m(".dialog-header.plr-l", m(DialogHeaderBar, {
							left: () => [
								{
									label: "skip_action",
									click: () => this._onModeSelected(DEFAULT_MODE),
									type: ButtonType.Secondary,
								}
							]
						}))
						: null,
					m(".rel", m(SelectCredentialsEncryptionModeView, {
						error: this._error,
						onModeSelected: (mode) => this._onModeSelected(mode),
						supportedModes: this._supportedModes,
						previousSelection: this._previousSelection ?? DEFAULT_MODE,
					}))
				])
			}
		})
	}

	static async showAndWaitForSelection(credentialsProvider: ICredentialsProvider) {
		const supportedModes = await credentialsProvider.getSupportedEncryptionModes()
		const previousSelection = credentialsProvider.getCredentialsEncryptionMode()

		const credentialsDialog = new CredentialEncryptionMethodDialog(credentialsProvider, supportedModes, previousSelection)
		credentialsDialog._dialog.show()
		await credentialsDialog._finished.promise
	}

	async _onModeSelected(mode) {
		try {
			await this._credentialsProvider.setCredentialsEncryptionMode(mode)
			this._dialog.close()
			this._finished.resolve()
		} catch (e) {
			if (e instanceof CredentialAuthenticationError || e instanceof KeyPermanentlyInvalidatedError) {
				this._error = e.message
				m.redraw()
			} else {
				throw e
			}
		}
	}
}


type SelectCredentialEncryptionModeDialogAttrs = {
	previousSelection: CredentialEncryptionModeEnum,
	onModeSelected: (CredentialEncryptionModeEnum) => mixed,
	supportedModes: $ReadOnlyArray<CredentialEncryptionModeEnum>,
	error: ?string,
}

class SelectCredentialsEncryptionModeView implements MComponent<SelectCredentialEncryptionModeDialogAttrs> {
	_currentMode: CredentialEncryptionModeEnum

	constructor({attrs}: Vnode<SelectCredentialEncryptionModeDialogAttrs>) {
		this._currentMode = attrs.previousSelection
	}


	view({attrs}: Vnode<SelectCredentialEncryptionModeDialogAttrs>): Children {
		const options = this._getSupportedOptions(attrs)

		return [
			m(".flex.col.pt-m.scroll.plr-l", {
				style: {
					position: "relative",
					height: "100%",
					paddingBottom: "64px", // Padding to not overlap the button below
				}
			}, [
				attrs.error ? m(".small.center.statusTextColor.pb-s" + liveDataAttrs(), attrs.error) : null,
				m("", lang.get("credentialsEncryptionModeSelection_msg")),
				m(".mt", m(RadioSelector, {
					options,
					selectedOption: this._currentMode,
					onOptionSelected: (mode) => {
						this._currentMode = mode
					},
				})),
			]),
			this._renderSelectButton(() => attrs.onModeSelected(this._currentMode)),
		]
	}

	_getSupportedOptions(attrs): Array<RadioSelectorOption<CredentialEncryptionModeEnum>> {
		const options = [
			{
				name: "credentialsEncryptionModeDeviceLock_label",
				value: CredentialEncryptionMode.DEVICE_LOCK,
				helpText: "credentialsEncryptionModeDeviceLockHelp_msg"
			},
			{
				name: "credentialsEncryptionModeDeviceCredentials_label",
				value: CredentialEncryptionMode.SYSTEM_PASSWORD,
				helpText: "credentialsEncryptionModeDeviceCredentialsHelp_msg"
			},
			{
				name: "credentialsEncryptionModeBiometrics_label",
				value: CredentialEncryptionMode.BIOMETRICS,
				helpText: "credentialsEncryptionModeBiometricsHelp_msg"
			},
		]
		return options.filter((option) => attrs.supportedModes.includes(option.value))
	}

	_renderSelectButton(onclick: () => mixed) {
		return m("button.full-width.center.pb-s.pt-s.b.flex.items-center.justify-center", {
			style: {
				backgroundColor: theme.content_accent,
				color: "white",
				position: "absolute",
				bottom: "0",
				left: "0",
				right: "0",
				height: "60px",
				textTransform: "uppercase",
			},
			onclick,
		}, lang.get("ok_action"))
	}
}


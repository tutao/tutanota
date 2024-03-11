import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import type { RadioSelectorAttrs, RadioSelectorOption } from "../../gui/base/RadioSelector.js"
import { RadioSelector } from "../../gui/base/RadioSelector.js"
import { CredentialAuthenticationError } from "../../api/common/error/CredentialAuthenticationError.js"
import { liveDataAttrs } from "../../gui/AriaUtils.js"
import type { DeferredObject } from "@tutao/tutanota-utils"
import { defer } from "@tutao/tutanota-utils"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { MobileSystemFacade } from "../common/generatedipc/MobileSystemFacade.js"
import { AppLockMethod } from "../common/generatedipc/AppLockMethod.js"

export async function showAppLockMethodDialog(mobileSystemFacade: MobileSystemFacade): Promise<void> {
	await AppLockMethodDialog.showAndWaitForSelection(mobileSystemFacade)
}

class AppLockMethodDialog {
	private error: string | null
	private readonly finished: DeferredObject<void>
	private readonly dialog: Dialog

	/** @private */
	constructor(
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly supportedModes: ReadonlyArray<AppLockMethod>,
		private readonly previousSelection: AppLockMethod,
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
					null,
					m(SelectAppLockMethodView, {
						class: "scroll pt plr-l height-100p",
						error: this.error,
						onConfirm: (mode) => this.onMethodSelected(mode),
						supportedModes: this.supportedModes,
						previousSelection: this.previousSelection,
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

	static async showAndWaitForSelection(mobileSystemFacade: MobileSystemFacade) {
		const supportedModes = await mobileSystemFacade.getSupportedAppLockMethods()
		const previousSelection = await mobileSystemFacade.getAppLockMethod()
		const credentialsDialog = new AppLockMethodDialog(mobileSystemFacade, supportedModes, previousSelection)

		credentialsDialog.dialog.show()

		await credentialsDialog.finished.promise
	}

	private async onMethodSelected(mode: AppLockMethod) {
		try {
			// Make sure that the user can actually use the method before we save it.
			// Example: on iOS Biometrics will be supported but before the first use the user must give the permission anyway.
			await this.mobileSystemFacade.enforceAppLock(mode)
			await this.mobileSystemFacade.setAppLockMethod(mode)

			this.dialog.close()

			this.finished.resolve()
		} catch (e) {
			if (e instanceof CredentialAuthenticationError) {
				this.error = e.message
				m.redraw()
			} else if (e instanceof CancelledError) {
				// ignore. this can happen if we switch app pin -> device lock and the user cancels the pin prompt.
			} else {
				throw e
			}
		}
	}
}

interface SelectAppLockMethodDialogAttrs {
	class?: string
	previousSelection: AppLockMethod
	onConfirm: ((appLockMethod: AppLockMethod) => unknown) | null
	supportedModes: ReadonlyArray<AppLockMethod>
	error: string | null
	onModeSelected?: (mode: AppLockMethod) => unknown
}

export class SelectAppLockMethodView implements Component<SelectAppLockMethodDialogAttrs> {
	private currentMethod: AppLockMethod

	constructor({ attrs }: Vnode<SelectAppLockMethodDialogAttrs>) {
		this.currentMethod = attrs.previousSelection
	}

	view({ attrs }: Vnode<SelectAppLockMethodDialogAttrs>): Children {
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
							selectedOption: this.currentMethod,
							onOptionSelected: (mode: AppLockMethod) => {
								this.currentMethod = mode
								attrs.onModeSelected?.(mode)
							},
						} satisfies RadioSelectorAttrs<AppLockMethod>),
					),
				],
			),
			onConfirm ? this.renderSelectButton(() => onConfirm(this.currentMethod)) : null,
		]
	}

	private getSupportedOptions(attrs: SelectAppLockMethodDialogAttrs): Array<RadioSelectorOption<AppLockMethod>> {
		const generateOption = (name: TranslationKey, value: AppLockMethod): RadioSelectorOption<AppLockMethod> => ({
			name,
			value,
		})

		const options = [
			generateOption("credentialsEncryptionModeDeviceLock_label", AppLockMethod.None),
			generateOption("credentialsEncryptionModeDeviceCredentials_label", AppLockMethod.SystemPassOrBiometrics),
			generateOption("credentialsEncryptionModeBiometrics_label", AppLockMethod.Biometrics),
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

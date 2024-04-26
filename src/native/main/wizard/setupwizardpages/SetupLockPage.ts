import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../../../gui/base/WizardDialog.js"
import { lang } from "../../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { Dialog } from "../../../../gui/base/Dialog.js"
import { DEFAULT_CREDENTIAL_ENCRYPTION_MODE, SelectCredentialsEncryptionModeView } from "../../../../gui/dialogs/SelectCredentialsEncryptionModeDialog.js"
import { CredentialAuthenticationError } from "../../../../api/common/error/CredentialAuthenticationError.js"
import { KeyPermanentlyInvalidatedError } from "../../../../api/common/error/KeyPermanentlyInvalidatedError.js"
import { windowFacade } from "../../../../misc/WindowFacade.js"
import { CancelledError } from "../../../../api/common/error/CancelledError.js"
import { CredentialsProvider } from "../../../../misc/credentials/CredentialsProvider.js"
import { CredentialEncryptionMode } from "../../../../misc/credentials/CredentialEncryptionMode.js"

export class SetupLockPage implements Component<SetupLockPageAttrs> {
	view({ attrs }: Vnode<SetupLockPageAttrs>): Children {
		return m(SetupPageLayout, { image: "lock", buttonLabel: "finish_action" }, [
			m(SelectCredentialsEncryptionModeView, {
				class: "mt",
				error: attrs.error,
				supportedModes: attrs.supportedModes,
				previousSelection: attrs.currentMode,
				onConfirm: null,
				onModeSelected: (mode) => (attrs.currentMode = mode),
			}),
		])
	}
}

export class SetupLockPageAttrs implements WizardPageAttrs<null> {
	hidePagingButtonForPage = false
	data: null = null

	error: string | null = null
	supportedModes: ReadonlyArray<CredentialEncryptionMode> = []
	currentMode: CredentialEncryptionMode = this.credentialsProvider.getCredentialsEncryptionMode() ?? DEFAULT_CREDENTIAL_ENCRYPTION_MODE

	constructor(public readonly credentialsProvider: CredentialsProvider) {
		credentialsProvider.getSupportedEncryptionModes().then((supportedModes) => {
			this.supportedModes = supportedModes
			m.redraw
		})
	}

	headerTitle(): string {
		return lang.get("credentialsEncryptionMode_label")
	}

	async nextAction(showDialogs: boolean): Promise<boolean> {
		try {
			await this.credentialsProvider.setCredentialsEncryptionMode(this.currentMode)
		} catch (e) {
			if (e instanceof CredentialAuthenticationError) {
				this.error = e.message
				m.redraw()
				return false
			} else if (e instanceof KeyPermanentlyInvalidatedError) {
				await this.credentialsProvider.clearCredentials(e)

				await Dialog.message("credentialsKeyInvalidated_msg")
				windowFacade.reload({})
			} else if (e instanceof CancelledError) {
				// if the user cancels, is unrecognized by Face ID, enters an incorrect device password, etc., we should not close the dialog
				// and instead let them try again or choose a different encryption mode
				return false
			} else {
				throw e
			}
		}

		// next action not available for this page
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return this.supportedModes.length > 1
	}
}

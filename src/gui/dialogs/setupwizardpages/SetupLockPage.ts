import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../base/WizardDialog.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { Dialog } from "../../base/Dialog.js"
import { DEFAULT_CREDENTIAL_ENCRYPTION_MODE, SelectCredentialsEncryptionModeView } from "../SelectCredentialsEncryptionModeDialog.js"
import { CredentialAuthenticationError } from "../../../api/common/error/CredentialAuthenticationError.js"
import { KeyPermanentlyInvalidatedError } from "../../../api/common/error/KeyPermanentlyInvalidatedError.js"
import { windowFacade } from "../../../misc/WindowFacade.js"
import { CancelledError } from "../../../api/common/error/CancelledError.js"
import { CredentialsProvider } from "../../../misc/credentials/CredentialsProvider.js"
import { CredentialEncryptionMode } from "../../../misc/credentials/CredentialEncryptionMode.js"
import { Icons } from "../../base/icons/Icons.js"

export class SetupLockPage implements Component<SetupLockPageAttrs> {
	view({ attrs }: Vnode<SetupLockPageAttrs>): Children {
		return m(SetupPageLayout, { icon: Icons.Lock, buttonLabel: "finish_action" }, [
			m(SelectCredentialsEncryptionModeView, {
				error: attrs.error,
				supportedModes: attrs.supportedModes,
				previousSelection: DEFAULT_CREDENTIAL_ENCRYPTION_MODE,
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
				// ignore. this can happen if we switch app pin -> device lock and the user cancels the pin prompt.
			} else {
				throw e
			}
		}

		// next action not available for this page
		return true
	}

	isSkipAvailable(): boolean {
		return true
	}

	isEnabled(): boolean {
		return true
	}
}

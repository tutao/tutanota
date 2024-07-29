import { WebAuthnFacade } from "../../native/common/generatedipc/WebAuthnFacade.js"
import type { WebDialogController } from "../WebDialog.js"
import { WebDialog } from "../WebDialog.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { WebAuthnRegistrationChallenge } from "../../native/common/generatedipc/WebAuthnRegistrationChallenge.js"
import { WebAuthnRegistrationResult } from "../../native/common/generatedipc/WebAuthnRegistrationResult.js"
import { WebAuthnSignChallenge } from "../../native/common/generatedipc/WebAuthnSignChallenge.js"
import { WebAuthnSignResult } from "../../native/common/generatedipc/WebAuthnSignResult.js"

export class DesktopWebauthnFacade implements WebAuthnFacade {
	private currentDialog: Promise<WebDialog<{ WebAuthnFacade: WebAuthnFacade }>> | null = null

	constructor(private readonly parentWindow: ApplicationWindow, private readonly webDialogController: WebDialogController) {}

	async register(challenge: WebAuthnRegistrationChallenge): Promise<WebAuthnRegistrationResult> {
		const { domain } = challenge

		return this.withDialog(domain, (webauthn) => webauthn.register(challenge))
	}

	async sign(challenge: WebAuthnSignChallenge): Promise<WebAuthnSignResult> {
		const { domain } = challenge

		return this.withDialog(domain, (webauthn) => webauthn.sign(challenge))
	}

	async canAttemptChallengeForRpId(rpId: string): Promise<boolean> {
		return true
	}

	async canAttemptChallengeForU2FAppId(appId: string): Promise<boolean> {
		return true
	}

	async isSupported(): Promise<boolean> {
		return true
	}

	async abortCurrentOperation(): Promise<void> {
		try {
			;(await this.currentDialog)?.cancel()
		} catch (ignored) {}
	}

	private async withDialog<T>(baseDomain: string, request: (webauthn: WebAuthnFacade) => Promise<T>): Promise<T> {
		this.currentDialog = this.webDialogController.create(this.parentWindow.id, new URL(baseDomain))

		const dialog = await this.currentDialog
		try {
			// make sure to await to get finally() to trigger in case of errors
			return await dialog.makeRequest((remote) => request(remote.WebAuthnFacade))
		} finally {
			this.currentDialog = null
		}
	}
}

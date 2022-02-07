import {
	ExposedWebauthnInterface,
	IWebauthn,
	WebAuthnRegistrationChallenge,
	WebauthnRegistrationResult,
	WebAuthnSignChallenge,
	WebauthnSignResult
} from "../../misc/2fa/webauthn/IWebauthn.js"
import type {IWebDialogController} from "../WebDialog.js"
import {WebDialog} from "../WebDialog.js"

export class DesktopWebauthn implements IWebauthn {
	private currentDialog: Promise<WebDialog<ExposedWebauthnInterface>> | null = null

	constructor(
		private readonly parentWindowId: number,
		private readonly webDialogController: IWebDialogController,
	) {
	}

	async register(challenge: WebAuthnRegistrationChallenge): Promise<WebauthnRegistrationResult> {
		const {domain} = challenge

		return this.withDialog(domain, (webauthn) => webauthn.register(challenge))
	}

	async sign(challenge: WebAuthnSignChallenge): Promise<WebauthnSignResult> {
		const {domain} = challenge

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
			(await this.currentDialog)?.cancel()
		} catch (ignored) {
		}
	}

	private async withDialog<T>(baseDomain: string, request: (webauthn: IWebauthn) => Promise<T>): Promise<T> {
		this.currentDialog = this.webDialogController.create(this.parentWindowId, new URL(baseDomain + "/webauthn"))

		const dialog = await this.currentDialog
		try {
			// make sure to await to get finally() to trigger
			return await dialog.makeRequest((remote) => request(remote.webauthn))
		} finally {
			this.currentDialog = null
		}
	}
}
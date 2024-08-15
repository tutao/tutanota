import { SecondFactorHandler } from "../../misc/2fa/SecondFactorHandler.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { Challenge } from "../entities/sys/TypeRefs.js"
import { CacheInfo, LoginListener } from "../worker/facades/LoginFacade.js"
import { SessionType } from "../common/SessionType.js"
import { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import { Credentials, credentialsToUnencrypted } from "../../misc/credentials/Credentials.js"

export const enum LoginFailReason {
	SessionExpired,
	Error,
}

/** Listener for the login events from the worker side. */
export class PageContextLoginListener implements LoginListener {
	private loginPromise: DeferredObject<void> = defer()
	private fullLoginFailed: boolean = false

	constructor(private readonly secondFactorHandler: SecondFactorHandler, private readonly credentialsProvider: CredentialsProvider) {}

	/** e.g. after temp logout */
	reset() {
		this.loginPromise = defer()
		this.fullLoginFailed = false
	}

	waitForFullLogin(): Promise<void> {
		return this.loginPromise.promise
	}

	/**
	 * Full login reached: any network requests can be made
	 */
	async onFullLoginSuccess(_sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
		this.fullLoginFailed = false

		// Update the credentials after the full login.
		// It is needed because we added encryptedPassphraseKey to credentials which is only
		// available after the full login which happens async.

		// First fetch encrypted credentials for the user to figure out if the credentials are stored but are also missing
		// a passphrase key, and then update if so.

		const persistedCredentials = (await this.credentialsProvider.getAllInternalCredentials()).find((a) => a.credentialInfo.userId === credentials.userId)
		if (persistedCredentials != null && persistedCredentials.encryptedPassphraseKey == null) {
			const updatedCredentials = credentialsToUnencrypted(credentials, cacheInfo.databaseKey)
			await this.credentialsProvider.store(updatedCredentials)
		}

		this.loginPromise.resolve()
	}

	/**
	 * call when the login fails for invalid session or other reasons
	 */
	async onLoginFailure(reason: LoginFailReason): Promise<void> {
		this.fullLoginFailed = true
		if (reason === LoginFailReason.SessionExpired) {
			const { reloginForExpiredSession } = await import("../../misc/ErrorHandlerImpl.js")
			await reloginForExpiredSession()
		}
	}

	/**
	 * call when retrying full login
	 */
	onRetryLogin(): void {
		this.fullLoginFailed = false
	}

	/**
	 * Shows a dialog with possibility to use second factor and with a message that the login can be approved from another client.
	 */
	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void> {
		return this.secondFactorHandler.showSecondFactorAuthenticationDialog(sessionId, challenges, mailAddress)
	}

	/**
	 * true if the last full login attempt failed
	 * may revert to false when retrying.
	 */
	getFullLoginFailed(): boolean {
		return this.fullLoginFailed
	}
}

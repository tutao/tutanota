import {SecondFactorHandler} from "../../misc/2fa/SecondFactorHandler.js"
import {defer, DeferredObject} from "@tutao/tutanota-utils"
import {Challenge} from "../entities/sys/TypeRefs.js"

export const enum LoginFailReason {
	SessionExpired,
	Error
}

/** Listener for the login events from the worker side. */
export interface ILoginListener {
	/**
	 * Partial login reached: cached entities and user are available.
	 */
	onPartialLoginSuccess(): Promise<void>

	/**
	 * Full login reached: any network requests can be made
	 */
	onFullLoginSuccess(): Promise<void>

	/**
	 * call when the login fails for invalid session or other reasons
	 */
	onLoginFailure(reason: LoginFailReason): Promise<void>

	/*
	* call when retrying full login
	 */
	onRetryLogin(): void

	/**
	 * Shows a dialog with possibility to use second factor and with a message that the login can be approved from another client.
	 */
	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void>

	/**
	 * true if the last full login attempt failed
	 * may revert to false when retrying.
	 */
	getFullLoginFailed(): boolean
}

export class LoginListener implements ILoginListener {

	private loginPromise: DeferredObject<void> = defer()
	private fullLoginFailed: boolean = false

	constructor(
		private readonly secondFactorHandler: SecondFactorHandler,
	) {
	}

	waitForFullLogin(): Promise<void> {
		return this.loginPromise.promise
	}

	onPartialLoginSuccess(): Promise<void> {
		return Promise.resolve()
	}

	async onFullLoginSuccess(): Promise<void> {
		this.fullLoginFailed = false
		this.loginPromise.resolve()
	}

	async onLoginFailure(reason: LoginFailReason): Promise<void> {
		this.fullLoginFailed = true
		if (reason === LoginFailReason.SessionExpired) {
			const {reloginForExpiredSession} = await import("../../misc/ErrorHandlerImpl.js")
			await reloginForExpiredSession()
		}
	}

	onRetryLogin(): void {
		this.fullLoginFailed = false
	}

	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void> {
		return this.secondFactorHandler.showSecondFactorAuthenticationDialog(sessionId, challenges, mailAddress)
	}

	getFullLoginFailed(): boolean {
		return this.fullLoginFailed
	}
}
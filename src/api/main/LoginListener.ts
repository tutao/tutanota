import {SecondFactorHandler} from "../../misc/2fa/SecondFactorHandler.js"
import {defer, DeferredObject} from "@tutao/tutanota-utils"
import {Challenge} from "../entities/sys/TypeRefs.js"

/** Listener for the login events from the worker side. */
export interface ILoginListener {
	/**
	 * Partial login reached: cached entities and user are avabilable.
	 */
	onPartialLoginSuccess(): Promise<void>

	/**
	 * Full login reached: any network requests can be made
	 */
	onFullLoginSuccess(): Promise<void>

	onLoginError(): Promise<void>

	/**
	 * Shows a dialog with possibility to use second factor and with a message that the login can be approved from another client.
	 */
	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void>
}

export class LoginListener implements ILoginListener {

	private loginPromise: DeferredObject<void> = defer()

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
		this.loginPromise.resolve()
	}

	onLoginError(): Promise<void> {
		// this._loginPromise.reject()
		return Promise.resolve()
	}

	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void> {
		return this.secondFactorHandler.showSecondFactorAuthenticationDialog(sessionId, challenges, mailAddress)
	}
}
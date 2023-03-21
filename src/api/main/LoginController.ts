import type { DeferredObject } from "@tutao/tutanota-utils"
import { assertNotNull, defer } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../common/Env"
import type { UserController, UserControllerInitData } from "./UserController"
import { getWhitelabelCustomizations } from "../../misc/WhitelabelCustomizations"
import { NotFoundError } from "../common/error/RestError"
import { client } from "../../misc/ClientDetector"
import type { LoginFacade } from "../worker/facades/LoginFacade"
import { ResumeSessionErrorReason } from "../worker/facades/LoginFacade"
import type { Credentials } from "../../misc/credentials/Credentials"
import { FeatureType } from "../common/TutanotaConstants"
import { CredentialsAndDatabaseKey } from "../../misc/credentials/CredentialsProvider.js"
import { SessionType } from "../common/SessionType"
import { IMainLocator } from "./MainLocator"

assertMainOrNodeBoot()

export interface IPostLoginAction {
	/** Partial login is achieved with getting the user, can happen offline. The login will wait for the returned promise. */
	onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void>

	/** Full login is achieved with getting group keys. Can do service calls from this point on. */
	onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void>
}

export type LoggedInEvent = {
	readonly sessionType: SessionType
	readonly userId: Id
}

export type ResumeSessionResult = { type: "success" } | { type: "error"; reason: ResumeSessionErrorReason }

export class LoginController {
	private userController: UserController | null = null
	private customizations: NumberString[] | null = null
	private partialLogin: DeferredObject<void> = defer()
	private _isWhitelabel: boolean = !!getWhitelabelCustomizations(window)
	private postLoginActions: Array<IPostLoginAction> = []
	private fullyLoggedIn: boolean = false
	private atLeastPartiallyLoggedIn: boolean = false

	init() {
		this.waitForFullLogin().then(async () => {
			this.fullyLoggedIn = true
			await this.waitForPartialLogin()
			for (const action of this.postLoginActions) {
				await action.onFullLoginSuccess({
					sessionType: this.getUserController().sessionType,
					userId: this.getUserController().userId,
				})
			}
		})
	}

	private async getMainLocator(): Promise<IMainLocator> {
		const { locator } = await import("./MainLocator")
		await locator.initialized
		return locator
	}

	private async getLoginFacade(): Promise<LoginFacade> {
		const locator = await this.getMainLocator()
		const worker = locator.worker
		await worker.initialized
		return locator.loginFacade
	}

	async createSession(username: string, password: string, sessionType: SessionType, databaseKey: Uint8Array | null = null): Promise<Credentials> {
		const loginFacade = await this.getLoginFacade()
		const { user, credentials, sessionId, userGroupInfo } = await loginFacade.createSession(
			username,
			password,
			client.getIdentifier(),
			sessionType,
			databaseKey,
		)
		await this.onPartialLoginSuccess(
			{
				user,
				userGroupInfo,
				sessionId,
				accessToken: credentials.accessToken,
				sessionType,
			},
			sessionType,
		)
		return credentials
	}

	addPostLoginAction(handler: IPostLoginAction) {
		this.postLoginActions.push(handler)
	}

	async onPartialLoginSuccess(initData: UserControllerInitData, sessionType: SessionType): Promise<void> {
		const { initUserController } = await import("./UserController")
		this.userController = await initUserController(initData)

		await this.loadCustomizations()
		await this._determineIfWhitelabel()

		for (const handler of this.postLoginActions) {
			await handler.onPartialLoginSuccess({
				sessionType,
				userId: initData.user._id,
			})
		}
		this.atLeastPartiallyLoggedIn = true
		this.partialLogin.resolve()
	}

	async createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, sessionType: SessionType): Promise<Credentials> {
		const loginFacade = await this.getLoginFacade()
		const persistentSession = sessionType === SessionType.Persistent
		const { user, credentials, sessionId, userGroupInfo } = await loginFacade.createExternalSession(
			userId,
			password,
			salt,
			clientIdentifier,
			persistentSession,
		)
		await this.onPartialLoginSuccess(
			{
				user,
				accessToken: credentials.accessToken,
				sessionType,
				sessionId,
				userGroupInfo,
			},
			SessionType.Login,
		)
		return credentials
	}

	/**
	 * Resume an existing session using stored credentials, may or may not unlock a persistent local database
	 * @param credentials: The stored credentials and optional database key for the offline db
	 * @param externalUserSalt
	 * @param offlineTimeRangeDays: the user configured time range for their offline storage, used to initialize the offline db
	 */
	async resumeSession(
		{ credentials, databaseKey }: CredentialsAndDatabaseKey,
		externalUserSalt?: Uint8Array | null,
		offlineTimeRangeDays?: number | null,
	): Promise<ResumeSessionResult> {
		const loginFacade = await this.getLoginFacade()
		const resumeResult = await loginFacade.resumeSession(credentials, externalUserSalt ?? null, databaseKey ?? null, offlineTimeRangeDays ?? null)
		if (resumeResult.type === "error") {
			return resumeResult
		} else {
			const { user, userGroupInfo, sessionId } = resumeResult.data
			await this.onPartialLoginSuccess(
				{
					user,
					accessToken: credentials.accessToken,
					userGroupInfo,
					sessionId,
					sessionType: SessionType.Persistent,
				},
				SessionType.Persistent,
			)
			return { type: "success" }
		}
	}

	isUserLoggedIn(): boolean {
		return this.userController != null
	}

	isFullyLoggedIn(): boolean {
		return this.fullyLoggedIn
	}

	isAtLeastPartiallyLoggedIn(): boolean {
		return this.atLeastPartiallyLoggedIn
	}

	waitForPartialLogin(): Promise<void> {
		return this.partialLogin.promise
	}

	async waitForFullLogin(): Promise<void> {
		const locator = await this.getMainLocator()
		// Full login event might be received before we finish userLogin on the client side because they are done in parallel.
		// So we make sure to wait for userLogin first.
		await this.waitForPartialLogin()
		return locator.loginListener.waitForFullLogin()
	}

	isInternalUserLoggedIn(): boolean {
		return this.isUserLoggedIn() && this.getUserController().isInternalUser()
	}

	isGlobalAdminUserLoggedIn(): boolean {
		return this.isUserLoggedIn() && this.getUserController().isGlobalAdmin()
	}

	getUserController(): UserController {
		return assertNotNull(this.userController) // only to be used after login (when user is defined)
	}

	isEnabled(feature: FeatureType): boolean {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false
	}

	loadCustomizations(): Promise<void> {
		if (this.isInternalUserLoggedIn()) {
			return this.getUserController()
				.loadCustomer()
				.then((customer) => {
					this.customizations = customer.customizations.map((f) => f.feature)
				})
		} else {
			return Promise.resolve()
		}
	}

	async logout(sync: boolean): Promise<void> {
		if (this.userController) {
			await this.userController.deleteSession(sync)
			this.userController = null
			this.partialLogin = defer()
			this.fullyLoggedIn = false
			const locator = await this.getMainLocator()
			locator.loginListener.reset()
			this.init()
		} else {
			console.log("No session to delete")
		}
	}

	async _determineIfWhitelabel(): Promise<void> {
		this._isWhitelabel = await this.getUserController().isWhitelabelAccount()
	}

	isWhitelabel(): boolean {
		return this._isWhitelabel
	}

	async deleteOldSession(credentials: Credentials): Promise<void> {
		const loginFacade = await this.getLoginFacade()

		try {
			await loginFacade.deleteSession(credentials.accessToken)
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("session already deleted")
			} else {
				throw e
			}
		}
	}

	async retryAsyncLogin() {
		const loginFacade = await this.getLoginFacade()
		const locator = await this.getMainLocator()
		locator.loginListener.onRetryLogin()
		await loginFacade.retryAsyncLogin()
	}
}

const loginController = new LoginController()
export const logins: LoginController = loginController

// Should be called elsewhere later e.g. in mainLocator
loginController.init()

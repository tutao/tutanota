import type { DeferredObject, lazy, lazyAsync } from "@tutao/tutanota-utils"
import { assertNotNull, defer } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot, isAdminClient } from "../common/Env"
import type { UserController, UserControllerInitData } from "./UserController"
import { getWhitelabelCustomizations } from "../../misc/WhitelabelCustomizations.js"
import { NotFoundError } from "../common/error/RestError"
import { client } from "../../misc/ClientDetector"
import type { LoginFacade, NewSessionData } from "../worker/facades/LoginFacade"
import { ResumeSessionErrorReason } from "../worker/facades/LoginFacade"
import type { Credentials } from "../../misc/credentials/Credentials"
import { FeatureType, KdfType } from "../common/TutanotaConstants"
import { SessionType } from "../common/SessionType"
import { ExternalUserKeyDeriver } from "../../misc/LoginUtils.js"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { PageContextLoginListener } from "./PageContextLoginListener.js"
import { CacheMode } from "../worker/rest/EntityRestClient.js"
import { CustomerFacade } from "../worker/facades/lazy/CustomerFacade"

assertMainOrNodeBoot()

export interface PostLoginAction {
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
	// they are FeatureType but we might not be aware of newer values for it, so it is not just FeatureType
	private customizations: NumberString[] | null = null
	private partialLogin: DeferredObject<void> = defer()
	private _isWhitelabel: boolean = !!getWhitelabelCustomizations(window)
	private postLoginActions: Array<lazy<Promise<PostLoginAction>>> = []
	private fullyLoggedIn: boolean = false
	private atLeastPartiallyLoggedIn: boolean = false

	constructor(
		private readonly loginFacade: LoginFacade,
		private readonly customerFacade: CustomerFacade,
		private readonly loginListener: lazyAsync<PageContextLoginListener>,
		private readonly resetAppState: () => Promise<unknown>,
	) {}

	init() {
		this.waitForFullLogin().then(async () => {
			this.fullyLoggedIn = true
			await this.waitForPartialLogin()
			for (const lazyAction of this.postLoginActions) {
				const action = await lazyAction()
				await action.onFullLoginSuccess({
					sessionType: this.getUserController().sessionType,
					userId: this.getUserController().userId,
				})
			}
		})
	}

	/**
	 * a login that is persisted like a normal form login, but does not run any of the postLoginActions.
	 * It's recommended to reload / close the tab right after login finishes.
	 * @param username
	 * @param password
	 */
	async createPostSignupSession(username: string, password: string) {
		return await this.loginFacade.createSession(username, password, client.getIdentifier(), SessionType.Persistent, null, true)
	}

	/**
	 * create a new session and set up stored credentials and offline database, if applicable.
	 * @param username the mail address being used to log in
	 * @param password the password given to log in
	 * @param sessionType whether to store the credentials in local storage
	 * @param databaseKey if given, will use this key for the offline database. if not, will force a new database to be created and generate a key.
	 */
	async createSession(username: string, password: string, sessionType: SessionType, databaseKey: Uint8Array | null = null): Promise<NewSessionData> {
		const newSessionData = await this.loginFacade.createSession(username, password, client.getIdentifier(), sessionType, databaseKey)
		const { user, credentials, sessionId, userGroupInfo } = newSessionData
		await this.onPartialLoginSuccess(
			{
				user,
				userGroupInfo,
				sessionId,
				accessToken: credentials.accessToken,
				sessionType,
				loginUsername: username,
			},
			sessionType,
		)
		return newSessionData
	}

	addPostLoginAction(handler: lazy<Promise<PostLoginAction>>) {
		this.postLoginActions.push(handler)
	}

	async onPartialLoginSuccess(initData: UserControllerInitData, sessionType: SessionType): Promise<void> {
		const { initUserController } = await import("./UserController")
		this.userController = await initUserController(initData)

		if (!isAdminClient()) {
			await this.loadCustomizations()
		}
		await this._determineIfWhitelabel()

		for (const lazyHandler of this.postLoginActions) {
			const handler = await lazyHandler()
			await handler.onPartialLoginSuccess({
				sessionType,
				userId: initData.user._id,
			})
		}
		this.atLeastPartiallyLoggedIn = true
		this.partialLogin.resolve()
	}

	async createExternalSession(
		userId: Id,
		password: string,
		salt: Uint8Array,
		kdfType: KdfType,
		clientIdentifier: string,
		sessionType: SessionType,
	): Promise<Credentials> {
		const persistentSession = sessionType === SessionType.Persistent
		const { user, credentials, sessionId, userGroupInfo } = await this.loginFacade.createExternalSession(
			userId,
			password,
			salt,
			kdfType,
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
				loginUsername: userId,
			},
			SessionType.Login,
		)
		return credentials
	}

	/**
	 * Resume an existing session using stored credentials, may or may not unlock a persistent local database
	 * @param unencryptedCredentials The stored credentials and optional database key for the offline db
	 * @param externalUserKeyDeriver The KDF type and salt to resume a session
	 * @param offlineTimeRangeDate the user configured time range for their offline storage, used to initialize the offline db
	 */
	async resumeSession(
		unencryptedCredentials: UnencryptedCredentials,
		externalUserKeyDeriver?: ExternalUserKeyDeriver | null,
		offlineTimeRangeDate?: Date | null,
	): Promise<ResumeSessionResult> {
		const { unencryptedToCredentials } = await import("../../misc/credentials/Credentials.js")
		const credentials = unencryptedToCredentials(unencryptedCredentials)
		const resumeResult = await this.loginFacade.resumeSession(
			credentials,
			externalUserKeyDeriver ?? null,
			unencryptedCredentials.databaseKey ?? null,
			offlineTimeRangeDate ?? null,
		)
		if (resumeResult.type === "error") {
			return resumeResult
		} else {
			const { user, userGroupInfo, sessionId } = resumeResult.data
			try {
				await this.onPartialLoginSuccess(
					{
						user,
						accessToken: credentials.accessToken,
						userGroupInfo,
						sessionId,
						sessionType: SessionType.Persistent,
						loginUsername: credentials.login,
					},
					SessionType.Persistent,
				)
			} catch (e) {
				// Some parts of initialization can fail and we should reset the state, both on this side and the worker
				// side, otherwise login cannot be attempted again
				console.log("Error finishing login, logging out now!", e)
				await this.logout(false)
				throw e
			}

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
		// Full login event might be received before we finish userLogin on the client side because they are done in parallel.
		// So we make sure to wait for userLogin first.
		await this.waitForPartialLogin()
		const loginListener = await this.loginListener()
		return loginListener.waitForFullLogin()
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

	// This also exists in CustomerFacade. It's duplicated because delegating to CustomerFacade
	// would change this API to return Promise<boolean>, breaking all consumers of this function.
	isEnabled(feature: FeatureType): boolean {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false
	}

	async loadCustomizations(cacheMode: CacheMode = CacheMode.ReadAndWrite): Promise<void> {
		this.customizations = await this.customerFacade.loadCustomizations(cacheMode)
	}

	/**
	 * Reset login state, delete session, if not {@link SessionType.Persistent}.
	 * @param sync whether to try and close the session before the window is closed
	 */
	async logout(sync: boolean): Promise<void> {
		// make all parts of LoginController usable for another login
		if (this.userController) {
			await this.userController.deleteSession(sync)
		} else {
			console.log("No session to delete")
		}
		// Using this over LoginFacade.resetSession() to reset all app state that might have been already bound to
		// a user on the worker side.
		await this.resetAppState()
		this.userController = null
		this.partialLogin = defer()
		this.fullyLoggedIn = false
		const loginListener = await this.loginListener()
		loginListener.reset()
		this.init()
	}

	async _determineIfWhitelabel(): Promise<void> {
		this._isWhitelabel = await this.getUserController().isWhitelabelAccount()
	}

	isWhitelabel(): boolean {
		return this._isWhitelabel
	}

	/**
	 * Deletes the session on the server.
	 * @param credentials
	 * @param pushIdentifier identifier associated with this device, if any, to delete PushIdentifier on the server
	 */
	async deleteOldSession(credentials: UnencryptedCredentials, pushIdentifier: string | null = null): Promise<void> {
		try {
			await this.loginFacade.deleteSession(credentials.accessToken, pushIdentifier)
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("session already deleted")
			} else {
				throw e
			}
		}
	}

	async retryAsyncLogin() {
		const loginListener = await this.loginListener()
		loginListener.onRetryLogin()
		await this.loginFacade.retryAsyncLogin()
	}
}

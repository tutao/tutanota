import type { DeferredObject, lazy, lazyAsync } from "@tutao/tutanota-utils"
import { assertNotNull, defer } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../common/Env"
import type { UserController, UserControllerInitData } from "./UserController"
import { getWhitelabelCustomizations } from "../../../common/misc/WhitelabelCustomizations"
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
	private customizations: NumberString[] | null = null
	private partialLogin: DeferredObject<void> = defer()
	private _isWhitelabel: boolean = !!getWhitelabelCustomizations(window)
	private postLoginActions: Array<lazy<Promise<PostLoginAction>>> = []
	private fullyLoggedIn: boolean = false
	private atLeastPartiallyLoggedIn: boolean = false

	constructor(private readonly loginFacade: LoginFacade, private readonly loginListener: lazyAsync<PageContextLoginListener>) {}

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

		await this.loadCustomizations()
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
	 * @param offlineTimeRangeDays the user configured time range for their offline storage, used to initialize the offline db
	 */
	async resumeSession(
		unencryptedCredentials: UnencryptedCredentials,
		externalUserKeyDeriver?: ExternalUserKeyDeriver | null,
		offlineTimeRangeDays?: number | null,
	): Promise<ResumeSessionResult> {
		const { unencryptedToCredentials } = await import("../../misc/credentials/Credentials.js")
		const credentials = unencryptedToCredentials(unencryptedCredentials)
		const resumeResult = await this.loginFacade.resumeSession(
			credentials,
			externalUserKeyDeriver ?? null,
			unencryptedCredentials.databaseKey ?? null,
			offlineTimeRangeDays ?? null,
		)
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
					loginUsername: credentials.login,
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
			const loginListener = await this.loginListener()
			loginListener.reset()
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

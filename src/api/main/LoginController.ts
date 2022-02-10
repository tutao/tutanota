import type {DeferredObject} from "@tutao/tutanota-utils"
import {assertNotNull, defer, remove} from "@tutao/tutanota-utils"
import {assertMainOrNodeBoot, getHttpOrigin} from "../common/Env"
import type {IUserController, UserControllerInitData} from "./UserController"
import {getWhitelabelCustomizations} from "../../misc/WhitelabelCustomizations"
import {NotFoundError} from "../common/error/RestError"
import {client} from "../../misc/ClientDetector"
import type {LoginFacade} from "../worker/facades/LoginFacade"
import type {Credentials} from "../../misc/credentials/Credentials"
import {FeatureType} from "../common/TutanotaConstants";
import {CredentialsAndDatabaseKey} from "../../misc/credentials/CredentialsProvider"
import {SessionType} from "../common/SessionType"

assertMainOrNodeBoot()

export interface LoginEventHandler {
	onLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void>
}

export type LoggedInEvent = {
	readonly sessionType: SessionType
}

export interface LoginController {
	createSession(username: string, password: string, sessionType: SessionType, databaseKey?: Uint8Array | null): Promise<Credentials>

	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, sessionType: SessionType): Promise<Credentials>

	resumeSession(credentials: CredentialsAndDatabaseKey, externalUserSalt?: Uint8Array): Promise<void>

	isUserLoggedIn(): boolean

	waitForUserLogin(): Promise<void>

	isInternalUserLoggedIn(): boolean

	isGlobalAdminUserLoggedIn(): boolean

	getUserController(): IUserController

	isProdDisabled(): boolean

	isEnabled(feature: FeatureType): boolean

	isWhitelabel(): boolean

	logout(sync: boolean): Promise<void>

	deleteOldSession(credentials: Credentials): Promise<void>

	registerHandler(handler: LoginEventHandler): void

	unregisterHandler(handler: LoginEventHandler): void
}

export class LoginControllerImpl implements LoginController {
	private _userController: IUserController | null = null
	customizations: NumberString[] | null = null
	waitForLogin: DeferredObject<void> = defer()
	private _isWhitelabel: boolean = !!getWhitelabelCustomizations(window)
	private _loginEventHandlers: Array<LoginEventHandler> = []

	async _getLoginFacade(): Promise<LoginFacade> {
		const {locator} = await import("./MainLocator")
		await locator.initialized
		const worker = locator.worker
		await worker.initialized
		return locator.loginFacade
	}

	async createSession(username: string, password: string, sessionType: SessionType, databaseKey: Uint8Array | null): Promise<Credentials> {
		const loginFacade = await this._getLoginFacade()
		const {user, credentials, sessionId, userGroupInfo} = await loginFacade.createSession(
			username,
			password,
			client.getIdentifier(),
			sessionType,
			databaseKey
		)
		await this.onLoginSuccess(
			{
				user,
				userGroupInfo,
				sessionId,
				accessToken: credentials.accessToken,
				persistentSession: sessionType === SessionType.Persistent,
			},
			sessionType,
		)
		return credentials
	}

	registerHandler(handler: LoginEventHandler) {
		this._loginEventHandlers.push(handler)
	}

	unregisterHandler(handler: LoginEventHandler) {
		remove(this._loginEventHandlers, handler)
	}

	async onLoginSuccess(initData: UserControllerInitData, sessionType: SessionType): Promise<void> {
		const {initUserController} = await import("./UserController")
		this._userController = await initUserController(initData)
		await this.loadCustomizations()
		await this._determineIfWhitelabel()

		for (const handler of this._loginEventHandlers) {
			await handler.onLoginSuccess({
				sessionType,
			})
		}

		this.waitForLogin.resolve()
	}

	async createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, sessionType: SessionType): Promise<Credentials> {
		const loginFacade = await this._getLoginFacade()
		const persistentSession = sessionType === SessionType.Persistent
		const {
			user,
			credentials,
			sessionId,
			userGroupInfo
		} = await loginFacade.createExternalSession(userId, password, salt, clientIdentifier, persistentSession)
		await this.onLoginSuccess(
			{
				user,
				accessToken: credentials.accessToken,
				persistentSession,
				sessionId,
				userGroupInfo,
			},
			SessionType.Login,
		)
		return credentials
	}

	async resumeSession({credentials, databaseKey}: CredentialsAndDatabaseKey, externalUserSalt?: Uint8Array): Promise<void> {
		const loginFacade = await this._getLoginFacade()
		const {user, userGroupInfo, sessionId} = await loginFacade.resumeSession(credentials, externalUserSalt ?? null, databaseKey ?? null)
		await this.onLoginSuccess(
			{
				user,
				accessToken: credentials.accessToken,
				userGroupInfo,
				sessionId,
				persistentSession: true,
			},
			SessionType.Persistent,
		)
	}

	isUserLoggedIn(): boolean {
		return this._userController != null
	}

	waitForUserLogin(): Promise<void> {
		return this.waitForLogin.promise
	}

	isInternalUserLoggedIn(): boolean {
		return this.isUserLoggedIn() && this.getUserController().isInternalUser()
	}

	isGlobalAdminUserLoggedIn(): boolean {
		return this.isUserLoggedIn() && this.getUserController().isGlobalAdmin()
	}

	getUserController(): IUserController {
		return assertNotNull(this._userController) // only to be used after login (when user is defined)
	}

	isProdDisabled(): boolean {
		// we enable certain features only for certain customers in prod
		return (
			getHttpOrigin().startsWith("https://mail.tutanota") &&
			this._userController != null &&
			this._userController.user.customer !== "Kq3X5tF--7-0" &&
			this._userController.user.customer !== "Jwft3IR--7-0"
		)
	}

	isEnabled(feature: FeatureType): boolean {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false
	}

	loadCustomizations(): Promise<void> {
		if (this.isInternalUserLoggedIn()) {
			return this.getUserController()
					   .loadCustomer()
					   .then(customer => {
						   this.customizations = customer.customizations.map(f => f.feature)
					   })
		} else {
			return Promise.resolve()
		}
	}

	async logout(sync: boolean): Promise<void> {
		if (this._userController) {
			await this._userController.deleteSession(sync)
			this._userController = null
			this.waitForLogin = defer()
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
		const loginFacade = await this._getLoginFacade()

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
}

export const logins: LoginController = new LoginControllerImpl()
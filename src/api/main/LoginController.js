//@flow
import type {DeferredObject} from "@tutao/tutanota-utils"
import {assertNotNull, defer} from "@tutao/tutanota-utils"
import {assertMainOrNodeBoot, getHttpOrigin} from "../common/Env"
import type {FeatureTypeEnum} from "../common/TutanotaConstants"
import type {IUserController, UserControllerInitData} from "./UserController"
import {getWhitelabelCustomizations} from "../../misc/WhitelabelCustomizations"
import {NotFoundError} from "../common/error/RestError"
import {remove} from "@tutao/tutanota-utils"
import {client} from "../../misc/ClientDetector"
import type {LoginFacade} from "../worker/facades/LoginFacade"
import type {Credentials} from "../../misc/credentials/Credentials"

assertMainOrNodeBoot()

export interface LoginEventHandler {
	onLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void>;
}

export const SessionType = Object.freeze({
	/* 'Regular' login session. */
	Login: "Login",
	/* Temporary session that will only be established for a short time, e.g. when recovering a lost account. */
	Temporary: "Temporary",
	/* Login session for which credentials should be stored on the device. */
	Persistent: "Persistent",
})
export type SessionTypeEnum = $Values<typeof SessionType>

export type LoggedInEvent = {|
	+sessionType: SessionTypeEnum,
|}

export interface LoginController {
	createSession(username: string,
	              password: string,
	              sessionType: SessionTypeEnum,
	): Promise<Credentials>;

	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, sessionType: SessionTypeEnum
	): Promise<Credentials>;

	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<void>;

	isUserLoggedIn(): boolean;

	waitForUserLogin(): Promise<LoggedInEvent>;

	isInternalUserLoggedIn(): boolean;

	isGlobalAdminUserLoggedIn(): boolean;

	getUserController(): IUserController;

	isProdDisabled(): boolean;

	isEnabled(feature: FeatureTypeEnum): boolean;

	isWhitelabel(): boolean;

	logout(sync: boolean): Promise<void>;

	deleteOldSession(credentials: Credentials): Promise<void>;

	registerHandler(handler: LoginEventHandler): void;

	unregisterHandler(handler: LoginEventHandler): void;

}

export class LoginControllerImpl implements LoginController {
	_userController: ?IUserController
	customizations: ?NumberString[]
	waitForLogin: DeferredObject<LoggedInEvent> = defer()
	_isWhitelabel: boolean = !!getWhitelabelCustomizations(window)
	_loginEventHandlers: Array<LoginEventHandler> = []

	async _getLoginFacade(): Promise<LoginFacade> {
		const locatorModule = await import("./MainLocator")
		const worker = await locatorModule.locator.initializedWorker
		await worker.initialized
		return locatorModule.locator.loginFacade
	}

	async createSession(
		username: string,
		password: string,
		sessionType: SessionTypeEnum,
	): Promise<Credentials> {
		const permanentLogin = sessionType !== SessionType.Temporary
		const persistentSession = sessionType === SessionType.Persistent
		const loginFacade = await this._getLoginFacade()
		const {
			user,
			credentials,
			sessionId,
			userGroupInfo
		} = await loginFacade.createSession(username, password, client.getIdentifier(), persistentSession, permanentLogin)
		await this._initUserController(
			{
				user,
				userGroupInfo,
				sessionId,
				accessToken: credentials.accessToken,
				persistentSession,
			},
			sessionType
		)
		return credentials
	}

	registerHandler(handler: LoginEventHandler) {
		this._loginEventHandlers.push(handler)
	}

	unregisterHandler(handler: LoginEventHandler) {
		remove(this._loginEventHandlers, handler)
	}

	async _initUserController(initData: UserControllerInitData, sessionType: SessionTypeEnum): Promise<void> {
		const userControllerModule = await import("./UserController")
		this._userController = await userControllerModule.initUserController(initData)
		await this.loadCustomizations()
		await this._determineIfWhitelabel()
		for (const handler of this._loginEventHandlers) {
			await handler.onLoginSuccess({sessionType})
		}
		this.waitForLogin.resolve({sessionType})
	}

	async createExternalSession(
		userId: Id,
		password: string,
		salt: Uint8Array,
		clientIdentifier: string,
		sessionType: SessionTypeEnum,
	): Promise<Credentials> {
		const worker = await this._getLoginFacade()
		const persistentSession = sessionType === SessionType.Persistent
		const {
			user,
			credentials,
			sessionId,
			userGroupInfo
		} = await worker.createExternalSession(userId, password, salt, clientIdentifier, persistentSession)
		await this._initUserController(
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

	async resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<void> {
		const loginFacade = await this._getLoginFacade()
		const {user, userGroupInfo, sessionId} = await loginFacade.resumeSession(credentials, externalUserSalt)
		await this._initUserController(
			{
				user,
				accessToken: credentials.accessToken,
				userGroupInfo,
				sessionId,
				persistentSession: true
			},
			SessionType.Persistent,
		)
	}

	isUserLoggedIn(): boolean {
		return this._userController != null
	}

	waitForUserLogin(): Promise<LoggedInEvent> {
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
		return getHttpOrigin().startsWith("https://mail.tutanota")
			&& this._userController != null
			&& this._userController.user.customer !== 'Kq3X5tF--7-0'
			&& this._userController.user.customer !== 'Jwft3IR--7-0'
	}

	isEnabled(feature: FeatureTypeEnum): boolean {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false
	}

	loadCustomizations(): Promise<void> {
		if (this.isInternalUserLoggedIn()) {
			return this.getUserController().loadCustomer().then(customer => {
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

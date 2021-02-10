//@flow
import {assertNotNull, defer} from "../common/utils/Utils"
import {assertMainOrNodeBoot, getHttpOrigin} from "../common/Env"
import type {FeatureTypeEnum} from "../common/TutanotaConstants"
import type {IUserController, UserControllerInitData} from "./UserController"
import type {WorkerClient} from "./WorkerClient"

assertMainOrNodeBoot()

export interface LoginController {
	createSession(username: string,
	              password: string,
	              clientIdentifier: string,
	              persistentSession: boolean,
	              permanentLogin: boolean
	): Promise<Credentials>;

	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, persistentSession: boolean
	): Promise<Credentials>;

	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<void>;

	isUserLoggedIn(): boolean;

	waitForUserLogin(): Promise<void>;

	loginComplete(): void;

	isInternalUserLoggedIn(): boolean;

	isGlobalAdminUserLoggedIn(): boolean;

	getUserController(): IUserController;

	isProdDisabled(): boolean;

	isEnabled(feature: FeatureTypeEnum): boolean;

	isEnabled(feature: FeatureTypeEnum): boolean;

	loadCustomizations(): Promise<void>;

	logout(sync: boolean): Promise<void>;
}

export class LoginControllerImpl implements LoginController {
	_userController: ?IUserController
	customizations: ?NumberString[]
	waitForLogin: {resolve: Function, reject: Function, promise: Promise<void>} = defer()

	_getWorker(): Promise<WorkerClient> {
		return import("./MainLocator")
			.then(locatorModule => locatorModule.locator.initializedWorker)
	}

	createSession(username: string, password: string, clientIdentifier: string, persistentSession: boolean, permanentLogin: boolean): Promise<Credentials> {
		return this._getWorker()
		           .then((worker) => worker.createWorkerSession(username, password, clientIdentifier, persistentSession, permanentLogin))
		           .tap(({user, credentials, sessionId, userGroupInfo}) => {
			           return this._initUserController({
				           user,
				           accessToken: credentials.accessToken,
				           persistentSession,
				           permanentLogin,
				           sessionId,
				           userGroupInfo
			           })
		           })
		           .then((loginData) => loginData.credentials)
	}

	_initUserController(initData: UserControllerInitData): Promise<void> {
		return import("./UserController")
			.then((userControllerModule) => userControllerModule.initUserController(initData))
			.then((userController) => this.setUserController(userController))
	}

	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, persistentSession: boolean
	): Promise<Credentials> {
		return this._getWorker()
		           .then((worker) => worker.createExternalSession(userId, password, salt, clientIdentifier, persistentSession))
		           .tap(({user, credentials, sessionId, userGroupInfo}) => {
			           return this._initUserController({
				           user,
				           accessToken: credentials.accessToken,
				           persistentSession,
				           sessionId,
				           userGroupInfo
			           })
		           })
		           .then((loginData) => loginData.credentials)
	}

	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<void> {
		return this._getWorker()
		           .then((worker) => worker.resumeSession(credentials, externalUserSalt))
		           .then(({user, userGroupInfo, sessionId}) => {
			           return this._initUserController({
				           user,
				           accessToken: credentials.accessToken,
				           userGroupInfo,
				           sessionId,
				           persistentSession: true
			           })
		           })
	}

	isUserLoggedIn(): boolean {
		return this._userController != null
	}

	waitForUserLogin(): Promise<void> {
		return this.waitForLogin.promise
	}

	loginComplete(): void {
		this.waitForLogin.resolve()
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

	setUserController(userController: ?IUserController): void {
		this._userController = userController
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

	logout(sync: boolean): Promise<void> {
		if (this._userController) {
			return this._userController.deleteSession(sync).then(() => {
				this.setUserController(null)
			})
		} else {
			console.log("No session to delete")
			return Promise.resolve()
		}
	}

}

export const logins: LoginController = new LoginControllerImpl()

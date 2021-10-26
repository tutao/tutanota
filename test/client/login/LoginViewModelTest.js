// @flow
import o from "ospec"
import {DisplayMode, LoginState, LoginViewModel} from "../../../src/login/LoginViewModel"
import type {LoginController} from "../../../src/api/main/LoginController"
import {SessionType} from "../../../src/api/main/LoginController"
import nodemocker, {MockBuilder, spyify} from "../nodemocker"
import {assertNotNull, downcast, noOp} from "@tutao/tutanota-utils"
import {createUser} from "../../../src/api/entities/sys/User"
import type {IUserController} from "../../../src/api/main/UserController"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import {AccessExpiredError, NotAuthenticatedError} from "../../../src/api/common/error/RestError"
import {SecondFactorHandler} from "../../../src/misc/SecondFactorHandler"
import {assertThrows} from "@tutao/tutanota-test-utils"
import type {CredentialsInfo, ICredentialsProvider, PersistentCredentials} from "../../../src/misc/credentials/CredentialsProvider"
import {KeyPermanentlyInvalidatedError} from "../../../src/api/common/error/KeyPermanentlyInvalidatedError"
import {CredentialAuthenticationError} from "../../../src/api/common/error/CredentialAuthenticationError"
import type {Credentials} from "../../../src/misc/credentials/Credentials"

class CredentialsProviderStub implements ICredentialsProvider {
	credentials = new Map<string, PersistentCredentials>()

	async getCredentialsInfoByUserId(userId: Id): Promise<CredentialsInfo | null> {
		const persistentCredentials = this.credentials.get(userId)
		return persistentCredentials?.credentialInfo ?? null
	}

	async getCredentialsByUserId(userId: string) {
		const storedCredentials = this.credentials.get(userId)
		if (!storedCredentials) return null
		return {
			userId: storedCredentials.credentialInfo.userId,
			login: storedCredentials.credentialInfo.login,
			type: storedCredentials.credentialInfo.type,
			accessToken: storedCredentials.accessToken,
			encryptedPassword: storedCredentials.encryptedPassword,
		}
	}

	async store(credentials: Credentials) {
		this.credentials.set(credentials.userId,
			{
				credentialInfo: {
					userId: credentials.userId,
					login: credentials.login,
					type: credentials.type
				},
				accessToken: credentials.accessToken,
				encryptedPassword: assertNotNull(credentials.encryptedPassword)
			})
	}

	async deleteByUserId(userId: string) {
		this.credentials.delete(userId)
	}

	async getInternalCredentialsInfos() {
		return Array.from(this.credentials.values()).map(persistentCredentials => persistentCredentials.credentialInfo)
	}

	async getCredentialsInfos() {
		throw new Error("Not implemented in stub")
	}

	getCredentialsEncryptionMode() {
		throw new Error("stub!")
	}

	async setCredentialsEncryptionMode() {
	}

	async getSupportedEncryptionModes() {
		return []
	}

	async clearCredentials() {
		this.credentials = new Map()
	}
}

o.spec("LoginViewModelTest", () => {
	const encryptedTestCredentials: PersistentCredentials = Object.freeze({
			credentialInfo: {
				userId: "user-id-1",
				login: "test@example.com",
				type: "internal"
			},
			encryptedPassword: "encryptedPassword",
			accessToken: "accessToken",
		}
	)
	const testCredentials: Credentials = Object.freeze({
			userId: "user-id-1",
			login: "test@example.com",
			encryptedPassword: "encryptedPassword",
			accessToken: "accessToken",
			type: "internal"
		}
	)
	let loginControllerBuilder: MockBuilder<LoginController>
	let credentialsProvider: ICredentialsProvider
	let secondFactorHandler: SecondFactorHandler

	o.beforeEach(() => {
		loginControllerBuilder = createLoginController()
		credentialsProvider = spyify(new CredentialsProviderStub())
		secondFactorHandler = nodemocker.mock("second", {
			closeWaitingForSecondFactorDialog: noOp
		}).set()
	})

	async function createViewModel({loginController}: {loginController: LoginController}) {
		const viewModel = new LoginViewModel(loginController, credentialsProvider, secondFactorHandler)
		await viewModel.init()
		return viewModel
	}

	function createLoginController(): MockBuilder<LoginController> {
		const userController = nodemocker.mock("userController", {
			user: createUser(),
			userGroupInfo: createGroupInfo({
				mailAddress: "test@example.com"
			})
		}).set()
		return nodemocker.mock("Hi Mom", {
			async resumeSession() {
				return {}
			},
			async loadCustomizations() {
			},
			getUserController(): IUserController {
				return userController;
			},
			async deleteOldSession() {

			},
		})
	}

	o.spec("Display mode transitions", function () {
		o("Should switch to form mode if no stored credentials can be found", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			await viewModel.useUserId(testCredentials.userId)

			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("Should switch to credentials mode if stored credentials can be found", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			downcast<CredentialsProviderStub>(credentialsProvider).store(testCredentials)
			await viewModel.useUserId(testCredentials.userId)

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to form mode if stored credentials cannot be found", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			await viewModel.useUserId(testCredentials.userId)

			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("Should switch to credentials mode if credentials are set", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})
			credentialsProvider.store(testCredentials)

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to credentials mode", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			viewModel.displayMode = DisplayMode.DeleteCredentials

			viewModel.switchDeleteState()

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to delete credentials mode", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			viewModel.displayMode = DisplayMode.Credentials

			viewModel.switchDeleteState()

			o(viewModel.displayMode).equals(DisplayMode.DeleteCredentials)
		})

		o("Should throw if in invalid state", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			viewModel.displayMode = DisplayMode.Form

			await assertThrows(Error, async () => {
				await viewModel.switchDeleteState()
			})
		})
	})

	o.spec("deleteCredentials", function() {
		o("Should switch to form mode if last stored credential is deleted", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			await credentialsProvider.store(testCredentials)
			viewModel.displayMode = DisplayMode.Credentials

			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)

			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("Should handle CredentialAuthenticationError", async function() {
			await credentialsProvider.store(testCredentials)
			downcast(credentialsProvider).getCredentialsByUserId = () => {
				throw new CredentialAuthenticationError("test")
			}
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})
			viewModel.displayMode = DisplayMode.DeleteCredentials

			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)

			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.DeleteCredentials)
			o(viewModel.getSavedCredentials()).deepEquals([encryptedTestCredentials.credentialInfo])
			o(credentialsProvider.clearCredentials.callCount).equals(0)
		})

		o("Should handle KeyPermanentlyInvalidatedError", async function() {
			await credentialsProvider.store(testCredentials)
			downcast(credentialsProvider).getCredentialsByUserId = () => {
				throw new KeyPermanentlyInvalidatedError("test")
			}
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})
			viewModel.displayMode = DisplayMode.DeleteCredentials

			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)

			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			o(viewModel.getSavedCredentials()).deepEquals([])
			o(credentialsProvider.clearCredentials.callCount).equals(1)
		})
	})

	o.spec("Login with stored credentials", function () {
		o("login should succeed with valid stored credentials", async function () {
			const loginController = loginControllerBuilder.set()
			credentialsProvider.store(testCredentials)
			const viewModel = await createViewModel({loginController})

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.LoggedIn)
		})

		o("login should succeed with valid stored credentials in DeleteCredentials display mode", async function () {
			const loginController = loginControllerBuilder.set()
			credentialsProvider.store(testCredentials)
			const viewModel = await createViewModel({loginController})

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			viewModel.switchDeleteState()

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.LoggedIn)
		})

		o("login should fail with invalid stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async resumeSession() {
					throw new NotAuthenticatedError("test")
				},
			}).set()
			await credentialsProvider.store(testCredentials)
			const viewModel = await createViewModel({loginController})


			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			o(await credentialsProvider.getCredentialsInfoByUserId(testCredentials.userId)).equals(null)
			o(viewModel.getSavedCredentials()).deepEquals([])
			o(viewModel._autoLoginCredentials).deepEquals(null)
		})

		o("login should fail for expired stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async resumeSession() {
					throw new AccessExpiredError("test")
				},
			}).set()
			await credentialsProvider.store(testCredentials)
			const viewModel = await createViewModel({loginController})

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.AccessExpired)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("should handle KeyPermanentlyInvalidatedError and clear credentials", async function () {
			await credentialsProvider.store(testCredentials)
			downcast(credentialsProvider).getCredentialsByUserId = () => {
				throw new KeyPermanentlyInvalidatedError("test")
			}
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController: loginController})

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)

			await viewModel.login()

			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			o(viewModel.getSavedCredentials()).deepEquals([])
			o(credentialsProvider.clearCredentials.callCount).equals(1)
		})
	})

	o.spec("Login with email and password", function () {
		const credentialsWithoutPassword: Credentials = {
			login: testCredentials.login,
			encryptedPassword: null,
			accessToken: testCredentials.accessToken,
			userId: testCredentials.userId,
			type: "internal"
		}
		const password = "password"

		o("should login and not store password", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([testCredentials.login, password, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(await credentialsProvider.getCredentialsByUserId(testCredentials.userId)).equals(null)
		})

		o("should login and store password", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return testCredentials
				}
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([testCredentials.login, password, SessionType.Persistent])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(await credentialsProvider.getCredentialsByUserId(testCredentials.userId)).deepEquals(testCredentials)
		})

		o("should login and overwrite existing stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return testCredentials
				}
			}).set()
			const oldCredentials = {
				login: testCredentials.login,
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				userId: testCredentials.userId,
				type: "internal",
			}
			credentialsProvider.store(oldCredentials)
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([testCredentials.login, password, SessionType.Persistent])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(await credentialsProvider.getCredentialsByUserId(testCredentials.userId)).deepEquals(testCredentials)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials])
		})

		o("should login and delete old stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const oldCredentials = {
				login: credentialsWithoutPassword.login,
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				userId: credentialsWithoutPassword.userId,
				type: "internal",
			}
			credentialsProvider.store(oldCredentials)
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.login, password, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(await credentialsProvider.getCredentialsByUserId(credentialsWithoutPassword.userId)).deepEquals(null)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials])
		})

		o("should login and delete old stored credentials with same email address but different user id", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const oldCredentials = {
				login: credentialsWithoutPassword.login,
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				userId: "anotherUserId",
				type: "internal",
			}
			await credentialsProvider.store(oldCredentials)
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.login, password, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(await credentialsProvider.getCredentialsByUserId(credentialsWithoutPassword.userId)).deepEquals(null)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials])
		})

		o("Should throw if login controller throws", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					throw new Error("")
				}
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)

			await assertThrows(Error, async () => {
				await viewModel.login()
			})
			o(viewModel.state).equals(LoginState.UnknownError)
		})

		o("should handle KeyPermanentlyInvalidatedError and clear credentials", async function () {
			await credentialsProvider.store(testCredentials)
			downcast(credentialsProvider).store = () => {
				throw new KeyPermanentlyInvalidatedError("test")
			}
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return testCredentials
				}
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(viewModel.state).equals(LoginState.LoggedIn)
			o(viewModel.getSavedCredentials()).deepEquals([])
			o(credentialsProvider.clearCredentials.callCount).equals(1)
		})
	})
})
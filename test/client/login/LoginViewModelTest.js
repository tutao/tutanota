// @flow
import o from "ospec"
import {DisplayMode, LoginState, LoginViewModel} from "../../../src/login/LoginViewModel"
import type {LoginController} from "../../../src/api/main/LoginController"
import {SessionType} from "../../../src/api/main/LoginController"
import nodemocker, {MockBuilder} from "../nodemocker"
import {downcast, noOp} from "../../../src/api/common/utils/Utils"
import {createUser} from "../../../src/api/entities/sys/User"
import type {IUserController} from "../../../src/api/main/UserController"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import {AccessExpiredError, NotAuthenticatedError} from "../../../src/api/common/error/RestError"
import {SecondFactorHandler} from "../../../src/misc/SecondFactorHandler"
import {assertThrows} from "../../api/TestUtils"
import {CredentialsProvider} from "../../../src/misc/credentials/CredentialsProvider"

class CredentialsProviderStub {
	credentials = new Map<string, Credentials>()

	getCredentialsByUserId(userId: string) {
		return this.credentials.get(userId) || null
	}

	store(credentials: Credentials) {
		this.credentials.set(credentials.userId, credentials)
	}

	deleteByUserId(userId: string) {
		this.credentials.delete(userId)
	}

	getAllInternal() {
		return Array.from(this.credentials.values())
	}
}

o.spec("LoginViewModelTest", () => {
	const testCredentials: Credentials = Object.freeze({
			userId: "user-id-1",
			mailAddress: "test@example.com",
			encryptedPassword: "encryptedPassword",
			accessToken: "accessToken",
			type: "internal"
		}
	)
	let loginControllerBuilder: MockBuilder<LoginController>
	let credentialsProvider: CredentialsProvider
	let secondFactorHandler: SecondFactorHandler

	o.beforeEach(() => {
		loginControllerBuilder = createLoginController()
		credentialsProvider = downcast<CredentialsProvider>(new CredentialsProviderStub())
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

			}
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

			viewModel.useCredentials(testCredentials)

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to form mode if last stored credential is deleted", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			await credentialsProvider.store(testCredentials)
			viewModel.displayMode = DisplayMode.Credentials

			await viewModel.deleteCredentials(testCredentials)

			o(viewModel.displayMode).equals(DisplayMode.Form)
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

	o.spec("Login with stored credentials", function () {
		o("login should succeed with valid stored credentials", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			viewModel.useCredentials(testCredentials)

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.LoggedIn)
		})

		o("login should succeed with valid stored credentials in DeleteCredentials display mode", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = await createViewModel({loginController})

			viewModel.useCredentials(testCredentials)
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
			const viewModel = await createViewModel({loginController})

			viewModel.useCredentials(testCredentials)

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("login should fail for expired stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async resumeSession() {
					throw new AccessExpiredError("test")
				},
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.useCredentials(testCredentials)

			await viewModel.login()

			o(loginController.resumeSession.args).deepEquals([testCredentials])
			o(viewModel.state).equals(LoginState.AccessExpired)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})
	})

	o.spec("Login with email and password", function () {
		const credentialsWithoutPassword: Credentials = {
			mailAddress: testCredentials.mailAddress,
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
			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([testCredentials.mailAddress, password, false, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(credentialsProvider.getCredentialsByUserId(testCredentials.userId)).equals(null)
		})

		o("should login and store password", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, true, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(credentialsProvider.getCredentialsByUserId(credentialsWithoutPassword.userId)).deepEquals(credentialsWithoutPassword)
		})

		o("should login and overwrite existing stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const oldCredentials = {
				mailAddress: credentialsWithoutPassword.mailAddress,
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				userId: credentialsWithoutPassword.userId,
				type: "internal",
			}
			credentialsProvider.store(oldCredentials)
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, true, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(credentialsProvider.getCredentialsByUserId(credentialsWithoutPassword.userId)).deepEquals(credentialsWithoutPassword)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials])
		})

		o("should login and delete old stored credentials", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const oldCredentials = {
				mailAddress: credentialsWithoutPassword.mailAddress,
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				userId: credentialsWithoutPassword.userId,
				type: "internal",
			}
			credentialsProvider.store(oldCredentials)
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, false, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(credentialsProvider.getCredentialsByUserId(credentialsWithoutPassword.userId)).deepEquals(null)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials])
		})

		o("should login and delete old stored credentials with same email address but different user id", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const oldCredentials = {
				mailAddress: credentialsWithoutPassword.mailAddress,
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				userId: "anotherUserId",
				type: "internal",
			}
			await credentialsProvider.store(oldCredentials)
			const viewModel = await createViewModel({loginController})

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, false, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(credentialsProvider.getCredentialsByUserId(credentialsWithoutPassword.userId)).deepEquals(null)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials])
		})

		o("Should throw if login controller throws", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					throw new Error("")
				}
			}).set()
			const viewModel = await createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)

			await assertThrows(Error, async () => {
				await viewModel.login()
			})
			o(viewModel.state).equals(LoginState.UnknownError)
		})
	})
})
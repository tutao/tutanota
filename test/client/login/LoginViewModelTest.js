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
import {DeviceConfig} from "../../../src/misc/DeviceConfig"
import {SecondFactorHandler} from "../../../src/misc/SecondFactorHandler"
import {assertThrows} from "../../api/TestUtils"

class DeviceConfigStub {
	credentials = new Map<string, Credentials>()

	getSavedCredentialsByMailAddress(mailAddress: string) {
		return this.credentials.get(mailAddress) || null
	}

	getSavedCredentialsByUserId(userId: string) {
		return this.credentials.get(userId) || null
	}

	set(credentials: Credentials) {
		this.credentials.set(credentials.mailAddress, credentials)
	}

	delete(mailAddress: string) {
		this.credentials.delete(mailAddress)
	}

	getAllInternal() {
		return Array.from(this.credentials.values())
	}
}

o.spec("LoginViewModelTest", () => {
	const testCredentials: Credentials = {
		userId: "user-id-1",
		mailAddress: "test@example.com",
		encryptedPassword: "encryptedPassword",
		accessToken: "accessToken"
	}

	let loginControllerBuilder: MockBuilder<LoginController>
	let deviceConfig: DeviceConfig
	let secondFactorHandler: SecondFactorHandler

	o.beforeEach(() => {
		loginControllerBuilder = createLoginController()
		deviceConfig = downcast<DeviceConfig>(new DeviceConfigStub())
		secondFactorHandler = nodemocker.mock("second", {
			closeWaitingForSecondFactorDialog: noOp
		}).set()
	})

	function createViewModel({loginController}: {loginController: LoginController}) {
		return new LoginViewModel(loginController, deviceConfig, secondFactorHandler)
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
		o("Should switch to form mode if no stored credentials can be found", function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.useUserId(testCredentials.userId)

			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("Should switch to credentials mode if stored credentials can be found", function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			downcast<DeviceConfigStub>(deviceConfig).credentials.set(testCredentials.userId, testCredentials)
			viewModel.useUserId(testCredentials.userId)

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to form mode if stored credentials cannot be found", function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.useUserId(testCredentials.userId)

			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("Should switch to credentials mode if credentials are set", function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.useCredentials(testCredentials)

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to form mode if last stored credential is deleted", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			deviceConfig.set(testCredentials)
			viewModel.displayMode = DisplayMode.Credentials

			await viewModel.deleteCredentials(testCredentials)

			o(viewModel.displayMode).equals(DisplayMode.Form)
		})

		o("Should switch to credentials mode", function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.displayMode = DisplayMode.DeleteCredentials

			viewModel.switchDeleteState()

			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})

		o("Should switch to delete credentials mode", function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.displayMode = DisplayMode.Credentials

			viewModel.switchDeleteState()

			o(viewModel.displayMode).equals(DisplayMode.DeleteCredentials)
		})

		o("Should throw if in invalid state", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.displayMode = DisplayMode.Form

			await assertThrows(Error, async () => {
				await viewModel.switchDeleteState()
			})
		})
	})

	o.spec("Login with stored credentials", function () {
		o("login should succeed with valid stored credentials", async function () {
			const loginController = loginControllerBuilder.set()
			const viewModel = createViewModel({loginController})

			viewModel.useCredentials(testCredentials)

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
			const viewModel = createViewModel({loginController})

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
			const viewModel = createViewModel({loginController})

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
			userId: testCredentials.userId
		}
		const password = "password"

		o("should login and not store password", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const viewModel = createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([testCredentials.mailAddress, password, false, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(deviceConfig.getSavedCredentialsByMailAddress(testCredentials.mailAddress)).equals(null)
		})

		o("should login and store password", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					return credentialsWithoutPassword
				}
			}).set()
			const viewModel = createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, true, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(deviceConfig.getSavedCredentialsByMailAddress(credentialsWithoutPassword.mailAddress)).deepEquals(credentialsWithoutPassword)
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
				userId: credentialsWithoutPassword.userId
			}
			deviceConfig.set(oldCredentials)
			const viewModel = createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, true, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(deviceConfig.getSavedCredentialsByMailAddress(credentialsWithoutPassword.mailAddress)).deepEquals(credentialsWithoutPassword)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials.accessToken])
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
				userId: credentialsWithoutPassword.userId
			}
			deviceConfig.set(oldCredentials)
			const viewModel = createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			o(loginController.createSession.args).deepEquals([credentialsWithoutPassword.mailAddress, password, false, SessionType.Login])
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(deviceConfig.getSavedCredentialsByMailAddress(credentialsWithoutPassword.mailAddress)).deepEquals(null)
			o(loginController.deleteOldSession.args).deepEquals([oldCredentials.accessToken])
		})

		o("Should throw if login controller throws", async function () {
			const loginController = loginControllerBuilder.with({
				async createSession(username, password, persistentSession, permanentLogin) {
					throw new Error("")
				}
			}).set()
			const viewModel = createViewModel({loginController})

			viewModel.mailAddress(credentialsWithoutPassword.mailAddress)
			viewModel.password(password)

			await assertThrows(Error, async () => {
				await viewModel.login()
			})
			o(viewModel.state).equals(LoginState.UnknownError)
		})
	})
})
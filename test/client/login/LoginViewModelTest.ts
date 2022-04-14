import o from "ospec"
import {DisplayMode, LoginState, LoginViewModel} from "../../../src/login/LoginViewModel"
import type {LoginController} from "../../../src/api/main/LoginController"
import {createUser} from "../../../src/api/entities/sys/TypeRefs.js"
import type {IUserController} from "../../../src/api/main/UserController"
import {createGroupInfo} from "../../../src/api/entities/sys/TypeRefs.js"
import {SecondFactorHandler} from "../../../src/misc/2fa/SecondFactorHandler"
import {assertThrows} from "@tutao/tutanota-test-utils"
import type {CredentialsAndDatabaseKey, ICredentialsProvider, PersistentCredentials,} from "../../../src/misc/credentials/CredentialsProvider"
import {KeyPermanentlyInvalidatedError} from "../../../src/api/common/error/KeyPermanentlyInvalidatedError"
import {CredentialAuthenticationError} from "../../../src/api/common/error/CredentialAuthenticationError"
import type {Credentials} from "../../../src/misc/credentials/Credentials"
import {SessionType} from "../../../src/api/common/SessionType.js";
import {instance, matchers, object, replace, verify, when} from "testdouble"
import {AccessExpiredError, NotAuthenticatedError} from "../../../src/api/common/error/RestError"
import {DatabaseKeyFactory} from "../../../src/misc/credentials/DatabaseKeyFactory"

const {anything} = matchers

/**
 * A mocked implementation of an ICredentialsProvider
 * It's easiest to have the mock still maintain an internal state
 * because there is expected to be some consistency between it's methods
 * and it's a pain to mock this correctly for any given test
 *
 * This isn't ideal because rehearsals and verifications might have an effect on the state, so it's not ideal when verifying calls to `store` (for example)
 * This means you should be careful when verifying it, but in general it works for most use cases
 */
function getCredentialsProviderStub(): ICredentialsProvider {
	const provider = object<ICredentialsProvider>()

	let credentials = new Map<string, PersistentCredentials>()

	when(provider.getCredentialsInfoByUserId(anything())).thenDo((userId) => {
		const persistentCredentials = credentials.get(userId)
		return persistentCredentials?.credentialInfo ?? null
	})

	when(provider.getCredentialsByUserId(anything())).thenDo(userId => {
		const storedCredentials = credentials.get(userId)
		if (!storedCredentials) return null
		return {
			credentials: {
				userId: storedCredentials.credentialInfo.userId,
				login: storedCredentials.credentialInfo.login,
				type: storedCredentials.credentialInfo.type,
				accessToken: storedCredentials.accessToken,
				encryptedPassword: storedCredentials.encryptedPassword,
			},
			databaseKey: storedCredentials.databaseKey
		}
	})

	when(provider.store(anything())).thenDo(({credentials: credential, databaseKey}) => {
		credentials.set(credential.userId, {
			credentialInfo: {
				userId: credential.userId,
				login: credential.login,
				type: credential.type,
			},
			accessToken: credential.accessToken,
			encryptedPassword: credential.encryptedPassword,
			databaseKey
		})
	})

	when(provider.deleteByUserId(anything())).thenDo(userId => {
		credentials.delete(userId)
	})

	when(provider.getInternalCredentialsInfos()).thenDo(() => {
		return Array.from(credentials.values()).map(persistentCredentials => persistentCredentials.credentialInfo)
	})

	when(provider.getSupportedEncryptionModes()).thenResolve([])

	when(provider.clearCredentials(anything())).thenDo(() => {
		credentials = new Map()
	})

	return provider
}

o.spec("LoginViewModelTest", () => {
	const encryptedTestCredentials: PersistentCredentials = Object.freeze({
		credentialInfo: {
			userId: "user-id-1",
			login: "test@example.com",
			type: "internal",
		},
		encryptedPassword: "encryptedPassword",
		accessToken: "accessToken",
		databaseKey: null
	})

	const testCredentials: Credentials = Object.freeze({
		userId: "user-id-1",
		login: "test@example.com",
		encryptedPassword: "encryptedPassword",
		accessToken: "accessToken",
		type: "internal",
	})

	let loginControllerMock: LoginController
	let credentialsProviderMock: ICredentialsProvider
	let secondFactorHandlerMock: SecondFactorHandler
	let databaseKeyFactory: DatabaseKeyFactory

	o.beforeEach(async () => {
		loginControllerMock = object<LoginController>()
		const userControllerMock = object<IUserController>()

		replace(userControllerMock, "user", createUser())
		replace(
			userControllerMock,
			"userGroupInfo",
			createGroupInfo({
				mailAddress: "test@example.com",
			})
		)

		when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

		credentialsProviderMock = getCredentialsProviderStub()

		secondFactorHandlerMock = instance(SecondFactorHandler)
		databaseKeyFactory = instance(DatabaseKeyFactory)
	})

	/**
	 * viewModel.init() relies on some state of the credentials provider, which maight need to be mocked differently
	 * on a per test basis, so instead of having a global viewModel to test we just have a factory function to get one in each test
	 */
	async function getViewModel() {
		const viewModel = new LoginViewModel(loginControllerMock, credentialsProviderMock, secondFactorHandlerMock, databaseKeyFactory)
		await viewModel.init()
		return viewModel
	}

	o.spec("Display mode transitions", function () {
		o("Should switch to form mode if no stored credentials can be found", async function () {
			const viewModel = await getViewModel()
			await viewModel.useUserId(testCredentials.userId)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})
		o("Should switch to credentials mode if stored credentials can be found", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			const viewModel = await getViewModel()
			await viewModel.useUserId(testCredentials.userId)
			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})
		o("Should switch to form mode if stored credentials cannot be found", async function () {

			const viewModel = await getViewModel()
			await viewModel.useUserId(testCredentials.userId)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})
		o("Should switch to credentials mode if credentials are set", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.displayMode).equals(DisplayMode.Credentials)
		})
		o("Should switch to credentials mode", async function () {
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.DeleteCredentials
			viewModel.switchDeleteState()
			o(viewModel.displayMode as DisplayMode).equals(DisplayMode.Credentials)
		})
		o("Should switch to delete credentials mode", async function () {
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.Credentials
			viewModel.switchDeleteState()
			o(viewModel.displayMode as DisplayMode).equals(DisplayMode.DeleteCredentials)
		})
		o("Should throw if in invalid state", async function () {
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.Form
			await assertThrows(Error, async () => {
				await viewModel.switchDeleteState()
			})
		})
	})
	o.spec("deleteCredentials", function () {
		o("Should switch to form mode if last stored credential is deleted", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.Credentials
			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.displayMode as DisplayMode).equals(DisplayMode.Form)
		})
		o("Should handle CredentialAuthenticationError", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			when(credentialsProviderMock.getCredentialsByUserId(testCredentials.userId)).thenReject(new CredentialAuthenticationError("test"))
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.DeleteCredentials
			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.DeleteCredentials)
			o(viewModel.getSavedCredentials()).deepEquals([encryptedTestCredentials.credentialInfo])
			verify(credentialsProviderMock.clearCredentials(anything()), {times: 0})
		})
		o("Should handle KeyPermanentlyInvalidatedError", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			when(credentialsProviderMock.getCredentialsByUserId(testCredentials.userId)).thenReject(new KeyPermanentlyInvalidatedError("test"))
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.DeleteCredentials
			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode as DisplayMode).equals(DisplayMode.Form)
			o(viewModel.getSavedCredentials()).deepEquals([])
			verify(credentialsProviderMock.clearCredentials(anything()), {times: 1})
		})
	})
	o.spec("Login with stored credentials", function () {
		o("login should succeed with valid stored credentials", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			verify(loginControllerMock.resumeSession({credentials: testCredentials, databaseKey: null}), {times: 1})
			o(viewModel.state).equals(LoginState.LoggedIn)
		})
		o("login should succeed with valid stored credentials in DeleteCredentials display mode", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			viewModel.switchDeleteState()
			await viewModel.login()
			verify(loginControllerMock.resumeSession({credentials: testCredentials, databaseKey: null}), {times: 1})
			o(viewModel.state).equals(LoginState.LoggedIn)
		})
		o("login should fail with invalid stored credentials", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			when(loginControllerMock.resumeSession(anything())).thenReject(new NotAuthenticatedError("test"))
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()

			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			verify(credentialsProviderMock.deleteByUserId(testCredentials.userId))
			o(viewModel.getSavedCredentials()).deepEquals([])
			o(viewModel._autoLoginCredentials).equals(null)
		})
		o("login should fail for expired stored credentials", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			when(loginControllerMock.resumeSession(anything())).thenReject(new AccessExpiredError("test"))
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.AccessExpired)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})
		o("should handle KeyPermanentlyInvalidatedError and clear credentials", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			when(credentialsProviderMock.getCredentialsByUserId(testCredentials.userId)).thenReject(new KeyPermanentlyInvalidatedError("oh no"))
			const viewModel = await getViewModel()


			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			o(viewModel.getSavedCredentials()).deepEquals([])
			verify(credentialsProviderMock.clearCredentials(anything()), {times: 1})
		})
	})
	o.spec("Login with email and password", function () {
		const credentialsWithoutPassword: Credentials = {
			login: testCredentials.login,
			encryptedPassword: null,
			accessToken: testCredentials.accessToken,
			userId: testCredentials.userId,
			type: "internal",
		}
		const password = "password"
		o("should login and not store password", async function () {

			const viewModel = await getViewModel()

			when(loginControllerMock.createSession(testCredentials.login, password, SessionType.Login, anything()))
				.thenResolve(credentialsWithoutPassword)

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			viewModel.savePassword(false)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(credentialsProviderMock.store({credentials: credentialsWithoutPassword, databaseKey: null}), {times: 0})
		})
		o("should login and store password", async function () {
			when(loginControllerMock.createSession(testCredentials.login, password, SessionType.Persistent, anything()))
				.thenResolve(testCredentials)

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(credentialsProviderMock.store({credentials: testCredentials, databaseKey: anything()}), {times: 1})
		})
		o("should login and overwrite existing stored credentials", async function () {
			const oldCredentials: CredentialsAndDatabaseKey = {
				credentials: {
					login: testCredentials.login,
					encryptedPassword: "encPw",
					accessToken: "oldAccessToken",
					userId: testCredentials.userId,
					type: "internal",
				},
				databaseKey: null
			}
			await credentialsProviderMock.store(oldCredentials)

			when(loginControllerMock.createSession(testCredentials.login, password, SessionType.Persistent, anything()))
				.thenResolve(testCredentials)

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(credentialsProviderMock.store({credentials: testCredentials, databaseKey: anything()}))
			verify(loginControllerMock.deleteOldSession(oldCredentials.credentials), {times: 1})
		})

		o.spec("Should clear old credentials on login", function () {

			const oldCredentials = Object.assign({}, credentialsWithoutPassword, {accessToken: "oldAccessToken", encryptedPassword: "encPw"})

			o("same address & same user id", async function () {
				await doTest(oldCredentials)
			})
			o("same address & different user id", async function () {
				await doTest(Object.assign({}, oldCredentials, {userId: "differentId"}))
			})
			o("different address & same user id", async function () {
				await doTest(Object.assign({}, oldCredentials, {login: "another@login.de"}))
			})

			async function doTest(oldCredentials) {
				when(loginControllerMock.createSession(credentialsWithoutPassword.login, password, SessionType.Login, anything())).thenResolve(credentialsWithoutPassword)
				await credentialsProviderMock.store({credentials: oldCredentials, databaseKey: null})
				const viewModel = await getViewModel()
				viewModel.showLoginForm()

				viewModel.mailAddress(credentialsWithoutPassword.login)
				viewModel.password(password)
				viewModel.savePassword(false)

				await viewModel.login()

				o(viewModel.state).equals(LoginState.LoggedIn)
				verify(credentialsProviderMock.deleteByUserId(oldCredentials.userId))
				verify(loginControllerMock.deleteOldSession(oldCredentials))
			}
		})

		o("Should throw if login controller throws", async function () {
			when(loginControllerMock.createSession(anything(), anything(), anything(), anything())).thenReject(new Error("oops"))

			const viewModel = await getViewModel()

			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			await assertThrows(Error, async () => {
				await viewModel.login()
			})
			o(viewModel.state).equals(LoginState.UnknownError)
		})
		o("should handle KeyPermanentlyInvalidatedError and clear credentials", async function () {
			await credentialsProviderMock.store({credentials: testCredentials, databaseKey: null})
			when(credentialsProviderMock.store({credentials: testCredentials, databaseKey: anything()})).thenReject(new KeyPermanentlyInvalidatedError("oops"))
			when(loginControllerMock.createSession(anything(), anything(), anything(), anything(),)).thenResolve(testCredentials)

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(viewModel.getSavedCredentials()).deepEquals([])
			verify(credentialsProviderMock.clearCredentials(anything()), {times: 1})
		})
		o("should be in error state if email address is empty", async function () {

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress("")
			viewModel.password("123")
			await viewModel.login()
			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.helpText).equals("loginFailed_msg")
			verify(loginControllerMock.createSession(anything(), anything(), anything(), anything(),), {times: 0})
		})
		o("should be in error state if password is empty", async function () {

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress("test@example.com")
			viewModel.password("")
			await viewModel.login()
			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.helpText).equals("loginFailed_msg")
			verify(loginControllerMock.createSession(anything(), anything(), anything(), anything(),), {times: 0})
		})
		o("should generate a new database key when starting a persistent session", async function () {
			const mailAddress = "test@example.com"
			const password = "mypassywordy"
			const newKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
			when(databaseKeyFactory.generateKey()).thenResolve(newKey)
			when(loginControllerMock.createSession(mailAddress, password, SessionType.Persistent, newKey)).thenResolve(testCredentials)

			const viewModel = await getViewModel()

			viewModel.mailAddress(mailAddress)
			viewModel.password(password)
			viewModel.savePassword(true)

			await viewModel.login()

			verify(credentialsProviderMock.store({credentials: testCredentials, databaseKey: newKey}))
		})
		o("should not generate a database key when starting a non persistent session", async function () {
			const mailAddress = "test@example.com"
			const password = "mypassywordy"

			when(loginControllerMock.createSession(mailAddress, password, SessionType.Login, null)).thenResolve(testCredentials)

			const viewModel = await getViewModel()

			viewModel.mailAddress(mailAddress)
			viewModel.password(password)
			viewModel.savePassword(false)

			await viewModel.login()

			verify(databaseKeyFactory.generateKey(), {times: 0})
		})
	})
})
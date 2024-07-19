import o from "@tutao/otest"
import { DisplayMode, isLegacyDomain, LoginState, LoginViewModel } from "../../../src/common/login/LoginViewModel.js"
import type { LoginController } from "../../../src/common/api/main/LoginController.js"
import { GroupInfoTypeRef, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import type { UserController } from "../../../src/common/api/main/UserController.js"
import { KeyPermanentlyInvalidatedError } from "../../../src/common/api/common/error/KeyPermanentlyInvalidatedError.js"
import { CredentialAuthenticationError } from "../../../src/common/api/common/error/CredentialAuthenticationError.js"
import { Credentials, credentialsToUnencrypted } from "../../../src/common/misc/credentials/Credentials.js"
import { SecondFactorHandler } from "../../../src/common/misc/2fa/SecondFactorHandler"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CredentialsProvider } from "../../../src/common/misc/credentials/CredentialsProvider.js"
import { SessionType } from "../../../src/common/api/common/SessionType.js"
import { instance, matchers, object, replace, verify, when } from "testdouble"
import { AccessExpiredError, NotAuthenticatedError } from "../../../src/common/api/common/error/RestError"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig"
import { ResumeSessionErrorReason } from "../../../src/common/api/worker/facades/LoginFacade"
import { Mode } from "../../../src/common/api/common/Env.js"
import { createTestEntity, domainConfigStub, textIncludes } from "../TestUtils.js"
import { CredentialRemovalHandler } from "../../../src/common/login/CredentialRemovalHandler.js"
import { NativePushServiceApp } from "../../../src/common/native/main/NativePushServiceApp.js"
import { PersistedCredentials } from "../../../src/common/native/common/generatedipc/PersistedCredentials.js"
import { CredentialType } from "../../../src/common/misc/credentials/CredentialType.js"
import { UnencryptedCredentials } from "../../../src/common/native/common/generatedipc/UnencryptedCredentials.js"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { AppLock } from "../../../src/common/login/AppLock.js"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"

const { anything } = matchers

/**
 * A mocked implementation of an ICredentialsProvider
 * It's easiest to have the mock still maintain an internal state
 * because there is expected to be some consistency between it's methods
 * and it's a pain to mock this correctly for any given test
 *
 * This isn't ideal because rehearsals and verifications might have an effect on the state, so it's not ideal when verifying calls to `store` (for example)
 * This means you should be careful when verifying it, but in general it works for most use cases
 */
function getCredentialsProviderStub(): CredentialsProvider {
	const provider = object<CredentialsProvider>()

	let credentials = new Map<string, PersistedCredentials>()

	when(provider.getCredentialsInfoByUserId(anything())).thenDo((async (userId) => {
		const persistentCredentials = credentials.get(userId)
		return persistentCredentials?.credentialInfo ?? null
	}) satisfies CredentialsProvider["getCredentialsInfoByUserId"])

	when(provider.getDecryptedCredentialsByUserId(anything())).thenDo((async (userId) => {
		const storedCredentials = credentials.get(userId)
		if (!storedCredentials) return null
		return {
			credentialInfo: {
				userId: storedCredentials.credentialInfo.userId,
				login: storedCredentials.credentialInfo.login,
				type: storedCredentials.credentialInfo.type,
			},
			accessToken: utf8Uint8ArrayToString(storedCredentials.accessToken),
			encryptedPassword: storedCredentials.encryptedPassword,
			encryptedPassphraseKey: storedCredentials.encryptedPassphraseKey,
			databaseKey: storedCredentials.databaseKey,
		}
	}) satisfies CredentialsProvider["getDecryptedCredentialsByUserId"])

	when(provider.store(anything())).thenDo((async (credential) => {
		credentials.set(credential.credentialInfo.userId, {
			credentialInfo: {
				userId: credential.credentialInfo.userId,
				login: credential.credentialInfo.login,
				type: credential.credentialInfo.type,
			},
			accessToken: stringToUtf8Uint8Array(credential.accessToken),
			encryptedPassword: credential.encryptedPassword,
			encryptedPassphraseKey: credential.encryptedPassphraseKey,
			databaseKey: credential.databaseKey,
		})
	}) satisfies CredentialsProvider["store"])

	when(provider.deleteByUserId(anything())).thenDo((async (userId) => {
		credentials.delete(userId)
	}) satisfies CredentialsProvider["deleteByUserId"])

	when(provider.getInternalCredentialsInfos()).thenDo((async () => {
		return Array.from(credentials.values()).map((persistentCredentials) => persistentCredentials.credentialInfo)
	}) satisfies CredentialsProvider["getInternalCredentialsInfos"])

	when(provider.getSupportedEncryptionModes()).thenResolve([])

	when(provider.clearCredentials(anything())).thenDo(() => {
		credentials = new Map()
	})

	return provider
}

o.spec("LoginViewModelTest", () => {
	const encryptedTestCredentials: PersistedCredentials = Object.freeze({
		credentialInfo: {
			userId: "user-id-1",
			login: "test@example.com",
			type: CredentialType.Internal,
		},
		encryptedPassword: "encryptedPassword",
		encryptedPassphraseKey: null,
		accessToken: stringToUtf8Uint8Array("accessToken"),
		databaseKey: null,
	} as const)

	const testCredentials: Credentials = Object.freeze({
		userId: "user-id-1",
		login: "test@example.com",
		encryptedPassword: "encryptedPassword",
		encryptedPassphraseKey: null,
		accessToken: "accessToken",
		type: CredentialType.Internal,
	})

	let loginControllerMock: LoginController
	let credentialsProviderMock: CredentialsProvider
	let secondFactorHandlerMock: SecondFactorHandler
	let deviceConfigMock: DeviceConfig
	let credentialRemovalHandler: CredentialRemovalHandler
	let pushServiceApp: NativePushServiceApp
	let appLock: AppLock

	o.beforeEach(async () => {
		loginControllerMock = object<LoginController>()
		const userControllerMock = object<UserController>()

		replace(userControllerMock, "user", createTestEntity(UserTypeRef))
		replace(
			userControllerMock,
			"userGroupInfo",
			createTestEntity(GroupInfoTypeRef, {
				mailAddress: "test@example.com",
			}),
		)

		when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

		credentialsProviderMock = getCredentialsProviderStub()
		secondFactorHandlerMock = instance(SecondFactorHandler)
		deviceConfigMock = instance(DeviceConfig)
		credentialRemovalHandler = object()
		pushServiceApp = object()
		appLock = object()
	})

	/**
	 * viewModel.init() relies on some state of the credentials provider, which maight need to be mocked differently
	 * on a per test basis, so instead of having a global viewModel to test we just have a factory function to get one in each test
	 */
	async function getViewModel() {
		const viewModel = new LoginViewModel(
			loginControllerMock,
			credentialsProviderMock,
			secondFactorHandlerMock,
			deviceConfigMock,
			domainConfigStub,
			credentialRemovalHandler,
			pushServiceApp,
			appLock,
		)
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
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
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
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
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
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.Credentials
			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.displayMode as DisplayMode).equals(DisplayMode.Form)
		})
		o("Should handle CredentialAuthenticationError", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(credentialsProviderMock.getDecryptedCredentialsByUserId(testCredentials.userId)).thenReject(new CredentialAuthenticationError("test"))
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.DeleteCredentials
			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.DeleteCredentials)
			o(viewModel.getSavedCredentials()).deepEquals([encryptedTestCredentials.credentialInfo])
			verify(credentialsProviderMock.clearCredentials(anything()), { times: 0 })
		})
		o("Should handle KeyPermanentlyInvalidatedError", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(credentialsProviderMock.getDecryptedCredentialsByUserId(testCredentials.userId)).thenReject(new KeyPermanentlyInvalidatedError("test"))
			const viewModel = await getViewModel()

			viewModel.displayMode = DisplayMode.DeleteCredentials
			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)
			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode as DisplayMode).equals(DisplayMode.Form)
			o(viewModel.getSavedCredentials()).deepEquals([])
			verify(credentialsProviderMock.clearCredentials(anything()), { times: 1 })
		})
		o("deletes push identifier", async function () {
			const viewModel = await getViewModel()
			viewModel.displayMode = DisplayMode.DeleteCredentials
			const pushIdentifier = "iAmPushIdentifier"
			const credentialsAndKey = credentialsToUnencrypted(testCredentials, null)
			await credentialsProviderMock.store(credentialsAndKey)
			when(pushServiceApp.loadPushIdentifierFromNative()).thenResolve(pushIdentifier)

			await viewModel.deleteCredentials(encryptedTestCredentials.credentialInfo)

			verify(credentialRemovalHandler.onCredentialsRemoved(credentialsAndKey.credentialInfo))
			verify(loginControllerMock.deleteOldSession(credentialsToUnencrypted(testCredentials, null), pushIdentifier))
		})
	})
	o.spec("Login with stored credentials", function () {
		const offlineTimeRangeDays = 42
		o.beforeEach(() => {
			when(deviceConfigMock.getOfflineTimeRangeDays(testCredentials.userId)).thenReturn(offlineTimeRangeDays)
		})
		o("login should succeed with valid stored credentials", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(loginControllerMock.resumeSession(credentialsToUnencrypted(testCredentials, null), null, offlineTimeRangeDays)).thenResolve({
				type: "success",
			})
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(appLock.enforce())
		})
		o("login should succeed with valid stored credentials in DeleteCredentials display mode", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(loginControllerMock.resumeSession(credentialsToUnencrypted(testCredentials, null), null, offlineTimeRangeDays)).thenResolve({
				type: "success",
			})
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			viewModel.switchDeleteState()
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
		})
		o("login should fail with invalid stored credentials", async function () {
			const credentialsAndKey = credentialsToUnencrypted(testCredentials, null)
			await credentialsProviderMock.store(credentialsAndKey)
			when(loginControllerMock.resumeSession(anything(), null, offlineTimeRangeDays)).thenReject(new NotAuthenticatedError("test"))
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()

			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			verify(credentialsProviderMock.deleteByUserId(testCredentials.userId))
			verify(credentialRemovalHandler.onCredentialsRemoved(credentialsAndKey.credentialInfo))
			o(viewModel.getSavedCredentials()).deepEquals([])
			o(viewModel.autoLoginCredentials).equals(null)
		})
		o("login should fail for expired stored credentials", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(loginControllerMock.resumeSession(anything(), null, offlineTimeRangeDays)).thenReject(new AccessExpiredError("test"))
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.AccessExpired)
			o(viewModel.displayMode).equals(DisplayMode.Form)
		})
		o("should handle KeyPermanentlyInvalidatedError and clear credentials", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(credentialsProviderMock.getDecryptedCredentialsByUserId(testCredentials.userId)).thenReject(new KeyPermanentlyInvalidatedError("oh no"))
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.NotAuthenticated)
			o(viewModel.displayMode).equals(DisplayMode.Form)
			o(viewModel.getSavedCredentials()).deepEquals([])
			verify(credentialsProviderMock.clearCredentials(anything()), { times: 1 })
		})
		o("should handle error result", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(loginControllerMock.resumeSession(credentialsToUnencrypted(testCredentials, null), null, offlineTimeRangeDays)).thenResolve({
				type: "error",
				reason: ResumeSessionErrorReason.OfflineNotAvailableForFree,
			})
			const viewModel = await getViewModel()

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.NotAuthenticated)
		})
		o("handles CredentialAuthenticationError", async () => {
			const unencryptedCredentials = credentialsToUnencrypted(testCredentials, null)
			await credentialsProviderMock.store(unencryptedCredentials)
			when(credentialsProviderMock.getDecryptedCredentialsByUserId(testCredentials.userId)).thenReject(new KeyPermanentlyInvalidatedError("oh no"))
			const viewModel = await getViewModel()
			when(appLock.enforce()).thenReject(new CredentialAuthenticationError("test"))

			await viewModel.useCredentials(encryptedTestCredentials.credentialInfo)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.UnknownError)
			o(viewModel.displayMode).equals(DisplayMode.Credentials)
			o(viewModel.getSavedCredentials()).deepEquals([unencryptedCredentials.credentialInfo])
			o(lang.getMaybeLazy(viewModel.helpText)).satisfies(textIncludes("test"))
		})
	})
	o.spec("Login with email and password", function () {
		const credentialsWithoutPassword: Credentials = {
			login: testCredentials.login,
			encryptedPassword: null,
			encryptedPassphraseKey: null,
			accessToken: testCredentials.accessToken,
			userId: testCredentials.userId,
			type: CredentialType.Internal,
		}
		const password = "password"
		o("should login and not store password", async function () {
			const viewModel = await getViewModel()

			when(loginControllerMock.createSession(testCredentials.login, password, SessionType.Login)).thenResolve({ credentials: credentialsWithoutPassword })

			viewModel.showLoginForm()
			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			viewModel.savePassword(false)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(credentialsProviderMock.store(matchers.anything()), { times: 0 })
		})
		o("should login and store password", async function () {
			when(loginControllerMock.createSession(testCredentials.login, password, SessionType.Persistent)).thenResolve({ credentials: testCredentials })

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(
				credentialsProviderMock.store(
					matchers.argThat((unencrypted: UnencryptedCredentials) => unencrypted.credentialInfo.login === testCredentials.login),
				),
				{ times: 1 },
			)
			verify(appLock.enforce())
		})
		o("should login and overwrite existing stored credentials", async function () {
			const oldCredentials: UnencryptedCredentials = {
				credentialInfo: {
					userId: testCredentials.userId,
					login: testCredentials.login,
					type: CredentialType.Internal,
				},
				encryptedPassword: "encPw",
				accessToken: "oldAccessToken",
				encryptedPassphraseKey: null,
				databaseKey: null,
			}
			await credentialsProviderMock.store(oldCredentials)
			when(loginControllerMock.createSession(testCredentials.login, password, SessionType.Persistent)).thenResolve({
				credentials: testCredentials,
				databaseKey: null,
			})

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			verify(credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null)))
			verify(loginControllerMock.deleteOldSession(oldCredentials), { times: 1 })
		})

		o.spec("Should clear old credentials on login", function () {
			const oldCredentials: Credentials = Object.assign({}, credentialsWithoutPassword, { accessToken: "oldAccessToken", encryptedPassword: "encPw" })

			o("same address & same user id", async function () {
				await doTest(oldCredentials)
			})
			o("same address & different user id", async function () {
				await doTest(Object.assign({}, oldCredentials, { userId: "differentId" }))
			})
			o("different address & same user id", async function () {
				await doTest(Object.assign({}, oldCredentials, { login: "another@login.de" }))
			})

			async function doTest(oldCredentials: Credentials) {
				when(loginControllerMock.createSession(credentialsWithoutPassword.login, password, SessionType.Login)).thenResolve({
					credentials: credentialsWithoutPassword,
				})
				const unencryptedCredentials = credentialsToUnencrypted(oldCredentials, null)
				await credentialsProviderMock.store(unencryptedCredentials)
				const viewModel = await getViewModel()
				viewModel.showLoginForm()

				viewModel.mailAddress(credentialsWithoutPassword.login)
				viewModel.password(password)
				viewModel.savePassword(false)

				await viewModel.login()

				o(viewModel.state).equals(LoginState.LoggedIn)
				verify(credentialsProviderMock.deleteByUserId(oldCredentials.userId, { deleteOfflineDb: false }))
				verify(loginControllerMock.deleteOldSession(unencryptedCredentials))
			}
		})

		o("Should throw if login controller throws", async function () {
			when(loginControllerMock.createSession(anything(), anything(), anything())).thenReject(new Error("oops"))

			const viewModel = await getViewModel()

			viewModel.mailAddress(credentialsWithoutPassword.login)
			viewModel.password(password)
			await assertThrows(Error, async () => {
				await viewModel.login()
			})
			o(viewModel.state).equals(LoginState.UnknownError)
		})
		o("should handle KeyPermanentlyInvalidatedError and clear credentials", async function () {
			await credentialsProviderMock.store(credentialsToUnencrypted(testCredentials, null))
			when(credentialsProviderMock.store(matchers.anything())).thenReject(new KeyPermanentlyInvalidatedError("oops"))
			when(loginControllerMock.createSession(anything(), anything(), anything())).thenResolve({ credentials: testCredentials })

			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress(testCredentials.login)
			viewModel.password(password)
			viewModel.savePassword(true)
			await viewModel.login()
			o(viewModel.state).equals(LoginState.LoggedIn)
			o(viewModel.getSavedCredentials()).deepEquals([])
			verify(credentialsProviderMock.clearCredentials(anything()), { times: 1 })
		})
		o("should be in error state if email address is empty", async function () {
			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress("")
			viewModel.password("123")
			await viewModel.login()
			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.helpText).equals("loginFailed_msg")
			verify(loginControllerMock.createSession(anything(), anything(), anything()), { times: 0 })
		})
		o("should be in error state if password is empty", async function () {
			const viewModel = await getViewModel()

			viewModel.showLoginForm()
			viewModel.mailAddress("test@example.com")
			viewModel.password("")
			await viewModel.login()
			o(viewModel.state).equals(LoginState.InvalidCredentials)
			o(viewModel.helpText).equals("loginFailed_msg")
			verify(loginControllerMock.createSession(anything(), anything(), anything()), { times: 0 })
		})
	})

	o.spec("newDomain", function () {
		o("isLegacyDomain", function () {
			const oldmode = env.mode
			env.mode = Mode.Browser
			o(isLegacyDomain("https://mail.tutanota.com")).equals(true)
			o(isLegacyDomain("https://mail.tuta.com")).equals(false)
			o(isLegacyDomain("https://app.local.tutanota.com")).equals(true)
			o(isLegacyDomain("https://app.local.nottutanota.com")).equals(false)
			env.mode = oldmode
		})
	})
})

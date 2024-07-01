import { AccessExpiredError, BadRequestError, NotAuthenticatedError } from "../api/common/error/RestError"
import type { TranslationText } from "../misc/LanguageViewModel.js"
import { SecondFactorHandler } from "../misc/2fa/SecondFactorHandler.js"
import { getLoginErrorMessage, handleExpectedLoginError } from "../misc/LoginUtils.js"
import type { LoginController } from "../api/main/LoginController"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import type { CredentialsProvider } from "../misc/credentials/CredentialsProvider.js"
import { CredentialAuthenticationError } from "../api/common/error/CredentialAuthenticationError"
import { first, noOp } from "@tutao/tutanota-utils"
import { KeyPermanentlyInvalidatedError } from "../api/common/error/KeyPermanentlyInvalidatedError"
import { assertMainOrNode, isBrowser } from "../api/common/Env"
import { SessionType } from "../api/common/SessionType"
import { DeviceStorageUnavailableError } from "../api/common/error/DeviceStorageUnavailableError"
import { DeviceConfig } from "../misc/DeviceConfig.js"
import { Const } from "../api/common/TutanotaConstants.js"
import { getWhitelabelRegistrationDomains } from "./LoginView.js"
import { CancelledError } from "../api/common/error/CancelledError.js"
import { CredentialRemovalHandler } from "./CredentialRemovalHandler.js"
import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { CredentialsInfo } from "../native/common/generatedipc/CredentialsInfo.js"
import { PersistedCredentials } from "../native/common/generatedipc/PersistedCredentials.js"
import { credentialsToUnencrypted } from "../misc/credentials/Credentials.js"
import { UnencryptedCredentials } from "../native/common/generatedipc/UnencryptedCredentials.js"
import { AppLock } from "./AppLock.js"

assertMainOrNode()

/**
 * Defines what the view should currently render.
 */
export const enum DisplayMode {
	/* Display the stored credentials */
	Credentials = "credentials",

	/* Display login form (username, password) */
	Form = "form",

	/* Display the stored credentials and options to delete them */
	DeleteCredentials = "deleteCredentials",
}

/**
 * Reflects which state the current login process has.
 */
export const enum LoginState {
	/* Log in in process. */
	LoggingIn = "LoggingIn",

	/* Some unknown error occured during login. */
	UnknownError = "UnknownError",

	/* The credentials used for the last login attempt where invalid (e.g. bad password). */
	InvalidCredentials = "InvalidCredentials",

	/* The access token used for login has expired. */
	AccessExpired = "AccessExpired",

	/* Default state - the user is not logged in nor has login been attempted yet. */
	NotAuthenticated = "NotAuthenticated",

	/* The user has successfully logged in. */
	LoggedIn = "LoggedIn",
}

/**
 * Interface for the view model used on the login page. There is no real technical reason for extracting an interface for the view model
 * other than making it easier to document its methods and for some additional checks when mocking this.
 */
export interface ILoginViewModel {
	readonly state: LoginState
	readonly displayMode: DisplayMode
	readonly mailAddress: Stream<string>
	readonly password: Stream<string>
	readonly helpText: TranslationText
	readonly savePassword: Stream<boolean>

	/**
	 * Checks whether the viewmodel is in a state where it can attempt to login. This depends on the current displayMode as well as
	 * what data (email, password, userId, ...) has been set.
	 */
	canLogin(): boolean

	/**
	 * Will tell the viewmodel to use a certain userId. If there are any stored credentials for that user-id on the device, it will
	 * load those, set them as potential credentials for login and switch to DisplayMode.Credentials. This is useful in order to prepare
	 * the viewmodel for an automatic login without user interaction.
	 * @param userId
	 */
	useUserId(userId: string): Promise<void>

	/**
	 * Instructs the viewmodel to use the credentials passed for the next login attempt. Changes displayMode to DisplayMode.Credentials.
	 * @param credentials
	 */
	useCredentials(credentials: CredentialsInfo): Promise<void>

	/**
	 * Returns all credentials stored on the device.
	 */
	getSavedCredentials(): ReadonlyArray<CredentialsInfo>

	/**
	 * Attempts to log in. How the login will be performed (using stored credentials/using email and password) depends on the current
	 * DisplayMode.
	 */
	login(): Promise<void>

	/**
	 * Deletes stored credentials from the device.
	 * @param credentials
	 */
	deleteCredentials(credentials: CredentialsInfo): Promise<void>

	/**
	 * Changes the display mode to DisplayMode.Form.
	 */
	showLoginForm(): void

	/**
	 * Changes the display mode to DisplayMode.Credentials.
	 */
	showCredentials(): void

	/**
	 * Toggles between DisplayMode.Credentials and DisplayMode.DeleteCredentials.
	 */
	switchDeleteState(): void
}

export class LoginViewModel implements ILoginViewModel {
	readonly mailAddress: Stream<string>
	readonly password: Stream<string>
	displayMode: DisplayMode
	state: LoginState
	helpText: TranslationText
	readonly savePassword: Stream<boolean>
	private savedInternalCredentials: ReadonlyArray<CredentialsInfo>

	// visibleForTesting
	autoLoginCredentials: CredentialsInfo | null

	constructor(
		private readonly loginController: LoginController,
		private readonly credentialsProvider: CredentialsProvider,
		private readonly secondFactorHandler: SecondFactorHandler,
		private readonly deviceConfig: DeviceConfig,
		private readonly domainConfig: DomainConfig,
		private readonly credentialRemovalHandler: CredentialRemovalHandler,
		private readonly pushServiceApp: NativePushServiceApp | null,
		private readonly appLock: AppLock,
	) {
		this.state = LoginState.NotAuthenticated
		this.displayMode = DisplayMode.Form
		this.helpText = "emptyString_msg"
		this.mailAddress = stream("")
		this.password = stream("")
		this.autoLoginCredentials = null
		this.savePassword = stream(false)
		this.savedInternalCredentials = []
	}

	/**
	 * This method should be called right after creation of the view model by whoever created the viewmodel. The view model will not be
	 * fully functional before this method has been called!
	 * @returns {Promise<void>}
	 */
	async init(): Promise<void> {
		await this.updateCachedCredentials()
	}

	async useUserId(userId: string): Promise<void> {
		this.autoLoginCredentials = await this.credentialsProvider.getCredentialsInfoByUserId(userId)

		if (this.autoLoginCredentials) {
			this.displayMode = DisplayMode.Credentials
		} else {
			this.displayMode = DisplayMode.Form
		}
	}

	canLogin(): boolean {
		if (this.displayMode === DisplayMode.Credentials) {
			return this.autoLoginCredentials != null || this.savedInternalCredentials.length === 1
		} else if (this.displayMode === DisplayMode.Form) {
			return Boolean(this.mailAddress() && this.password())
		} else {
			return false
		}
	}

	async useCredentials(encryptedCredentials: CredentialsInfo): Promise<void> {
		const credentialsInfo = await this.credentialsProvider.getCredentialsInfoByUserId(encryptedCredentials.userId)

		if (credentialsInfo) {
			this.autoLoginCredentials = credentialsInfo
			this.displayMode = DisplayMode.Credentials
		}
	}

	async login() {
		if (this.state === LoginState.LoggingIn) return
		this.state = LoginState.LoggingIn

		if (this.displayMode === DisplayMode.Credentials || this.displayMode === DisplayMode.DeleteCredentials) {
			await this.autologin()
		} else if (this.displayMode === DisplayMode.Form) {
			await this.formLogin()
		} else {
			throw new ProgrammingError(`Cannot login with current display mode: ${this.displayMode}`)
		}
	}

	async deleteCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
		let credentials

		try {
			/**
			 * We have to decrypt the credentials here (and hence deal with any potential errors), because :LoginController.deleteOldSession
			 * expects the full credentials. The reason for this is that the accessToken contained within credentials has a double function:
			 * 1. It is used as an actual access token to re-authenticate
			 * 2. It is used as a session ID
			 * Since we want to also delete the session from the server, we need the (decrypted) accessToken in its function as a session id.
			 */
			credentials = await this.unlockAppAndGetCredentials(credentialsInfo.userId)
		} catch (e) {
			if (e instanceof KeyPermanentlyInvalidatedError) {
				await this.credentialsProvider.clearCredentials(e)
				await this.updateCachedCredentials()
				this.state = LoginState.NotAuthenticated
				return
			} else if (e instanceof CancelledError) {
				// ignore, happens if we have app pin activated and the user
				// cancels the prompt or provides a wrong password.
				return
			} else if (e instanceof CredentialAuthenticationError) {
				this.helpText = getLoginErrorMessage(e, false)
				return
			} else if (e instanceof DeviceStorageUnavailableError) {
				// We want to allow deleting credentials even if keychain fails
				await this.credentialsProvider.deleteByUserId(credentialsInfo.userId)
				await this.credentialRemovalHandler.onCredentialsRemoved(credentialsInfo)
				await this.updateCachedCredentials()
			} else {
				throw e
			}
		}

		if (credentials) {
			await this.loginController.deleteOldSession(credentials, (await this.pushServiceApp?.loadPushIdentifierFromNative()) ?? null)
			await this.credentialsProvider.deleteByUserId(credentials.credentialInfo.userId)
			await this.credentialRemovalHandler.onCredentialsRemoved(credentials.credentialInfo)
			await this.updateCachedCredentials()
		}
	}

	/** @throws CredentialAuthenticationError */
	private async unlockAppAndGetCredentials(userId: Id): Promise<UnencryptedCredentials | null> {
		await this.appLock.enforce()
		return await this.credentialsProvider.getDecryptedCredentialsByUserId(userId)
	}

	/** get the origin that the current domain should open to start the credentials migration */
	getMigrationChildOrigin(): string {
		return this.domainConfig.partneredDomainTransitionUrl
	}

	/** only used to put the credentials we got from the old domain into the storage, unaltered. */
	async addAllCredentials(credentials: Array<PersistedCredentials>) {
		for (const cred of credentials) this.credentialsProvider.storeRaw(cred)
		this.setHasAttemptedCredentialsFlag()
		await this.updateCachedCredentials()
	}

	getAllCredentials(): Promise<readonly PersistedCredentials[]> {
		return this.credentialsProvider.getAllInternalCredentials()
	}

	async deleteAllCredentials(): Promise<void> {
		for (const creds of await this.deviceConfig.getCredentials()) {
			await this.deviceConfig.deleteByUserId(creds.credentialInfo.userId)
		}
		this.setHasAttemptedCredentialsFlag()
	}

	/** store that the credentials migration banner on the login page should not be shown anymore */
	setHasAttemptedCredentialsFlag() {
		this.deviceConfig.setHasAttemptedCredentialsMigration(true)
	}

	/** check if the credentials migration banner on the login page should be shown anymore */
	hasAttemptedCredentials() {
		return this.deviceConfig.getHasAttemptedCredentialsMigration()
	}

	getSavedCredentials(): ReadonlyArray<CredentialsInfo> {
		return this.savedInternalCredentials
	}

	switchDeleteState() {
		if (this.displayMode === DisplayMode.DeleteCredentials) {
			this.displayMode = DisplayMode.Credentials
		} else if (this.displayMode === DisplayMode.Credentials) {
			this.displayMode = DisplayMode.DeleteCredentials
		} else {
			throw new ProgrammingError("invalid state")
		}
	}

	showLoginForm() {
		this.displayMode = DisplayMode.Form
		this.helpText = "emptyString_msg"
	}

	showCredentials() {
		this.displayMode = DisplayMode.Credentials
		this.helpText = "emptyString_msg"
	}

	shouldShowRecover(): boolean {
		return this.domainConfig.firstPartyDomain
	}

	shouldShowSignup(): boolean {
		return this.domainConfig.firstPartyDomain || getWhitelabelRegistrationDomains().length > 0
	}

	shouldShowAppButtons(): boolean {
		return this.domainConfig.firstPartyDomain
	}

	shouldShowMigrationBanner(): boolean {
		return isBrowser() && this.domainConfig.firstPartyDomain
	}

	private async updateCachedCredentials() {
		this.savedInternalCredentials = await this.credentialsProvider.getInternalCredentialsInfos()
		this.autoLoginCredentials = null

		if (this.savedInternalCredentials.length > 0) {
			if (this.displayMode !== DisplayMode.DeleteCredentials) {
				this.displayMode = DisplayMode.Credentials
			}
		} else {
			this.displayMode = DisplayMode.Form
		}
	}

	private async autologin(): Promise<void> {
		let credentials: UnencryptedCredentials | null = null
		try {
			if (this.autoLoginCredentials == null) {
				const allCredentials = await this.credentialsProvider.getInternalCredentialsInfos()
				this.autoLoginCredentials = first(allCredentials)
			}

			// we don't want to auto-login on the legacy domain, there's a banner
			// there to move people to the new domain.
			if (this.autoLoginCredentials) {
				credentials = await this.unlockAppAndGetCredentials(this.autoLoginCredentials.userId)

				if (credentials) {
					const offlineTimeRange = this.deviceConfig.getOfflineTimeRangeDays(this.autoLoginCredentials.userId)
					const result = await this.loginController.resumeSession(credentials, null, offlineTimeRange)
					if (result.type == "success") {
						await this.onLogin()
					} else {
						this.state = LoginState.NotAuthenticated
						this.helpText = "offlineLoginPremiumOnly_msg"
					}
				}
			} else {
				this.state = LoginState.NotAuthenticated
			}
		} catch (e) {
			if (e instanceof NotAuthenticatedError && this.autoLoginCredentials) {
				const autoLoginCredentials = this.autoLoginCredentials
				await this.credentialsProvider.deleteByUserId(autoLoginCredentials.userId)
				if (credentials) {
					await this.credentialRemovalHandler.onCredentialsRemoved(credentials.credentialInfo)
				}
				await this.updateCachedCredentials()
				await this.onLoginFailed(e)
			} else if (e instanceof KeyPermanentlyInvalidatedError) {
				await this.credentialsProvider.clearCredentials(e)
				await this.updateCachedCredentials()
				this.state = LoginState.NotAuthenticated
				this.helpText = "credentialsKeyInvalidated_msg"
			} else if (e instanceof DeviceStorageUnavailableError) {
				// The app already shows a dialog with FAQ link so we don't have to explain
				// much here, just catching it to avoid unexpected error dialog
				this.state = LoginState.NotAuthenticated
				this.helpText = () => "Could not access secret storage"
			} else {
				await this.onLoginFailed(e)
			}
		}

		if (this.state === LoginState.AccessExpired || this.state === LoginState.InvalidCredentials) {
			this.displayMode = DisplayMode.Form
			this.mailAddress(this.autoLoginCredentials?.login ?? "")
		}
	}

	private async formLogin(): Promise<void> {
		const mailAddress = this.mailAddress()
		const password = this.password()
		const savePassword = this.savePassword()

		if (mailAddress === "" || password === "") {
			this.state = LoginState.InvalidCredentials
			this.helpText = "loginFailed_msg"
			return
		}

		this.helpText = "login_msg"

		try {
			const sessionType = savePassword ? SessionType.Persistent : SessionType.Login

			const { credentials, databaseKey } = await this.loginController.createSession(mailAddress, password, sessionType)
			await this.onLogin()
			// enforce app lock always, even if we don't access stored credentials
			await this.appLock.enforce()

			// we don't want to have multiple credentials that
			// * share the same userId with different mail addresses (may happen if a user chooses a different alias to log in than the one they saved)
			// * share the same mail address (may happen if mail aliases are moved between users)
			const storedCredentialsToDelete = this.savedInternalCredentials.filter((c) => c.login === mailAddress || c.userId === credentials.userId)

			for (const credentialToDelete of storedCredentialsToDelete) {
				const credentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(credentialToDelete.userId)

				if (credentials) {
					await this.loginController.deleteOldSession(credentials)
					// we handled the deletion of the offlineDb in createSession already
					await this.credentialsProvider.deleteByUserId(credentials.credentialInfo.userId, { deleteOfflineDb: false })
				}
			}

			if (savePassword) {
				try {
					await this.credentialsProvider.store(credentialsToUnencrypted(credentials, databaseKey))
				} catch (e) {
					if (e instanceof KeyPermanentlyInvalidatedError) {
						await this.credentialsProvider.clearCredentials(e)
						await this.updateCachedCredentials()
					} else if (e instanceof DeviceStorageUnavailableError || e instanceof CancelledError) {
						console.warn("will proceed with ephemeral credentials because device storage is unavailable:", e)
					} else {
						throw e
					}
				}
			}
		} catch (e) {
			if (e instanceof DeviceStorageUnavailableError) {
				console.warn("cannot log in: failed to get credentials from device storage", e)
			}
			await this.onLoginFailed(e)
		} finally {
			await this.secondFactorHandler.closeWaitingForSecondFactorDialog()
		}
	}

	private async onLogin(): Promise<void> {
		this.helpText = "emptyString_msg"
		this.state = LoginState.LoggedIn
	}

	private async onLoginFailed(error: Error): Promise<void> {
		this.helpText = getLoginErrorMessage(error, false)

		if (error instanceof BadRequestError || error instanceof NotAuthenticatedError) {
			this.state = LoginState.InvalidCredentials
		} else if (error instanceof AccessExpiredError) {
			this.state = LoginState.AccessExpired
		} else {
			this.state = LoginState.UnknownError
		}

		handleExpectedLoginError(error, noOp)
	}
}

// To give people time to visit the old domain and refresh to a web app that knows about the
// /migrate route without them being prompted to migrate right away, we have a time delay on
// the start of the migration.
//
// This date is also referenced from service worker build to decide on immediate takeover
export const ACTIVATED_MIGRATION = () => (Const.CURRENT_DATE?.getTime() ?? Date.now()) > new Date("2023-11-07T13:00:00.000Z").getTime()

/** are we on *.tutanota.com?
 * influences whether we should allow saving credentials and show the credentials migration box.
 * also turns off auto login with a single stored credential. */
export function isLegacyDomain(o: string = location.origin): boolean {
	return new URL(o).hostname.endsWith(".tutanota.com") && isBrowser()
}

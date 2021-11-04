//@flow
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	NotAuthenticatedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import type {TranslationText} from "../misc/LanguageViewModel"
import {SecondFactorHandler} from "../misc/SecondFactorHandler"
import {CancelledError} from "../api/common/error/CancelledError"
import {getLoginErrorMessage} from "../misc/LoginUtils"
import type {LoginController} from "../api/main/LoginController"
import {SessionType} from "../api/main/LoginController"
import stream from "mithril/stream/stream.js"
import {ProgrammingError} from "../api/common/error/ProgrammingError"
import type {CredentialsInfo, ICredentialsProvider} from "../misc/credentials/CredentialsProvider"
import {CredentialAuthenticationError} from "../api/common/error/CredentialAuthenticationError"
import {first} from "@tutao/tutanota-utils"
import {KeyPermanentlyInvalidatedError} from "../api/common/error/KeyPermanentlyInvalidatedError"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

/**
 * Defines what the view should currently render.
 */
export const DisplayMode = Object.freeze({
	/* Display the stored credentials */
	Credentials: "credentials",
	/* Display login form (username, password) */
	Form: "form",
	/* Display the stored credentials and options to delete them */
	DeleteCredentials: "deleteCredentials",
})
export type DisplayModeEnum = $Values<typeof DisplayMode>

/**
 * Reflects which state the current login process has.
 */
export const LoginState = Object.freeze({
	/* Log in in process. */
	LogginIn: "LogginIn",
	/* Some unknown error occured during login. */
	UnknownError: "UnknownError",
	/* The credentials used for the last login attempt where invalid (e.g. bad password). */
	InvalidCredentials: "InvalidCredentials",
	/* The access token used for login has expired. */
	AccessExpired: "AccessExpired",
	/* Default state - the user is not logged in nor has login been attempted yet. */
	NotAuthenticated: "NotAuthenticated",
	/* The user has successfully logged in. */
	LoggedIn: "LoggedIn",
})

export type LoginStateEnum = $Values<typeof LoginState>

/**
 * Interface for the view model used on the login page. There is no real technical reason for extracting an interface for the view model
 * other than making it easier to document its methods and for some additional checks when mocking this.
 */
export interface ILoginViewModel {
	+state: LoginStateEnum;
	+displayMode: DisplayModeEnum;
	+mailAddress: Stream<string>;
	+password: Stream<string>;
	+helpText: TranslationText;
	+savePassword: Stream<boolean>;

	/**
	 * Checks whether the viewmodel is in a state where it can attempt to login. This depends on the current displayMode as well as
	 * what data (email, password, userId, ...) has been set.
	 */
	canLogin(): boolean;

	/**
	 * Will tell the viewmodel to use a certain userId. If there are any stored credentials for that user-id on the device, it will
	 * load those, set them as potential credentials for login and switch to DisplayMode.Credentials. This is useful in order to prepare
	 * the viewmodel for an automatic login without user interaction.
	 * @param userId
	 */
	useUserId(userId: string): Promise<void>;

	/**
	 * Instructs the viewmodel to use the credentials passed for the next login attempt. Changes displayMode to DisplayMode.Credentials.
	 * @param credentials
	 */
	useCredentials(credentials: CredentialsInfo): Promise<void>;

	/**
	 * Returns all credentials stored on the device.
	 */
	getSavedCredentials(): $ReadOnlyArray<CredentialsInfo>;

	/**
	 * Attempts to log in. How the login will be performed (using stored credentials/using email and password) depends on the current
	 * DisplayMode.
	 */
	login(): Promise<void>;

	/**
	 * Deletes stored credentials from the device.
	 * @param credentials
	 */
	deleteCredentials(credentials: CredentialsInfo): Promise<void>;

	/**
	 * Changes the display mode to DisplayMode.Form.
	 */
	showLoginForm(): void;

	/**
	 * Changes the display mode to DisplayMode.Credentials.
	 */
	showCredentials(): void;

	/**
	 * Toggles between DisplayMode.Credentials and DisplayMode.DeleteCredentials.
	 */
	switchDeleteState(): void
}

export class LoginViewModel implements ILoginViewModel {
	+_loginController: LoginController
	+_credentialsProvider: ICredentialsProvider
	+_secondFactorHandler: SecondFactorHandler
	+mailAddress: Stream<string>;
	+password: Stream<string>;
	displayMode: DisplayModeEnum
	state: LoginStateEnum
	helpText: TranslationText
	+savePassword: Stream<boolean>;
	_savedInternalCredentials: Array<CredentialsInfo>
	_autoLoginCredentials: ?CredentialsInfo

	constructor(loginController: LoginController, credentialsProvider: ICredentialsProvider, secondFactorHandler: SecondFactorHandler) {
		this._loginController = loginController
		this._credentialsProvider = credentialsProvider
		this._secondFactorHandler = secondFactorHandler
		this.state = LoginState.NotAuthenticated
		this.displayMode = DisplayMode.Form
		this.helpText = "emptyString_msg"
		this.mailAddress = stream("")
		this.password = stream("")
		this._autoLoginCredentials = null
		this.savePassword = stream(false)
		this._savedInternalCredentials = []
	}

	/**
	 * This method should be called right after creation of the view model by whoever created the viewmodel. The view model will not be
	 * fully functional before this method has been called!
	 * @returns {Promise<void>}
	 */
	async init(): Promise<void> {
		await this._updateCachedCredentials()
	}

	async useUserId(userId: string): Promise<void> {
		this._autoLoginCredentials = await this._credentialsProvider.getCredentialsInfoByUserId(userId)
		if (this._autoLoginCredentials) {
			this.displayMode = DisplayMode.Credentials
		} else {
			this.displayMode = DisplayMode.Form
		}
	}

	canLogin(): boolean {
		if (this.displayMode === DisplayMode.Credentials) {
			return this._autoLoginCredentials != null
				|| this._savedInternalCredentials.length === 1
		} else if (this.displayMode === DisplayMode.Form) {
			return Boolean(this.mailAddress() && this.password())
		} else {
			return false
		}
	}

	async useCredentials(encryptedCredentials: CredentialsInfo): Promise<void> {
		const credentialsInfo = await this._credentialsProvider.getCredentialsInfoByUserId(encryptedCredentials.userId)
		if (credentialsInfo) {
			this._autoLoginCredentials = credentialsInfo
			this.displayMode = DisplayMode.Credentials
		}
	}

	async login() {
		if (this.state === LoginState.LogginIn) return
		this.state = LoginState.LogginIn
		if (this.displayMode === DisplayMode.Credentials || this.displayMode === DisplayMode.DeleteCredentials) {
			await this._autologin()
		} else if (this.displayMode === DisplayMode.Form) {
			await this._formLogin()
		} else {
			throw new ProgrammingError(`Cannot login with current display mode: ${this.displayMode}`)
		}
	}

	async deleteCredentials(encryptedCredentials: CredentialsInfo): Promise<void> {
		let credentials
		try {
			/**
			 * We have to decrypt the credentials here (and hence deal with any potential errors), because :LoginController.deleteOldSession
			 * expects the full credentials. The reason for this is that the accessToken contained within credentials has a double function:
			 * 1. It is used as an actual access token to re-authenticate
			 * 2. It is used as a session ID
			 * Since we want to also delete the session from the server, we need the (decrypted) accessToken in its function as a session id.
			 */
			credentials = await this._credentialsProvider.getCredentialsByUserId(encryptedCredentials.userId)
		} catch (e) {
			if (e instanceof KeyPermanentlyInvalidatedError) {
				await this._credentialsProvider.clearCredentials()
				await this._updateCachedCredentials()
				this.state = LoginState.NotAuthenticated
				return
			} else if (e instanceof CredentialAuthenticationError) {
				this.helpText = getLoginErrorMessage(e, false)
				return
			} else {
				throw e
			}
		}

		if (credentials) {
			await this._loginController.deleteOldSession(credentials)
			await this._credentialsProvider.deleteByUserId(credentials.userId)
			await this._updateCachedCredentials()
		}
	}

	getSavedCredentials(): $ReadOnlyArray<CredentialsInfo> {
		return this._savedInternalCredentials
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

	async _updateCachedCredentials() {
		this._savedInternalCredentials = await this._credentialsProvider.getInternalCredentialsInfos()
		this._autoLoginCredentials = null
		if (this._savedInternalCredentials.length > 0) {
			if (this.displayMode !== DisplayMode.DeleteCredentials) {
				this.displayMode = DisplayMode.Credentials
			}
		} else {
			this.displayMode = DisplayMode.Form
		}
	}

	async _autologin(): Promise<void> {
		try {
			if (this._autoLoginCredentials == null) {
				const allCredentials = await this._credentialsProvider.getInternalCredentialsInfos()
				this._autoLoginCredentials = first(allCredentials)
			}
			if (this._autoLoginCredentials) {
				const credentials = await this._credentialsProvider.getCredentialsByUserId(this._autoLoginCredentials.userId)
				if (credentials) {
					await this._loginController.resumeSession(credentials)
					await this._onLogin()
				}
			}
		} catch (e) {
			if (e instanceof NotAuthenticatedError && this._autoLoginCredentials) {
				await this._credentialsProvider.deleteByUserId(this._autoLoginCredentials.userId)
				await this._updateCachedCredentials()
				await this._onLoginFailed(e)
			} else if (e instanceof KeyPermanentlyInvalidatedError) {
				await this._credentialsProvider.clearCredentials()
				await this._updateCachedCredentials()
				this.state = LoginState.NotAuthenticated
				this.helpText = "credentialsKeyInvalidated_msg"
			} else {
				await this._onLoginFailed(e)
			}
		}

		if (this.state === LoginState.AccessExpired || this.state === LoginState.InvalidCredentials) {
			this.displayMode = DisplayMode.Form
			this.mailAddress(this._autoLoginCredentials?.login ?? "")
		}
	}

	async _formLogin(): Promise<void> {
		const mailAddress = this.mailAddress()
		const password = this.password()
		const savePassword = this.savePassword()

		if (mailAddress === "" || password === "") {
			this.helpText = 'loginFailed_msg'
			return
		}
		this.helpText = 'login_msg'
		this.state = LoginState.LogginIn
		try {

			const sessionType = savePassword ? SessionType.Persistent : SessionType.Login
			const newCredentials = await this._loginController.createSession(mailAddress, password, sessionType)
			await this._onLogin()

			// There are situations when we have stored credentials with the same mail address as we are trying to use now but this
			// stored session belongs to another user. This can happen e.g. when email address alias is moved to another user.
			const storedCredentialsToDelete = this._savedInternalCredentials
			                                      .filter(c => c.login === mailAddress || c.userId === newCredentials.userId)
			for (const credentialToDelete of storedCredentialsToDelete) {
				const credentials = await this._credentialsProvider.getCredentialsByUserId(credentialToDelete.userId)
				if (credentials) {
					await this._loginController.deleteOldSession(credentials)
					await this._credentialsProvider.deleteByUserId(credentials.userId)
				}
			}

			if (savePassword) {
				try {
					await this._credentialsProvider.store(newCredentials)
				} catch (e) {
					if (e instanceof KeyPermanentlyInvalidatedError) {
						await this._credentialsProvider.clearCredentials()
						await this._updateCachedCredentials()
					} else {
						throw e
					}
				}
			}

		} catch (e) {
			await this._onLoginFailed(e)
		} finally {
			await this._secondFactorHandler.closeWaitingForSecondFactorDialog()
		}
	}

	async _onLogin(): Promise<void> {
		this.helpText = "emptyString_msg"
		this.state = LoginState.LoggedIn
	}

	async _onLoginFailed(error: Error): Promise<void> {
		this.helpText = getLoginErrorMessage(error, false)
		if (error instanceof BadRequestError || error instanceof NotAuthenticatedError) {
			this.state = LoginState.InvalidCredentials
		} else if (error instanceof AccessExpiredError) {
			this.state = LoginState.AccessExpired
		} else {
			this.state = LoginState.UnknownError
		}
		if (error instanceof BadRequestError
			|| error instanceof NotAuthenticatedError
			|| error instanceof AccessExpiredError
			|| error instanceof AccessBlockedError
			|| error instanceof AccessDeactivatedError
			|| error instanceof TooManyRequestsError
			|| error instanceof CancelledError
			|| error instanceof CredentialAuthenticationError
		) {
		} else {
			throw error
		}
	}
}

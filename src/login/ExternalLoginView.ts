import m, { Children } from "mithril"
import { AccessExpiredError } from "../api/common/error/RestError"
import { assertNotNull, base64ToUint8Array, base64UrlToBase64, noOp } from "@tutao/tutanota-utils"
import type { TranslationText } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { keyManager, Shortcut } from "../misc/KeyManager"
import { client } from "../misc/ClientDetector"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { Keys } from "../api/common/TutanotaConstants"
import { progressIcon } from "../gui/base/Icon"
import { Button, ButtonType } from "../gui/base/Button.js"
import { Autocomplete, TextField, TextFieldType as TextFieldType } from "../gui/base/TextField.js"
import { Checkbox } from "../gui/base/Checkbox.js"
import { logins } from "../api/main/LoginController"
import { MessageBox } from "../gui/base/MessageBox.js"
import { renderInfoLinks } from "./LoginView"
import { header } from "../gui/Header.js"
import { GENERATED_MIN_ID } from "../api/common/utils/EntityUtils"
import { getLoginErrorMessage, handleExpectedLoginError } from "../misc/LoginUtils"
import { locator } from "../api/main/MainLocator"
import type { CredentialsProvider } from "../misc/credentials/CredentialsProvider.js"
import { assertMainOrNode } from "../api/common/Env"
import type { Credentials } from "../misc/credentials/Credentials"
import { SessionType } from "../api/common/SessionType.js"
import { ResumeSessionErrorReason } from "../api/worker/facades/LoginFacade"
import {CurrentView} from "../TopLevelView.js"

assertMainOrNode()

class ExternalLoginViewModel {
	password: string = ""
	doSavePassword: boolean = false
	helpText: TranslationText = "emptyString_msg"
	errorMessageId: TranslationText | null = null
	autologinInProgress = false
	showAutoLoginButton = false

	private _urlData: { userId: Id; salt: Uint8Array } | null = null
	get urlData(): { userId: Id; salt: Uint8Array } {
		return assertNotNull(this._urlData)
	}

	constructor(private readonly credentialsProvider: CredentialsProvider) {}

	formLogin() {
		if (this.password === "") {
			this.helpText = "loginFailed_msg"
		} else {
			this.helpText = "login_msg"
			this.handleLoginPromise(showProgressDialog("login_msg", this.doFormLogin()), noOp)
		}
	}

	private async doFormLogin() {
		const password = this.password
		const clientIdentifier = client.browser + " " + client.device
		const persistentSession = this.doSavePassword

		const sessionType = persistentSession ? SessionType.Persistent : SessionType.Login
		const { userId, salt } = this.urlData
		const newCredentials = await logins.createExternalSession(userId, password, salt, clientIdentifier, sessionType)

		this.password = ""

		const storedCredentials = await this.credentialsProvider.getCredentialsByUserId(userId)

		// For external users userId is used instead of email address
		if (persistentSession) {
			await this.credentialsProvider.store({ credentials: newCredentials })
		}

		if (storedCredentials) {
			// delete persistent session if a new session is created
			await logins.deleteOldSession(storedCredentials.credentials)

			if (!persistentSession) {
				await this.credentialsProvider.deleteByUserId(userId)
			}
		}
	}

	async autologin(credentials: Credentials) {
		this.autologinInProgress = true
		await showProgressDialog(
			"login_msg",
			this.handleLoginPromise(this.resumeSession(credentials), () => {
				this.autologinInProgress = false
				m.redraw()
			}),
		)
	}

	private async resumeSession(credentials: Credentials): Promise<void> {
		const result = await logins.resumeSession({ credentials, databaseKey: null }, this.urlData.salt, null)
		if (result.type === "error") {
			switch (result.reason) {
				case ResumeSessionErrorReason.OfflineNotAvailableForFree:
					throw new Error("Cannot happen")
			}
		}
	}

	async loginWithStoredCredentials() {
		try {
			const credentials = await this.credentialsProvider.getCredentialsByUserId(this.urlData.userId)
			if (credentials) {
				await this.autologin(credentials.credentials)
			}
		} finally {
			// in case there is an error or there are no credentials we should show the form
			this.showAutoLoginButton = false
			m.redraw()
		}
	}

	private async handleLoginPromise(loginPromise: Promise<void>, errorAction: () => void) {
		try {
			await loginPromise
			m.route.set(`/mail${location.hash}`)
			this.helpText = "emptyString_msg"
		} catch (e) {
			const messageId = getLoginErrorMessage(e, true)

			if (e instanceof AccessExpiredError) {
				this.errorMessageId = messageId
			} else {
				this.helpText = messageId
			}

			m.redraw()

			handleExpectedLoginError(e, errorAction)
		}
	}

	async updateUrl(args: Record<string, any>): Promise<void> {
		try {
			const id = decodeURIComponent(location.hash).substring(6) // cutoff #mail/ from #mail/KduzrgF----0S3BTO2gypfDMketWB_PbqQ

			this._urlData = {
				userId: id.substring(0, GENERATED_MIN_ID.length),
				salt: base64ToUint8Array(base64UrlToBase64(id.substring(GENERATED_MIN_ID.length))),
			}

			const credentials = await this.credentialsProvider.getCredentialsByUserId(this.urlData.userId)

			if (credentials && args.noAutoLogin !== true) {
				await this.autologin(credentials.credentials)
			} else {
				this.showAutoLoginButton = credentials != null
				m.redraw()
			}
		} catch (e) {
			this.errorMessageId = "invalidLink_msg"
			m.redraw()
		}
	}
}

export class ExternalLoginView implements CurrentView {
	private readonly viewModel = new ExternalLoginViewModel(locator.credentialsProvider)
	private readonly shortcuts: Array<Shortcut> = [
		{
			key: Keys.RETURN,
			exec: () => {
				this.viewModel.formLogin()
			},
			help: "login_label",
		},
	]

	constructor() {
		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
		this.onremove = this.onremove.bind(this)
	}

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		this.viewModel.password = ""
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	view(): Children {
		return m(".main-view", [m(header), m(".flex-center.scroll.pt-responsive", m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", this.renderContent()))])
	}

	private renderContent(): Children {
		if (this.viewModel.autologinInProgress) {
			return m("p.center", progressIcon())
		} else if (this.viewModel.errorMessageId) {
			return m("p.center", m(MessageBox, {}, lang.getMaybeLazy(this.viewModel.errorMessageId)))
		} else {
			return [
				this.viewModel.showAutoLoginButton ? this.renderAutoLoginButton() : this.renderForm(),
				m("p.center.statusTextColor", m("small", lang.getMaybeLazy(this.viewModel.helpText))),
				renderInfoLinks(),
			]
		}
	}

	renderAutoLoginButton(): Children {
		return m(
			".pt",
			m(Button, {
				label: "showMail_action",
				click: () => this.viewModel.loginWithStoredCredentials(),
				type: ButtonType.Login,
			}),
		)
	}

	renderForm(): Children {
		return [
			m(TextField, {
				type: TextFieldType.Password,
				label: "password_label",
				helpLabel: () => lang.get("enterPresharedPassword_msg"),
				value: this.viewModel.password,
				autocompleteAs: Autocomplete.currentPassword,
				oninput: (input) => (this.viewModel.password = input),
			}),
			m(Checkbox, {
				label: () => lang.get("storePassword_action"),
				helpLabel: () => lang.get("onlyPrivateComputer_msg"),
				checked: this.viewModel.doSavePassword,
				onChecked: (checked) => (this.viewModel.doSavePassword = checked),
			}),
			m(
				".pt",
				m(Button, {
					label: "showMail_action",
					click: () => this.viewModel.formLogin(),
					type: ButtonType.Login,
				}),
			),
		]
	}

	updateUrl(args: Record<string, any>) {
		this.viewModel.updateUrl(args)
	}
}

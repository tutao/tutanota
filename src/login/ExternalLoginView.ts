import m, { Children, Vnode } from "mithril"
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
import { MessageBox } from "../gui/base/MessageBox.js"
import { renderInfoLinks } from "./LoginView"
import { BaseHeaderAttrs, Header } from "../gui/Header.js"
import { GENERATED_MIN_ID } from "../api/common/utils/EntityUtils"
import { getLoginErrorMessage, handleExpectedLoginError } from "../misc/LoginUtils"
import type { CredentialsProvider } from "../misc/credentials/CredentialsProvider.js"
import { assertMainOrNode } from "../api/common/Env"
import type { Credentials } from "../misc/credentials/Credentials"
import { SessionType } from "../api/common/SessionType.js"
import { ResumeSessionErrorReason } from "../api/worker/facades/LoginFacade"
import { TopLevelAttrs, TopLevelView } from "../TopLevelView.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { locator } from "../api/main/MainLocator.js"

assertMainOrNode()

export class ExternalLoginViewModel {
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
		const newCredentials = await locator.logins.createExternalSession(userId, password, salt, clientIdentifier, sessionType)

		this.password = ""

		const storedCredentials = await this.credentialsProvider.getCredentialsByUserId(userId)

		// For external users userId is used instead of email address
		if (persistentSession) {
			await this.credentialsProvider.store({ credentials: newCredentials })
		}

		if (storedCredentials) {
			// delete persistent session if a new session is created
			await locator.logins.deleteOldSession(storedCredentials.credentials)

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
		const result = await locator.logins.resumeSession({ credentials, databaseKey: null }, this.urlData.salt, null)
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

	dispose() {
		this.password = ""
	}
}

export interface ExternalLoginViewAttrs extends TopLevelAttrs {
	viewModelFactory: () => ExternalLoginViewModel
	header: BaseHeaderAttrs
}

/** Login view for external mailboxes: recipients from other mail servers when the email is password-protected. */
export class ExternalLoginView extends BaseTopLevelView implements TopLevelView<ExternalLoginViewAttrs> {
	private readonly viewModel: ExternalLoginViewModel
	private readonly shortcuts: Array<Shortcut> = [
		{
			key: Keys.RETURN,
			exec: () => {
				this.viewModel.formLogin()
			},
			help: "login_label",
		},
	]

	constructor(vnode: Vnode<ExternalLoginViewAttrs>) {
		super()
		this.viewModel = vnode.attrs.viewModelFactory()
	}

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		this.viewModel.password = ""
		this.viewModel.dispose()
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	view({ attrs }: Vnode<ExternalLoginViewAttrs>): Children {
		return m(".main-view", [
			m(Header, {
				viewSlider: null,
				...attrs.header,
			}),
			m(".flex-center.scroll.pt-responsive", m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", this.renderContent())),
		])
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

	onNewUrl(args: Record<string, any>) {
		this.viewModel.updateUrl(args)
	}
}

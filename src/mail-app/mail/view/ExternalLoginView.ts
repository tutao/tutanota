import m, { Children, Vnode } from "mithril"
import { AccessExpiredError } from "../../../common/api/common/error/RestError.js"
import { assertNotNull, base64ToUint8Array, base64UrlToBase64, noOp } from "@tutao/tutanota-utils"
import type { TranslationText } from "../../../common/misc/LanguageViewModel.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager.js"
import { client } from "../../../common/misc/ClientDetector.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { asKdfType, KdfType, Keys } from "../../../common/api/common/TutanotaConstants.js"
import { progressIcon } from "../../../common/gui/base/Icon.js"
import { Autocomplete } from "../../../common/gui/base/TextField.js"
import { Checkbox } from "../../../common/gui/base/Checkbox.js"
import { MessageBox } from "../../../common/gui/base/MessageBox.js"
import { GENERATED_MIN_ID } from "../../../common/api/common/utils/EntityUtils.js"
import { getLoginErrorMessage, handleExpectedLoginError } from "../../../common/misc/LoginUtils.js"
import type { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider.js"
import { assertMainOrNode } from "../../../common/api/common/Env.js"
import { credentialsToUnencrypted } from "../../../common/misc/credentials/Credentials.js"
import { SessionType } from "../../../common/api/common/SessionType.js"
import { ResumeSessionErrorReason } from "../../../common/api/worker/facades/LoginFacade.js"
import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView.js"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { LoginScreenHeader } from "../../../common/gui/LoginScreenHeader.js"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton.js"
import { UnencryptedCredentials } from "../../../common/native/common/generatedipc/UnencryptedCredentials.js"
import { PasswordField } from "../../../common/misc/passwords/PasswordField.js"
import { renderInfoLinks } from "../../../common/gui/RenderLoginInfoLinks.js"

assertMainOrNode()

type UrlData = { userId: Id; salt: Uint8Array; kdfType: KdfType }

export class ExternalLoginViewModel {
	password: string = ""
	doSavePassword: boolean = false
	helpText: TranslationText = "emptyString_msg"
	errorMessageId: TranslationText | null = null
	autologinInProgress = false
	showAutoLoginButton = false

	private _urlData: UrlData | null = null
	get urlData(): UrlData {
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
		const { userId, salt, kdfType } = this.urlData
		const newCredentials = await locator.logins.createExternalSession(userId, password, salt, kdfType, clientIdentifier, sessionType)

		this.password = ""

		const storedCredentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(userId)

		// For external users userId is used instead of email address
		if (persistentSession) {
			await this.credentialsProvider.store(credentialsToUnencrypted(newCredentials, null))
		}

		if (storedCredentials) {
			// delete persistent session if a new session is created
			await locator.logins.deleteOldSession(storedCredentials)

			if (!persistentSession) {
				await this.credentialsProvider.deleteByUserId(userId)
			}
		}
	}

	async autologin(credentials: UnencryptedCredentials) {
		this.autologinInProgress = true
		await showProgressDialog(
			"login_msg",
			this.handleLoginPromise(this.resumeSession(credentials), () => {
				this.autologinInProgress = false
				m.redraw()
			}),
		)
	}

	private async resumeSession(credentials: UnencryptedCredentials): Promise<void> {
		const result = await locator.logins.resumeSession(credentials, { salt: this.urlData.salt, kdfType: this.urlData.kdfType }, null)
		if (result.type === "error") {
			switch (result.reason) {
				case ResumeSessionErrorReason.OfflineNotAvailableForFree:
					throw new Error("Cannot happen")
			}
		}
	}

	async loginWithStoredCredentials() {
		try {
			const credentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(this.urlData.userId)
			if (credentials) {
				await this.autologin(credentials)
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
			const encodedExternalLoginData = decodeURIComponent(location.hash).substring(6) // cutoff #mail/ from #mail/KduzrgF----0S3BTO2gypfDMketWB_PbqQ

			const userIdOffset = 0
			const saltOffset = userIdOffset + GENERATED_MIN_ID.length
			// 16 bytes Base64 encoded is ceil(16 * 4/3) bytes, or 22 bytes
			const encodedSaltLength = 22
			const kdfOffset = saltOffset + encodedSaltLength

			// check if the KDF type is in the URL (encodedExternalLoginData.length > kdfOffset); if not, we assume bcrypt to ensure old links stay valid
			let kdfType = KdfType.Bcrypt
			if (encodedExternalLoginData.length > kdfOffset) {
				kdfType = asKdfType(encodedExternalLoginData.substring(kdfOffset, kdfOffset + 1))
			}

			this._urlData = {
				userId: encodedExternalLoginData.substring(userIdOffset, saltOffset),
				salt: base64ToUint8Array(base64UrlToBase64(encodedExternalLoginData.substring(saltOffset, kdfOffset))),
				kdfType: kdfType,
			}

			const credentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(this.urlData.userId)

			if (credentials && args.noAutoLogin !== true) {
				await this.autologin(credentials)
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
		return m(".main-view.flex.col.nav-bg", [
			m(LoginScreenHeader),
			m(".flex-grow.flex.col.items-center.scroll", m(".flex-grow-shrink-auto.flex.col.max-width-m.pt.pb.plr-l", this.renderContent())),
		])
	}

	private renderContent(): Children {
		if (this.viewModel.autologinInProgress) {
			return m("p.center", progressIcon())
		} else if (this.viewModel.errorMessageId) {
			return m("p.center", m(MessageBox, {}, lang.getMaybeLazy(this.viewModel.errorMessageId)))
		} else {
			return [
				m(".flex.col.content-bg.border-radius-big.plr-2l.mt", [
					this.viewModel.showAutoLoginButton ? this.renderAutoLoginButton() : this.renderForm(),
					m("p.center.statusTextColor.mt-xs.mb-s", m("small", lang.getMaybeLazy(this.viewModel.helpText))),
				]),
				m(".flex-grow"),
				renderInfoLinks(),
			]
		}
	}

	renderAutoLoginButton(): Children {
		return m(
			".pt-l",
			m(LoginButton, {
				label: "showMail_action",
				onclick: () => this.viewModel.loginWithStoredCredentials(),
			}),
		)
	}

	renderForm(): Children {
		return [
			m(PasswordField, {
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
				m(LoginButton, {
					label: "showMail_action",
					onclick: () => this.viewModel.formLogin(),
				}),
			),
		]
	}

	onNewUrl(args: Record<string, any>) {
		this.viewModel.updateUrl(args)
	}
}

import stream from "mithril/stream"
import Stream from "mithril/stream"
import { createWizardDialog, wizardPageWrapper } from "../../gui/base/WizardDialog.js"
import { assertMainOrNode } from "../../api/common/Env"
import { EnterImapCredentialsPage, EnterImapCredentialsPageAttrs } from "./EnterImapCredentialsPage.js"
import { ConfigureImapImportPage, ConfigureImapImportPageAttrs } from "./ConfigureImapImportPage.js"
import { ImapImportState, ImportState } from "../../api/worker/imapimport/ImapImportState.js"
import { ImapImportStartedPage, ImapImportStartedPageAttrs } from "./ImapImportStartedPage.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { isDomainName } from "../../misc/FormatValidator.js"

assertMainOrNode()

export type AddImapImportData = {
	model: ImapImportModel
}

export interface ImapImportModelConfig {
	readonly imapAccountHost: string
	readonly imapAccountPort: string
	readonly imapAccountUsername: string
	readonly imapAccountPassword: string
	readonly rootImportMailFolderName: string
}

export class ImapImportModel {
	private _imapAccountHost: stream<string>
	private _imapAccountPort: stream<string>
	private _imapAccountUsername: stream<string>
	private _imapAccountPassword: stream<string>
	private revealImapAccountPassword: boolean = false
	private _rootImportMailFolderName: stream<string>
	private _imapImportState: ImapImportState

	constructor(readonly config: ImapImportModelConfig) {
		this._imapAccountHost = stream(config.imapAccountHost)
		this._imapAccountPort = stream(config.imapAccountPort)
		this._imapAccountUsername = stream(config.imapAccountUsername)
		this._imapAccountPassword = stream(config.imapAccountPassword)
		this._rootImportMailFolderName = stream(config.rootImportMailFolderName)
		this._imapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
	}

	get imapAccountHost(): Stream<string> {
		return this._imapAccountHost
	}

	set imapAccountHost(value: Stream<string>) {
		this._imapAccountHost = value
	}

	get imapAccountPort(): Stream<string> {
		return this._imapAccountPort
	}

	set imapAccountPort(value: Stream<string>) {
		this._imapAccountPort = value
	}

	get imapAccountUsername(): Stream<string> {
		return this._imapAccountUsername
	}

	set imapAccountUsername(value: Stream<string>) {
		this._imapAccountUsername = value
	}

	get imapAccountPassword(): Stream<string> {
		return this._imapAccountPassword
	}

	set imapAccountPassword(value: Stream<string>) {
		this._imapAccountPassword = value
	}

	get rootImportMailFolderName(): Stream<string> {
		if (this._rootImportMailFolderName().length == 0) {
			this._rootImportMailFolderName = stream("imap:" + this._imapAccountUsername())
		}

		return this._rootImportMailFolderName
	}

	set rootImportMailFolderName(value: Stream<string>) {
		this._rootImportMailFolderName = value
	}

	get imapImportState(): ImapImportState {
		return this._imapImportState
	}

	set imapImportState(value: ImapImportState) {
		this._imapImportState = value
	}

	toggleRevealImapAccountPassword(): void {
		this.revealImapAccountPassword = !this.revealImapAccountPassword
	}

	isImapAccountPasswordRevealed(): boolean {
		return this.revealImapAccountPassword
	}

	validateImapAccountHost(): TranslationKey | null {
		let cleanHostName = this.imapAccountHost().toLocaleLowerCase().trim()

		if (!cleanHostName.length) {
			return "imapAccountHostNeutral_msg"
		}

		if (!isDomainName(cleanHostName)) {
			return "imapAccountHostInvalid_msg"
		} else {
			return null
		}
	}

	validateImapAccount(): TranslationKey | null {
		let hostErrorMsg = this.validateImapAccountHost()

		if (hostErrorMsg) {
			return hostErrorMsg
		}

		let port = this._imapAccountPort()
		let username = this._imapAccountUsername()
		let password = this._imapAccountPassword()

		if (port.length == 0 || username.length == 0 || password.length == 0) {
			return "imapAccountInvalid_msg"
		} else {
			return null
		}
	}

	validateRootImportMailFolder(): TranslationKey | null {
		let cleanRootImportFolderName = this._rootImportMailFolderName().toLocaleLowerCase().trim()

		if (cleanRootImportFolderName.length == 0) {
			return "imapImportRootMailFolderNameInvalid_msg"
		} else {
			return null
		}
	}
}

/** Shows a wizard for adding an IMAP import. */
export function showAddImapImportWizard(addImapImportData: AddImapImportData): Promise<void> {
	const wizardPages = [
		wizardPageWrapper(EnterImapCredentialsPage, new EnterImapCredentialsPageAttrs(addImapImportData)),
		wizardPageWrapper(ConfigureImapImportPage, new ConfigureImapImportPageAttrs(addImapImportData)),
		wizardPageWrapper(ImapImportStartedPage, new ImapImportStartedPageAttrs(addImapImportData)),
	]
	return new Promise((resolve) => {
		const wizardBuilder = createWizardDialog(addImapImportData, wizardPages, () => {
			resolve()
			return Promise.resolve()
		})
		const wizard = wizardBuilder.dialog
		const wizardAttrs = wizardBuilder.attrs
		wizard.show()
	})
}

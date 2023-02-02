import { EnterImapCredentialsPage, EnterImapCredentialsPageAttrs } from "./EnterImapCredentialsPage.js"
import { ConfigureImapImportPage, ConfigureImapImportPageAttrs } from "./ConfigureImapImportPage.js"
import { ImapImportStartedPage, ImapImportStartedPageAttrs } from "./ImapImportStartedPage.js"
import { assertMainOrNode } from "@tutao/app-env"
import { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { isDomainName } from "../../../common/misc/FormatValidator"
import { createWizardDialog, wizardPageWrapper } from "../../../common/gui/base/WizardDialog"
import { DialogType } from "../../../common/gui/base/Dialog"
import { ImapImportState, ImportState } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapImporter } from "../../workerUtils/imapimport/ImapImporter"

assertMainOrNode()

export interface ImapImportModelConfig {
	readonly imapAccountHost: string
	readonly imapAccountPort: number
	readonly imapAccountUsername: string
	readonly imapAccountPassword: string
	readonly rootImportMailFolderName: string
	readonly matchImportFoldersToTutanotaFolders: boolean
}

export class ImapImportModel {
	private _imapAccountHost: string
	private _imapAccountPort: number
	private _imapAccountUsername: string
	private _imapAccountPassword: string
	private revealImapAccountPassword: boolean = false
	private _rootImportMailFolderName: string
	private _imapImportState: ImapImportState
	private _matchImportFoldersToTutanotaFolders: boolean

	constructor(readonly config: ImapImportModelConfig) {
		this._imapAccountHost = config.imapAccountHost
		this._imapAccountPort = config.imapAccountPort
		this._imapAccountUsername = config.imapAccountUsername
		this._imapAccountPassword = config.imapAccountPassword
		this._rootImportMailFolderName = config.rootImportMailFolderName
		this._matchImportFoldersToTutanotaFolders = config.matchImportFoldersToTutanotaFolders
		this._imapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
	}

	get imapAccountHost(): string {
		return this._imapAccountHost
	}

	set imapAccountHost(value: string) {
		this._imapAccountHost = value
	}

	get imapAccountPort(): number {
		return this._imapAccountPort
	}

	set imapAccountPort(value: number) {
		this._imapAccountPort = value
	}

	get imapAccountUsername(): string {
		return this._imapAccountUsername
	}

	set imapAccountUsername(value: string) {
		this._imapAccountUsername = value
	}

	get imapAccountPassword(): string {
		return this._imapAccountPassword
	}

	set imapAccountPassword(value: string) {
		this._imapAccountPassword = value
	}

	get rootImportMailFolderName(): string {
		return this._rootImportMailFolderName
	}

	set rootImportMailFolderName(value: string) {
		this._rootImportMailFolderName = value
	}

	get matchImportFoldersToTutanotaFolders(): boolean {
		return this._matchImportFoldersToTutanotaFolders
	}

	set matchImportFoldersToTutanotaFolders(value: boolean) {
		this._matchImportFoldersToTutanotaFolders = value
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
		let cleanHostName = this.imapAccountHost.toLocaleLowerCase().trim()

		// if (!cleanHostName.length) {
		return null
		// }

		// if (!isDomainName(cleanHostName)) {
		// 	return "imapAccountHostInvalid_msg"
		// } else {
		// 	return null
		// }
	}

	validateImapAccount(): TranslationKey | null {
		let hostErrorMsg = this.validateImapAccountHost()

		if (hostErrorMsg) {
			return hostErrorMsg
		}

		let port = this.imapAccountPort
		let username = this.imapAccountUsername
		let password = this.imapAccountPassword

		if (port === 0 || username.length === 0 || password.length === 0) {
			return "imapAccountInvalid_msg"
		} else {
			return null
		}
	}

	validateRootImportMailFolder(): TranslationKey | null {
		// let cleanRootImportFolderName = this._rootImportMailFolderName().toLocaleLowerCase().trim()
		//
		// if (cleanRootImportFolderName.length === 0) {
		// 	return "imapImportRootMailFolderNameInvalid_msg"
		// } else {
		return null
		// }
	}
}

/** Shows a wizard for adding an IMAP import. */
export function showAddImapImportWizard(imapImporter: ImapImporter, imapImportModel: ImapImportModel): Promise<void> {
	const wizardPages = [
		wizardPageWrapper(EnterImapCredentialsPage, new EnterImapCredentialsPageAttrs(imapImportModel)),
		wizardPageWrapper(ConfigureImapImportPage, new ConfigureImapImportPageAttrs(imapImporter, imapImportModel)),
		wizardPageWrapper(ImapImportStartedPage, new ImapImportStartedPageAttrs(imapImporter, imapImportModel)),
	]
	return new Promise((resolve) => {
		const wizardBuilder = createWizardDialog({
			data: imapImportModel,
			pages: wizardPages,
			closeAction: () => {
				resolve()
				return Promise.resolve()
			},
			dialogType: DialogType.EditLarge,
		})
		const wizard = wizardBuilder.dialog
		const wizardAttrs = wizardBuilder.attrs
		wizard.show()
	})
}

import { ImapImportCredentialsPage, ImapImportCredentialsPageAttrs } from "./ImapImportCredentialsPage.js"
import ImapImportConfigurePage, { ImapImportConfigurePageAttrs } from "./ConfigureImapImportPage.js"
import { assertMainOrNode } from "@tutao/app-env"
import { ImapProvider, OauthConfigParams } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { TokenEndpointResponse } from "openid-client"
import { ImapMailbox } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { MailSet, ManageLabelServiceLabelData } from "@tutao/entities/tutanota"
import { createWizardDialog, wizardPageWrapper } from "../../../../ui/base/WizardDialog"
import { ImapImportProviderSelectionPage, ImapImportProviderSelectionPageAttrs } from "./ImapImportProviderSelectionPage"
import { ImapImportIntroductionPage, ImapImportIntroductionPageAttrs } from "./ImapImportIntroductionPage"
import ImapImportSummaryPage, { ImapImportSummaryPageAttrs } from "./ImapImportSummaryPage"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { ImapAccountSyncStatus } from "../../../../entities/tutanota/Utils"
import { MailSetMapping } from "../../workerUtils/imapimport/ImapImporter"
import { mailLocator } from "../../mailLocator"

assertMainOrNode()

export type ImapImportData = {
	oauthConfig?: OauthConfigParams
	imapAccountOAuthToken?: TokenEndpointResponse
	imapProvider: ImapProvider
	imapAccountHost: string
	imapAccountPort: number
	imapAccountUsername: string
	imapAccountPassword: string | undefined
	rootImportMailSetName: string
	spamFolderMigrationInformation: {
		shouldMigrateSpamFolder: boolean // flag to migrate spam folder to Tuta spam folder in case a root folder is provided for the account
		spamMailbox: ImapMailbox | null // the spam mailbox if it exists, null otherwise
	}
	imapAccountSyncStatus: ImapAccountSyncStatus
	matchImapMailboxesToTutaMailSets: boolean
	newlyCreatedFolders: Set<MailSet>
	imapMailboxes: ReadonlyArray<ImapMailbox>
	folderSystem: FolderSystem
	imapMailboxesToTutaMailSets?: Map<string, MailSetMapping>
	addLabelToImportedMails: boolean
	isImapServerSupportingOAuth: boolean
	imapSyncLabelData: ManageLabelServiceLabelData | null
	customCertificateData: Uint8Array | null
	ignoreCertificateErrors: boolean
}

/** Shows a wizard for adding an IMAP import. */
export function showAddImapImportWizard(imapImportData: ImapImportData): Promise<void> {
	const wizardPages = [
		wizardPageWrapper(ImapImportProviderSelectionPage, new ImapImportProviderSelectionPageAttrs(imapImportData)),
		wizardPageWrapper(ImapImportIntroductionPage, new ImapImportIntroductionPageAttrs(imapImportData)),
		wizardPageWrapper(ImapImportCredentialsPage, new ImapImportCredentialsPageAttrs(imapImportData)),
		wizardPageWrapper(ImapImportConfigurePage, new ImapImportConfigurePageAttrs(imapImportData)),
		wizardPageWrapper(ImapImportSummaryPage, new ImapImportSummaryPageAttrs(imapImportData)),
	]

	return new Promise((resolve) => {
		const wizardBuilder = createWizardDialog({
			data: imapImportData,
			pages: wizardPages,
			closeAction: async () => {
				resolve()
				if (imapImportData.imapAccountSyncStatus === ImapAccountSyncStatus.RUNNING) {
					Dialog.showImapInitializationSuccessfulDialog()
				} else if (imapImportData.imapAccountSyncStatus === ImapAccountSyncStatus.PAUSED) {
					for (const mailSet of imapImportData.newlyCreatedFolders) {
						await mailLocator.mailModel.finallyDeleteCustomMailFolder(mailSet)
					}
				}
				return Promise.resolve()
			},
			dialogType: DialogType.SetupWizard,
			windowFacade: windowFacade,
		})
		const wizard = wizardBuilder.dialog
		wizard.show()
	})
}

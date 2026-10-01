import { MigrationCredentialsPage, MigrationCredentialsPageAttrs } from "./MigrationCredentialsPage.js"
import MigrationConfigurePage, { MigrationConfigurePageAttrs } from "./MigrationConfigurePage.js"
import { EnvProvider } from "@tutao/app-env"
import { MailboxMigrationProvider, OauthConfigParams } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { TokenEndpointResponse } from "openid-client"
import { MigrationMailbox } from "../../../common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { MailSet, ManageLabelServiceLabelData } from "@tutao/entities/tutanota"
import { createWizardDialog, wizardPageWrapper } from "../../../../ui/base/WizardDialog"
import { MigrationProviderSelectionPage, MigrationProviderSelectionPageAttrs } from "./MigrationProviderSelectionPage"
import { MigrationIntroductionPage, MigrationIntroductionPageAttrs } from "./MigrationIntroductionPage"
import MigrationSummaryPage, { MigrationSummaryPageAttrs } from "./MigrationSummaryPage"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { MailboxMigrationSyncStatus } from "../../../../entities/tutanota/Utils"
import { MailSetMapping } from "../../workerUtils/migration/MailboxImporter"
import { mailLocator } from "../../mailLocator"

EnvProvider.assertMainOrNode()

export type MigrationData = {
	oauthConfig?: OauthConfigParams
	migrationAccountOAuthToken?: TokenEndpointResponse
	mailboxMigrationProvider: MailboxMigrationProvider
	imapAccountHost: string
	imapAccountPort: number
	useSSL: boolean
	imapAccountUsername: string
	imapAccountPassword: string | undefined
	rootImportMailSetName: string
	spamFolderMigrationInformation: {
		shouldMigrateSpamFolder: boolean // flag to migrate spam folder to Tuta spam folder in case a root folder is provided for the account
		spamMailbox: MigrationMailbox | null // the spam mailbox if it exists, null otherwise
	}
	mailboxMigrationSyncStatus: MailboxMigrationSyncStatus
	matchMigrationMailboxesToTutaMailSets: boolean
	newlyCreatedFolders: Set<MailSet>
	migrationMailboxes: ReadonlyArray<MigrationMailbox>
	folderSystem: FolderSystem
	migrationMailboxesToTutaMailSets?: Map<string, MailSetMapping>
	addLabelToImportedMails: boolean
	isMigratingServerSupportingOAuth: boolean
	migrationSyncLabelData: ManageLabelServiceLabelData | null
	customCertificateData: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors: boolean
}

/** Shows a wizard for adding a Migration import. */
export function showAddMigrationWizard(migrationData: MigrationData): Promise<void> {
	const wizardPages = [
		wizardPageWrapper(MigrationProviderSelectionPage, new MigrationProviderSelectionPageAttrs(migrationData)),
		wizardPageWrapper(MigrationIntroductionPage, new MigrationIntroductionPageAttrs(migrationData)),
		wizardPageWrapper(MigrationCredentialsPage, new MigrationCredentialsPageAttrs(migrationData)),
		wizardPageWrapper(MigrationConfigurePage, new MigrationConfigurePageAttrs(migrationData)),
		wizardPageWrapper(MigrationSummaryPage, new MigrationSummaryPageAttrs(migrationData)),
	]

	return new Promise((resolve) => {
		const wizardBuilder = createWizardDialog({
			data: migrationData,
			pages: wizardPages,
			closeAction: async () => {
				resolve()
				if (migrationData.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.RUNNING) {
					Dialog.showMigrationInitializationSuccessfulDialog()
				} else if (migrationData.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.PAUSED) {
					for (const mailSet of migrationData.newlyCreatedFolders) {
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

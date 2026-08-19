import { assertMainOrNode } from "@tutao/app-env"
import { createWizard } from "../../../../ui/base/wizard/Wizard"
import { WizardStepAttrs } from "../../../../ui/base/wizard/WizardStep"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import {
	getImapConfigForProvider,
	IMAP_SSL_PORT,
	ImapAuthType,
	ImapProvider,
	OauthConfigParams,
} from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { TokenEndpointResponse } from "openid-client"
import { MigrationMailboxRow } from "./MigrationCsvParser"
import { MigrationRowResult } from "./CustomerMigrationController"
import { MultiUserMigrationProviderSelectionPage } from "./MultiUserMigrationProviderSelectionPage"
import { MultiUserMigrationAuthenticationPage } from "./MultiUserMigrationAuthenticationPage"
import { migrationConfigureUsersOnNext, MultiUserMigrationConfigureUsersPage } from "./MultiUserMigrationConfigureUsersPage"
import { MultiUserMigrationSummaryPage } from "./MultiUserMigrationSummaryPage"

assertMainOrNode()

export type MultiUserMigrationData = {
	provider: ImapProvider
	host: string
	port: number
	useSSL: boolean
	adminUsername: string
	adminPassword: string
	isImapServerSupportingOAuth: boolean
	oauthConfig?: OauthConfigParams
	imapAccountOAuthToken?: TokenEndpointResponse
	customCertificateData: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors: boolean
	rows: MigrationMailboxRow[]
	/** `sourceEmail`s of `rows` the admin has ticked for creation/migration - all rows are selected by default. */
	selectedSourceEmails: Set<string>
	results: MigrationRowResult[]
}

export function newMultiUserMigrationData(): MultiUserMigrationData {
	const defaultProvider = ImapProvider.Gmail
	const defaultConfig = getImapConfigForProvider(defaultProvider)
	return {
		provider: defaultProvider,
		host: defaultConfig?.host ?? "",
		port: defaultConfig ? Number.parseInt(defaultConfig.port) : Number.parseInt(IMAP_SSL_PORT),
		useSSL: true,
		adminUsername: "",
		adminPassword: "",
		isImapServerSupportingOAuth: defaultConfig?.authType === ImapAuthType.Oauth2,
		oauthConfig: defaultConfig?.oauthConfig,
		imapAccountOAuthToken: undefined,
		customCertificateData: null,
		ignoreCertificateErrors: false,
		rows: [],
		selectedSourceEmails: new Set(),
		results: [],
	}
}

export const migrationWizardSteps: WizardStepAttrs<MultiUserMigrationData>[] = [
	{
		title: lang.getTranslationText("migrationSetup_title"),
		content: MultiUserMigrationProviderSelectionPage,
	},
	{
		title: lang.getTranslationText("migrationImapImap_title"),
		content: MultiUserMigrationAuthenticationPage,
	},
	{
		title: lang.getTranslationText("migrationConfigureUsers_title"),
		content: MultiUserMigrationConfigureUsersPage,
		onNext: migrationConfigureUsersOnNext,
		isBackButtonEnabled: () => false,
	},
	{
		title: lang.getTranslationText("migrationBatchSummary_title"),
		content: MultiUserMigrationSummaryPage,
		isBackButtonEnabled: () => false,
	},
]

/**
 * Creates a fresh wizard component for the admin multi-user migration flow: choose a provider, authenticate, upload a CSV, review results.
 * A new instance must be created every time the wizard is (re-)opened, since `createWizard` closes over step/transition state
 * that must not be shared across separate runs of the wizard.
 */
export function createMigrationWizard() {
	return createWizard<MultiUserMigrationData>()
}

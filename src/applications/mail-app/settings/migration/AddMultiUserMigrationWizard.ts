import { EnvProvider } from "@tutao/app-env"
import { createWizard } from "../../../../ui/base/wizard/Wizard"
import { WizardStepAttrs } from "../../../../ui/base/wizard/WizardStep"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import {
	getServerMigrationConfigForProvider,
	IMAP_SSL_PORT,
	MailboxMigrationProvider,
	MigrationAuthMethod,
	OauthConfigParams,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import type { TokenEndpointResponse } from "oauth4webapi"
import { MigrationMailboxRow } from "./MigrationCsvParser"
import { MigrationRowResult } from "./CustomerMigrationController"
import { MultiUserMigrationProviderSelectionPage } from "./MultiUserMigrationProviderSelectionPage"
import { MultiUserMigrationAuthenticationPage } from "./MultiUserMigrationAuthenticationPage"
import { migrationConfigureUsersOnNext, MultiUserMigrationConfigureUsersPage } from "./MultiUserMigrationConfigureUsersPage"
import { MultiUserMigrationSummaryPage } from "./MultiUserMigrationSummaryPage"

EnvProvider.assertMainOrNode()

export type MultiUserMigrationData = {
	provider: MailboxMigrationProvider
	isExchange: boolean
	host?: string
	port?: number
	useSSL: boolean
	adminUsername: string
	adminPassword?: string
	isImapServerSupportingOAuth: boolean
	oauthConfig?: OauthConfigParams
	adminOAuthToken?: TokenEndpointResponse
	customCertificateData?: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors?: boolean
	rows: MigrationMailboxRow[]
	selectedSourceEmails: Set<string>
	results: MigrationRowResult[]
}

export function newMultiUserMigrationData(): MultiUserMigrationData {
	const defaultProvider = MailboxMigrationProvider.Gmail
	const defaultConfig = getServerMigrationConfigForProvider(defaultProvider)
	return {
		provider: defaultProvider,
		isExchange: false,
		host: defaultConfig?.imapConfig?.host ?? "",
		port: defaultConfig?.imapConfig?.port ? defaultConfig.imapConfig.port : IMAP_SSL_PORT,
		useSSL: true,
		adminUsername: "",
		adminPassword: "",
		isImapServerSupportingOAuth: defaultConfig?.authMethod === MigrationAuthMethod.Oauth2,
		oauthConfig: defaultConfig?.oauthConfig,
		adminOAuthToken: undefined,
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

export function createMigrationWizard() {
	return createWizard<MultiUserMigrationData>()
}

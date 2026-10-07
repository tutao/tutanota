import { MailboxMigrationImapConfiguration } from "@tutao/entities/tutanota"
import { TranslationKey } from "../../../../../../ui/utils/LanguageViewModel"

export const enum MigrationAuthType {
	"Password",
	"Oauth2",
}
export const enum MailboxMigrationProvider {
	"Other",
	"Outlook",
	"Gmail",
}

export type OauthConfigParams = {
	clientId: string
	redirectUri: string
	scope: string
	server: string
	providerSpecificParams: Record<string, string>
	requiresClientSecret?: boolean
}

export const enum MigrationFetchMethod {
	Imap = "imap",
	GraphApi = "graphApi",
	GoogleApi = "googleApi",
}

export type ServerMigrationConfig = Pick<MailboxMigrationImapConfiguration, "host" | "port"> & {
	authType: MigrationAuthType
	oauthConfig?: OauthConfigParams
	fetchMethod: MigrationFetchMethod
}

export const IMAP_SSL_PORT = "993"
export const IMAP_UNSAFE_PORT = "143"

const wellKnownConfigs = {
	// Also checkable through https://autoconfig.thunderbird.net/v1.1/
	gmail: {
		host: "imap.gmail.com",
		port: IMAP_SSL_PORT,
		authType: MigrationAuthType.Oauth2, //Find out a way to communicate Oauth Need?
		fetchMethod: MigrationFetchMethod.GoogleApi,
		oauthConfig: {
			server: "https://accounts.google.com",
			clientId: "397205111573-me3bs8q166tgsrpjb7jg5k89ghb3jlm7.apps.googleusercontent.com", // webapp id
			redirectUri: "http://localhost/",
			scope: "https://www.googleapis.com/auth/gmail.readonly",
			providerSpecificParams: {
				access_type: "offline", // required for refresh token
			},
			requiresClientSecret: true,
		},
	},
	outlook: {
		host: "outlook.office365.com",
		port: IMAP_SSL_PORT,
		authType: MigrationAuthType.Oauth2,
		fetchMethod: MigrationFetchMethod.GraphApi,
		oauthConfig: {
			server: "https://login.microsoftonline.com/common/v2.0",
			clientId: "5e304219-20c3-4627-a9e9-ae884703bf62",
			redirectUri: "https://login.microsoftonline.com/common/oauth2/nativeclient",
			scope: "offline_access Mail.Read",
			providerSpecificParams: {
				response_mode: "query",
				tenant: "common",
			},
		},
	},
	// Yahoo is currently disabled as we do not have the necessary permissions to allow Imap access
	yahoo: {
		// See also: https://help.yahoo.com/kb/new-mail-for-desktop/imap-server-settings-yahoo-mail-sln4075.html
		host: "imap.mail.yahoo.com",
		port: IMAP_SSL_PORT,
		authType: MigrationAuthType.Oauth2,
		fetchMethod: MigrationFetchMethod.Imap,
		oauthConfig: {
			server: "https://api.login.yahoo.com/",
			// This works to log in, but we do not have the scope required for imap access.
			clientId: "dj0yJmk9VEdSclNGcmhBWjdsJmQ9WVdrOWJIbFlWRXhqY0hjbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTRk",
			redirectUri: "http://localhost/",
			scope: "openid",
			providerSpecificParams: {},
		},
	},
	gmx: {
		// See also: https://hilfe.gmx.net/pop-imap/imap/imap-serverdaten.html
		// GMX Requires user to allow access beforehand in the account settings.
		host: "imap.gmx.net",
		port: IMAP_SSL_PORT,
		authType: MigrationAuthType.Password,
		fetchMethod: MigrationFetchMethod.Imap,
	},
	webde: {
		// See also: https://hilfe.web.de/pop-imap/imap/imap-serverdaten.htm
		// web.de Requires user to allow access beforehand in the account settings.
		host: "imap.web.de",
		port: IMAP_SSL_PORT,
		authType: MigrationAuthType.Password,
		fetchMethod: MigrationFetchMethod.Imap,
	},
}

export function getServerMigrationConfigForProvider(provider: MailboxMigrationProvider): ServerMigrationConfig | null {
	switch (provider) {
		case MailboxMigrationProvider.Gmail:
			return wellKnownConfigs.gmail
		case MailboxMigrationProvider.Outlook:
			return wellKnownConfigs.outlook
		case MailboxMigrationProvider.Other:
		default:
			return null
	}
}

export function getTranslationForMigrationProvider(provider: MailboxMigrationProvider): TranslationKey {
	switch (provider) {
		case MailboxMigrationProvider.Gmail:
			return "migrationProviderGmail_label"
		case MailboxMigrationProvider.Outlook:
			return "migrationProviderOutlook_label"
		default:
			return "migrationImapProvider_label"
	}
}
export function getServerMigrationConfigForDomain(domain: string): ServerMigrationConfig | null {
	const isGmxDomain = domain.includes("gmx")
	if (isGmxDomain) {
		return wellKnownConfigs.gmx
	}

	const isWebDeDomain = domain.includes("web.de")
	if (isWebDeDomain) {
		return wellKnownConfigs.webde
	}

	return null
}

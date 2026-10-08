import { MailboxMigrationImapConfiguration } from "@tutao/entities/tutanota"
import { TranslationKey } from "../../../../../../ui/utils/LanguageViewModel"

export const enum MigrationAuthMethod {
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

export type ImapConfigParams = {
	host: string
	port: string
}

export const enum MigrationFetchMethod {
	Imap = "imap",
	GraphApi = "graphApi",
	GoogleApi = "googleApi",
}

export type ServerMigrationConfig = {
	domains: string[]
	fetchMethod: MigrationFetchMethod
	authMethod: MigrationAuthMethod
	oauthConfig?: OauthConfigParams
	imapConfig?: ImapConfigParams
}

export const IMAP_SSL_PORT = "993"
export const IMAP_UNSAFE_PORT = "143"

const migrationKnownConfigs = {
	// See also https://autoconfig.thunderbird.net/v1.1/
	gmail: {
		domains: ["gmail.com", "googlemail.com"],
		fetchMethod: MigrationFetchMethod.GoogleApi,
		authMethod: MigrationAuthMethod.Oauth2,
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
		domains: [
			"hotmail.com",
			"live.com",
			"msn.com",
			"outlook.com",
			"windowslive.com",
			"outlook.at",
			"outlook.be",
			"outlook.cl",
			"outlook.cz",
			"outlook.de",
			"outlook.dk",
			"outlook.es",
			"outlook.fr",
			"outlook.hu",
			"outlook.ie",
			"outlook.in",
			"outlook.it",
			"outlook.jp",
			"outlook.kr",
			"outlook.lv",
			"outlook.my",
			"outlook.ph",
			"outlook.pt",
			"outlook.sa",
			"outlook.sg",
			"outlook.sk",
			"outlook.co.id",
			"outlook.co.il",
			"outlook.co.th",
			"outlook.com.ar",
			"outlook.com.au",
			"outlook.com.br",
			"outlook.com.gr",
			"outlook.com.tr",
			"outlook.com.vn",
			"hotmail.be",
			"hotmail.ca",
			"hotmail.cl",
			"hotmail.cz",
			"hotmail.de",
			"hotmail.dk",
			"hotmail.es",
			"hotmail.fi",
			"hotmail.fr",
			"hotmail.gr",
			"hotmail.hu",
			"hotmail.it",
			"hotmail.lt",
			"hotmail.lv",
			"hotmail.my",
			"hotmail.nl",
			"hotmail.no",
			"hotmail.ph",
			"hotmail.rs",
			"hotmail.se",
			"hotmail.sg",
			"hotmail.sk",
			"hotmail.co.id",
			"hotmail.co.il",
			"hotmail.co.in",
			"hotmail.co.jp",
			"hotmail.co.kr",
			"hotmail.co.th",
			"hotmail.co.uk",
			"hotmail.co.za",
			"hotmail.com.ar",
			"hotmail.com.au",
			"hotmail.com.br",
			"hotmail.com.hk",
			"hotmail.com.tr",
			"hotmail.com.tw",
			"hotmail.com.vn",
			"live.at",
			"live.be",
			"live.ca",
			"live.cl",
			"live.cn",
			"live.de",
			"live.dk",
			"live.fi",
			"live.fr",
			"live.hk",
			"live.ie",
			"live.in",
			"live.it",
			"live.jp",
			"live.nl",
			"live.no",
			"live.ru",
			"live.se",
			"live.co.jp",
			"live.co.kr",
			"live.co.uk",
			"live.co.za",
			"live.com.ar",
			"live.com.au",
			"live.com.mx",
			"live.com.my",
			"live.com.ph",
			"live.com.pt",
			"live.com.sg",
			"livemail.tw",
		],
		fetchMethod: MigrationFetchMethod.GraphApi,
		authMethod: MigrationAuthMethod.Oauth2,
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
	other: [
		{
			// See also: https://hilfe.gmx.net/pop-imap/imap/imap-serverdaten.html
			// GMX Requires user to allow access beforehand in the account settings.
			domains: ["gmx.net", "gmx.de", "gmx.at", "gmx.ch", "gmx.eu", "gmx.biz", "gmx.org", "gmx.info", "mein.gmx", "mail.gmx", "email.gmx"],
			fetchMethod: MigrationFetchMethod.Imap,
			authMethod: MigrationAuthMethod.Password,
			imapConfig: {
				host: "imap.gmx.net",
				port: IMAP_SSL_PORT,
			},
		},
		{
			domains: ["web.de"],
			// See also: https://hilfe.web.de/pop-imap/imap/imap-serverdaten.htm
			// web.de Requires user to allow access beforehand in the account settings.
			fetchMethod: MigrationFetchMethod.Imap,
			authMethod: MigrationAuthMethod.Password,
			imapConfig: {
				host: "imap.web.de",
				port: IMAP_SSL_PORT,
			},
		},
		{
			domains: [
				"posteo.de",
				"posteo.at",
				"posteo.be",
				"posteo.ca",
				"posteo.ch",
				"posteo.cl",
				"posteo.co",
				"posteo.co.uk",
				"posteo.com",
				"posteo.com.br",
				"posteo.cr",
				"posteo.cz",
				"posteo.dk",
				"posteo.ee",
				"posteo.es",
				"posteo.eu",
				"posteo.fi",
				"posteo.gl",
				"posteo.gr",
				"posteo.hn",
				"posteo.hr",
				"posteo.hu",
				"posteo.ie",
				"posteo.in",
				"posteo.is",
				"posteo.it",
				"posteo.jp",
				"posteo.la",
				"posteo.li",
				"posteo.lt",
				"posteo.lu",
				"posteo.me",
				"posteo.mx",
				"posteo.my",
				"posteo.net",
				"posteo.nl",
				"posteo.no",
				"posteo.nz",
				"posteo.org",
				"posteo.pe",
				"posteo.pl",
				"posteo.pm",
				"posteo.pt",
				"posteo.ro",
				"posteo.se",
				"posteo.sg",
				"posteo.si",
				"posteo.tn",
				"posteo.uk",
				"posteo.us",
			],
			// See also: https://hilfe.web.de/pop-imap/imap/imap-serverdaten.htm
			// web.de Requires user to allow access beforehand in the account settings.
			fetchMethod: MigrationFetchMethod.Imap,
			authMethod: MigrationAuthMethod.Password,
			imapConfig: {
				host: "posteo.de",
				port: IMAP_SSL_PORT,
			},
		},
	],
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

export function getServerMigrationConfigForProvider(provider: MailboxMigrationProvider): ServerMigrationConfig | null {
	switch (provider) {
		case MailboxMigrationProvider.Gmail:
			return migrationKnownConfigs.gmail
		case MailboxMigrationProvider.Outlook:
			return migrationKnownConfigs.outlook
		default:
			return null
	}
}

export function getServerMigrationConfigForDomain(domain: string): ServerMigrationConfig | null {
	if (migrationKnownConfigs.gmail.domains.includes(domain)) {
		return migrationKnownConfigs.gmail
	}

	if (migrationKnownConfigs.outlook.domains.includes(domain)) {
		return migrationKnownConfigs.outlook
	}

	return migrationKnownConfigs.other.find((config) => config.domains.includes(domain)) ?? null
}

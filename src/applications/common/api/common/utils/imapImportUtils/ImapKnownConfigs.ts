import { ImapAccount } from "@tutao/entities/tutanota"
import { TranslationKey } from "../../../../../../ui/utils/LanguageViewModel"

export const enum ImapAuthType {
	"Password",
	"Oauth2",
}
export const enum ImapProvider {
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

/**
 * Distinguishes providers synced over plain IMAP from providers synced through a provider-specific API
 * (e.g. Outlook via Microsoft Graph). Lets callers dispatch on transport without hardcoding provider checks,
 * and keeps the door open for other providers (e.g. Gmail via the Gmail API) to move to `GraphApi`-style
 * transports later without reshaping this type again.
 */
export const enum ImapTransport {
	Imap = "imap",
	GraphApi = "graphApi",
}

export type ServerImapImportParams = Pick<ImapAccount, "host" | "port"> & {
	authType: ImapAuthType
	oauthConfig?: OauthConfigParams
	transport: ImapTransport
}

export const IMAP_SSL_PORT = "993"
export const IMAP_UNSAFE_PORT = "143"

const wellKnownConfigs = {
	// Also checkable through https://autoconfig.thunderbird.net/v1.1/
	gmail: {
		// See also Imap docs: http://mail.google.com/support/bin/topic.py?topic=12805
		host: "imap.gmail.com",
		port: IMAP_SSL_PORT,
		authType: ImapAuthType.Oauth2, //Find out a way to communicate Oauth Need?
		transport: ImapTransport.Imap,
		oauthConfig: {
			server: "https://accounts.google.com",
			clientId: "519651146463-m678auj2tuup41i6ihibcdrq5qblhq42.apps.googleusercontent.com", // webapp id
			redirectUri: "http://localhost/",
			scope: "https://mail.google.com/",
			providerSpecificParams: {
				access_type: "offline", // required for refresh token
				prompt: "consent", // forces refresh token on first login
			},
			requiresClientSecret: true,
		},
	},
	outlook: {
		// Outlook mail is synced through Microsoft Graph (see M365SyncSession), not IMAP. host/port are kept
		// only because the persisted ImapAccount entity requires non-null values; they are not used for sync.
		host: "outlook.office365.com",
		port: IMAP_SSL_PORT,
		authType: ImapAuthType.Oauth2,
		transport: ImapTransport.GraphApi,
		oauthConfig: {
			server: "https://login.microsoftonline.com/common/v2.0",
			clientId: "5e304219-20c3-4627-a9e9-ae884703bf62",
			redirectUri: "https://login.microsoftonline.com/common/oauth2/nativeclient",
			// Mail.Read covers reading mail folders (including child folders) and messages - there is no
			// separate folder-read permission. Read-only is sufficient since folder naming/hierarchy for
			// Outlook comes directly from Graph's folder tree, not from IMAP path strings.
			scope: "offline_access Mail.Read",
			providerSpecificParams: {
				prompt: "consent",
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
		authType: ImapAuthType.Oauth2,
		transport: ImapTransport.Imap,
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
		authType: ImapAuthType.Password,
		transport: ImapTransport.Imap,
	},
	webde: {
		// See also: https://hilfe.web.de/pop-imap/imap/imap-serverdaten.htm
		// web.de Requires user to allow access beforehand in the account settings.
		host: "imap.web.de",
		port: IMAP_SSL_PORT,
		authType: ImapAuthType.Password,
		transport: ImapTransport.Imap,
	},
}

export function getImapConfigForProvider(provider: ImapProvider): ServerImapImportParams | null {
	switch (provider) {
		case ImapProvider.Gmail:
			return wellKnownConfigs.gmail
		case ImapProvider.Outlook:
			return wellKnownConfigs.outlook
		case ImapProvider.Other:
		default:
			return null
	}
}

export function getTranslationForImapProvider(provider: ImapProvider): TranslationKey {
	switch (provider) {
		case ImapProvider.Gmail:
			return "migrationProviderGmail_label"
		case ImapProvider.Outlook:
			return "migrationProviderOutlook_label"
		default:
			return "migrationImapProvider_label"
	}
}
export function getImapConfigWithPasswordAuthForDomain(domain: string): ServerImapImportParams | null {
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

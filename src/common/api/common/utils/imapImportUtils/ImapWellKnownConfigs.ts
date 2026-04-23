import { InitializeImapImportParams } from "../../../../../mail-app/workerUtils/imapimport/ImapImporter"

const enum ImapAuthType {
	"Password",
	"Oauth2",
}

export type ServerImapImportParams = Pick<InitializeImapImportParams, "host" | "port">

const IMAP_SSL_PORT = 993

const wellKnownConfigs = {
	// Also checkable through https://autoconfig.thunderbird.net/v1.1/
	gmail: {
		// See also Imap docs: http://mail.google.com/support/bin/topic.py?topic=12805
		host: "imap.gmail.com",
		port: IMAP_SSL_PORT,
		auth: ImapAuthType.Oauth2, //Find out a way to communicate Oauth Need?
	},
	microsoft: {
		//See also: https://support.office.com/article/pop-imap-and-smtp-settings-for-outlook-com-d088b986-291d-42b8-9564-9c414e2aa040
		host: "outlook.office365.com",
		port: IMAP_SSL_PORT,
		auth: ImapAuthType.Oauth2,
	},
	yahoo: {
		// See also: https://help.yahoo.com/kb/new-mail-for-desktop/imap-server-settings-yahoo-mail-sln4075.html
		host: "imap.mail.yahoo.com",
		auth: ImapAuthType.Oauth2,
		port: IMAP_SSL_PORT,
	},
	gmx: {
		// See also: https://hilfe.gmx.net/pop-imap/imap/imap-serverdaten.html
		// GMX Requires user to allow access beforehand in the account settings.
		host: "imap.gmx.net",
		auth: ImapAuthType.Password,
		port: IMAP_SSL_PORT,
	},
	webde: {
		// See also: https://hilfe.web.de/pop-imap/imap/imap-serverdaten.htm
		// web.de Requires user to allow access beforehand in the account settings.
		host: "imap.web.de",
		port: IMAP_SSL_PORT,
		auth: ImapAuthType.Password,
	},
}

export function getConfigForDomain(domain: string): ServerImapImportParams | null {
	const isMicrosoftDomain = domain.includes("outlook.") || domain.includes("live.") || domain.includes("hotmail.") || domain.includes("msn.com")
	if (isMicrosoftDomain) {
		return wellKnownConfigs.microsoft
	}
	const isYahooDomain = domain.includes("yahoo.")
	if (isYahooDomain) {
		return wellKnownConfigs.yahoo
	}
	const isGoogleDomain = domain.includes("gmail.com") || domain.includes("googlemail.com") || domain.includes("google.com")
	if (isGoogleDomain) {
		return wellKnownConfigs.gmail
	}
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

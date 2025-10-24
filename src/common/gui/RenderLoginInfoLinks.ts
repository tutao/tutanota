import m, { Children } from "mithril"
import { isApp, isDesktop } from "../api/common/Env.js"
import { ExternalLink } from "./base/ExternalLink.js"
import { InfoLink, lang } from "../misc/LanguageViewModel.js"
import { createDropdown } from "./base/Dropdown.js"
import { mapNullable } from "@tutao/tutanota-utils"
import { getWhitelabelCustomizations } from "../misc/WhitelabelCustomizations.js"
import { locator } from "../api/main/CommonLocator.js"
import { clientInfoString } from "../misc/ErrorReporter.js"
import { showLogsDialog } from "./LogDialogUtils.js"
import { LanguageDropdown } from "./LanguageDropdown"

export function renderInfoLinks(): Children {
	const privacyPolicyLink = getPrivacyStatementLink()
	const imprintLink = getImprintLink()

	return m(
		".flex.col.mt-l",
		m(
			".flex.wrap.justify-center.gap-vpad",
			!isApp() && privacyPolicyLink
				? m(ExternalLink, {
						href: privacyPolicyLink,
						text: lang.get("privacyLink_label"),
						isCompanySite: true,
						specialType: "privacy-policy",
					})
				: null,
			!isApp() && imprintLink
				? m(ExternalLink, {
						href: imprintLink,
						text: lang.get("imprint_label"),
						isCompanySite: true,
						specialType: "license",
					})
				: null,

			m(LanguageDropdown, { variant: "Link" }),
		),
		m(
			".mt.mb.center.small.full-width",
			{
				onclick: (e: MouseEvent) => showVersionDropdown(e),
			},
			`v${env.versionNumber}`,
		),
	)
}

function getImprintLink(): string | null {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.imprintUrl) || InfoLink.About
}

function getPrivacyStatementLink(): string | null {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.privacyStatementUrl) || InfoLink.Privacy
}

/**
 * Show a simple dialog with client info and all the logs inside of it.
 */
function showVersionDropdown(e: MouseEvent) {
	// A semi-hidden option to get the logs before logging in, in a text form
	createDropdown({
		lazyButtons: () => [
			{
				label: "getLogs_action",
				click: () => prepareLogContent().then((logInfo) => showLogsDialog(logInfo)),
			},
		],
	})(e, e.target as HTMLElement)
}

async function prepareLogContent() {
	const entries: string[] = []
	if (window.logger) {
		entries.push(`== MAIN LOG ==
${window.logger.getEntries().join("\n")}
`)
	}
	const workerLog = await locator.workerFacade.getLog()
	if (workerLog.length > 0) {
		entries.push(`== WORKER LOG ==
${workerLog.join("\n")}
`)
	}

	if (isDesktop() || isApp()) {
		entries.push(`== NATIVE LOG ==
${await locator.commonSystemFacade.getLog()}
`)
	}
	let { message, type, client } = clientInfoString(new Date(), false)
	return `v${env.versionNumber} - ${client}
${message}

${entries.join("\n")}`
}

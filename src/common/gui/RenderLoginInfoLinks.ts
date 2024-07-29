import m, { Children } from "mithril"
import { isApp, isDesktop } from "../api/common/Env.js"
import { ExternalLink } from "./base/ExternalLink.js"
import { InfoLink, lang } from "../misc/LanguageViewModel.js"
import { createDropdown } from "./base/Dropdown.js"
import { mapNullable } from "@tutao/tutanota-utils"
import { getWhitelabelCustomizations } from "../misc/WhitelabelCustomizations.js"
import { Dialog } from "./base/Dialog.js"
import { ButtonType } from "./base/Button.js"
import { copyToClipboard } from "../misc/ClipboardUtils.js"
import { locator } from "../api/main/CommonLocator.js"
import { clientInfoString } from "../misc/ErrorReporter.js"

export function renderInfoLinks(): Children {
	const privacyPolicyLink = getPrivacyStatementLink()
	const imprintLink = getImprintLink()
	return m(
		".flex.col.mt-l",
		m(
			".flex.wrap.justify-center",
			!isApp() && privacyPolicyLink
				? m(ExternalLink, {
						href: privacyPolicyLink,
						text: lang.get("privacyLink_label"),
						class: "plr",
						isCompanySite: true,
						specialType: "privacy-policy",
				  })
				: null,
			!isApp() && imprintLink
				? m(ExternalLink, {
						href: imprintLink,
						text: lang.get("imprint_label"),
						class: "plr",
						isCompanySite: true,
						specialType: "license",
				  })
				: null,
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
				label: () => "Get logs",
				click: () => showLogsDialog(),
			},
		],
	})(e, e.target as HTMLElement)
}

async function showLogsDialog() {
	const logContent = await prepareLogContent()

	const dialog: Dialog = Dialog.editDialog(
		{
			middle: () => "Logs",
			right: () => [
				{
					type: ButtonType.Secondary,
					label: "copy_action",
					click: () => copyToClipboard(logContent),
				},
				{
					type: ButtonType.Primary,
					label: "ok_action",
					click: () => dialog.close(),
				},
			],
		},
		class {
			view() {
				return m(".fill-absolute.selectable.scroll.white-space-pre.plr.pt.pb", logContent)
			}
		},
		{},
	)
	dialog.show()
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

import { locator } from "../api/main/CommonLocator.js"
import { isApp, isDesktop } from "../api/common/Env.js"
import { clientInfoString } from "../misc/ErrorReporter.js"
import { Dialog } from "../gui/base/Dialog.js"
import { ButtonType } from "../gui/base/Button.js"
import { copyToClipboard } from "../misc/ClipboardUtils.js"
import m from "mithril"

/**
 * Show a simple dialog with client info and all the logs inside of it.
 */
export async function showLogsDialog() {
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

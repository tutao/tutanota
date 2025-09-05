import type { Dialog } from "./base/Dialog.js"
import { lang } from "../misc/LanguageViewModel.js"
import { ButtonType } from "./base/Button.js"
import { copyToClipboard } from "../misc/ClipboardUtils.js"
import m from "mithril"
import { locator } from "../api/main/CommonLocator.js"
import { clientInfoString } from "../misc/ErrorReporter.js"

export async function showLogsDialog(logContent: string) {
	const { Dialog: dialog } = await import("./base/Dialog.js")

	const dialogComponent: Dialog = dialog.editDialog(
		{
			middle: lang.makeTranslation("logs", "Logs"),
			right: () => [
				{
					type: ButtonType.Secondary,
					label: "copy_action",
					click: () => copyToClipboard(logContent),
				},
				{
					type: ButtonType.Primary,
					label: "ok_action",
					click: () => dialogComponent.close(),
				},
			],
		},
		class {
			view() {
				return m(".fill-absolute.selectable.scroll.white-space-pre.plr-12.pt-16.pb-16", logContent)
			}
		},
		{},
	)

	dialogComponent.show()
}

export async function prepareWidgetLogs(nativeLog: string) {
	const entries: string[] = [nativeLog]
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

	let { message, type, client } = clientInfoString(new Date(), false)
	return `v${env.versionNumber} - ${client}
${message}

${entries.join("\n")}`
}

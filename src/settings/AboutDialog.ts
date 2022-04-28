import m, {Children, Component, Vnode} from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {getColouredTutanotaLogo} from "../gui/theme"
import {isApp, isDesktop} from "../api/common/Env"
import {createLogFile} from "../api/common/Logger"
import {downcast} from "@tutao/tutanota-utils"
import {clientInfoString, showUserError} from "../misc/ErrorHandlerImpl"
import {locator} from "../api/main/MainLocator"
import {InfoLink,} from "../misc/LanguageViewModel"
import {newMailEditorFromTemplate} from "../mail/editor/MailEditor"
import {UserError} from "../api/main/UserError"
import {Attachment} from "../mail/editor/SendMailModel";

export class AboutDialog implements Component {
	view(vnode: Vnode): Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(".center.mt", m.trust(getColouredTutanotaLogo())),
			m(".flex.justify-center.mt-l.flex-wrap", [
				this._aboutLink(InfoLink.HomePage, "Website"),
				this._aboutLink("https://github.com/tutao/tutanota/releases", "Releases"),
			]),
			m(".flex.justify-center.flex-wrap", [m("p.center.mt.mlr", `v${env.versionNumber}`), m("p.text-center.mlr", "GPL-v3"), m("p", "© 2021 Tutao GmbH")]),
			this._sendLogsLink(),
		])
	}

	_sendLogsLink(): Children {
		return m(
			".mt.right",
			m(ButtonN, {
				label: () => "Send Logs",
				click: () => this._sendDeviceLogs(),
				type: ButtonType.Primary,
			}),
		)
	}

	_aboutLink(href: string, text: string): Children {
		return m(
			"a.no-text-decoration.mlr.mt",
			{
				href: href,
				target: "_blank",
			},
			[m(".underline", text)],
		)
	}

	async _sendDeviceLogs(): Promise<void> {
		const attachments: Array<Attachment> = []
		const timestamp = new Date()
		const global = downcast<Window>(window)

		if (global.logger) {
			const mainEntries = global.logger.getEntries()
			const mainLogFile = createLogFile(timestamp.getTime(), mainEntries, "main")
			attachments.push(mainLogFile)
			const workerLogEntries = await locator.worker.getLog()
			const workerLogFile = await createLogFile(timestamp.getTime(), workerLogEntries, "worker")
			attachments.push(workerLogFile)
		}

		if (isDesktop()) {
			const desktopEntries = await locator.systemApp.getDesktopLogs()
			const desktopLogFile = createLogFile(timestamp.getTime(), desktopEntries, "desktop")
			attachments.push(desktopLogFile)
		}

		if (isApp()) {
			const fileReference = await locator.systemApp.getDeviceLogs()
			fileReference.name = `${timestamp.getTime()}_device_tutanota.log`
			attachments.push(fileReference)
		}

		const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
		let {message, type, client} = clientInfoString(timestamp, true)
		message = message
			.split("\n")
			.filter(Boolean)
			.map(l => `<div>${l}<br></div>`)
			.join("")

		try {
			const editor = await newMailEditorFromTemplate(
				mailboxDetails,
				{},
				`Device logs v${env.versionNumber} - ${type} - ${client}`,
				message,
				attachments,
				true,
			)
			editor.show()
		} catch (e) {
			if (e instanceof UserError) {
				await showUserError(e)
			} else {
				throw e
			}
		}
	}
}
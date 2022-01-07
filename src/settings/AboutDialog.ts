// @flow
import m from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {getColouredTutanotaLogo, theme} from "../gui/theme"
import {isApp, isDesktop} from "../api/common/Env"
import {createLogFile} from "../api/common/Logger"
import {downcast, stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {clientInfoString, showUserError} from "../misc/ErrorHandlerImpl"
import {locator} from "../api/main/MainLocator"
import {lang} from "../misc/LanguageViewModel"
import {newMailEditorFromTemplate} from "../mail/editor/MailEditor"
import {createDataFile} from "../api/common/DataFile"
import {UserError} from "../api/main/UserError"

export class AboutDialog implements MComponent<void> {
	view(vnode: Vnode<void>): Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(".center.mt", m.trust(getColouredTutanotaLogo())),
			m(".flex.justify-center.mt-l.flex-wrap", [
				this._aboutLink(lang.getInfoLink("homePage_link"), "Website"),
				this._aboutLink('https://github.com/tutao/tutanota/releases', 'Releases'),
			]),
			m(".flex.justify-center.flex-wrap", [
				m("p.center.mt.mlr", `v${env.versionNumber}`),
				m("p.text-center.mlr", "GPL-v3"),
				m("p", "© 2021 Tutao GmbH")
			]),
			this._sendLogsLink(),
		])
	}

	_sendLogsLink(): Children {
		return m(".mt.right", m(ButtonN, {
				label: () => 'Send Logs',
				click: () => this._sendDeviceLogs(),
				type: ButtonType.Primary
			})
		)
	}

	_aboutLink(href: string, text: string): Children {
		return m("a.no-text-decoration.mlr.mt", {
				href: href,
				target: '_blank'
			}, [
				m(".underline", text)
			]
		)
	}

	async _sendDeviceLogs(): Promise<void> {

		const attachments = []

		const timestamp = new Date()

		const global = downcast(window)
		if (global.logger) {
			const mainEntries = global.logger.getEntries()
			const mainLogFile = createLogFile(timestamp.getTime(), mainEntries, "main")
			attachments.push(mainLogFile)
			const workerLogEntries = await locator.worker.getLog()
			const workerLogFile = await createLogFile(timestamp.getTime(), workerLogEntries, "worker")
			attachments.push(workerLogFile)
		}

		const {getSearchIndexDebugLogs} = await import("../misc/IndexerDebugLogger")
		const logs = getSearchIndexDebugLogs()

		if (logs) {
			attachments.push(createDataFile("indexer_debug.log", "text/plain", stringToUtf8Uint8Array(logs)))
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
		message = message.split("\n").filter(Boolean).map((l) => `<div>${l}<br></div>`).join("")

		try {
			const editor = await newMailEditorFromTemplate(mailboxDetails, {}, `Device logs v${env.versionNumber} - ${type} - ${client}`, message, attachments, true)
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


// @flow
import m from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {theme} from "../gui/theme"
import {isApp, isDesktop} from "../api/common/Env"
import {worker} from "../api/main/WorkerClient"
import {createLogFile} from "../api/common/Logger"
import {downcast} from "../api/common/utils/Utils"
import {clientInfoString, showUserError} from "../misc/ErrorHandlerImpl"
import {locator} from "../api/main/MainLocator"
import {lang} from "../misc/LanguageViewModel"
import {newMailEditorFromTemplate} from "../mail/editor/MailEditor"
import {UserError} from "../api/main/UserError"
import {stringToUtf8Uint8Array} from "../api/common/utils/Encoding"
import {createDataFile} from "../api/common/DataFile"

export class AboutDialog implements MComponent<void> {
	view(vnode: Vnode<void>): ?Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(".center.mt", m.trust(theme.logo)),
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

	_sendDeviceLogs(): void {

		const attachments = []

		const timestamp = new Date()

		const global = downcast(window)
		let p = Promise.resolve()
		if (global.logger) {
			const mainEntries = global.logger.getEntries()
			p = createLogFile(timestamp.getTime(), mainEntries, "main")
				.then((mainLogFile) => attachments.push(mainLogFile))
				.then(() => worker.getLog())
				.then((workerLogEntries) => createLogFile(timestamp.getTime(), workerLogEntries, "worker"))
				.then((workerLogFile) => attachments.push(workerLogFile))
		}

	p = p.then(() => import("../misc/IndexerDebugLogger"))
	     .then(({getSearchIndexDebugLogs}) => {
		     const logs = getSearchIndexDebugLogs()
		     if (logs) {
		        attachments.push(createDataFile("indexer_debug.log", "text/plain", stringToUtf8Uint8Array(logs)))
		     }
	     })

		if (isDesktop()) {
			p = p
				.then(() => import("../native/main/SystemApp"))
				.then(({getDesktopLogs}) => getDesktopLogs())
				.then((desktopEntries) => createLogFile(timestamp.getTime(), desktopEntries, "desktop"))
				.then((desktopLogFile) => attachments.push(desktopLogFile))
		}

		if (isApp()) {
			p = p
				.then(() => import("../native/main/SystemApp"))
				.then(({getDeviceLogs}) => getDeviceLogs())
				.then(fileReference => {
					fileReference.name = `${timestamp.getTime()}_device_tutanota.log`
					attachments.push(fileReference)
				})
		}

		p.then(_ => locator.mailModel.getUserMailboxDetails())
		 .then((mailboxDetails) => {
			 let {message, type, client} = clientInfoString(timestamp, true)
			 message = message.split("\n").filter(Boolean).map((l) => `<div>${l}<br></div>`).join("")
			 return newMailEditorFromTemplate(mailboxDetails, {}, `Device logs v${env.versionNumber} - ${type} - ${client}`, message, attachments, true)
		 })
		 .then(editor => editor.show())
		 .catch(UserError, showUserError)
	}
}


import m from "mithril"
import {ButtonN} from "../gui/base/ButtonN"
import {getDesktopLogs, getDeviceLogs} from "../native/SystemApp"
import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"
import {ButtonType} from "../gui/base/Button"
import {LogoSvg} from "../gui/base/icons/Logo"
import {isColorLight} from "../calendar/CalendarUtils"
import {theme} from "../gui/theme"
import {isApp, isDesktop} from "../api/Env"
import {worker} from "../api/main/WorkerClient"
import {createLogFile} from "../api/common/Logger"
import {downcast} from "../api/common/utils/Utils"
import {clientInfoString} from "../misc/ErrorHandlerImpl"

export class AboutDialog implements MComponent<void> {
	view(vnode: Vnode<void>): ?Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(".center.mt", m.trust(isColorLight(theme.content_bg.slice(1)) ? LogoSvg.Red : LogoSvg.Cyan)),
			m(".flex.justify-center.mt-l.flex-wrap", [
				aboutLink("https://tutanota.com", "Website"),
				aboutLink('https://github.com/tutao/tutanota/releases', 'Releases'),
			]),
			m(".flex.justify-center.flex-wrap", [
				m("p.center.mt.mlr", `v${env.versionNumber}`),
				m("p.text-center.mlr", "GPL-v3"),
				m("p", "© 2019: Tutao GmbH")
			]),
			sendLogsLink(),
		])
	}
}

function sendLogsLink(): Children {
	return m(".mt.right", m(ButtonN, {
			label: () => 'Send Logs',
			click: () => sendDeviceLogs(),
			type: ButtonType.Primary
		})
	)
}

function aboutLink(href, text): Children {
	return m("a.no-text-decoration.mlr.mt", {
			href: href,
			target: '_blank'
		}, [
			m(".underline", text)
		]
	)
}

function sendDeviceLogs() {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const timestamp = new Date()
	let {message, type, client} = clientInfoString(timestamp)
	message = message.split("\n").filter(Boolean).map((l) => `<div>${l}<br></div>`).join("")
	editor.initWithTemplate(null, null, `Device logs v${env.versionNumber} - ${type} - ${client}`, message, true)
	const global = downcast(window)
	let p = Promise.resolve()
	if (global.logger) {
		p = worker.getLog().then(workerLogEntries => {
			const mainEntries = global.logger.getEntries()
			editor.attachFiles([
				createLogFile(timestamp.getTime(), mainEntries, "main"),
				createLogFile(timestamp.getTime(), workerLogEntries, "worker")
			])
		})
	}

	if (isDesktop()) {
		p = p.then(() => {
			return getDesktopLogs()
				.then((desktopEntries) => {
					const desktopLogFile = createLogFile(timestamp.getTime(), desktopEntries, "desktop")
					editor.attachFiles([desktopLogFile])
				})
		})
	}

	if (isApp()) {
		p = p.then(() => {
			getDeviceLogs()
				.then((fileReference) => {
					fileReference.name = `${timestamp.getTime()}_device_tutanota.log`
					editor.attachFiles([fileReference])
				})
		})
	}
	p.then(() => {
		editor.show()
	})
}

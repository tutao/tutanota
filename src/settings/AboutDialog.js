// @flow
import m from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {LogoSvg} from "../gui/base/icons/Logo"
import {theme} from "../gui/theme"
import {isApp, isDesktop} from "../api/common/Env"
import {worker} from "../api/main/WorkerClient"
import {createLogFile} from "../api/common/Logger"
import {downcast} from "../api/common/utils/Utils"
import {clientInfoString, showUserError} from "../misc/ErrorHandlerImpl"
import {locator} from "../api/main/MainLocator"
import {isColorLight} from "../gui/base/Color"
import {lang} from "../misc/LanguageViewModel"
import {newMailEditorFromTemplate} from "../mail/editor/MailEditor"
import {UserError} from "../api/main/UserError"

export class AboutDialog implements MComponent<void> {
	view(vnode: Vnode<void>): ?Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(".center.mt", m.trust(isColorLight(theme.content_bg.slice(1)) ? LogoSvg.Red : LogoSvg.Cyan)),
			m(".flex.justify-center.mt-l.flex-wrap", [
				aboutLink(lang.getInfoLink("homePage_link"), "Website"),
				aboutLink('https://github.com/tutao/tutanota/releases', 'Releases'),
			]),
			m(".flex.justify-center.flex-wrap", [
				m("p.center.mt.mlr", `v${env.versionNumber}`),
				m("p.text-center.mlr", "GPL-v3"),
				m("p", "© 2020 Tutao GmbH")
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

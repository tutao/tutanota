import m from "mithril"
import {ButtonN} from "../gui/base/ButtonN"
import {getDeviceLogs} from "../native/SystemApp"
import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"
import {ButtonType} from "../gui/base/Button"
import {lang} from "../misc/LanguageViewModel"
import {getPrivacyStatementLink} from "../login/LoginView"
import {isAndroidApp} from "../api/Env"
import {LogoSvg} from "../gui/base/icons/Logo"
import {isColorLight} from "../calendar/CalendarUtils"
import {theme} from "../gui/theme"

export class AboutDialog implements MComponent<void> {
	view(vnode: Vnode<void>): ?Children {
		return m(".flex.col", [
			m(".center.mt", m.trust(isColorLight(theme.content_bg.slice(1)) ? LogoSvg.Red : LogoSvg.Cyan)),
			m(".flex.justify-center.mt-l.flex-wrap", [
				aboutLink("https://tutanota.com", "Website"),
				aboutLink('https://github.com/tutao/tutanota/releases', 'Releases'),
				aboutLink('https://github.com/tutao/tutanota/', 'Source Code'),
				aboutLink(getPrivacyStatementLink(), lang.get("privacyLink_label")),
			]),
			m(".flex.justify-center", [
				m("p.center.mt.mlr", `v${env.versionNumber}`),
				m("p.text-center.mlr", "GPL-v3"),
				m("p", "© 2019: Tutao GmbH")
			]),
			sendLogsLink(),
		])
	}
}

function sendLogsLink(): Children {
	return isAndroidApp()
		? m(".mt.right", m(ButtonN, {
				label: () => 'Send Logs',
				click: () => sendDeviceLogs(),
				type: ButtonType.Primary
			})
		)
		: null
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
	getDeviceLogs()
		.then((fileReference) => {
			const editor = new MailEditor(mailModel.getUserMailboxDetails())
			editor.initWithTemplate(null, null, "Device logs " + env.versionNumber, "", true)
			editor.attachFiles([fileReference])
			editor.show()
		})
}

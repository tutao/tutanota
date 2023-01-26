import m, { Children, Component, Vnode } from "mithril"
import { Button, ButtonType } from "../gui/base/Button.js"
import { getColouredTutanotaLogo } from "../gui/theme"
import { showUserError } from "../misc/ErrorHandlerImpl"
import { locator } from "../api/main/MainLocator"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { newMailEditorFromTemplate } from "../mail/editor/MailEditor"
import { UserError } from "../api/main/UserError"
import { clientInfoString, getLogAttachments } from "../misc/ErrorReporter"

export class AboutDialog implements Component {
	view(vnode: Vnode): Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(".center.mt", m.trust(getColouredTutanotaLogo())),
			m(".flex.justify-center.mt-l.flex-wrap", [
				this._aboutLink(InfoLink.HomePage, "Website"),
				this._aboutLink("https://github.com/tutao/tutanota/releases", "Releases"),
			]),
			m(".flex.justify-center.flex-wrap", [m("p.center.mt.mlr", `v${env.versionNumber}`), m("p.text-center.mlr", "GPL-v3"), m("p", "© 2023 Tutao GmbH")]),
			this._sendLogsLink(),
		])
	}

	_sendLogsLink(): Children {
		return m(
			".mt.right",
			m(Button, {
				label: () => lang.get("sendLogs_action"),
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
		const timestamp = new Date()
		const attachments = await getLogAttachments(timestamp)
		const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
		let { message, type, client } = clientInfoString(timestamp, true)
		message = message
			.split("\n")
			.filter(Boolean)
			.map((l) => `<div>${l}<br></div>`)
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

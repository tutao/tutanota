import m, { Children, Component, Vnode } from "mithril"
import { Button, ButtonType } from "../gui/base/Button.js"
import { getLightOrDarkTutaLogo } from "../gui/theme.js"
import { showUserError } from "../misc/ErrorHandlerImpl.js"
import { locator } from "../api/main/CommonLocator.js"
import { InfoLink, lang } from "../misc/LanguageViewModel.js"
import { newMailEditorFromTemplate } from "../../mail-app/mail/editor/MailEditor.js"
import { UserError } from "../api/main/UserError.js"
import { clientInfoString, getLogAttachments } from "../misc/ErrorReporter.js"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { isApp } from "../api/common/Env.js"
import { px, size } from "../gui/size.js"
import { client } from "../misc/ClientDetector.js"

interface AboutDialogAttrs {
	onShowSetupWizard: () => unknown
}

export class AboutDialog implements Component<AboutDialogAttrs> {
	view(vnode: Vnode<AboutDialogAttrs>): Children {
		return m(".flex.col", [
			m(".center.mt", "Powered by"),
			m(
				".center",
				// Our logo must be padded but at least a certain amount.
				// This might be a bit more than needed but it's safe.
				{
					style: {
						margin: px(size.vpad_xl),
					},
				},
				m.trust(getLightOrDarkTutaLogo(client.isCalendarApp())),
			),
			m(".flex.justify-center.flex-wrap", [
				m(ExternalLink, { href: InfoLink.HomePage, text: "Website", isCompanySite: true, specialType: "me", class: "mlr mt" }),
				m(ExternalLink, {
					href: "https://github.com/tutao/tutanota/releases",
					text: "Releases",
					isCompanySite: false,
					class: "mlr mt",
				}),
			]),
			m(".flex.justify-center.selectable.flex-wrap", [
				m("p.center.mt.mlr", `v${env.versionNumber}`),
				m("p.text-center.mlr", "GPL-v3"),
				m("p", "© 2024 Tutao GmbH"),
			]),
			this._sendLogsLink(),
			// wrap it in a div so that it's not filling the whole width
			isApp()
				? m(
						"",
						m(Button, {
							label: () => "Show welcome dialog",
							type: ButtonType.Primary,
							click: vnode.attrs.onShowSetupWizard,
						}),
				  )
				: null,
		])
	}

	_sendLogsLink(): Children {
		return m(
			".mt",
			m(Button, {
				label: () => lang.get("sendLogs_action"),
				click: () => this._sendDeviceLogs(),
				type: ButtonType.Primary,
			}),
		)
	}

	async _sendDeviceLogs(): Promise<void> {
		const timestamp = new Date()
		const attachments = await getLogAttachments(timestamp)
		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
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

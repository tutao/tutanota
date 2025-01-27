import m, { Children } from "mithril"
import { assertMainOrNode, isDesktop, isWebClient } from "../../common/api/common/Env"
import { lang } from "../../common/misc/LanguageViewModel"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { mailLocator } from "../mailLocator.js"
import { MailExportSettings } from "./MailExportSettings"
import { MailExportController } from "../native/main/MailExportController.js"
import { LoginButton, LoginButtonType } from "../../common/gui/base/buttons/LoginButton"

assertMainOrNode()

export class MailExportViewer implements UpdatableSettingsViewer {
	private mailExportController: MailExportController | null = null

	constructor() {
		this.view = this.view.bind(this)

		if (isDesktop()) {
			// export is only available on desktop
			mailLocator.mailExportController().then((controller) => {
				this.mailExportController = controller
				m.redraw()
			})
		}
	}

	view(): Children {
		return [
			m(
				".fill-absolute.scroll.plr-l.pb-xl",
				m(".h4.mt-l", lang.get("mailExportSettings_label")),
				this.mailExportController
					? m(MailExportSettings, {
							mailboxDetails: mailLocator.mailboxModel.mailboxDetails(),
							logins: mailLocator.logins,
							mailExportController: this.mailExportController,
					  })
					: this.renderExportOnlyOnDesktopText(),
			),
		]
	}

	private renderExportOnlyOnDesktopText() {
		return [
			m(
				".flex-column.mt",
				m(".p", lang.get("mailExportOnlyOnDesktop_label")),
				m(
					".flex-start.mt-l",
					m(LoginButton, {
						type: LoginButtonType.FlexWidth,
						label: "downloadDesktopClient_label",
						onclick: () => {
							const desktopClientDownloadUri = "https://tuta.com#download"
							if (isWebClient()) {
								open(desktopClientDownloadUri)
							} else {
								mailLocator.systemFacade.openLink(desktopClientDownloadUri)
							}
						},
					}),
				),
				m(
					".flex-v-center.full-width.mt-xl",
					m("img", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/mail-import/email-import-webapp.svg`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						class: "settings-illustration-large",
					}),
				),
			),
		]
	}

	async entityEventsReceived(): Promise<void> {
		return Promise.resolve()
	}
}

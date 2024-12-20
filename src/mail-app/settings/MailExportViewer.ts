import m, { Children } from "mithril"
import { assertMainOrNode, isDesktop } from "../../common/api/common/Env"
import { InfoLink, lang } from "../../common/misc/LanguageViewModel"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { mailLocator } from "../mailLocator.js"
import { MailExportSettings } from "./MailExportSettings"
import { MailExportController } from "../native/main/MailExportController.js"
import { Button, ButtonType } from "../../common/gui/base/Button"

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
				m(".h4.mt-l", lang.get("exportMailbox_label")),
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
				".flex-column.center.mt-m",
				m("img.onboarding-logo.mt-m", {
					src: `${window.tutao.appState.prefixWithoutFile}/images/tuta-desktop-illustration.webp`,
					alt: "",
					rel: "noreferrer",
					loading: "lazy",
					decoding: "async",
					class: "onboarding-logo-large",
				}),
				m(".p.mt-m", lang.get("mailExportOnlyOnDesktop_label")),
				m(
					".flex-center.mt-m",
					m(Button, {
						type: ButtonType.Primary,
						label: "downloadDesktopClient_label",
						click: () => {
							open(InfoLink.Download)
						},
					}),
				),
			),
		]
	}

	async entityEventsReceived(): Promise<void> {
		return Promise.resolve()
	}
}

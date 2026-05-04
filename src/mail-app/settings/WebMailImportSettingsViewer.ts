import m, { Children } from "mithril"
import { lang } from "../../ui/utils/LanguageViewModel"
import { PrimaryButton } from "../../ui/base/buttons/VariantButtons.js"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { mailLocator } from "../mailLocator.js"
import { isBrowser } from "@tutao/app-env"
import { EntityUpdateData } from "../../instance-pipeline/EntityUpdateUtils"

/**
 * Settings viewer for mail import rendered only in the WebApp, Android and iOS.
 * See {@link DesktopMailImportSettingsViewer} for the Desktop client.
 */
export class WebMailImportSettingsViewer implements UpdatableSettingsViewer {
	constructor() {}

	view(): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48", [m(".h4.mt-32", lang.get("mailImportSettings_label")), this.renderNoImportOnWebText()])
	}

	private renderNoImportOnWebText() {
		return [
			m(
				".flex-column.mt-16",
				m(".p", lang.get("mailImportNoImportOnWeb_label")),
				m(
					".flex-start.mt-32",
					m(PrimaryButton, {
						width: "flex",
						label: "mailImportDownloadDesktopClient_label",
						onclick: () => {
							const desktopClientDownloadUri = "https://tuta.com#download"
							if (isBrowser()) {
								open(desktopClientDownloadUri)
							} else {
								mailLocator.systemFacade.openLink(desktopClientDownloadUri)
							}
						},
					}),
				),
				m(
					".flex-v-center.full-width.mt-48",
					m("img", {
						src: `/images/mail-import/email-import-webapp.svg`,
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

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {}
}

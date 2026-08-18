import m, { Children } from "mithril"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { isBrowser } from "@tutao/app-env"
import { mailLocator } from "../../mailLocator"
import { EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

/**
 * Settings viewer for migration rendered only in the WebApp, Android and iOS.
 * See {@link MigrationViewer} for the Desktop client.
 */
export class WebMigrationViewer implements UpdatableSettingsViewer {
	constructor() {}

	view(): Children {
		const title = "migration_title"
		return m(".fill-absolute.scroll.plr-24.pb-48", [m(".h4.mt-32", lang.getTranslationText(title)), this.renderNoImportOnWebText()])
	}

	private renderNoImportOnWebText() {
		return [
			m(
				".flex-column.mt-16",
				m(".p", lang.getTranslationText("migrationNoMigrationOnWeb_label")),
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

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {}
}

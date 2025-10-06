import m, { Children } from "mithril"
import { lazy } from "@tutao/tutanota-utils"
import { lang } from "../../common/misc/LanguageViewModel"
import { LoginButton, LoginButtonType } from "../../common/gui/base/buttons/LoginButton"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { EntityUpdateData } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { mailLocator } from "../mailLocator.js"
import { isWebClient } from "../../common/api/common/Env.js"
import stream from "mithril/stream"

/**
 * Settings viewer for mail import rendered only in the WebApp, Android and iOS.
 * See {@link DesktopMailImportSettingsViewer} for the Desktop client.
 */
export class WebMailImportSettingsViewer implements UpdatableSettingsViewer {
	view(): Children {
		return m(".fill-absolute.scroll.plr-l.pb-xl", [m(".h4.mt-l", lang.get("mailImportSettings_label")), this.renderNoImportOnWebText()])
	}

	private renderNoImportOnWebText() {
		return [
			m(
				".flex-column.mt",
				m(".p", lang.get("mailImportNoImportOnWeb_label")),
				m(
					".flex-start.mt-l",
					m(LoginButton, {
						type: LoginButtonType.FlexWidth,
						label: "mailImportDownloadDesktopClient_label",
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

				// m(
				// 	".flex-v-center.full-width.mt-xl",
				// 	m("img", {
				// 		src: `${window.tutao.appState.prefixWithoutFile}/images/dynamic-color-test.svg`,
				// 		alt: "",
				// 		rel: "noreferrer",
				// 		loading: "lazy",
				// 		decoding: "async",
				// 		class: "settings-illustration-large",
				// 	}),
				// ),
			),
		]
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {}
}

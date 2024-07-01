import { NewsListItem } from "../NewsListItem.js"
import { NewsId } from "../../../api/entities/tutanota/TypeRefs.js"
import Mithril from "mithril"
import m from "mithril"
import { isAndroidApp, isIOSApp } from "../../../api/common/Env.js"
import { lang } from "../../LanguageViewModel.js"
import { Button, ButtonType } from "../../../gui/base/Button.js"
import { NewsModel } from "../NewsModel.js"
import { showCredentialsEncryptionModeDialog } from "../../../gui/dialogs/SelectCredentialsEncryptionModeDialog.js"
import { CredentialsProvider } from "../../credentials/CredentialsProvider.js"
import { Dialog } from "../../../gui/base/Dialog.js"
import { ExternalLink } from "../../../gui/base/ExternalLink.js"

const playstoreLink = "https://play.google.com/store/apps/details?id=de.tutao.tutanota"
const appstoreLink = "https://apps.apple.com/app/tutanota/id922429609"

/**
 * News item that reminds the user of configuring pin/ biometrics
 */
export class PinBiometricsNews implements NewsListItem {
	constructor(private readonly newsModel: NewsModel, private readonly credentialsProvider: CredentialsProvider, private readonly userId: Id) {}

	isShown(newsId: NewsId): Promise<boolean> {
		return Promise.resolve((isIOSApp() || isAndroidApp()) && !this.newsModel.hasAcknowledgedNewsForDevice(newsId.newsItemId))
	}

	render(newsId: NewsId): Mithril.Children {
		const displayedLink = isAndroidApp() ? playstoreLink : appstoreLink
		return m(".full-width", [
			m(".h4", { style: { "text-transform": "capitalize" } }, lang.get("pinBiometrics_action")),
			m("p", lang.get("pinBiometrics1_msg", { "{secureNowAction}": lang.get("secureNow_action") })),
			m("p", lang.get("pinBiometrics2_msg")),
			m("p", [m(".text-break", [m(ExternalLink, { href: displayedLink, isCompanySite: false })])]),
			m("p", lang.get("pinBiometrics3_msg")),
			m(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", [
				this.renderLaterButton(newsId),
				this.renderDismissButton(newsId),
				this.renderConfirmButton(newsId),
			]),
		])
	}

	private renderLaterButton(newsId: NewsId) {
		return m(Button, {
			label: "decideLater_action",
			type: ButtonType.Secondary,
			click: async () => {
				await this.newsModel.acknowledgeNews(newsId.newsItemId)
				m.redraw()
			},
		})
	}

	private renderDismissButton(newsId: NewsId) {
		return m(Button, {
			label: "noThanks_action",
			type: ButtonType.Secondary,
			click: async () => {
				this.newsModel.acknowledgeNewsForDevice(newsId.newsItemId)
				await this.newsModel.acknowledgeNews(newsId.newsItemId)
				m.redraw()
			},
		})
	}

	private renderConfirmButton(newsId: NewsId) {
		return m(Button, {
			label: "secureNow_action",
			click: async () => {
				if ((await this.credentialsProvider.getCredentialsInfoByUserId(this.userId)) === null) {
					await Dialog.message(() => lang.get("needSavedCredentials_msg", { "{storePasswordAction}": lang.get("storePassword_action") }))
				} else {
					await showCredentialsEncryptionModeDialog(this.credentialsProvider)

					this.newsModel.acknowledgeNewsForDevice(newsId.newsItemId)
					await this.newsModel.acknowledgeNews(newsId.newsItemId)
					m.redraw()
				}
			},
			type: ButtonType.Primary,
		})
	}
}

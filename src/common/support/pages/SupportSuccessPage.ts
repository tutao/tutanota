import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../gui/base/icons/Icons.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { client } from "../../misc/ClientDetector"
import { TUTA_CALENDAR_APP_STORE_URL, TUTA_CALENDAR_GOOGLE_PLAY_URL, TUTA_MAIL_APP_STORE_URL, TUTA_MAIL_GOOGLE_PLAY_URL } from "@tutao/app-env"
import { locator } from "../../api/main/CommonLocator.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { Card } from "../../gui/base/Card"
import { SecondaryButton } from "../../gui/base/buttons/VariantButtons"

type SupportSuccessPageAttrs = {
	dialog: Dialog
}

export class SupportSuccessPage implements Component<SupportSuccessPageAttrs> {
	view(vnode: Vnode<SupportSuccessPageAttrs>): Children {
		return m(
			".pt-16.pb-16",
			m(
				Card,
				m(
					".plr-12",
					m(".h4.pb-8.pt-8", lang.get("supportSuccess_msg")),
					m("p.m-0", lang.get("supportRatingRequest_msg")),
					m(
						".mt-32.mb-8",
						{},
						m("img.block.full-width.height-100p", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/problem.png`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
						}),
					),
				),
			),
			m(".pb-8.pt-8.flex.row.gap-8.fit-height.box-content", this.renderAppStoreLinks(vnode.attrs.dialog)),
		)
	}

	/**
	 * Desktop, Web -> Rate Tuta Mail on Google Play and App Store
	 * Tuta Mail App -> Rate Tuta Mail on Google Play and App Store
	 * Tuta Calendar App -> Rate Tuta Calendar on Google Play and App Store
	 */
	private renderAppStoreLinks(dialog: Dialog) {
		const closeDialog = () => dialog.close()

		if (client.isCalendarApp()) {
			return m.fragment({}, [
				this.renderAppStoreLink(TUTA_CALENDAR_APP_STORE_URL, closeDialog),
				this.renderGooglePlayLink(TUTA_CALENDAR_GOOGLE_PLAY_URL, closeDialog),
			])
		} else {
			return m.fragment({}, [
				this.renderAppStoreLink(TUTA_MAIL_APP_STORE_URL, closeDialog),
				this.renderGooglePlayLink(TUTA_MAIL_GOOGLE_PLAY_URL, closeDialog),
			])
		}
	}

	private renderAppStoreLink(url: string, onClick: VoidFunction) {
		return m(SecondaryButton, {
			label: "rateAppStore_action",
			class: "flex-grow",
			onclick: () => {
				const usageTest = locator.usageTestController.getTest("support.rating")
				const stage = usageTest.getStage(0)
				stage.setMetric({ name: "Result", value: "RatedAppStore" })
				void stage.complete()

				onClick()

				windowFacade.openLink(url)
			},
			icon: Icons.OpenOutline,
		})
	}

	private renderGooglePlayLink(url: string, onClick: VoidFunction) {
		return m(SecondaryButton, {
			label: "rateGooglePlay_action",
			class: "flex-grow",
			onclick: () => {
				const usageTest = locator.usageTestController.getTest("support.rating")
				const stage = usageTest.getStage(0)
				stage.setMetric({ name: "Result", value: "RatedGooglePlay" })
				void stage.complete()

				onClick()

				windowFacade.openLink(url)
			},
			icon: Icons.OpenOutline,
		})
	}
}

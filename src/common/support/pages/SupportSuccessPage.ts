import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../gui/base/Card.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { client } from "../../misc/ClientDetector"
import {
	TUTA_CALENDAR_APP_STORE_URL,
	TUTA_CALENDAR_GOOGLE_PLAY_URL,
	TUTA_MAIL_APP_STORE_URL,
	TUTA_MAIL_GOOGLE_PLAY_URL,
} from "../../api/common/TutanotaConstants"
import { locator } from "../../api/main/CommonLocator.js"
import { Dialog } from "../../gui/base/Dialog.js"

type SupportSuccessPageAttrs = {
	dialog: Dialog
}

export class SupportSuccessPage implements Component<SupportSuccessPageAttrs> {
	view(vnode: Vnode<SupportSuccessPageAttrs>): Children {
		return m(
			".pt-16.pb-16",
			m(
				Card,
				{ shouldDivide: true },
				m(
					".plr-12",
					m(".h4.center.pb-8.pt-8", lang.get("supportSuccess_msg")),
					m("p.center.m-0", lang.get("supportRatingRequest_msg")),
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
				this.renderAppStoreLinks(vnode.attrs.dialog),
			),
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
		return m(SectionButton, {
			text: "rateAppStore_action",
			onclick: () => {
				const usageTest = locator.usageTestController.getTest("support.rating")
				const stage = usageTest.getStage(0)
				stage.setMetric({ name: "Result", value: "RatedAppStore" })
				void stage.complete()

				onClick()

				windowFacade.openLink(url)
			},
			rightIcon: { icon: Icons.Open, title: "open_action" },
		})
	}

	private renderGooglePlayLink(url: string, onClick: VoidFunction) {
		return m(SectionButton, {
			text: "rateGooglePlay_action",
			onclick: () => {
				const usageTest = locator.usageTestController.getTest("support.rating")
				const stage = usageTest.getStage(0)
				stage.setMetric({ name: "Result", value: "RatedGooglePlay" })
				void stage.complete()

				onClick()

				windowFacade.openLink(url)
			},
			rightIcon: { icon: Icons.Open, title: "open_action" },
		})
	}
}

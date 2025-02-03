import m, { Children, Component } from "mithril"
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

export class SupportSuccessPage implements Component {
	view(): Children {
		return m(
			".pt.pb",
			m(
				Card,
				{ shouldDivide: true },
				m(
					".plr",
					m(".h4.center.pb-s.pt-s", lang.get("supportSuccess_msg")),
					m("p.center.m-0", lang.get("supportRatingRequest_msg")),
					m(
						".mt-l.mb-s",
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
				this.renderAppStoreLinks(),
			),
		)
	}

	/**
	 * Desktop, Web -> Rate Tuta Mail on Google Play and App Store
	 * Tuta Mail App -> Rate Tuta Mail on Google Play and App Store
	 * Tuta Calendar App -> Rate Tuta Calendar on Google Play and App Store
	 */
	private renderAppStoreLinks() {
		if (client.isCalendarApp()) {
			return m.fragment({}, [this.renderAppStoreLink(TUTA_CALENDAR_APP_STORE_URL), this.renderGooglePlayLink(TUTA_CALENDAR_GOOGLE_PLAY_URL)])
		} else {
			return m.fragment({}, [this.renderAppStoreLink(TUTA_MAIL_APP_STORE_URL), this.renderGooglePlayLink(TUTA_MAIL_GOOGLE_PLAY_URL)])
		}
	}

	private renderAppStoreLink(url: string) {
		return m(SectionButton, {
			text: "rateAppStore_action",
			onclick: () => {
				windowFacade.openLink(url)
			},
			rightIcon: { icon: Icons.Open, title: "open_action" },
		})
	}

	private renderGooglePlayLink(url: string) {
		return m(SectionButton, {
			text: "rateGooglePlay_action",
			onclick: () => {
				windowFacade.openLink(url)
			},
			rightIcon: { icon: Icons.Open, title: "open_action" },
		})
	}
}

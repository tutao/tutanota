import m, { Children, Component } from "mithril"
import { Card } from "../../gui/base/Card.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { client } from "../../misc/ClientDetector.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { isIOSApp } from "../../api/common/Env"
import { TUTA_MAIL_APP_STORE_URL, TUTA_MAIL_GOOGLE_PLAY_URL } from "../../api/common/TutanotaConstants"

export class SupportRequestSentPage implements Component {
	view(): Children {
		const isCalendarApp = client.isCalendarApp()

		return m(
			".pt.pb.flex.gap-vpad.col",
			m(
				Card,
				m(
					"",
					m(".h4.center.pb-s.pt-s", lang.get("supportRequestReceived_title")),
					m("p.center.m-0", lang.get("supportRequestReceived_msg")),
					m(
						".mt-l.mb-s",
						{},
						m("img.pb.block.full-width.height-100p", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/other.png`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
						}),
					),
				),
			),
			isCalendarApp
				? m(Card, { shouldDivide: true }, m(".plr.pt.pb", "You can access the response in Tuta Mail using your Tuta Calendar credentials."), [
						m(SectionButton, {
							text: "getTutaMail_action",
							onclick: () => {
								windowFacade.openLink(isIOSApp() ? TUTA_MAIL_APP_STORE_URL : TUTA_MAIL_GOOGLE_PLAY_URL)
							},
							rightIcon: { icon: Icons.Download, title: "download_action" },
						}),
						m(SectionButton, {
							text: "viewInWeb_action",
							onclick: () => {
								windowFacade.openLink("https://app.tuta.com/")
							},
							rightIcon: { icon: Icons.Open, title: "open_action" },
						}),
				  ])
				: null,
		)
	}
}

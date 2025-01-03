import m, { Children, Component } from "mithril"
import { Card } from "../../gui/base/Card.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { BlueskyLogo, Icons, MastodonLogo } from "../../gui/base/icons/Icons.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { lang } from "../../misc/LanguageViewModel.js"

export class SupportSuccessPage implements Component {
	view(): Children {
		return m(
			".pt.pb",
			m(
				Card,
				{ shouldDivide: true },
				m(
					".plr",
					m(".h4.pb-s.pt-s", lang.get("supportSuccess_msg")),
					m("p.m-0", lang.get("supportSocialsInfo_msg")),
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
				m(SectionButton, {
					text: { text: "Tuta Blog", testId: "" },
					injectionLeft: m("img", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/logo-favicon-152.png`,
						alt: "Tuta.com logo",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: { width: "24px", height: "24px" },
					}),
					rightIcon: { icon: Icons.Open, title: "close_alt" },
					onclick: () => {
						windowFacade.openLink("https://tuta.com/blog")
					},
				}),
				m(SectionButton, {
					text: { text: "X", testId: "" },
					leftIcon: { icon: Icons.X, title: "twitter_label" },
					rightIcon: { icon: Icons.Open, title: "open_action" },
					onclick: () => {
						windowFacade.openLink("https://x.com/TutaPrivacy")
					},
				}),
				m(SectionButton, {
					text: { text: "Mastodon", testId: "" },
					rightIcon: { icon: Icons.Open, title: "open_action" },
					injectionLeft: m(
						".",
						{
							style: {
								width: "24px",
								height: "24px",
							},
						},
						m.trust(MastodonLogo),
					),
					onclick: () => {
						windowFacade.openLink("https://mastodon.social/@Tutanota")
					},
				}),
				m(SectionButton, {
					text: { text: "BlueSky", testId: "" },
					injectionLeft: m(
						".",
						{
							style: {
								width: "24px",
								height: "24px",
							},
						},
						m.trust(BlueskyLogo),
					),
					rightIcon: { icon: Icons.Open, title: "open_action" },
					onclick: () => {
						windowFacade.openLink("https://bsky.app/profile/tutaprivacy.bsky.social")
					},
				}),
			),
		)
	}
}

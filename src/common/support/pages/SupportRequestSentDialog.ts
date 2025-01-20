import m, { Children, Component } from "mithril"
import { Card } from "../../gui/base/Card.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { windowFacade } from "../../misc/WindowFacade.js"

export class SupportRequestSentDialog implements Component {
	view(): Children {
		return m(
			".pt.pb",
			m(
				Card,
				{ shouldDivide: true },
				m(
					"section.plr-l.pb-s.pt-s",
					m(".h4.pb-s.pt-s", "Glad you found what you were looking for!"),
					m("p.m-0", "Get more tips, updates and breaking news about privacy on our social networks and blog."),
					m(
						".mt-l.mb-s",
						{},
						m("img.pb.block.full-width.height-100p", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/problem.png`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
						}),
					),
				),
				m(SectionButton, {
					leftIcon: { icon: Icons.Reddit, title: "cancel_action", fill: theme.content_accent },
					text: "Mastodon (TODO: Clarify)",
					onclick: () => {
						// windowFacade.openLink("https://reddit.com/r/tutanota")
					},
					rightIcon: { icon: Icons.Open, title: "close_alt" },
				}),
				m(SectionButton, {
					text: "Tuta Blog",
					injectionLeft: m("img", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/logo-favicon-152.png`,
						alt: "Tuta.com logo",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: { width: "20px", height: "20px", padding: "2px" },
					}),
					rightIcon: { icon: Icons.Open, title: "close_alt" },
					onclick: () => {
						windowFacade.openLink("https://tuta.com/blog")
					},
				}),
			),
		)
	}
}

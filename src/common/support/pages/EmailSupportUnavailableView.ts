import m, { Children, Component } from "mithril"
import { Icons } from "../../gui/base/icons/Icons.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { showUpgradeDialog } from "../../gui/nav/NavFunctions.js"
import { Card } from "../../gui/base/Card.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { theme } from "../../gui/theme.js"

export class EmailSupportUnavailableView implements Component {
	view(): Children {
		return m(
			".pt.pb",
			m(
				Card,
				{ shouldDivide: true },
				m("section.plr-l.pt-s.pb-s", [
					m(".h4.mt-xs", "Your plan doesn't offer direct support"),
					m(
						"p",
						"Sorry, your free plan does not support direct email support. But you can get more help from Tuta's Community at Reddit or at Tuta's official FAQ page.",
					),
					m("img.block", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/account.png`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: {
							margin: "0 auto",
							width: "100%",
						},
					}),
				]),
				m(SectionButton, {
					leftIcon: { icon: Icons.Reddit, title: "cancel_action", fill: theme.content_accent },
					text: "Reddit",
					onclick: () => {
						windowFacade.openLink("https://reddit.com/r/tutanota")
					},
					rightIcon: { icon: Icons.Open, title: "close_alt" },
				}),
				m(SectionButton, {
					text: "Tuta FAQ",
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
						windowFacade.openLink("https://tuta.com/support")
					},
				}),
			),
			m(
				".mt.center",
				m(BaseButton, {
					label: "Upgrade to a paid plan with email support",
					text: "Upgrade to a paid plan with email support",
					class: `button-content border-radius accent-bg center plr-button flash full-width`,
					onclick: () => {
						showUpgradeDialog()
					},
					disabled: false,
				}),
			),
		)
	}
}

import m, { Children, Component } from "mithril"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ExternalLink } from "../../gui/base/ExternalLink.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { showUpgradeDialog } from "../../gui/nav/NavFunctions.js"
import { Card } from "../../gui/base/Card.js"

export class EmailSupportUnavailableView implements Component {
	view(): Children {
		return m(
			".pt.pb",
			m(
				Card,
				{ rootElementType: "div" },
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
				m(".flex-center.mt-s.mb-s", { style: { gap: "1em" } }, [
					m(".flex.gap-vpad-xs.center-vertically", [
						m(Icon, { icon: Icons.Reddit, size: IconSize.Medium }),
						m(ExternalLink, {
							text: "Reddit",
							href: "https://reddit.com/r/tutanota",
							isCompanySite: false,
						}),
					]),
					m(".flex.gap-vpad-xs.center-vertically", [
						m("img", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/logo-favicon-152.png`,
							alt: "Tuta.com logo",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
							style: { width: "16px", height: "16px" },
						}),
						m(ExternalLink, { text: "Tuta FAQ", href: "https://tuta.com/support", isCompanySite: true }),
					]),
				]),
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

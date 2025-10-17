import m, { Children, Component, Vnode } from "mithril"
import { Icons, TutaFavicon } from "../../gui/base/icons/Icons.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { showUpgradeDialog } from "../../gui/nav/NavFunctions.js"
import { Card } from "../../gui/base/Card.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { locator } from "../../api/main/CommonLocator.js"
import { SupportDialogState } from "../SupportDialog.js"
import { lang } from "../../misc/LanguageViewModel.js"

type EmailSupportUnavailableAttrs = {
	data: SupportDialogState
	goToContactSupportPage: () => void
}

export class EmailSupportUnavailablePage implements Component<EmailSupportUnavailableAttrs> {
	view({ attrs: { data, goToContactSupportPage } }: Vnode<EmailSupportUnavailableAttrs>): Children {
		return m(
			".pt-16.pb-16",
			m(
				Card,
				{ shouldDivide: true },
				m("div.pt-8.pb-8.plr-12", [
					m(".h4.mt-4", lang.get("supportNoDirectSupport_title")),
					m("p", lang.get("supportNoDirectSupport_msg")),
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
					text: { text: "Tuta FAQ", testId: "" },
					injectionLeft: m(
						".",
						{
							style: {
								width: "24px",
								height: "24px",
							},
						},
						m.trust(TutaFavicon),
					),
					rightIcon: { icon: Icons.Open, title: "open_action" },
					onclick: () => {
						windowFacade.openLink("https://tuta.com/support")
					},
				}),
			),
			m(
				".mt-32.center",
				m(BaseButton, {
					label: "upgrade_action",
					text: lang.get("upgrade_action"),
					class: `button-content border-radius accent-bg center plr-8 flash full-width`,
					onclick: async () => {
						await showUpgradeDialog()

						const isPaidPlanNow = !locator.logins.getUserController().isFreeAccount()

						if (isPaidPlanNow) {
							data.canHaveEmailSupport = true
							setTimeout(() => {
								goToContactSupportPage()
							}, 1000)
						}
					},
					disabled: false,
				}),
			),
		)
	}
}

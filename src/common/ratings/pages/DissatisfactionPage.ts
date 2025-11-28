import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { UserSatisfactionDialogPage } from "../UserSatisfactionDialog.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Card } from "../../gui/base/Card.js"
import { client } from "../../misc/ClientDetector.js"
import { px } from "../../gui/size.js"
import { theme } from "../../gui/theme.js"

interface DissatisfactionPageAttrs {
	dialog: Dialog
	navigate: (page: UserSatisfactionDialogPage) => void
}

export class DissatisfactionPage implements Component<DissatisfactionPageAttrs> {
	private dialog: Dialog | null = null

	oncreate(vnode: Vnode<DissatisfactionPageAttrs>): void {
		this.dialog = vnode.attrs.dialog
	}

	view({ attrs: { dialog, navigate } }: Vnode<DissatisfactionPageAttrs>): Children {
		return m(
			"div.flex.flex-column.height-100p.gap-16",
			{
				style: {
					padding: "1em 0",
				},
			},
			m("img.pb-16.block.center-h", {
				src: `${window.tutao.appState.prefixWithoutFile}/images/rating/ears-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
				alt: "",
				rel: "noreferrer",
				loading: "lazy",
				decoding: "async",
				style: {
					width: "80%",
					maxWidth: px(320),
				},
			}),
			m(
				".text-center",
				{
					style: {
						padding: "1em 0",
					},
				},
				[m(".h1", lang.get("ratingDissatisfied_title")), m("p", { style: { margin: 0 } }, lang.get("ratingDissatisfied_msg"))],
			),
			m(Card, { shouldDivide: true }, [
				m(SectionButton, {
					leftIcon: {
						icon: Icons.BulbOutline,
						title: "ratingSuggestion_label",
						fill: theme.primary,
					},
					text: "ratingSuggestion_label",
					onclick: () => {
						navigate("suggestion")
					},
				}),
				m(SectionButton, {
					leftIcon: {
						icon: Icons.AlertCircleOutline,
						title: "ratingNeedUrgentHelp_label",
						fill: theme.primary,
					},
					text: "ratingNeedUrgentHelp_label",
					onclick: () => {
						navigate("contactSupport")
					},
				}),
			]),
		)
	}
}

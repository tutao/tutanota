import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { client } from "../../misc/ClientDetector.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { TUTA_CALENDAR_GOOGLE_PLAY_URL, TUTA_MAIL_GOOGLE_PLAY_URL } from "../../api/common/TutanotaConstants.js"
import { px, size } from "../../gui/size.js"
import { theme } from "../../gui/theme.js"

interface AndroidPlayStorePageAttrs {
	dialog: Dialog
}

export class AndroidPlayStorePage implements Component<AndroidPlayStorePageAttrs> {
	view({ attrs: { dialog } }: Vnode<AndroidPlayStorePageAttrs>): Children {
		return m(".flex.flex-column.pb-ml.text-break", [
			m(
				"section",
				m(
					".flex-center.mt-m",
					m("img.pb.pt.block.height-100p", {
						src: `placeholder-404.png`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: {
							width: "80%",
						},
					}),
				),
				m("h1.text-center", "lorem ipsum"),
				m("p.text-center", "foo bar baz"),
			),
			m(
				"section.flex.flex-column.mt",
				{ style: { gap: "1em" } },
				m(BaseButton, {
					label: { text: "Rate now", testId: "" },
					text: "Rate now",
					onclick: () => {
						windowFacade.openLink(client.isCalendarApp() ? TUTA_CALENDAR_GOOGLE_PLAY_URL : TUTA_MAIL_GOOGLE_PLAY_URL)
					},
					class: `full-width border-radius-small center b flash accent-bg button-content`,
					style: {
						height: px(size.button_height + size.vpad_xs * 1.5),
					},
				}),

				m(BaseButton, {
					label: { text: "Maybe later", testId: "" },
					text: "Maybe later",
					onclick: () => {
						dialog.close()
					},
					class: `full-width border-radius-small center b flash`,
					style: {
						border: `2px solid ${theme.content_accent}`,
						height: px(size.button_height + size.vpad_xs * 1.5),
						color: theme.content_accent,
					},
				}),
			),
		])
	}
}

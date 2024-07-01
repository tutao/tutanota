import m, { Children, Component } from "mithril"
import { px } from "../size"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { lang } from "../../misc/LanguageViewModel.js"
import { Button, ButtonType } from "./Button.js"

assertMainOrNode()

export class NotFoundPage implements Component<void> {
	view(): Children {
		return m(
			".main-view.flex.items-center.justify-center.mlr",
			{
				...landmarkAttrs(AriaLandmarks.Main),
				style: {
					"max-height": px(450),
				},
			},
			m(".message.center.max-width-l", [
				m("h2", "404"),
				[
					m("p", lang.get("notFound404_msg")),
					m(Button, {
						label: "back_action",
						click: () => window.history.back(),
						type: ButtonType.Primary,
					}),
				],
			]),
		)
	}
}

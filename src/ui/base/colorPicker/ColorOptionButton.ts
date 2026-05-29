import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../theme"
import { Keys, TabIndex } from "@tutao/app-env"
import { px } from "../../size"
import { lang } from "../../utils/LanguageViewModel.js"
import { isKeyPressed } from "../../utils/KeyManager.js"

export type ColorOptionButtonAttrs = {
	color: string
	onClick: () => unknown
	style?: Record<string, string>
}

export class ColorOptionButton implements Component<ColorOptionButtonAttrs> {
	view(vnode: Vnode<ColorOptionButtonAttrs>): Children {
		const { color, style, onClick } = vnode.attrs

		return m(
			"",
			{
				style,
			},
			m(
				".border-radius-8",
				{
					style: {
						padding: "1px",
						borderWidth: "2px",
						borderStyle: "solid",
						borderColor: "transparent",
					},
				},
				m(".border-radius", {
					tabIndex: TabIndex.Default,
					role: "radio",
					ariaLabel: lang.get("customColor_label"),
					style: {
						width: px(30),
						height: px(30),
						borderWidth: "1px",
						borderStyle: "solid",
						borderColor: theme.outline,
						backgroundColor: color,
					},
					onkeydown: (e: KeyboardEvent) => {
						if (isKeyPressed(e.key, Keys.SPACE)) {
							e.preventDefault()
							onClick()
						}
					},
					onclick: onClick,
				}),
			),
		)
	}
}

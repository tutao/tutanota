import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()
export type MessageBoxAttrs = {
	style?: Record<string, any>
}

/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */
export class MessageBox implements Component<MessageBoxAttrs> {
	view({ attrs, children }: Vnode<MessageBoxAttrs>): Children {
		return m(
			".justify-center.items-start.dialog-width-s.pt.pb.plr.border-radius",
			{
				style: Object.assign(
					{
						"white-space": "pre-wrap",
						"text-align": "center",
						border: `2px solid ${theme.content_border}`,
					},
					attrs.style,
				),
			},
			children,
		)
	}
}

import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { AllIcons } from "./Icon"
import { Icon } from "./Icon"
import { px, size } from "../size"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()
export type Attrs = {
	message: TranslationKey | lazy<Children>
	icon?: AllIcons
	color: string
}
/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */

export default class ColumnEmptyMessageBox implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(
			".fill-absolute.flex.col.items-center.justify-center",
			m(
				".flex.col.items-center.justify-center.mlr",
				{
					style: {
						"margin-top": px(attrs.icon ? -size.icon_message_box - size.vpad_xl : -size.vpad_xl),
					},
				},
				[
					attrs.icon
						? m(Icon, {
								icon: attrs.icon,
								style: {
									fill: attrs.color,
								},
								class: "icon-message-box",
						  })
						: null,
					m(
						".h2.text-center.text-preline",
						{
							style: {
								color: attrs.color,
							},
						},
						getMessage(attrs),
					),
				],
			),
		)
	}
}

function getMessage({ message }: Attrs) {
	return typeof message === "function" ? message() : lang.get(message)
}

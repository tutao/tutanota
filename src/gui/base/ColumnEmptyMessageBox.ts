import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { AllIcons } from "./Icon"
import { Icon } from "./Icon"
import { px, size } from "../size"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()

// If you change this make sure you pass through all the attrs
export type Attrs = {
	message: TranslationKey | lazy<Children>
	icon?: AllIcons
	color: string
}

/** Displays a big message with an option icon above it. */
export class IconMessageBox implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(".flex.col.items-center.justify-center.mlr", [
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
		])
	}
}

/**
 * A message displaying a text. A message box can be displayed on the background of a column if the column is empty. The text inside of it will be centered vertically, taking the icon into account.
 */

export default class ColumnEmptyMessageBox implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(
			".fill-absolute.flex.col.items-center.justify-center",
			{
				style: {
					"margin-top": px(attrs.icon ? -size.icon_message_box - size.vpad_xl : -size.vpad_xl),
				},
			},
			// If we pass plain attrs all lifecycle callbacks we attach from the outside will be called twice, once on the wrong element.
			m(IconMessageBox, {
				message: attrs.message,
				icon: attrs.icon,
				color: attrs.color,
			}),
		)
	}
}

function getMessage({ message }: Attrs) {
	return typeof message === "function" ? message() : lang.get(message)
}

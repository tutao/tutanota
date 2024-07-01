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
export type InfoMessaggeBoxAttrs = {
	message: TranslationKey | lazy<Children>
	icon?: AllIcons
	color: string
	bottomContent?: Children
	backgroundColor?: string
}

/** Displays a big message with an option icon above it. */
export class IconMessageBox implements Component<InfoMessaggeBoxAttrs> {
	view({ attrs }: Vnode<InfoMessaggeBoxAttrs>): Children {
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

export type ColumnEmptyMessageBoxAttrs = InfoMessaggeBoxAttrs

/**
 * A message displaying a text. A message box can be displayed on the background of a column if the column is empty. The text inside of it will be centered vertically, taking the icon into account.
 */

export default class ColumnEmptyMessageBox implements Component<ColumnEmptyMessageBoxAttrs> {
	view({ attrs }: Vnode<ColumnEmptyMessageBoxAttrs>): Children {
		return m(
			".fill-absolute.flex.col.items-center.justify-center.overflow-hidden",
			{
				style: {
					backgroundColor: attrs?.backgroundColor,
				},
			},
			m(
				".flex.col.items-center",
				{
					style: {
						// move up *only* this element, not the whole .fill-absolute parent to not overflow into the items above us
						"margin-top": px(attrs.icon ? -size.icon_message_box - size.vpad_xl : -size.vpad_xl),
					},
				},
				[
					// If we pass plain attrs all lifecycle callbacks we attach from the outside will be called twice, once on the wrong element.
					m(IconMessageBox, {
						message: attrs.message,
						icon: attrs.icon,
						color: attrs.color,
					}),
					attrs.bottomContent ?? m(".button-height"),
				],
			),
		)
	}
}

function getMessage({ message }: InfoMessaggeBoxAttrs) {
	return typeof message === "function" ? message() : lang.get(message)
}

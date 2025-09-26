import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { AllIcons } from "./Icon"
import { Icon } from "./Icon"
import { px, size } from "../size"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()

// If you change this make sure you pass through all the attrs
export type InfoMessaggeBoxAttrs = {
	message: MaybeTranslation
	icon?: AllIcons
	color: string
	bottomContent?: Children
	backgroundColor?: string
}

/** Displays a big message with an option icon above it. */
export class IconMessageBox implements Component<InfoMessaggeBoxAttrs> {
	view({ attrs }: Vnode<InfoMessaggeBoxAttrs>): Children {
		return m(".flex.col.items-center.justify-center.mlr-12.translucent", [
			attrs.icon
				? m(Icon, {
						icon: attrs.icon,
						style: {
							fill: attrs.color,
						},
						class: "icon-80",
					})
				: null,
			m(
				".h2.text-center.text-preline",
				{
					style: {
						color: attrs.color,
					},
					"data-testid": `message_box:${lang.getTestId(attrs.message)}`,
				},
				lang.getTranslationText(attrs.message),
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
						"margin-top": px(attrs.icon ? -size.icon_80 - size.spacing_48 : -size.spacing_48),
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

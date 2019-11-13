// @flow
import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode} from "../../api/Env"
import type {AllIconsEnum} from "./Icon"
import {Icon} from "./Icon"
import {px, size} from "../size"

assertMainOrNode()


export type Attrs = {
	message: TranslationKey | lazy<Children>,
	icon?: AllIconsEnum,
	color: string,
}
/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */
export default class MessageBox implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>): Children {
		return m(".fill-absolute.flex.col.items-center.justify-center",
			m(".mt-negative-l.flex.col.items-center.justify-center.mlr", {
				style: {
					'margin-top': px(attrs.icon ? -size.icon_message_box - size.vpad_xl : -size.vpad_xl)
				}
			}, [
				attrs.icon
					? m(Icon, {
						icon: attrs.icon,
						style: {
							fill: attrs.color
						},
						class: "icon-message-box"
					})
					: null,
				m(".h2 text-center", {style: {color: attrs.color}}, getMessage(attrs))
			]))
	}
}

function getMessage({message}: Attrs) {
	return typeof message === "function" ? message() : lang.get(message)
}
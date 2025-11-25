import m, { Component, Vnode } from "mithril"
import { TextField, TextFieldAttrs, TextFieldType } from "../gui/base/TextField"
import { font_size, px, size } from "../gui/size"
import { theme } from "../gui/theme"

export type SignupTextFieldAttrs = TextFieldAttrs

export class SignupTextField implements Component<SignupTextFieldAttrs> {
	view({ attrs }: Vnode<SignupTextFieldAttrs>) {
		const customStyle = {
			backgroundColor: theme.surface_container_highest,
			color: theme.on_surface_variant,
			border: "none",
			borderRadius: px(size.radius_8),
			paddingTop: px(size.spacing_8),
			paddingBottom: px(size.spacing_8),
			paddingRight: px(size.spacing_8),
			paddingLeft: px(40),
			"font-size": px(font_size.base),
			height: px(56),

			...attrs.style,
		}
		return m(TextField, {
			// 1. Pass through functional attributes
			value: attrs.value,
			oninput: attrs.oninput,
			type: attrs.type || TextFieldType.Text,
			label: attrs.label,

			leadingIcon: attrs.leadingIcon
				? {
						icon: attrs.leadingIcon.icon,
						color: theme.on_surface_variant,
					}
				: undefined,

			style: customStyle as any,

			onblur: attrs.onblur,
			onfocus: attrs.onfocus,
			onclick: attrs.onclick,
		} satisfies TextFieldAttrs)
	}
}

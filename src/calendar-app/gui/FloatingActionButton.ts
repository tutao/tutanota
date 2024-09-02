import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../common/gui/base/IconButton.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { ButtonColor } from "../../common/gui/base/Button.js"
import { BootIcons } from "../../common/gui/base/icons/BootIcons.js"
import type { TranslationText } from "../../common/misc/LanguageViewModel.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"

export type FloatingActionButtonAttrs = {
	title: TranslationText
	colors: ButtonColor
	icon: Icons | BootIcons
	action: () => unknown
}

export class FloatingActionButton implements Component<FloatingActionButtonAttrs> {
	view({ attrs: { title, colors, icon, action } }: Vnode<FloatingActionButtonAttrs>): Children {
		return m(
			"span.float-action-button.posb-ml.posr-ml.accent-bg.fab-shadow",
			m(IconButton, {
				colors,
				icon,
				title,
				click: action,
				size: ButtonSize.Large,
			}),
		)
	}
}

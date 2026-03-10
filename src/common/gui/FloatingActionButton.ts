import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"
import { ButtonColor } from "./base/Button.js"
import { BootIcons } from "./base/icons/BootIcons.js"
import type { MaybeTranslation } from "../misc/LanguageViewModel.js"
import { ButtonSize } from "./base/ButtonSize.js"
import { ClickHandler } from "./base/GuiUtils"
import { component_size, px, size } from "./size"

export type FloatingActionButtonAttrs = {
	title: MaybeTranslation
	colors: ButtonColor
	icon: Icons | BootIcons
	click: ClickHandler
}

export class FloatingActionButton implements Component<FloatingActionButtonAttrs> {
	view({ attrs: { title, colors, icon, click } }: Vnode<FloatingActionButtonAttrs>): Children {
		return m(
			"fab.float-action-button.accent-bg.fab-shadow.z4",
			{
				style: {
					right: px(size.spacing_16),
					bottom: px(size.spacing_16),
				},
			},
			m(IconButton, {
				colors,
				icon,
				title,
				click: click,
				size: ButtonSize.Large,
			}),
		)
	}
}

export function displayingFab(): boolean {
	const fab = document.body.querySelector("fab")
	return fab != null
}

export function fabBottomSpacing(): number {
	if (displayingFab()) {
		return size.spacing_16 + component_size.button_floating_size
	} else {
		return 0
	}
}

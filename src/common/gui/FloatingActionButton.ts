import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"
import { ButtonColor } from "./base/Button.js"
import { BootIcons } from "./base/icons/BootIcons.js"
import type { MaybeTranslation } from "../misc/LanguageViewModel.js"
import { ButtonSize } from "./base/ButtonSize.js"
import { ClickHandler } from "./base/GuiUtils"
import { component_size, size } from "./size"

export type FloatingActionButtonAttrs = {
	title: MaybeTranslation
	colors: ButtonColor
	icon: Icons | BootIcons
	click: ClickHandler
}

export class FloatingActionButton implements Component<FloatingActionButtonAttrs> {
	oncreate() {
		onFabShown(DisplayState.Shown)
	}
	onremove() {
		onFabShown(DisplayState.Hidden)
	}
	view({ attrs: { title, colors, icon, click }, children }: Vnode<FloatingActionButtonAttrs>): Children {
		return m(
			"fab.fab-position.accent-bg.fab-shadow.z4.border-radius",
			m(IconButton, {
				colors,
				icon,
				title,
				click: click,
				size: ButtonSize.Large,
			}),
			children,
		)
	}
}

export const enum DisplayState {
	Shown,
	Hidden,
}

let fabDisplayState: DisplayState = DisplayState.Hidden
export function onFabShown(state: DisplayState) {
	fabDisplayState = state
}

export function fabBottomSpacing(): number {
	if (fabDisplayState === DisplayState.Shown) {
		return size.spacing_16 + component_size.button_floating_size
	} else {
		return 0
	}
}

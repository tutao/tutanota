import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "./IconButton.js"
import { Icons } from "./icons/Icons.js"
import { ButtonColor } from "./Button.js"
import type { MaybeTranslation } from "../utils/LanguageViewModel.js"
import { ButtonSize } from "./ButtonSize.js"
import { ClickHandler } from "./GuiUtils"
import { component_size, size } from "../size"

export type FloatingActionButtonAttrs = {
	title: MaybeTranslation
	colors: ButtonColor
	icon: Icons
	click: ClickHandler
}

export class FloatingActionButton implements Component<FloatingActionButtonAttrs> {
	oncreate() {
		onFabShown(DisplayState.Shown)
		// need additional redraw to adjust position of other components
		m.redraw()
	}
	onremove() {
		onFabShown(DisplayState.Hidden)
		// need additional redraw to adjust position of other components
		m.redraw()
	}
	view({ attrs: { title, colors, icon, click }, children }: Vnode<FloatingActionButtonAttrs>): Children {
		return m(
			"fab.fab-position.accent-bg.fab-shadow.z4.border-radius",
			m(IconButton, {
				colors,
				icon,
				label: title,
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

export function isFabShown(): boolean {
	return fabDisplayState === DisplayState.Shown
}

export function fabBottomSpacing(): number {
	if (fabDisplayState === DisplayState.Shown) {
		return component_size.button_floating_size - size.spacing_24
	} else {
		return 0
	}
}

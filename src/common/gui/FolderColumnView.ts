import { DrawerMenu, DrawerMenuAttrs } from "./nav/DrawerMenu.js"
import { theme } from "./theme.js"
import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel.js"
import { lang } from "../misc/LanguageViewModel.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import type { ClickHandler } from "./base/GuiUtils.js"
import type { lazy } from "@tutao/tutanota-utils"
import { MainCreateButton } from "./MainCreateButton.js"

export type Attrs = {
	/** Button to be displayed on top of the column*/
	button: { label: TranslationKey; click: ClickHandler } | null | undefined
	content: Children
	ariaLabel: TranslationKey | lazy<string>
	drawer: DrawerMenuAttrs
}

export class FolderColumnView implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(".flex.height-100p.nav-bg", [
			m(DrawerMenu, attrs.drawer),
			m(".folder-column.flex-grow.overflow-x-hidden.flex.col", landmarkAttrs(AriaLandmarks.Navigation, lang.getMaybeLazy(attrs.ariaLabel)), [
				this.renderMainButton(attrs),
				m(
					".scroll.scrollbar-gutter-stable-or-fallback.visible-scrollbar.overflow-x-hidden.flex.col.flex-grow",
					{
						onscroll: (e: EventRedraw<Event>) => {
							e.redraw = false
							const target = e.target as HTMLElement
							if (attrs.button == null || target.scrollTop === 0) {
								target.style.borderTop = ""
							} else {
								target.style.borderTop = `1px solid ${theme.content_border}`
							}
						},
					},
					attrs.content,
				),
			]),
		])
	}

	private renderMainButton(attrs: Attrs): Children {
		if (attrs.button) {
			return m(
				".plr-button-double.scrollbar-gutter-stable-or-fallback.scroll",
				m(MainCreateButton, { label: attrs.button.label, click: attrs.button.click }),
			)
		} else {
			return null
		}
	}
}

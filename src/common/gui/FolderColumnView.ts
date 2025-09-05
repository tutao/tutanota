import { DrawerMenu, DrawerMenuAttrs } from "./nav/DrawerMenu.js"
import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation, TranslationKey } from "../misc/LanguageViewModel.js"
import { lang } from "../misc/LanguageViewModel.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import type { ClickHandler } from "./base/GuiUtils.js"
import { MainCreateButton } from "./MainCreateButton.js"

export type Attrs = {
	/** Button to be displayed on top of the column*/
	button: { label: TranslationKey; click: ClickHandler } | null | undefined
	content: Children
	ariaLabel: MaybeTranslation
	drawer: DrawerMenuAttrs
}

export class FolderColumnView implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(".flex.height-100p.nav-bg", [
			m(DrawerMenu, attrs.drawer),
			m(".folder-column.flex-grow.overflow-x-hidden.flex.col", landmarkAttrs(AriaLandmarks.Navigation, lang.getTranslationText(attrs.ariaLabel)), [
				this.renderMainButton(attrs),
				m(".scroll.scrollbar-gutter-stable-or-fallback.visible-scrollbar.overflow-x-hidden.flex.col.flex-grow", attrs.content),
			]),
		])
	}

	private renderMainButton(attrs: Attrs): Children {
		if (attrs.button) {
			return m(".plr-16.scrollbar-gutter-stable-or-fallback", m(MainCreateButton, { label: attrs.button.label, click: attrs.button.click }))
		} else {
			return null
		}
	}
}

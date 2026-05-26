import { DrawerMenu, DrawerMenuAttrs } from "./nav/DrawerMenu.js"
import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { AriaLandmarks, landmarkAttrs } from "../../../ui/AriaUtils.js"
import type { ClickHandler } from "../../../ui/base/GuiUtils.js"
import { MainCreateButton } from "../../../ui/MainCreateButton.js"
import { isAndroidApp } from "@tutao/app-env"
import { styles } from "../../../ui/styles"

export type Attrs = {
	/** Button to be displayed on top of the column*/
	button: { label: TranslationKey; click: ClickHandler } | null | undefined
	content: Children
	ariaLabel: MaybeTranslation
	drawer: DrawerMenuAttrs
}

export class FolderColumnView implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		const isAndroidWithBottomNavAndDrawer = isAndroidApp() && styles.isAppUsingBottomNav() && !styles.isMobileDesktopLayout()
		return m(".flex.height-100p.nav-bg" + (isAndroidWithBottomNavAndDrawer ? ".pb-safe-inset" : ""), [
			m(DrawerMenu, attrs.drawer),
			m(".folder-column.flex-grow.overflow-x-hidden.flex.col", landmarkAttrs(AriaLandmarks.Navigation, lang.getTranslationText(attrs.ariaLabel)), [
				this.renderMainButton(attrs),
				m(".scroll.scrollbar-gutter-stable-or-fallback.visible-scrollbar.overflow-x-hidden.flex.col.flex-grow", attrs.content),
			]),
		])
	}

	private renderMainButton(attrs: Attrs): Children {
		if (attrs.button) {
			return m(
				".plr-16.scrollbar-gutter-stable-or-fallback",
				m(MainCreateButton, {
					label: attrs.button.label,
					click: attrs.button.click,
				}),
			)
		} else {
			return null
		}
	}
}

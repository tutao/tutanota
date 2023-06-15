import { DrawerMenu, DrawerMenuAttrs } from "./nav/DrawerMenu.js"
import { theme } from "./theme.js"
import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel.js"
import { lang } from "../misc/LanguageViewModel.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import type { clickHandler } from "./base/GuiUtils.js"
import type { lazy } from "@tutao/tutanota-utils"
import { FolderColumnHeaderButton } from "./base/buttons/FolderColumnHeaderButton.js"
import { Button, ButtonType } from "./base/Button.js"

export type Attrs = {
	/** Button to be displayed on top of the column*/
	button: { label: TranslationKey; click: clickHandler; type: ButtonType } | null | undefined
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
					".scroll.overflow-x-hidden.flex.col.flex-grow",
					{
						onscroll: (e: Event) => {
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
		return attrs.button
			? attrs.button.type === ButtonType.FolderColumnHeader
				? m(
						".plr-button-double",
						m(FolderColumnHeaderButton, {
							label: attrs.button.label,
							click: attrs.button.click,
						}),
				  )
				: m(
						".plr-button-double.mt.mb",
						m(Button, {
							type: attrs.button.type,
							label: attrs.button.label,
							click: attrs.button.click,
						}),
				  )
			: null
	}
}

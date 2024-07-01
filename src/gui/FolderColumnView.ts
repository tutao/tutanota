import { DrawerMenu, DrawerMenuAttrs } from "./nav/DrawerMenu.js"
import { theme } from "./theme.js"
import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel.js"
import { lang } from "../misc/LanguageViewModel.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import { ClickHandler, handleFocus } from "./base/GuiUtils.js"
import type { lazy } from "@tutao/tutanota-utils"
import { BaseButton, BaseButtonAttrs } from "./base/buttons/BaseButton.js"
import { px, size } from "./size.js"

export type Attrs = {
	/** Button to be displayed on top of the column*/
	button: { label: TranslationKey; click: ClickHandler } | null | undefined
	content: Children
	ariaLabel: TranslationKey | lazy<string>
	drawer: DrawerMenuAttrs
}

export class FolderColumnView implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(
			".flex.height-100p.nav-bg",
			{
				onupdate(vnode: m.VnodeDOM<Attrs>): any {
					if (vnode.dom.parentElement) {
						const trapFocus = vnode.dom.parentElement.style.visibility === "visible"
						handleFocus(trapFocus, ["nav", ".view-columns"])
					}
				},
			},
			[
				m(DrawerMenu, attrs.drawer),
				m(".folder-column.flex-grow.overflow-x-hidden.flex.col", landmarkAttrs(AriaLandmarks.Navigation, lang.getMaybeLazy(attrs.ariaLabel)), [
					this.renderMainButton(attrs),
					m(
						".scroll.scrollbar-gutter-stable-or-fallback.visible-scrollbar.overflow-x-hidden.flex.col.flex-grow",
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
			],
		)
	}

	private renderMainButton(attrs: Attrs): Children {
		if (attrs.button) {
			const label = lang.get(attrs.button.label)
			return m(
				".plr-button-double.scrollbar-gutter-stable-or-fallback.scroll",
				m(BaseButton, {
					label,
					text: label,
					onclick: attrs.button.click,
					class: "full-width border-radius-big center b flash",
					style: {
						border: `2px solid ${theme.content_accent}`,
						// matching toolbar
						height: px(size.button_height + size.vpad_xs * 2),
						color: theme.content_accent,
					},
				} satisfies BaseButtonAttrs),
			)
		} else {
			return null
		}
	}
}

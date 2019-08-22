// @flow

import {assertMainOrNode} from "../../api/Env"
import {DrawerMenu} from "../nav/DrawerMenu"
import {theme} from "../theme"
import m from "mithril"
import {ButtonN, ButtonType} from "./ButtonN"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {AriaLandmarks, landmarkAttrs} from "../../api/common/utils/AriaUtils"

assertMainOrNode()

export type Attrs = {
	/** Button to be displayed on top of the  */
	button: ?{label: TranslationKey, click: clickHandler},
	content: Children,
	ariaLabel: TranslationKey | lazy<string>
}

export class FolderColumnView implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>): Children {
		return m(".flex.height-100p", [
			m(DrawerMenu),
			m(".folder-column.flex-grow.overflow-x-hidden.flex.col"
				+ landmarkAttrs(AriaLandmarks.Navigation, lang.getMaybeLazy(attrs.ariaLabel)),
				[
					attrs.button
						? m(".mlr-l.mt.mb", m(ButtonN, {
							label: attrs.button.label,
							click: attrs.button.click,
							type: ButtonType.PrimaryBorder
						}))
						: null,
					m(".scroll.overflow-x-hidden.flex.col.flex-grow", {
							onscroll: (e) => {
								if (attrs.button == null || e.target.scrollTop === 0) {
									e.target.style.borderTop = ""
								} else {
									e.target.style.borderTop = `1px solid ${theme.content_border}`
								}
							},
						},
						attrs.content)
				])
		])
	}
}
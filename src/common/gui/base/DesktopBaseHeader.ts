import m, { Children, ClassComponent, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils.js"
import { layout_size, px, size, size as sizes } from "../size.js"
import { theme } from "../theme.js"

export interface DesktopBaseHeaderAttrs {
	firstColWidth: number
}

/**
 * Base layout for the header in desktop layout.
 */
export class DesktopBaseHeader implements ClassComponent<DesktopBaseHeaderAttrs> {
	view(vnode: Vnode<DesktopBaseHeaderAttrs>): Children {
		return m(
			".header-nav.flex.items-center.rel",
			{
				"data-testid": "nav:header",
			},
			[this.renderLogo(vnode.attrs.firstColWidth), vnode.children],
		)
	}

	private renderLogo(width: number) {
		return m(
			".logo-height",
			{
				...landmarkAttrs(AriaLandmarks.Banner, "Tuta logo"),
				style: {
					"padding-left": px(layout_size.drawer_menu_width + size.spacing_12 + size.spacing_8),
					width: px(width),
				},
			},
			m.trust(theme.logo),
		)
	}
}

import m, { Children, ClassComponent, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils.js"
import { px, size, size as sizes } from "../size.js"
import { theme } from "../theme.js"

/**
 * Base layout for the header in desktop layout.
 */
export class DesktopBaseHeader implements ClassComponent {
	view(vnode: Vnode): Children {
		return m(".header-nav.flex.items-center.rel", [this.renderLogo(), vnode.children])
	}

	private renderLogo() {
		return m(
			".logo-height",
			{
				...landmarkAttrs(AriaLandmarks.Banner, "Tuta logo"),
				style: {
					"margin-left": px(sizes.drawer_menu_width + size.hpad + size.hpad_button),
				},
			},
			m.trust(theme.logo),
		)
	}
}

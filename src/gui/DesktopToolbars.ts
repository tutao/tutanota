import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { px, size } from "./size.js"
import { responsiveCardHMargin } from "./cards.js"

/** Toolbar layout that is used in the second/list column. */
export const DesktopListToolbar = pureComponent((__, children) => {
	return m(
		".flex.pt-xs.pb-xs.items-center.list-bg",
		{
			style: {
				"border-radius": `${size.border_radius}px 0 0 ${size.border_radius}px`,
				// matching the list
				marginLeft: `5px`,
				marginBottom: px(size.hpad_large),
			},
		},
		children,
	)
})

/** Toolbar layout that is used in the third/viewer column. */
export const DesktopViewerToolbar = pureComponent((__, children) => {
	return m(
		".flex.pt-xs.pb-xs.plr-m.list-bg",
		{
			class: responsiveCardHMargin(),
			style: {
				"border-radius": `0 ${size.border_radius_big}px ${size.border_radius_big}px 0`,
				marginLeft: 0,
				marginBottom: px(size.hpad_large),
			},
		},
		[
			// Height keeps the toolbar showing for consistency, even if there are no actions
			m(".flex-grow", { style: { height: px(size.button_height) } }),
			children,
		],
	)
})

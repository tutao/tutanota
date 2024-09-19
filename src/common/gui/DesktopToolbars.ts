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
	// The viewer below will (or at least should) reserve some space for the scrollbar. To match that we put `scrollbar-gutter: stable` and for it to have
	// effect we put `overflow-y: hidden`.
	//
	// The outer wrapper will give us margins and padding for the scrollbar and the inner one will actually have to visible background
	//
	// see comment for .scrollbar-gutter-stable-or-fallback
	return m(
		".scrollbar-gutter-stable-or-fallback.overflow-y-hidden.noprint",
		{
			class: responsiveCardHMargin(),
			style: {
				marginLeft: 0,
				marginBottom: px(size.hpad_large),
			},
		},
		m(
			".flex.list-bg.pt-xs.pb-xs.plr-m",
			{
				style: {
					"border-radius": `0 ${size.border_radius_larger}px ${size.border_radius_larger}px 0`,
				},
			},
			[
				// Height keeps the toolbar showing for consistency, even if there are no actions
				m(".flex-grow", { style: { height: px(size.button_height) } }),
				children,
			],
		),
	)
})

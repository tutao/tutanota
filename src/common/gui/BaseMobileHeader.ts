import { pureComponent } from "./base/PureComponent.js"
import m, { Children } from "mithril"
import { px, size } from "./size.js"

export interface BaseMobileHeaderAttrs {
	left?: Children
	center?: Children
	right?: Children
	injections?: Children
}

/**
 * A base component that should be used for all mobile headers.
 */
export const BaseMobileHeader = pureComponent(({ left, center, right, injections }: BaseMobileHeaderAttrs) => {
	return m(
		".flex.items-center.rel.button-height.mt-safe-inset.plr-safe-inset",
		{
			style: {
				height: px(size.navbar_height_mobile),
			},
		},
		[
			left ?? null,
			// normally min-width: is 0 but inside flex it's auto and we need to teach it how to shrink
			m(
				".flex-grow.flex.items-center.min-width-0",
				{
					class: !left ? "ml-hpad_small" : "",
				},
				center ?? null,
			),
			right ?? null,
			injections ?? null,
		],
	)
})

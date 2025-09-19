import m, { Component } from "mithril"
import { px, size } from "../../gui/size.js"
import { lang } from "../../misc/LanguageViewModel"
import { theme } from "../../gui/theme"

export class CurrentPlanLabel implements Component {
	view() {
		return m(
			"span.small.fit-height.border-radius",
			{
				style: {
					color: theme.on_surface_variant,
					border: `1px solid ${theme.outline}`,
					padding: `${px(size.vpad_xs)} ${px(size.hpad_button)}`,
				},
			},
			lang.get("pricing.currentPlan_label"),
		)
	}
}

import m, { Component } from "mithril"
import { planBoxColors } from "../PlanBoxColors.js"
import { px, size } from "../../gui/size.js"

export class CurrentPlanLabel implements Component {
	view() {
		return m(
			"span.small.fit-height.border-radius",
			{
				style: {
					color: planBoxColors.getTextColor(false, false),
					border: `1px solid ${planBoxColors.getTextColor(false, false)}`,
					padding: `${px(size.spacing_4)} ${px(size.spacing_8)}`,
				},
			},
			"Current plan",
		)
	}
}

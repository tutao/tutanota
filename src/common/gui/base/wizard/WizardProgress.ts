import m, { Component, Vnode } from "mithril"
import type { WizardProgressViewItem } from "./WizardController"
import { Icon, IconSize } from "../Icon"
import { Icons } from "../icons/Icons"
import { theme } from "../../theme"
import { px } from "../../size"

export interface WizardProgressAttrs {
	progressState: WizardProgressViewItem[]
	onClick?: (index: number) => void
}

export class WizardProgress implements Component<WizardProgressAttrs> {
	view({ attrs: { progressState, onClick } }: Vnode<WizardProgressAttrs>) {
		return m(
			".flex.col.justify-center",
			m(
				".flex.col.flex-space-around.items-center",
				{
					style: {
						height: "75%",
						"padding-inline": `${px(64)}`,
					},
				},
				progressState.map((step) => {
					return [
						m(".wizard-progress-wrap.flex.gap-vpad.items-start", [
							m(
								`button.wizard-progress${step.isCurrent ? ".wizard-progress-active" : ""}${step.currentIndex > step.index ? ".wizard-progress-previous" : ""}`,
								{
									type: "button",
									disabled: !step.isReachable || !onClick,
									onclick: onClick ? () => onClick(step.index) : noOp,
								},
								[
									step.currentIndex > step.index
										? m(Icon, {
												icon: Icons.Checkmark,
												size: IconSize.Medium,
												style: {
													fill: theme.on_primary,
												},
											})
										: m("", step.index + 1),
								],
							),

							m(".flex.items-center", { style: { height: px(32) } }, step.label),
						]),
					]
				}),
			),
		)
	}
}

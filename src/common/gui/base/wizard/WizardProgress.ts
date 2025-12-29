import m, { Component, Vnode } from "mithril"
import type { WizardProgressViewItem } from "./WizardController"
import { Icon, IconSize } from "../Icon"
import { Icons } from "../icons/Icons"
import { theme } from "../../theme"
import { layout_size, px, size } from "../../size"

export interface WizardProgressAttrs {
	progressState: WizardProgressViewItem[]
	onClick?: (index: number) => void
}

export class WizardProgress implements Component<WizardProgressAttrs> {
	view({ attrs: { progressState, onClick } }: Vnode<WizardProgressAttrs>) {
		return m(
			".flex.col.justify-start",
			{
				style: {
					flex: 1,
					"max-width": px(layout_size.wizard_progress_width),
				},
			},
			m(
				".flex.col.flex-space-around.items-start",
				{
					style: {
						height: "75%",
						width: `${px(layout_size.wizard_progress_width)}`,
					},
				},
				progressState
					.filter((step) => step.isEnabled)
					.map((step, idx) => {
						return [
							m(".wizard-progress-wrap.flex.gap-16.items-start.full-width", [
								m(
									`button.wizard-progress${step.isCurrent ? ".wizard-progress-active" : ""}${step.currentIndex > step.index ? ".wizard-progress-previous" : ""}`,
									{
										type: "button",
										disabled: !step.isReachable || !onClick,
										onclick: onClick ? () => onClick(step.index) : () => {},
									},
									[
										step.currentIndex > step.index
											? m(Icon, {
													icon: step.isReachable ? Icons.Checkmark : Icons.Lock,
													size: IconSize.PX20,
													style: {
														fill: theme.on_primary,
													},
												})
											: m("", idx + 1),
									],
								),

								m(
									".flex.items-center",
									{ style: { height: px(size.icon_32), width: `calc(100% - ${px(size.icon_32 + size.spacing_16)})` } },
									m(".block.text-ellipsis.full-width", step.label),
								),
							]),
						]
					}),
			),
		)
	}
}

import m, { Component, Vnode } from "mithril"
import type { WizardProgressViewItem } from "./WizardController"
import { Icon, IconSize } from "../Icon"
import { Icons } from "../icons/Icons"
import { theme } from "../../theme"
import { component_size, layout_size, px, size } from "../../size"
import { styles } from "../../styles"

export interface WizardProgressAttrs {
	progressState: WizardProgressViewItem[]
	onClick?: (index: number) => void
	labelMaxLength?: number
}

const LABEL_ELLIPSIS = "..."

const truncateLabel = (label: string, maxLength?: number): string => {
	if (!maxLength || label.length <= maxLength) return label
	if (maxLength <= LABEL_ELLIPSIS.length) return label.slice(0, maxLength)
	return `${label.slice(0, maxLength - LABEL_ELLIPSIS.length)}${LABEL_ELLIPSIS}`
}

export class WizardProgress implements Component<WizardProgressAttrs> {
	view({ attrs: { progressState, onClick, labelMaxLength } }: Vnode<WizardProgressAttrs>) {
		const showLabels = !styles.isSingleColumnLayout()
		const progressWidth = showLabels ? layout_size.wizard_progress_width : component_size.button_icon_bg_size

		return m(
			".flex.col.justify-start",
			{
				style: {
					flex: "1",
					"max-width": px(progressWidth),
				},
			},
			m(
				".flex.col.flex-space-around.items-start",
				{
					style: {
						height: "65%",
						width: px(progressWidth),
					},
				},
				progressState
					.filter((step) => step.isEnabled)
					.map((step, idx) => {
						const displayLabel = truncateLabel(step.label, labelMaxLength)

						return [
							m(`.wizard-progress-wrap.flex.items-start.full-width${showLabels ? ".gap-16" : ""}`, [
								m(
									`button.wizard-progress${step.isCurrent ? ".wizard-progress-active" : ""}${step.currentIndex > step.index ? ".wizard-progress-previous" : ""}`,
									{
										type: "button",
										"aria-label": step.label,
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
								showLabels &&
									m(
										".flex.items-center",
										{ style: { height: px(size.icon_32), width: `calc(100% - ${px(size.icon_32 + size.spacing_16)})` } },
										m(".block.text-ellipsis.full-width", displayLabel),
									),
							]),
						]
					}),
			),
		)
	}
}

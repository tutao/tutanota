import m, { Children, Component, Vnode } from "mithril"
import { Theme, theme } from "./theme"
import { boxShadowHigh } from "./main-styles"
import { component_size, px, size } from "./size"
import { IconButton } from "./base/IconButton"
import { Icons } from "./base/icons/Icons"
import { Translation } from "../misc/LanguageViewModel"
import { Icon, IconSize } from "./base/Icon"
import { ButtonSize } from "./base/ButtonSize"

export enum ProgressState {
	done,
	error,
	running,
}

export interface ProgressSnackBarAttrs {
	mainText: string
	infoText?: Translation
	progressState: ProgressState
	percentage: number
	onCancel: () => unknown
}

export class ProgressSnackBar implements Component<ProgressSnackBarAttrs> {
	view({ attrs: { infoText, mainText, onCancel, progressState, percentage } }: Vnode<ProgressSnackBarAttrs>): Children {
		return m(
			".flex.col.border-radius",
			{
				style: {
					background: theme.surface,
					"box-shadow": boxShadowHigh,
					padding: px(size.spacing_12),
				},
			},
			[
				m(".flex.row.items-center.justify-between.items-center", [
					m(".flex.items-center.gap-16.overflow-hidden", [
						this.renderProgress(progressState, percentage),
						m(".flex.col.gap-8.flex-shrink.overflow-hidden", [
							m(".font-weight-500.text-ellipsis", mainText),
							infoText ? m(".small", { "data-testid": infoText.testId }, infoText.text) : null,
						]),
					]),

					progressState === ProgressState.running
						? m(IconButton, {
								click: () => onCancel(),
								icon: Icons.X,
								title: "cancel_action",
								size: ButtonSize.Large,
							})
						: m("", {
								style: {
									width: px(component_size.button_floating_size),
									height: px(component_size.button_floating_size),
								},
							}),
				]),
			],
		)
	}

	private renderProgress(state: ProgressState, percentage: number): Children {
		return m(CircleLoadingBar, this.getCircleLoadingBarAttrs(state, percentage))
	}

	private getCircleLoadingBarAttrs(state: ProgressState, percentage: number): CircleLoadingBarAttrs {
		switch (state) {
			case ProgressState.done:
				return {
					backgroundColor: theme.surface,
					color: theme.success,
					icon: Icons.Checkmark,
				}
			case ProgressState.error:
				return {
					backgroundColor: theme.surface,
					color: theme.error,
					icon: Icons.X,
				}
			case ProgressState.running:
				return {
					backgroundColor: theme.surface,
					percentage,
				}
		}
	}
}

// If icon is passed in, it will be displayed instead of percentage number
export interface CircleLoadingBarAttrs {
	backgroundColor: string
	percentage?: number
	color?: string
	icon?: Icons
}

export class CircleLoadingBar implements Component<CircleLoadingBarAttrs> {
	view({ attrs }: Vnode<CircleLoadingBarAttrs>): Children {
		// if no percentage is given, 100 is used to get a full circle
		const percentage = attrs.percentage ?? 100
		const progressCircleColor = attrs.color ?? theme.on_surface

		return m(
			".flex.justify-center.items-center.no-shrink",
			{
				role: "progressbar",
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": percentage,
				style: {
					"--progress-value": percentage,
					width: px(component_size.button_height),
					height: px(component_size.button_height),
					borderRadius: "50%",
					// drawing a circle on the inside and a colored circle on the outside (with the rest filled with transparent)
					background: `radial-gradient(closest-side, ${attrs.backgroundColor} 79%, transparent 80% 100%), conic-gradient(${progressCircleColor} calc(var(--progress-value) * 1%), transparent 0)`,
					transition: "--progress-value 200ms",
				},
			},
			attrs.icon
				? m(Icon, {
						icon: attrs.icon,
						size: IconSize.PX32,
						style: {
							fill: attrs.color,
						},
					})
				: m(".small.font-weight-500", `${percentage}%`),
		)
	}
}

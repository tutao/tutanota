import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme"
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
		let indicatorColor = theme.on_surface_variant
		if (state === ProgressState.error) {
			indicatorColor = theme.error
			percentage = 100
		} else if (state === ProgressState.done) {
			indicatorColor = theme.success
			percentage = 100
		}

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
					background: `radial-gradient(closest-side, ${theme.surface} 79%, transparent 80% 100%), conic-gradient(${indicatorColor} calc(var(--progress-value) * 1%), transparent 0)`,
					transition: "--progress-value 200ms",
				},
			},
			state === ProgressState.running ? m(".small.font-weight-500", `${percentage}%`) : this.renderTerminateStateIcon(state),
		)
	}

	private renderTerminateStateIcon(state: ProgressState): Children {
		const [color, icon] = state === ProgressState.done ? [theme.success, Icons.Checkmark] : [theme.error, Icons.X]

		return m(Icon, {
			icon,
			size: IconSize.PX32,
			style: {
				fill: color,
			},
		})
	}
}

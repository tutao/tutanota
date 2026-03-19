import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme"
import { boxShadowHigh } from "./main-styles"
import { component_size, px, size } from "./size"
import { IconButton } from "./base/IconButton"
import { Icons } from "./base/icons/Icons"
import { lang, Translation } from "../misc/LanguageViewModel"
import { Icon, IconSize } from "./base/Icon"

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
	view({ attrs }: Vnode<ProgressSnackBarAttrs>): Children {
		return m(
			".flex.col.border-radius",
			{
				style: {
					background: theme.surface,
					"box-shadow": boxShadowHigh,
					paddingTop: px(size.spacing_16),
					paddingBottom: px(size.spacing_16),
					paddingLeft: px(size.spacing_12),
					paddingRight: px(size.spacing_12),
				},
			},
			[
				m(".flex.row.items-center.justify-between.items-center", [
					m(".flex.items-center.gap-16.overflow-hidden", [
						attrs.progressState === ProgressState.running
							? this.renderProgress(attrs.percentage)
							: this.renderTerminateStateIcon(attrs.progressState),
						m(".flex.col.gap-8.flex-shrink.overflow-hidden", [
							m(".font-weight-500.text-ellipsis", attrs.mainText),
							attrs.infoText ? m(".small", { "data-testid": attrs.infoText.testId }, attrs.infoText.text) : null,
						]),
					]),

					attrs.progressState === ProgressState.running
						? m(IconButton, {
								click: () => attrs.onCancel(),
								icon: Icons.Cancel,
								title: lang.makeTranslation("cancel", () => "cancel"),
							})
						: m("", {
								style: {
									width: px(component_size.button_height),
									height: px(component_size.button_height),
								},
							}),
				]),
			],
		)
	}

	private renderProgress(percentage: number): Children {
		console.log(`RENDERING PROGRESS: ${percentage}`)

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
					background: `radial-gradient(closest-side, ${theme.surface} 79%, transparent 80% 100%), conic-gradient(${theme.on_surface_variant} calc(var(--progress-value) * 1%), transparent 0)`,
					transition: "--progress-value 200ms",
				},
			},
			m(".small.font-weight-500", `${percentage}%`),
		)
	}

	private renderTerminateStateIcon(state: ProgressState): Children {
		const [color, icon] = state === ProgressState.done ? [theme.success, Icons.CheckCircleFilled] : [theme.error, Icons.CloseCircleFilled]

		return m(
			".flex.justify-center.items-center",
			{
				style: {
					width: px(component_size.button_height),
					height: px(component_size.button_height),
				},
			},
			m(Icon, {
				icon,
				size: IconSize.PX32,
				style: {
					fill: color,
				},
			}),
		)
	}
}

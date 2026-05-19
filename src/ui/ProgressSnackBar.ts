import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme"
import { component_size, px, size } from "./size"
import { Icons } from "./base/icons/Icons"
import { lang } from "./utils/LanguageViewModel"
import { Icon, IconAttrs, IconSize } from "./base/Icon"
import { IconButton } from "./base/IconButton"
import { ButtonSize } from "./base/ButtonSize"

export enum ProgressState {
	done,
	error,
	running,
}

export interface ProgressSnackBarAttrs {
	mainText: string
	runningIcon?: () => Children
	progressState: ProgressState
	percentage: number
	onCancel: () => unknown
}

export class ProgressSnackBar implements Component<ProgressSnackBarAttrs> {
	view({ attrs: { mainText, onCancel, progressState, percentage, runningIcon } }: Vnode<ProgressSnackBarAttrs>): Children {
		return m(
			".flex.col.border-radius.rel.clip",
			{
				style: {
					background: progressState === ProgressState.error ? theme.error_container : theme.surface_container,
					padding: px(size.spacing_12),
				},
			},
			[
				m(".flex.row.items-center.justify-between.items-center", [
					m(".flex.flex-grow.items-center.gap-16.overflow-hidden", [
						this.renderIcon(progressState, runningIcon),
						m(".flex.col.gap-8.flex-shrink.overflow-hidden", [m(".font-weight-500.text-ellipsis", mainText)]),
					]),
					this.renderCancelButton(progressState, onCancel),
				]),
				progressState === ProgressState.running
					? m(".abs", {
							style: {
								left: "0",
								bottom: "0",
								right: `${100 - percentage}%`,
								height: px(2),
								background: theme.outline,
							},
						})
					: null,
			],
		)
	}

	private renderCancelButton(progressState: ProgressState, onCancel: () => unknown) {
		if (progressState !== ProgressState.error) {
			return progressState === ProgressState.running
				? m(IconButton, {
						click: () => onCancel(),
						icon: Icons.X,
						title: "cancel_action",
						size: ButtonSize.Normal,
					})
				: m("", {
						style: {
							width: px(component_size.button_height),
							height: px(component_size.button_height),
						},
					})
		} else return null
	}

	private renderIcon(state: ProgressState, runningIcon: ProgressSnackBarAttrs["runningIcon"]): Children {
		switch (state) {
			case ProgressState.done:
				return m(Icon, {
					icon: Icons.SuccessFilled,
					size: IconSize.PX24,
					style: { fill: theme.success },
					title: lang.getTranslationText("transfersDone_label"),
				} satisfies IconAttrs)
			case ProgressState.error:
				return m(Icon, {
					icon: Icons.ExclamationFilled,
					size: IconSize.PX24,
					style: { fill: theme.error },
					title: lang.getTranslationText("transfersFailed_label"),
				} satisfies IconAttrs)
			case ProgressState.running:
				return runningIcon ? runningIcon() : null
		}
	}
}

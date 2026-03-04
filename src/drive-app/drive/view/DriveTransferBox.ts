import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState } from "./DriveTransferController"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { component_size, px, size } from "../../../common/gui/size"
import { boxShadowHigh } from "../../../common/gui/main-styles"
import { theme } from "../../../common/gui/theme"
import { TranslationKeyType } from "../../../common/misc/TranslationKey"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"

export interface DriveTransferBoxAttrs {
	transferState: DriveTransferState
	onCancel: () => unknown
}

// register custom CSS property so that we can animate it.
// it is relatively new so check before using it
if (typeof CSS.registerProperty === "function") {
	CSS.registerProperty({
		name: "--progress-value",
		syntax: "<integer>",
		initialValue: "0",
		inherits: false,
	})
}

export class DriveTransferBox implements Component<DriveTransferBoxAttrs> {
	view({ attrs: { transferState, onCancel } }: Vnode<DriveTransferBoxAttrs>): Children {
		const { filename, state, transferredSize, totalSize, type } = transferState
		const percentage = Math.min(Math.round((transferredSize / totalSize) * 100), 100)

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
						this.renderProgress(state, percentage),
						m(".flex.col.gap-8.flex-shrink.overflow-hidden", [m(".font-weight-500.text-ellipsis", filename), this.renderStatusText(type, state)]),
					]),

					state === "active" || state === "waiting"
						? m(IconButton, {
								click: () => onCancel(),
								icon: Icons.Cancel,
								title: lang.makeTranslation("cancel", () => "cancel"),
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

	private renderProgress(state: DriveTransferState["state"], percentage: number): Children {
		let indicatorColor = theme.on_surface_variant
		if (state === "failed") {
			indicatorColor = theme.error
			percentage = 100
		} else if (state === "finished") {
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
			state === "active" || state === "waiting" ? m(".small.font-weight-500", `${percentage}%`) : this.renderTerminateStateIcon(state),
		)
	}

	private renderTerminateStateIcon(state: DriveTransferState["state"]): Children {
		const [color, icon] = state === "finished" ? [theme.success, Icons.XCheckmark2] : [theme.error, Icons.XCross2]
		return m(Icon, {
			icon,
			size: IconSize.PX32,
			style: {
				fill: color,
			},
		})
	}

	private renderStatusText(type: "upload" | "download", state: DriveTransferState["state"]): Children {
		let translationKey: TranslationKeyType
		if (state === "failed") {
			translationKey = "transferFailed_msg"
		} else if (state === "waiting") {
			translationKey = "transferWaiting_msg"
		} else if (state === "active") {
			translationKey = type === "upload" ? "uploadInProgress_msg" : "downloadInProgress_msg"
		} else {
			translationKey = type === "upload" ? "uploadCompleted_msg" : "downloadCompleted_msg"
		}

		const translation = lang.getTranslation(translationKey)

		return m(".small", { "data-testid": translation.testId }, translation.text)
	}
}

import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState } from "./DriveUploadStackModel"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { component_size, px, size } from "../../../common/gui/size"
import { boxShadowHigh } from "../../../common/gui/main-styles"
import { theme } from "../../../common/gui/theme"

export interface DriveUploadBoxAttrs {
	uploadState: DriveTransferState
	onCancel: () => Promise<unknown>
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

export class DriveUploadBox implements Component<DriveUploadBoxAttrs> {
	view({ attrs: { uploadState, onCancel } }: Vnode<DriveUploadBoxAttrs>): Children {
		const { filename, isFinished, transferredSize, totalSize, type } = uploadState
		const percentage = Math.min(Math.round((transferredSize / totalSize) * 100), 100)

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
						isFinished
							? m(
									".flex.justify-center.items-center",
									{
										style: {
											width: px(component_size.button_height),
											height: px(component_size.button_height),
										},
									},
									m(Icon, {
										icon: Icons.CheckCircleFilled,
										size: IconSize.PX32,
										style: {
											fill: theme.success,
										},
									}),
								)
							: // progress
								m(
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
								),
						m(".flex.col.gap-8.flex-shrink.overflow-hidden", [
							m(".font-weight-500.text-ellipsis", filename),
							// FIXME: translate
							m(
								".small",
								type === "upload" ? (isFinished ? "Upload successful" : "Uploading…") : isFinished ? "Download successful" : "Downloading…",
							),
						]),
					]),

					isFinished
						? m("", {
								style: {
									width: px(component_size.button_height),
									height: px(component_size.button_height),
								},
							})
						: m(IconButton, {
								click: () => this.onCancelClicked(onCancel),
								icon: Icons.Cancel,
								title: lang.makeTranslation("cancel", () => "cancel"),
							}),
				]),
			],
		)
	}
	private async onCancelClicked(onCancel: () => Promise<unknown>) {
		await onCancel()
		m.redraw()
	}
}

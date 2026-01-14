import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState } from "./DriveUploadStackModel"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { px, size } from "../../../common/gui/size"
import { DriveProgressBar } from "./DriveProgressBar"

export interface DriveUploadBoxAttrs {
	uploadState: DriveTransferState
	onCancel: () => Promise<unknown>
}

export class DriveUploadBox implements Component<DriveUploadBoxAttrs> {
	view({ attrs: { uploadState, onCancel } }: Vnode<DriveUploadBoxAttrs>): Children {
		const { filename, isFinished, transferredSize, totalSize } = uploadState
		const percentage = Math.min(Math.round((transferredSize / totalSize) * 100), 100)

		return m(".flex.col", { style: { margin: px(size.spacing_12) } }, [
			m(".flex.row.items-center.justify-between", [
				m("", filename),

				isFinished
					? m(Icon, { icon: Icons.CheckCircleFilled, size: IconSize.PX24 })
					: m(IconButton, {
							click: () => this.onCancelClicked(onCancel),
							icon: Icons.Cancel,
							title: lang.makeTranslation("cancel", () => "cancel"),
						}),
			]),
			isFinished
				? []
				: m(".flex.row.justify-between", { style: { gap: px(size.spacing_32), "align-items": "baseline" } }, [
						m(".flex-grow", m(DriveProgressBar, { percentage })),
						m(
							"",
							{
								style: {
									"font-weight": "bold",
									"font-size": "x-large",
									"flex-wrap": "nowrap",
									"flex-shrink": "0",
									"min-width": "70px",
									"text-align": "right",
								},
							},
							`${percentage} %`,
						),
					]),
		])
	}
	private async onCancelClicked(onCancel: () => Promise<unknown>) {
		await onCancel()
		m.redraw()
	}
}

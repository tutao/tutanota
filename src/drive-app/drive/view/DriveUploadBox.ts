import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { px, size } from "../../../common/gui/size"
import { DriveProgressBar } from "./DriveProgressBar"

export interface DriveUploadBoxAttrs {
	fileId: string
	// isPaused: boolean
	// onPause: () => void
	// onResume: () => void
	model: DriveUploadStackModel
}

const percentageStyles = {
	"font-weight": "bold",
	"font-size": "x-large",
	"flex-wrap": "nowrap",
	"flex-shrink": "0",
	"min-width": "70px",
	"text-align": "right",
}

export class DriveUploadBox implements Component<DriveUploadBoxAttrs> {
	view({ attrs: { fileId, model } }: Vnode<DriveUploadBoxAttrs>): Children {
		const { filename, isPaused, isFinished, uploadedSize, totalSize } = model.state[fileId]
		let percentage = Math.round((uploadedSize / totalSize) * 100)
		if (percentage > 100) percentage = 100

		return m(".flex.col", { style: { margin: px(size.spacing_12) } }, [
			m(".flex.row.items-center.justify-between", [
				m("", filename),

				isFinished
					? m(Icon, { icon: Icons.CheckCircleFilled, size: IconSize.PX24 })
					: m(IconButton, {
							click: async () => {
								await model.cancelUpload(fileId)
								m.redraw()
							},
							icon: Icons.Cancel,
							title: lang.makeTranslation("cancel", () => "cancel"),
						}),
			]),
			isFinished
				? []
				: m(".flex.row.justify-between", { style: { gap: px(size.spacing_32), "align-items": "baseline" } }, [
						m(".flex-grow", m(DriveProgressBar, { percentage })),
						m("", { style: percentageStyles }, `${percentage} %`),
					]),
		])
	}
}

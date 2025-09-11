import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { theme } from "../../../common/gui/theme.js"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"

export interface DriveUploadBoxAttrs {
	fileId: string
	// isPaused: boolean
	// onPause: () => void
	// onResume: () => void
	model: DriveUploadStackModel
}

interface DriveUploadProgressBarAttrs {
	percentage: number
}

const percentageStyles = {
	"font-weight": "bold",
	"font-size": "x-large",
	"flex-wrap": "nowrap",
	"flex-shrink": "0",
	"min-width": "70px",
	"text-align": "right",
}

class DriveUploadProgressBar implements Component<DriveUploadProgressBarAttrs> {
	view({ attrs: { percentage } }: Vnode<DriveUploadProgressBarAttrs>): Children {
		const WIDTH = 100
		const HEIGHT = 12

		const containerProgressBarStyles = { width: `100%`, background: theme.state_bg_hover, "border-radius": "4px" }

		const innerProgressBarStyles = {
			width: `${percentage}%`,
			height: `${HEIGHT}px`,
			backgroundColor: theme.primary_container,
			"border-radius": "4px",
		}

		return m(
			"",
			{
				style: containerProgressBarStyles,
			},
			m("", { style: innerProgressBarStyles }),
		)
	}
}

export class DriveUploadBox implements Component<DriveUploadBoxAttrs> {
	view({ attrs: { fileId, model } }: Vnode<DriveUploadBoxAttrs>): Children {
		const { filename, isPaused, isFinished, uploadedSize, totalSize } = model.state[fileId]
		let percentage = Math.round((uploadedSize / totalSize) * 100)
		if (percentage > 100) percentage = 100

		return m(".flex.col", { style: { margin: "16px" } }, [
			m(".flex.row", { style: { "justify-content": "space-between", "align-items": "center" } }, [
				m("", filename),

				isFinished
					? m(Icon, { icon: Icons.CheckCircleFilled, size: IconSize.Medium })
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
				: m(".flex.row", { style: { "justify-content": "space-between", gap: "32px", "align-items": "baseline" } }, [
						m(DriveUploadProgressBar, { percentage }),
						m("", { style: percentageStyles }, `${percentage} %`),
					]),
		])
	}
}

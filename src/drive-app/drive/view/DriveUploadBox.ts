import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"

export interface DriveUploadBoxAttrs {
	fileNameId: string
	// isPaused: boolean
	// onPause: () => void
	// onResume: () => void
	model: DriveUploadStackModel
}

interface DriveUploadProgressBarAttrs {
	percentage: number
}

class DriveUploadProgressBar implements Component<DriveUploadProgressBarAttrs> {
	view({ attrs: { percentage } }: Vnode<DriveUploadProgressBarAttrs>): Children {
		const WIDTH = 100
		const HEIGHT = 10

		return m(
			"",
			{
				style: { width: `100%` },
			},
			m("", { style: { width: `${percentage}%`, height: `${HEIGHT}px`, backgroundColor: "red" } }),
		)
	}
}

export class DriveUploadBox implements Component<DriveUploadBoxAttrs> {
	view({ attrs: { fileNameId, model } }: Vnode<DriveUploadBoxAttrs>): Children {
		const { isPaused, isFinished, uploadedSize, totalSize } = model.state[fileNameId]
		let percentage = Math.round((uploadedSize / totalSize) * 100)
		if (percentage > 100) percentage = 100

		return m(".flex.col", [
			m(".flex.row", { style: { "justify-content": "space-between" } }, [
				m("", fileNameId),
				isFinished ? m(Icon, { icon: Icons.CheckCircleFilled, size: IconSize.Medium }) : m("", `${percentage} %`),
			]),
			//
			isFinished
				? []
				: m(".flex.row", { style: { "justify-content": "space-between" } }, [
						m(DriveUploadProgressBar, { percentage }),
						m("", [
							isPaused
								? m(IconButton, {
										click: async () => {
											await model.resumeUpload(fileNameId)
											m.redraw()
										},
										icon: Icons.Play,
										title: lang.makeTranslation("play", () => "play"),
									})
								: m(IconButton, {
										click: async () => {
											await model.pauseUpload(fileNameId)
											m.redraw()
										},
										icon: Icons.Pause,
										title: lang.makeTranslation("pause", () => "pause"),
									}),
							m(IconButton, {
								click: async () => {
									await model.cancelUpload(fileNameId)
									m.redraw()
								},
								icon: Icons.Cancel,
								title: lang.makeTranslation("cancel", () => "cancel"),
							}),
						]),
					]),
		])
	}
}

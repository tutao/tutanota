import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { DriveUploadBox } from "./DriveUploadBox"
import { px, size } from "../../../common/gui/size"
import { theme } from "../../../common/gui/theme"

export interface DriveUploadStackAttrs {
	model: DriveUploadStackModel
}

export class DriveUploadStack implements Component<DriveUploadStackAttrs> {
	view(vnode: Vnode<DriveUploadStackAttrs>): Children {
		const model = vnode.attrs.model

		const uploads = model.state
		const uploadFileIds = Object.keys(uploads).sort()

		return m(
			".flex.col.abs",
			{
				style: {
					background: theme.surface,
					width: "500px",
					bottom: "0",
					right: px(size.spacing_12),
					"box-shadow": "0 0 7px -2px #0006",
					"border-radius": `${size.radius_12}px ${size.radius_12}px 0 0`,
				},
			},
			uploadFileIds.map((fileId) => {
				return m(DriveUploadBox, { fileId, model })
			}),
		)
	}
}

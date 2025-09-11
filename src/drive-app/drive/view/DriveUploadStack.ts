import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { DriveUploadBox } from "./DriveUploadBox"

export interface DriveUploadStackAttrs {
	model: DriveUploadStackModel
}

const uploadStackStyles = {
	position: "absolute",
	width: "500px",
	bottom: "0",
	right: "10px",
	"box-shadow": "0 0 7px -2px #0006",
	"border-radius": "10px 10px 0 0",
}

export class DriveUploadStack implements Component<DriveUploadStackAttrs> {
	view(vnode: Vnode<DriveUploadStackAttrs>): Children {
		const model = vnode.attrs.model

		const uploads = model.state
		const uploadFileIds = Object.keys(uploads).sort()

		return m(
			".flex.col",
			{ style: uploadStackStyles },
			uploadFileIds.map((fileId) => {
				return m(DriveUploadBox, { fileId, model })
			}),
		)
	}
}

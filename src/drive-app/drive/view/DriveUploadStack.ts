import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { DriveUploadBox } from "./DriveUploadBox"

export interface DriveUploadStackAttrs {
	model: DriveUploadStackModel
}

export class DriveUploadStack implements Component<DriveUploadStackAttrs> {
	view(vnode: Vnode<DriveUploadStackAttrs>): Children {
		const model = vnode.attrs.model

		const uploads = model.state
		const uploadFileNameIds = Object.keys(uploads).sort()

		return m(
			".flex.col",
			uploadFileNameIds.map((fileNameId) => {
				return m(DriveUploadBox, { fileNameId, model })
			}),
		)
	}
}

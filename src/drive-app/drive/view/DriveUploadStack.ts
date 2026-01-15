import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState, DriveUploadStackModel } from "./DriveUploadStackModel"
import { DriveUploadBox, DriveUploadBoxAttrs } from "./DriveUploadBox"
import { px, size } from "../../../common/gui/size"
import { theme } from "../../../common/gui/theme"
import { boxShadowMedium } from "../../../common/gui/main-styles"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"

export interface DriveUploadStackAttrs {
	model: DriveUploadStackModel
}

export class DriveUploadStack implements Component<DriveUploadStackAttrs> {
	view(vnode: Vnode<DriveUploadStackAttrs>): Children {
		const model = vnode.attrs.model

		const uploads = Array.from(model.state.entries())

		return m(
			".flex.col.abs",
			{
				style: {
					width: "500px",
					bottom: px(size.spacing_12),
					right: px(size.spacing_12),
					gap: px(size.spacing_12),
				},
			},
			uploads.map(([fileId, uploadState]) => {
				return m(DriveUploadBox, {
					key: fileId,
					uploadState,
					onCancel: () => model.cancelUpload(fileId),
				} satisfies DriveUploadBoxAttrs & { key: string })
			}),
		)
	}
}

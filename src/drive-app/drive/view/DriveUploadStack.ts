import m, { Children, Component, Vnode } from "mithril"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { DriveUploadBox, DriveUploadBoxAttrs } from "./DriveUploadBox"
import { px, size } from "../../../common/gui/size"
import { theme } from "../../../common/gui/theme"
import { boxShadowMedium } from "../../../common/gui/main-styles"

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
					background: theme.surface,
					width: "500px",
					bottom: "0",
					right: px(size.spacing_12),
					"box-shadow": boxShadowMedium,
					"border-radius": `${size.radius_12}px ${size.radius_12}px 0 0`,
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

import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState } from "./DriveUploadStackModel"
import { DriveTransferBox, DriveUploadBoxAttrs } from "./DriveTransferBox"
import { px, size } from "../../../common/gui/size"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"

export interface DriveUploadStackAttrs {
	transfers: readonly [TransferId, DriveTransferState][]
	cancelTransfer: (transferId: TransferId) => unknown
}

export class DriveUploadStack implements Component<DriveUploadStackAttrs> {
	view({ attrs: { transfers, cancelTransfer } }: Vnode<DriveUploadStackAttrs>): Children {
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
			transfers.map(([fileId, uploadState]) => {
				return m(DriveTransferBox, {
					key: fileId,
					transferState: uploadState,
					onCancel: () => cancelTransfer(fileId),
				} satisfies DriveUploadBoxAttrs & { key: string })
			}),
		)
	}
}

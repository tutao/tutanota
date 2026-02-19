import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState } from "./DriveTransferController"
import { DriveTransferBox, DriveTransferBoxAttrs } from "./DriveTransferBox"
import { px, size } from "../../../common/gui/size"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"

export interface DriveTransferStackAttrs {
	transfers: readonly DriveTransferState[]
	cancelTransfer: (transferId: TransferId) => unknown
}

export class DriveTransferStack implements Component<DriveTransferStackAttrs> {
	view({ attrs: { transfers, cancelTransfer } }: Vnode<DriveTransferStackAttrs>): Children {
		return m(
			".flex.col.abs",
			{
				"data-testid": "drive:transferstack",
				style: {
					width: `min(calc(100vw - ${size.spacing_12}px * 2), 500px)`,
					bottom: px(size.spacing_12),
					right: px(size.spacing_12),
					gap: px(size.spacing_12),
				},
			},
			transfers.map((transferState) => {
				return m(DriveTransferBox, {
					key: transferState.id,
					transferState,
					onCancel: () => cancelTransfer(transferState.id),
				} satisfies DriveTransferBoxAttrs & { key: string })
			}),
		)
	}
}

import m, { Children, Component, Vnode } from "mithril"
import { DriveTransferState } from "./DriveTransferController"
import { px, size } from "../../../common/gui/size"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"
import { ProgressSnackBar, ProgressSnackBarAttrs, ProgressState } from "../../../common/gui/ProgressSnackBar"
import { TranslationKeyType } from "../../../common/misc/TranslationKey"
import { fabBottomSpacing } from "../../../common/gui/FloatingActionButton"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"

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
					bottom: px(size.spacing_12 + fabBottomSpacing()),
					right: px(size.spacing_12),
					gap: px(size.spacing_12),
				},
			},
			transfers.map((transferState) => {
				return m(ProgressSnackBar, {
					key: transferState.id,
					mainText: transferState.filename,
					infoText: this.getStatusText(transferState.type, transferState.state),
					progressState: this.getProgressState(transferState.state),
					percentage: Math.min(Math.round((transferState.transferredSize / transferState.totalSize) * 100), 100),
					onCancel: () => cancelTransfer(transferState.id),
				} satisfies ProgressSnackBarAttrs & { key: string })
			}),
		)
	}

	private getProgressState(state: DriveTransferState["state"]): ProgressState {
		switch (state) {
			case "active":
			case "waiting":
				return ProgressState.running
			case "failed":
				return ProgressState.error
			case "finished":
				return ProgressState.done
		}
	}

	private getStatusText(type: "upload" | "download", state: DriveTransferState["state"]): Translation {
		let translationKey: TranslationKeyType
		if (state === "failed") {
			translationKey = "transferFailed_msg"
		} else if (state === "waiting") {
			translationKey = "transferWaiting_msg"
		} else if (state === "active") {
			translationKey = type === "upload" ? "uploadInProgress_msg" : "downloadInProgress_msg"
		} else {
			translationKey = type === "upload" ? "uploadCompleted_msg" : "downloadCompleted_msg"
		}

		return lang.getTranslation(translationKey)
	}
}

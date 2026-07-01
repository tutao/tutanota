import m, { Children, Component, Vnode } from "mithril"
import { DriveTransfers, DriveTransferState, DriveTransferType } from "./DriveTransferController"
import { ProgressSnackBar, ProgressSnackBarAttrs, ProgressState } from "../../../../ui/ProgressSnackBar"
import { component_size, px, size } from "../../../../ui/size"
import { isFabShown } from "../../../../ui/base/FloatingActionButton"
import { theme } from "../../../../ui/theme"
import { boxShadowHigh } from "../../../../ui/main-styles"
import { IconButton } from "../../../../ui/base/IconButton"
import { Icons } from "../../../../ui/base/icons/Icons"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"
import { TransferId } from "../../../../entities/drive/Utils"
import { CircleLoadingBar, CircleLoadingBarAttrs } from "../../../../ui/CircleLoadingBar"
import { calculatePercentage } from "./DriveUtils"
import { formatDurationNarrow } from "../../../../ui/utils/Formatter"

export interface DriveTransferStackAttrs {
	driveTransfers: DriveTransfers
	cancelTransfer: (transferId: TransferId) => unknown
	cancelAllTransfers: () => unknown
}

// register custom CSS property so that we can animate it.
// it is relatively new so check the support before using it
if (typeof CSS.registerProperty === "function") {
	CSS.registerProperty({
		name: "--progress-value",
		syntax: "<integer>",
		initialValue: "0",
		inherits: false,
	})
}

// Interface representing the "total" status of a group of transfers in the stack.
interface TransferStackStatus {
	progressState: ProgressState
	percentage: number
	timeRemainingSec: number | null
	mainText: Translation
	infoText?: Translation
}

export class DriveTransferStack implements Component<DriveTransferStackAttrs> {
	private expanded: boolean = false
	private getStackStatus(driveTransfers: DriveTransfers): TransferStackStatus {
		let progressState: ProgressState
		let mainText: Translation
		let infoText: Translation
		const { currentTransfers, allTransfers } = driveTransfers

		const doneTransfers = allTransfers.reduce((acc, curr) => {
			if (this.getProgressState(curr.state) === ProgressState.done) {
				acc++
			}
			return acc
		}, 0)
		const totalTransfers = allTransfers.length

		const allTransfersDone = doneTransfers === totalTransfers
		if (allTransfersDone) {
			progressState = ProgressState.done
			mainText = lang.getTranslation("transfersDone_label")
			infoText = lang.getTranslation("transfersCompleted_msg", { "{done}": doneTransfers, "{total}": totalTransfers })
		} else {
			const anyTransferFailed = allTransfers.some((transfer) => this.getProgressState(transfer.state) === ProgressState.error)
			if (anyTransferFailed) {
				progressState = ProgressState.error
				mainText = lang.getTranslation("transfersFailed_label")
				infoText = lang.getTranslation("transfersFailed_msg")
			} else {
				progressState = ProgressState.running
				mainText = lang.getTranslation("transferring_label")
				infoText = lang.getTranslation("transfersCompleted_msg", { "{done}": doneTransfers, "{total}": totalTransfers })
			}
		}
		const percentage = calculatePercentage(currentTransfers)
		return { progressState, percentage, mainText, infoText, timeRemainingSec: driveTransfers.timeRemainingSec }
	}

	// Sort transfers shown in the stack in an intuitive order.
	compareTransfers(a: DriveTransferState, b: DriveTransferState): number {
		if (a.state === "active" && b.state !== "active") {
			return -1
		}
		if (a.state === "waiting" && b.state === "active") {
			return 1
		}
		if (a.state === "finished" && b.state !== "finished") {
			return 1
		}

		return 0
	}

	view({ attrs: { driveTransfers, cancelTransfer, cancelAllTransfers } }: Vnode<DriveTransferStackAttrs>): Children {
		const allTransfers = driveTransfers.allTransfers
		if (allTransfers.length === 0) {
			return
		}

		const stackStatus = this.getStackStatus(driveTransfers)

		const sortedTransfers = allTransfers.toSorted(this.compareTransfers)
		const transferSnackBars = sortedTransfers.map((transferState) => {
			return m(ProgressSnackBar, {
				key: transferState.id,
				mainText: transferState.filename,
				runningIcon: () => this.renderRunningIcon(transferState.type),
				progressState: this.getProgressState(transferState.state),
				percentage: Math.min(Math.round((transferState.transferredBytes / transferState.totalBytes) * 100), 100),
				timeRemainingSec: transferState.timeRemainingSec ?? null,
				onCancel: () => cancelTransfer(transferState.id),
			} satisfies ProgressSnackBarAttrs & { key: string })
		})
		return m(
			".flex.col.abs.border-radius",
			{
				"data-testid": "drive:transferstack",
				style: {
					width: `min(calc(100vw - ${size.spacing_12}px * 2), 500px)`,
					bottom: px((isFabShown() ? component_size.button_floating_size + size.spacing_16 : 0) + size.spacing_12),
					right: px(size.spacing_12),
					background: theme.surface,
					"box-shadow": boxShadowHigh,
					padding: px(size.spacing_8),
				},
			},
			[
				m(".flex.row.items-center.justify-between.items-center.pt-8.plr-4.pb-8", [
					m(".flex.flex-grow.items-center.gap-16.overflow-hidden.pl-16", [
						this.expanded ? null : this.renderProgress(stackStatus.progressState, stackStatus.percentage),
						m(".flex.col.gap-8.flex-shrink.overflow-hidden", [
							m(
								".font-weight-500.text-ellipsis",
								{ "data-testid": "label:transfers_status", "data-progressstate": stackStatus.progressState },
								lang.getTranslationText(stackStatus.mainText),
							),
							stackStatus.infoText ? m(".small", { "data-testid": lang.getTestId(stackStatus.infoText) }, stackStatus.infoText.text) : null,
							m(".flex.row.gap-8", [
								!this.expanded && stackStatus.timeRemainingSec
									? m(
											".small",
											lang.getTranslation("transferTimeRemaining_msg", { "{time}": formatDurationNarrow(stackStatus.timeRemainingSec) })
												.text,
										)
									: null,
							]),
						]),
					]),
					m(IconButton, {
						click: () => {
							this.expanded = !this.expanded
						},
						icon: this.expanded ? Icons.ChevronDown : Icons.ChevronUp,
						title: this.expanded ? "collapseTransferStack_label" : "expandTransferStack_label",
						size: ButtonSize.Normal,
					}),

					m(IconButton, {
						click: async () => cancelAllTransfers(),
						icon: Icons.X,
						title: "close_alt",
						size: ButtonSize.Normal,
					}),
				]),
			],
			this.expanded
				? m(
						".flex.col.gap-4",
						{
							style: {
								overflowY: "scroll",
								maxHeight: "calc(72px * 3)", // 72px is the height of one progress bar. show at max three transfers without scrolling
							},
						},
						transferSnackBars,
					)
				: null,
		)
	}

	private renderRunningIcon(transferType: DriveTransferType): Children {
		return m(Icon, {
			icon: transferType === "upload" ? Icons.Upload : Icons.DownloadFilled,
			size: IconSize.PX24,
			style: {
				fill: theme.on_surface_variant,
			},
			title: transferType === "upload" ? lang.getTranslationText("uploadInProgress_msg") : lang.getTranslationText("downloadInProgress_msg"),
		})
	}

	private renderProgress(state: ProgressState, percentage: number): Children {
		return m(CircleLoadingBar, this.getCircleLoadingBarAttrs(state, percentage))
	}

	private getCircleLoadingBarAttrs(state: ProgressState, percentage: number): CircleLoadingBarAttrs {
		switch (state) {
			case ProgressState.done:
				return {
					backgroundColor: theme.surface,
					color: theme.success,
					icon: Icons.Checkmark,
				}
			case ProgressState.error:
				return {
					backgroundColor: theme.surface,
					color: theme.error,
					icon: Icons.X,
				}
			case ProgressState.running:
				return {
					backgroundColor: theme.surface,
					percentage,
				}
		}
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
}

import Stream from "mithril/stream"
import stream from "mithril/stream"
import {
	deduplicateItemNames,
	DiskFolder,
	DriveOperationType,
	FileFolderItem,
	FolderItem,
	folderItemEntity,
	FolderItemId,
	folderItemToId,
	itemsIntoIds,
	loadFolderContents,
	moveItems,
	OperationUpdate,
	pickNewFileName,
	RunningOperation,
	toFolderItem,
	walkTree,
} from "../view/DriveUtils"
import { DriveTransferController, DriveTransfers, DriveTransferState } from "../view/DriveTransferController"
import { DownloadProgressInfo, TransferId, UploadProgressInfo } from "../../../../entities/drive/Utils"
import { EnvProvider, OperationStatus } from "@tutao/app-env"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { MoveCycleError } from "../../../common/api/common/error/MoveCycleError"
import { UserError } from "../../../common/api/main/UserError"
import { MoveToTrashError } from "../../../common/api/common/error/MoveToTrashError"
import { MoveDestinationIsSourceError } from "../../../common/api/common/error/MoveDestinationIsSourceError"
import { assertNotNull, filterInt, isNotEmpty, isNotNull, lazyMemoized, noOp, partition } from "@tutao/utils"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { handleRestError } from "@tutao/rest-client/error"
import { EventController } from "../../../common/api/main/EventController"
import { TransferProgressDispatcher } from "../../../common/api/main/TransferProgressDispatcher"
import { FileReference, WebFile } from "../../../../entities/tutanota/Utils"
import { isWebFile } from "../../../../ui/utils/FileUtils"
import { DuplicateFilesDialogDecision } from "../view/DriveGuiUtils"
import { WindowFacade } from "../../../common/misc/WindowFacade"

export const enum ClipboardAction {
	Cut,
	Copy,
}

export interface DriveClipboard {
	items: readonly FolderItemId[]
	action: ClipboardAction
}

export class DriveModel {
	#operationUpdates: Stream<OperationUpdate | null> = stream(null)
	get operationUpdates(): Stream<OperationUpdate | null> {
		return this.#operationUpdates
	}
	private readonly runningOperations: Map<Id, RunningOperation> = new Map()
	private _clipboard: DriveClipboard | null = null
	get clipboard(): DriveClipboard | null {
		return this._clipboard
	}
	private readonly uploadListener = (info: UploadProgressInfo) => {
		this.transferController.onChunkUploaded(info.transferId, info.uploadedBytes)
	}
	private readonly downloadListener = (info: DownloadProgressInfo) => {
		this.transferController.onChunkDownloaded(info.transferId, info.downloadedBytes)
	}
	private deleteWindowCloseListener: (() => unknown) | null = null

	constructor(
		private readonly transferController: DriveTransferController,
		private readonly driveFacade: DriveFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly transferProgressDispatcher: TransferProgressDispatcher,
		private readonly windowFacade: WindowFacade,
		private readonly showWindowCloseConfirmation: () => Promise<boolean>,
	) {
		this.transferController.setAllTransfersDoneListener(() => {
			if (this.deleteWindowCloseListener != null) {
				this.deleteWindowCloseListener()
				this.deleteWindowCloseListener = null
			}
		})
	}
	ensureWindowCloseListener() {
		if (this.deleteWindowCloseListener == null) {
			this.deleteWindowCloseListener = this.windowFacade.addWindowCloseListener(async () => {
				if (EnvProvider.get().isDesktop()) {
					const cancelAndClose: boolean = await this.showWindowCloseConfirmation()

					if (cancelAndClose) {
						this.deleteWindowCloseListener?.()
						this.windowFacade.closeWindow()
					}
				}
			})
		}
	}

	readonly init = lazyMemoized(async () => {
		this.eventController.addOperationStatusUpdateListener(async (update) => {
			const op = this.runningOperations.get(update.operationId)
			if (op != null) {
				let error: Error | null
				if (update.status === OperationStatus.FAILURE) {
					error = handleRestError(filterInt(assertNotNull(update.statusCode)), undefined, undefined, update.reason)
				} else {
					error = null
				}

				this.operationUpdates({
					type: op.type,
					count: op.count,
					status: update.status as OperationStatus,
					error,
				})
				if (update.status === OperationStatus.SUCCESS || update.status === OperationStatus.FAILURE) {
					this.runningOperations.delete(update.operationId)
				}
			}
		})

		this.transferProgressDispatcher.addUploadListener(this.uploadListener)
		this.transferProgressDispatcher.addDownloadListener(this.downloadListener)
	})

	cut(items: readonly FolderItem[]) {
		this._clipboard = {
			items: items.map(folderItemToId),
			action: ClipboardAction.Cut,
		}
	}

	copy(items: readonly FolderItem[]) {
		this._clipboard = {
			items: items.map(folderItemToId),
			action: ClipboardAction.Copy,
		}
	}
	async paste(currentFolder: DriveFolder): Promise<void> {
		if (this.clipboard?.action === ClipboardAction.Cut) {
			const clipboardItems = this.clipboard.items
			await this.moveItems(clipboardItems, currentFolder._id)
			this.clearClipboard()
		} else if (this.clipboard?.action === ClipboardAction.Copy) {
			const clipboardItems = this.clipboard.items
			await this.copyItems(clipboardItems, currentFolder)
		}
	}
	private async copyItems(items: readonly FolderItemId[], destination: DriveFolder) {
		const [fileItems, folderItems] = partition(items, (item) => item.type === "file")
		const files = await loadMultipleFromLists(
			DriveFileTypeRef,
			this.entityClient,
			fileItems.map((item) => item.id),
		)
		const folders = await loadMultipleFromLists(
			DriveFolderTypeRef,
			this.entityClient,
			folderItems.map((item) => item.id),
		)
		const renamedFiles = await deduplicateItemNames(await loadFolderContents(this.driveFacade, destination._id), files, folders)

		try {
			const operationId = await this.driveFacade.copyItems(files, folders, destination, renamedFiles)
			this.runningOperations.set(operationId, { type: DriveOperationType.Copy, count: items.length })
		} catch (e) {
			if (e instanceof MoveToTrashError) {
				throw new UserError("cannotCopyToTrash_msg")
			} else throw e
		}
	}

	/**
	 *
	 * @return true if anything is getting uploaded, false otherwise
	 */
	async uploadFiles(
		files: readonly (WebFile | FileReference)[],
		targetFolderId: IdTuple,
		showDuplicateFilesChoiceDialog: (fileName: string, fileCount: number) => Promise<DuplicateFilesDialogDecision>,
		folders?: readonly DiskFolder<WebFile | FileReference>[],
	): Promise<boolean> {
		let somethingIsGettingUploaded = false
		let choice: DuplicateFilesDialogDecision["choice"] | null = "keepBoth"
		let applyToAll: boolean = false

		const folderItems = await this.driveFacade.getFolderContents(targetFolderId)
		const fileNames = folderItems.files.map((i) => i.name)
		const folderNames = folderItems.folders.map((i) => i.name)
		const takenFileNames: Set<string> = new Set([...fileNames, ...folderNames])

		for (const file of files) {
			let fileName = isWebFile(file) ? file.file.name : file.name
			if (takenFileNames.has(fileName)) {
				if (!applyToAll) {
					const result = await showDuplicateFilesChoiceDialog(fileName, files.length)
					applyToAll = result.applyToAll
					choice = result.choice
				}
			}
			if (choice === "cancel") {
				break
			} else if (isNotNull(choice)) {
				if (choice === "keepBoth") {
					fileName = pickNewFileName(fileName, takenFileNames)
				} else {
					const itemToReplace = assertNotNull(
						folderItems.files.find((item) => item.name === fileName) ?? folderItems.folders.find((item) => item.name === fileName),
					)
					await this.moveToTrash([folderItemToId(toFolderItem(itemToReplace, null))])
				}
				takenFileNames.add(fileName)

				somethingIsGettingUploaded = true
				await this.transferController.upload(file, fileName, targetFolderId)
			}
		}

		for (const folder of folders ?? []) {
			folder.name = pickNewFileName(folder.name, takenFileNames)
			await walkTree({ folder, parent: targetFolderId }, async ({ folder: currentFolder, parent }) => {
				const createdFolder = await this.driveFacade.createFolder(currentFolder.name, parent)
				for (const childFile of currentFolder.files) {
					const fileName = isWebFile(childFile) ? childFile.file.name : childFile.name

					somethingIsGettingUploaded = true
					await this.transferController.upload(childFile, fileName, createdFolder._id)
				}
				return currentFolder.folders.map((f) => ({ folder: f, parent: createdFolder._id }))
			})
		}

		return somethingIsGettingUploaded
	}

	clearClipboard() {
		this._clipboard = null
	}

	transfers(): DriveTransfers {
		return this.transferController.state
	}

	cancelTransfer(transferId: TransferId) {
		this.transferController.cancelTransfer(transferId)
	}

	retryTransfer(transferId: TransferId) {
		this.transferController.retryTransfer(transferId)
	}

	retryFailedTransfers() {
		this.transferController.retryFailedTransfers()
	}

	flushTransfers() {
		this.transferController.flush()
	}

	async moveToTrash(items: readonly FolderItemId[]) {
		const { fileIds, folderIds } = itemsIntoIds(items)
		try {
			await this.driveFacade.moveToTrash(fileIds, folderIds)
			this.operationUpdates({
				type: DriveOperationType.Trash,
				count: items.length,
				status: OperationStatus.SUCCESS,
				error: null,
			})
		} catch (e) {
			this.operationUpdates({
				type: DriveOperationType.Trash,
				count: items.length,
				status: OperationStatus.FAILURE,
				error: e,
			})
		}
	}
	async deleteFromTrash(items: readonly FolderItem[]) {
		const operationId = await this.driveFacade.deleteFromTrash(items.map(folderItemEntity))
		this.runningOperations.set(operationId, { type: DriveOperationType.Delete, count: items.length })
	}
	async restoreFromTrash(items: readonly FolderItem[]) {
		const { fileIds, folderIds } = itemsIntoIds(items.map(folderItemToId))
		try {
			await this.driveFacade.restoreFromTrash(fileIds, folderIds)
			this.operationUpdates({
				type: DriveOperationType.Restore,
				count: items.length,
				status: OperationStatus.SUCCESS,
				error: null,
			})
		} catch (e) {
			this.operationUpdates({
				type: DriveOperationType.Restore,
				count: items.length,
				status: OperationStatus.FAILURE,
				error: e,
			})
		}
	}
	async moveItems(items: readonly FolderItemId[], destinationId: IdTuple): Promise<void> {
		try {
			await moveItems(this.entityClient, this.driveFacade, items, destinationId)
			this.operationUpdates({
				type: DriveOperationType.Move,
				count: items.length,
				status: OperationStatus.SUCCESS,
				error: null,
			})
		} catch (e) {
			if (e instanceof MoveCycleError) {
				throw new UserError("cannotMoveFolderIntoItself_msg")
			} else if (e instanceof MoveToTrashError) {
				throw new UserError("cannotMoveToTrash_msg")
			} else if (e instanceof MoveDestinationIsSourceError) {
				noOp()
			} else {
				this.operationUpdates({
					type: DriveOperationType.Move,
					count: items.length,
					status: OperationStatus.FAILURE,
					error: e,
				})
			}
		}
	}
	async cancelAllTransfers(confirmationDialog: (activeTransfers: DriveTransferState[]) => Promise<boolean>) {
		const { currentTransfers } = this.transfers()
		const activeTransfers = currentTransfers.filter((transfer) => transfer.state === "active" || transfer.state === "waiting")
		if (isNotEmpty(activeTransfers)) {
			const ok = activeTransfers.length === 1 ? true : await confirmationDialog(activeTransfers)
			if (ok) {
				for (const { id } of currentTransfers) {
					this.cancelTransfer(id)
				}
				this.flushTransfers()
			}
		} else {
			this.flushTransfers()
		}
	}
	isDownloadPermitted(items: readonly FolderItem[]): items is FileFolderItem[] {
		return !items.some((item) => item.type === "folder")
	}
	async downloadFile(file: DriveFile): Promise<void> {
		this.transferController.download(file, "download")
	}
	async openFile(file: DriveFile): Promise<void> {
		this.transferController.download(file, "open")
	}
	rename(item: FolderItem, newName: string) {
		this.driveFacade.rename(folderItemEntity(item), newName)
	}
}

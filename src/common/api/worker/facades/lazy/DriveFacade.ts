import { KeyLoaderFacade } from "../KeyLoaderFacade"
import { EntityClient, loadMultipleFromLists } from "../../../common/EntityClient"
import { IServiceExecutor } from "../../../common/ServiceRequest"
import { ArchiveDataType, GroupType } from "../../../common/TutanotaConstants"
import { BlobFacade } from "./BlobFacade"
import { UserFacade } from "../UserFacade"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { CryptoWrapper, VersionedKey } from "../../crypto/CryptoWrapper"
import { assertNotNull, first, groupBy, isEmpty, isSameTypeRef, partition, promiseMap, Require } from "@tutao/tutanota-utils"
import {
	createDriveCopyServicePostIn,
	createDriveFolderServiceDeleteIn,
	createDriveFolderServicePostIn,
	createDriveFolderServicePutIn,
	createDriveItemDeleteIn,
	createDriveItemPostIn,
	createDriveItemPutIn,
	createDrivePostIn,
	createDriveRenameData,
	createDriveUploadedFile,
	DriveFile,
	DriveFileRef,
	DriveFileRefTypeRef,
	DriveFileTypeRef,
	DriveFolder,
	DriveFolderTypeRef,
	DriveGroupRoot,
	DriveGroupRootTypeRef,
	DriveRenameData,
} from "../../../entities/drive/TypeRefs"
import { DriveCopyService, DriveFolderService, DriveItemService, DriveService } from "../../../entities/drive/Services"
import { CryptoFacade } from "../../crypto/CryptoFacade"
import { getElementId, getListId, isSameId, listIdPart } from "../../../common/utils/EntityUtils"
import { BlobReferenceTokenWrapper } from "../../../entities/sys/TypeRefs"
import { getCleanedMimeType } from "../../../common/DataFile"
import { TransferId } from "../../../common/drive/DriveTypes"
import { ProgrammingError } from "../../../common/error/ProgrammingError"
import { NotFoundError } from "../../../common/error/RestError"
import { MoveCycleError } from "../../../common/error/MoveCycleError"
import { MoveToTrashError } from "../../../common/error/MoveToTrashError"

export interface BreadcrumbEntry {
	folderName: string
	folder: IdTuple
}

export type DriveCryptoInfo = {
	fileGroupId: string
	fileGroupKey: VersionedKey
}

export interface FolderContents {
	files: DriveFile[]
	folders: DriveFolder[]
}

function isDriveFile(source: DriveFile | DriveFolder): source is DriveFile {
	return isSameTypeRef(source._type, DriveFileTypeRef)
}

export interface DriveRootFolders {
	root: IdTuple
	trash: IdTuple
}

export const enum DriveFolderType {
	Regular = "0",
	Root = "1",
	Trash = "2",
}

/**
 * Exposes operations on the Drive.
 */
export class DriveFacade {
	private readonly abortControllers: Map<TransferId, AbortController> = new Map()
	// this will not work with having multiple windows in desktop client
	private latestUploadId: number = 0

	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	private async getCryptoInfo(): Promise<DriveCryptoInfo> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		return { fileGroupId, fileGroupKey }
	}

	public async rename(item: DriveFile | DriveFolder, newName: string) {
		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKey(item))

		const data = createDriveItemPutIn({
			file: isSameTypeRef(item._type, DriveFileTypeRef) ? item._id : null,
			folder: isSameTypeRef(item._type, DriveFolderTypeRef) ? item._id : null,
			newName,
		})

		await this.serviceExecutor.put(DriveItemService, data, { sessionKey })
	}

	public async moveToTrash(fileIds: readonly IdTuple[], folderIds: readonly IdTuple[]) {
		for (const { left: filesChunk, right: foldersChunk } of splitListElementsIntoChunksByList(50, listIdPart, fileIds, folderIds)) {
			const deleteData = createDriveFolderServiceDeleteIn({
				files: filesChunk,
				folders: foldersChunk,
				restore: false,
			})
			await this.serviceExecutor.delete(DriveFolderService, deleteData)
		}
	}

	public async restoreFromTrash(fileIds: readonly IdTuple[], folderIds: readonly IdTuple[]) {
		for (const { left: fileChunk, right: foldersChunk } of splitListElementsIntoChunksByList(50, listIdPart, fileIds, folderIds)) {
			const deleteData = createDriveFolderServiceDeleteIn({
				files: fileChunk,
				folders: foldersChunk,
				restore: true,
			})
			await this.serviceExecutor.delete(DriveFolderService, deleteData)
		}
	}

	public async deleteFromTrash(items: readonly (DriveFile | DriveFolder)[]) {
		const [files, folders] = partition(items, isDriveFile)

		const deleteData = createDriveItemDeleteIn({
			files: files.map((f) => f._id),
			folders: folders.map((f) => f._id),
		})
		await this.serviceExecutor.delete(DriveItemService, deleteData)
	}

	public async loadRootFolders(): Promise<DriveRootFolders> {
		const { fileGroupId } = await this.getCryptoInfo()

		let driveGroupRoot: DriveGroupRoot
		try {
			driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		} catch (e) {
			if (e instanceof NotFoundError) {
				driveGroupRoot = await this.createGroupRoot(fileGroupId)
			} else {
				throw e
			}
		}

		return { root: driveGroupRoot.root, trash: driveGroupRoot.trash }
	}

	private async createGroupRoot(fileGroupId: Id): Promise<DriveGroupRoot> {
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		const rootFolderSessionKey = aes256RandomKey()
		const trashFolderSessionKey = aes256RandomKey()
		const encRootFolderSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, rootFolderSessionKey)
		const encTrashFolderSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, trashFolderSessionKey)
		await this.serviceExecutor.post(
			DriveService,
			createDrivePostIn({
				fileGroupId: fileGroupId,
				ownerKeyVersion: String(fileGroupKey.version),
				ownerEncRootFolderSessionKey: encRootFolderSessionKey,
				ownerEncTrashFolderSessionKey: encTrashFolderSessionKey,
			}),
		)
		return this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
	}

	public async getFolderContents(folderId: IdTuple): Promise<FolderContents> {
		const folder = await this.entityClient.load(DriveFolderTypeRef, folderId)
		const refs = await this.entityClient.loadAll(DriveFileRefTypeRef, folder.files)
		const isFileRef = (ref: DriveFileRef): ref is Require<"file", DriveFileRef> => ref.file != null
		const [fileRefs, folderRefs] = partition(refs, isFileRef)
		const files = await loadMultipleFromLists(
			DriveFileTypeRef,
			this.entityClient,
			fileRefs.map((ref) => ref.file),
		)
		const folders = await loadMultipleFromLists(
			DriveFolderTypeRef,
			this.entityClient,
			folderRefs.map((ref) => assertNotNull(ref.folder)),
		)
		return { files, folders }
	}

	/**
	 * @param to this is the folder where the file will be uploaded
	 */
	public async uploadFile(file: File, fileId: TransferId, fileName: string, to: IdTuple): Promise<DriveFile | null> {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)

		const abortController = new AbortController()
		this.abortControllers.set(fileId, abortController)

		const blobRefTokens: BlobReferenceTokenWrapper[] = []
		try {
			for await (const { referenceTokenWrapper } of this.blobFacade.streamEncryptAndUpload(
				ArchiveDataType.DriveFile,
				file,
				assertNotNull(fileGroupId),
				sessionKey,
				fileId,
				abortController.signal,
			)) {
				blobRefTokens.push(referenceTokenWrapper)
			}
		} finally {
			this.abortControllers.delete(fileId)
		}

		if (blobRefTokens.length === 0) {
			console.debug("No blob reference tokens, looks like this upload has been cancelled.")
			return null
		}

		const uploadedFile = createDriveUploadedFile({
			referenceTokens: blobRefTokens,
			fileName: fileName,
			mimeType: getCleanedMimeType(file.type),
			ownerEncSessionKey: ownerEncSessionKey,
			ownerKeyVersion: String(fileGroupKey.version),
			_ownerGroup: assertNotNull(fileGroupId),
		})
		const data = createDriveItemPostIn({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.post(DriveItemService, data, { sessionKey })

		return await this.entityClient.load(DriveFileTypeRef, response.createdFile)
	}

	public async cancelCurrentUpload(fileId: TransferId) {
		this.abortControllers.get(fileId)?.abort()
	}

	/**
	 * @param folderName the name of the folder, duh
	 * @param parentFolder not implemented yet, used for creating a folder inside a folder that is not the root drive
	 */
	public async createFolder(folderName: string, parentFolder: IdTuple): Promise<DriveFolder> {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)

		const newFolder = createDriveFolderServicePostIn({
			folderName,
			parent: parentFolder,
			ownerEncSessionKey,
			ownerKeyVersion: String(fileGroupKey.version),
		})
		const response = await this.serviceExecutor.post(DriveFolderService, newFolder, { sessionKey })
		return this.entityClient.load(DriveFolderTypeRef, response.folder)
	}

	/**
	 * @throws MoveToTrashError
	 */
	public async copyItems(
		files: readonly DriveFile[],
		folders: readonly DriveFolder[],
		destination: DriveFolder,
		renamedFiles: Map<Id, string>,
	): Promise<void> {
		if (destination.type === DriveFolderType.Trash) {
			throw new MoveToTrashError("Cannot copy to trash")
		}
		const fileItems = await promiseMap(files, async (file) => {
			const sk = assertNotNull(await this.cryptoFacade.resolveSessionKey(file))

			const newName = renamedFiles.get(getElementId(file)) ?? file.name
			const encNewName = this.cryptoWrapper.encryptString(sk, newName)
			return createDriveRenameData({
				file: file._id,
				folder: null,
				encNewName,
			})
		})
		const folderItems = await promiseMap(folders, async (folder) => {
			const sk = assertNotNull(await this.cryptoFacade.resolveSessionKey(folder))
			const newName = renamedFiles.get(getElementId(folder)) ?? folder.name
			const encNewName = this.cryptoWrapper.encryptString(sk, newName)
			return createDriveRenameData({
				file: null,
				folder: folder._id,
				encNewName,
			})
		})
		const copyData = createDriveCopyServicePostIn({
			items: [...fileItems, ...folderItems],
			destination: destination._id,
		})
		await this.serviceExecutor.post(DriveCopyService, copyData)
	}

	/**
	 * @throws MoveCycleError
	 * @throws MoveToTrashError
	 */
	public async move(files: readonly DriveFile[], folders: readonly DriveFolder[], destination: DriveFolder, renamedFiles: Map<Id, string>) {
		if (destination.type === DriveFolderType.Trash) {
			throw new MoveToTrashError("Cannot move to the trash")
		}
		const parents = new Set((await this.getFolderParents(destination)).map(getElementId))
		if (folders.some((f) => parents.has(getElementId(f)) || isSameId(f._id, destination._id))) {
			throw new MoveCycleError(`Cannot move folder into its child ${destination._id.join("/")}`)
		}

		for (const { left: filesChunk, right: foldersChunk } of splitListElementsIntoChunksByList(50, getListId, files, folders)) {
			const items: DriveRenameData[] = [
				...(await promiseMap(filesChunk, async (file) => {
					let encNewName: Uint8Array | null
					const newName = renamedFiles.get(getElementId(file))
					if (newName) {
						const sk = assertNotNull(await this.cryptoFacade.resolveSessionKey(file))
						encNewName = this.cryptoWrapper.encryptString(sk, newName)
					} else {
						encNewName = null
					}
					return createDriveRenameData({ file: file._id, folder: null, encNewName })
				})),
				...(await promiseMap(foldersChunk, async (folder) => {
					let encNewName: Uint8Array | null
					const newName = renamedFiles.get(getElementId(folder))
					if (newName) {
						const sk = assertNotNull(await this.cryptoFacade.resolveSessionKey(folder))
						encNewName = this.cryptoWrapper.encryptString(sk, newName)
					} else {
						encNewName = null
					}

					return createDriveRenameData({ file: null, folder: folder._id, encNewName })
				})),
			]

			const data = createDriveFolderServicePutIn({
				items,
				destination: destination._id,
			})
			await this.serviceExecutor.put(DriveFolderService, data)
		}
	}

	async generateUploadId(): Promise<TransferId> {
		return String(this.latestUploadId++) as TransferId
	}

	async getFolderParents(folder: DriveFolder): Promise<DriveFolder[]> {
		if (folder.parent == null) return []
		const result: DriveFolder[] = []
		let currentParent: DriveFolder = folder
		do {
			currentParent = await this.entityClient.load(DriveFolderTypeRef, assertNotNull(currentParent.parent))
			result.unshift(currentParent)
		} while (currentParent.parent != null)
		return result
	}
}

/**
 * Takes two lists of list entities and produces a sequence of chunks. Each chunk will have a total of
 * {@param chunkSize} items in it. Each group in each chunk will have the same list id.
 *
 * @private visibleForTesting
 */
export function* splitListElementsIntoChunksByList<I, L extends I, R extends I>(
	chunkSize: number,
	itemListId: (item: I) => Id,
	leftItems: readonly L[],
	rightItems: readonly R[],
): Generator<{ left: L[]; right: R[] }> {
	if (Number.isNaN(chunkSize) || chunkSize < 1) {
		throw new ProgrammingError("chunkSize must be positive")
	}

	// can't use itemListId directly because it fucks up the inference
	const leftById = Array.from(groupBy(leftItems, (item) => itemListId(item)).values())
	const rightById = Array.from(groupBy(rightItems, (item) => itemListId(item)).values())

	// while there's at least a list of files or list of folders to process
	while (!isEmpty(leftById) || !isEmpty(rightById)) {
		const leftList = first(leftById)
		// if we still have a list of files to process, take it
		let leftItems: L[]
		if (leftList) {
			// remove the first chunk from the current list
			leftItems = leftList.splice(0, chunkSize)
			if (isEmpty(leftList)) {
				// if we exhausted the list, yeet it out
				leftById.shift()
			}
		} else {
			leftItems = []
		}
		const rightList = first(rightById)
		let rightItems: R[]
		if (rightList) {
			rightItems = rightList.splice(0, chunkSize - leftItems.length)
			if (isEmpty(rightList)) {
				rightById.shift()
			}
		} else {
			rightItems = []
		}
		yield { left: leftItems, right: rightItems }
	}
}

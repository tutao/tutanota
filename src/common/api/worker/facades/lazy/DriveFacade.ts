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
	createDriveCreateData,
	createDriveDeleteIn,
	createDriveFolderServiceDeleteIn,
	createDriveFolderServicePostIn,
	createDriveFolderServicePutIn,
	createDrivePutIn,
	createDriveRenameData,
	createDriveUploadedFile,
	DriveFile,
	DriveFileRef,
	DriveFileRefTypeRef,
	DriveFileTypeRef,
	DriveFolder,
	DriveFolderTypeRef,
	DriveGroupRootTypeRef,
} from "../../../entities/drive/TypeRefs"
import { DriveCopyService, DriveFolderService, DriveService } from "../../../entities/drive/Services"
import { CryptoFacade } from "../../crypto/CryptoFacade"
import { getElementId, isSameId, listIdPart } from "../../../common/utils/EntityUtils"
import { BlobReferenceTokenWrapper } from "../../../entities/sys/TypeRefs"
import { getCleanedMimeType } from "../../../common/DataFile"
import { DateProvider } from "../../../common/DateProvider"
import { TransferProgressDispatcher } from "../../../main/TransferProgressDispatcher"
import { TransferId } from "../../../common/drive/DriveTypes"
import { ProgrammingError } from "../../../common/error/ProgrammingError"

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

export class DriveFacade {
	private readonly abortControllers: Map<TransferId, AbortController> = new Map()
	private latestUploadId: number = 0

	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly uploadProgressListener: TransferProgressDispatcher,
		private readonly dateProvider: DateProvider,
	) {}

	private async getCryptoInfo(): Promise<DriveCryptoInfo> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		return { fileGroupId, fileGroupKey }
	}

	public async rename(item: DriveFile | DriveFolder, newName: string) {
		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKey(item))

		const data = createDrivePutIn({
			file: isSameTypeRef(item._type, DriveFileTypeRef) ? item._id : null,
			folder: isSameTypeRef(item._type, DriveFolderTypeRef) ? item._id : null,
			newName,
		})

		await this.serviceExecutor.put(DriveService, data, { sessionKey })
	}

	public async moveToTrash(fileIds: readonly IdTuple[], folderIds: readonly IdTuple[]) {
		for (const { fileIdsChunk, folderIdsChunk } of splitIdsIntoChunksByList(50, fileIds, folderIds)) {
			const deleteData = createDriveFolderServiceDeleteIn({
				files: fileIdsChunk,
				folders: folderIdsChunk,
				restore: false,
			})
			await this.serviceExecutor.delete(DriveFolderService, deleteData)
		}
	}

	public async restoreFromTrash(fileIds: readonly IdTuple[], folderIds: readonly IdTuple[]) {
		for (const { fileIdsChunk, folderIdsChunk } of splitIdsIntoChunksByList(50, fileIds, folderIds)) {
			const deleteData = createDriveFolderServiceDeleteIn({
				files: fileIdsChunk,
				folders: folderIdsChunk,
				restore: true,
			})
			await this.serviceExecutor.delete(DriveFolderService, deleteData)
		}
	}

	public async deleteFromTrash(items: (DriveFile | DriveFolder)[]) {
		const [files, folders] = partition(items, isDriveFile)

		const deleteData = createDriveDeleteIn({
			files: files.map((f) => f._id),
			folders: folders.map((f) => f._id),
		})
		await this.serviceExecutor.delete(DriveService, deleteData)
	}

	public async loadRootFolders(): Promise<DriveRootFolders> {
		const { fileGroupId } = await this.getCryptoInfo()

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		return { root: driveGroupRoot.root, trash: driveGroupRoot.trash }
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
	 *
	 * @param files the files to upload
	 * @param to this is the folder where the file will be uploaded, if itś null we assume uploading to the root folder
	 */
	public async uploadFile(file: File, fileId: TransferId, fileName: string, to: IdTuple): Promise<DriveFile | null> {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)

		const abortController = new AbortController()
		this.abortControllers.set(fileId, abortController)

		let blobRefTokens: BlobReferenceTokenWrapper[]
		try {
			const uploadChunkGenerator = this.blobFacade.streamEncryptAndUpload(
				ArchiveDataType.DriveFile,
				file,
				assertNotNull(fileGroupId),
				sessionKey,
				abortController.signal,
			)

			let step: IteratorResult<{ uploadedBytes: number; totalBytes: number }, BlobReferenceTokenWrapper[]>
			while (!(step = await uploadChunkGenerator.next()).done) {
				const chunk = step.value
				this.uploadProgressListener.onChunkUploaded({ fileId, ...chunk })
			}
			blobRefTokens = step.value
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
			_ownerGroup: assertNotNull(fileGroupId),
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.post(DriveService, data, { sessionKey })

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
		})
		const response = await this.serviceExecutor.post(DriveFolderService, newFolder, { sessionKey })
		return this.entityClient.load(DriveFolderTypeRef, response.folder)
	}

	public async copyItems(
		files: readonly DriveFile[],
		folders: readonly DriveFolder[],
		destination: DriveFolder,
		renamedFiles: Map<Id, string>,
	): Promise<void> {
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

	public async move(filesById: readonly IdTuple[], foldersById: readonly IdTuple[], destination: IdTuple, renamedFiles: Map<Id, string>) {
		// FIXME: Respect renamedFiles (like in copyItems), but then we have to pass much more data to the server -- is it worth it?

		for (const { fileIdsChunk, folderIdsChunk: unfilteredFolderIds } of splitIdsIntoChunksByList(50, filesById, foldersById)) {
			// prevent folder from being moved into itself
			const folderIds = unfilteredFolderIds.filter((f) => !isSameId(f, destination))
			const data = createDriveFolderServicePutIn({
				files: fileIdsChunk,
				folders: folderIds,
				destination,
			})
			await this.serviceExecutor.put(DriveFolderService, data)
		}
	}

	async generateUploadId(): Promise<TransferId> {
		return String(this.latestUploadId++) as TransferId
	}
}

/**
 * Takes two lists of ids and produces a sequence of chunks. Each chunk will have a total of {@param chunkSize} items
 * in it. Each group in each chunk will have the same list id.
 *
 * @private visibleForTesting
 */
export function* splitIdsIntoChunksByList(
	chunkSize: number,
	filesById: readonly IdTuple[],
	foldersById: readonly IdTuple[],
): Generator<{ fileIdsChunk: IdTuple[]; folderIdsChunk: IdTuple[] }> {
	if (Number.isNaN(chunkSize) || chunkSize < 1) {
		throw new ProgrammingError("chunkSize must be positive")
	}

	const filesByListId = Array.from(groupBy(filesById, listIdPart).values())
	const foldersByListId = Array.from(groupBy(foldersById, listIdPart).values())

	// while there's at least a list of files or list of folders to process
	while (!isEmpty(filesByListId) || !isEmpty(foldersByListId)) {
		const fileList = first(filesByListId)
		// if we still have a list of files to process, take it
		let fileIds: IdTuple[]
		if (fileList) {
			// remove the first chunk from the current list
			fileIds = fileList.splice(0, chunkSize)
			if (isEmpty(fileList)) {
				// if we exhausted the list, yeet it out
				filesByListId.shift()
			}
		} else {
			fileIds = []
		}
		const folderList = first(foldersByListId)
		let folderIds: IdTuple[]
		if (folderList) {
			folderIds = folderList.splice(0, chunkSize - fileIds.length)
			if (isEmpty(folderList)) {
				foldersByListId.shift()
			}
		} else {
			folderIds = []
		}
		yield { fileIdsChunk: fileIds, folderIdsChunk: folderIds }
	}
}

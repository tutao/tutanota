import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient, loadMultipleFromLists } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ArchiveDataType, GroupType } from "../../common/TutanotaConstants"
import { BlobFacade } from "./lazy/BlobFacade"
import { UserFacade } from "./UserFacade"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { CryptoWrapper, VersionedKey } from "../crypto/CryptoWrapper"
import { assertNotNull, groupBy, groupByAndMap, isSameTypeRef, partition, promiseMap, Require } from "@tutao/tutanota-utils"
import { UploadProgressListener } from "../../main/UploadProgressListener"
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
} from "../../entities/drive/TypeRefs"
import { DriveCopyService, DriveFolderService, DriveService } from "../../entities/drive/Services"
import { CryptoFacade } from "../crypto/CryptoFacade"
import { getListId, isSameId, listIdPart } from "../../common/utils/EntityUtils"
import { BlobReferenceTokenWrapper } from "../../entities/sys/TypeRefs"
import { getCleanedMimeType } from "../../common/DataFile"
import { DateProvider } from "../../common/DateProvider"

export interface BreadcrumbEntry {
	folderName: string
	folder: IdTuple
}

export type UploadGuid = string

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
	private readonly abortControllers: Map<UploadGuid, AbortController> = new Map()

	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly uploadProgressListener: UploadProgressListener,
		private readonly dateProvider: DateProvider,
	) {}

	private async getCryptoInfo(): Promise<DriveCryptoInfo> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		return { fileGroupId, fileGroupKey }
	}

	public async move(filesById: readonly IdTuple[], foldersById: readonly IdTuple[], destination: IdTuple) {
		// FIXME: chunk by 50
		const filesByListId = Array.from(groupBy(filesById, listIdPart).values())
		const foldersByListId = Array.from(groupBy(foldersById, listIdPart).values())

		for (let i = 0; i < Math.max(filesByListId.length, foldersByListId.length); i++) {
			const fileIds = filesByListId.at(i) ?? []
			const unfilteredFolderIds = foldersByListId.at(i) ?? []
			// prevent folder from being moved into itself
			const folderIds = unfilteredFolderIds.filter((f) => !isSameId(f, destination))
			const data = createDriveFolderServicePutIn({
				files: fileIds,
				folders: folderIds,
				destination,
			})
			await this.serviceExecutor.put(DriveFolderService, data)
		}
	}

	private sortIntoFilesAndFolderLists(items: readonly (DriveFile | DriveFolder)[]): { filesByListId: IdTuple[][]; foldersByListId: IdTuple[][] } {
		const [files, folders] = partition(items, isDriveFile)
		const filesByListId = Array.from(groupByAndMap(files, getListId, (file) => file._id).values())
		const foldersByListId = Array.from(groupByAndMap(folders, getListId, (folder) => folder._id).values())
		return { filesByListId, foldersByListId }
	}

	public async rename(item: DriveFile | DriveFolder, newName: string) {
		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKey(item))
		const updatedDate = new Date()

		const data = createDrivePutIn({
			file: isSameTypeRef(item._type, DriveFileTypeRef) ? item._id : null,
			folder: isSameTypeRef(item._type, DriveFolderTypeRef) ? item._id : null,
			newName,
			updatedDate,
		})

		await this.serviceExecutor.put(DriveService, data, { sessionKey })
	}

	public async moveToTrash(items: (DriveFile | DriveFolder)[]) {
		const { filesByListId, foldersByListId } = this.sortIntoFilesAndFolderLists(items)
		for (let i = 0; i < Math.max(filesByListId.length, foldersByListId.length); i++) {
			const files = filesByListId.at(i) ?? []
			const folders = foldersByListId.at(i) ?? []

			const deleteData = createDriveFolderServiceDeleteIn({
				files,
				folders,
				restore: false,
			})
			await this.serviceExecutor.delete(DriveFolderService, deleteData)
		}
	}

	public async restoreFromTrash(items: (DriveFile | DriveFolder)[]) {
		const { filesByListId, foldersByListId } = this.sortIntoFilesAndFolderLists(items)
		for (let i = 0; i < Math.max(filesByListId.length, foldersByListId.length); i++) {
			const files = filesByListId.at(i) ?? []
			const folders = foldersByListId.at(i) ?? []

			const restoreData = createDriveFolderServiceDeleteIn({
				files,
				folders,
				restore: true,
			})
			await this.serviceExecutor.delete(DriveFolderService, restoreData)
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
		// FIXME: things can be in different lists but we probably have a helper for that already
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
	public async uploadFile(file: File, fileId: UploadGuid, to: IdTuple): Promise<unknown> {
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
			this.abortControllers.delete(fileGroupId)
		}

		if (blobRefTokens.length === 0) {
			console.debug("No blob reference tokens, looks like this upload has been cancelled.")
			return null
		}

		const createdDate = new Date(this.dateProvider.now())
		const updatedDate = new Date(this.dateProvider.now())

		const uploadedFile = createDriveUploadedFile({
			referenceTokens: blobRefTokens,
			fileName: file.name,
			mimeType: getCleanedMimeType(file.type),
			ownerEncSessionKey: ownerEncSessionKey,
			_ownerGroup: assertNotNull(fileGroupId),
			createdDate,
			updatedDate,
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.post(DriveService, data, { sessionKey })

		return await this.entityClient.load(DriveFileTypeRef, response.createdFile)
	}

	public async cancelCurrentUpload(fileId: UploadGuid) {
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
			createdDate: new Date(),
			updatedDate: new Date(),
			folderName,
			parent: parentFolder,
			ownerEncSessionKey,
		})
		const response = await this.serviceExecutor.post(DriveFolderService, newFolder, { sessionKey })
		return this.entityClient.load(DriveFolderTypeRef, response.folder)
	}

	public async copyItems(files: readonly DriveFile[], folders: readonly DriveFolder[], destination: DriveFolder): Promise<void> {
		const newDate = new Date()

		const fileItems = await promiseMap(files, async (file) => {
			const sk = assertNotNull(await this.cryptoFacade.resolveSessionKey(file))
			const encNewName = this.cryptoWrapper.encryptString(sk, file.name)
			return createDriveRenameData({
				file: file._id,
				folder: null,
				newDate,
				encNewName,
			})
		})
		const folderItems = await promiseMap(folders, async (folder) => {
			const sk = assertNotNull(await this.cryptoFacade.resolveSessionKey(folder))
			const encNewName = this.cryptoWrapper.encryptString(sk, folder.name)
			return createDriveRenameData({
				file: null,
				folder: folder._id,
				newDate,
				encNewName,
			})
		})
		const copyData = createDriveCopyServicePostIn({
			items: [...fileItems, ...folderItems],
			destination: destination._id,
		})
		await this.serviceExecutor.post(DriveCopyService, copyData)
	}
}

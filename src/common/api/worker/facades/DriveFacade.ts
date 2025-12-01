import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient, loadMultipleFromLists } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ArchiveDataType, CANCEL_UPLOAD_EVENT, GroupType } from "../../common/TutanotaConstants"
import { BlobFacade } from "./lazy/BlobFacade"
import { UserFacade } from "./UserFacade"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { VersionedKey } from "../crypto/CryptoWrapper"
import { assertNotNull, isSameTypeRef, partition, Require } from "@tutao/tutanota-utils"
import { locator } from "../../../../mail-app/workerUtils/worker/WorkerLocator"
import { ExposedProgressTracker } from "../../main/ProgressTracker"
import { UploadProgressListener } from "../../main/UploadProgressListener"
import {
	createDriveCreateData,
	createDriveFolderServiceDeleteIn,
	createDriveFolderServicePostIn,
	createDriveFolderServicePutIn,
	createDrivePutIn,
	createDriveUploadedFile,
	DriveFile,
	DriveFileRef,
	DriveFileRefTypeRef,
	DriveFileTypeRef,
	DriveFolder,
	DriveFolderTypeRef,
	DriveGroupRootTypeRef,
} from "../../entities/drive/TypeRefs"
import { DriveFolderService, DriveService } from "../../entities/drive/Services"
import { CryptoFacade } from "../crypto/CryptoFacade"

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
	folder: DriveFolder
	files: DriveFile[]
	folders: DriveFolder[]
}

export class DriveFacade {
	private readonly onCancelListener: EventTarget

	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly progressTracker: ExposedProgressTracker,
		private readonly cryptoFacade: CryptoFacade,
		private readonly uploadProgressListener: UploadProgressListener,
	) {
		this.onCancelListener = new EventTarget()
	}

	private async getCryptoInfo(): Promise<DriveCryptoInfo> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		return { fileGroupId, fileGroupKey }
	}

	public async updateMetadata(file: DriveFile) {
		// FIXME
		// const data = createDriveFileMetadataCreateData({ isFavorite: file.metadata.isFavorite, file: file._id })
		// await this.serviceExecutor.post(DriveFileMetadataService, data)
	}

	public async move(source: DriveFile | DriveFolder, destination: IdTuple) {
		const data = createDriveFolderServicePutIn({
			file: isSameTypeRef(source._type, DriveFileTypeRef) ? source._id : null,
			folder: isSameTypeRef(source._type, DriveFolderTypeRef) ? source._id : null,
			destination,
		})
		await this.serviceExecutor.put(DriveFolderService, data)
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

	public async moveToTrash(file: DriveFile | DriveFolder) {
		const deleteData = createDriveFolderServiceDeleteIn({
			file: isSameTypeRef(file._type, DriveFileTypeRef) ? file._id : null,
			folder: isSameTypeRef(file._type, DriveFolderTypeRef) ? file._id : null,
		})

		await this.serviceExecutor.delete(DriveFolderService, deleteData)
	}

	public async loadRootFolders(): Promise<{ root: IdTuple; trash: IdTuple }> {
		const { fileGroupId } = await this.getCryptoInfo()

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		return { root: driveGroupRoot.root, trash: driveGroupRoot.trash }
	}

	public async getFolderContents(folderId: IdTuple): Promise<FolderContents> {
		const { fileGroupKey } = await this.getCryptoInfo()

		// const data = createDriveGetIn({ folder: folderId })
		// const driveGetOut = await this.serviceExecutor.get(DriveService, data)
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

		// const decryptedNamesAndFiles = parents.map((entry, index) => {
		// 	if (index > 0) {
		// 		const key = locator.cryptoWrapper.decryptKey(fileGroupKey.object, entry.ownerEncSessionKey)
		// 		const currentFolderName = locator.cryptoWrapper.aesDecrypt(key, entry.encName, true)
		//
		// 		return { folderName: utf8Uint8ArrayToString(currentFolderName), folder: entry.folder } as BreadcrumbEntry
		// 	}
		// 	return { folderName: "Home", folder: entry.folder }
		// })

		return { folder, files, folders }
	}

	/**
	 *
	 * @param files the files to upload
	 * @param to this is the folder where the file will be uploaded, if itś null we assume uploading to the root folder
	 */
	public async uploadFile(file: File, fileId: UploadGuid, to: IdTuple) {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = locator.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)
		let uploadMonitorId: number | null = null

		// amount of work (in relation to progress monitor) the server still has to do after uploading
		const serverProcessingSteps = 1

		const blobRefTokens = await this.blobFacade.streamEncryptAndUpload(
			ArchiveDataType.DriveFile,
			file,
			assertNotNull(fileGroupId),
			sessionKey,
			this.uploadProgressListener.onChunkUploaded,
			fileId,
			this.onCancelListener,
		)

		if (blobRefTokens.length === 0) {
			console.debug("No blob reference tokens, looks like this upload has been cancelled.")
			return null
		}

		// FIXME: Do better
		const createdDate = new Date()
		const updatedDate = new Date()

		/* TODO: call convertToDataFile() again maybe to detect the mime type */
		// FIXME: encryption should be automatic
		const uploadedFile = createDriveUploadedFile({
			referenceTokens: blobRefTokens,
			fileName: file.name,
			mimeType: file.type,
			ownerEncSessionKey: ownerEncSessionKey,
			_ownerGroup: assertNotNull(fileGroupId),
			createdDate,
			updatedDate,
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.post(DriveService, data, { sessionKey })

		const createdFile = this.entityClient.load(DriveFileTypeRef, response.createdFile)
		return createdFile
	}

	public async cancelCurrentUpload(fileId: UploadGuid) {
		this.onCancelListener.dispatchEvent(new CustomEvent(CANCEL_UPLOAD_EVENT, { detail: fileId }))
	}

	/**
	 * @param folderName the name of the folder, duh
	 * @param parentFolder not implemented yet, used for creating a folder inside a folder that is not the root drive
	 */
	public async createFolder(folderName: string, parentFolder: IdTuple): Promise<DriveFolder> {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = locator.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)

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

	public async loadFileFromIdTuple(idTuple: IdTuple): Promise<DriveFile> {
		return this.entityClient.load(DriveFileTypeRef, idTuple)
	}
}

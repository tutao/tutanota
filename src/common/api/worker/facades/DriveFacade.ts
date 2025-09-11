import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient, loadMultipleFromLists } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ArchiveDataType, CANCEL_UPLOAD_EVENT, GroupType } from "../../common/TutanotaConstants"
import { BlobFacade } from "./lazy/BlobFacade"
import { UserFacade } from "./UserFacade"
import { aes256RandomKey, aesEncrypt } from "@tutao/tutanota-crypto"
import { _encryptKeyWithVersionedKey, VersionedKey } from "../crypto/CryptoWrapper"
import { assertNotNull, partition, Require, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { locator } from "../../../../mail-app/workerUtils/worker/WorkerLocator"
import { ExposedProgressTracker } from "../../main/ProgressTracker"
import { UploadProgressListener } from "../../main/UploadProgressListener"
import {
	createDriveCreateData,
	createDriveDeleteIn,
	createDriveUploadedFile,
	DriveFile,
	DriveFileRef,
	DriveFileRefTypeRef,
	DriveFileTypeRef,
	DriveFolder,
	DriveFolderTypeRef,
	DriveGroupRootTypeRef,
} from "../../entities/drive/TypeRefs"
import { DriveService } from "../../entities/drive/Services"

export interface BreadcrumbEntry {
	folderName: string
	folder: IdTuple
}

export type UploadGuid = string

export type DriveCryptoInfo = {
	fileGroupId: string
	fileGroupKey: VersionedKey
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

	public async loadTrash(): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
		const { fileGroupId } = await this.getCryptoInfo()
		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)

		return await this.getFolderContents(driveGroupRoot.trash)
	}

	public async moveToTrash(file: DriveFile) {
		const deleteData = createDriveDeleteIn({ fileToDelete: file._id })

		await this.serviceExecutor.delete(DriveService, deleteData)
	}

	public async loadRootFolderId() {
		const { fileGroupId } = await this.getCryptoInfo()

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		const rootFolderId = driveGroupRoot.root
		return rootFolderId
	}

	public async getFolderContents(folderId: IdTuple): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
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

		return { files, folders }
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

		/* TODO: call convertToDataFile() again maybe to detect the mime type */
		const uploadedFile = createDriveUploadedFile({
			referenceTokens: blobRefTokens,
			encFileName: aesEncrypt(sessionKey, stringToUtf8Uint8Array(file.name)),
			encCid: aesEncrypt(sessionKey, stringToUtf8Uint8Array("")),
			encMimeType: aesEncrypt(sessionKey, stringToUtf8Uint8Array(file.type)),
			ownerEncSessionKey: ownerEncSessionKey,
			_ownerGroup: assertNotNull(fileGroupId),
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.post(DriveService, data)

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
		const ownerEncSessionKey = _encryptKeyWithVersionedKey(fileGroupKey, sessionKey)
		const uploadedFolder = createDriveUploadedFile({
			referenceTokens: [],
			encFileName: aesEncrypt(sessionKey, stringToUtf8Uint8Array(folderName)),
			encCid: aesEncrypt(sessionKey, stringToUtf8Uint8Array("")),
			encMimeType: aesEncrypt(sessionKey, stringToUtf8Uint8Array("tuta/folder")), // TODO: make a constant !
			ownerEncSessionKey: ownerEncSessionKey.key,
			_ownerGroup: assertNotNull(fileGroupId),
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFolder, parent: parentFolder }) // we use the File type for folder and we check the mimeTy
		const response = await this.serviceExecutor.post(DriveService, data)
		return this.entityClient.load(DriveFolderTypeRef, response.createdFile)
	}

	public async loadFileFromIdTuple(idTuple: IdTuple): Promise<DriveFile> {
		return this.entityClient.load(DriveFileTypeRef, idTuple)
	}
}

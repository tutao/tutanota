import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ArchiveDataType, CANCEL_UPLOAD_EVENT, GroupType } from "../../common/TutanotaConstants"
import {
	createDriveCreateData,
	createDriveDeleteIn,
	createDriveFileMetadataCreateData,
	createDriveGetIn,
	createDriveUploadedFile,
	DriveFileMetadata,
	DriveGroupRootTypeRef,
	File,
	FileTypeRef,
} from "../../entities/tutanota/TypeRefs"
import { BlobFacade } from "./lazy/BlobFacade"
import { UserFacade } from "./UserFacade"
import { aes256RandomKey, aesEncrypt } from "@tutao/tutanota-crypto"
import { _encryptKeyWithVersionedKey, VersionedKey } from "../crypto/CryptoWrapper"
import { FileReference } from "../../common/utils/FileUtils"
import { DataFile } from "../../common/DataFile"
import { assertNotNull, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { DriveFileMetadataService, DriveService } from "../../entities/tutanota/Services"
import { locator } from "../../../../mail-app/workerUtils/worker/WorkerLocator"
import { ExposedProgressTracker } from "../../main/ProgressTracker"
import { UploadProgressListener } from "../../main/UploadProgressListener"

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

	public async updateMetadata(file: File & { metadata: DriveFileMetadata }) {
		const data = createDriveFileMetadataCreateData({ isFavorite: file.metadata.isFavorite, file: file._id })
		await this.serviceExecutor.post(DriveFileMetadataService, data)
	}

	public async loadFavourites() {
		const { fileGroupId } = await this.getCryptoInfo()
		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)

		const favouriteFiles = Promise.all(driveGroupRoot.favourites.map((idTuple) => this.entityClient.load(FileTypeRef, idTuple)))
		return favouriteFiles
	}

	public async loadTrash() {
		const { fileGroupId } = await this.getCryptoInfo()
		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)

		const trashContents = await this.getFolderContents(driveGroupRoot.trash) // modify breadcrumb ?
		return trashContents[0]
	}

	public async moveToTrash(file: File) {
		const deleteData = createDriveDeleteIn({ fileToDelete: file._id })

		await this.serviceExecutor.delete(DriveService, deleteData)
	}

	public async loadRootFolderId() {
		const { fileGroupId } = await this.getCryptoInfo()

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		const rootFolderId = driveGroupRoot.root
		return rootFolderId
	}

	public async getFolderContents(folderId: IdTuple): Promise<[File[], BreadcrumbEntry[]]> {
		const { fileGroupKey } = await this.getCryptoInfo()

		const data = createDriveGetIn({ folder: folderId })
		const driveGetOut = await this.serviceExecutor.get(DriveService, data)

		const files = await Promise.all(driveGetOut.subFilesIds.map((idTupple) => this.entityClient.load(FileTypeRef, idTupple)))
		const parents = driveGetOut.parents

		const decryptedNamesAndFiles = parents.map((entry, index) => {
			if (index > 0) {
				const key = locator.cryptoWrapper.decryptKey(fileGroupKey.object, entry.ownerEncSessionKey)
				const currentFolderName = locator.cryptoWrapper.aesDecrypt(key, entry.encName, true)

				return { folderName: utf8Uint8ArrayToString(currentFolderName), folder: entry.folder } as BreadcrumbEntry
			}
			return { folderName: "Home", folder: entry.folder }
		})

		return [files, decryptedNamesAndFiles]
	}

	/**
	 *
	 * @param files the files to upload
	 * @param to this is the folder where the file will be uploaded, if itś null we assume uploading to the root folder
	 */
	public async uploadFile(file: FileReference | DataFile, fileId: UploadGuid, to: IdTuple) {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = locator.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)
		let uploadMonitorId: number | null = null

		// amount of work (in relation to progress monitor) the server still has to do after uploading
		const serverProcessingSteps = 1

		const blobRefTokens = await this.blobFacade.encryptAndUpload(
			ArchiveDataType.DriveFile,
			(file as DataFile).data /*FileUri*/,
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

		const uploadedFile = createDriveUploadedFile({
			referenceTokens: blobRefTokens,
			encFileName: aesEncrypt(sessionKey, stringToUtf8Uint8Array(file.name)),
			encCid: aesEncrypt(sessionKey, stringToUtf8Uint8Array(file.cid ?? "")),
			encMimeType: aesEncrypt(sessionKey, stringToUtf8Uint8Array(file.mimeType)),
			ownerEncSessionKey: ownerEncSessionKey,
			_ownerGroup: assertNotNull(fileGroupId),
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.post(DriveService, data)

		const createdFile = this.entityClient.load(FileTypeRef, response.createdFile)
		return createdFile
	}

	public async cancelCurrentUpload(fileId: UploadGuid) {
		this.onCancelListener.dispatchEvent(new CustomEvent(CANCEL_UPLOAD_EVENT, { detail: fileId }))
	}

	/**
	 * @param folderName the name of the folder, duh
	 * @param parentFolder not implemented yet, used for creating a folder inside a folder that is not the root drive
	 */
	public async createFolder(folderName: string, parentFolder: IdTuple) {
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
		return this.entityClient.load(FileTypeRef, response.createdFile)
	}

	public async loadFileFromIdTuple(idTuple: IdTuple) {
		return this.entityClient.load(FileTypeRef, idTuple)
	}
}

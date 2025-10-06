import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ArchiveDataType, GroupType } from "../../common/TutanotaConstants"
import { createDriveCreateData, createDriveGetIn, createDriveUploadedFile, DriveGroupRootTypeRef, File, FileTypeRef } from "../../entities/tutanota/TypeRefs"
import { BlobFacade } from "./lazy/BlobFacade"
import { UserFacade } from "./UserFacade"
import { aes256RandomKey, aesEncrypt } from "@tutao/tutanota-crypto"
import { _encryptKeyWithVersionedKey } from "../crypto/CryptoWrapper"
import { FileReference } from "../../common/utils/FileUtils"
import { DataFile } from "../../common/DataFile"
import { assertNotNull, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { DriveService } from "../../entities/tutanota/Services"
import { locator } from "../../../../mail-app/workerUtils/worker/WorkerLocator"

export interface BreadcrumbEntry {
	folderName: string
	folder: IdTuple
}

export class DriveFacade {
	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
	) {}

	public async loadDriveGroupRoot() {
		let fileGroupId = this.userFacade.getGroupId(GroupType.File)
		console.log("fileGroupId:: for this user :: ", fileGroupId)

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		console.log(`driveGroupRoot :: `, driveGroupRoot)

		const rootFileIdTuple = driveGroupRoot.root
		//const rootFile = await this.loadFileFromIdTuple(rootFileIdTuple)
		return rootFileIdTuple
	}

	public async getFolderContents(folderId: IdTuple): Promise<[File[], BreadcrumbEntry[]]> {
		let fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)

		const data = createDriveGetIn({ folder: folderId })
		const driveGetOut = await this.serviceExecutor.get(DriveService, data)
		console.log("DriveGetOut: ", driveGetOut)

		const files = await Promise.all(driveGetOut.subFilesIds.map((idTupple) => this.entityClient.load(FileTypeRef, idTupple)))
		const parents = driveGetOut.parents
		console.log(files)

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

	// find a better way !
	// public async uploadFilesToRoot(files: (FileReference | DataFile)[]) {
	// 	let fileGroupId = this.userFacade.getGroupId(GroupType.File)
	// 	console.log("fileGroupId:: for this user :: ", fileGroupId)
	//
	// 	const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
	// 	console.log(`driveGroupRoot :: `, driveGroupRoot)
	//
	// 	const rootFileIdTuple = driveGroupRoot.root
	// 	const rootFile = await this.entityClient.load(FileTypeRef, rootFileIdTuple)
	// 	console.log(`rootFile :: `, rootFile)
	//
	// 	return this.uploadFiles(rootFile, files)
	// }

	/**
	 *
	 * @param files the files to upload
	 * @param to this is the folder where the file will be uploaded, if itś null we assume uploading to the root folder
	 */
	public async uploadFiles(files: (FileReference | DataFile)[], to: IdTuple) {
		const ownerGroupId = this.userFacade.getGroupId(GroupType.File)
		console.log(`fileGroupOwnerGroup :: ${ownerGroupId}`)

		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId)
		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = locator.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)
		const driveCreateResponses = await Promise.all(
			files.map(async (f: DataFile) => {
				const blobRefTokens = await this.blobFacade.encryptAndUpload(
					ArchiveDataType.DriveFile,
					f.data /*FileUri*/,
					assertNotNull(ownerGroupId),
					sessionKey,
				)

				const uploadedFile = createDriveUploadedFile({
					referenceTokens: blobRefTokens,
					encFileName: aesEncrypt(sessionKey, stringToUtf8Uint8Array(f.name)),
					encCid: aesEncrypt(sessionKey, stringToUtf8Uint8Array(f.cid ?? "")),
					encMimeType: aesEncrypt(sessionKey, stringToUtf8Uint8Array(f.mimeType)),
					ownerEncSessionKey: ownerEncSessionKey,
					_ownerGroup: assertNotNull(ownerGroupId),
				})
				const data = createDriveCreateData({ uploadedFile: uploadedFile, parent: to })
				const response = await this.serviceExecutor.post(DriveService, data)
				return response.createdFile
			}),
		)

		const createdFiles = Promise.all(driveCreateResponses.map((idTuple) => this.entityClient.load(FileTypeRef, idTuple)))
		return createdFiles
	}

	/**
	 * @param folderName the name of the folder, duh
	 * @param parentFolder not implemented yet, used for creating a folder inside a folder that is not the root drive
	 */
	public async createFolder(folderName: string, parentFolder: IdTuple) {
		// TODO put the drive group root and file id load in the drive service for performance reason
		const ownerGroupId = this.userFacade.getGroupId(GroupType.File)
		console.log(`fileGroupOwnerGroup :: ${ownerGroupId}`)

		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId)
		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = _encryptKeyWithVersionedKey(fileGroupKey, sessionKey)
		const uploadedFolder = createDriveUploadedFile({
			referenceTokens: [],
			encFileName: aesEncrypt(sessionKey, stringToUtf8Uint8Array(folderName)),
			encCid: aesEncrypt(sessionKey, stringToUtf8Uint8Array("")),
			encMimeType: aesEncrypt(sessionKey, stringToUtf8Uint8Array("tuta/folder")), // TODO: make a constant !
			ownerEncSessionKey: ownerEncSessionKey.key,
			_ownerGroup: assertNotNull(ownerGroupId),
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFolder, parent: parentFolder }) // we use the File type for folder and we check the mimeTy
		const response = await this.serviceExecutor.post(DriveService, data)
		return this.entityClient.load(FileTypeRef, response.createdFile)
	}

	public async loadFileFromIdTuple(idTuple: IdTuple) {
		return this.entityClient.load(FileTypeRef, idTuple)
	}
}

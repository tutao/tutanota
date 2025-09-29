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
import { assertNotNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { DriveService } from "../../entities/tutanota/Services"

export class DriveFacade {
	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
	) {}

	public async getFolderContents(folder: File | null): Promise<File[]> {
		let fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)

		const data = createDriveGetIn({ folder: folder?._id || null })
		const driveGetOut = await this.serviceExecutor.get(DriveService, data)
		console.log("DriveGetOut: ", driveGetOut)

		const files = await Promise.all(driveGetOut.subFilesIds.map((idTupple) => this.entityClient.load(FileTypeRef, idTupple)))
		console.log(files)

		return files
	}

	public async uploadFiles(files: (FileReference | DataFile)[]) {
		let fileGroupId = this.userFacade.getGroupId(GroupType.File)
		console.log("fileGroupId:: for this user :: ", fileGroupId)

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		console.log(`driveGroupRoot :: `, driveGroupRoot)

		const rootFileIdTuple = driveGroupRoot.root
		const rootFile = await this.entityClient.load(FileTypeRef, rootFileIdTuple)
		console.log(`rootFile :: `, rootFile)

		const ownerGroupId = fileGroupId
		console.log(`fileGroupOwnerGroup :: ${ownerGroupId}`)

		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId)
		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = _encryptKeyWithVersionedKey(fileGroupKey, sessionKey)
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
					ownerEncSessionKey: ownerEncSessionKey.key,
					_ownerGroup: assertNotNull(ownerGroupId),
				})
				const data = createDriveCreateData({ uploadedFile: uploadedFile })
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
	public async createFolder(folderName: string, parentFolder?: IdTuple) {
		let fileGroupId = this.userFacade.getGroupId(GroupType.File)
		console.log("fileGroupId:: for this user :: ", fileGroupId)

		const driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		console.log(`driveGroupRoot :: `, driveGroupRoot)

		const rootFileIdTuple = driveGroupRoot.root
		const rootFile = await this.entityClient.load(FileTypeRef, rootFileIdTuple)
		console.log(`rootFile :: `, rootFile)

		const ownerGroupId = fileGroupId
		console.log(`fileGroupOwnerGroup :: ${ownerGroupId}`)

		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId)
		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = _encryptKeyWithVersionedKey(fileGroupKey, sessionKey)
		const uploadedFolder = createDriveUploadedFile({
			referenceTokens: [],
			encFileName: aesEncrypt(sessionKey, stringToUtf8Uint8Array(folderName)),
			encCid: aesEncrypt(sessionKey, stringToUtf8Uint8Array("")),
			encMimeType: stringToUtf8Uint8Array("tuta/folder"), // TODO: make a constant !
			ownerEncSessionKey: ownerEncSessionKey.key,
			_ownerGroup: assertNotNull(ownerGroupId),
		})
		const data = createDriveCreateData({ uploadedFile: uploadedFolder }) // we use the File type for folder and we check the mimeTy
		const response = await this.serviceExecutor.post(DriveService, data)
		return response.createdFile
	}
}

import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ArchiveDataType, GroupType } from "../../common/TutanotaConstants"
import { createDriveCreateData, createDriveGetIn, createDriveUploadedFile, DriveGroupRootTypeRef, FileTypeRef } from "../../entities/tutanota/TypeRefs"
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

	public async getRootFiles() {
		let fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)

		const data = createDriveGetIn({ nodeId: null })
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
}

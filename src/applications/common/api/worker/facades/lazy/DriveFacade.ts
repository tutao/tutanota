import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { EntityClient, loadMultipleFromLists } from "../../../../../../platform-kit/network/EntityClient"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { DomainConfig, ProgrammingError } from "@tutao/app-env"
import { BlobFacade } from "./BlobFacade"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import {
	Aes256Key,
	aes256RandomKey,
	blake3Kdf,
	CryptoWrapper,
	generateKdfNonce,
	KdfNonce,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayTo256Key,
	uint8ArrayToKey,
	VersionedKey,
} from "@tutao/crypto"
import { assertNotNull, concat, filterInt, first, groupBy, isEmpty, isNotNull, partition, promiseMap, Require, uint8ArrayToBase64 } from "@tutao/utils"
import { elementIdToId, getElementId, getListId, idToElementId, isSameId, isSameTypeRef, listIdPart } from "@tutao/meta"
import { BlobReferenceTokenWrapper } from "@tutao/entities/sys"
import { ArchiveDataType, GroupType } from "../../../../../../entities/sys/Utils"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade"
import { ConnectionError, NotFoundError } from "@tutao/rest-client/error"
import { MoveCycleError } from "../../../common/error/MoveCycleError"
import { MoveToTrashError } from "../../../common/error/MoveToTrashError"
import { MoveDestinationIsSourceError } from "../../../common/error/MoveDestinationIsSourceError"
import { isWebFile } from "../../../../../../ui/utils/FileUtils"
import { DataFile, FileReference, isDataFile, isFileReference, WebFile } from "../../../../../../entities/tutanota/Utils"
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
	createDriveShareServiceDeleteIn,
	createDriveShareServicePostIn,
	createDriveShareTokenServicePostIn,
	createDriveUploadedFile,
	DriveCopyService_POST,
	DriveFile,
	DriveFileRef,
	DriveFileRefTypeRef,
	DriveFileShare,
	DriveFileShareTypeRef,
	DriveFileTypeRef,
	DriveFolder,
	DriveFolderService_DELETE,
	DriveFolderService_POST,
	DriveFolderService_PUT,
	DriveFolderTypeRef,
	DriveGroupRoot,
	DriveGroupRootTypeRef,
	DriveItemService_DELETE,
	DriveItemService_POST,
	DriveItemService_PUT,
	DriveRenameData,
	DriveService_POST,
	DriveShareService_DELETE,
	DriveShareService_POST,
	DriveShareTokenService_POST,
} from "@tutao/entities/drive"
import { TransferId } from "../../../../../../entities/drive/Utils"
import { getCleanedMimeType } from "../../utils/DataFile"
import { ExposedCacheStorage } from "../../../../../../app-kit/local-store/CacheStorage"
import { CacheMode, DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { isDriveFile } from "../../../common/drive/DriveUtils"
import { createReferencingInstance } from "../../../../../../entities/storage/BlobUtils"
import { BlobServerAccessInfo, createBlobServerAccessInfo } from "@tutao/entities/storage"
import { Argon2idFacade } from "../../../../../../platform-kit/base/base-crypto/WasmArgon2idFacade"

export const STATIC_FILE_SHARE_PASSWORD = "penguin-on-snowboard"

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

export interface DriveRootFolders {
	root: IdTuple
	trash: IdTuple
}

export const enum DriveFolderType {
	Regular = "0",
	Root = "1",
	Trash = "2",
}

export interface DriveShareInfo {
	share: DriveFileShare
	publicLink: string
}

function deriveFileShareKey(fileGroupKey: VersionedKey, nonce: KdfNonce): Aes256Key {
	const keyBytes = blake3Kdf(concat(keyToUint8Array(fileGroupKey.object), nonce), "driveFileShareShareKey", 32)
	return uint8ArrayTo256Key(keyBytes)
}

/**
 * Exposes operations on the Drive.
 */
export class DriveFacade {
	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly blobFacade: BlobFacade,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly cacheStorage: ExposedCacheStorage,
		private readonly domainConfig: DomainConfig,
		private readonly argon2idFacade: Argon2idFacade,
	) {}

	public async rename(item: DriveFile | DriveFolder, newName: string) {
		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKey(item))

		const data = createDriveItemPutIn({
			file: isSameTypeRef(item._type, DriveFileTypeRef) ? item._id : null,
			folder: isSameTypeRef(item._type, DriveFolderTypeRef) ? item._id : null,
			newName,
		})

		await this.serviceExecutor.execute(DriveItemService_PUT, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
	}

	public async moveToTrash(fileIds: readonly IdTuple[], folderIds: readonly IdTuple[]) {
		for (const { left: filesChunk, right: foldersChunk } of splitListElementsIntoChunksByList(50, listIdPart, fileIds, folderIds)) {
			const deleteData = createDriveFolderServiceDeleteIn({
				files: filesChunk,
				folders: foldersChunk,
				restore: false,
			})
			await this.serviceExecutor.execute(DriveFolderService_DELETE, deleteData, null)
		}
	}

	public async restoreFromTrash(fileIds: readonly IdTuple[], folderIds: readonly IdTuple[]) {
		for (const { left: fileChunk, right: foldersChunk } of splitListElementsIntoChunksByList(50, listIdPart, fileIds, folderIds)) {
			const deleteData = createDriveFolderServiceDeleteIn({
				files: fileChunk,
				folders: foldersChunk,
				restore: true,
			})
			await this.serviceExecutor.execute(DriveFolderService_DELETE, deleteData, null)
		}
	}

	public async deleteFromTrash(items: readonly (DriveFile | DriveFolder)[]): Promise<Id> {
		const [files, folders] = partition(items, isDriveFile)

		const deleteData = createDriveItemDeleteIn({
			files: files.map((f) => f._id),
			folders: folders.map((f) => f._id),
		})
		const result = await this.serviceExecutor.execute(DriveItemService_DELETE, deleteData, null)
		return result.operationId
	}

	public async loadRootFolders(cacheMode: "cached" | "withNetwork"): Promise<DriveRootFolders> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)

		let driveGroupRoot: DriveGroupRoot

		if (cacheMode === "withNetwork") {
			try {
				driveGroupRoot = await this.entityClient.load(DriveGroupRootTypeRef, idToElementId(fileGroupId))
			} catch (e) {
				if (e instanceof NotFoundError) {
					driveGroupRoot = await this.createGroupRoot(fileGroupId)
				} else {
					throw e
				}
			}
		} else {
			const maybeDriveGroupRoot = await this.cacheStorage.get(DriveGroupRootTypeRef, null, fileGroupId)
			if (maybeDriveGroupRoot) {
				driveGroupRoot = maybeDriveGroupRoot
			} else {
				throw new ConnectionError("cannot load DriveGroupRoot from cache")
			}
		}

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
	 * @param to this is the folder where the file will be uploaded
	 */
	public async uploadFile(file: WebFile | FileReference | DataFile, fileId: TransferId, fileName: string, to: IdTuple): Promise<DriveFile | null> {
		const { fileGroupId, fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)

		const blobRefTokens: BlobReferenceTokenWrapper[] = []
		if (isWebFile(file)) {
			for await (const { referenceTokenWrapper } of this.blobFacade.streamEncryptAndUpload(
				ArchiveDataType.DriveFile,
				file.file,
				assertNotNull(fileGroupId),
				sessionKey,
				fileId,
			)) {
				blobRefTokens.push(referenceTokenWrapper)
			}
		} else if (isFileReference(file)) {
			const tokens = await this.blobFacade.encryptAndUploadNative(
				ArchiveDataType.DriveFile,
				file.location,
				assertNotNull(fileGroupId),
				sessionKey,
				fileId,
			)
			blobRefTokens.push(...tokens)
		} else if (isDataFile(file)) {
			const tokens = await this.blobFacade.encryptAndUpload(ArchiveDataType.DriveFile, file.data, assertNotNull(fileGroupId), sessionKey, fileId)
			blobRefTokens.push(...tokens)
		}

		if (blobRefTokens.length === 0) {
			console.debug("No blob reference tokens, looks like this upload has been cancelled.")
			return null
		}

		const uploadedFile = createDriveUploadedFile({
			referenceTokens: blobRefTokens,
			fileName: fileName,
			mimeType: getCleanedMimeType(isWebFile(file) ? file.file.type : file.mimeType),
		})
		uploadedFile.ownerEncSessionKey = ownerEncSessionKey
		uploadedFile.ownerKeyVersion = String(fileGroupKey.version)
		const data = createDriveItemPostIn({ uploadedFile: uploadedFile, parent: to })
		const response = await this.serviceExecutor.execute(DriveItemService_POST, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

		return await this.entityClient.load(DriveFileTypeRef, response.createdFile)
	}

	/**
	 * @param folderName the name of the folder, duh
	 * @param parentFolder not implemented yet, used for creating a folder inside a folder that is not the root drive
	 */
	public async createFolder(folderName: string, parentFolder: IdTuple): Promise<DriveFolder> {
		const { fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, sessionKey)

		const newFolder = createDriveFolderServicePostIn({
			folderName,
			parent: parentFolder,
		})
		newFolder.ownerEncSessionKey = ownerEncSessionKey
		newFolder.ownerKeyVersion = String(fileGroupKey.version)
		const response = await this.serviceExecutor.execute(DriveFolderService_POST, newFolder, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
		return this.entityClient.load(DriveFolderTypeRef, response.folder)
	}

	/**
	 * @throws MoveToTrashError
	 */
	public async copyItems(files: readonly DriveFile[], folders: readonly DriveFolder[], destination: DriveFolder, renamedFiles: Map<Id, string>): Promise<Id> {
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
		const result = await this.serviceExecutor.execute(DriveCopyService_POST, copyData, null)
		return result.operationId
	}

	/**
	 * @throws MoveCycleError
	 * @throws MoveToTrashError
	 * @throws MoveDestinationIsSourceError
	 */
	public async move(files: readonly DriveFile[], folders: readonly DriveFolder[], destinationId: IdTuple, renamedFiles: Map<Id, string>) {
		if (files.some((file) => isSameId(file.folder, destinationId)) || folders.some((folder) => isSameId(folder.parent, destinationId))) {
			throw new MoveDestinationIsSourceError("Cannot move items to the location they are already in")
		}

		const destination = await this.entityClient.load(DriveFolderTypeRef, destinationId)
		if (destination.type === DriveFolderType.Trash) {
			throw new MoveToTrashError("Cannot move to the trash")
		}
		const parents = new Set((await this.getFolderParents(destinationId)).map(getElementId))
		if (folders.some((f) => parents.has(getElementId(f)) || isSameId(f._id, destinationId))) {
			throw new MoveCycleError(`Cannot move folder into its child ${destinationId.join("/")}`)
		}

		for (const { left: filesChunk, right: foldersChunk } of splitListElementsIntoChunksByList(50, getListId, files, folders)) {
			const items: DriveRenameData[] = [
				...(await promiseMap(filesChunk, async (file) => {
					let encNewName: Uint8Array<ArrayBuffer> | null
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
					let encNewName: Uint8Array<ArrayBuffer> | null
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
				destination: destinationId,
			})
			await this.serviceExecutor.execute(DriveFolderService_PUT, data, null)
		}
	}

	async getFolderParents(folderId: IdTuple): Promise<DriveFolder[]> {
		const folder = await this.entityClient.load(DriveFolderTypeRef, folderId)
		if (folder.parent == null) return []
		const result: DriveFolder[] = []
		let currentParent: DriveFolder = folder
		do {
			currentParent = await this.entityClient.load(DriveFolderTypeRef, assertNotNull(currentParent.parent))
			result.unshift(currentParent)
		} while (currentParent.parent != null)
		return result
	}
	async getFileGroupId(): Promise<Id> {
		return this.userFacade.getGroupId(GroupType.File)
	}

	async createShareLink(file: DriveFile, password: string | null, expirationDate: Date | null): Promise<DriveShareInfo> {
		const { fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKey(file))
		if (password == null) {
			// 1. Generate a random nonce (N).
			const nonce = generateKdfNonce()
			// 2. Derive a share key (SHK) using the nonce (N), a domain separator and the owner key.
			const shareKey = deriveFileShareKey(fileGroupKey, nonce)
			// 3. Encrypt the file session key (FSK) with the derived share key (SHK) producing the ENCFSK.
			const shareKeyEncFileSessionKey = this.cryptoWrapper.encryptKey(shareKey, sessionKey)
			// 4. Create a share with the N, the ENCFSK, and the owner key version.
			await this.serviceExecutor.execute(
				DriveShareService_POST,
				createDriveShareServicePostIn({
					file: file._id,
					expirationDate,
					nonce,
					ownerEncPassword: null,
					shareKeyEncFileSessionKey,
					groupKeyVersion: String(fileGroupKey.version),
				}),
				null,
			)
		} else {
			// 1. Generate a random nonce (N)
			const nonce = generateKdfNonce()
			// 2. Derive a share key (SHK) using the nonce (N), a domain separator, and the owner key.
			const shareKey = deriveFileShareKey(fileGroupKey, nonce)
			// 3. Encrypt the file session key (FSK) with the derived share key (SHK) producing the ENCFSK.
			const shareKeyEncFileSessionKey = this.cryptoWrapper.encryptKey(shareKey, sessionKey)
			// 4. Derive a salt (SLT) from the share key (SHK), the nonce (N), and a domain separator.
			const salt = blake3Kdf(concat(keyToUint8Array(shareKey), nonce), "driveFileShareSalt", 32)
			// 	5. Derive a password key (PWK) from the salt (SLT) and a user provided password (PWD).
			const passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(password, salt)
			// 	6. Encrypt the share key (SHK) with the password key (PWK) producing the ENCSHK.
			// const encryptedShareKey = this.cryptoWrapper.encryptKey(passwordKey, shareKey)
			// 	7. Encrypt the PWD with the owner key producing the ENCPWD.
			const ownerEncPassword = this.cryptoWrapper.encryptString(fileGroupKey.object, password)
			// 	8. Create a share with the N, the ENCFSK, the ENCPWD and the owner key version.
			await this.serviceExecutor.execute(
				DriveShareService_POST,
				createDriveShareServicePostIn({
					file: file._id,
					expirationDate,
					shareKeyEncFileSessionKey,
					nonce,
					ownerEncPassword,
					groupKeyVersion: String(fileGroupKey.version),
				}),
				null,
			)
			// 	Create a link with the ID of the share, the SLT, and the ENCSHK.
		}

		const updatedFile = await this.entityClient.load(DriveFileTypeRef, file._id, {
			queryParams: null,
			baseUrl: null,
			extraHeaders: null,
			ownerKeyProvider: null,
			sessionKey: null,
			suspensionBehavior: null,
			cacheMode: CacheMode.WriteOnly,
		})
		return this.getShareInfo(updatedFile)
	}

	async getShareInfo(file: DriveFile): Promise<DriveShareInfo> {
		// FIXME: I feel like there must be something more semantically useful than apiUrl, but couldn't find anything.
		const appUrl = this.domainConfig.apiUrl

		const share = await this.entityClient.load(DriveFileShareTypeRef, idToElementId(assertNotNull(file.share)))
		const shareId = elementIdToId(share._id)

		const { fileGroupKey } = await this.getCryptoInfo()

		const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)
		if (isNotNull(share.ownerEncPassword)) {
			// share is protected with a password
			const salt = blake3Kdf(concat(keyToUint8Array(shareKey), share.nonce), "driveFileShareSalt", 32)

			// FIXME: Fetch the correct version of the group key
			const password = this.cryptoWrapper.decryptString(fileGroupKey.object, share.ownerEncPassword)

			const passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(password, salt)
			const encryptedShareKey = this.cryptoWrapper.encryptKey(passwordKey, shareKey)

			const queryParams = new URLSearchParams({
				authToken: uint8ArrayToBase64(share.authToken),
			})
			const fragmentParams = new URLSearchParams({
				shareKey: uint8ArrayToBase64(encryptedShareKey),
				salt: uint8ArrayToBase64(salt),
			})

			const publicLink = `${appUrl}/drivefile/${shareId}?${queryParams.toString()}#${fragmentParams.toString()}`
			return { share, publicLink }
		} else {
			// share is publicly available

			const queryParams = new URLSearchParams({
				authToken: uint8ArrayToBase64(share.authToken),
			})
			const fragmentParams = new URLSearchParams({
				shareKey: keyToBase64(shareKey),
			})

			const publicLink = `${appUrl}/drivefile/${shareId}?${queryParams.toString()}#${fragmentParams.toString()}`
			return { share, publicLink }
		}
	}

	async deleteShareLink(file: DriveFile): Promise<void> {
		await this.serviceExecutor.execute(
			DriveShareService_DELETE,
			createDriveShareServiceDeleteIn({
				file: file._id,
			}),
			null,
		)
	}

	private async getCryptoInfo(): Promise<DriveCryptoInfo> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		return { fileGroupId, fileGroupKey }
	}

	private async createGroupRoot(fileGroupId: Id): Promise<DriveGroupRoot> {
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		const rootFolderSessionKey = aes256RandomKey()
		const trashFolderSessionKey = aes256RandomKey()
		const encRootFolderSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, rootFolderSessionKey)
		const encTrashFolderSessionKey = this.cryptoWrapper.encryptKey(fileGroupKey.object, trashFolderSessionKey)
		const data = createDrivePostIn({
			fileGroupId: fileGroupId,
			ownerEncRootFolderSessionKey: encRootFolderSessionKey,
			ownerEncTrashFolderSessionKey: encTrashFolderSessionKey,
		})
		data.ownerKeyVersion = String(fileGroupKey.version)
		await this.serviceExecutor.execute(DriveService_POST, data, null)
		return this.entityClient.load(DriveGroupRootTypeRef, idToElementId(fileGroupId))
	}

	async downloadFileForShare(
		shareId: Id,
		nonce: string,
		encParam: { type: "key"; sharedKey: Base64 } | { type: "password"; password: string },
	): Promise<{ file: DriveFile; fileSessionKey: Uint8Array<ArrayBuffer>; share: DriveFileShare }> {
		throw new ProgrammingError("fix this")
		// const share = await this.entityClient.load(DriveFileShareTypeRef, idToElementId(shareId), {
		// 	extraHeaders: { nonce },
		// 	ownerKeyProvider: null,
		// 	sessionKey: null,
		// 	baseUrl: null,
		// 	cacheMode: null,
		// 	queryParams: null,
		// 	suspensionBehavior: null,
		// })
		// const shareKey =
		// 	encParam.type === "key"
		// 		? uint8ArrayTo256Key(base64ToUint8Array(encParam.sharedKey))
		// 		: await this.argon2idFacade.generateKeyFromPassphrase(encParam.password, share.salt)
		//
		// const fileSessionKey = this.cryptoWrapper.decryptKey(shareKey, share.shareKeyEncFileSessionKey)
		//
		// const file = await this.entityClient.load(DriveFileTypeRef, share.file, {
		// 	extraHeaders: { nonce: nonce },
		// 	ownerKeyProvider: null,
		// 	sessionKey: fileSessionKey,
		// 	baseUrl: null,
		// 	cacheMode: null,
		// 	queryParams: null,
		// 	suspensionBehavior: null,
		// })
		// return {
		// 	file,
		// 	fileSessionKey: bitArrayToUint8Array(fileSessionKey.bits),
		// 	share,
		// }
	}

	async downloadBlobsForShare(file: DriveFile, fileSessionKey: Uint8Array<ArrayBuffer>, nonce: Base64): Promise<DataFile> {
		const bytes = await this.blobFacade.downloadAndDecrypt(ArchiveDataType.DriveFile, createReferencingInstance(file), "123" as TransferId, {
			baseUrl: null,
			extraHeaders: null,
			suspensionBehavior: null,
			sessionKey: uint8ArrayToKey(fileSessionKey),
			accessTokenProvider: async (): Promise<Map<Id, BlobServerAccessInfo>> => {
				const result = await this.serviceExecutor.execute(DriveShareTokenService_POST, createDriveShareTokenServicePostIn({ file: file._id }), {
					extraHeaders: { nonce: nonce },
					sessionKey: null,
					baseUrl: null,
					queryParams: null,
					suspensionBehavior: null,
				})
				return new Map([[file.blobs[0].archiveId, createBlobServerAccessInfo(result.blobAccessInfo)]])
			},
		})
		return {
			_type: "DataFile",
			data: bytes,
			mimeType: file.mimeType,
			name: file.name,
			size: filterInt(file.size),
		}
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

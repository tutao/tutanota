import {
	createDriveShareServiceDeleteIn,
	createDriveShareServicePasswordUpdate,
	createDriveShareServicePostIn,
	createDriveShareServicePutIn,
	createDriveShareTokenServicePostIn,
	DriveFile,
	DriveFileShare,
	DriveFileShareTypeRef,
	DriveFileTypeRef,
	DriveShareService_DELETE,
	DriveShareService_POST,
	DriveShareService_PUT,
	DriveShareTokenService_POST,
} from "@tutao/entities/drive"
import { assertNotNull, base64ToUint8Array, concat, filterInt, isNotNull, Nullable, uint8ArrayToBase64 } from "@tutao/utils"
import {
	Aes256Key,
	bitArrayToUint8Array,
	blake3Kdf,
	createAuthVerifier,
	CryptoWrapper,
	generateKdfNonce,
	KdfNonce,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayTo256Key,
	uint8ArrayToKey,
	VersionedKey,
} from "@tutao/crypto"
import { ElementId, elementIdToId, idToElementId } from "@tutao/meta"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade"
import { ArchiveDataType, GroupType } from "../../../../../../entities/sys/Utils"
import { DriveCryptoInfo } from "./DriveFacade"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DomainConfig } from "@tutao/app-env"
import { Argon2idFacade } from "../../../../../../platform-kit/base/base-crypto/WasmArgon2idFacade"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { CacheMode } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { DataFile } from "../../../../../../entities/tutanota/Utils"
import { createReferencingInstance } from "../../../../../../entities/storage/BlobUtils"
import { TransferId } from "../../../../../../entities/drive/Utils"
import { BlobServerAccessInfo, createBlobServerAccessInfo } from "@tutao/entities/storage"
import { BlobFacade } from "./BlobFacade"

export interface DriveShareInfo {
	share: DriveFileShare
	publicLink: string
	password?: string
}

export interface PasswordUpdate {
	verifier: Uint8Array<ArrayBuffer>
	ownerEncPassword: Uint8Array<ArrayBuffer>
	groupKeyVersion: string
}

function deriveFileShareKey(fileGroupKey: VersionedKey, nonce: KdfNonce): Aes256Key {
	const keyBytes = blake3Kdf(concat(keyToUint8Array(fileGroupKey.object), nonce), "driveFileShareShareKey", 32)
	return uint8ArrayTo256Key(keyBytes)
}

export class DriveFileSharingFacade {
	constructor(
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly userFacade: UserFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly domainConfig: DomainConfig,
		private readonly argon2idFacade: Argon2idFacade,
		private readonly entityClient: EntityClient,
		private readonly blobFacade: BlobFacade,
	) {}

	async createShareLink(file: DriveFile, password: string | null, expirationDate: Date | null): Promise<[DriveFile, DriveShareInfo]> {
		const { fileGroupKey } = await this.getCryptoInfo()

		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKey(file))
		// 1. Generate a random nonce (N).
		const nonce = generateKdfNonce()
		// 2. Derive a share key (SHK) using the nonce (N), a domain separator and the owner key.
		const shareKey = deriveFileShareKey(fileGroupKey, nonce)
		// 3. Encrypt the file session key (FSK) with the derived share key (SHK) producing the ENCFSK.
		const shareKeyEncFileSessionKey = this.cryptoWrapper.encryptKey(shareKey, sessionKey)
		if (password == null) {
			// 4. Create a share with the N, the ENCFSK, and the owner key version.

			await this.serviceExecutor.execute(
				DriveShareService_POST,
				createDriveShareServicePostIn({
					file: file._id,
					expirationDate,
					nonce,
					ownerEncPassword: null,
					verifier: null,
					shareKeyEncFileSessionKey,
					groupKeyVersion: String(fileGroupKey.version),
				}),
				null,
			)
		} else {
			// 	4. Encrypt the PWD with the owner key producing the ENCPWD.
			const ownerEncPassword = this.cryptoWrapper.encryptString(fileGroupKey.object, password)
			const verifier = await this.createShareVerifier(shareKey, nonce, password)
			// 	5. Create a share with the N, the ENCFSK, the ENCPWD and the owner key version.
			await this.serviceExecutor.execute(
				DriveShareService_POST,
				createDriveShareServicePostIn({
					file: file._id,
					expirationDate,
					shareKeyEncFileSessionKey,
					nonce,
					ownerEncPassword,
					verifier,
					groupKeyVersion: String(fileGroupKey.version),
				}),
				null,
			)
		}

		// FIXME: Do not reload the whole file maybe? Just get the share ID from DriveShareService_POST?
		const updatedFile = await this.loadDriveFile(file._id)
		return [updatedFile, await this.getShareInfo(idToElementId(assertNotNull(updatedFile.share)))]
	}
	private async createShareVerifier(shareKey: Aes256Key, nonce: KdfNonce, password: string): Promise<Uint8Array<ArrayBuffer>> {
		const salt = blake3Kdf(concat(keyToUint8Array(shareKey), nonce), "driveFileShareSalt", 32)
		const passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(password, salt)
		return createAuthVerifier(passwordKey)
	}

	private async constructPasswordUpdate(share: DriveFileShare, password: string): Promise<PasswordUpdate> {
		const { fileGroupKey } = await this.getCryptoInfo()
		const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)
		const nonce = share.nonce as KdfNonce
		const verifier = await this.createShareVerifier(shareKey, nonce, password)
		const ownerEncPassword = this.cryptoWrapper.encryptString(fileGroupKey.object, password)
		return {
			ownerEncPassword,
			verifier,
			groupKeyVersion: String(fileGroupKey.version),
		}
	}

	async updateShare(share: DriveFileShare, password: string | null, expirationDate: Date | null) {
		let passwordUpdate: PasswordUpdate | null = null
		if (isNotNull(password)) {
			passwordUpdate = await this.constructPasswordUpdate(share, password)
		}

		await this.serviceExecutor.execute(
			DriveShareService_PUT,
			createDriveShareServicePutIn({
				share: elementIdToId(share._id),
				passwordUpdate: passwordUpdate
					? createDriveShareServicePasswordUpdate({
							verifier: passwordUpdate.verifier,
							ownerEncPassword: passwordUpdate.ownerEncPassword,
							groupKeyVersion: passwordUpdate.groupKeyVersion,
						})
					: null,
				expirationDate,
			}),
			null,
		)
	}
	private async getCryptoInfo(): Promise<DriveCryptoInfo> {
		const fileGroupId = this.userFacade.getGroupId(GroupType.File)
		const fileGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(fileGroupId)
		return { fileGroupId, fileGroupKey }
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

	async loadDriveFile(fileId: IdTuple): Promise<DriveFile> {
		return await this.entityClient.load(DriveFileTypeRef, fileId, {
			queryParams: null,
			baseUrl: null,
			extraHeaders: null,
			ownerKeyProvider: null,
			sessionKey: null,
			suspensionBehavior: null,
			cacheMode: CacheMode.WriteOnly,
		})
	}

	async getShareInfo(shareId: ElementId): Promise<DriveShareInfo> {
		const { fileGroupKey } = await this.getCryptoInfo()

		// FIXME: I feel like there must be something more semantically useful than apiUrl, but couldn't find anything.
		const appUrl = this.domainConfig.apiUrl

		const share = await this.entityClient.load(DriveFileShareTypeRef, shareId)

		const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)
		if (isNotNull(share.ownerEncPassword)) {
			// share is protected with a password
			// 1. Derive a salt (SLT) from the share key (SHK), the nonce (N), and a domain separator.
			const salt = blake3Kdf(concat(keyToUint8Array(shareKey), share.nonce), "driveFileShareSalt", 32)
			const password = this.cryptoWrapper.decryptString(fileGroupKey.object, share.ownerEncPassword) // FIXME: Fetch the correct version of the group key
			// 	2. Derive a password key (PWK) from the salt (SLT) and a user provided password (PWD).
			const passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(password, salt)
			// 	3. Encrypt the share key (SHK) with the password key (PWK) producing the ENCSHK.
			const encryptedShareKey = this.cryptoWrapper.encryptKey(passwordKey, shareKey)
			// 4. Create a link with shareId, authToken, encryptedShareKey (ENCSHK), and salt (SLT)
			const queryParams = new URLSearchParams({
				authToken: uint8ArrayToBase64(share.authToken),
			})
			const fragmentParams = new URLSearchParams({
				shareKey: uint8ArrayToBase64(encryptedShareKey),
				salt: uint8ArrayToBase64(salt),
			})

			const publicLink = `${appUrl}/drivefile/${elementIdToId(shareId)}?${queryParams.toString()}#${fragmentParams.toString()}`
			return { share, publicLink, password }
		} else {
			// share is publicly available
			// 1. Create a link with shareId, authToken, shareKey (SHK)
			const queryParams = new URLSearchParams({
				authToken: uint8ArrayToBase64(share.authToken),
			})
			const fragmentParams = new URLSearchParams({
				shareKey: keyToBase64(shareKey),
			})

			const publicLink = `${appUrl}/drivefile/${elementIdToId(shareId)}?${queryParams.toString()}#${fragmentParams.toString()}`
			return { share, publicLink }
		}
	}

	async downloadFileForShare(
		shareId: Id,
		authToken: string,
		encParam: { type: "key"; sharedKey: Base64 } | { type: "password"; password: string; salt: string; sharedKey: Base64 },
	): Promise<{ file: DriveFile; fileSessionKey: Uint8Array<ArrayBuffer>; share: DriveFileShare }> {
		const loadFileShareHeaders: Nullable<Dict> = {
			authToken: authToken,
		}
		let passwordKey
		if (encParam.type === "password") {
			passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(encParam.password, base64ToUint8Array(encParam.salt))

			const verifier = uint8ArrayToBase64(createAuthVerifier(passwordKey))
			loadFileShareHeaders["verifier"] = verifier
		}
		const share = await this.entityClient.load(DriveFileShareTypeRef, idToElementId(shareId), {
			extraHeaders: loadFileShareHeaders,
			ownerKeyProvider: null,
			sessionKey: null,
			baseUrl: null,
			cacheMode: null,
			queryParams: null,
			suspensionBehavior: null,
		})
		const shareKey =
			encParam.type === "key"
				? uint8ArrayTo256Key(base64ToUint8Array(encParam.sharedKey))
				: this.cryptoWrapper.decryptKey(assertNotNull(passwordKey), base64ToUint8Array(encParam.sharedKey))

		const fileSessionKey = this.cryptoWrapper.decryptKey(shareKey, share.shareKeyEncFileSessionKey)
		const file = await this.entityClient.load(DriveFileTypeRef, share.file, {
			extraHeaders: { authToken: authToken },
			ownerKeyProvider: null,
			sessionKey: fileSessionKey,
			baseUrl: null,
			cacheMode: null,
			queryParams: null,
			suspensionBehavior: null,
		})
		return {
			file,
			fileSessionKey: bitArrayToUint8Array(fileSessionKey.bits),
			share,
		}
	}
	async downloadBlobsForShare(file: DriveFile, fileSessionKey: Uint8Array<ArrayBuffer>, authToken: Base64): Promise<DataFile> {
		const bytes = await this.blobFacade.downloadAndDecrypt(ArchiveDataType.DriveFile, createReferencingInstance(file), "123" as TransferId, {
			baseUrl: null,
			extraHeaders: { authToken: authToken },
			suspensionBehavior: null,
			sessionKey: uint8ArrayToKey(fileSessionKey),
			accessTokenProvider: async (): Promise<Map<Id, BlobServerAccessInfo>> => {
				const result = await this.serviceExecutor.execute(DriveShareTokenService_POST, createDriveShareTokenServicePostIn({ file: file._id }), {
					extraHeaders: { authToken: authToken },
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

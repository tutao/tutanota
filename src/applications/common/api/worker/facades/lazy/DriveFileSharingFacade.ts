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
import { assertNotNull, concat, filterInt, isNotNull, uint8ArrayToBase64 } from "@tutao/utils"
import {
	Aes256Key,
	AesKey,
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
import { elementIdToId, Entity, idToElementId } from "@tutao/meta"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade"
import { ArchiveDataType } from "../../../../../../entities/sys/Utils"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DomainConfig, ProgrammingError } from "@tutao/app-env"
import { Argon2idFacade } from "../../../../../../platform-kit/base/base-crypto/WasmArgon2idFacade"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { CacheMode } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { DataFile } from "../../../../../../entities/tutanota/Utils"
import { createReferencingInstance } from "../../../../../../entities/storage/BlobUtils"
import { BlobServerAccessInfo, createBlobServerAccessInfo } from "@tutao/entities/storage"
import { BlobFacade } from "./BlobFacade"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"

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

/**
 * Manages public sharing for Drive files
 */
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

	/**
	 * Make a {@param file} publicly accessible via a sharing link
	 * @param file to share
	 * @param password optional password that must be provided to access the file via a link
	 * @param expirationDate optional date until when the public share link will be accessible. Otherwise the file is
	 * accessible indefinitely
	 * @return updated file instance with link to share and share info
	 */
	async createShareLink(file: DriveFile, password: string | null, expirationDate: Date | null): Promise<{ file: DriveFile; shareInfo: DriveShareInfo }> {
		if (file.share != null) {
			throw new ProgrammingError("File is already shared")
		}
		const fileGroupKey = await this.resolveFileGroupKey(file)

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
					expirationDate,
					shareKeyEncFileSessionKey,
					ownerEncPassword: null,
					groupKeyVersion: String(fileGroupKey.version),
					verifier: null, // no password therefore no verifier
					nonce, // nonce is necessary so that we can re-derive the share key and salt in the future
					file: file._id,
				}),
				null,
			)
		} else {
			// 	4. Encrypt the PWD with the owner key producing the ENCPWD.
			// enc password is useful for managing the share
			const ownerEncPassword = this.cryptoWrapper.encryptString(fileGroupKey.object, password)
			// verifier is how server validates the password
			const verifier = await this.createShareVerifier(shareKey, nonce, password)
			// 	5. Create a share with the N, the ENCFSK, the ENCPWD and the owner key version.
			await this.serviceExecutor.execute(
				DriveShareService_POST,
				createDriveShareServicePostIn({
					expirationDate,
					shareKeyEncFileSessionKey,
					ownerEncPassword,
					groupKeyVersion: String(fileGroupKey.version),
					verifier,
					nonce, // nonce is necessary so that we can re-derive the share key and salt in the future
					file: file._id,
				}),
				null,
			)
		}

		// reload DriveFile so that it has the link to share
		const updatedFile = await this.loadDriveFile(file._id)
		return { file: updatedFile, shareInfo: await this.getShareInfoForManagement(updatedFile) }
	}
	private async createShareVerifier(shareKey: Aes256Key, nonce: KdfNonce, password: string): Promise<Uint8Array<ArrayBuffer>> {
		const salt = blake3Kdf(concat(keyToUint8Array(shareKey), nonce), "driveFileShareSalt", 32)
		const passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(password, salt)
		return createAuthVerifier(passwordKey)
	}

	private async constructPasswordUpdate(share: DriveFileShare, password: string): Promise<PasswordUpdate> {
		const fileGroupKey = await this.resolveShareOwnerKey(share)
		// obtain share key again (it doesn't change with password, but it's needed to create verifier)
		const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)
		const nonce = share.nonce as KdfNonce
		// create new verifier so that the server can validate the new password
		const verifier = await this.createShareVerifier(shareKey, nonce, password)
		// re-encrypt the password for the owner so that it can be viewed
		const ownerEncPassword = this.cryptoWrapper.encryptString(fileGroupKey.object, password)
		return {
			ownerEncPassword,
			verifier,
			groupKeyVersion: String(fileGroupKey.version),
		}
	}

	/**
	 * Update existing {@param share}.
	 * See {@link DriveFileSharingFacade#createShareLink}
	 */
	async updateShare(share: DriveFileShare, password: string | null, expirationDate: Date | null): Promise<void> {
		let passwordUpdate: PasswordUpdate | null
		if (isNotNull(password)) {
			passwordUpdate = await this.constructPasswordUpdate(share, password)
		} else {
			passwordUpdate = null
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

	/**
	 * Stop publicly sharing {@link file}.
	 * This invalidates the share link.
	 */
	async deleteShareLink(file: DriveFile): Promise<void> {
		await this.serviceExecutor.execute(
			DriveShareService_DELETE,
			createDriveShareServiceDeleteIn({
				file: file._id,
			}),
			null,
		)
	}

	/** load {@Link DriveFile} bypassing the cache */
	private async loadDriveFile(fileId: IdTuple): Promise<DriveFile> {
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

	/** Obtain share info for a publicly shared {@link DriveFile}. Must be a member of the file group. */
	async getShareInfoForManagement(file: DriveFile): Promise<DriveShareInfo> {
		const shareId = idToElementId(assertNotNull(file.share, "file is not shared"))
		// FIXME: I feel like there must be something more semantically useful than apiUrl, but couldn't find anything.
		const appUrl = this.domainConfig.apiUrl

		const share = await this.entityClient.load(DriveFileShareTypeRef, shareId)
		if (share.groupKeyVersion !== file._ownerKeyVersion) {
			throw new ProgrammingError("Group Key version for file and share do not match")
		}
		const groupKey = await this.resolveShareOwnerKey(share)
		const shareKey = deriveFileShareKey(groupKey, share.nonce as KdfNonce)
		if (isNotNull(share.ownerEncPassword)) {
			// share is protected with a password
			// 1. Derive a salt (SLT) from the share key (SHK), the nonce (N), and a domain separator.
			const salt = blake3Kdf(concat(keyToUint8Array(shareKey), share.nonce), "driveFileShareSalt", 32)
			const password = this.cryptoWrapper.decryptString(groupKey.object, share.ownerEncPassword)
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
			// share is publicly available without a password
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

	private async resolveFileGroupKey(entity: Entity): Promise<VersionedKey> {
		const groupKeyVersion = parseKeyVersion(entity._ownerKeyVersion ?? "0")
		const groupKey = await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(entity._ownerGroup), groupKeyVersion)
		return { object: groupKey, version: groupKeyVersion }
	}
	async resolveShareOwnerKey(share: DriveFileShare): Promise<VersionedKey> {
		const groupKeyVersion = parseKeyVersion(share.groupKeyVersion ?? "0")
		const groupKey = await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(share._ownerGroup), groupKeyVersion)
		return { object: groupKey, version: groupKeyVersion }
	}

	/**
	 * Download {@link DriveFile} via a public link
	 * @param shareId that points to the file
	 * @param authToken provided via query params
	 * @param encParam provided via fragment. Will vary based on the presence of a password
	 */
	async loadSharedFile(
		shareId: Id,
		authToken: string,
		encParam:
			| { type: "key"; shareKey: Uint8Array<ArrayBuffer> }
			| { type: "password"; password: string; salt: Uint8Array<ArrayBuffer>; shareKey: Uint8Array<ArrayBuffer> },
	): Promise<{ file: DriveFile; fileSessionKey: Uint8Array<ArrayBuffer>; share: DriveFileShare }> {
		let shareKey: AesKey
		let share: DriveFileShare
		if (encParam.type === "password") {
			// Derive the password key (PWK) from the salt (SLT) and the user provided password (PWD).
			const passwordKey = await this.argon2idFacade.generateKeyFromPassphrase(encParam.password, encParam.salt)

			// Create verifier for authentication
			const verifier = uint8ArrayToBase64(createAuthVerifier(passwordKey))
			// Download the share linked by the URL.
			share = await this.entityClient.load(DriveFileShareTypeRef, idToElementId(shareId), {
				extraHeaders: { authToken, verifier },
				ownerKeyProvider: null,
				sessionKey: null,
				baseUrl: null,
				cacheMode: null,
				queryParams: null,
				suspensionBehavior: null,
			})
			// Decrypt the encrypted share key (ENCSHK) with the password key (PWK) producing the SHK.
			shareKey = this.cryptoWrapper.decryptKey(assertNotNull(passwordKey), encParam.shareKey)
		} else {
			// Download the share linked by the URL.
			share = await this.entityClient.load(DriveFileShareTypeRef, idToElementId(shareId), {
				extraHeaders: { authToken },
				ownerKeyProvider: null,
				sessionKey: null,
				baseUrl: null,
				cacheMode: null,
				queryParams: null,
				suspensionBehavior: null,
			})
			// Without password the share key (SHK) is directly usable
			shareKey = uint8ArrayTo256Key(encParam.shareKey)
		}
		// Decrypt the file session key (ENCFSK) with the share key (SHK) producing the FSK.
		const fileSessionKey = this.cryptoWrapper.decryptKey(shareKey, share.shareKeyEncFileSessionKey)
		// Download the file and decrypt it with the file session key (FSK).
		const file = await this.entityClient.load(DriveFileTypeRef, share.file, {
			extraHeaders: { authToken },
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

	/**
	 * Download content of the file shared via link
	 */
	async downloadSharedFileContent(file: DriveFile, fileSessionKey: Uint8Array<ArrayBuffer>, authToken: Base64): Promise<DataFile> {
		const bytes = await this.blobFacade.downloadAndDecrypt(
			ArchiveDataType.DriveFile,
			createReferencingInstance(file),
			await this.blobFacade.generateTransferId(),
			{
				baseUrl: null,
				extraHeaders: {},
				queryParams: { authToken },
				suspensionBehavior: null,
				sessionKey: uint8ArrayToKey(fileSessionKey),
				accessTokenProvider: async (): Promise<Map<Id, BlobServerAccessInfo>> => {
					const result = await this.serviceExecutor.execute(DriveShareTokenService_POST, createDriveShareTokenServicePostIn({ file: file._id }), {
						extraHeaders: { authToken },
						sessionKey: null,
						baseUrl: null,
						queryParams: null,
						suspensionBehavior: null,
					})
					return new Map([[file.blobs[0].archiveId, createBlobServerAccessInfo(result.blobAccessInfo)]])
				},
			},
		)
		return {
			_type: "DataFile",
			data: bytes,
			mimeType: file.mimeType,
			name: file.name,
			size: filterInt(file.size),
		}
	}
}

import {addParamsToUrl, isSuspensionResponse, RestClient} from "../rest/RestClient"
import {CryptoFacade, encryptBytes} from "../crypto/CryptoFacade"
import {concat, decodeBase64, downcast, Mapper, neverNull, promiseMap, splitUint8ArrayInChunks, uint8ArrayToBase64,} from "@tutao/tutanota-utils"
import {LoginFacadeImpl} from "./LoginFacade"
import {ArchiveDataType, MAX_BLOB_SIZE_BYTES} from "../../common/TutanotaConstants"

import {HttpMethod, MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {assertWorkerOrNode, isApp, isDesktop} from "../../common/Env"
import type {SuspensionHandler} from "../SuspensionHandler"
import {BlobAccessTokenService, BlobService} from "../../entities/storage/Services"
import {aes128Decrypt, random, sha256Hash} from "@tutao/tutanota-crypto"
import type {FileUri, NativeFileApp} from "../../../native/common/FileApp"
import type {AesApp} from "../../../native/worker/AesApp"
import {InstanceMapper} from "../crypto/InstanceMapper"
import {Aes128Key} from "@tutao/tutanota-crypto/dist/encryption/Aes"
import {Blob} from "../../entities/sys/TypeRefs.js"
import {FileReference} from "../../common/utils/FileUtils"
import {ConnectionError, handleRestError} from "../../common/error/RestError"
import {Instance} from "../../common/EntityTypes"
import {getElementId, getEtId, getListId, isElementEntity} from "../../common/utils/EntityUtils"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {BlobReferenceTokenWrapper, createBlobReferenceTokenWrapper} from "../../entities/sys/TypeRefs.js"
import {
	BlobGetInTypeRef,
	BlobPostOut,
	BlobPostOutTypeRef,
	BlobServerAccessInfo, BlobServerUrl,
	createBlobAccessTokenPostIn, createBlobGetIn,
	createBlobReadData,
	createBlobWriteData,
	createInstanceId
} from "../../entities/storage/TypeRefs"

assertWorkerOrNode()
export const BLOB_SERVICE_REST_PATH = `/rest/${BlobService.app}/${BlobService.name.toLowerCase()}`

export type ReferenceToken = string

/**
 * The BlobFacade uploads and downloads blobs to/from the blob store.
 *
 * It requests tokens from the BlobAccessTokenService and download and uploads the blobs to/from the BlobService.
 *
 * In case of upload it is necessary to make a request to the BlobReferenceService or use the referenceTokens returned by the BlobService PUT in some other service call.
 * Otherwise the blobs will automatically be deleted after some time. It is not allowed to reference blobs manually in some instance.
 */
export class BlobFacade {
	private readonly login: LoginFacadeImpl
	private readonly serviceExecutor: IServiceExecutor
	private readonly restClient: RestClient
	private readonly suspensionHandler: SuspensionHandler
	private readonly fileApp: NativeFileApp
	private readonly aesApp: AesApp
	private readonly instanceMapper: InstanceMapper
	private readonly cryptoFacade: CryptoFacade

	constructor(
		login: LoginFacadeImpl,
		serviceExecutor: IServiceExecutor,
		restClient: RestClient,
		suspensionHandler: SuspensionHandler,
		fileApp: NativeFileApp,
		aesApp: AesApp,
		instanceMapper: InstanceMapper,
		cryptoFacade: CryptoFacade
	) {
		this.login = login
		this.serviceExecutor = serviceExecutor
		this.restClient = restClient
		this.suspensionHandler = suspensionHandler
		this.fileApp = fileApp
		this.aesApp = aesApp
		this.instanceMapper = instanceMapper
		this.cryptoFacade = cryptoFacade
	}

	/**
	 * Encrypts and uploads binary data to the blob store. The binary data is split into multiple blobs in case it
	 * is too big.
	 *
	 * @returns blobReferenceToken that must be used to reference a blobs from an instance. Only to be used once.
	 */
	async encryptAndUpload(archiveDataType: ArchiveDataType, blobData: Uint8Array, ownerGroupId: Id, sessionKey: Aes128Key): Promise<BlobReferenceTokenWrapper[]> {
		const blobAccessInfo = await this.requestWriteToken(archiveDataType, ownerGroupId)
		const chunks = splitUint8ArrayInChunks(MAX_BLOB_SIZE_BYTES, blobData)
		return promiseMap(chunks, async (chunk) => await this.encryptAndUploadChunk(chunk, blobAccessInfo, sessionKey))
	}

	/**
	 * Encrypts and uploads binary data stored as a file to the blob store. The binary data is split into multiple blobs in case it
	 * is too big.
	 *
	 * @returns blobReferenceToken that must be used to reference a blobs from an instance. Only to be used once.
	 */
	async encryptAndUploadNative(archiveDataType: ArchiveDataType, fileUri: FileUri, ownerGroupId: Id, sessionKey: Aes128Key): Promise<BlobReferenceTokenWrapper[]> {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Environment is not app or Desktop!")
		}
		const blobAccessInfo = await this.requestWriteToken(archiveDataType, ownerGroupId)
		const chunkUris = await this.fileApp.splitFile(fileUri, MAX_BLOB_SIZE_BYTES)
		return promiseMap(chunkUris, async (chunkUri) => {
			return this.encryptAndUploadNativeChunk(chunkUri, blobAccessInfo, sessionKey)
		})
	}

	/**
	 * Downloads multiple blobs, decrypts and joins them to unencrypted binary data.
	 *
	 * @param archiveDataType
	 * @param blobs to be retrieved
	 * @param referencingInstance that directly references the blobs
	 * @returns Uint8Array unencrypted binary data
	 */
	async downloadAndDecrypt(archiveDataType: ArchiveDataType, blobs: Blob[], referencingInstance: Instance): Promise<Uint8Array> {
		const blobAccessInfo = await this.requestReadToken(archiveDataType, blobs, referencingInstance)
		const sessionKey = neverNull(await this.cryptoFacade.resolveSessionKeyForInstance(referencingInstance))
		const blobData = await promiseMap(blobs, (blob) => this.downloadAndDecryptChunk(blob, blobAccessInfo, sessionKey))
		return concat(...blobData)
	}

	/**
	 * Downloads multiple blobs, decrypts and joins them to unencrypted binary data which will be stored as a file on the
	 * device.
	 *
	 * @param archiveDataType
	 * @param blobs to be retrieved
	 * @param referencingInstance that directly references the blobs
	 * @param fileName is written to the returned FileReference
	 * @param mimeType is written to the returned FileReference
	 * @returns FileReference to the unencrypted binary data
	 */
	async downloadAndDecryptNative(archiveDataType: ArchiveDataType, blobs: Blob[], referencingInstance: Instance, fileName: string, mimeType: string): Promise<FileReference> {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Environment is not app or Desktop!")
		}
		const blobAccessInfo = await this.requestReadToken(archiveDataType, blobs, referencingInstance)
		const sessionKey = neverNull(await this.cryptoFacade.resolveSessionKeyForInstance(referencingInstance))
		const decryptedChunkFileUris: FileUri[] = []
		for (const blob of blobs) {
			try {
				decryptedChunkFileUris.push(await this.downloadAndDecryptChunkNative(blob, blobAccessInfo, sessionKey))
			} catch (e) {
				for (const decryptedChunkFileUri of decryptedChunkFileUris) {
					await this.fileApp.deleteFile(decryptedChunkFileUri)
				}
				throw e
			}
		}
		// now decryptedChunkFileUris has the correct order of downloaded blobs, and we need to tell native to join them
		// check if output already exists and return cached?
		try {
			const decryptedFileUri = await this.fileApp.joinFiles(fileName, decryptedChunkFileUris)
			const size = await this.fileApp.getSize(decryptedFileUri)
			return {
				_type: "FileReference",
				name: fileName,
				mimeType,
				size,
				location: decryptedFileUri,
			}
		} finally {
			for (const tmpBlobFile of decryptedChunkFileUris) {
				await this.fileApp.deleteFile(tmpBlobFile)
			}
		}
	}

	/**
	 * Requests a token to upload blobs for the given ArchiveDataType and ownerGroup.
	 * @param archiveDataType
	 * @param ownerGroupId
	 */
	async requestWriteToken(archiveDataType: ArchiveDataType, ownerGroupId: Id): Promise<BlobServerAccessInfo> {
		const tokenRequest = createBlobAccessTokenPostIn({
			archiveDataType,
			write: createBlobWriteData({
				archiveOwnerGroup: ownerGroupId,
			}),
		})
		const {blobAccessInfo} = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest)
		return blobAccessInfo
	}

	/**
	 * Requests a token to download blobs.
	 * @param archiveDataType
	 * @param blobs all blobs need to be in one archive.
	 * @param referencingInstance the instance that references the blobs
	 */
	async requestReadToken(archiveDataType: ArchiveDataType, blobs: Blob[], referencingInstance: Instance): Promise<BlobServerAccessInfo> {
		const archiveId = this.getArchiveId(blobs)
		const instance = downcast(referencingInstance)
		let instanceListId: Id | null
		let instanceId: Id
		if (isElementEntity(instance)) {
			instanceListId = null
			instanceId = getEtId(instance)
		} else {
			instanceListId = getListId(instance)
			instanceId = getElementId(instance)
		}
		const instanceIds = [createInstanceId({instanceId})]
		const tokenRequest = createBlobAccessTokenPostIn({
			archiveDataType,
			read: createBlobReadData({
				archiveId,
				instanceListId,
				instanceIds,
			}),
		})
		const {blobAccessInfo} = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest)
		return blobAccessInfo
	}

	private async encryptAndUploadChunk(chunk: Uint8Array, blobAccessInfo: BlobServerAccessInfo, sessionKey: Aes128Key): Promise<BlobReferenceTokenWrapper> {
		const {blobAccessToken, servers} = blobAccessInfo
		const encryptedData = encryptBytes(sessionKey, chunk)
		const blobHash = uint8ArrayToBase64(sha256Hash(encryptedData).slice(0, 6))
		const queryParams = await this.createParams({blobAccessToken, blobHash})
		return this.tryServers(servers, async (serverUrl) => {
			const response = await this.restClient.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST,
				{
					queryParams,
					body: encryptedData,
					responseType: MediaType.Json,
					baseUrl: serverUrl,
				})
			return await this.parseBlobPostOutResponse(response)
		}, `can't upload to server`)
	}

	private async encryptAndUploadNativeChunk(fileUri: FileUri, blobAccessInfo: BlobServerAccessInfo, sessionKey: Aes128Key): Promise<BlobReferenceTokenWrapper> {
		const {blobAccessToken, servers} = blobAccessInfo
		const encryptedFileInfo = await this.aesApp.aesEncryptFile(sessionKey, fileUri, random.generateRandomData(16))
		const encryptedChunkUri = encryptedFileInfo.uri
		const blobHash = await this.fileApp.hashFile(encryptedChunkUri)

		const queryParams = await this.createParams({blobAccessToken, blobHash})
		return this.tryServers(servers, async (serverUrl) => {
			const serviceUrl = new URL(BLOB_SERVICE_REST_PATH, serverUrl)
			const fullUrl = addParamsToUrl(serviceUrl, queryParams)
			return await this.uploadNative(encryptedChunkUri, fullUrl);
		}, `can't upload to server from native`)
	}

	private async uploadNative(location: string, fullUrl: URL): Promise<BlobReferenceTokenWrapper> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.uploadNative(location, fullUrl))
		}
		const {
			suspensionTime,
			responseBody,
			statusCode,
			errorId,
			precondition
		} = await this.fileApp.upload(location, fullUrl.toString(), HttpMethod.POST, {}) // blobReferenceToken in the response body

		if (statusCode === 201 && responseBody != null) {
			return this.parseBlobPostOutResponse(decodeBase64("utf-8", responseBody))
		} else if (responseBody == null) {
			throw new Error("no response body")
		} else if (isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))
			return this.suspensionHandler.deferRequest(() => this.uploadNative(location, fullUrl))
		} else {
			throw handleRestError(statusCode, ` | PUT ${fullUrl.toString()} failed to natively upload blob`, errorId, precondition)
		}
	}

	private async parseBlobPostOutResponse(jsonData: string): Promise<BlobReferenceTokenWrapper> {
		const responseTypeModel = await resolveTypeReference(BlobPostOutTypeRef)
		const instance = JSON.parse(jsonData)
		const {blobReferenceToken} = await this.instanceMapper.decryptAndMapToInstance<BlobPostOut>(responseTypeModel, instance, null)
		return createBlobReferenceTokenWrapper({blobReferenceToken})
	}

	private async downloadAndDecryptChunk(blob: Blob, blobAccessInfo: BlobServerAccessInfo, sessionKey: Aes128Key): Promise<Uint8Array> {
		const {blobAccessToken, servers} = blobAccessInfo
		const {archiveId, blobId} = blob
		const queryParams = await this.createParams({blobAccessToken})
		const getData = createBlobGetIn({
			archiveId,
			blobId,
		})
		const BlobGetInTypeModel = await resolveTypeReference(BlobGetInTypeRef)
		const literalGetData = await this.instanceMapper.encryptAndMapToLiteral(BlobGetInTypeModel, getData, null)
		const body = JSON.stringify(literalGetData)

		return this.tryServers(servers, async (serverUrl) => {
			const data = await this.restClient.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, {
				queryParams,
				body,
				responseType: MediaType.Binary,
				baseUrl: serverUrl,
				noCORS: true,
			})
			return aes128Decrypt(sessionKey, data)
		}, `can't download from server `)
	}

	private async createParams(options: {blobAccessToken: string, blobHash?: string, _body?: string}) {
		const {blobAccessToken, blobHash, _body} = options
		const BlobGetInTypeModel = await resolveTypeReference(BlobGetInTypeRef)
		return Object.assign(
			{
				blobAccessToken,
				blobHash,
				_body,
				v: BlobGetInTypeModel.version,
			},
			this.login.createAuthHeaders(),
		)
	}

	private async downloadAndDecryptChunkNative(blob: Blob, blobAccessInfo: BlobServerAccessInfo, sessionKey: Aes128Key): Promise<FileUri> {
		const {blobAccessToken, servers} = blobAccessInfo
		const {archiveId, blobId} = blob
		const getData = createBlobGetIn({
			archiveId,
			blobId,
		})
		const BlobGetInTypeModel = await resolveTypeReference(BlobGetInTypeRef)
		const literalGetData = await this.instanceMapper.encryptAndMapToLiteral(BlobGetInTypeModel, getData, null)
		const _body = JSON.stringify(literalGetData)
		const queryParams = await this.createParams({blobAccessToken, _body})
		const blobFilename = blobId + ".blob"

		return this.tryServers(servers, async (serverUrl) => {
			return await this.downloadNative(serverUrl, queryParams, sessionKey, blobFilename)
		}, `can't download native from server `)
	}

	/**
	 * @return the uri of the decrypted blob
	 */
	private async downloadNative(serverUrl: string, queryParams: Dict, sessionKey: Aes128Key, fileName: string): Promise<FileUri> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.downloadNative(serverUrl, queryParams, sessionKey, fileName))
		}
		const serviceUrl = new URL(BLOB_SERVICE_REST_PATH, serverUrl)
		const url = addParamsToUrl(serviceUrl, queryParams)
		const {statusCode, encryptedFileUri, suspensionTime, errorId, precondition} = await this.fileApp.download(url.toString(), fileName, {})
		if (statusCode == 200 && encryptedFileUri != null) {
			const decryptedFileUrl = await this.aesApp.aesDecryptFile(sessionKey, encryptedFileUri)
			try {
				await this.fileApp.deleteFile(encryptedFileUri)
			} catch {
				console.log("Failed to delete encrypted file", encryptedFileUri)
			}
			return decryptedFileUrl
		} else if (isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))
			return this.suspensionHandler.deferRequest(() => this.downloadNative(serverUrl, queryParams, sessionKey, fileName))
		} else {
			throw handleRestError(statusCode, ` | GET failed to natively download attachment`, errorId, precondition)
		}
	}

	private getArchiveId(blobs: Blob[]) {
		if (blobs.length == 0) {
			throw new Error("must pass blobs")
		}
		let archiveIds = new Set(blobs.map(b => b.archiveId))
		if (archiveIds.size != 1) {
			throw new Error(`only one archive id allowed, but was ${archiveIds}`)
		}
		return blobs[0].archiveId
	}

	// VisibleForTesting
	/**
	 * Tries to run the mapper action against a list of servers. If the action resolves
	 * successfully, the result is returned. In case of an ConnectionError, the next
	 * server is tried. Throws in all other cases.
	 */
	async tryServers<T>(servers: BlobServerUrl[], mapper: Mapper<string, T>, errorMsg: string): Promise<T> {
		let index = 0
		let error: Error | null = null
		for (const server of servers) {
			try {
				return await mapper(server.url, index)
			} catch (e) {
				if (e instanceof ConnectionError) {
					console.log(`${errorMsg} ${server.url}`, e)
					error = e
				} else {
					throw e
				}
			}
			index++
		}
		throw error
	}
}
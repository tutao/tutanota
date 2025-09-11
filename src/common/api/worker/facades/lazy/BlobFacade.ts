import { addParamsToUrl, RestClient, SuspensionBehavior } from "../../rest/RestClient.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import {
	assertNonNull,
	assertNotNull,
	base64ToBase64Ext,
	concat,
	getFirstOrThrow,
	groupBy,
	isEmpty,
	mapMap,
	neverNull,
	promiseMap,
	splitUint8ArrayInChunks,
	uint8ArrayToBase64,
	uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { ArchiveDataType, CANCEL_UPLOAD_EVENT, MAX_BLOB_SIZE_BYTES } from "../../../common/TutanotaConstants.js"

import { HttpMethod, MediaType } from "../../../common/EntityFunctions.js"
import { assertWorkerOrNode, isApp, isDesktop } from "../../../common/Env.js"
import { isSuspensionResponse, SuspensionHandler } from "../../SuspensionHandler.js"
import { BlobService } from "../../../entities/storage/Services.js"
import { aesDecrypt, AesKey, sha256Hash } from "@tutao/tutanota-crypto"
import type { FileUri, NativeFileApp } from "../../../../native/common/FileApp.js"
import type { AesApp } from "../../../../native/worker/AesApp.js"
import { Blob, BlobReferenceTokenWrapper, createBlobReferenceTokenWrapper } from "../../../entities/sys/TypeRefs.js"
import { FileReference } from "../../../common/utils/FileUtils.js"
import { handleRestError } from "../../../common/error/RestError.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { BlobGetInTypeRef, BlobPostOutTypeRef, BlobServerAccessInfo, createBlobGetIn, createBlobId } from "../../../entities/storage/TypeRefs.js"
import { doBlobRequestWithRetry, tryServers } from "../../rest/EntityRestClient.js"
import { BlobAccessTokenFacade } from "../BlobAccessTokenFacade.js"
import { ServerModelUntypedInstance, SomeEntity } from "../../../common/EntityTypes.js"
import { _encryptBytes } from "../../crypto/CryptoWrapper.js"
import { BlobReferencingInstance } from "../../../common/utils/BlobUtils.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { typeModels as storageTypeModels } from "../../../entities/storage/TypeModels"
import { InstancePipeline } from "../../crypto/InstancePipeline"
import { AttributeModel } from "../../../common/AttributeModel"
import { ExposedProgressTracker } from "../../../main/ProgressTracker"
import { ChunkedUploadInfo } from "../../../common/drive/DriveTypes"
import { UploadGuid } from "../DriveFacade"

assertWorkerOrNode()
export const BLOB_SERVICE_REST_PATH = `/rest/${BlobService.app}/${BlobService.name.toLowerCase()}`
export const TAG = "BlobFacade"

export interface BlobLoadOptions {
	extraHeaders?: Dict
	suspensionBehavior?: SuspensionBehavior
	/** override origin for the request */
	baseUrl?: string
}

// FIXME: Just for testing. Remove me later!
function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * The BlobFacade uploads and downloads blobs to/from the blob store.
 *
 * It requests tokens from the BlobAccessTokenService and download and uploads the blobs to/from the BlobService.
 *
 * In case of upload it is necessary to make a request to the BlobReferenceService or use the referenceTokens returned by the BlobService PUT in some other service call.
 * Otherwise, the blobs will automatically be deleted after some time. It is not allowed to reference blobs manually in some instance.
 */
export class BlobFacade {
	constructor(
		private readonly restClient: RestClient,
		private readonly suspensionHandler: SuspensionHandler,
		private readonly fileApp: NativeFileApp,
		private readonly aesApp: AesApp,
		private readonly instancePipeline: InstancePipeline,
		private readonly cryptoFacade: CryptoFacade,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
		private readonly progressTracker: ExposedProgressTracker,
	) {}

	/**
	 * Encrypts and uploads binary data to the blob store. The binary data is split into multiple blobs in case it
	 * is too big.
	 *
	 * @returns blobReferenceToken that must be used to reference a blobs from an instance. Only to be used once.
	 */
	async encryptAndUpload(
		archiveDataType: ArchiveDataType,
		blobData: Uint8Array,
		ownerGroupId: Id,
		sessionKey: AesKey,
		onChunkUploaded?: (info: ChunkedUploadInfo) => void,
		fileId?: UploadGuid,
		onCancelListener?: EventTarget,
	): Promise<BlobReferenceTokenWrapper[]> {
		const chunks = splitUint8ArrayInChunks(MAX_BLOB_SIZE_BYTES, blobData)

		let uploadIsCanceledByUser = false
		const doCancelUpload = ({ detail }: CustomEvent) => {
			if (detail === fileId) {
				uploadIsCanceledByUser = true
			}
		}

		onCancelListener?.addEventListener(CANCEL_UPLOAD_EVENT, doCancelUpload)

		const doBlobRequest = async () => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			const receivedTokens: BlobReferenceTokenWrapper[] = []

			for (const chunk of chunks) {
				if (uploadIsCanceledByUser) {
					return []
				}
				const blobReferenceTokenWrapper = await this.encryptAndUploadChunk(chunk, blobServerAccessInfo, sessionKey)
				onChunkUploaded?.({ fileId: assertNotNull(fileId), totalBytes: blobData.length, uploadedBytes: chunk.length })
				receivedTokens.push(blobReferenceTokenWrapper)
			}
			// TODO: careful we need to also remove in case of a failure and inside a catch block or finally block
			onCancelListener?.removeEventListener(CANCEL_UPLOAD_EVENT, doCancelUpload)
			return receivedTokens
		}

		const doEvictToken = () => this.blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)

		/* TODO: Communicate retry case to UploadProgressListener so it can reset the model state / inform the user via the UI */
		return doBlobRequestWithRetry(doBlobRequest, doEvictToken)
	}

	/**
	 * Encrypts and uploads binary data to the blob store. The binary data is split into multiple blobs in case it
	 * is too big.
	 *
	 * @returns blobReferenceToken that must be used to reference a blobs from an instance. Only to be used once.
	 */
	async streamEncryptAndUpload(
		archiveDataType: ArchiveDataType,
		file: File,
		ownerGroupId: Id,
		sessionKey: AesKey,
		onChunkUploaded?: (info: ChunkedUploadInfo) => void,
		fileId?: UploadGuid,
		onCancelListener?: EventTarget,
	): Promise<BlobReferenceTokenWrapper[]> {
		let uploadIsCanceledByUser = false
		const doCancelUpload = ({ detail }: CustomEvent) => {
			console.log("Trying to cancel upload #", detail)
			if (detail === fileId) {
				console.log("upload has been cancelled by user")
				uploadIsCanceledByUser = true
			}
		}

		onCancelListener?.addEventListener(CANCEL_UPLOAD_EVENT, doCancelUpload)

		let offset = 0
		const fileSize = file.size

		// Convert chunkSize to bytes (e.g., 1024 * 1024 for 1MB)
		const chunkSizeBytes = MAX_BLOB_SIZE_BYTES

		const doBlobRequest = async (chunk: Uint8Array) => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			const blobReferenceTokenWrapper = await this.encryptAndUploadChunk(chunk, blobServerAccessInfo, sessionKey)
			onChunkUploaded?.({ fileId: assertNotNull(fileId), totalBytes: fileSize, uploadedBytes: chunk.length })
			//onCancelListener?.removeEventListener(CANCEL_UPLOAD_EVENT, doCancelUpload)
			return blobReferenceTokenWrapper
		}
		const doEvictToken = () => this.blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)
		const blobReferenceTokenWrappers: BlobReferenceTokenWrapper[] = []

		while (offset < fileSize) {
			if (uploadIsCanceledByUser) {
				console.log("UPLOAD CANCELLED, RETURNING")
				return []
			}

			// Determine the end of the current chunk (exclusive)
			const chunkEnd = Math.min(offset + chunkSizeBytes, fileSize)

			// Use File.slice() to get the chunk as a Blob
			const chunkBlob = file.slice(offset, chunkEnd)

			const chunkData = await chunkBlob.arrayBuffer()
			//
			// const decoder = new TextDecoder()
			// const str = decoder.decode(chunkData)
			// console.log(str)
			// 'chunkData' now holds the raw data for the chunk

			console.log(`Read chunk from byte ${offset} to ${chunkEnd - 1}. Size: ${chunkBlob.size} bytes.`)

			// Increment the offset for the next iteration
			offset = chunkEnd

			// Process the chunkData here (e.g., upload it to a server)

			/* TODO: Communicate retry case to UploadProgressListener so it can reset the model state / inform the user via the UI */
			const tokenWrapper = await doBlobRequestWithRetry(() => doBlobRequest(new Uint8Array(chunkData)), doEvictToken)
			blobReferenceTokenWrappers.push(tokenWrapper)
		}

		// TODO: This probably does not handle failure scenarios well...
		onCancelListener?.removeEventListener(CANCEL_UPLOAD_EVENT, doCancelUpload)

		console.log("Finished reading the file with custom chunk sizes.")
		return blobReferenceTokenWrappers
	}

	/**
	 * Encrypts and uploads binary data stored as a file to the blob store. The binary data is split into multiple blobs in case it
	 * is too big.
	 *
	 * @returns blobReferenceToken that must be used to reference a blobs from an instance. Only to be used once.
	 */
	async encryptAndUploadNative(
		archiveDataType: ArchiveDataType,
		fileUri: FileUri,
		ownerGroupId: Id,
		sessionKey: AesKey,
	): Promise<BlobReferenceTokenWrapper[]> {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Environment is not app or Desktop!")
		}
		const chunkUris = await this.fileApp.splitFile(fileUri, MAX_BLOB_SIZE_BYTES)

		const doEvictToken = () => this.blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)
		const doBlobRequest = async () => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			return promiseMap(chunkUris, async (chunkUri) => {
				return this.encryptAndUploadNativeChunk(chunkUri, blobServerAccessInfo, sessionKey)
			})
		}
		return doBlobRequestWithRetry(doBlobRequest, doEvictToken)
	}

	/**
	 * Downloads multiple blobs, decrypts and joins them to unencrypted binary data.
	 *
	 * @param archiveDataType
	 * @param referencingInstance that directly references the blobs
	 * @returns Uint8Array unencrypted binary data
	 */
	async downloadAndDecrypt(
		archiveDataType: ArchiveDataType,
		referencingInstance: BlobReferencingInstance,
		blobLoadOptions: BlobLoadOptions = {},
	): Promise<Uint8Array> {
		const sessionKey = await this.resolveSessionKey(referencingInstance.entity)
		// Currently assumes that all the blobs of the instance are in the same archive.
		// If this changes we need to group by archive and do request for each archive and then concatenate all the chunks.
		const doBlobRequest = async () => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, blobLoadOptions)
			return this.downloadAndDecryptMultipleBlobsOfArchives(referencingInstance.blobs, blobServerAccessInfo, sessionKey, blobLoadOptions)
		}
		const doEvictToken = () => this.blobAccessTokenFacade.evictReadBlobsToken(referencingInstance)

		const blobChunks = await doBlobRequestWithRetry(doBlobRequest, doEvictToken)
		return this.concatenateBlobChunks(referencingInstance, blobChunks)
	}

	private concatenateBlobChunks(referencingInstance: BlobReferencingInstance, blobChunks: Map<Id, Uint8Array>) {
		const resultSize = Array.from(blobChunks.values()).reduce((sum, blob) => blob.length + sum, 0)
		const resultBuffer = new Uint8Array(resultSize)
		let offset = 0
		for (const blob of referencingInstance.blobs) {
			const data = blobChunks.get(blob.blobId)
			assertNonNull(data, `Server did not return blob for id : ${blob.blobId}`)
			resultBuffer.set(data, offset)
			offset += data.length
		}
		return resultBuffer
	}

	/**
	 * Downloads blobs of all {@param referencingInstances}, decrypts them and joins them to unencrypted binaries.
	 * If some blobs are not found the result will contain {@code null}.
	 * @returns Map from instance id to the decrypted and concatenated contents of the referenced blobs
	 */
	async downloadAndDecryptBlobsOfMultipleInstances(
		archiveDataType: ArchiveDataType,
		referencingInstances: BlobReferencingInstance[],
		blobLoadOptions: BlobLoadOptions = {},
	): Promise<Map<Id, Uint8Array | null>> {
		// If a mail has multiple attachments, we cannot assume they are all on the same archive.
		// But all blobs of a single attachment should be in the same archive
		const instancesByArchive = groupBy(referencingInstances, (instance) => getFirstOrThrow(instance.blobs).archiveId)

		// instance id to data
		const result: Map<Id, Uint8Array | null> = new Map()

		for (const [_, instances] of instancesByArchive.entries()) {
			// request a token for all instances of the archive
			// download all blobs from all instances for this archive
			const allBlobs = instances.flatMap((instance) => instance.blobs)
			const doBlobRequest = async () => {
				const accessInfo = await this.blobAccessTokenFacade.requestReadTokenMultipleInstances(archiveDataType, instances, blobLoadOptions)
				return this.downloadBlobsOfOneArchive(allBlobs, accessInfo, blobLoadOptions)
			}
			const doEvictToken = () => {
				for (const instance of instances) {
					this.blobAccessTokenFacade.evictReadBlobsToken(instance)
				}
			}
			const encryptedBlobsOfAllInstances = await doBlobRequestWithRetry(doBlobRequest, doEvictToken)
			// sort blobs by the instance
			for (const instance of instances) {
				const decryptedData = await this.decryptInstanceData(instance, encryptedBlobsOfAllInstances)
				// return Map of instance id -> blob data
				result.set(instance.elementId, decryptedData)
			}
		}

		return result
	}

	private async decryptInstanceData(instance: BlobReferencingInstance, blobs: Map<Id, Uint8Array>): Promise<Uint8Array | null> {
		// get the key of the instance
		const sessionKey = await this.resolveSessionKey(instance.entity)
		// decrypt blobs of the instance and concatenate them
		const decryptedChunks: Uint8Array[] = []
		for (const blob of instance.blobs) {
			const encryptedChunk = blobs.get(blob.blobId)
			if (encryptedChunk == null) {
				console.log(TAG, `Did not find blob of the instance. blobId: ${blob.blobId}, instance: ${instance}`)
				return null
			}
			try {
				decryptedChunks.push(aesDecrypt(sessionKey, encryptedChunk))
			} catch (e) {
				// If decrypting one chunk of an instance fails it doesn't make sense to return any data for
				// that instance
				if (e instanceof CryptoError) {
					console.log(TAG, `Could not decrypt blob of the instance. blobId: ${blob.blobId}, instance: ${instance}`, e)
					return null
				} else {
					throw e
				}
			}
		}
		return concat(...decryptedChunks)
	}

	/**
	 * Downloads multiple blobs, decrypts and joins them to unencrypted binary data which will be stored as a file on the
	 * device.
	 *
	 * @param archiveDataType
	 * @param referencingInstance that directly references the blobs
	 * @param fileName is written to the returned FileReference
	 * @param mimeType is written to the returned FileReference
	 * @returns FileReference to the unencrypted binary data
	 */
	async downloadAndDecryptNative(
		archiveDataType: ArchiveDataType,
		referencingInstance: BlobReferencingInstance,
		fileName: string,
		mimeType: string,
	): Promise<FileReference> {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Environment is not app or Desktop!")
		}
		const sessionKey = await this.resolveSessionKey(referencingInstance.entity)
		let blobIdToDecryptedFileUri: Map<Id, FileUri> = new Map()
		const doBlobRequest = async () => {
			blobIdToDecryptedFileUri = new Map()
			const blobServerAccessInfos = await this.blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, {})

			const archiveIdToBlobs = groupBy(referencingInstance.blobs, (blob) => blob.archiveId)
			for (const [archiveId, blobs] of archiveIdToBlobs) {
				const blobServerAccessInfo = assertNotNull(blobServerAccessInfos.get(archiveId))
				for (const blob of blobs) {
					const fileUri = await this.downloadAndDecryptChunkNative(blob, blobServerAccessInfo, sessionKey).catch(async (e: Error) => {
						// cleanup every temporary file in the native part in case an error occured when downloading chun
						for (const [blobId, decryptedChunkFileUri] of blobIdToDecryptedFileUri) {
							await this.fileApp.deleteFile(decryptedChunkFileUri)
						}
						throw e
					})
					blobIdToDecryptedFileUri.set(blob.blobId, fileUri)
				}
			}
		}
		const doEvictToken = () => this.blobAccessTokenFacade.evictReadBlobsToken(referencingInstance)

		await doBlobRequestWithRetry(doBlobRequest, doEvictToken)

		// order decryptedChunkFileUris so that we can tell native to join them
		const decryptedChunkFileUris = referencingInstance.blobs.map((blob) => assertNotNull(blobIdToDecryptedFileUri.get(blob.blobId)))
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

	private async resolveSessionKey(entity: SomeEntity): Promise<AesKey> {
		return neverNull(await this.cryptoFacade.resolveSessionKey(entity))
	}

	private async encryptAndUploadChunk(chunk: Uint8Array, blobServerAccessInfo: BlobServerAccessInfo, sessionKey: AesKey): Promise<BlobReferenceTokenWrapper> {
		const encryptedData = _encryptBytes(sessionKey, chunk)
		const blobHash = uint8ArrayToBase64(sha256Hash(encryptedData).slice(0, 6))
		const queryParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, { blobHash }, BlobGetInTypeRef)

		return tryServers(
			blobServerAccessInfo.servers,
			async (serverUrl) => {
				const response = await this.restClient.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, {
					queryParams: queryParams,
					noCORS: true,
					body: encryptedData,
					responseType: MediaType.Json,
					baseUrl: serverUrl,
				})
				return await this.parseBlobPostOutResponse(response)
			},
			`can't upload to server`,
		)
	}

	private async encryptAndUploadNativeChunk(
		fileUri: FileUri,
		blobServerAccessInfo: BlobServerAccessInfo,
		sessionKey: AesKey,
	): Promise<BlobReferenceTokenWrapper> {
		const encryptedFileInfo = await this.aesApp.aesEncryptFile(sessionKey, fileUri)
		const encryptedChunkUri = encryptedFileInfo.uri
		const blobHash = await this.fileApp.hashFile(encryptedChunkUri)

		return tryServers(
			blobServerAccessInfo.servers,
			async (serverUrl) => {
				return await this.uploadNative(encryptedChunkUri, blobServerAccessInfo, serverUrl, blobHash)
			},
			`can't upload to server from native`,
		)
	}

	private async uploadNative(
		location: string,
		blobServerAccessInfo: BlobServerAccessInfo,
		serverUrl: string,
		blobHash: string,
	): Promise<BlobReferenceTokenWrapper> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.uploadNative(location, blobServerAccessInfo, serverUrl, blobHash))
		}
		const queryParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, { blobHash }, BlobGetInTypeRef)
		const serviceUrl = new URL(BLOB_SERVICE_REST_PATH, serverUrl)
		const fullUrl = addParamsToUrl(serviceUrl, queryParams)
		const { suspensionTime, responseBody, statusCode, errorId, precondition } = await this.fileApp.upload(
			location,
			fullUrl.toString(),
			HttpMethod.POST,
			this.createStorageAppHeaders(),
		) // blobReferenceToken in the response body

		if (statusCode === 201 && responseBody != null) {
			return this.parseBlobPostOutResponse(uint8ArrayToString("utf-8", responseBody))
		} else if (responseBody == null) {
			throw new Error("no response body")
		} else if (isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime), serviceUrl)
			return this.suspensionHandler.deferRequest(() => this.uploadNative(location, blobServerAccessInfo, serverUrl, blobHash))
		} else {
			throw handleRestError(statusCode, ` | ${HttpMethod.POST} ${fullUrl.toString()} failed to natively upload blob`, errorId, precondition)
		}
	}

	// Visible for testing
	public async parseBlobPostOutResponse(jsonData: string): Promise<BlobReferenceTokenWrapper> {
		const instance = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(JSON.parse(jsonData))
		const { blobReferenceToken } = await this.instancePipeline.decryptAndMap(BlobPostOutTypeRef, instance, null)
		// is null in case of post multiple to the BlobService, currently only supported in the rust-sdk
		// post single always has a valid blobRefernceToken with cardinality one.
		if (blobReferenceToken == null) {
			throw new ProgrammingError("empty blobReferenceToken not allowed for post single blob")
		}
		return createBlobReferenceTokenWrapper({ blobReferenceToken })
	}

	private async downloadAndDecryptMultipleBlobsOfArchives(
		blobs: readonly Blob[],
		blobServerAccessInfos: Map<Id, BlobServerAccessInfo>,
		sessionKey: AesKey,
		blobLoadOptions: BlobLoadOptions,
	): Promise<Map<Id, Uint8Array>> {
		const archiveIdToBlobs = groupBy(blobs, (blob) => blob.archiveId)
		let mapWithEncryptedBlobs: Map<Id, Uint8Array> = new Map()
		for (const [archiveId, blobs] of archiveIdToBlobs) {
			const blobServerAccessInfo = assertNotNull(blobServerAccessInfos.get(archiveId))
			const mapWithEncryptedBlobsOfArchive = await this.downloadBlobsOfOneArchive(blobs, blobServerAccessInfo, blobLoadOptions)
			for (const [k, v] of mapWithEncryptedBlobsOfArchive) {
				mapWithEncryptedBlobs.set(k, v)
			}
		}
		return mapMap(mapWithEncryptedBlobs, (blob) => aesDecrypt(sessionKey, blob))
	}

	/**
	 * Download blobs of a single archive in a single request
	 * @return map from blob id to the data
	 */
	private async downloadBlobsOfOneArchive(
		blobs: readonly Blob[],
		blobServerAccessInfo: BlobServerAccessInfo,
		blobLoadOptions: BlobLoadOptions,
	): Promise<Map<Id, Uint8Array>> {
		if (isEmpty(blobs)) {
			throw new ProgrammingError("Blobs are empty")
		}
		const archiveId = getFirstOrThrow(blobs).archiveId
		if (blobs.some((blob) => blob.archiveId !== archiveId)) {
			throw new ProgrammingError("Must only request blobs of the same archive together")
		}

		let blobResponse: Map<Id, Uint8Array> = new Map()
		// All the blob ids are included in the server query, so if more than 100 blobs are requested at
		// the same time a 414 Request-URI Too Long Error will be received
		const BLOB_PROCESS_NUM = 100
		let blobsProcessed = 0

		while (blobs.length > blobsProcessed) {
			const processBlobs = blobs.slice(blobsProcessed, blobsProcessed + BLOB_PROCESS_NUM)

			const getData = createBlobGetIn({
				archiveId,
				blobId: null,
				blobIds: processBlobs.map(({ blobId }) => createBlobId({ blobId: blobId })),
			})
			const untypedInstance = await this.instancePipeline.mapAndEncrypt(BlobGetInTypeRef, getData, null)
			const body = JSON.stringify(untypedInstance)
			const queryParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, {}, BlobGetInTypeRef)
			const concatBinaryData = await tryServers(
				blobServerAccessInfo.servers,
				async (serverUrl) => {
					return await this.restClient.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, {
						queryParams: queryParams,
						body,
						responseType: MediaType.Binary,
						baseUrl: serverUrl,
						noCORS: true,
						headers: blobLoadOptions.extraHeaders,
						suspensionBehavior: blobLoadOptions.suspensionBehavior,
					})
				},
				`can't download from server `,
			)

			blobResponse = new Map([...blobResponse, ...parseMultipleBlobsResponse(concatBinaryData)])

			blobsProcessed += BLOB_PROCESS_NUM
		}

		return blobResponse
	}

	private async downloadAndDecryptChunkNative(blob: Blob, blobServerAccessInfo: BlobServerAccessInfo, sessionKey: AesKey): Promise<FileUri> {
		const { archiveId, blobId } = blob
		const getData = createBlobGetIn({
			archiveId,
			blobId,
			blobIds: [],
		})
		const untypedInstance = await this.instancePipeline.mapAndEncrypt(BlobGetInTypeRef, getData, null)
		const _body = JSON.stringify(untypedInstance)

		const blobFilename = blobId + ".blob"

		return tryServers(
			blobServerAccessInfo.servers,
			async (serverUrl) => {
				return await this.downloadNative(serverUrl, blobServerAccessInfo, sessionKey, blobFilename, { _body })
			},
			`can't download native from server `,
		)
	}

	/**
	 * @return the uri of the decrypted blob
	 */
	private async downloadNative(
		serverUrl: string,
		blobServerAccessInfo: BlobServerAccessInfo,
		sessionKey: AesKey,
		fileName: string,
		additionalParams: Dict,
	): Promise<FileUri> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.downloadNative(serverUrl, blobServerAccessInfo, sessionKey, fileName, additionalParams))
		}
		const serviceUrl = new URL(BLOB_SERVICE_REST_PATH, serverUrl)
		const url = addParamsToUrl(serviceUrl, await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, additionalParams, BlobGetInTypeRef))
		const { statusCode, encryptedFileUri, suspensionTime, errorId, precondition } = await this.fileApp.download(
			url.toString(),
			fileName,
			this.createStorageAppHeaders(),
		)
		if (statusCode === 200 && encryptedFileUri != null) {
			const decryptedFileUrl = await this.aesApp.aesDecryptFile(sessionKey, encryptedFileUri)
			try {
				await this.fileApp.deleteFile(encryptedFileUri)
			} catch {
				console.log("Failed to delete encrypted file", encryptedFileUri)
			}
			return decryptedFileUrl
		} else if (isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime), serviceUrl)
			return this.suspensionHandler.deferRequest(() => this.downloadNative(serverUrl, blobServerAccessInfo, sessionKey, fileName, additionalParams))
		} else {
			throw handleRestError(statusCode, ` | ${HttpMethod.GET} failed to natively download attachment`, errorId, precondition)
		}
	}

	private createStorageAppHeaders() {
		let headers: Record<string, string> = {
			v: String(storageTypeModels[BlobGetInTypeRef.typeId].version),
			cv: env.versionNumber,
		}
		if (env.networkDebugging) {
			headers["Network-Debugging"] = "enable-network-debugging"
		}
		return headers
	}
}

/**
 * Deserializes a list of BlobWrappers that are in the following binary format
 * element [ #blobs ] [ blobId ] [ blobHash ] [blobSize] [blob]     [ . . . ]    [ blobNId ] [ blobNHash ] [blobNSize] [blobN]
 * bytes     4          9          6           4          blobSize                  9          6            4           blobSize
 *
 * @return a map from blobId to the binary data
 */
export function parseMultipleBlobsResponse(concatBinaryData: Uint8Array): Map<Id, Uint8Array> {
	const dataView = new DataView(concatBinaryData.buffer)
	const result = new Map<Id, Uint8Array>()
	const blobCount = dataView.getInt32(0)
	if (blobCount === 0) {
		return result
	}
	if (blobCount < 0) {
		throw new Error(`Invalid blob count: ${blobCount}`)
	}
	let offset = 4
	while (offset < concatBinaryData.length) {
		const blobIdBytes = concatBinaryData.slice(offset, offset + 9)
		const blobId = base64ToBase64Ext(uint8ArrayToBase64(blobIdBytes))

		const blobSize = dataView.getInt32(offset + 15)
		const dataStartOffset = offset + 19
		if (blobSize < 0 || dataStartOffset + blobSize > concatBinaryData.length) {
			throw new Error(`Invalid blob size: ${blobSize}. Remaining length: ${concatBinaryData.length - dataStartOffset}`)
		}
		const contents = concatBinaryData.slice(dataStartOffset, dataStartOffset + blobSize)
		result.set(blobId, contents)
		offset = dataStartOffset + blobSize
	}
	if (blobCount !== result.size) {
		throw new Error(`Parsed wrong number of blobs: ${blobCount}. Expected: ${result.size}`)
	}
	return result
}

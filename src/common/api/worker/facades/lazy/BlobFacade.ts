import { addParamsToUrl, HttpMethod, MAX_BLOB_SIZE_BYTES, MediaType, RestClient, restError, restSuspension } from "@tutao/rest-client"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import {
	assertNonNull,
	assertNotNull,
	base64ToBase64Ext,
	concat,
	filterInt,
	getFirstOrThrow,
	groupBy,
	isEmpty,
	neverNull,
	noOp,
	promiseMap,
	splitUint8ArrayInChunks,
	uint8ArrayToBase64,
	uint8ArrayToString,
} from "@tutao/utils"
import { ArchiveDataType, assertWorkerOrNode, CANCEL_UPLOAD_EVENT, isApp, isDesktop, ProgrammingError } from "@tutao/app-env"
import { AttributeModel, ServerModelUntypedInstance, SomeEntity, storageServices, storageTypeModels, storageTypeRefs, sysTypeRefs } from "@tutao/typerefs"
import { _encryptBytes, aesDecrypt, AesKey, asyncDecryptBytes, sha256Hash } from "@tutao/crypto"
import type { FileUri, NativeFileApp } from "../../../../native/common/FileApp.js"
import type { AesApp } from "../../../../native/worker/AesApp.js"
import { FileReference, splitFileIntoChunks } from "../../../common/utils/FileUtils.js"
import { doBlobRequestWithRetry, tryServers } from "../../rest/EntityRestClient.js"
import { BlobAccessTokenFacade } from "../BlobAccessTokenFacade.js"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { BlobReferencingInstance } from "../../../common/utils/BlobUtils.js"
import { CryptoError } from "@tutao/crypto/error"
import { TransferId, UploadProgressInfo } from "../../../common/drive/DriveTypes"
import { CancelledError } from "../../../common/error/CancelledError"
import { TransferProgressDispatcher } from "../../../main/TransferProgressDispatcher"

assertWorkerOrNode()
export const BLOB_SERVICE_REST_PATH = `/rest/${storageServices.BlobService.app}/${storageServices.BlobService.name.toLowerCase()}`
export const TAG = "BlobFacade"

export interface BlobLoadOptions {
	extraHeaders?: Dict
	suspensionBehavior?: restSuspension.SuspensionBehavior
	/** override origin for the request */
	baseUrl?: string
}

interface FileDownloadState {
	transferId: TransferId
	referencingInstance: BlobReferencingInstance
	/** Map from blob id to the total downloaded bytes for that blob. */
	bytesDownloadedPerBlob: Map<Id, number>
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
	/**
	 * Map from blob id to file download state. If file is split between multiple blobs then multiple blobs will point to the same file state.
	 * <br>
	 * Native download facades do not operate on instances, for them each blob is a separate file so we receive update for a blob and we have to
	 * coordinate the overall download progress for the file. This map is for looking up file state by blob id.
	 */
	private readonly nativeDownloadProgressState: Map<Id, FileDownloadState> = new Map()
	private readonly abortControllers: Map<TransferId, AbortController> = new Map()
	// this will not work in multi-window scenario
	private latestTransferId: number = 0

	async generateTransferId(): Promise<TransferId> {
		return String(this.latestTransferId++) as TransferId
	}

	constructor(
		private readonly restClient: RestClient,
		private readonly suspensionHandler: restSuspension.SuspensionHandler,
		private readonly fileApp: NativeFileApp,
		private readonly aesApp: AesApp,
		private readonly instancePipeline: InstancePipeline,
		private readonly cryptoFacade: CryptoFacade,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
		private readonly progressDispatcher: TransferProgressDispatcher,
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
		transferId: TransferId,
		onChunkUploaded?: (info: UploadProgressInfo) => void,
		onCancelListener?: EventTarget,
	): Promise<sysTypeRefs.BlobReferenceTokenWrapper[]> {
		const chunks = splitUint8ArrayInChunks(MAX_BLOB_SIZE_BYTES, blobData)

		let uploadIsCanceledByUser = false
		const doCancelUpload = ({ detail }: CustomEvent) => {
			if (detail === transferId) {
				uploadIsCanceledByUser = true
			}
		}

		onCancelListener?.addEventListener(CANCEL_UPLOAD_EVENT, doCancelUpload)

		const doBlobRequest = async () => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			const receivedTokens: sysTypeRefs.BlobReferenceTokenWrapper[] = []

			for (const chunk of chunks) {
				if (uploadIsCanceledByUser) {
					return []
				}
				const blobReferenceTokenWrapper = await this.encryptAndUploadChunk(chunk, blobServerAccessInfo, sessionKey)
				onChunkUploaded?.({ transferId, totalBytes: blobData.length, uploadedBytes: chunk.length })
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
	async *streamEncryptAndUpload(
		archiveDataType: ArchiveDataType,
		file: File,
		ownerGroupId: Id,
		sessionKey: AesKey,
		transferId: TransferId,
		abortSignal: AbortSignal,
	): AsyncGenerator<
		{
			uploadedBytes: number
			totalBytes: number
			referenceTokenWrapper: sysTypeRefs.BlobReferenceTokenWrapper
		},
		void,
		void
	> {
		const fileSize = file.size

		// Convert chunkSize to bytes (e.g., 1024 * 1024 for 1MB)
		const chunkSizeBytes = MAX_BLOB_SIZE_BYTES
		let bytesUploadedSoFar = 0

		const doBlobRequest = async (chunk: Uint8Array) => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			return await this.encryptAndUploadChunk(chunk, blobServerAccessInfo, sessionKey, (bytes) => {
				this.progressDispatcher.onChunkUploaded({
					transferId,
					uploadedBytes: bytesUploadedSoFar + bytes,
					totalBytes: file.size,
				})
			})
		}
		const doEvictToken = () => this.blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)
		for (const chunkBlob of splitFileIntoChunks(chunkSizeBytes, file)) {
			const chunkData = await chunkBlob.arrayBuffer()
			// Process the chunkData here (e.g., upload it to a server)
			const tokenWrapper = await doBlobRequestWithRetry(async () => {
				if (abortSignal.aborted) {
					throw new CancelledError("Upload aborted")
				}
				const response = await doBlobRequest(new Uint8Array(chunkData))
				bytesUploadedSoFar += chunkData.byteLength
				return response
			}, doEvictToken)
			yield { totalBytes: fileSize, uploadedBytes: chunkData.byteLength, referenceTokenWrapper: tokenWrapper }
		}
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
	): Promise<sysTypeRefs.BlobReferenceTokenWrapper[]> {
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
	 * @return unencrypted binary data
	 */
	async downloadAndDecrypt(
		archiveDataType: ArchiveDataType,
		referencingInstance: BlobReferencingInstance,
		transferId: TransferId,
		blobLoadOptions: BlobLoadOptions = {},
	): Promise<Uint8Array> {
		const sessionKey = await this.resolveSessionKey(referencingInstance.entity)

		let bytesDownloadedSoFar = 0
		const onProgress = (bytes: number) => {
			bytesDownloadedSoFar += bytes
			this.progressDispatcher.onChunkDownloaded({ transferId, downloadedBytes: bytes })
		}

		const controller = new AbortController()
		this.abortControllers.set(transferId, controller)
		try {
			// Currently assumes that all the blobs of the instance are in the same archive.
			// If this changes we need to group by archive and do request for each archive and then concatenate all the chunks.
			const doBlobRequest = async () => {
				controller.signal.throwIfAborted()
				const blobServerAccessInfo = await this.blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, blobLoadOptions)
				return this.downloadAndDecryptMultipleBlobsOfArchives(
					referencingInstance.blobs,
					blobServerAccessInfo,
					sessionKey,
					blobLoadOptions,
					onProgress,
					controller.signal,
				)
			}
			const doEvictToken = () => this.blobAccessTokenFacade.evictReadBlobsToken(referencingInstance)

			const blobChunks = await doBlobRequestWithRetry(doBlobRequest, doEvictToken)
			controller.signal.throwIfAborted()
			return this.concatenateBlobChunks(referencingInstance, blobChunks)
		} finally {
			this.abortControllers.delete(transferId)
		}
	}

	async abortDownload(transferId: TransferId): Promise<void> {
		this.abortControllers.get(transferId)?.abort(new CancelledError("Download canceled"))

		for (const state of this.nativeDownloadProgressState.values()) {
			if (state.transferId === transferId) {
				for (const blob of state.referencingInstance.blobs) {
					await this.fileApp.abortDownload(blob.blobId)
				}
			}
		}
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
				return this.downloadBlobsOfOneArchive(allBlobs, accessInfo, blobLoadOptions, noOp)
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
		transferId: TransferId,
	): Promise<FileReference> {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Environment is not app or Desktop!")
		}
		const sessionKey = await this.resolveSessionKey(referencingInstance.entity)
		let blobIdToDecryptedFileUri: Map<Id, FileUri> = new Map()
		// prepare download state that will be updated when native facades report download progress
		const fileDownloadState: FileDownloadState = {
			transferId,
			referencingInstance,
			bytesDownloadedPerBlob: new Map(referencingInstance.blobs.map((blob) => [blob.blobId, 0])),
		}
		for (const blob of referencingInstance.blobs) {
			this.nativeDownloadProgressState.set(blob.blobId, fileDownloadState)
		}

		const controller = new AbortController()
		this.abortControllers.set(transferId, controller)
		try {
			const doBlobRequest = async () => {
				controller.signal.throwIfAborted()

				blobIdToDecryptedFileUri = new Map()
				const blobServerAccessInfos = await this.blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, {})

				try {
					const archiveIdToBlobs = groupBy(referencingInstance.blobs, (blob) => blob.archiveId)
					for (const [archiveId, blobs] of archiveIdToBlobs) {
						const blobServerAccessInfo = assertNotNull(blobServerAccessInfos.get(archiveId))
						for (const blob of blobs) {
							controller.signal.throwIfAborted()
							const fileUri = await this.downloadAndDecryptChunkNative(blob, blobServerAccessInfo, sessionKey).catch(async (e: Error) => {
								// cleanup every temporary file in the native part in case an error occurred when downloading chun
								for (const [blobId, decryptedChunkFileUri] of blobIdToDecryptedFileUri) {
									await this.fileApp.deleteFile(decryptedChunkFileUri)
								}
								throw e
							})
							blobIdToDecryptedFileUri.set(blob.blobId, fileUri)
							// after blob is downloaded set the progress to the overall blob size. This is safeguard if the last
							// chunk is not reported.
							fileDownloadState.bytesDownloadedPerBlob.set(blob.blobId, filterInt(blob.size))
						}
					}
				} finally {
					for (const blob of referencingInstance.blobs) {
						this.nativeDownloadProgressState.delete(blob.blobId)
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
		} finally {
			this.abortControllers.delete(transferId)
		}
	}

	private async resolveSessionKey(entity: SomeEntity): Promise<AesKey> {
		return neverNull(await this.cryptoFacade.resolveSessionKey(entity))
	}

	private async encryptAndUploadChunk(
		chunk: Uint8Array,
		blobServerAccessInfo: storageTypeRefs.BlobServerAccessInfo,
		sessionKey: AesKey,
		onProgress?: (bytes: number) => unknown,
	): Promise<sysTypeRefs.BlobReferenceTokenWrapper> {
		const encryptedData = _encryptBytes(sessionKey, chunk)
		const blobHash = uint8ArrayToBase64(sha256Hash(encryptedData).slice(0, 6))
		const queryParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, { blobHash }, storageTypeRefs.BlobGetInTypeRef)

		return tryServers(
			blobServerAccessInfo.servers,
			async (serverUrl) => {
				const response = await this.restClient.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, {
					queryParams: queryParams,
					// noCORS tries to avoid all the things that make the request not a "Simple CORS request". Adding
					// uploading listeners is one of this. In this case though we really do want an upload listener so
					// we sacrifice our CORS purity for functionality.
					noCORS: onProgress == null,
					body: encryptedData,
					responseType: MediaType.Json,
					baseUrl: serverUrl,
					progressListener: {
						download() {},
						upload(_, bytes) {
							onProgress?.(bytes)
						},
					},
				})
				return await this.parseBlobPostOutResponse(response)
			},
			`can't upload to server`,
		)
	}

	private async encryptAndUploadNativeChunk(
		fileUri: FileUri,
		blobServerAccessInfo: storageTypeRefs.BlobServerAccessInfo,
		sessionKey: AesKey,
	): Promise<sysTypeRefs.BlobReferenceTokenWrapper> {
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
		blobServerAccessInfo: storageTypeRefs.BlobServerAccessInfo,
		serverUrl: string,
		blobHash: string,
	): Promise<sysTypeRefs.BlobReferenceTokenWrapper> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.uploadNative(location, blobServerAccessInfo, serverUrl, blobHash))
		}
		const queryParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, { blobHash }, storageTypeRefs.BlobGetInTypeRef)
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
		} else if (restSuspension.isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime), serviceUrl)
			return this.suspensionHandler.deferRequest(() => this.uploadNative(location, blobServerAccessInfo, serverUrl, blobHash))
		} else {
			throw restError.handleRestError(statusCode, ` | ${HttpMethod.POST} ${fullUrl.toString()} failed to natively upload blob`, errorId, precondition)
		}
	}

	// Visible for testing
	public async parseBlobPostOutResponse(jsonData: string): Promise<sysTypeRefs.BlobReferenceTokenWrapper> {
		const instance = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(JSON.parse(jsonData))
		const { blobReferenceToken } = await this.instancePipeline.decryptAndMap(storageTypeRefs.BlobPostOutTypeRef, instance, null)
		// is null in case of post multiple to the BlobService, currently only supported in the rust-sdk
		// post single always has a valid blobRefernceToken with cardinality one.
		if (blobReferenceToken == null) {
			throw new ProgrammingError("empty blobReferenceToken not allowed for post single blob")
		}
		return sysTypeRefs.createBlobReferenceTokenWrapper({ blobReferenceToken })
	}

	private async downloadAndDecryptMultipleBlobsOfArchives(
		blobs: readonly sysTypeRefs.Blob[],
		blobServerAccessInfos: Map<Id, storageTypeRefs.BlobServerAccessInfo>,
		sessionKey: AesKey,
		blobLoadOptions: BlobLoadOptions,
		onProgress: (bytes: number) => unknown,
		abortSignal?: AbortSignal,
	): Promise<Map<Id, Uint8Array>> {
		const archiveIdToBlobs = groupBy(blobs, (blob) => blob.archiveId)
		let mapWithEncryptedBlobs: Map<Id, Uint8Array> = new Map()
		for (const [archiveId, archiveBlobs] of archiveIdToBlobs) {
			const blobServerAccessInfo = assertNotNull(blobServerAccessInfos.get(archiveId))
			const mapWithEncryptedBlobsOfArchive = await this.downloadBlobsOfOneArchive(
				archiveBlobs,
				blobServerAccessInfo,
				blobLoadOptions,
				onProgress,
				abortSignal,
			)
			for (const [k, v] of mapWithEncryptedBlobsOfArchive) {
				mapWithEncryptedBlobs.set(k, v)
			}
		}
		const processedBlobEntries = await promiseMap(Array.from(mapWithEncryptedBlobs.entries()), async ([blobId, blob]) => {
			abortSignal?.throwIfAborted()
			return [blobId, await asyncDecryptBytes(sessionKey, blob)] as const
		})
		return new Map(processedBlobEntries)
	}

	/**
	 * Download blobs of a single archive in a single request
	 * @return map from blob id to the data
	 */
	private async downloadBlobsOfOneArchive(
		blobs: readonly sysTypeRefs.Blob[],
		blobServerAccessInfo: storageTypeRefs.BlobServerAccessInfo,
		blobLoadOptions: BlobLoadOptions,
		onProgress: (bytes: number) => unknown,
		abortSignal?: AbortSignal,
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

			const getData = storageTypeRefs.createBlobGetIn({
				archiveId,
				blobId: null,
				blobIds: processBlobs.map(({ blobId }) => storageTypeRefs.createBlobId({ blobId: blobId })),
			})
			const untypedInstance = await this.instancePipeline.mapAndEncrypt(storageTypeRefs.BlobGetInTypeRef, getData, null)
			const body = JSON.stringify(untypedInstance)
			const queryParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, {}, storageTypeRefs.BlobGetInTypeRef)
			const concatBinaryData = await tryServers(
				blobServerAccessInfo.servers,
				async (serverUrl) => {
					const response = await this.restClient.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, {
						queryParams: queryParams,
						body,
						responseType: MediaType.Binary,
						baseUrl: serverUrl,
						noCORS: true,
						headers: blobLoadOptions.extraHeaders,
						suspensionBehavior: blobLoadOptions.suspensionBehavior,
						progressListener: {
							upload(_: number) {},
							download(_: number, bytes: number) {
								onProgress(bytes)
							},
						},
						abortSignal,
					})
					return response
				},
				`can't download from server `,
			)

			blobResponse = new Map([...blobResponse, ...parseMultipleBlobsResponse(concatBinaryData)])

			blobsProcessed += BLOB_PROCESS_NUM
		}

		return blobResponse
	}

	private async downloadAndDecryptChunkNative(
		blob: sysTypeRefs.Blob,
		blobServerAccessInfo: storageTypeRefs.BlobServerAccessInfo,
		sessionKey: AesKey,
	): Promise<FileUri> {
		const { archiveId, blobId } = blob
		const getData = storageTypeRefs.createBlobGetIn({
			archiveId,
			blobId,
			blobIds: [],
		})
		const untypedInstance = await this.instancePipeline.mapAndEncrypt(storageTypeRefs.BlobGetInTypeRef, getData, null)
		const _body = JSON.stringify(untypedInstance)

		const blobFilename = blobId + ".blob"

		return tryServers(
			blobServerAccessInfo.servers,
			async (serverUrl) => {
				return await this.downloadNative(serverUrl, blobServerAccessInfo, sessionKey, blobFilename, { _body }, blob.blobId)
			},
			`can't download native from server `,
		)
	}

	/**
	 * @return the uri of the decrypted blob
	 */
	private async downloadNative(
		serverUrl: string,
		blobServerAccessInfo: storageTypeRefs.BlobServerAccessInfo,
		sessionKey: AesKey,
		fileName: string,
		additionalParams: Dict,
		blobId: Id,
	): Promise<FileUri> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() =>
				this.downloadNative(serverUrl, blobServerAccessInfo, sessionKey, fileName, additionalParams, blobId),
			)
		}
		const serviceUrl = new URL(BLOB_SERVICE_REST_PATH, serverUrl)
		const url = addParamsToUrl(
			serviceUrl,
			await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, additionalParams, storageTypeRefs.BlobGetInTypeRef),
		)
		const { statusCode, encryptedFileUri, suspensionTime, errorId, precondition } = await this.fileApp.download(
			url.toString(),
			fileName,
			this.createStorageAppHeaders(),
			blobId,
		)
		if (statusCode === 200 && encryptedFileUri != null) {
			const decryptedFileUrl = await this.aesApp.aesDecryptFile(sessionKey, encryptedFileUri)
			try {
				await this.fileApp.deleteFile(encryptedFileUri)
			} catch {
				console.log("Failed to delete encrypted file", encryptedFileUri)
			}
			return decryptedFileUrl
		} else if (restSuspension.isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime), serviceUrl)
			return this.suspensionHandler.deferRequest(() =>
				this.downloadNative(serverUrl, blobServerAccessInfo, sessionKey, fileName, additionalParams, blobId),
			)
		} else {
			throw restError.handleRestError(statusCode, ` | ${HttpMethod.GET} failed to natively download attachment`, errorId, precondition)
		}
	}

	private createStorageAppHeaders() {
		let headers: Record<string, string> = {
			v: String(storageTypeModels[storageTypeRefs.BlobGetInTypeRef.typeId].version),
			cv: env.versionNumber,
		}
		if (env.networkDebugging) {
			headers["Network-Debugging"] = "enable-network-debugging"
		}
		return headers
	}

	/** called from native to report a progress for a single blob download */
	async nativeDownloadProgress(blobId: string, bytes: number) {
		const state = this.nativeDownloadProgressState.get(blobId)
		if (state == null) return
		state?.bytesDownloadedPerBlob.set(blobId, bytes)
		const downloadedBytes = Array.from(state.bytesDownloadedPerBlob.values()).reduce((acc, v) => acc + v, 0)
		// report downstream on the overall transfer progress
		this.progressDispatcher.onChunkDownloaded({
			transferId: state.transferId,
			downloadedBytes: downloadedBytes,
		})
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

// @flow
import {_TypeModel as FileDataDataGetTypModel, createFileDataDataGet} from "../../entities/tutanota/FileDataDataGet"
import {addParamsToUrl, isSuspensionResponse, RestClient} from "../rest/RestClient"
import {encryptAndMapToLiteral, encryptBytes, resolveSessionKey} from "../crypto/CryptoFacade"
import {aes128Decrypt} from "../crypto/Aes"
import type {File as TutanotaFile} from "../../entities/tutanota/File"
import {_TypeModel as FileTypeModel} from "../../entities/tutanota/File"
import {filterInt, neverNull} from "../../common/utils/Utils"
import type {LoginFacade} from "./LoginFacade"
import {createFileDataDataPost} from "../../entities/tutanota/FileDataDataPost"
import {_service} from "../rest/ServiceRestClient"
import {FileDataReturnPostTypeRef} from "../../entities/tutanota/FileDataReturnPost"
import {GroupType} from "../../common/TutanotaConstants"
import {random} from "../crypto/Randomizer"
import {_TypeModel as FileDataDataReturnTypeModel} from "../../entities/tutanota/FileDataDataReturn"
import {HttpMethod, MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {assertWorkerOrNode, getHttpOrigin, Mode} from "../../common/Env"
import {aesDecryptFile, aesEncryptFile} from "../../../native/worker/AesApp"
import {handleRestError} from "../../common/error/RestError"
import {fileApp} from "../../../native/common/FileApp"
import {convertToDataFile} from "../../common/DataFile"
import type {SuspensionHandler} from "../SuspensionHandler"
import {StorageService} from "../../entities/storage/Services"
import {uint8ArrayToKey} from "../crypto/CryptoUtils"
import {hash} from "../crypto/Sha256"
import {createBlobId} from "../../entities/sys/BlobId"
import {serviceRequest} from "../EntityWorker"
import {createBlobAccessTokenData} from "../../entities/storage/BlobAccessTokenData"
import {BlobAccessTokenReturnTypeRef} from "../../entities/storage/BlobAccessTokenReturn"
import type {BlobAccessInfo} from "../../entities/sys/BlobAccessInfo"
import {_TypeModel as BlobDataGetTypeModel, createBlobDataGet} from "../../entities/storage/BlobDataGet"
import {createBlobWriteData} from "../../entities/storage/BlobWriteData"
import {createTypeInfo} from "../../entities/sys/TypeInfo"
import {uint8ArrayToBase64} from "../../common/utils/Encoding"
import {TypeRef} from "../../common/utils/TypeRef"
import type {TypeModel} from "../../common/EntityTypes"

assertWorkerOrNode()

const REST_PATH = "/rest/tutanota/filedataservice"
const STORAGE_REST_PATH = `/rest/storage/${StorageService.BlobService}`

export class FileFacade {
	_login: LoginFacade;
	_restClient: RestClient;
	_suspensionHandler: SuspensionHandler;

	constructor(login: LoginFacade, restClient: RestClient, suspensionHandler: SuspensionHandler) {
		this._login = login
		this._restClient = restClient
		this._suspensionHandler = suspensionHandler
	}

	downloadFileContent(file: TutanotaFile): Promise<DataFile> {
		let requestData = createFileDataDataGet()
		requestData.file = file._id
		requestData.base64 = false

		return resolveSessionKey(FileTypeModel, file).then(sessionKey => {
			return encryptAndMapToLiteral(FileDataDataGetTypModel, requestData, null).then(entityToSend => {
				let headers = this._login.createAuthHeaders()
				headers['v'] = FileDataDataGetTypModel.version
				let body = JSON.stringify(entityToSend)
				return this._restClient.request(REST_PATH, HttpMethod.GET, {}, headers, body, MediaType.Binary)
				           .then(data => {
					           return convertToDataFile(file, aes128Decrypt(neverNull(sessionKey), data))
				           })
			})
		})
	}

	downloadFileContentNative(file: TutanotaFile): Promise<FileReference> {
		if (![Mode.App, Mode.Desktop].includes(env.mode)) {
			return Promise.reject("Environment is not app or Desktop!")
		}

		if (this._suspensionHandler.isSuspended()) {
			return this._suspensionHandler.deferRequest(() => this.downloadFileContentNative(file))
		}

		let requestData = createFileDataDataGet()
		requestData.file = file._id
		requestData.base64 = false

		return resolveSessionKey(FileTypeModel, file).then(sessionKey => {
			return encryptAndMapToLiteral(FileDataDataGetTypModel, requestData, null).then(entityToSend => {
				let headers = this._login.createAuthHeaders()
				headers['v'] = FileDataDataGetTypModel.version
				let body = JSON.stringify(entityToSend)
				let queryParams = {'_body': body}
				let url = addParamsToUrl(new URL(getHttpOrigin() + REST_PATH), queryParams)

				return fileApp.download(url.toString(), file.name, headers).then(({
					                                                                  statusCode,
					                                                                  encryptedFileUri,
					                                                                  errorId,
					                                                                  precondition,
					                                                                  suspensionTime
				                                                                  }) => {
					let response;
					if (statusCode === 200 && encryptedFileUri != null) {
						response = aesDecryptFile(neverNull(sessionKey), encryptedFileUri).then(decryptedFileUrl => {
							const mimeType = file.mimeType == null ? MediaType.Binary : file.mimeType
							return {
								_type: 'FileReference',
								name: file.name,
								mimeType,
								location: decryptedFileUrl,
								size: filterInt(file.size)
							}
						})
					} else if (suspensionTime && isSuspensionResponse(statusCode, suspensionTime)) {
						this._suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))
						response = this._suspensionHandler.deferRequest(() => this.downloadFileContentNative(file))
					} else {
						response = Promise.reject(handleRestError(statusCode, ` | GET ${url.toString()} failed to natively download attachment`, errorId, precondition))
					}

					return response.finally(() => encryptedFileUri != null && fileApp.deleteFile(encryptedFileUri)
					                                                                 .catch(() => console.log("Failed to delete encrypted file", encryptedFileUri)))
				})
			})
		})
	}

	uploadFileData(dataFile: DataFile, sessionKey: Aes128Key): Promise<Id> {

		let encryptedData = encryptBytes(sessionKey, dataFile.data)
		let fileData = createFileDataDataPost()
		fileData.size = dataFile.data.byteLength.toString()
		fileData.group = this._login.getGroupId(GroupType.Mail) // currently only used for attachments
		return _service("filedataservice", HttpMethod.POST, fileData, FileDataReturnPostTypeRef, null, sessionKey)
			.then(fileDataPostReturn => {
				// upload the file content
				let fileDataId = fileDataPostReturn.fileData
				let headers = this._login.createAuthHeaders()
				headers['v'] = FileDataDataReturnTypeModel.version
				return this._restClient.request(REST_PATH, HttpMethod.PUT,
					{fileDataId: fileDataId}, headers, encryptedData, MediaType.Binary)
				           .then(() => fileDataId)
			})
	}

	/**
	 * Does not cleanup uploaded files. This is a responsibility of the caller
	 */
	uploadFileDataNative(fileReference: FileReference, sessionKey: Aes128Key): Promise<Id> {
		if (this._suspensionHandler.isSuspended()) {
			return this._suspensionHandler.deferRequest(() => this.uploadFileDataNative(fileReference, sessionKey))
		}
		return aesEncryptFile(sessionKey, fileReference.location, random.generateRandomData(16))
			.then(encryptedFileInfo => {
				let fileData = createFileDataDataPost()
				fileData.size = encryptedFileInfo.unencSize.toString()
				fileData.group = this._login.getGroupId(GroupType.Mail) // currently only used for attachments
				return _service("filedataservice", HttpMethod.POST, fileData, FileDataReturnPostTypeRef, null, sessionKey)
					.then(fileDataPostReturn => {
						let fileDataId = fileDataPostReturn.fileData
						let headers = this._login.createAuthHeaders()
						headers['v'] = FileDataDataReturnTypeModel.version
						let url = addParamsToUrl(new URL(getHttpOrigin() + "/rest/tutanota/filedataservice"), {fileDataId})
						return fileApp.upload(encryptedFileInfo.uri, url.toString(), headers).then(({
							                                                                            statusCode,
							                                                                            uri,
							                                                                            errorId,
							                                                                            precondition,
							                                                                            suspensionTime
						                                                                            }) => {
							if (statusCode === 200) {
								return fileDataId;
							} else if (suspensionTime && isSuspensionResponse(statusCode, suspensionTime)) {
								this._suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))
								return this._suspensionHandler.deferRequest(() => this.uploadFileDataNative(fileReference, sessionKey))
							} else {
								throw handleRestError(statusCode, ` | PUT ${url.toString()} failed to natively upload attachment`, errorId, precondition)
							}
						})
					})
			})
	}

	/**
	 * @returns blobReferenceToken
	 */
	async uploadBlob(instance: {_type: TypeRef<any>}, blobData: Uint8Array, ownerGroupId: Id): Promise<Uint8Array> {
		const typeModel = await resolveTypeReference(instance._type)
		const sessionKey = neverNull(await resolveSessionKey(typeModel, instance))
		const encryptedData = encryptBytes(sessionKey, blobData)
		const blobId = uint8ArrayToBase64(hash(encryptedData).slice(0, 6))

		const {storageAccessToken, servers} = await this.getUploadToken(typeModel, ownerGroupId)
		const headers = Object.assign({
			storageAccessToken,
			'v': BlobDataGetTypeModel.version
		}, this._login.createAuthHeaders())
		return this._restClient.request(STORAGE_REST_PATH, HttpMethod.PUT, {blobId}, headers, encryptedData,
			MediaType.Binary, null, servers[0].url)
	}

	async downloadBlob(archiveId: Id, blobId: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
		const {storageAccessToken, servers} = await this.getDownloadToken(archiveId)
		const headers = Object.assign({
			storageAccessToken,
			'v': BlobDataGetTypeModel.version
		}, this._login.createAuthHeaders())
		const getData = createBlobDataGet({
			archiveId,
			blobId: createBlobId({blobId})
		})
		const literalGetData = await encryptAndMapToLiteral(BlobDataGetTypeModel, getData, null)
		const body = JSON.stringify(literalGetData)
		const data = await this._restClient.request(STORAGE_REST_PATH, HttpMethod.GET, {},
			headers, body, MediaType.Binary, null, servers[0].url)
		return aes128Decrypt(uint8ArrayToKey(key), data)
	}

	async getUploadToken(typeModel: TypeModel, ownerGroupId: Id): Promise<BlobAccessInfo> {
		const tokenRequest = createBlobAccessTokenData({
			write: createBlobWriteData({
				type: createTypeInfo({
					application: typeModel.app,
					typeId: String(typeModel.id)
				}),
				archiveOwnerGroup: ownerGroupId,
			})
		})
		const {blobAccessInfo} = await serviceRequest(StorageService.BlobAccessTokenService, HttpMethod.POST, tokenRequest, BlobAccessTokenReturnTypeRef)
		return blobAccessInfo
	}

	async getDownloadToken(readArchiveId: Id): Promise<BlobAccessInfo> {
		const tokenRequest = createBlobAccessTokenData({
			readArchiveId
		})
		const {blobAccessInfo} = await serviceRequest(StorageService.BlobAccessTokenService, HttpMethod.POST, tokenRequest, BlobAccessTokenReturnTypeRef)
		return blobAccessInfo
	}
}

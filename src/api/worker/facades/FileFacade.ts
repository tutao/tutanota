import {addParamsToUrl, isSuspensionResponse, RestClient} from "../rest/RestClient"
import {CryptoFacade, encryptBytes} from "../crypto/CryptoFacade"
import type {File as TutanotaFile} from "../../entities/tutanota/TypeRefs.js"
import {createFileDataDataGet, createFileDataDataPost, FileDataDataGetTypeRef, FileTypeRef} from "../../entities/tutanota/TypeRefs.js"
import {assert, assertNotNull, filterInt, neverNull} from "@tutao/tutanota-utils"
import {GroupType} from "../../common/TutanotaConstants"

import {HttpMethod, MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {assertWorkerOrNode, getApiOrigin, Mode} from "../../common/Env"
import {handleRestError} from "../../common/error/RestError"
import {convertToDataFile, DataFile} from "../../common/DataFile"
import type {SuspensionHandler} from "../SuspensionHandler"
import {aes128Decrypt, random} from "@tutao/tutanota-crypto"
import type {NativeFileApp} from "../../../native/common/FileApp"
import type {AesApp} from "../../../native/worker/AesApp"
import {InstanceMapper} from "../crypto/InstanceMapper"
import {FileReference} from "../../common/utils/FileUtils";
import {IServiceExecutor} from "../../common/ServiceRequest"
import {FileDataService} from "../../entities/tutanota/Services"
import modelInfo from "../../entities/tutanota/ModelInfo"
import {UserFacade} from "./UserFacade"

assertWorkerOrNode()
const REST_PATH = "/rest/tutanota/filedataservice"

export class FileFacade {

	constructor(
		private readonly user: UserFacade,
		private readonly restClient: RestClient,
		private readonly suspensionHandler: SuspensionHandler,
		private readonly fileApp: NativeFileApp,
		private readonly aesApp: AesApp,
		private readonly instanceMapper: InstanceMapper,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
	) {}

	clearFileData(): Promise<void> {
		return this.fileApp.clearFileData()
	}

	async downloadFileContent(file: TutanotaFile): Promise<DataFile> {
		let requestData = createFileDataDataGet()
		requestData.file = file._id
		requestData.base64 = false
		const sessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(file)
		const entityToSend = await this.instanceMapper.encryptAndMapToLiteral(await resolveTypeReference(FileDataDataGetTypeRef), requestData, null)
		let headers = this.user.createAuthHeaders()

		headers["v"] = String(modelInfo.version)
		let body = JSON.stringify(entityToSend)
		const data = await this.restClient.request(REST_PATH, HttpMethod.GET, {body, responseType: MediaType.Binary, headers})
		return convertToDataFile(file, aes128Decrypt(neverNull(sessionKey), data))
	}

	async downloadFileContentNative(file: TutanotaFile): Promise<FileReference> {
		assert(env.mode === Mode.App || env.mode === Mode.Desktop, "Environment is not app or Desktop!")

		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.downloadFileContentNative(file))
		}

		const sessionKey = assertNotNull(await this.cryptoFacade.resolveSessionKeyForInstance(file), "Session key for TutanotaFile is null")

		const requestData = createFileDataDataGet({
			file: file._id,
			base64: false,
		})

		const FileDataDataGetTypModel = await resolveTypeReference(FileDataDataGetTypeRef)
		const entityToSend = await this.instanceMapper.encryptAndMapToLiteral(FileDataDataGetTypModel, requestData, null)

		const headers = this.user.createAuthHeaders()

		headers["v"] = String(modelInfo.version)
		const body = JSON.stringify(entityToSend)
		const queryParams = {
			_body: body,
		}
		const url = addParamsToUrl(new URL(getApiOrigin() + REST_PATH), queryParams)
		const {
			statusCode,
			encryptedFileUri,
			errorId,
			precondition,
			suspensionTime
		} = await this.fileApp.download(url.toString(), file.name, headers)

		if (suspensionTime && isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))

			return this.suspensionHandler.deferRequest(() => this.downloadFileContentNative(file))
		} else if (statusCode === 200 && encryptedFileUri != null) {
			const decryptedFileUri = await this.aesApp.aesDecryptFile(neverNull(sessionKey), encryptedFileUri)

			try {
				await this.fileApp.deleteFile(encryptedFileUri)
			} catch (e) {
				console.warn("Failed to delete encrypted file", encryptedFileUri)
			}

			return {
				_type: "FileReference",
				name: file.name,
				mimeType: file.mimeType ?? MediaType.Binary,
				location: decryptedFileUri,
				size: filterInt(file.size),
			}
		} else {
			throw handleRestError(statusCode, ` | GET ${url.toString()} failed to natively download attachment`, errorId, precondition)
		}
	}

	async uploadFileData(dataFile: DataFile, sessionKey: Aes128Key): Promise<Id> {
		const encryptedData = encryptBytes(sessionKey, dataFile.data)
		const fileData = createFileDataDataPost({
			size: dataFile.data.byteLength.toString(),
			group: this.user.getGroupId(GroupType.Mail)  // currently only used for attachments
		})
		const fileDataPostReturn = await this.serviceExecutor.post(FileDataService, fileData, {sessionKey})
		// upload the file content
		let fileDataId = fileDataPostReturn.fileData

		const headers = this.user.createAuthHeaders()
		headers["v"] = String(modelInfo.version)
		await this.restClient
				  .request(
					  REST_PATH,
					  HttpMethod.PUT,
					  {
						  queryParams: {
							  fileDataId: fileDataId,
						  },
						  headers,
						  body: encryptedData,
						  responseType: MediaType.Binary,
					  },
				  )
		return fileDataId
	}

	/**
	 * Does not cleanup uploaded files. This is a responsibility of the caller
	 */
	async uploadFileDataNative(fileReference: FileReference, sessionKey: Aes128Key): Promise<Id> {
		if (this.suspensionHandler.isSuspended()) {
			return this.suspensionHandler.deferRequest(() => this.uploadFileDataNative(fileReference, sessionKey))
		}

		const encryptedFileInfo = await this.aesApp.aesEncryptFile(sessionKey, fileReference.location)
		const fileData = createFileDataDataPost({
			size: encryptedFileInfo.unencryptedSize.toString(),
			group: this.user.getGroupId(GroupType.Mail), // currently only used for attachments
		})
		const fileDataPostReturn = await this.serviceExecutor.post(FileDataService, fileData, {sessionKey})
		const fileDataId = fileDataPostReturn.fileData

		const headers = this.user.createAuthHeaders()

		headers["v"] = String(modelInfo.version)
		const url = addParamsToUrl(new URL(getApiOrigin() + "/rest/tutanota/filedataservice"), {
			fileDataId,
		})
		const {
			statusCode,
			errorId,
			precondition,
			suspensionTime
		} = await this.fileApp.upload(encryptedFileInfo.uri, url.toString(), HttpMethod.PUT, headers)

		if (statusCode === 200) {
			return fileDataId
		} else if (suspensionTime && isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime))

			return this.suspensionHandler.deferRequest(() => this.uploadFileDataNative(fileReference, sessionKey))
		} else {
			throw handleRestError(statusCode, ` | PUT ${url.toString()} failed to natively upload attachment`, errorId, precondition)
		}
	}

}
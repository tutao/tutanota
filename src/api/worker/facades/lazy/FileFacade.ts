import { addParamsToUrl, isSuspensionResponse, RestClient } from "../../rest/RestClient.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import type { File as TutanotaFile } from "../../../entities/tutanota/TypeRefs.js"
import { createFileDataDataGet, FileDataDataGetTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { assert, assertNotNull, filterInt, neverNull } from "@tutao/tutanota-utils"

import { HttpMethod, MediaType, resolveTypeReference } from "../../../common/EntityFunctions.js"
import { assertWorkerOrNode, getApiOrigin, Mode } from "../../../common/Env.js"
import { handleRestError } from "../../../common/error/RestError.js"
import { convertToDataFile, DataFile } from "../../../common/DataFile.js"
import type { SuspensionHandler } from "../../SuspensionHandler.js"
import { aes128Decrypt } from "@tutao/tutanota-crypto"
import type { NativeFileApp } from "../../../../native/common/FileApp.js"
import type { AesApp } from "../../../../native/worker/AesApp.js"
import { InstanceMapper } from "../../crypto/InstanceMapper.js"
import { FileReference } from "../../../common/utils/FileUtils.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import modelInfo from "../../../entities/tutanota/ModelInfo.js"
import { UserFacade } from "../UserFacade.js"

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
		const data = await this.restClient.request(REST_PATH, HttpMethod.GET, { body, responseType: MediaType.Binary, headers })
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
		const serviceUrl = new URL(getApiOrigin() + REST_PATH)
		const url = addParamsToUrl(serviceUrl, queryParams)
		const { statusCode, encryptedFileUri, errorId, precondition, suspensionTime } = await this.fileApp.download(url.toString(), file.name, headers)

		if (suspensionTime && isSuspensionResponse(statusCode, suspensionTime)) {
			this.suspensionHandler.activateSuspensionIfInactive(Number(suspensionTime), serviceUrl)

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
}

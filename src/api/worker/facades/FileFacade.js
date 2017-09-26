// @flow
import {_TypeModel as FileDataDataGetTypModel, createFileDataDataGet} from "../../entities/tutanota/FileDataDataGet"
import {restClient, MediaType, addParamsToUrl} from "../rest/RestClient"
import {encryptAndMapToLiteral, resolveSessionKey, encryptBytes} from "../crypto/CryptoFacade"
import {aes128Decrypt} from "../crypto/Aes"
import {_TypeModel as FileTypeModel} from "../../entities/tutanota/File"
import {neverNull} from "../../common/utils/Utils"
import {loginFacade} from "./LoginFacade"
import {createFileDataDataPost} from "../../entities/tutanota/FileDataDataPost"
import {_service} from "../rest/ServiceRestClient"
import {FileDataReturnPostTypeRef} from "../../entities/tutanota/FileDataReturnPost"
import {GroupType} from "../../common/TutanotaConstants"
import {random} from "../crypto/Randomizer"
import {_TypeModel as FileDataDataReturnTypeModel} from "../../entities/tutanota/FileDataDataReturn"
import {HttpMethod} from "../../common/EntityFunctions"
import {assertWorkerOrNode, getHttpOrigin, Mode} from "../../Env"
import {aesEncryptFile, aesDecryptFile} from "../../../native/AesApp"
import {handleRestError} from "../../common/error/RestError"
import {fileApp} from "../../../native/FileApp"
import {createDataFile} from "../../common/DataFile"

assertWorkerOrNode()

class FileFacade {

	downloadFileContent(file: TutanotaFile): Promise<DataFile | FileReference> {
		let requestData = createFileDataDataGet()
		requestData.file = file._id
		requestData.base64 = false

		return resolveSessionKey(FileTypeModel, file).then(sessionKey => {
			return encryptAndMapToLiteral(FileDataDataGetTypModel, requestData, null).then(entityToSend => {
				let headers = loginFacade.createAuthHeaders()
				headers['v'] = FileDataDataGetTypModel.version
				let body = JSON.stringify(entityToSend)
				if (env.mode == Mode.App) {
					let queryParams = {'_body': encodeURIComponent(body)}
					let url = addParamsToUrl(getHttpOrigin() + "/rest/tutanota/filedataservice", queryParams)
					return fileApp.download(url, file.name, headers).then(fileLocation => {
						return aesDecryptFile(neverNull(sessionKey), fileLocation).then(decryptedFileUrl => {
							return {
								_type: 'FileReference',
								name: file.name,
								mimeType: file.mimeType,
								location: decryptedFileUrl,
								size: file.size
							}
						})
					})
				} else {
					return restClient.request("/rest/tutanota/filedataservice", HttpMethod.GET, {}, headers, body, MediaType.Binary).then(data => {
						return createDataFile(file, aes128Decrypt(neverNull(sessionKey), data))
					})
				}
			})
		})
	}

	uploadFileData(dataFile: DataFile, sessionKey): Promise<Id> {
		let encryptedData = encryptBytes(sessionKey, dataFile.data)
		let fileData = createFileDataDataPost()
		fileData.size = dataFile.data.byteLength.toString()
		fileData.group = loginFacade.getGroupId(GroupType.Mail) // currently only used for attachments
		return _service("filedataservice", HttpMethod.POST, fileData, FileDataReturnPostTypeRef, null, sessionKey).then(fileDataPostReturn => {
			// upload the file content
			let fileDataId = fileDataPostReturn.fileData
			let headers = loginFacade.createAuthHeaders()
			headers['v'] = FileDataDataReturnTypeModel.version
			return restClient.request("/rest/tutanota/filedataservice", HttpMethod.PUT, {fileDataId: fileDataId}, headers, encryptedData, MediaType.Binary).then(() => fileDataId)
		})
	}

	uploadFileDataNative(fileReference: FileReference, sessionKey: Aes128Key): Promise<Id> {
		return aesEncryptFile(sessionKey, fileReference.location, random.generateRandomData(16)).then(encryptedFileLocation => {
			let fileData = createFileDataDataPost()
			fileData.size = fileReference.size + ""
			fileData.group = loginFacade.getGroupId(GroupType.Mail) // currently only used for attachments
			return _service("filedataservice", HttpMethod.POST, fileData, FileDataReturnPostTypeRef, null, sessionKey).then(fileDataPostReturn => {
				let fileDataId = fileDataPostReturn.fileData
				let headers = loginFacade.createAuthHeaders()
				headers['v'] = FileDataDataReturnTypeModel.version
				let url = addParamsToUrl(getHttpOrigin() + "/rest/tutanota/filedataservice", {fileDataId})
				return fileApp.upload(encryptedFileLocation, url, headers).then(responseCode => {
					if (responseCode == 200) {
						return fileDataId;
					} else {
						throw new handleRestError(responseCode, "failed to natively upload attachment");
					}
				})
			}).finally(() => {
				return fileApp.deleteFile(encryptedFileLocation)
			})
		}).finally(() => {
			return fileApp.deleteFile(fileReference.location)
		})
	}
}


export const fileFacade: FileFacade = new FileFacade()

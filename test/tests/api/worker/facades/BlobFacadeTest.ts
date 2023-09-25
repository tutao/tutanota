import o from "@tutao/otest"
import { BLOB_SERVICE_REST_PATH, BlobFacade } from "../../../../../src/api/worker/facades/lazy/BlobFacade.js"
import { RestClient } from "../../../../../src/api/worker/rest/RestClient.js"
import { SuspensionHandler } from "../../../../../src/api/worker/SuspensionHandler.js"
import { NativeFileApp } from "../../../../../src/native/common/FileApp.js"
import { AesApp } from "../../../../../src/native/worker/AesApp.js"
import { InstanceMapper } from "../../../../../src/api/worker/crypto/InstanceMapper.js"
import { ArchiveDataType, MAX_BLOB_SIZE_BYTES } from "../../../../../src/api/common/TutanotaConstants.js"
import { createBlob, createBlobReferenceTokenWrapper } from "../../../../../src/api/entities/sys/TypeRefs.js"
import { createFile, File as TutanotaFile } from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import { ServiceExecutor } from "../../../../../src/api/worker/rest/ServiceExecutor.js"
import { instance, matchers, object, verify, when } from "testdouble"
import { HttpMethod } from "../../../../../src/api/common/EntityFunctions.js"
import { aesDecrypt, aes128RandomKey, aesEncrypt, generateIV } from "@tutao/tutanota-crypto"
import { arrayEquals, neverNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { Mode } from "../../../../../src/api/common/Env.js"
import { CryptoFacade } from "../../../../../src/api/worker/crypto/CryptoFacade.js"
import { FileReference } from "../../../../../src/api/common/utils/FileUtils.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/api/common/error/ProgrammingError.js"
import { createBlobPostOut, createBlobServerAccessInfo, createBlobServerUrl } from "../../../../../src/api/entities/storage/TypeRefs.js"
import type { AuthDataProvider } from "../../../../../src/api/worker/facades/UserFacade.js"
import { BlobAccessTokenFacade, BlobReferencingInstance } from "../../../../../src/api/worker/facades/BlobAccessTokenFacade.js"
import { DateProvider } from "../../../../../src/api/common/DateProvider.js"
import { elementIdPart, listIdPart } from "../../../../../src/api/common/utils/EntityUtils.js"

const { anything, captor } = matchers

o.spec("BlobFacade test", function () {
	let blobFacade: BlobFacade
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let authDataProvider: AuthDataProvider
	let serviceMock: ServiceExecutor
	let restClientMock: RestClient
	let suspensionHandlerMock: SuspensionHandler
	let fileAppMock: NativeFileApp
	let aesAppMock: AesApp
	let instanceMapperMock: InstanceMapper
	const archiveId = "archiveId1"
	const blobId1 = "blobId1"
	const blobs = [createBlob({ archiveId, blobId: blobId1 }), createBlob({ archiveId, blobId: "blobId2" }), createBlob({ archiveId })]
	let archiveDataType = ArchiveDataType.Attachments
	let cryptoFacadeMock: CryptoFacade
	let dateProvider: DateProvider
	let file: TutanotaFile

	o.beforeEach(function () {
		authDataProvider = object<AuthDataProvider>()
		serviceMock = object<ServiceExecutor>()
		restClientMock = instance(RestClient)
		suspensionHandlerMock = instance(SuspensionHandler)
		fileAppMock = instance(NativeFileApp)
		aesAppMock = instance(AesApp)
		instanceMapperMock = instance(InstanceMapper)
		cryptoFacadeMock = object<CryptoFacade>()
		blobAccessTokenFacade = instance(BlobAccessTokenFacade)

		const mimeType = "text/plain"
		const name = "fileName"
		file = createFile({ name, mimeType, _id: ["fileListId", "fileElementId"] })

		blobFacade = new BlobFacade(
			authDataProvider,
			serviceMock,
			restClientMock,
			suspensionHandlerMock,
			fileAppMock,
			aesAppMock,
			instanceMapperMock,
			cryptoFacadeMock,
			blobAccessTokenFacade,
		)
	})

	o.afterEach(function () {
		env.mode = Mode.Browser
	})

	o.spec("upload", function () {
		o("encryptAndUpload single blob", async function () {
			const ownerGroup = "ownerId"
			const sessionKey = aes128RandomKey()
			const blobData = new Uint8Array([1, 2, 3])

			const expectedReferenceTokens = [createBlobReferenceTokenWrapper({ blobReferenceToken: "blobRefToken" })]

			let blobAccessInfo = createBlobServerAccessInfo({ blobAccessToken: "123", servers: [createBlobServerUrl({ url: "w1" })] })
			when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)
			let blobServiceResponse = createBlobPostOut({ blobReferenceToken: expectedReferenceTokens[0].blobReferenceToken })
			when(instanceMapperMock.decryptAndMapToInstance(anything(), anything(), anything())).thenResolve(blobServiceResponse)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything())).thenResolve(JSON.stringify(blobServiceResponse))

			const referenceTokens = await blobFacade.encryptAndUpload(archiveDataType, blobData, ownerGroup, sessionKey)
			o(referenceTokens).deepEquals(expectedReferenceTokens)

			const optionsCaptor = captor()
			verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, optionsCaptor.capture()))
			const encryptedData = optionsCaptor.value.body
			const decryptedData = aesDecrypt(sessionKey, encryptedData)
			o(arrayEquals(decryptedData, blobData)).equals(true)
			o(optionsCaptor.value.baseUrl).equals("w1")
		})

		o("encryptAndUploadNative", async function () {
			const ownerGroup = "ownerId"
			const sessionKey = aes128RandomKey()

			const expectedReferenceTokens = [createBlobReferenceTokenWrapper({ blobReferenceToken: "blobRefToken" })]
			const uploadedFileUri = "rawFileUri"
			const chunkUris = ["uri1"]

			let blobAccessInfo = createBlobServerAccessInfo({
				blobAccessToken: "123",
				servers: [createBlobServerUrl({ url: "http://w1.api.tuta.com" })],
			})
			when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)
			let blobServiceResponse = createBlobPostOut({ blobReferenceToken: expectedReferenceTokens[0].blobReferenceToken })
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({ test: "theseAreTheParamsIPromise" })

			when(instanceMapperMock.decryptAndMapToInstance(anything(), anything(), anything())).thenResolve(blobServiceResponse)
			when(fileAppMock.splitFile(uploadedFileUri, MAX_BLOB_SIZE_BYTES)).thenResolve(chunkUris)
			let encryptedFileInfo = {
				uri: "encryptedChunkUri",
				unencSize: 3,
			}
			when(aesAppMock.aesEncryptFile(sessionKey, chunkUris[0])).thenResolve(encryptedFileInfo)
			const blobHash = "blobHash"
			when(fileAppMock.hashFile(encryptedFileInfo.uri)).thenResolve(blobHash)
			when(fileAppMock.upload(anything(), anything(), anything(), anything())).thenResolve({
				statusCode: 201,
				responseBody: stringToUtf8Uint8Array(JSON.stringify(blobServiceResponse)),
			})

			env.mode = Mode.Desktop
			const referenceTokens = await blobFacade.encryptAndUploadNative(archiveDataType, uploadedFileUri, ownerGroup, sessionKey)

			o(referenceTokens).deepEquals(expectedReferenceTokens)
			verify(
				fileAppMock.upload(
					encryptedFileInfo.uri,
					`http://w1.api.tuta.com${BLOB_SERVICE_REST_PATH}?test=theseAreTheParamsIPromise`,
					HttpMethod.POST,
					{},
				),
			)
		})
	})

	o.spec("download", function () {
		o("downloadAndDecrypt", async function () {
			const sessionKey = aes128RandomKey()
			const blobData = new Uint8Array([1, 2, 3])
			file.blobs.push(createBlob())
			const encryptedBlobData = aesEncrypt(sessionKey, blobData, generateIV(), true, true)

			let blobAccessInfo = createBlobServerAccessInfo({ blobAccessToken: "123", servers: [createBlobServerUrl({ url: "someBaseUrl" })] })
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything())).thenResolve(blobAccessInfo)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKeyForInstance(file)).thenResolve(sessionKey)
			const requestBody = { "request-body": true }
			when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenResolve(requestBody)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(encryptedBlobData)

			const decryptedData = await blobFacade.downloadAndDecrypt(archiveDataType, wrapTutanotaFile(file))

			o(arrayEquals(decryptedData, blobData)).equals(true)("decrypted data")
			const optionsCaptor = captor()
			verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, optionsCaptor.capture()))
			o(optionsCaptor.value.baseUrl).equals("someBaseUrl")
			o(optionsCaptor.value.queryParams.blobAccessToken).deepEquals(blobAccessInfo.blobAccessToken)
			o(optionsCaptor.value.body).deepEquals(JSON.stringify(requestBody))
		})

		o("downloadAndDecryptNative", async function () {
			const sessionKey = aes128RandomKey()

			file.blobs.push(blobs[0])

			let blobAccessInfo = createBlobServerAccessInfo({
				blobAccessToken: "123",
				servers: [createBlobServerUrl({ url: "http://w1.api.tuta.com" })],
			})
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything())).thenResolve(blobAccessInfo)
			when(blobAccessTokenFacade.createQueryParams(anything(), anything(), anything())).thenResolve({ test: "theseAreTheParamsIPromise" })

			when(cryptoFacadeMock.resolveSessionKeyForInstance(file)).thenResolve(sessionKey)
			const requestBody = { "request-body": true }
			const encryptedFileUri = "encryptedUri"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenResolve(requestBody)
			when(fileAppMock.download(anything(), anything(), anything())).thenResolve({ statusCode: 200, encryptedFileUri })
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(fileAppMock.joinFiles(file.name, [decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)
			env.mode = Mode.Desktop

			const decryptedFileReference = await blobFacade.downloadAndDecryptNative(
				archiveDataType,
				wrapTutanotaFile(file),
				file.name,
				neverNull(file.mimeType),
			)

			const expectedFileReference: FileReference = {
				_type: "FileReference",
				name: file.name,
				mimeType: neverNull(file.mimeType),
				size,
				location: decryptedUri,
			}
			o(decryptedFileReference).deepEquals(expectedFileReference)
			verify(fileAppMock.download(`http://w1.api.tuta.com${BLOB_SERVICE_REST_PATH}?test=theseAreTheParamsIPromise`, blobs[0].blobId + ".blob", {}))
			verify(fileAppMock.deleteFile(encryptedFileUri))
			verify(fileAppMock.deleteFile(decryptedChunkUri))
		})

		o("downloadAndDecryptNative_delete_on_error", async function () {
			const sessionKey = aes128RandomKey()
			file.blobs.push(blobs[0])
			file.blobs.push(blobs[1])

			let blobAccessInfo = createBlobServerAccessInfo({
				blobAccessToken: "123",
				servers: [createBlobServerUrl({ url: "http://w1.api.tuta.com" })],
			})
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything())).thenResolve(blobAccessInfo)
			when(cryptoFacadeMock.resolveSessionKeyForInstance(file)).thenResolve(sessionKey)
			const requestBody = { "request-body": true }
			const encryptedFileUri = "encryptedUri"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenResolve(requestBody)
			when(fileAppMock.download(anything(), blobs[0].blobId + ".blob", anything())).thenResolve({ statusCode: 200, encryptedFileUri })
			when(fileAppMock.download(anything(), blobs[1].blobId + ".blob", anything())).thenReject(new ProgrammingError("test download error"))
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(fileAppMock.joinFiles(file.name, [decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)
			env.mode = Mode.Desktop

			await assertThrows(ProgrammingError, () =>
				blobFacade.downloadAndDecryptNative(archiveDataType, wrapTutanotaFile(file), file.name, neverNull(file.mimeType)),
			)
			verify(fileAppMock.deleteFile(encryptedFileUri))
			verify(fileAppMock.deleteFile(decryptedChunkUri))
		})
	})
})

function wrapTutanotaFile(tutanotaFile: TutanotaFile): BlobReferencingInstance {
	return {
		blobs: tutanotaFile.blobs,
		elementId: elementIdPart(tutanotaFile._id),
		listId: listIdPart(tutanotaFile._id),
		entity: tutanotaFile,
	}
}

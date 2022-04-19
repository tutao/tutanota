import o from "ospec"
import {BLOB_SERVICE_REST_PATH, BlobFacade} from "../../../../src/api/worker/facades/BlobFacade.js"
import {LoginFacadeImpl} from "../../../../src/api/worker/facades/LoginFacade"
import {RestClient} from "../../../../src/api/worker/rest/RestClient"
import {SuspensionHandler} from "../../../../src/api/worker/SuspensionHandler"
import {NativeFileApp} from "../../../../src/native/common/FileApp"
import {AesApp} from "../../../../src/native/worker/AesApp"
import {InstanceMapper} from "../../../../src/api/worker/crypto/InstanceMapper"
import {ArchiveDataType, MAX_BLOB_SIZE_BYTES} from "../../../../src/api/common/TutanotaConstants"
import {createBlob, createBlobReferenceTokenWrapper} from "../../../../src/api/entities/sys/TypeRefs.js"
import {createFile, createMailBody} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {ServiceExecutor} from "../../../../src/api/worker/rest/ServiceExecutor"
import {func, instance, matchers, object, verify, when} from "testdouble"
import {HttpMethod} from "../../../../src/api/common/EntityFunctions"
import {BlobAccessTokenService} from "../../../../src/api/entities/storage/Services"
import {getElementId, getEtId, getListId} from "../../../../src/api/common/utils/EntityUtils"
import {aes128Decrypt, aes128Encrypt, aes128RandomKey, generateIV, sha256Hash} from "@tutao/tutanota-crypto"
import {arrayEquals, Mapper, stringToBase64, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {Mode} from "../../../../src/api/common/Env"
import {CryptoFacade} from "../../../../src/api/worker/crypto/CryptoFacade"
import {FileReference} from "../../../../src/api/common/utils/FileUtils"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {ProgrammingError} from "../../../../src/api/common/error/ProgrammingError"
import {ConnectionError} from "../../../../src/api/common/error/RestError"
import {
	createBlobAccessTokenPostIn,
	createBlobAccessTokenPostOut,
	createBlobPostOut,
	createBlobReadData,
	createBlobServerAccessInfo,
	createBlobServerUrl,
	createBlobWriteData,
	createInstanceId
} from "../../../../src/api/entities/storage/TypeRefs"
import storageModelInfo from "../../../../src/api/entities/storage/ModelInfo"

const {anything, captor} = matchers

o.spec("BlobFacade test", function () {
	let facade: BlobFacade
	let loginMock: LoginFacadeImpl
	let serviceMock: ServiceExecutor
	let restClientMock: RestClient
	let suspensionHandlerMock: SuspensionHandler
	let fileAppMock: NativeFileApp
	let aesAppMock: AesApp
	let instanceMapperMock: InstanceMapper
	const archiveId = "archiveId1"
	const blobId1 = "blobId1"
	const blobs = [createBlob({archiveId, blobId: blobId1}), createBlob({archiveId, blobId: "blobId2"}), createBlob({archiveId})]
	let archiveDataType = ArchiveDataType.Attachments
	let cryptoFacadeMock: CryptoFacade


	o.beforeEach(function () {
		loginMock = instance(LoginFacadeImpl)
		serviceMock = object<ServiceExecutor>()
		restClientMock = instance(RestClient)
		suspensionHandlerMock = instance(SuspensionHandler)
		fileAppMock = instance(NativeFileApp)
		aesAppMock = instance(AesApp)
		instanceMapperMock = instance(InstanceMapper)
		cryptoFacadeMock = object<CryptoFacade>()

		facade = new BlobFacade(loginMock, serviceMock, restClientMock, suspensionHandlerMock, fileAppMock, aesAppMock, instanceMapperMock, cryptoFacadeMock)
	})

	o.afterEach(function () {
		env.mode = Mode.Browser
	})

	o.spec("request access tokens", function () {
		o("read token LET", async function () {
			const file = createFile({blobs, _id: ["listId", "elementId"]})
			const expectedToken = createBlobAccessTokenPostOut({blobAccessInfo: createBlobServerAccessInfo({blobAccessToken: "123"})})
			when(serviceMock.post(BlobAccessTokenService, anything()))
				.thenResolve(expectedToken)

			const readToken = await facade.requestReadToken(archiveDataType, blobs, file)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			let instanceId = createInstanceId({instanceId: getElementId(file)})
			o(tokenRequest.value).deepEquals(createBlobAccessTokenPostIn({
				archiveDataType,
				read: createBlobReadData({
					archiveId,
					instanceListId: getListId(file),
					instanceIds: [instanceId],
				})
			}))
			o(readToken).equals(expectedToken.blobAccessInfo)
		})

		o("read token ET", async function () {
			const mailBody = createMailBody({_id: "elementId"})
			const expectedToken = createBlobAccessTokenPostOut({blobAccessInfo: createBlobServerAccessInfo({blobAccessToken: "123"})})
			when(serviceMock.post(BlobAccessTokenService, anything()))
				.thenResolve(expectedToken)

			const readToken = await facade.requestReadToken(archiveDataType, blobs, mailBody)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			let instanceId = createInstanceId({instanceId: getEtId(mailBody)})
			o(tokenRequest.value).deepEquals(createBlobAccessTokenPostIn({
				archiveDataType,
				read: createBlobReadData({
					archiveId,
					instanceListId: null,
					instanceIds: [instanceId],
				})
			}))
			o(readToken).equals(expectedToken.blobAccessInfo)
		})

		o("write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createBlobAccessTokenPostOut({blobAccessInfo: createBlobServerAccessInfo({blobAccessToken: "123"})})
			when(serviceMock.post(BlobAccessTokenService, anything()))
				.thenResolve(expectedToken)

			const writeToken = await facade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(createBlobAccessTokenPostIn({
				archiveDataType,
				write: createBlobWriteData({
					archiveOwnerGroup: ownerGroup,
				})
			}))
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

	})

	o.spec("upload", function () {
		o("encryptAndUpload single blob", async function () {
			const ownerGroup = "ownerId"
			const sessionKey = aes128RandomKey()
			const blobData = new Uint8Array([1, 2, 3])

			const expectedReferenceTokens = [createBlobReferenceTokenWrapper({blobReferenceToken: "blobRefToken"})]

			let blobAccessInfo = createBlobServerAccessInfo({blobAccessToken: "123", servers: [createBlobServerUrl({url: "w1"})]})
			facade.requestWriteToken = () => Promise.resolve(blobAccessInfo)
			let blobServiceResponse = createBlobPostOut({blobReferenceToken: expectedReferenceTokens[0].blobReferenceToken})
			when(instanceMapperMock.decryptAndMapToInstance(anything(), anything(), anything())).thenResolve(blobServiceResponse)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything())).thenResolve(JSON.stringify(blobServiceResponse))

			const referenceTokens = await facade.encryptAndUpload(archiveDataType, blobData, ownerGroup, sessionKey)
			o(referenceTokens).deepEquals(expectedReferenceTokens)

			const optionsCaptor = captor()
			verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST,
				optionsCaptor.capture()))
			const encryptedData = optionsCaptor.value.body
			const decryptedData = aes128Decrypt(sessionKey, encryptedData)
			o(arrayEquals(decryptedData, blobData)).equals(true)
			o(optionsCaptor.value.baseUrl).equals("w1")
			o(optionsCaptor.value.queryParams.blobAccessToken).deepEquals(blobAccessInfo.blobAccessToken)
			const expectedBlobHash = uint8ArrayToBase64(sha256Hash(encryptedData).slice(0, 6))
			o(optionsCaptor.value.queryParams.blobHash).equals(expectedBlobHash)
		})

		o("encryptAndUploadNative", async function () {
			const ownerGroup = "ownerId"
			const sessionKey = aes128RandomKey()

			const expectedReferenceTokens = [createBlobReferenceTokenWrapper({blobReferenceToken: "blobRefToken"})]
			const uploadedFileUri = "rawFileUri"
			const chunkUris = ["uri1"]

			let blobAccessInfo = createBlobServerAccessInfo({
				blobAccessToken: "123",
				servers: [createBlobServerUrl({url: "http://w1.api.tutanota.com"})]
			})
			facade.requestWriteToken = () => Promise.resolve(blobAccessInfo)
			let blobServiceResponse = createBlobPostOut({blobReferenceToken: expectedReferenceTokens[0].blobReferenceToken})

			when(instanceMapperMock.decryptAndMapToInstance(anything(), anything(), anything())).thenResolve(blobServiceResponse)
			when(fileAppMock.splitFile(uploadedFileUri, MAX_BLOB_SIZE_BYTES)).thenResolve(chunkUris)
			let encryptedFileInfo = {
				uri: 'encryptedChunkUri',
				unencSize: 3
			}
			when(aesAppMock.aesEncryptFile(sessionKey, chunkUris[0], anything())).thenResolve(encryptedFileInfo)
			const blobHash = "blobHash"
			when(fileAppMock.hashFile(encryptedFileInfo.uri)).thenResolve(blobHash)
			when(fileAppMock.upload(anything(), anything(), anything(), anything())).thenResolve({
				statusCode: 201,
				responseBody: stringToBase64(JSON.stringify(blobServiceResponse))
			})

			env.mode = Mode.Desktop
			const referenceTokens = await facade.encryptAndUploadNative(archiveDataType, uploadedFileUri, ownerGroup, sessionKey)

			o(referenceTokens).deepEquals(expectedReferenceTokens)
			verify(fileAppMock.upload(encryptedFileInfo.uri, `http://w1.api.tutanota.com${BLOB_SERVICE_REST_PATH}?blobAccessToken=123&blobHash=${blobHash}&v=${storageModelInfo.version}`, HttpMethod.POST, {}))
		})

	})

	o.spec("download", function () {
		o("downloadAndDecrypt", async function () {
			const sessionKey = aes128RandomKey()
			const file = createFile()
			const blobData = new Uint8Array([1, 2, 3])
			const encryptedBlobData = aes128Encrypt(sessionKey, blobData, generateIV(), true, true)

			let blobAccessInfo = createBlobServerAccessInfo({blobAccessToken: "123", servers: [createBlobServerUrl({url: "w1"})]})
			facade.requestReadToken = () => Promise.resolve(blobAccessInfo)
			when(cryptoFacadeMock.resolveSessionKeyForInstance(file)).thenResolve(sessionKey)
			const requestBody = {"request-body": true}
			when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenResolve(requestBody)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(encryptedBlobData)

			const decryptedData = await facade.downloadAndDecrypt(archiveDataType, [blobs[0]], file)

			o(arrayEquals(decryptedData, blobData)).equals(true)
			const optionsCaptor = captor()
			verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, optionsCaptor.capture()))
			o(optionsCaptor.value.baseUrl).equals("w1")
			o(optionsCaptor.value.queryParams.blobAccessToken).deepEquals(blobAccessInfo.blobAccessToken)
			o(optionsCaptor.value.body).deepEquals(JSON.stringify(requestBody))
		})

		o("downloadAndDecryptNative", async function () {
			const sessionKey = aes128RandomKey()
			const mimeType = "text/plain"
			const name = "fileName"
			const file = createFile({name, mimeType})

			let blobAccessInfo = createBlobServerAccessInfo({
				blobAccessToken: "123",
				servers: [createBlobServerUrl({url: "http://w1.api.tutanota.com"})]
			})
			facade.requestReadToken = () => Promise.resolve(blobAccessInfo)
			when(cryptoFacadeMock.resolveSessionKeyForInstance(file)).thenResolve(sessionKey)
			const requestBody = {"request-body": true}
			const encryptedFileUri = "encryptedUri"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenResolve(requestBody)
			when(fileAppMock.download(anything(), anything(), anything())).thenResolve({statusCode: 200, encryptedFileUri})
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(fileAppMock.joinFiles(name, [decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)
			env.mode = Mode.Desktop

			const decryptedFileReference = await facade.downloadAndDecryptNative(archiveDataType, [blobs[0]], file, name, mimeType)

			const expectedFileReference: FileReference = {
				_type: 'FileReference',
				name,
				mimeType,
				size,
				location: decryptedUri,
			}
			o(decryptedFileReference).deepEquals(expectedFileReference)
			verify(fileAppMock.download(`http://w1.api.tutanota.com${BLOB_SERVICE_REST_PATH}?blobAccessToken=123&_body=${encodeURIComponent(JSON.stringify(requestBody))}&v=${storageModelInfo.version}`, blobs[0].blobId + ".blob", {}))
			verify(fileAppMock.deleteFile(encryptedFileUri))
			verify(fileAppMock.deleteFile(decryptedChunkUri))
		})

		o("downloadAndDecryptNative_delete_on_error", async function () {
			const sessionKey = aes128RandomKey()
			const mimeType = "text/plain"
			const name = "fileName"
			const file = createFile({name, mimeType})

			let blobAccessInfo = createBlobServerAccessInfo({
				blobAccessToken: "123",
				servers: [createBlobServerUrl({url: "http://w1.api.tutanota.com"})]
			})
			facade.requestReadToken = () => Promise.resolve(blobAccessInfo)
			when(cryptoFacadeMock.resolveSessionKeyForInstance(file)).thenResolve(sessionKey)
			const requestBody = {"request-body": true}
			const encryptedFileUri = "encryptedUri"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenResolve(requestBody)
			when(fileAppMock.download(anything(), blobs[0].blobId + ".blob", anything())).thenResolve({statusCode: 200, encryptedFileUri})
			when(fileAppMock.download(anything(), blobs[1].blobId + ".blob", anything())).thenReject(new ProgrammingError("test download error"))
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(fileAppMock.joinFiles(name, [decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)
			env.mode = Mode.Desktop

			await assertThrows(ProgrammingError, () => facade.downloadAndDecryptNative(archiveDataType, [blobs[0], blobs[1]], file, name, mimeType))
			verify(fileAppMock.deleteFile(encryptedFileUri))
			verify(fileAppMock.deleteFile(decryptedChunkUri))
		})

		o("tryServers successful", async function () {
			let servers = [createBlobServerUrl({url: "w1"}), createBlobServerUrl({url: "w2"})]
			const mapperMock = func<Mapper<string, object>>()
			const expectedResult = {response: "response-from-server"}
			when(mapperMock(anything(), anything())).thenResolve(expectedResult)
			const result = await facade.tryServers(servers, mapperMock, "error")
			o(result).equals(expectedResult)
			verify(mapperMock("w1", 0), {times: 1})
			verify(mapperMock("w2", 1), {times: 0})
		})

		o("tryServers error", async function () {
			let servers = [createBlobServerUrl({url: "w1"}), createBlobServerUrl({url: "w2"})]
			const mapperMock = func<Mapper<string, object>>()
			when(mapperMock("w1", 0)).thenReject(new ProgrammingError("test"))
			const e = await assertThrows(ProgrammingError, () => facade.tryServers(servers, mapperMock, "error"))
			o(e.message).equals("test")
			verify(mapperMock(anything(), anything()), {times: 1})
		})

		o("tryServers ConnectionError and successful response", async function () {
			let servers = [createBlobServerUrl({url: "w1"}), createBlobServerUrl({url: "w2"})]
			const mapperMock = func<Mapper<string, object>>()
			const expectedResult = {response: "response-from-server"}
			when(mapperMock("w1", 0)).thenReject(new ConnectionError("test"))
			when(mapperMock("w2", 1)).thenResolve(expectedResult)
			const result = await facade.tryServers(servers, mapperMock, "error")
			o(result).deepEquals(expectedResult)
			verify(mapperMock(anything(), anything()), {times: 2})
		})

		o("tryServers multiple ConnectionError", async function () {
			let servers = [createBlobServerUrl({url: "w1"}), createBlobServerUrl({url: "w2"})]
			const mapperMock = func<Mapper<string, object>>()
			when(mapperMock("w1", 0)).thenReject(new ConnectionError("test"))
			when(mapperMock("w2", 1)).thenReject(new ConnectionError("test"))
			const e = await assertThrows(ConnectionError, () => facade.tryServers(servers, mapperMock, "error log msg"))
			o(e.message).equals("test")
			verify(mapperMock(anything(), anything()), {times: 2})
		})

	})
})
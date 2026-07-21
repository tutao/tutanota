import o, { assertThrows } from "@tutao/otest"
import {
	BLOB_SERVICE_REST_PATH,
	BlobFacade,
	FileData,
	KeyedNewBlobWrapper,
	MAX_NUMBER_OF_BLOBS_IN_BINARY,
	parseMultipleBlobsResponse,
	pipelineEncryptAndUpload,
	serializeNewBlobsInBinaryChunks,
} from "../../../../../src/applications/common/api/worker/facades/lazy/BlobFacade.js"
import { MAX_BLOB_SIZE_BYTES, RestClient, restSuspension } from "../../../../../src/platform-kit/rest-client"
import { HttpMethod, MediaType, RestBinaryBody, RestClientOptions, RestTextBody } from "../../../../../src/platform-kit/rest-client/types"
import { NativeFileApp } from "../../../../../src/app-kit/native-bridge/common/FileApp.js"
import { AesApp } from "../../../../../src/app-kit/native-bridge/worker/AesApp.js"
import { Mode, ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { ClientTypeModel, elementIdPart, getElementId, listIdPart, ServerTypeModel } from "../../../../../src/platform-kit/meta"
import { func, instance, matchers, object, verify, when } from "testdouble"
import {
	arrayEquals,
	base64ExtToBase64,
	base64ToUint8Array,
	concat,
	defer,
	neverNull,
	promiseMap,
	stringToUtf8Uint8Array,
} from "../../../../../src/platform-kit/utils"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade.js"
import { BlobAccessTokenFacade } from "../../../../../src/platform-kit/network/BlobAccessTokenFacade.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, withOverriddenEnv } from "../../../TestUtils.js"
import { TransferId } from "../../../../../src/entities/drive/Utils"
import {
	BlobGetInTypeRef,
	BlobIdTypeRef,
	BlobPostOut,
	BlobPostOutTypeRef,
	BlobServerAccessInfoTypeRef,
	BlobServerUrlTypeRef,
	createBlobPostOut,
	createBlobServerUrl,
	storageTypeModels,
} from "@tutao/entities/storage"
import { BlobReferenceTokenWrapper, BlobReferenceTokenWrapperTypeRef, BlobTypeRef, createBlobReferenceTokenWrapper } from "@tutao/entities/sys"
import { ArchiveDataType } from "../../../../../src/entities/sys/Utils"
import { File, FileTypeRef, MailDetailsBlobTypeRef } from "@tutao/entities/tutanota"
import { FileReference } from "../../../../../src/entities/tutanota/Utils"
import { BlobReferencingInstance } from "../../../../../src/entities/storage/BlobUtils"
import { aesDecrypt, aesEncrypt } from "../../../../../src/platform-kit/crypto"
import { IncomingServerJson, OutgoingServerJson } from "../../../../../src/platform-kit/instance-pipeline/TypeMapper"
import { aes256RandomKey } from "@tutao/crypto/symmetric-cipher-utils"
import { InstancePipeline, TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"

const { anything, captor } = matchers

o.spec("BlobFacadeTest", function () {
	let blobFacade: BlobFacade
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let restClientMock: RestClient
	let suspensionHandlerMock: restSuspension.SuspensionHandler
	let fileAppMock: NativeFileApp
	let aesAppMock: AesApp
	const archiveId = "archiveId1"
	const archive2Id = "archiveId2"
	const blobId1 = "blobId1"
	const blobs = [
		createTestEntity(BlobTypeRef, { archiveId, blobId: blobId1 }),
		createTestEntity(BlobTypeRef, { archiveId, blobId: "blobId2" }),
		createTestEntity(BlobTypeRef, { archiveId }),
	]
	let archiveDataType = ArchiveDataType.Attachments
	let cryptoFacadeMock: CryptoFacade
	let file: File
	let anotherFile: File
	let typeModelResolver: TypeModelResolver
	let realInstancePipeline: InstancePipeline

	o.beforeEach(function () {
		restClientMock = instance(RestClient)
		suspensionHandlerMock = instance(restSuspension.SuspensionHandler)
		fileAppMock = instance(NativeFileApp)
		aesAppMock = instance(AesApp)
		cryptoFacadeMock = object<CryptoFacade>()
		blobAccessTokenFacade = instance(BlobAccessTokenFacade)
		typeModelResolver = clientInitializedTypeModelResolver()
		realInstancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)

		const mimeType = "text/plain"
		const name = "fileName"
		file = createTestEntity(FileTypeRef, { name, mimeType, _id: ["fileListId", "fileElementId"] })
		anotherFile = createTestEntity(FileTypeRef, { name, mimeType, _id: ["fileListId", "anotherFileElementId"] })

		blobFacade = new BlobFacade(
			restClientMock,
			suspensionHandlerMock,
			fileAppMock,
			aesAppMock,
			realInstancePipeline,
			cryptoFacadeMock,
			blobAccessTokenFacade,
			object(),
			typeModelResolver,
		)
	})

	o.spec("upload", function () {
		o("parseBlobPostOutResponse should remove network debugging info", async function () {
			env.networkDebugging = true

			const newBlobFacade = new BlobFacade(
				restClientMock,
				suspensionHandlerMock,
				fileAppMock,
				aesAppMock,
				realInstancePipeline,
				cryptoFacadeMock,
				blobAccessTokenFacade,
				object(),
				typeModelResolver,
			)

			const expectedReferenceToken = createBlobReferenceTokenWrapper({ blobReferenceToken: "blobRefToken" })
			const blobServiceResponse = createBlobPostOut({
				blobReferenceToken: expectedReferenceToken.blobReferenceToken,
				blobReferenceTokens: [],
			})
			const blobServiceResponseWithDebug = await realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, blobServiceResponse, null)

			const referenceTokens = await newBlobFacade.parseBlobPostOutResponse(blobServiceResponseWithDebug.getJsonRepresentation())
			o(referenceTokens).deepEquals(expectedReferenceToken)
		})

		o("encryptAndUpload single blob", async function () {
			const ownerGroup = "ownerId"
			const sessionKey = aes256RandomKey()
			const blobData = new Uint8Array([1, 2, 3])
			const transferId = "abcde" as TransferId

			const expectedReferenceTokens = [createBlobReferenceTokenWrapper({ blobReferenceToken: "blobRefToken" })]

			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "w1" })],
			})
			when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)
			const blobServiceResponse = createTestEntity(BlobPostOutTypeRef, {
				blobReferenceToken: expectedReferenceTokens[0].blobReferenceToken,
			})
			const blobServiceServerResponse = await realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, blobServiceResponse, sessionKey)

			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything())).thenResolve(blobServiceServerResponse.getJsonRepresentation())

			const referenceTokens = await blobFacade.encryptAndUpload(archiveDataType, blobData, ownerGroup, sessionKey, transferId)
			o(referenceTokens).deepEquals(expectedReferenceTokens)

			const optionsCaptor = captor()
			verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, optionsCaptor.capture()))
			const encryptedData = (optionsCaptor.value.body as RestBinaryBody).payload
			const decryptedData = aesDecrypt(sessionKey, encryptedData)
			o(arrayEquals(decryptedData, blobData)).equals(true)
			o(optionsCaptor.value.baseUrl).equals("w1")
		})

		o.spec("encryptAndUploadMultiple tests", function () {
			o("encryptAndUploadMultiple - multiple small attachments in single request", async function () {
				const ownerGroup = "ownerGroupId"
				const transferId = "t1" as TransferId

				const fileData: FileData[] = [
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2048) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2 * 1024 * 1024) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2048) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2048) },
				]

				const expectedTokens = [
					createBlobReferenceTokenWrapper({ blobReferenceToken: "first_attachment_token" }),
					createBlobReferenceTokenWrapper({ blobReferenceToken: "second_attachment_token" }),
					createBlobReferenceTokenWrapper({ blobReferenceToken: "third_attachment_token" }),
					createBlobReferenceTokenWrapper({ blobReferenceToken: "fourth_attachment_token" }),
				]

				const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					servers: [createTestEntity(BlobServerUrlTypeRef, { url: "w1.api.tuta.com" })],
				})

				when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)

				let expectedBlobPostOutEntity = createTestEntity(BlobPostOutTypeRef, {
					blobReferenceTokens: expectedTokens,
				})
				const expectedBlobPostOut = await realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, expectedBlobPostOutEntity, aes256RandomKey())
				when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything())).thenResolve(expectedBlobPostOut.getJsonRepresentation())

				const tokensArray = expectedTokens.map((t) => Array.of(t.blobReferenceToken))
				const result = await blobFacade.encryptAndUploadMultiple(archiveDataType, ownerGroup, fileData, transferId)
				o(result.map((r) => r.map((i) => i.blobReferenceToken))).deepEquals(tokensArray)
				verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything()), { times: 1 })
				verify(blobAccessTokenFacade.requestWriteToken(anything(), anything()), { times: 1 })
			})

			o("encryptAndUploadMultiple - multiple attachments including one large", async function () {
				const ownerGroup = "ownerGroupId"
				const transferId = "t2" as TransferId

				const fileData: FileData[] = [
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(12 * 1024 * 1024) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2 * 1024 * 1024) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2 * 1024 * 1024) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(1024 * 1024) },
				]

				const firstPartToken = createBlobReferenceTokenWrapper({ blobReferenceToken: "first_attachment_token1" })
				const secondPartToken = createBlobReferenceTokenWrapper({ blobReferenceToken: "first_attachment_token2" })
				const secondAttachmentToken = createBlobReferenceTokenWrapper({ blobReferenceToken: "second_attachment_token" })
				const thirdAttachmentToken = createBlobReferenceTokenWrapper({ blobReferenceToken: "third_attachment_token" })
				const fourthAttachmentToken = createBlobReferenceTokenWrapper({ blobReferenceToken: "fourth_attachment_token" })

				const firstExpectedBlobPostOut = createTestEntity(BlobPostOutTypeRef, {
					blobReferenceTokens: [firstPartToken],
				})
				const secondExpectedBlobPostOut = createTestEntity(BlobPostOutTypeRef, {
					blobReferenceTokens: [secondPartToken, secondAttachmentToken, thirdAttachmentToken, fourthAttachmentToken],
				})
				const firstServerResponse = await realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, firstExpectedBlobPostOut, aes256RandomKey())
				const secondServerResponse = await realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, secondExpectedBlobPostOut, aes256RandomKey())

				const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					servers: [createTestEntity(BlobServerUrlTypeRef, { url: "w1.api.tuta.com" })],
				})

				when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)

				let restClientCall = 0
				when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything())).thenDo(() => {
					restClientCall++
					if (restClientCall === 1) {
						return Promise.resolve(firstServerResponse.getJsonRepresentation())
					} else if (restClientCall === 2) {
						return Promise.resolve(secondServerResponse.getJsonRepresentation())
					}
				})

				const firstAttachmentTokens = [firstPartToken, secondPartToken].map((t) => t.blobReferenceToken)
				const restTokens = [secondAttachmentToken, thirdAttachmentToken, fourthAttachmentToken].map((t) => Array.of(t.blobReferenceToken))

				const result = await blobFacade.encryptAndUploadMultiple(archiveDataType, ownerGroup, fileData, transferId)
				o(result.map((r) => r.map((i) => i.blobReferenceToken))).deepEquals([firstAttachmentTokens, ...restTokens])
				verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything()), { times: 2 })
			})

			o("encryptAndUploadMultiple - worst case", async function () {
				const ownerGroup = "ownerGroupId"
				const transferId = "t3" as TransferId

				const fileData: FileData[] = [
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(14 * 1024 * 1024) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(9 * 1024 * 1024) },
					{ sessionKey: aes256RandomKey(), data: new Uint8Array(2 * 1024 * 1024) },
				]

				const blobRefTokenWrappers = [
					createBlobReferenceTokenWrapper({ blobReferenceToken: "first_attachment_token1" }),
					createBlobReferenceTokenWrapper({ blobReferenceToken: "first_attachment_token2" }),
					createBlobReferenceTokenWrapper({ blobReferenceToken: "second_attachment_token" }),
					createBlobReferenceTokenWrapper({ blobReferenceToken: "third_attachment_token" }),
				]

				let postOuts: Array<BlobPostOut> = []
				for (const t of blobRefTokenWrappers) {
					postOuts.push(
						createTestEntity(BlobPostOutTypeRef, {
							blobReferenceTokens: [t],
						}),
					)
				}

				const serverRespones: OutgoingServerJson[] = await promiseMap(postOuts, (p) =>
					realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, p, aes256RandomKey()),
				)

				const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					servers: [createTestEntity(BlobServerUrlTypeRef, { url: "w1.api.tuta.com" })],
				})

				when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)

				let restClientCall = 0
				when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything())).thenDo(() => {
					restClientCall++
					switch (restClientCall) {
						case 1:
							return Promise.resolve(serverRespones[0].getJsonRepresentation())
						case 2:
							return Promise.resolve(serverRespones[1].getJsonRepresentation())
						case 3:
							return Promise.resolve(serverRespones[2].getJsonRepresentation())
						case 4:
							return Promise.resolve(serverRespones[3].getJsonRepresentation())
					}
				})
				const result = await blobFacade.encryptAndUploadMultiple(archiveDataType, ownerGroup, fileData, transferId)

				const firstAttachmentTokens = blobRefTokenWrappers.slice(0, 2).map((t) => t.blobReferenceToken)
				const secondAttachmentToken = blobRefTokenWrappers[2].blobReferenceToken
				const thirdAttachmentToken = blobRefTokenWrappers[3].blobReferenceToken

				o(result.map((r) => r.map((i) => i.blobReferenceToken))).deepEquals([firstAttachmentTokens, [secondAttachmentToken], [thirdAttachmentToken]])
				verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.POST, anything()), { times: 4 })
			})
		})

		o("encryptAndUploadNative", async function () {
			env.networkDebugging = false
			const ownerGroup = "ownerId"
			const sessionKey = aes256RandomKey()
			const transferId = "abcde" as TransferId

			const expectedReferenceTokens = [createBlobReferenceTokenWrapper({ blobReferenceToken: "blobRefToken" })]
			const uploadedFileUri = "rawFileUri"
			const chunkUri = "tuta-tmp:chunky"

			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "http://w1.api.tuta.com" })],
			})
			when(blobAccessTokenFacade.requestWriteToken(anything(), anything())).thenResolve(blobAccessInfo)

			let blobServiceResponse = createTestEntity(BlobPostOutTypeRef, {
				blobReferenceToken: expectedReferenceTokens[0].blobReferenceToken,
			})

			const blobServiceServerResponse = await realInstancePipeline.mapAndEncrypt(BlobPostOutTypeRef, blobServiceResponse, sessionKey)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({ test: "theseAreTheParamsIPromise" })

			const streamUri = "tuta-stream:whatever"
			when(fileAppMock.openFileForReading(uploadedFileUri)).thenResolve(streamUri)
			when(fileAppMock.readChunk(streamUri, MAX_BLOB_SIZE_BYTES)).thenResolve(chunkUri, null)
			let encryptedFileInfo = {
				uri: "encryptedChunkUri",
				unencSize: 3,
			}
			when(aesAppMock.aesEncryptFile(sessionKey, chunkUri)).thenResolve(encryptedFileInfo)
			const blobHash = "blobHash"
			when(fileAppMock.hashFile(encryptedFileInfo.uri)).thenResolve(blobHash)
			when(fileAppMock.upload(anything(), anything(), anything(), anything(), anything())).thenResolve({
				statusCode: 201,
				responseBody: stringToUtf8Uint8Array(blobServiceServerResponse.getJsonRepresentation()),
			})
			when(fileAppMock.getFilesMetaData([uploadedFileUri])).thenResolve([
				{ size: 1024, location: uploadedFileUri, name: "file1", cid: "abc", _type: "FileReference", mimeType: "" },
			])

			const referenceTokens = await withOverriddenEnv({ mode: Mode.Desktop }, () =>
				blobFacade.encryptAndUploadNative(archiveDataType, uploadedFileUri, ownerGroup, sessionKey, transferId),
			)

			o(referenceTokens).deepEquals(expectedReferenceTokens)
			verify(
				fileAppMock.upload(
					encryptedFileInfo.uri,
					`http://w1.api.tuta.com${BLOB_SERVICE_REST_PATH}?test=theseAreTheParamsIPromise`,
					HttpMethod.POST,
					{
						v: String(storageTypeModels[BlobGetInTypeRef.typeId].version),
						cv: env.versionNumber,
					},
					anything(),
				),
			)
		})
	})

	o.spec("download", function () {
		o("downloadAndDecrypt", async function () {
			const sessionKey = aes256RandomKey()
			const transferId = "abcd" as TransferId

			const blobData = new Uint8Array([1, 2, 3])
			const blobId = "--------0s--"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId, size: String(65), archiveId: archiveId }))
			const encryptedBlobData = aesEncrypt(sessionKey, blobData)

			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			const blobAccessInfos = new Map([[archiveId, blobAccessInfo]])
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything(), matchers.anything())).thenResolve(blobAccessInfos)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			// const requestBody = OutgoingServerJson.newFromRecord({ "request-body": "1" })
			const blobGetIn = createTestEntity(BlobGetInTypeRef, { archiveId, blobIds: [createTestEntity(BlobIdTypeRef, { blobId })] })
			// for the mock
			const requestBody = await realInstancePipeline.mapAndEncrypt(BlobGetInTypeRef, blobGetIn, sessionKey)

			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 1]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData,
			)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(blobResponse)

			const decryptedData = await blobFacade.downloadAndDecrypt(archiveDataType, wrapTutanotaFile(file), transferId)

			o(decryptedData).deepEquals(blobData)("decrypted data is equal")
			const optionsCaptor = captor()
			verify(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, optionsCaptor.capture()))
			o(optionsCaptor.value.baseUrl).equals("someBaseUrl")
			o(optionsCaptor.value.queryParams.blobAccessToken).deepEquals(blobAccessInfo.blobAccessToken)

			// The captured request body has a randomly generated id on the aggregate, which is expected but makes
			// the assertion fail so we overwrite it manually here:
			const capturedRequestBody = (optionsCaptor.value.body as RestTextBody).payload
			const requestBodyParsedJson = JSON.parse(requestBody.getJsonRepresentation())
			// 193 is blobIds aggregation, 145 is _id on each aggregate
			requestBody.getInnerJsonForTest()["193"][0]["145"] = JSON.parse(capturedRequestBody)["193"][0]["145"]

			o(capturedRequestBody).deepEquals(requestBody.getJsonRepresentation())
		})

		o("downloadAndDecrypt multiple", async function () {
			const sessionKey = aes256RandomKey()
			const transferId = "abcd" as TransferId
			const blobData1 = new Uint8Array([1, 2, 3])
			const blobId1 = "--------0s-1"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId1, size: String(65), archiveId }))
			const encryptedBlobData1 = aesEncrypt(sessionKey, blobData1)

			const blobData2 = new Uint8Array([4, 5, 6, 7, 8, 9])
			const blobId2 = "--------0s-2"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId2, size: String(65), archiveId }))
			const encryptedBlobData2 = aesEncrypt(sessionKey, blobData2)

			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			const blobAccessInfos = new Map([[archiveId, blobAccessInfo]])
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything(), matchers.anything())).thenResolve(blobAccessInfos)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 2]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId1)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData1,
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId2)),
				// blob hash
				new Uint8Array([6, 5, 4, 3, 2, 1]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData2,
			)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(blobResponse)

			const decryptedData = await blobFacade.downloadAndDecrypt(archiveDataType, wrapTutanotaFile(file), transferId)

			o(decryptedData).deepEquals(concat(blobData1, blobData2))("decrypted data is equal")
		})

		o("downloadAndDecrypt multiple from different archives", async function () {
			const sessionKey = aes256RandomKey()
			const transferId = "abcd" as TransferId
			const blobData1 = new Uint8Array([1, 2, 3])
			const blobId1 = "--------0s-1"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId1, size: String(65), archiveId }))
			const encryptedBlobData1 = aesEncrypt(sessionKey, blobData1)

			const blobData2 = new Uint8Array([4, 5, 6, 7, 8, 9])
			const blobId2 = "--------0s-2"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId2, size: String(65), archiveId: archive2Id }))
			const encryptedBlobData2 = aesEncrypt(sessionKey, blobData2)

			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})

			const blobAccessInfo2 = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			const blobAccessInfos = new Map([
				[archiveId, blobAccessInfo],
				[archive2Id, blobAccessInfo2],
			])
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything(), matchers.anything())).thenResolve(blobAccessInfos)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 2]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId1)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData1,
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId2)),
				// blob hash
				new Uint8Array([6, 5, 4, 3, 2, 1]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData2,
			)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(blobResponse)

			const decryptedData = await blobFacade.downloadAndDecrypt(archiveDataType, wrapTutanotaFile(file), transferId)

			o(decryptedData).deepEquals(concat(blobData1, blobData2))("decrypted data is equal")
		})

		o("downloadAndDecryptNative", async function () {
			env.networkDebugging = false
			const sessionKey = aes256RandomKey()
			const transferId = "abcd" as TransferId

			file.blobs.push(blobs[0])

			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "http://w1.api.tuta.com" })],
			})
			const blobAccessInfos = new Map([[archiveId, blobAccessInfo]])
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything(), matchers.anything())).thenResolve(blobAccessInfos)
			when(blobAccessTokenFacade.createQueryParams(anything(), anything(), anything())).thenResolve({ test: "theseAreTheParamsIPromise" })

			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			const encryptedFileUri = "encryptedUri"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(fileAppMock.download(anything(), anything(), anything(), anything())).thenResolve({
				statusCode: 200,
				encryptedFileUri,
			})
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(fileAppMock.joinFiles(file.name, [decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)

			const decryptedFileReference: FileReference = await withOverriddenEnv({ mode: Mode.Desktop }, () => {
				return blobFacade.downloadAndDecryptNative(archiveDataType, wrapTutanotaFile(file), file.name, neverNull(file.mimeType), transferId)
			})

			const expectedFileReference: FileReference = {
				_type: "FileReference",
				name: file.name,
				mimeType: neverNull(file.mimeType),
				size,
				location: decryptedUri,
			}
			o(decryptedFileReference).deepEquals(expectedFileReference)
			verify(
				fileAppMock.download(
					`http://w1.api.tuta.com${BLOB_SERVICE_REST_PATH}?test=theseAreTheParamsIPromise`,
					blobs[0].blobId + ".blob",
					{
						v: String(storageTypeModels[BlobGetInTypeRef.typeId].version),
						cv: env.versionNumber,
					},
					anything(),
				),
			)
			verify(fileAppMock.deleteFile(encryptedFileUri))
		})

		o("downloadAndDecryptNative multiple from different archives", async function () {
			env.networkDebugging = false
			const sessionKey = aes256RandomKey()
			const transferId = "abcd" as TransferId

			const blobId1 = "--------0s-1"
			const blobId2 = "--------0s-2"

			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId2, size: String(65), archiveId: archive2Id }))
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId1, size: String(65), archiveId }))

			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "http://w1.api.tuta.com" })],
			})

			let blobAccessInfo2 = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "1234",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "http://w1.api.tuta.com" })],
			})
			const blobAccessInfos = new Map([
				[archiveId, blobAccessInfo],
				[archive2Id, blobAccessInfo2],
			])
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything(), matchers.anything())).thenResolve(blobAccessInfos)
			when(blobAccessTokenFacade.createQueryParams(anything(), anything(), anything())).thenResolve({ test: "theseAreTheParamsIPromise" })

			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			const encryptedFileUri = "encryptedUri"
			const encryptedFileUri2 = "encryptedUri2"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedChunkUri2 = "decryptedChunkUri2"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(fileAppMock.download(anything(), blobId1 + ".blob", anything(), anything())).thenResolve({
				statusCode: 200,
				encryptedFileUri,
			})
			when(fileAppMock.download(anything(), blobId2 + ".blob", anything(), anything())).thenResolve({
				statusCode: 200,
				encryptedFileUri: encryptedFileUri2,
			})
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri2)).thenResolve(decryptedChunkUri2)

			when(fileAppMock.joinFiles(file.name, [decryptedChunkUri2, decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)

			const decryptedFileReference: FileReference = await withOverriddenEnv({ mode: Mode.Desktop }, () => {
				return blobFacade.downloadAndDecryptNative(archiveDataType, wrapTutanotaFile(file), file.name, neverNull(file.mimeType), transferId)
			})

			const expectedFileReference: FileReference = {
				_type: "FileReference",
				name: file.name,
				mimeType: neverNull(file.mimeType),
				size,
				location: decryptedUri,
			}
			o(decryptedFileReference).deepEquals(expectedFileReference)
			verify(
				fileAppMock.download(
					`http://w1.api.tuta.com${BLOB_SERVICE_REST_PATH}?test=theseAreTheParamsIPromise`,
					blobId1 + ".blob",
					{
						v: String(storageTypeModels[BlobGetInTypeRef.typeId].version),
						cv: env.versionNumber,
					},
					anything(),
				),
			)
			verify(
				fileAppMock.download(
					`http://w1.api.tuta.com${BLOB_SERVICE_REST_PATH}?test=theseAreTheParamsIPromise`,
					blobId2 + ".blob",
					{
						v: String(storageTypeModels[BlobGetInTypeRef.typeId].version),
						cv: env.versionNumber,
					},
					anything(),
				),
			)
			verify(fileAppMock.deleteFile(encryptedFileUri))
		})

		o("downloadAndDecryptNative_delete_on_error", async function () {
			const sessionKey = aes256RandomKey()
			const transferId = "abcd" as TransferId

			file.blobs.push(blobs[0])
			file.blobs.push(blobs[1])

			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "http://w1.api.tuta.com" })],
			})
			const blobAccessInfos = new Map([[archiveId, blobAccessInfo]])
			when(blobAccessTokenFacade.requestReadTokenBlobs(anything(), anything(), matchers.anything())).thenResolve(blobAccessInfos)
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			const encryptedFileUri = "encryptedUri"
			const decryptedChunkUri = "decryptedChunkUri"
			const decryptedUri = "decryptedUri"
			const size = 3

			when(fileAppMock.download(anything(), blobs[0].blobId + ".blob", anything(), anything())).thenResolve({
				statusCode: 200,
				encryptedFileUri,
			})
			when(fileAppMock.download(anything(), blobs[1].blobId + ".blob", anything(), anything())).thenReject(new ProgrammingError("test download error"))
			when(aesAppMock.aesDecryptFile(sessionKey, encryptedFileUri)).thenResolve(decryptedChunkUri)
			when(fileAppMock.joinFiles(file.name, [decryptedChunkUri])).thenResolve(decryptedUri)
			when(fileAppMock.getSize(decryptedUri)).thenResolve(size)

			await withOverriddenEnv({ mode: Mode.Desktop }, async () => {
				await assertThrows(ProgrammingError, () =>
					blobFacade.downloadAndDecryptNative(archiveDataType, wrapTutanotaFile(file), file.name, neverNull(file.mimeType), transferId),
				)
			})
			verify(fileAppMock.deleteFile(encryptedFileUri))
			verify(fileAppMock.deleteFile(decryptedChunkUri))
		})
	})

	o.spec("downloadAndDecryptBlobsOfMultipleInstances", function () {
		o.test("when passed multiple instances of the same archives it downloads and decrypts the data", async function () {
			const sessionKey = aes256RandomKey()
			const anothersessionKey = aes256RandomKey()
			const blobData1 = new Uint8Array([1, 2, 3])
			const blobId1 = "--------0s-1"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId1, size: String(65) }))
			const encryptedBlobData1 = aesEncrypt(sessionKey, blobData1)

			const blobData2 = new Uint8Array([4, 5, 6, 7, 8, 9])
			const blobId2 = "--------0s-2"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId2, size: String(65) }))
			const encryptedBlobData2 = aesEncrypt(sessionKey, blobData2)

			const blobData3 = new Uint8Array([10, 11, 12, 13, 14, 15])
			const blobId3 = "--------0s-3"
			anotherFile.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId3, size: String(65) }))
			const encryptedBlobData3 = aesEncrypt(anothersessionKey, blobData3)

			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			when(
				blobAccessTokenFacade.requestReadTokenMultipleInstances(
					archiveDataType,
					[wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)],
					matchers.anything(),
				),
			).thenResolve(blobAccessInfo)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			when(cryptoFacadeMock.resolveSessionKey(anotherFile)).thenResolve(anothersessionKey)
			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 3]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId1)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData1,
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId2)),
				// blob hash
				new Uint8Array([6, 5, 4, 3, 2, 1]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData2,
				//blodId
				base64ToUint8Array(base64ExtToBase64(blobId3)),
				// blob hash
				new Uint8Array([7, 8, 9, 10, 11, 12]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData3,
			)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(blobResponse)

			const result = await blobFacade.downloadAndDecryptBlobsOfMultipleInstances(archiveDataType, [wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)])

			o(result).deepEquals(
				new Map([
					[getElementId(file), concat(blobData1, blobData2)],
					[getElementId(anotherFile), blobData3],
				]),
			)
		})

		o.test("when passed multiple instances of the different archives it downloads and decrypts the data", async function () {
			const sessionKey = aes256RandomKey()
			const anothersessionKey = aes256RandomKey()
			const blobData1 = new Uint8Array([1, 2, 3])
			const blobId1 = "--------0s-1"
			file.blobs.push(
				createTestEntity(BlobTypeRef, {
					blobId: blobId1,
					size: String(65),
					archiveId: "archiveId1",
				}),
			)
			const encryptedBlobData1 = aesEncrypt(sessionKey, blobData1)

			const blobData2 = new Uint8Array([4, 5, 6, 7, 8, 9])
			const blobId2 = "--------0s-2"
			file.blobs.push(
				createTestEntity(BlobTypeRef, {
					blobId: blobId2,
					size: String(65),
					archiveId: "archiveId1",
				}),
			)
			const encryptedBlobData2 = aesEncrypt(sessionKey, blobData2)

			const blobData3 = new Uint8Array([10, 11, 12, 13, 14, 15])
			const blobId3 = "--------0s-3"
			anotherFile.blobs.push(
				createTestEntity(BlobTypeRef, {
					blobId: blobId3,
					size: String(65),
					archiveId: "archiveId2",
				}),
			)
			const encryptedBlobData3 = aesEncrypt(anothersessionKey, blobData3)

			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			when(blobAccessTokenFacade.requestReadTokenMultipleInstances(archiveDataType, [wrapTutanotaFile(file)], matchers.anything())).thenResolve(
				blobAccessInfo,
			)
			when(blobAccessTokenFacade.requestReadTokenMultipleInstances(archiveDataType, [wrapTutanotaFile(anotherFile)], matchers.anything())).thenResolve(
				blobAccessInfo,
			)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})

			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			when(cryptoFacadeMock.resolveSessionKey(anotherFile)).thenResolve(anothersessionKey)
			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse1 = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 2]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId1)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData1,
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId2)),
				// blob hash
				new Uint8Array([6, 5, 4, 3, 2, 1]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData2,
			)

			const blobResponse2 = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 1]),
				//blodId
				base64ToUint8Array(base64ExtToBase64(blobId3)),
				// blob hash
				new Uint8Array([7, 8, 9, 10, 11, 12]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData3,
			)
			const blobGetInTypeModel = await typeModelResolver.resolveServerTypeReference(BlobGetInTypeRef)
			const blobIdTypeModel = await typeModelResolver.resolveServerTypeReference(BlobIdTypeRef)
			when(
				restClientMock.request(
					BLOB_SERVICE_REST_PATH,
					HttpMethod.GET,
					matchers.argThat((options: RestClientOptions) => {
						if (!options.body) {
							return false
						}
						const serverJson = IncomingServerJson.expectSingleInstance((options.body as RestTextBody).payload, blobGetInTypeModel)
						let blobId = serverJson.getAggregationList(193, blobIdTypeModel)[0]
						return [blobId1, blobId2].includes(blobId.getValueByName("blobId").asId())
					}),
				),
			).thenResolve(blobResponse1)
			when(
				restClientMock.request(
					BLOB_SERVICE_REST_PATH,
					HttpMethod.GET,
					matchers.argThat((options: RestClientOptions) => {
						if (!options.body) {
							return false
						}
						const serverJson = IncomingServerJson.expectSingleInstance((options.body as RestTextBody).payload, blobGetInTypeModel)
						let blobId = serverJson.getAggregationList(193, blobIdTypeModel)[0]
						return [blobId3].includes(blobId.getValueByName("blobId").asId())
					}),
				),
			).thenResolve(blobResponse2)

			const result = await blobFacade.downloadAndDecryptBlobsOfMultipleInstances(archiveDataType, [wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)])

			o(result).deepEquals(
				new Map([
					[getElementId(file), concat(blobData1, blobData2)],
					[getElementId(anotherFile), blobData3],
				]),
			)
		})

		o.test("when passed multiple instances of the same archive but one blob is missing it downloads and decrypts the rest", async function () {
			const sessionKey = aes256RandomKey()
			const anothersessionKey = aes256RandomKey()
			const blobData1 = new Uint8Array([1, 2, 3])
			const blobId1 = "--------0s-1"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId1, size: String(65) }))
			const encryptedBlobData1 = aesEncrypt(sessionKey, blobData1)

			const blobData2 = new Uint8Array([4, 5, 6, 7, 8, 9])
			const blobId2 = "--------0s-2"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId2, size: String(65) }))
			const encryptedBlobData2 = aesEncrypt(sessionKey, blobData2)

			const blobId3 = "--------0s-3"
			anotherFile.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId3, size: String(65) }))

			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			when(
				blobAccessTokenFacade.requestReadTokenMultipleInstances(
					archiveDataType,
					[wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)],
					matchers.anything(),
				),
			).thenResolve(blobAccessInfo)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			when(cryptoFacadeMock.resolveSessionKey(anotherFile)).thenResolve(anothersessionKey)
			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 2]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId1)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData1,
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId2)),
				// blob hash
				new Uint8Array([6, 5, 4, 3, 2, 1]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData2,
			)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(blobResponse)

			const result = await blobFacade.downloadAndDecryptBlobsOfMultipleInstances(archiveDataType, [wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)])

			o(result).deepEquals(
				new Map([
					[getElementId(file), concat(blobData1, blobData2)],
					[getElementId(anotherFile), null],
				]),
			)
		})

		o.test("when passed multiple instances of the same archive but one blob is corrupted it downloads and decrypts the rest", async function () {
			const sessionKey = aes256RandomKey()
			const anothersessionKey = aes256RandomKey()
			const blobData1 = new Uint8Array([1, 2, 3])
			const blobId1 = "--------0s-1"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId1, size: String(65) }))
			const encryptedBlobData1 = aesEncrypt(sessionKey, blobData1)

			const blobData2 = new Uint8Array([4, 5, 6, 7, 8, 9])
			const blobId2 = "--------0s-2"
			file.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId2, size: String(65) }))
			const encryptedBlobData2 = aesEncrypt(sessionKey, blobData2)
			encryptedBlobData2[16] = ~encryptedBlobData2[16]

			const blobId3 = "--------0s-3"
			anotherFile.blobs.push(createTestEntity(BlobTypeRef, { blobId: blobId3, size: String(65) }))
			const blobData3 = new Uint8Array([10, 11, 12, 13, 14, 15])
			const encryptedBlobData3 = aesEncrypt(anothersessionKey, blobData3)

			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: "someBaseUrl" })],
			})
			when(
				blobAccessTokenFacade.requestReadTokenMultipleInstances(
					archiveDataType,
					[wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)],
					matchers.anything(),
				),
			).thenResolve(blobAccessInfo)
			when(blobAccessTokenFacade.createQueryParams(blobAccessInfo, anything(), anything())).thenResolve({
				baseUrl: "someBaseUrl",
				blobAccessToken: blobAccessInfo.blobAccessToken,
			})
			when(cryptoFacadeMock.resolveSessionKey(file)).thenResolve(sessionKey)
			when(cryptoFacadeMock.resolveSessionKey(anotherFile)).thenResolve(anothersessionKey)
			// data size is 65 (16 data block, 16 initialization vector, 32 hmac, 1 byte for mac marking)
			const blobSizeBinary = new Uint8Array([0, 0, 0, 65])
			const blobResponse = concat(
				// number of blobs
				new Uint8Array([0, 0, 0, 3]),
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId1)),
				// blob hash
				new Uint8Array([1, 2, 3, 4, 5, 6]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData1,
				// blob id
				base64ToUint8Array(base64ExtToBase64(blobId2)),
				// blob hash
				new Uint8Array([6, 5, 4, 3, 2, 1]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData2,
				base64ToUint8Array(base64ExtToBase64(blobId3)),
				// blob hash
				new Uint8Array([7, 8, 9, 10, 11, 12]),
				// blob size
				blobSizeBinary,
				// blob data
				encryptedBlobData3,
			)
			when(restClientMock.request(BLOB_SERVICE_REST_PATH, HttpMethod.GET, anything())).thenResolve(blobResponse)

			const result = await blobFacade.downloadAndDecryptBlobsOfMultipleInstances(archiveDataType, [wrapTutanotaFile(file), wrapTutanotaFile(anotherFile)])

			o(result).deepEquals(
				new Map([
					[getElementId(file), null],
					[getElementId(anotherFile), blobData3],
				]),
			)
		})
	})

	o.spec("parseMultipleBlobsResponse", function () {
		o.test("parses two blobs", function () {
			// Blob id OETv4XP----0 hash [3, -112, 88, -58, -14, -64] bytes [1, 2, 3]
			// Blob id OETv4XS----0 hash [113, -110, 56, 92, 60, 6] bytes [1, 2, 3, 4, 5, 6]
			const binaryData = new Int8Array([
				// number of blobs [0-3] 2
				0, 0, 0, 2,
				// blob id 1 [4-12]
				100, -9, -69, 22, 38, -128, 0, 0, 1,
				// blob hash 1 [13-18]
				3, -112, 88, -58, -14, -64,
				// blob size 1 [19-22]
				0, 0, 0, 3,
				// blob data 1 [23-25]
				1, 2, 3,
				// blob id 2
				100, -9, -69, 22, 39, 64, 0, 0, 1,
				// blob hash 2
				113, -110, 56, 92, 60, 6,
				// blob size 2
				0, 0, 0, 6,
				// blob data 2
				1, 2, 3, 4, 5, 6,
			])

			const result = parseMultipleBlobsResponse(new Uint8Array(binaryData))
			o(result).deepEquals(
				new Map([
					["OETv4XP----0", new Uint8Array([1, 2, 3])],
					["OETv4XS----0", new Uint8Array([1, 2, 3, 4, 5, 6])],
				]),
			)
		})

		o.test("parses one blob", function () {
			// Blob id OETv4XP----0 hash [3, -112, 88, -58, -14, -64] bytes [1, 2, 3]
			const binaryData = new Int8Array([
				// number of blobs [0-3]
				0, 0, 0, 1,
				// blob id 1 [4-12]
				100, -9, -69, 22, 38, -128, 0, 0, 1,
				// blob hash 1 [13-18]
				3, -112, 88, -58, -14, -64,
				// blob size 1 [19-22]
				0, 0, 0, 3,
				// blob data 1 [23-25]
				1, 2, 3,
			])

			const result = parseMultipleBlobsResponse(new Uint8Array(binaryData))
			o(result).deepEquals(new Map([["OETv4XP----0", new Uint8Array([1, 2, 3])]]))
		})

		o.test("parses blob with big size", function () {
			// Blob id OETv4XP----0 hash [3, -112, 88, -58, -14, -64] bytes [1, 2, 3]
			const blobDataNumbers = Array(384).fill(1)
			const binaryData = new Int8Array(
				[
					// number of blobs [0-3]
					0, 0, 0, 1,
					// blob id 1 [4-12]
					100, -9, -69, 22, 38, -128, 0, 0, 1,
					// blob hash 1 [13-18]
					3, -112, 88, -58, -14, -64,
					// blob size 1 [19-22]
					0, 0, 1, 128,
				].concat(blobDataNumbers),
			)

			const result = parseMultipleBlobsResponse(new Uint8Array(binaryData))
			o(result).deepEquals(new Map([["OETv4XP----0", new Uint8Array(blobDataNumbers)]]))
		})

		o.test("parse empty blob response", function () {
			const binaryData = new Int8Array([
				// number of blobs [0-3]
				0, 0, 0, 0,
			])

			const result = parseMultipleBlobsResponse(new Uint8Array(binaryData))
			o(result).deepEquals(new Map<Id, Uint8Array>())
		})
	})

	o.spec("pipelineEncryptAndUpload", function () {
		o.test("processes an even number of chunks completely", async function () {
			const items = [1, 2, 3, 4]
			const fetchNextChunk = async () => items.shift()
			const encryptChunk = async (chunk): Promise<`encrypted-${number}`> => {
				return `encrypted-${chunk}`
			}
			const uploadEncryptedChunk = async (encrypted: `encrypted-${number}`): Promise<BlobReferenceTokenWrapper> => {
				return createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: `token for ${encrypted}` })
			}
			const disposeUnencryptedChunk = func() as (chunk: number) => Promise<void>
			const disposeEncryptedChunk = func() as (chunk: `encrypted-${number}`) => Promise<void>

			const generator = pipelineEncryptAndUpload(
				fetchNextChunk,
				encryptChunk,
				uploadEncryptedChunk,
				new AbortController().signal,
				disposeUnencryptedChunk,
				disposeEncryptedChunk,
			)
			const chunks: `encrypted-${number}`[] = []
			const refTokens: string[] = []
			for await (const [chunk, referenceToken] of generator) {
				chunks.push(chunk)
				refTokens.push(referenceToken.blobReferenceToken)
			}

			o.check(chunks).deepEquals(["encrypted-1", "encrypted-2", "encrypted-3", "encrypted-4"])
			o.check(refTokens).deepEquals(["token for encrypted-1", "token for encrypted-2", "token for encrypted-3", "token for encrypted-4"])
			verify(disposeUnencryptedChunk(1))
			verify(disposeUnencryptedChunk(2))
			verify(disposeUnencryptedChunk(3))
			verify(disposeUnencryptedChunk(4))
			verify(disposeEncryptedChunk("encrypted-1"))
			verify(disposeEncryptedChunk("encrypted-2"))
			verify(disposeEncryptedChunk("encrypted-3"))
			verify(disposeEncryptedChunk("encrypted-4"))
		})
		o.test("processes an odd number of chunks completely", async function () {
			const items = [1, 2, 3]
			const fetchNextChunk = async () => items.shift()
			const encryptChunk = async (chunk): Promise<`encrypted-${number}`> => {
				return `encrypted-${chunk}`
			}
			const uploadEncryptedChunk = async (encrypted: `encrypted-${number}`): Promise<BlobReferenceTokenWrapper> => {
				return createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: `token for ${encrypted}` })
			}
			const disposeUnencryptedChunk = func() as (chunk: number) => Promise<void>
			const disposeEncryptedChunk = func() as (chunk: `encrypted-${number}`) => Promise<void>

			const generator = pipelineEncryptAndUpload(
				fetchNextChunk,
				encryptChunk,
				uploadEncryptedChunk,
				new AbortController().signal,
				disposeUnencryptedChunk,
				disposeEncryptedChunk,
			)
			const chunks: `encrypted-${number}`[] = []
			const refTokens: string[] = []
			for await (const [chunk, referenceToken] of generator) {
				chunks.push(chunk)
				refTokens.push(referenceToken.blobReferenceToken)
			}

			o.check(chunks).deepEquals(["encrypted-1", "encrypted-2", "encrypted-3"])
			o.check(refTokens).deepEquals(["token for encrypted-1", "token for encrypted-2", "token for encrypted-3"])
			verify(disposeUnencryptedChunk(1))
			verify(disposeUnencryptedChunk(2))
			verify(disposeUnencryptedChunk(3))
			verify(disposeEncryptedChunk("encrypted-1"))
			verify(disposeEncryptedChunk("encrypted-2"))
			verify(disposeEncryptedChunk("encrypted-3"))
		})
		o.test("encrypts next chunk before the previous one has finished uploading", async function () {
			// We are testing that encrypt and upload are running in parallel at every step (except the first where
			// we encrypt one item ahead).
			// +-------+-----+-----+-----+
			// |step   |0    |1    |2    |
			// +-------+-----+-----+-----+
			// |encrypt|item1|item2|item3|
			// +-------+-----+-----+-----+
			// |upload |     |item1|item2|
			// +-------+-----+-----+-----+

			type UnencryptedItem = { value: number }
			type EncryptedItem = { value: string }
			const item1 = { value: 1 }
			const item2 = { value: 2 }
			const item3 = { value: 3 }
			const items = [item1, item2, item3]
			const fetchNextChunk = async (): Promise<UnencryptedItem | null> => items.shift() ?? null
			const encryptChunk = func() as (_: UnencryptedItem) => Promise<EncryptedItem>
			when(encryptChunk(matchers.anything())).thenDo(({ value }: UnencryptedItem) => {
				return { value: String(value) }
			})

			// we want to wait for item2 to be uploaded
			const item2UploadFinished = defer<BlobReferenceTokenWrapper>()
			const item2UploadStarted = defer<void>()
			const uploadChunk = (item: EncryptedItem): Promise<BlobReferenceTokenWrapper> => {
				if (item.value === "2") {
					item2UploadStarted.resolve()
					return item2UploadFinished.promise
				} else {
					return Promise.resolve(createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: item.value }))
				}
			}

			const generator = pipelineEncryptAndUpload<UnencryptedItem, EncryptedItem>(
				fetchNextChunk,
				encryptChunk,
				uploadChunk,
				new AbortController().signal,
				async () => {},
				async () => {},
			)
			// the first step will encrypt item1, encrypt item2 chunk and upload item1
			await generator.next()
			// the second step will encrypt item3 and item2, except we manually postpone the upload for the second one
			generator.next()
			await item2UploadStarted.promise
			// even though we never finished the upload for item2, item 3 is already being encrypted
			verify(encryptChunk(item3))
			item2UploadFinished.resolve(createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: "3" }))
		})
	})
	o.spec("serializeNewBlobsInChunks", function () {
		o.test("serializeNewBlobsInBinaryChunks splits blobs by max size", function () {
			const sessionKey1 = aes256RandomKey()
			const firstBlob: KeyedNewBlobWrapper = {
				sessionKey: sessionKey1,
				newBlobWrapper: {
					hash: new Uint8Array([1, 2, 3, 4, 5, 6]),
					data: new Uint8Array([1, 2, 3]),
				},
			}

			const sessionKey2 = aes256RandomKey()
			const secondBlob: KeyedNewBlobWrapper = {
				sessionKey: sessionKey2,
				newBlobWrapper: {
					hash: new Uint8Array([4, 5, 6, 2, 3, 5]),
					data: new Uint8Array([1, 2, 3, 4, 5, 6]),
				},
			}

			const result = serializeNewBlobsInBinaryChunks(
				[firstBlob, secondBlob],
				13, // force chunk size to 13 bytes
				MAX_NUMBER_OF_BLOBS_IN_BINARY,
			)

			o(result.length).deepEquals(2)

			o(result[0].sessionKeys).deepEquals([sessionKey1])
			o(result[1].sessionKeys).deepEquals([sessionKey2])

			o(result[0].binary.length > 0).equals(true)
			o(result[1].binary.length > 0).equals(true)
		})
		o.test("serializeNewBlobsInBinaryChunks does not exceed max blobs per chunk", function () {
			const sessionKey1 = aes256RandomKey()
			const firstBlob: KeyedNewBlobWrapper = {
				sessionKey: sessionKey1,
				newBlobWrapper: {
					hash: new Uint8Array([1, 2, 3, 4, 5, 6]),
					data: new Uint8Array([1, 2, 3]),
				},
			}

			const sessionKey2 = aes256RandomKey()
			const secondBlob: KeyedNewBlobWrapper = {
				sessionKey: sessionKey2,
				newBlobWrapper: {
					hash: new Uint8Array([4, 5, 6, 2, 3, 5]),
					data: new Uint8Array([1, 2, 3, 4, 5, 6]),
				},
			}

			const result = serializeNewBlobsInBinaryChunks(
				[firstBlob, secondBlob],
				MAX_BLOB_SIZE_BYTES,
				1, // force single blob per chunk
			)

			o(result.length).deepEquals(2)

			o(result[0].sessionKeys).deepEquals([sessionKey1])
			o(result[1].sessionKeys).deepEquals([sessionKey2])
		})
	})

	o.spec("downloadFullEncryptedBlobElementEntityArchive", () => {
		o.test("downloads all encrypted entities", async () => {
			const archiveId = "some-archive"
			const clientTypeModel = {
				app: MailDetailsBlobTypeRef.app,
				name: "MailDetailsBlob",
				version: 123,
				dependsOnVersion: 456,
			} as ClientTypeModel
			when(typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)).thenResolve(clientTypeModel)

			const blobServerAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				servers: [
					createBlobServerUrl({
						url: "https://blobworld.net",
					}),
				],
			})
			when(blobAccessTokenFacade.requestReadTokenArchive(archiveId)).thenResolve(blobServerAccessInfo)

			const someQueryParams = {
				"whoooo query params": "let's go!!!!",
			}
			when(blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, {}, MailDetailsBlobTypeRef)).thenResolve(someQueryParams)

			const serverTypeModel = {
				app: MailDetailsBlobTypeRef.app,
				name: "MailDetailsBlob",
			} as ServerTypeModel
			when(typeModelResolver.resolveServerTypeReference(MailDetailsBlobTypeRef)).thenResolve(serverTypeModel)

			const mailDetailsBlobs = [
				createTestEntity(MailDetailsBlobTypeRef, {}, { populateAggregates: true }),
				createTestEntity(MailDetailsBlobTypeRef, {}, { populateAggregates: true }),
				createTestEntity(MailDetailsBlobTypeRef, {}, { populateAggregates: true }),
			]
			const encryptedBlobsJson = await promiseMap(mailDetailsBlobs, (b) =>
				realInstancePipeline.mapAndEncryptToParsedInstance(MailDetailsBlobTypeRef, b, aes256RandomKey()),
			)
			const serverResponse = OutgoingServerJson.getJsonRepresentationOfMultiple(
				await Promise.all(
					encryptedBlobsJson.map((i) => {
						return realInstancePipeline.typeMapper.makeServerJson(i)
					}),
				),
			)
			when(
				restClientMock.request(
					`/rest/tutanota/maildetailsblob/${archiveId}`,
					HttpMethod.GET,
					matchers.argThat(
						(arg) => arg.baseUrl === "https://blobworld.net" && arg.responseType === MediaType.Json && arg.queryParams === someQueryParams,
					),
				),
			).thenResolve(serverResponse)

			const downloadedBlobs = (await blobFacade.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, archiveId)).map((j) =>
				j.getInnerJson(),
			)
			const expectedBlobs = (await Promise.all(encryptedBlobsJson.map((e) => realInstancePipeline.typeMapper.makeServerJson(e)))).map((j) =>
				j.getInnerJsonForTest(),
			)
			o.check(downloadedBlobs).deepEquals(expectedBlobs)
		})
	})
})

function wrapTutanotaFile(tutanotaFile: File): BlobReferencingInstance {
	return {
		blobs: tutanotaFile.blobs,
		elementId: elementIdPart(tutanotaFile._id),
		listId: listIdPart(tutanotaFile._id),
		entity: tutanotaFile,
	}
}

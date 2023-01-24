import o from "ospec"
import { ArchiveDataType } from "../../../../../src/api/common/TutanotaConstants.js"
import { createBlob } from "../../../../../src/api/entities/sys/TypeRefs.js"
import { createFile, createMailBody } from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import { ServiceExecutor } from "../../../../../src/api/worker/rest/ServiceExecutor.js"
import { matchers, object, verify, when } from "testdouble"
import { BlobAccessTokenService } from "../../../../../src/api/entities/storage/Services.js"
import { getElementId, getEtId, getListId } from "../../../../../src/api/common/utils/EntityUtils.js"
import { Mode } from "../../../../../src/api/common/Env.js"
import {
	createBlobAccessTokenPostIn,
	createBlobAccessTokenPostOut,
	createBlobReadData,
	createBlobServerAccessInfo,
	createBlobWriteData,
	createInstanceId,
} from "../../../../../src/api/entities/storage/TypeRefs.js"
import { BlobAccessTokenFacade } from "../../../../../src/api/worker/facades/BlobAccessTokenFacade.js"
import { DateProviderImpl } from "../../../../../src/calendar/date/CalendarUtils.js"

const { anything, captor } = matchers

o.spec("BlobAccessTokenFacade test", function () {
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let serviceMock: ServiceExecutor
	let archiveDataType = ArchiveDataType.Attachments
	const archiveId = "archiveId1"
	const blobId1 = "blobId1"
	const blobs = [createBlob({ archiveId, blobId: blobId1 }), createBlob({ archiveId, blobId: "blobId2" }), createBlob({ archiveId })]

	o.beforeEach(function () {
		serviceMock = object<ServiceExecutor>()
		blobAccessTokenFacade = new BlobAccessTokenFacade(serviceMock, new DateProviderImpl())
	})

	o.afterEach(function () {
		env.mode = Mode.Browser
	})

	o.spec("request access tokens", function () {
		o.spec("read token for specific blobs", function () {
			o("read token LET", async function () {
				const file = createFile({ blobs, _id: ["listId", "elementId"] })
				const expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo: createBlobServerAccessInfo({ blobAccessToken: "123" }) })
				when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, blobs, file)

				const tokenRequest = captor()
				verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
				let instanceId = createInstanceId({ instanceId: getElementId(file) })
				o(tokenRequest.value).deepEquals(
					createBlobAccessTokenPostIn({
						archiveDataType,
						read: createBlobReadData({
							archiveId,
							instanceListId: getListId(file),
							instanceIds: [instanceId],
						}),
					}),
				)
				o(readToken).equals(expectedToken.blobAccessInfo)
			})

			o("read token ET", async function () {
				const mailBody = createMailBody({ _id: "elementId" })
				const expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo: createBlobServerAccessInfo({ blobAccessToken: "123" }) })
				when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, blobs, mailBody)

				const tokenRequest = captor()
				verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
				let instanceId = createInstanceId({ instanceId: getEtId(mailBody) })
				o(tokenRequest.value).deepEquals(
					createBlobAccessTokenPostIn({
						archiveDataType,
						read: createBlobReadData({
							archiveId,
							instanceListId: null,
							instanceIds: [instanceId],
						}),
					}),
				)
				o(readToken).equals(expectedToken.blobAccessInfo)
			})
		})

		o("request read token archive", async function () {
			let blobAccessInfo = createBlobServerAccessInfo({ blobAccessToken: "123" })
			const expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(null, archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(
				createBlobAccessTokenPostIn({
					read: createBlobReadData({
						archiveId,
						instanceListId: null,
						instanceIds: [],
					}),
				}),
			)
			o(readToken).equals(blobAccessInfo)
		})

		o("cache read token for an entire archive", async function () {
			let blobAccessInfo = createBlobServerAccessInfo({ blobAccessToken: "123" })
			const expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(null, archiveId)
			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(null, archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(1) // only one call because of caching!
			o(readToken).equals(blobAccessInfo) // correct token returned
		})

		o("cache read token archive expired", async function () {
			let expires = new Date(2022, 11, 17) // date in the past, so the token is expired
			let blobAccessInfo = createBlobServerAccessInfo({ blobAccessToken: "123", expires })
			let expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(null, archiveId)

			blobAccessInfo = createBlobServerAccessInfo({ blobAccessToken: "456" })
			expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(null, archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(2) // only one call because of caching!
			o(readToken.blobAccessToken).equals("456") // correct token returned
		})

		o("request write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo: createBlobServerAccessInfo({ blobAccessToken: "123" }) })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(
				createBlobAccessTokenPostIn({
					archiveDataType,
					write: createBlobWriteData({
						archiveOwnerGroup: ownerGroup,
					}),
				}),
			)
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo: createBlobServerAccessInfo({ blobAccessToken: "123" }) })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)
			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(1)
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token expired", async function () {
			let expires = new Date(2022, 11, 17) // date in the past, so the token is expired
			const ownerGroup = "ownerId"
			let expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo: createBlobServerAccessInfo({ blobAccessToken: "123", expires }) })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			expectedToken = createBlobAccessTokenPostOut({ blobAccessInfo: createBlobServerAccessInfo({ blobAccessToken: "456" }) })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(2)
			o(writeToken.blobAccessToken).equals("456")
		})
	})
})

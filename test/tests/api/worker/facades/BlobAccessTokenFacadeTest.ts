import o from "@tutao/otest"
import { ArchiveDataType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { matchers, object, verify, when } from "testdouble"
import { BlobAccessTokenService } from "../../../../../src/common/api/entities/storage/Services.js"
import { getElementId, getEtId, getListId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { Mode } from "../../../../../src/common/api/common/Env.js"
import { BlobAccessTokenFacade, BlobReferencingInstance } from "../../../../../src/common/api/worker/facades/BlobAccessTokenFacade.js"
import { DateTime } from "luxon"
import { AuthDataProvider } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import {
	BlobAccessTokenPostInTypeRef,
	BlobAccessTokenPostOutTypeRef,
	BlobReadDataTypeRef,
	BlobServerAccessInfoTypeRef,
	BlobWriteDataTypeRef,
	InstanceIdTypeRef,
} from "../../../../../src/common/api/entities/storage/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { FileTypeRef, MailBoxTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { BlobTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"

const { anything, captor } = matchers

o.spec("BlobAccessTokenFacade test", function () {
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let serviceMock: ServiceExecutor
	let archiveDataType = ArchiveDataType.Attachments
	let authDataProvider: AuthDataProvider
	const archiveId = "archiveId1"
	const blobId1 = "blobId1"
	const blobs = [
		createTestEntity(BlobTypeRef, { archiveId, blobId: blobId1 }),
		createTestEntity(BlobTypeRef, { archiveId, blobId: "blobId2" }),
		createTestEntity(BlobTypeRef, { archiveId }),
	]
	let now: DateTime

	o.beforeEach(function () {
		now = DateTime.fromISO("2022-11-17T00:00:00")
		const dateProvider = {
			now: () => now.toMillis(),
			timeZone: () => "Europe/Berlin",
		}
		serviceMock = object<ServiceExecutor>()
		authDataProvider = object<AuthDataProvider>()
		blobAccessTokenFacade = new BlobAccessTokenFacade(serviceMock, dateProvider, authDataProvider)
	})

	o.afterEach(function () {
		env.mode = Mode.Browser
	})

	o.spec("evict Tokens", function () {
		o("evict blob specific read token", async function () {
			const file = createTestEntity(FileTypeRef, { blobs, _id: ["listId", "elementId"] })
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)
			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: file,
				elementId: getElementId(file),
				listId: getListId(file),
			}
			await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance)

			blobAccessTokenFacade.evictReadBlobsToken(referencingInstance)
			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance)
			o(readToken).equals(newToken.blobAccessInfo)
		})

		o("evict archive read token", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" })
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)
			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			blobAccessTokenFacade.evictArchiveToken(archiveId)
			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			o(readToken).equals(newToken.blobAccessInfo)
		})

		o("evict archive write token", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" })
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)
			const ownerGroupId = "ownerGroupId"
			const archiveDataType = ArchiveDataType.Attachments
			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)

			blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)
			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			o(readToken).equals(newToken.blobAccessInfo)
		})
	})

	o.spec("request access tokens", function () {
		o.spec("read token for specific blobs", function () {
			o("read token LET", async function () {
				const file = createTestEntity(FileTypeRef, { blobs, _id: ["listId", "elementId"] })
				const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
					blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" }),
				})
				when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

				const referencingInstance: BlobReferencingInstance = {
					blobs,
					entity: file,
					elementId: getElementId(file),
					listId: getListId(file),
				}
				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance)

				const tokenRequest = captor()
				verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
				let instanceId = createTestEntity(InstanceIdTypeRef, { instanceId: getElementId(file) })
				o(tokenRequest.value).deepEquals(
					createTestEntity(BlobAccessTokenPostInTypeRef, {
						archiveDataType,
						read: createTestEntity(BlobReadDataTypeRef, {
							archiveId,
							instanceListId: getListId(file),
							instanceIds: [instanceId],
						}),
					}),
				)
				o(readToken).equals(expectedToken.blobAccessInfo)
			})

			o("read token ET", async function () {
				const mailBox = createTestEntity(MailBoxTypeRef, { _id: "elementId" })
				const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
					blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" }),
				})
				when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

				const referencingInstance: BlobReferencingInstance = {
					blobs,
					entity: mailBox,
					listId: null,
					elementId: mailBox._id,
				}
				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance)

				const tokenRequest = captor()
				verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
				let instanceId = createTestEntity(InstanceIdTypeRef, { instanceId: getEtId(mailBox) })
				o(tokenRequest.value).deepEquals(
					createTestEntity(BlobAccessTokenPostInTypeRef, {
						archiveDataType,
						read: createTestEntity(BlobReadDataTypeRef, {
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
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" })
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(
				createTestEntity(BlobAccessTokenPostInTypeRef, {
					read: createTestEntity(BlobReadDataTypeRef, {
						archiveId,
						instanceListId: null,
						instanceIds: [],
					}),
				}),
			)
			o(readToken).equals(blobAccessInfo)
		})

		o("cache read token for an entire archive", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" })
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(1) // only one call because of caching!
			o(readToken).equals(blobAccessInfo) // correct token returned
		})

		o("cache read token archive expired", async function () {
			let expires = new Date(now.toMillis() - 1) // date in the past, so the token is expired
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123", expires })
			let expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" })
			expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(2) // only one call because of caching!
			o(readToken.blobAccessToken).equals("456") // correct token returned
		})

		o("request write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(
				createTestEntity(BlobAccessTokenPostInTypeRef, {
					archiveDataType,
					write: createTestEntity(BlobWriteDataTypeRef, {
						archiveOwnerGroup: ownerGroup,
					}),
				}),
			)
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)
			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(1)
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token expired", async function () {
			let expires = new Date(now.toMillis() - 1) // date in the past, so the token is expired
			const ownerGroup = "ownerId"
			let expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123", expires }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(2)
			o(writeToken.blobAccessToken).equals("456")
		})
	})
})

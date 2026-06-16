import o from "@tutao/otest"
import { ServiceExecutor } from "../../../../src/platform-kit/network/ServiceExecutor"
import { matchers, object, verify, when } from "testdouble"
import { getElementId, getEtId, getListId } from "../../../../src/platform-kit/meta"
import { BlobAccessTokenFacade } from "../../../../src/platform-kit/network/BlobAccessTokenFacade.js"
import { DateTime } from "luxon"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../TestUtils.js"
import { LoggedInUserProvider } from "../../../../src/platform-kit/instance-pipeline"
import { FileTypeRef, MailBoxTypeRef } from "@tutao/entities/tutanota"
import {
	BlobAccessTokenPostOutTypeRef,
	BlobAccessTokenService,
	BlobServerAccessInfoTypeRef,
	createBlobAccessTokenPostIn,
	createBlobReadData,
	createBlobWriteData,
	createInstanceId,
} from "@tutao/entities/storage"

import { BlobTypeRef } from "@tutao/entities/sys"
import { ArchiveDataType, BlobAccessTokenKind } from "../../../../src/entities/sys/Utils"
import { BlobReferencingInstance } from "../../../../src/entities/storage/BlobUtils"

import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../src/platform-kit/instance-pipeline/RestClientOptions"

const { anything, captor } = matchers

o.spec("BlobAccessTokenFacade", function () {
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let serviceMock: ServiceExecutor
	let archiveDataType = ArchiveDataType.Attachments
	let authDataProvider: LoggedInUserProvider
	const archiveId = "archiveId1"
	const blobId1 = "blobId1"
	const blobs = [
		createTestEntity(BlobTypeRef, { archiveId, blobId: blobId1 }),
		createTestEntity(BlobTypeRef, { archiveId, blobId: "blobId2" }),
		createTestEntity(BlobTypeRef, { archiveId }),
	]
	const now = DateTime.fromISO("2022-11-17T00:00:00")
	const afterNow = now.plus({ minute: 1 })

	o.beforeEach(function () {
		const dateProvider = {
			now: () => now.toMillis(),
			timeZone: () => "Europe/Berlin",
		}
		serviceMock = object<ServiceExecutor>()
		authDataProvider = object<LoggedInUserProvider>()
		blobAccessTokenFacade = new BlobAccessTokenFacade(serviceMock, authDataProvider, dateProvider, clientInitializedTypeModelResolver())
	})

	o.spec("evict Tokens", function () {
		o("evict blob specific read token", async function () {
			const file = createTestEntity(FileTypeRef, { blobs, _id: ["listId", "elementId"] })
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					expires: afterNow.toJSDate(),
					tokenKind: BlobAccessTokenKind.Instances,
				}),
			})
			const loadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
			when(serviceMock.post(BlobAccessTokenService, anything(), loadOptions)).thenResolve(expectedToken)
			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: file,
				elementId: getElementId(file),
				listId: getListId(file),
			}
			await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)

			blobAccessTokenFacade.evictReadBlobsToken(referencingInstance)
			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), loadOptions)).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)
			const blobAccessInfos = new Map([[archiveId, newToken.blobAccessInfo]])
			o(readToken).deepEquals(blobAccessInfos)
		})

		o("evict archive read token", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: afterNow.toJSDate(),
			})
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			blobAccessTokenFacade.evictArchiveToken(archiveId)

			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			o(readToken).deepEquals(newToken.blobAccessInfo)
		})

		o("evict archive write token", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: afterNow.toJSDate(),
			})
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)
			const ownerGroupId = "ownerGroupId"
			const archiveDataType = ArchiveDataType.Attachments
			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)

			blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)

			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			o(readToken).equals(newToken.blobAccessInfo)
		})
	})

	o.spec("request access tokens", function () {
		o.spec("read token for specific blobs", function () {
			o("read token LET", async function () {
				const file = createTestEntity(FileTypeRef, { blobs, _id: ["listId", "elementId"] })
				const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
					blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, {
						blobAccessToken: "123",
						expires: afterNow.toJSDate(),
					}),
				})
				const loadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
				when(serviceMock.post(BlobAccessTokenService, anything(), loadOptions)).thenResolve(expectedToken)

				const referencingInstance: BlobReferencingInstance = {
					blobs,
					entity: file,
					elementId: getElementId(file),
					listId: getListId(file),
				}
				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)

				const tokenRequest = captor()
				verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), loadOptions))
				let instanceId = createInstanceId({ instanceId: getElementId(file) })
				o(tokenRequest.value).deepEquals(
					createBlobAccessTokenPostIn({
						archiveDataType,
						read: createBlobReadData({
							archiveId,
							instanceListId: getListId(file),
							instanceIds: [instanceId],
						}),
						write: null,
					}),
				)
				const blobAccessInfos = new Map([[archiveId, expectedToken.blobAccessInfo]])
				o(readToken).deepEquals(blobAccessInfos)
			})

			o("read token ET", async function () {
				const mailBox = createTestEntity(MailBoxTypeRef, { _id: "elementId" })
				const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
					blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, {
						blobAccessToken: "123",
						expires: new Date(now.toMillis() + 1000),
					}),
				})
				const loadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
				when(serviceMock.post(BlobAccessTokenService, anything(), loadOptions)).thenResolve(expectedToken)

				const referencingInstance: BlobReferencingInstance = {
					blobs,
					entity: mailBox,
					listId: null,
					elementId: mailBox._id,
				}

				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)

				const tokenRequest = captor()
				verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), loadOptions))
				let instanceId = createInstanceId({ instanceId: getEtId(mailBox) })
				o(tokenRequest.value).deepEquals(
					createBlobAccessTokenPostIn({
						archiveDataType,
						read: createBlobReadData({
							archiveId,
							instanceListId: null,
							instanceIds: [instanceId],
						}),
						write: null,
					}),
				)
				const blobAccessInfos = new Map([[archiveId, expectedToken.blobAccessInfo]])
				o(readToken).deepEquals(blobAccessInfos)
			})
		})

		o("request read token archive", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
			})
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), null))
			o(tokenRequest.value).deepEquals(
				createBlobAccessTokenPostIn({
					read: createBlobReadData({
						archiveId,
						instanceListId: null,
						instanceIds: [],
					}),
					archiveDataType: null,
					write: null,
				}),
			)
			o(readToken).equals(blobAccessInfo)
		})

		o("cache read token for an entire archive", async function () {
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
			})

			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), null))
			o(tokenRequest.values!.length).equals(1)("Only one call to request the token") // only one call because of caching!
			o(readToken).equals(blobAccessInfo) // correct token returned
		})

		o("when requested individual blobs but the server responded with archive token, the token is cached for the archive", async function () {
			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})

			const blobLoadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(expectedToken)
			const mailBox = createTestEntity(MailBoxTypeRef, { _id: "elementId" })
			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: mailBox,
				listId: null,
				elementId: mailBox._id,
			}

			await blobAccessTokenFacade.requestReadTokenBlobs(ArchiveDataType.Attachments, referencingInstance, blobLoadOptions)

			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			o(readToken).deepEquals(blobAccessInfo)
			verify(serviceMock.post(BlobAccessTokenService, anything()), { times: 1, ignoreExtraArgs: true })
		})

		o("when requested individual blobs and the server responded with instance token, the token is cached for the instances", async function () {
			const blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})

			const blobLoadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(expectedToken)
			const mailBox1 = createTestEntity(MailBoxTypeRef, { _id: "elementId1" })
			const mailBox2 = createTestEntity(MailBoxTypeRef, { _id: "elementId2" })
			const referencingInstance1: BlobReferencingInstance = {
				blobs,
				entity: mailBox1,
				listId: null,
				elementId: mailBox1._id,
			}
			const referencingInstance2: BlobReferencingInstance = {
				blobs,
				entity: mailBox2,
				listId: null,
				elementId: mailBox2._id,
			}

			await blobAccessTokenFacade.requestReadTokenMultipleInstances(
				ArchiveDataType.Attachments,
				[referencingInstance1, referencingInstance2],
				blobLoadOptions,
			)
			const readToken = await blobAccessTokenFacade.requestReadTokenMultipleInstances(
				ArchiveDataType.Attachments,
				[referencingInstance1],
				blobLoadOptions,
			)

			o(readToken).deepEquals(blobAccessInfo)
			verify(serviceMock.post(BlobAccessTokenService, anything()), { times: 1, ignoreExtraArgs: true })
		})

		o("when requested individual blobs and the server responded with instance token that expired, new token is requested", async function () {
			const blobLoadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
			const expiredAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() - 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const expiredToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo: expiredAccessInfo })
			const newAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo: newAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(expiredToken)
			const mailBox1 = createTestEntity(MailBoxTypeRef, { _id: "elementId1" })
			const mailBox2 = createTestEntity(MailBoxTypeRef, { _id: "elementId2" })
			const referencingInstance1: BlobReferencingInstance = {
				blobs,
				entity: mailBox1,
				listId: null,
				elementId: mailBox1._id,
			}
			const referencingInstance2: BlobReferencingInstance = {
				blobs,
				entity: mailBox2,
				listId: null,
				elementId: mailBox2._id,
			}

			await blobAccessTokenFacade.requestReadTokenMultipleInstances(
				ArchiveDataType.Attachments,
				[referencingInstance1, referencingInstance2],
				blobLoadOptions,
			)

			when(serviceMock.post(BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(newToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenMultipleInstances(
				ArchiveDataType.Attachments,
				[referencingInstance1],
				blobLoadOptions,
			)

			o(readToken).deepEquals(newAccessInfo)
			verify(serviceMock.post(BlobAccessTokenService, anything()), { times: 2, ignoreExtraArgs: true })
		})

		o("when requested individual blobs but the server responded with archive token that expired, new token is requested", async function () {
			const blobLoadOptions = DEFAULT_EXTRA_SERVICE_PARAMS
			const expiredAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() - 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const expiredToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo: expiredAccessInfo })
			const newAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const newToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo: newAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expiredToken)
			const mailBox1 = createTestEntity(MailBoxTypeRef, { _id: "elementId1" })

			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: mailBox1,
				listId: null,
				elementId: mailBox1._id,
			}

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			when(serviceMock.post(BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(newToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenMultipleInstances(ArchiveDataType.Attachments, [referencingInstance], blobLoadOptions)

			o(readToken).deepEquals(newAccessInfo)
			verify(serviceMock.post(BlobAccessTokenService, anything()), { times: 2, ignoreExtraArgs: true })
		})

		o("cache read token archive expired", async function () {
			let expires = new Date(now.toMillis() - 1) // date in the past, so the token is expired
			let blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123", expires })
			let expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			blobAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken: "456",
				expires: new Date(now.toMillis() + 1000),
			})
			expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), null))
			o(tokenRequest.values!.length).equals(2) // only one call because of caching!
			o(readToken.blobAccessToken).equals("456") // correct token returned
		})

		o("request write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					expires: new Date(now.toMillis() + 1000),
				}),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), null))
			o(tokenRequest.value).deepEquals(
				createBlobAccessTokenPostIn({
					archiveDataType,
					read: null,
					write: createBlobWriteData({
						archiveOwnerGroup: ownerGroup,
					}),
				}),
			)
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					expires: new Date(now.toMillis() + 1000),
				}),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)
			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), null))
			o(tokenRequest.values!.length).equals(1)("only one request for token")
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token expired", async function () {
			let expires = new Date(now.toMillis() - 1) // date in the past, so the token is expired
			const ownerGroup = "ownerId"
			let expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, { blobAccessToken: "123", expires }),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			expectedToken = createTestEntity(BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(BlobServerAccessInfoTypeRef, {
					blobAccessToken: "456",
					expires: new Date(now.toMillis() + 1000),
				}),
			})
			when(serviceMock.post(BlobAccessTokenService, anything(), null)).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(BlobAccessTokenService, tokenRequest.capture(), null))
			o(tokenRequest.values!.length).equals(2)("only one request for token")
			o(writeToken.blobAccessToken).equals("456")
		})
	})
})

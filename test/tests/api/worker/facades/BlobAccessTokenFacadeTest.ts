import o from "@tutao/otest"
import { ArchiveDataType, BlobAccessTokenKind } from "@tutao/appEnv"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { matchers, object, verify, when } from "testdouble"
import { getElementId, getEtId, getListId, storageTypeRefs, storageServices, tutanotaTypeRefs, sysTypeRefs } from "@tutao/typeRefs"
import { BlobAccessTokenFacade } from "../../../../../src/common/api/worker/facades/BlobAccessTokenFacade.js"
import { DateTime } from "luxon"
import { AuthDataProvider } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils.js"
import { BlobReferencingInstance } from "../../../../../src/common/api/common/utils/BlobUtils.js"

const { anything, captor } = matchers

o.spec("BlobAccessTokenFacade", function () {
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let serviceMock: ServiceExecutor
	let archiveDataType = ArchiveDataType.Attachments
	let authDataProvider: AuthDataProvider
	const archiveId = "archiveId1"
	const blobId1 = "blobId1"
	const blobs = [
		createTestEntity(sysTypeRefs.BlobTypeRef, { archiveId, blobId: blobId1 }),
		createTestEntity(sysTypeRefs.BlobTypeRef, { archiveId, blobId: "blobId2" }),
		createTestEntity(sysTypeRefs.BlobTypeRef, { archiveId }),
	]
	const now = DateTime.fromISO("2022-11-17T00:00:00")
	const afterNow = now.plus({ minute: 1 })

	o.beforeEach(function () {
		const dateProvider = {
			now: () => now.toMillis(),
			timeZone: () => "Europe/Berlin",
		}
		serviceMock = object<ServiceExecutor>()
		authDataProvider = object<AuthDataProvider>()
		blobAccessTokenFacade = new BlobAccessTokenFacade(serviceMock, authDataProvider, dateProvider, clientInitializedTypeModelResolver())
	})

	o.spec("evict Tokens", function () {
		o("evict blob specific read token", async function () {
			const file = createTestEntity(tutanotaTypeRefs.FileTypeRef, { blobs, _id: ["listId", "elementId"] })
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					expires: afterNow.toJSDate(),
					tokenKind: BlobAccessTokenKind.Instances,
				}),
			})
			const loadOptions = {}
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), loadOptions)).thenResolve(expectedToken)
			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: file,
				elementId: getElementId(file),
				listId: getListId(file),
			}
			await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)

			blobAccessTokenFacade.evictReadBlobsToken(referencingInstance)
			const newToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), loadOptions)).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)
			const blobAccessInfos = new Map([[archiveId, newToken.blobAccessInfo]])
			o(readToken).deepEquals(blobAccessInfos)
		})

		o("evict archive read token", async function () {
			let blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: afterNow.toJSDate(),
			})
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			blobAccessTokenFacade.evictArchiveToken(archiveId)

			const newToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			o(readToken).deepEquals(newToken.blobAccessInfo)
		})

		o("evict archive write token", async function () {
			let blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: afterNow.toJSDate(),
			})
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)
			const ownerGroupId = "ownerGroupId"
			const archiveDataType = ArchiveDataType.Attachments
			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)

			blobAccessTokenFacade.evictWriteToken(archiveDataType, ownerGroupId)

			const newToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, { blobAccessToken: "456" }),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(newToken)
			const readToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroupId)
			o(readToken).equals(newToken.blobAccessInfo)
		})
	})

	o.spec("request access tokens", function () {
		o.spec("read token for specific blobs", function () {
			o("read token LET", async function () {
				const file = createTestEntity(tutanotaTypeRefs.FileTypeRef, { blobs, _id: ["listId", "elementId"] })
				const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
					blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
						blobAccessToken: "123",
						expires: afterNow.toJSDate(),
					}),
				})
				const loadOptions = {}
				when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), loadOptions)).thenResolve(expectedToken)

				const referencingInstance: BlobReferencingInstance = {
					blobs,
					entity: file,
					elementId: getElementId(file),
					listId: getListId(file),
				}
				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)

				const tokenRequest = captor()
				verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture(), loadOptions))
				let instanceId = storageTypeRefs.createInstanceId({ instanceId: getElementId(file) })
				o(tokenRequest.value).deepEquals(
					storageTypeRefs.createBlobAccessTokenPostIn({
						archiveDataType,
						read: storageTypeRefs.createBlobReadData({
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
				const mailBox = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId" })
				const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
					blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
						blobAccessToken: "123",
						expires: new Date(now.toMillis() + 1000),
					}),
				})
				const loadOptions = {}
				when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), loadOptions)).thenResolve(expectedToken)

				const referencingInstance: BlobReferencingInstance = {
					blobs,
					entity: mailBox,
					listId: null,
					elementId: mailBox._id,
				}

				const readToken = await blobAccessTokenFacade.requestReadTokenBlobs(archiveDataType, referencingInstance, loadOptions)

				const tokenRequest = captor()
				verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture(), loadOptions))
				let instanceId = storageTypeRefs.createInstanceId({ instanceId: getEtId(mailBox) })
				o(tokenRequest.value).deepEquals(
					storageTypeRefs.createBlobAccessTokenPostIn({
						archiveDataType,
						read: storageTypeRefs.createBlobReadData({
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
			let blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
			})
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(
				storageTypeRefs.createBlobAccessTokenPostIn({
					read: storageTypeRefs.createBlobReadData({
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
			let blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
			})

			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(1)("Only one call to request the token") // only one call because of caching!
			o(readToken).equals(blobAccessInfo) // correct token returned
		})

		o("when requested individual blobs but the server responded with archive token, the token is cached for the archive", async function () {
			const blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})

			const blobLoadOptions = {}
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(expectedToken)
			const mailBox = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId" })
			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: mailBox,
				listId: null,
				elementId: mailBox._id,
			}

			await blobAccessTokenFacade.requestReadTokenBlobs(ArchiveDataType.Attachments, referencingInstance, blobLoadOptions)

			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			o(readToken).deepEquals(blobAccessInfo)
			verify(serviceMock.post(storageServices.BlobAccessTokenService, anything()), { times: 1, ignoreExtraArgs: true })
		})

		o("when requested individual blobs and the server responded with instance token, the token is cached for the instances", async function () {
			const blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})

			const blobLoadOptions = {}
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(expectedToken)
			const mailBox1 = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId1" })
			const mailBox2 = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId2" })
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
			verify(serviceMock.post(storageServices.BlobAccessTokenService, anything()), { times: 1, ignoreExtraArgs: true })
		})

		o("when requested individual blobs and the server responded with instance token that expired, new token is requested", async function () {
			const blobLoadOptions = {}
			const expiredAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() - 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const expiredToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo: expiredAccessInfo })
			const newAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const newToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo: newAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(expiredToken)
			const mailBox1 = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId1" })
			const mailBox2 = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId2" })
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

			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(newToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenMultipleInstances(
				ArchiveDataType.Attachments,
				[referencingInstance1],
				blobLoadOptions,
			)

			o(readToken).deepEquals(newAccessInfo)
			verify(serviceMock.post(storageServices.BlobAccessTokenService, anything()), { times: 2, ignoreExtraArgs: true })
		})

		o("when requested individual blobs but the server responded with archive token that expired, new token is requested", async function () {
			const blobLoadOptions = {}
			const expiredAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() - 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const expiredToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo: expiredAccessInfo })
			const newAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "123",
				expires: new Date(now.toMillis() + 1000),
				tokenKind: BlobAccessTokenKind.Archive,
			})
			const newToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo: newAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expiredToken)
			const mailBox1 = createTestEntity(tutanotaTypeRefs.MailBoxTypeRef, { _id: "elementId1" })

			const referencingInstance: BlobReferencingInstance = {
				blobs,
				entity: mailBox1,
				listId: null,
				elementId: mailBox1._id,
			}

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			when(serviceMock.post(storageServices.BlobAccessTokenService, anything(), blobLoadOptions)).thenResolve(newToken)

			const readToken = await blobAccessTokenFacade.requestReadTokenMultipleInstances(ArchiveDataType.Attachments, [referencingInstance], blobLoadOptions)

			o(readToken).deepEquals(newAccessInfo)
			verify(serviceMock.post(storageServices.BlobAccessTokenService, anything()), { times: 2, ignoreExtraArgs: true })
		})

		o("cache read token archive expired", async function () {
			let expires = new Date(now.toMillis() - 1) // date in the past, so the token is expired
			let blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, { blobAccessToken: "123", expires })
			let expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			blobAccessInfo = createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
				blobAccessToken: "456",
				expires: new Date(now.toMillis() + 1000),
			})
			expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, { blobAccessInfo })
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			// request it twice and verify that there is only one network request
			const readToken = await blobAccessTokenFacade.requestReadTokenArchive(archiveId)

			const tokenRequest = captor()
			verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(2) // only one call because of caching!
			o(readToken.blobAccessToken).equals("456") // correct token returned
		})

		o("request write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					expires: new Date(now.toMillis() + 1000),
				}),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.value).deepEquals(
				storageTypeRefs.createBlobAccessTokenPostIn({
					archiveDataType,
					read: null,
					write: storageTypeRefs.createBlobWriteData({
						archiveOwnerGroup: ownerGroup,
					}),
				}),
			)
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token", async function () {
			const ownerGroup = "ownerId"
			const expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
					blobAccessToken: "123",
					expires: new Date(now.toMillis() + 1000),
				}),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)
			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(1)("only one request for token")
			o(writeToken).equals(expectedToken.blobAccessInfo)
		})

		o("cache write token expired", async function () {
			let expires = new Date(now.toMillis() - 1) // date in the past, so the token is expired
			const ownerGroup = "ownerId"
			let expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, { blobAccessToken: "123", expires }),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			expectedToken = createTestEntity(storageTypeRefs.BlobAccessTokenPostOutTypeRef, {
				blobAccessInfo: createTestEntity(storageTypeRefs.BlobServerAccessInfoTypeRef, {
					blobAccessToken: "456",
					expires: new Date(now.toMillis() + 1000),
				}),
			})
			when(serviceMock.post(storageServices.BlobAccessTokenService, anything())).thenResolve(expectedToken)

			const writeToken = await blobAccessTokenFacade.requestWriteToken(archiveDataType, ownerGroup)

			const tokenRequest = captor()
			verify(serviceMock.post(storageServices.BlobAccessTokenService, tokenRequest.capture()))
			o(tokenRequest.values!.length).equals(2)("only one request for token")
			o(writeToken.blobAccessToken).equals("456")
		})
	})
})

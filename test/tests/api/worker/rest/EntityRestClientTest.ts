import o from "@tutao/otest"
import {
	BadRequestError,
	ConnectionError,
	InternalServerError,
	NotAuthorizedError,
	PayloadTooLargeError,
} from "../../../../../src/common/api/common/error/RestError.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { SetupMultipleError } from "../../../../../src/common/api/common/error/SetupMultipleError.js"
import { HttpMethod, MediaType, resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { CustomerServerPropertiesTypeRef, CustomerTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { doBlobRequestWithRetry, EntityRestClient, tryServers, typeRefToPath } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient.js"
import type { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { InstanceMapper } from "../../../../../src/common/api/worker/crypto/InstanceMapper.js"
import { func, instance, matchers, object, verify, when } from "testdouble"
import tutanotaModelInfo from "../../../../../src/common/api/entities/tutanota/ModelInfo.js"
import sysModelInfo from "../../../../../src/common/api/entities/sys/ModelInfo.js"
import { AuthDataProvider } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { LoginIncompleteError } from "../../../../../src/common/api/common/error/LoginIncompleteError.js"
import { BlobServerAccessInfoTypeRef, BlobServerUrlTypeRef } from "../../../../../src/common/api/entities/storage/TypeRefs.js"
import { freshVersioned, Mapper, ofClass } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { BlobAccessTokenFacade } from "../../../../../src/common/api/worker/facades/BlobAccessTokenFacade.js"
import {
	CalendarEventTypeRef,
	Contact,
	ContactTypeRef,
	InternalRecipientKeyDataTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider.js"
import { createTestEntity } from "../../../TestUtils.js"
import { DefaultDateProvider } from "../../../../../src/common/calendar/date/CalendarUtils.js"

const { anything, argThat } = matchers

const accessToken = "My cool access token"
const authHeader = {
	accessToken: accessToken,
}

function createArrayOf<T>(count: number, factory: (index: number) => T): Array<T> {
	return (
		Array(count)
			// @ts-ignore
			.fill()
			.map((_, idx) => factory(idx))
	)
}

const countFrom = (start, count) => createArrayOf(count, (idx) => String(idx + start))

function contacts(count) {
	const contactFactory = (idx) =>
		createTestEntity(ContactTypeRef, {
			firstName: `Contact${idx}`,
		})

	return createArrayOf(count, contactFactory)
}

o.spec("EntityRestClient", function () {
	let entityRestClient: EntityRestClient
	let restClient: RestClient
	let instanceMapperMock: InstanceMapper
	let cryptoFacadeMock: CryptoFacade
	let fullyLoggedIn: boolean
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let dateProvider: DateProvider

	o.beforeEach(function () {
		cryptoFacadeMock = object()
		when(cryptoFacadeMock.applyMigrations(anything(), anything())).thenDo(async (typeRef, data) => {
			return Promise.resolve({ ...data, migrated: true })
		})
		when(cryptoFacadeMock.applyMigrationsForInstance(anything())).thenDo((decryptedInstance) => {
			return Promise.resolve({ ...decryptedInstance, migratedForInstance: true })
		})
		when(cryptoFacadeMock.setNewOwnerEncSessionKey(anything(), anything())).thenResolve([])
		when(cryptoFacadeMock.encryptBucketKeyForInternalRecipient(anything(), anything(), anything(), anything())).thenResolve(
			createTestEntity(InternalRecipientKeyDataTypeRef),
		)
		when(cryptoFacadeMock.resolveSessionKey(anything(), anything())).thenResolve([])

		instanceMapperMock = object()
		when(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), anything())).thenDo((typeModel, instance, sessionKey) => {
			return Promise.resolve({ ...instance, encrypted: true })
		})
		when(instanceMapperMock.decryptAndMapToInstance(anything(), anything(), anything())).thenDo((typeModel, migratedEntity, sessionKey) => {
			return Promise.resolve({ ...migratedEntity, decrypted: true })
		})

		blobAccessTokenFacade = instance(BlobAccessTokenFacade)

		restClient = object()

		fullyLoggedIn = true

		const authDataProvider: AuthDataProvider = {
			createAuthHeaders(): Dict {
				return authHeader
			},
			isFullyLoggedIn(): boolean {
				return fullyLoggedIn
			},
		}

		dateProvider = instance(DefaultDateProvider)
		entityRestClient = new EntityRestClient(authDataProvider, restClient, () => cryptoFacadeMock, instanceMapperMock, blobAccessTokenFacade)
	})

	function assertThatNoRequestsWereMade() {
		verify(restClient.request(anything(), anything()), { ignoreExtraArgs: true, times: 0 })
	}

	o.spec("Load", function () {
		o("loading a list element", async function () {
			const calendarListId = "calendarListId"
			const id1 = "id1"
			when(
				restClient.request(`${typeRefToPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					responseType: MediaType.Json,
					queryParams: undefined,
				}),
			).thenResolve(JSON.stringify({ instance: "calendar" }))

			const result = await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1])
			o(result as any).deepEquals({ instance: "calendar", decrypted: true, migrated: true, migratedForInstance: true })
		})

		o("loading an element ", async function () {
			const id1 = "id1"
			when(
				restClient.request(`${typeRefToPath(CustomerTypeRef)}/${id1}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					responseType: MediaType.Json,
					queryParams: undefined,
				}),
			).thenResolve(JSON.stringify({ instance: "customer" }))

			const result = await entityRestClient.load(CustomerTypeRef, id1)
			o(result as any).deepEquals({ instance: "customer", decrypted: true, migrated: true, migratedForInstance: true })
		})

		o("query parameters and additional headers + access token and version are always passed to the rest client", async function () {
			const calendarListId = "calendarListId"
			const id1 = "id1"
			when(
				restClient.request(`${typeRefToPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version), baz: "quux" },
					responseType: MediaType.Json,
					queryParams: { foo: "bar" },
				}),
			).thenResolve(JSON.stringify({ instance: "calendar" }))

			await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1], { queryParams: { foo: "bar" }, extraHeaders: { baz: "quux" } })
		})

		o("when loading encrypted instance and not being logged in it throws an error", async function () {
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => entityRestClient.load(CalendarEventTypeRef, ["listId", "id"]))
			assertThatNoRequestsWereMade()
		})

		o("when ownerKey is passed it is used instead for session key resolution", async function () {
			const calendarListId = "calendarListId"
			const id1 = "id1"
			when(
				restClient.request(`${typeRefToPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					responseType: MediaType.Json,
					queryParams: undefined,
				}),
			).thenResolve(JSON.stringify({ _ownerEncSessionKey: "some key" }))

			const ownerKey = [1, 2, 3]
			const sessionKey = [3, 2, 1]
			when(cryptoFacadeMock.resolveSessionKeyWithOwnerKey(anything(), ownerKey)).thenReturn(sessionKey)

			const result = await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1], { ownerKeyProvider: async (_) => ownerKey })

			const typeModel = await resolveTypeReference(CalendarEventTypeRef)
			verify(instanceMapperMock.decryptAndMapToInstance(typeModel, anything(), sessionKey))
			verify(cryptoFacadeMock.resolveSessionKey(anything(), anything()), { times: 0 })
			o(result as any).deepEquals({ _ownerEncSessionKey: "some key", decrypted: true, migrated: true, migratedForInstance: true })
		})
	})

	o.spec("Load Range", function () {
		o("Loads a countFrom of entities in a single request", async function () {
			const startId = "42"
			const count = 5
			const listId = "listId"

			when(
				restClient.request(`${typeRefToPath(CalendarEventTypeRef)}/${listId}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { start: startId, count: String(count), reverse: String(false) },
					responseType: MediaType.Json,
				}),
			).thenResolve(JSON.stringify([{ instance: 1 }, { instance: 2 }]))

			const result = await entityRestClient.loadRange(CalendarEventTypeRef, listId, startId, count, false)
			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("when loading encrypted instance list and not being logged in it throws an error", async function () {
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => entityRestClient.loadRange(CalendarEventTypeRef, "listId", "startId", 40, false))
			assertThatNoRequestsWereMade()
		})
	})

	o.spec("Load multiple", function () {
		o("Less than 100 entities requested should result in a single rest request", async function () {
			const ids = countFrom(0, 5)

			when(
				restClient.request(`${typeRefToPath(CustomerTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: "0,1,2,3,4" },
					responseType: MediaType.Json,
				}),
			).thenResolve(JSON.stringify([{ instance: 1 }, { instance: 2 }]))

			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)

			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("Exactly 100 entities requested should result in a single rest request", async function () {
			const ids = countFrom(0, 100)

			when(
				restClient.request(`${typeRefToPath(CustomerTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: ids.join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ instance: 1 }, { instance: 2 }]))

			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("More than 100 entities requested results in 2 rest requests", async function () {
			const ids = countFrom(0, 101)

			when(
				restClient.request(`${typeRefToPath(CustomerTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: countFrom(0, 100).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ instance: 1 }]))

			when(
				restClient.request(`${typeRefToPath(CustomerTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: "100" },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ instance: 2 }]))

			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("More than 200 entities requested results in 3 rest requests", async function () {
			const ids = countFrom(0, 211)

			when(
				restClient.request(typeRefToPath(CustomerTypeRef), HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: countFrom(0, 100).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ instance: 1 }]))

			when(
				restClient.request(typeRefToPath(CustomerTypeRef), HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: countFrom(100, 100).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ instance: 2 }]))

			when(
				restClient.request(typeRefToPath(CustomerTypeRef), HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					queryParams: { ids: countFrom(200, 11).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ instance: 3 }]))

			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 3, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("when loading encrypted instance list and not being logged in it throws an error", async function () {
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => entityRestClient.loadMultiple(CalendarEventTypeRef, "listId", ["startId", "anotherId"]))
			assertThatNoRequestsWereMade()
		})

		o("when loading blob elements a blob access token is requested and the correct headers and parameters are set", async function () {
			const ids = countFrom(0, 5)
			const archiveId = "archiveId"
			const firstServer = "firstServer"

			const blobAccessToken = "123"
			let blobServerAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken,
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: firstServer }), createTestEntity(BlobServerUrlTypeRef, { url: "otherServer" })],
			})
			when(blobAccessTokenFacade.requestReadTokenArchive(archiveId)).thenResolve(blobServerAccessInfo)

			when(blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, anything(), anything())).thenDo((blobServerAccessInfo, authHeaders) => {
				return Object.assign({ blobAccessToken: blobServerAccessInfo.blobAccessToken }, authHeaders)
			})

			when(restClient.request(anything(), HttpMethod.GET, anything())).thenResolve(JSON.stringify([{ instance: 1 }, { instance: 2 }]))

			const result = await entityRestClient.loadMultiple(MailDetailsBlobTypeRef, archiveId, ids)

			let expectedOptions = {
				headers: {},
				queryParams: { ids: "0,1,2,3,4", ...authHeader, blobAccessToken, v: String(tutanotaModelInfo.version) },
				responseType: MediaType.Json,
				noCORS: true,
				baseUrl: firstServer,
			}
			verify(
				restClient.request(
					`${typeRefToPath(MailDetailsBlobTypeRef)}/${archiveId}`,
					HttpMethod.GET,
					argThat((optionsArg) => {
						o(optionsArg.headers).deepEquals(expectedOptions.headers)("headers")
						o(optionsArg.responseType).equals(expectedOptions.responseType)("responseType")
						o(optionsArg.baseUrl).equals(expectedOptions.baseUrl)("baseUrl")
						o(optionsArg.noCORS).equals(expectedOptions.noCORS)("noCORS")
						o(optionsArg.queryParams).deepEquals({
							blobAccessToken: "123",
							...authHeader,
							ids: "0,1,2,3,4",
							v: String(tutanotaModelInfo.version),
						})
						return true
					}),
				),
			)

			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("when loading blob elements request is retried with another server url if it failed", async function () {
			const ids = countFrom(0, 5)
			const archiveId = "archiveId"
			const firstServer = "firstServer"

			const blobAccessToken = "123"
			const otherServer = "otherServer"
			const blobServerAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken,
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: firstServer }), createTestEntity(BlobServerUrlTypeRef, { url: otherServer })],
			})
			when(blobAccessTokenFacade.requestReadTokenArchive(archiveId)).thenResolve(blobServerAccessInfo)

			when(blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, anything(), anything())).thenDo((blobServerAccessInfo, authHeaders) => {
				return Object.assign({ blobAccessToken: blobServerAccessInfo.blobAccessToken }, authHeaders)
			})

			when(
				restClient.request(anything(), HttpMethod.GET, {
					headers: {},
					queryParams: { ids: "0,1,2,3,4", ...authHeader, blobAccessToken, v: String(tutanotaModelInfo.version) },
					responseType: MediaType.Json,
					noCORS: true,
					baseUrl: firstServer,
				}),
			).thenReject(new ConnectionError("test connection error for retry"))
			when(
				restClient.request(anything(), HttpMethod.GET, {
					headers: {},
					queryParams: { ids: "0,1,2,3,4", ...authHeader, blobAccessToken, v: String(tutanotaModelInfo.version) },
					responseType: MediaType.Json,
					noCORS: true,
					baseUrl: otherServer,
				}),
			).thenResolve(JSON.stringify([{ instance: 1 }, { instance: 2 }]))

			const result = await entityRestClient.loadMultiple(MailDetailsBlobTypeRef, archiveId, ids)

			verify(restClient.request(`${typeRefToPath(MailDetailsBlobTypeRef)}/${archiveId}`, HttpMethod.GET, anything()), { times: 2 })

			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([
				{ instance: 1, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
				{ instance: 2, /*migrated: true,*/ decrypted: true, migratedForInstance: true },
			])
		})

		o("when loading blob elements without an archiveId it throws", async function () {
			const ids = countFrom(0, 5)
			const archiveId = null

			let result: Array<MailDetailsBlob> | null = null
			try {
				result = await entityRestClient.loadMultiple(MailDetailsBlobTypeRef, archiveId, ids)
				o(true).equals(false)("loadMultiple should have thrown an exception")
			} catch (e) {
				o(e.message).equals("archiveId must be set to load BlobElementTypes")
			}

			verify(restClient.request(anything(), anything(), anything()), { times: 0 })
			verify(blobAccessTokenFacade.requestReadTokenArchive(anything()), { times: 0 })

			o(result).equals(null)
		})
	})

	o.spec("Setup", function () {
		o("Setup list entity", async function () {
			const v = (await resolveTypeReference(ContactTypeRef)).version
			const newContact = createTestEntity(ContactTypeRef)
			const resultId = "id"
			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					baseUrl: undefined,
					headers: { ...authHeader, v },
					queryParams: undefined,
					responseType: MediaType.Json,
					body: JSON.stringify({ ...newContact, encrypted: true }),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify({ generatedId: resultId }))

			const result = await entityRestClient.setup("listId", newContact)
			o(result).equals(resultId)
		})

		o("Setup list entity throws when no listid is passed", async function () {
			const newContact = createTestEntity(ContactTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.setup(null, newContact))
			o(result.message).equals("List id must be defined for LETs")
		})

		o("Setup entity", async function () {
			const v = (await resolveTypeReference(CustomerTypeRef)).version
			const newCustomer = createTestEntity(CustomerTypeRef)
			const resultId = "id"
			when(
				restClient.request(`/rest/sys/customer`, HttpMethod.POST, {
					baseUrl: undefined,
					headers: { ...authHeader, v },
					queryParams: undefined,
					responseType: MediaType.Json,
					body: JSON.stringify({ ...newCustomer, encrypted: true }),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify({ generatedId: resultId }))

			const result = await entityRestClient.setup(null, newCustomer)
			o(result).equals(resultId)
		})

		o("Setup entity throws when listid is passed", async function () {
			const newCustomer = createTestEntity(CustomerTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.setup("listId", newCustomer))
			o(result.message).equals("List id must not be defined for ETs")
		})

		o("Base URL option is passed to the rest client", async function () {
			when(restClient.request(anything(), anything(), anything()), { times: 1 }).thenResolve(JSON.stringify({ generatedId: null }))
			await entityRestClient.setup("listId", createTestEntity(ContactTypeRef), undefined, { baseUrl: "some url" })
			verify(
				restClient.request(
					anything(),
					HttpMethod.POST,
					argThat((arg) => arg.baseUrl === "some url"),
				),
			)
		})

		o("when ownerKey is passed it is used instead for session key resolution", async function () {
			const typeModel = await resolveTypeReference(CustomerServerPropertiesTypeRef)
			const v = typeModel.version
			const newCustomerServerProperties = createTestEntity(CustomerServerPropertiesTypeRef, {
				_ownerEncSessionKey: new Uint8Array([4, 5, 6]),
			})
			const resultId = "id"
			when(
				restClient.request(`/rest/sys/customerserverproperties`, HttpMethod.POST, {
					baseUrl: undefined,
					headers: { ...authHeader, v },
					queryParams: undefined,
					responseType: MediaType.Json,
					body: JSON.stringify({ ...newCustomerServerProperties, encrypted: true }),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify({ generatedId: resultId }))

			const ownerKey = freshVersioned([1, 2, 3])
			const sessionKey = [3, 2, 1]
			when(cryptoFacadeMock.setNewOwnerEncSessionKey(typeModel, anything(), ownerKey)).thenResolve(sessionKey)

			const result = await entityRestClient.setup(null, newCustomerServerProperties, undefined, { ownerKey })

			verify(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), sessionKey))
			verify(cryptoFacadeMock.resolveSessionKey(anything(), anything()), { times: 0 })

			o(result).equals(resultId)
		})
	})

	o.spec("Setup multiple", function () {
		o("Less than 100 entities created should result in a single rest request", async function () {
			const newContacts = contacts(1)
			const resultId = "id1"
			const { version } = await resolveTypeReference(ContactTypeRef)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "1" },
					responseType: MediaType.Json,
					body: JSON.stringify([{ ...newContacts[0], encrypted: true }]),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([{ generatedId: resultId }]))

			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals([resultId])
		})

		o("Exactly 100 entities created should result in a single rest request", async function () {
			const newContacts = contacts(100)
			const resultIds = countFrom(0, 100).map(String)
			const { version } = await resolveTypeReference(ContactTypeRef)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: JSON.stringify(
						newContacts.map((c) => {
							return { ...c, encrypted: true }
						}),
					),
				}),
				{ times: 1 },
			).thenResolve(
				JSON.stringify(
					resultIds.map((id) => {
						return { generatedId: id }
					}),
				),
			)

			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals(resultIds)
		})

		o("More than 100 entities created should result in 2 rest requests", async function () {
			const newContacts = contacts(101)
			const resultIds = countFrom(0, 101).map(String)
			const { version } = await resolveTypeReference(ContactTypeRef)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: JSON.stringify(
						newContacts.slice(0, 100).map((c) => {
							return { ...c, encrypted: true }
						}),
					),
				}),
				{ times: 1 },
			).thenResolve(
				JSON.stringify(
					resultIds.slice(0, 100).map((id) => {
						return { generatedId: id }
					}),
				),
			)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "1" },
					responseType: MediaType.Json,
					body: JSON.stringify(
						newContacts.slice(100).map((c) => {
							return { ...c, encrypted: true }
						}),
					),
				}),
				{ times: 1 },
			).thenResolve(
				JSON.stringify(
					resultIds.slice(100).map((id) => {
						return { generatedId: id }
					}),
				),
			)

			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals(resultIds)
		})

		o("More than 200 entities created should result in 3 rest requests", async function () {
			const newContacts = contacts(211)
			const resultIds = countFrom(0, 211).map(String)
			const { version } = await resolveTypeReference(ContactTypeRef)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: JSON.stringify(
						newContacts.slice(0, 100).map((c) => {
							return { ...c, encrypted: true }
						}),
					),
				}),
				{ times: 1 },
			).thenResolve(
				JSON.stringify(
					resultIds.slice(0, 100).map((id) => {
						return { generatedId: id }
					}),
				),
			)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: JSON.stringify(
						newContacts.slice(100, 200).map((c) => {
							return { ...c, encrypted: true }
						}),
					),
				}),
				{ times: 1 },
			).thenResolve(
				JSON.stringify(
					resultIds.slice(100, 200).map((id) => {
						return { generatedId: id }
					}),
				),
			)

			when(
				restClient.request(`/rest/tutanota/contact/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: version },
					queryParams: { count: "11" },
					responseType: MediaType.Json,
					body: JSON.stringify(
						newContacts.slice(200).map((c) => {
							return { ...c, encrypted: true }
						}),
					),
				}),
				{ times: 1 },
			).thenResolve(
				JSON.stringify(
					resultIds.slice(200).map((id) => {
						return { generatedId: id }
					}),
				),
			)

			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals(resultIds)
		})

		o("A single request is made and an error occurs, all entities should be returned as failedInstances", async function () {
			when(restClient.request(anything(), anything(), anything())).thenReject(new BadRequestError("canny do et"))

			const newContacts = contacts(100)
			const result = await assertThrows(SetupMultipleError, () => entityRestClient.setupMultiple("listId", newContacts))
			o(result.failedInstances.length).equals(newContacts.length)
			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof BadRequestError).equals(true)
			o(result.failedInstances).deepEquals(newContacts)
		})

		o("Post multiple: An error is encountered for part of the request, only failed entities are returned in the result", async function () {
			let requestCounter = 0
			when(restClient.request(anything(), anything(), anything())).thenDo(() => {
				requestCounter += 1

				if (requestCounter % 2 === 0) {
					// Second and Fourth requests are success
					return JSON.stringify(
						countFrom(0, 100).map((c) => {
							return { generatedId: c }
						}),
					)
				} else {
					// First and Third requests are failure
					throw new BadRequestError("It was a bad request")
				}
			})

			const newContacts = contacts(400)
			const result = await assertThrows(SetupMultipleError, () => entityRestClient.setupMultiple("listId", newContacts))
			verify(restClient.request(anything(), anything()), { times: 4, ignoreExtraArgs: true })
			o(result.failedInstances).deepEquals(newContacts.slice(0, 100).concat(newContacts.slice(200, 300)))
			o(result.errors.length).equals(2)
			o(result.errors.every((e) => e instanceof BadRequestError)).equals(true)
		})

		o("Post multiple: When a PayloadTooLarge error occurs individual instances are posted", async function () {
			const listId = "listId"
			const idArray = ["0", null, "2"] // GET fails for id 1

			let instances: Contact[] = []

			for (let i = 0; i < idArray.length; i++) {
				instances.push(createTestEntity(ContactTypeRef))
			}

			let step = 0
			when(restClient.request(anything(), anything(), anything())).thenDo((path: string, method: HttpMethod, { body }) => {
				//post multiple - body is an array
				if (body && body.startsWith("[")) {
					throw new PayloadTooLargeError("test") //post single
				} else if (step === 1) {
					step += 1
					throw new InternalServerError("might happen")
				} else {
					return JSON.stringify(idArray[step++])
				}
			})
			const result = await assertThrows(SetupMultipleError, async () => {
				return await entityRestClient.setupMultiple(listId, instances)
			})
			//one post multiple and three individual posts
			verify(restClient.request(anything(), anything()), { ignoreExtraArgs: true, times: 4 })
			o(result.failedInstances.length).equals(1) //one individual post results in an error

			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof InternalServerError).equals(true)
			o(result.failedInstances).deepEquals([instances[1]])
		})
	})

	o.spec("Update", function () {
		o("Update entity", async function () {
			const { version } = await resolveTypeReference(CustomerTypeRef)
			const newCustomer = createTestEntity(CustomerTypeRef, {
				_id: "id",
			})
			when(
				restClient.request("/rest/sys/customer/id", HttpMethod.PUT, {
					headers: { ...authHeader, v: version },
					body: JSON.stringify({ ...newCustomer, encrypted: true }),
				}),
			)

			await entityRestClient.update(newCustomer)
		})

		o("Update entity throws if entity does not have an id", async function () {
			const newCustomer = createTestEntity(CustomerTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.update(newCustomer))
			o(result.message).equals("Id must be defined")
		})

		o("when ownerKey is passed it is used instead for session key resolution", async function () {
			const typeModel = await resolveTypeReference(CustomerServerPropertiesTypeRef)
			const version = typeModel.version
			const ownerKeyVersion = 2
			const newCustomerServerProperties = createTestEntity(CustomerServerPropertiesTypeRef, {
				_id: "id",
				_ownerEncSessionKey: new Uint8Array([4, 5, 6]),
				_ownerKeyVersion: String(ownerKeyVersion),
			})
			when(
				restClient.request("/rest/sys/customerserverproperties/id", HttpMethod.PUT, {
					headers: { ...authHeader, v: version },
					body: JSON.stringify({ ...newCustomerServerProperties, encrypted: true }),
				}),
			)

			const ownerKey = freshVersioned([1, 2, 3])
			const sessionKey = [3, 2, 1]
			when(cryptoFacadeMock.resolveSessionKeyWithOwnerKey(anything(), ownerKey.object)).thenReturn(sessionKey)

			await entityRestClient.update(newCustomerServerProperties, {
				ownerKeyProvider: async (version) => {
					o(version).equals(ownerKeyVersion)
					return ownerKey.object
				},
			})

			verify(instanceMapperMock.encryptAndMapToLiteral(anything(), anything(), sessionKey))
			verify(cryptoFacadeMock.resolveSessionKey(anything(), anything()), { times: 0 })
		})
	})

	o.spec("Delete", function () {
		o("Delete entity", async function () {
			const { version } = await resolveTypeReference(CustomerTypeRef)
			const id = "id"
			const newCustomer = createTestEntity(CustomerTypeRef, {
				_id: id,
			})
			when(
				restClient.request("/rest/sys/customer/id", HttpMethod.DELETE, {
					headers: { ...authHeader, v: version },
				}),
			)

			await entityRestClient.erase(newCustomer)
		})
	})

	o.spec("tryServers", function () {
		o("tryServers successful", async function () {
			let servers = [createTestEntity(BlobServerUrlTypeRef, { url: "w1" }), createTestEntity(BlobServerUrlTypeRef, { url: "w2" })]
			const mapperMock = func<Mapper<string, object>>()
			const expectedResult = { response: "response-from-server" }
			when(mapperMock(anything(), anything())).thenResolve(expectedResult)
			const result = await tryServers(servers, mapperMock, "error")
			o(result).equals(expectedResult)
			verify(mapperMock("w1", 0), { times: 1 })
			verify(mapperMock("w2", 1), { times: 0 })
		})

		o("tryServers error", async function () {
			let servers = [createTestEntity(BlobServerUrlTypeRef, { url: "w1" }), createTestEntity(BlobServerUrlTypeRef, { url: "w2" })]
			const mapperMock = func<Mapper<string, object>>()
			when(mapperMock("w1", 0)).thenReject(new ProgrammingError("test"))
			const e = await assertThrows(ProgrammingError, () => tryServers(servers, mapperMock, "error"))
			o(e.message).equals("test")
			verify(mapperMock(anything(), anything()), { times: 1 })
		})

		o("tryServers ConnectionError and successful response", async function () {
			let servers = [createTestEntity(BlobServerUrlTypeRef, { url: "w1" }), createTestEntity(BlobServerUrlTypeRef, { url: "w2" })]
			const mapperMock = func<Mapper<string, object>>()
			const expectedResult = { response: "response-from-server" }
			when(mapperMock("w1", 0)).thenReject(new ConnectionError("test"))
			when(mapperMock("w2", 1)).thenResolve(expectedResult)
			const result = await tryServers(servers, mapperMock, "error")
			o(result).deepEquals(expectedResult)
			verify(mapperMock(anything(), anything()), { times: 2 })
		})

		o("tryServers multiple ConnectionError", async function () {
			let servers = [createTestEntity(BlobServerUrlTypeRef, { url: "w1" }), createTestEntity(BlobServerUrlTypeRef, { url: "w2" })]
			const mapperMock = func<Mapper<string, object>>()
			when(mapperMock("w1", 0)).thenReject(new ConnectionError("test"))
			when(mapperMock("w2", 1)).thenReject(new ConnectionError("test"))
			const e = await assertThrows(ConnectionError, () => tryServers(servers, mapperMock, "error log msg"))
			o(e.message).equals("test")
			verify(mapperMock(anything(), anything()), { times: 2 })
		})
	})

	o.spec("doBlobRequestWithRetry", function () {
		o("retry once after NotAuthorizedError, then fails", async function () {
			let blobRequestCallCount = 0
			let evictCacheCallCount = 0
			let errorThrown = 0
			const doBlobRequest = async () => {
				blobRequestCallCount += 1
				throw new NotAuthorizedError("test error")
			}
			const evictCache = () => {
				evictCacheCallCount += 1
			}
			await doBlobRequestWithRetry(doBlobRequest, evictCache).catch(
				ofClass(NotAuthorizedError, (e) => {
					errorThrown += 1 // must be thrown
				}),
			)
			o(errorThrown).equals(1)
			o(blobRequestCallCount).equals(2)
			o(evictCacheCallCount).equals(1)
		})

		o("retry once after NotAuthorizedError, then succeeds", async function () {
			let blobRequestCallCount = 0
			let evictCacheCallCount = 0
			const doBlobRequest = async () => {
				//only throw on first call
				if (blobRequestCallCount === 0) {
					blobRequestCallCount += 1
					throw new NotAuthorizedError("test error")
				}
			}
			const evictCache = () => {
				evictCacheCallCount += 1
			}
			await doBlobRequestWithRetry(doBlobRequest, evictCache)
			o(blobRequestCallCount).equals(1)
			o(evictCacheCallCount).equals(1)
		})
	})
})

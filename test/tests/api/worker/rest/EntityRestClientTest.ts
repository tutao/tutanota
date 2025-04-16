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
import { HttpMethod, MediaType, PatchOperationType, TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions.js"
import {
	AccountingInfoTypeRef,
	createPatchList,
	CustomerTypeRef,
	GroupMemberTypeRef,
	PatchListTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { doBlobRequestWithRetry, EntityRestClient, tryServers, typeModelToRestPath } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient.js"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { func, instance, matchers, object, verify, when } from "testdouble"
import tutanotaModelInfo from "../../../../../src/common/api/entities/tutanota/ModelInfo.js"
import sysModelInfo from "../../../../../src/common/api/entities/sys/ModelInfo.js"
import { AuthDataProvider, UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { LoginIncompleteError } from "../../../../../src/common/api/common/error/LoginIncompleteError.js"
import { BlobServerAccessInfoTypeRef, BlobServerUrlTypeRef } from "../../../../../src/common/api/entities/storage/TypeRefs.js"
import {
	assertNotNull,
	Base64,
	base64ToUint8Array,
	deepEqual,
	KeyVersion,
	Mapper,
	ofClass,
	promiseMap,
	TypeRef,
	uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { BlobAccessTokenFacade } from "../../../../../src/common/api/worker/facades/BlobAccessTokenFacade.js"
import {
	BodyTypeRef,
	CalendarEventTypeRef,
	ContactTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	RecipientsTypeRef,
	SupportDataTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../../TestUtils.js"
import { InstancePipeline } from "../../../../../src/common/api/worker/crypto/InstancePipeline"
import { type Entity, TypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { PersistenceResourcePostReturnTypeRef } from "../../../../../src/common/api/entities/base/TypeRefs"
import { aes256RandomKey, AesKey, decryptKey } from "@tutao/tutanota-crypto"
import { _encryptKeyWithVersionedKey, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor"
import { OwnerEncSessionKeysUpdateQueue } from "../../../../../src/common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade"
import { PublicKeyProvider } from "../../../../../src/common/api/worker/facades/PublicKeyProvider"
import { KeyRotationFacade } from "../../../../../src/common/api/worker/facades/KeyRotationFacade"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel"
import { KeyVerificationFacade } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"

const { anything, argThat, captor } = matchers

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

function groupMembers(count) {
	const groupMemberFactory = (idx) =>
		createTestEntity(GroupMemberTypeRef, {
			_id: ["listid", `id${idx}`],
			_permissions: "permissionsId",
			_ownerGroup: "ownerGroupId",
			userGroupInfo: ["someList", "someId"],
			group: "someGroup",
			user: "someUser",
		})

	return createArrayOf(count, groupMemberFactory)
}

o.spec("EntityRestClient", function () {
	let entityRestClient: EntityRestClient
	let restClient: RestClient
	let instancePipeline: InstancePipeline
	let cryptoFacadePartialStub: CryptoFacade
	let fullyLoggedIn: boolean
	let blobAccessTokenFacade: BlobAccessTokenFacade
	const keyLoaderFacadeMock = instance(KeyLoaderFacade)
	const ownerGroupId = "ownerGroupId"
	let sk: AesKey
	let ownerGroupKey: VersionedKey
	let encryptedSessionKey
	let currentDebuggingStatus
	let typeModelResolver: TypeModelResolver

	async function typeRefToRestPath(typeRef: TypeRef<unknown>): Promise<string> {
		return typeModelToRestPath(await typeModelResolver.resolveClientTypeReference(typeRef))
	}

	o.beforeEach(function () {
		currentDebuggingStatus = env.networkDebugging
		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		// instead of mocking the instance pipeline itself, mock it's internal mapper.
		blobAccessTokenFacade = instance(BlobAccessTokenFacade)

		restClient = object()

		sk = aes256RandomKey()
		ownerGroupKey = { object: aes256RandomKey(), version: 0 }
		encryptedSessionKey = _encryptKeyWithVersionedKey(ownerGroupKey, sk)
		when(keyLoaderFacadeMock.loadSymGroupKey(ownerGroupId, 0)).thenResolve(ownerGroupKey.object)

		fullyLoggedIn = true
		cryptoFacadePartialStub = new CryptoFacade(
			instance(UserFacade),
			instance(EntityClient),
			restClient,
			instance(ServiceExecutor),
			instancePipeline,
			instance(OwnerEncSessionKeysUpdateQueue),
			instance(DefaultEntityRestCache),
			keyLoaderFacadeMock,
			instance(AsymmetricCryptoFacade),
			async () => instance(KeyVerificationFacade),
			instance(PublicKeyProvider),
			() => instance(KeyRotationFacade),
			typeModelResolver,
		)
		cryptoFacadePartialStub.resolveSessionKey = async (instance: Entity): Promise<Nullable<AesKey>> => {
			return sk
		}

		const authDataProvider: AuthDataProvider = {
			createAuthHeaders(): Dict {
				return authHeader
			},
			isFullyLoggedIn(): boolean {
				return fullyLoggedIn
			},
		}

		entityRestClient = new EntityRestClient(
			authDataProvider,
			restClient,
			() => cryptoFacadePartialStub,
			instancePipeline,
			blobAccessTokenFacade,
			typeModelResolver,
		)
	})

	o.afterEach(() => {
		env.networkDebugging = currentDebuggingStatus
	})

	function assertThatNoRequestsWereMade() {
		verify(restClient.request(anything(), anything()), { ignoreExtraArgs: true, times: 0 })
	}

	o.spec("Load", function () {
		o("load removes network debugging info", async function () {
			env.networkDebugging = true

			const id1 = "id1"
			const expectedInstance = createTestEntity(AccountingInfoTypeRef, {
				_id: id1,
				_permissions: "permissionsId",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const requestPath = `${await typeRefToRestPath(AccountingInfoTypeRef)}/${id1}`

			// mapAndEncrypt is a convenient way to get an instance with network debugging info
			const instanceWithDebuggingInfo = await instancePipeline.mapAndEncrypt(expectedInstance._type, expectedInstance, sk)
			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(JSON.stringify(instanceWithDebuggingInfo))
			const loadResult = await entityRestClient.load(expectedInstance._type, id1)
			removeOriginals(loadResult)
			o(expectedInstance as any).deepEquals(loadResult)
		})

		o("loading a list element", async function () {
			const calendarListId = "calendarListId"
			const id1 = "id1"
			const calendar = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id1],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const requestPath = `${await typeRefToRestPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`
			const untypedCalendarInstance = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar, sk)
			when(
				restClient.request(requestPath, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					responseType: MediaType.Json,
					queryParams: undefined,
					baseUrl: undefined,
				}),
			).thenResolve(JSON.stringify(untypedCalendarInstance))

			const result = await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1])
			removeOriginals(result)
			o(result as any).deepEquals(calendar)
		})

		o("loading an element", async function () {
			const id1 = "id1"
			const accountingInfo = createTestEntity(AccountingInfoTypeRef, {
				_id: id1,
				_permissions: "permissionsId",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const untypedAccountingInfo = await instancePipeline.mapAndEncrypt(AccountingInfoTypeRef, accountingInfo, sk)
			when(
				restClient.request(`${await typeRefToRestPath(AccountingInfoTypeRef)}/${id1}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					responseType: MediaType.Json,
					queryParams: undefined,
					baseUrl: undefined,
				}),
			).thenResolve(JSON.stringify(untypedAccountingInfo))

			const result = await entityRestClient.load(AccountingInfoTypeRef, id1)
			removeOriginals(result)
			o(result as any).deepEquals(accountingInfo)
		})

		o("query parameters and additional headers + access token and version are always passed to the rest client", async function () {
			const calendarListId = "calendarListId"
			const id1 = "id1"
			const calendar = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id1],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const requestPath = `${await typeRefToRestPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`
			const untypedCalendarInstance = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar, sk)
			when(restClient.request(anything(), anything(), anything())).thenResolve(JSON.stringify(untypedCalendarInstance))

			await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1], {
				queryParams: { foo: "bar" },
				extraHeaders: { baz: "quux" },
			})
			verify(
				restClient.request(requestPath, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version), baz: "quux" },
					responseType: MediaType.Json,
					queryParams: { foo: "bar" },
					baseUrl: undefined,
				}),
			)

			// repeat once again with network debugging enables
			env.networkDebugging = true
			const calendaroWithDebug = await instancePipeline.mapAndEncrypt(calendar._type, calendar, sk)
			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(JSON.stringify(calendaroWithDebug))
			const resultWithDebug = await entityRestClient.load(calendar._type, [calendarListId, id1])
			removeOriginals(resultWithDebug)
			o(resultWithDebug as any).deepEquals(calendar)
		})

		o("when loading encrypted instance and not being logged in it throws an error", async function () {
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => entityRestClient.load(CalendarEventTypeRef, ["listId", "id"]))
			assertThatNoRequestsWereMade()
		})

		o("when ownerKey is passed it is used instead for session key resolution", async function () {
			const calendarListId = "calendarListId"
			const id1 = "id1"
			const ownerKeyProviderSk = aes256RandomKey()
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const ownerKeyProviderEncryptedSessionKey = _encryptKeyWithVersionedKey(ownerGroupKey, ownerKeyProviderSk)
			const calendar = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id1],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: ownerKeyProviderEncryptedSessionKey.key,
				_ownerKeyVersion: ownerKeyProviderEncryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const untypedCalendarInstance = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar, ownerKeyProviderSk)

			when(
				restClient.request(`${await typeRefToRestPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					responseType: MediaType.Json,
					queryParams: undefined,
					baseUrl: undefined,
				}),
			).thenResolve(JSON.stringify(untypedCalendarInstance))

			const result = await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1], {
				ownerKeyProvider: async (_: KeyVersion) => ownerGroupKey.object,
			})
			removeOriginals(result)
			o(result as any).deepEquals(calendar)
		})
	})

	o.spec("Load Range", function () {
		o("load range removes network debugging info", async function () {
			env.networkDebugging = true

			const startId = "42"
			const count = 5
			const listId = "listId"
			const requestPath = `${await typeRefToRestPath(CalendarEventTypeRef)}/${listId}`

			const calendarListId = "calendarListId"
			const id1 = "42"
			const id2 = "43"
			const calendar1 = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id1],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})

			const calendar2 = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id2],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const expectedLoadRangeResult = [calendar1, calendar2]

			const untypedCalWithDebug1 = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar1, sk)
			const untypedCalWithDebug2 = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar2, sk)

			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(JSON.stringify([untypedCalWithDebug1, untypedCalWithDebug2]))
			const loadRangeResult = await entityRestClient.loadRange(CalendarEventTypeRef, listId, startId, count, false)
			loadRangeResult.map(removeOriginals)
			o(expectedLoadRangeResult as any).deepEquals(loadRangeResult)
		})

		o("Loads a countFrom of entities in a single request", async function () {
			const startId = "42"
			const count = 5
			const listId = "listId"

			const calendarListId = "calendarListId"
			const id1 = "42"
			const id2 = "43"
			const calendar1 = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id1],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const calendar2 = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id2],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const untypedCal1 = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar1, sk)
			const untypedCal2 = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar2, sk)
			when(
				restClient.request(`${await typeRefToRestPath(CalendarEventTypeRef)}/${listId}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { start: startId, count: String(count), reverse: String(false) },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
			).thenResolve(JSON.stringify([untypedCal1, untypedCal2]))

			const result = await entityRestClient.loadRange(CalendarEventTypeRef, listId, startId, count, false)
			result.map(removeOriginals)
			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([calendar1, calendar2])
		})

		o("when loading encrypted instance list and not being logged in it throws an error", async function () {
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => entityRestClient.loadRange(CalendarEventTypeRef, "listId", "startId", 40, false))
			assertThatNoRequestsWereMade()
		})
	})

	o.spec("Load multiple", function () {
		o("load multiple removes network debugging info", async function () {
			env.networkDebugging = true

			const ids = countFrom(0, 5)
			const supportData1 = createTestEntity(SupportDataTypeRef, {
				_id: "1",
				_permissions: "some id",
			})
			const supportData2 = createTestEntity(SupportDataTypeRef, {
				_id: "2",
				_permissions: "another id",
			})
			const expectedLoadMultipleResult = [supportData1, supportData2]

			const instanceWithDebuggingInfo1 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData1, null)
			const instanceWithDebuggingInfo2 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData2, null)

			const requestPath = `${await typeRefToRestPath(SupportDataTypeRef)}`
			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(
				JSON.stringify([instanceWithDebuggingInfo1, instanceWithDebuggingInfo2]),
			)

			const loadMultipleResult = await entityRestClient.loadMultiple(SupportDataTypeRef, null, ids)
			loadMultipleResult.map(removeOriginals)
			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(expectedLoadMultipleResult as any).deepEquals(loadMultipleResult)
		})

		o("Less than 100 entities requested should result in a single rest request", async function () {
			const ids = countFrom(0, 5)
			const supportData1 = createTestEntity(SupportDataTypeRef, {
				_id: "1",
				_permissions: "some id",
			})
			const supportData2 = createTestEntity(SupportDataTypeRef, {
				_id: "2",
				_permissions: "another id",
			})
			const untypedSupportData1 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData1, null)
			const untypedSupportData2 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData2, null)
			when(
				restClient.request(`${await typeRefToRestPath(SupportDataTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: "0,1,2,3,4" },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
			).thenResolve(JSON.stringify([untypedSupportData1, untypedSupportData2]))

			const result = await entityRestClient.loadMultiple(SupportDataTypeRef, null, ids)
			result.map(removeOriginals)
			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([supportData1, supportData2])
		})

		o("Exactly 100 entities requested should result in a single rest request", async function () {
			const ids = countFrom(0, 100)
			const supportData1 = createTestEntity(SupportDataTypeRef, {
				_id: "1",
				_permissions: "some id",
			})
			const supportData2 = createTestEntity(SupportDataTypeRef, {
				_id: "2",
				_permissions: "another id",
			})
			const untypedSupportData1 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData1, null)
			const untypedSupportData2 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData2, null)
			when(restClient.request(anything(), anything(), anything())).thenResolve(JSON.stringify([untypedSupportData1, untypedSupportData2]))

			const result = await entityRestClient.loadMultiple(SupportDataTypeRef, null, ids)

			verify(
				restClient.request(`${await typeRefToRestPath(SupportDataTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: ids.join(",") },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
				{ times: 1 },
			)
			result.map(removeOriginals)
			o(result as any).deepEquals([supportData1, supportData2])
		})

		o("More than 100 entities requested results in 2 rest requests", async function () {
			const ids = countFrom(0, 101)
			const supportData1 = createTestEntity(SupportDataTypeRef, {
				_id: "1",
				_permissions: "some id",
			})
			const supportData2 = createTestEntity(SupportDataTypeRef, {
				_id: "100",
				_permissions: "another id",
			})
			const untypedSupportData1 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData1, null)
			const untypedSupportData2 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData2, null)
			when(
				restClient.request(`${await typeRefToRestPath(SupportDataTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(0, 100).join(",") },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([untypedSupportData1]))

			when(
				restClient.request(`${await typeRefToRestPath(SupportDataTypeRef)}`, HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: "100" },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([untypedSupportData2]))

			const result = await entityRestClient.loadMultiple(SupportDataTypeRef, null, ids)
			result.map(removeOriginals)
			o(result as any).deepEquals([supportData1, supportData2])
		})

		o("More than 200 entities requested results in 3 rest requests", async function () {
			const ids = countFrom(0, 211)

			const supportData1 = createTestEntity(SupportDataTypeRef, {
				_id: "1",
				_permissions: "some id",
			})

			const supportData2 = createTestEntity(SupportDataTypeRef, {
				_id: "100",
				_permissions: "another id",
			})

			const supportData3 = createTestEntity(SupportDataTypeRef, {
				_id: "200",
				_permissions: "third id",
			})
			const untypedSupportData1 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData1, null)
			const untypedSupportData2 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData2, null)
			const untypedSupportData3 = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, supportData3, null)

			when(
				restClient.request(await typeRefToRestPath(SupportDataTypeRef), HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(0, 100).join(",") },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([untypedSupportData1]))

			when(
				restClient.request(await typeRefToRestPath(SupportDataTypeRef), HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(100, 100).join(",") },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([untypedSupportData2]))

			when(
				restClient.request(await typeRefToRestPath(SupportDataTypeRef), HttpMethod.GET, {
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(200, 11).join(",") },
					responseType: MediaType.Json,
					baseUrl: undefined,
					suspensionBehavior: undefined,
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([untypedSupportData3]))

			const result = await entityRestClient.loadMultiple(SupportDataTypeRef, null, ids)
			result.map(removeOriginals)
			o(result as any).deepEquals([supportData1, supportData2, supportData3])
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

			const blob1 = createTestEntity(MailDetailsBlobTypeRef, {
				_id: ["list", "element1"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				details: createTestEntity(MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			const blob2 = createTestEntity(MailDetailsBlobTypeRef, {
				_id: ["list", "element2"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				details: createTestEntity(MailDetailsTypeRef, {
					_id: "detailsId2",
					recipients: createTestEntity(RecipientsTypeRef, { _id: "recipeintsId2" }),
					body: createTestEntity(BodyTypeRef, { _id: "bodyId2" }),
				}),
			})

			const untypedBlob1 = await instancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, blob1, sk)
			const untypedBlob2 = await instancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, blob2, sk)

			const blobAccessToken = "123"
			let blobServerAccessInfo = createTestEntity(BlobServerAccessInfoTypeRef, {
				blobAccessToken,
				servers: [createTestEntity(BlobServerUrlTypeRef, { url: firstServer }), createTestEntity(BlobServerUrlTypeRef, { url: "otherServer" })],
			})
			when(blobAccessTokenFacade.requestReadTokenArchive(archiveId)).thenResolve(blobServerAccessInfo)

			when(blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, anything(), anything())).thenDo((blobServerAccessInfo, authHeaders) => {
				return Object.assign({ blobAccessToken: blobServerAccessInfo.blobAccessToken }, authHeaders)
			})

			when(restClient.request(anything(), HttpMethod.GET, anything())).thenResolve(JSON.stringify([untypedBlob1, untypedBlob2]))

			const result = await entityRestClient.loadMultiple(MailDetailsBlobTypeRef, archiveId, ids)
			result.map(removeOriginals)
			let expectedOptions = {
				headers: {},
				queryParams: { ids: "0,1,2,3,4", ...authHeader, blobAccessToken, v: String(tutanotaModelInfo.version) },
				responseType: MediaType.Json,
				noCORS: true,
				baseUrl: firstServer,
			}
			verify(
				restClient.request(
					`${await typeRefToRestPath(MailDetailsBlobTypeRef)}/${archiveId}`,
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
			o(result as any).deepEquals([blob1, blob2])
		})

		o("when loading blob elements request is retried with another server url if it failed", async function () {
			const ids = countFrom(0, 5)
			const archiveId = "archiveId"
			const firstServer = "firstServer"

			const blob1 = createTestEntity(MailDetailsBlobTypeRef, {
				_id: ["list", "element1"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				details: createTestEntity(MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			const blob2 = createTestEntity(MailDetailsBlobTypeRef, {
				_id: ["list", "element2"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				details: createTestEntity(MailDetailsTypeRef, {
					_id: "detailsId2",
					recipients: createTestEntity(RecipientsTypeRef, { _id: "recipeintsId2" }),
					body: createTestEntity(BodyTypeRef, { _id: "bodyId2" }),
				}),
			})

			const untypedBlob1 = await instancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, blob1, sk)
			const untypedBlob2 = await instancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, blob2, sk)

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
					queryParams: {
						ids: "0,1,2,3,4",
						...authHeader,
						blobAccessToken,
						v: String(tutanotaModelInfo.version),
					},
					responseType: MediaType.Json,
					noCORS: true,
					baseUrl: firstServer,
					suspensionBehavior: undefined,
				}),
			).thenReject(new ConnectionError("test connection error for retry"))
			when(
				restClient.request(anything(), HttpMethod.GET, {
					headers: {},
					queryParams: {
						ids: "0,1,2,3,4",
						...authHeader,
						blobAccessToken,
						v: String(tutanotaModelInfo.version),
					},
					responseType: MediaType.Json,
					noCORS: true,
					baseUrl: otherServer,
					suspensionBehavior: undefined,
				}),
			).thenResolve(JSON.stringify([untypedBlob1, untypedBlob2]))

			const result = await entityRestClient.loadMultiple(MailDetailsBlobTypeRef, archiveId, ids)
			result.map(removeOriginals)
			verify(restClient.request(`${await typeRefToRestPath(MailDetailsBlobTypeRef)}/${archiveId}`, HttpMethod.GET, anything()), { times: 2 })

			// There's some weird optimization for list requests where the types to migrate
			// are hardcoded (e.g. PushIdentifier) for *vaguely gestures* optimization reasons.
			o(result as any).deepEquals([blob1, blob2])
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
			const v = (await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)).version
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const newCalendar = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "element"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
			})
			const resultId = "resultId"

			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)
			when(
				restClient.request(`/rest/tutanota/calendarevent/listId`, HttpMethod.POST, {
					baseUrl: undefined,
					headers: { ...authHeader, v: String(v) },
					queryParams: undefined,
					responseType: MediaType.Json,
					body: argThat(async (json) => {
						const untypedInstance = JSON.parse(json)
						const ownerEncSk = base64ToUint8Array(
							AttributeModel.getAttribute<Base64>(
								untypedInstance,
								"_ownerEncSessionKey",
								await typeModelResolver.resolveClientTypeReference(AccountingInfoTypeRef),
							),
						)
						const sk = decryptKey(ownerGroupKey.object, ownerEncSk)
						const calendarInstance = await instancePipeline.decryptAndMap(CalendarEventTypeRef, untypedInstance, sk)
						return deepEqual(newCalendar, calendarInstance)
					}),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify(untypedPersistentPostReturn))

			const result = await entityRestClient.setup("listId", newCalendar, undefined, { ownerKey: ownerGroupKey })

			o(result).equals(resultId)
		})

		o("Setup list entity throws when no listid is passed", async function () {
			const newContact = createTestEntity(ContactTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.setup(null, newContact))
			o(result.message).equals("List id must be defined for LETs")
		})

		o("Setup entity", async function () {
			const v = (await typeModelResolver.resolveClientTypeReference(SupportDataTypeRef)).version
			const newSupportData = createTestEntity(SupportDataTypeRef, {
				_id: "1",
				_permissions: "another id",
				_ownerGroup: "ownerGroupId",
			})
			const untypedSupportData = await instancePipeline.mapAndEncrypt(SupportDataTypeRef, newSupportData, null)
			const resultId = "resultId"
			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)

			when(
				restClient.request(`/rest/tutanota/supportdata`, HttpMethod.POST, {
					baseUrl: undefined,
					headers: { ...authHeader, v: String(v) },
					queryParams: undefined,
					responseType: MediaType.Json,
					body: JSON.stringify(untypedSupportData),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify(untypedPersistentPostReturn))

			const result = await entityRestClient.setup(null, newSupportData)
			o(result).equals(resultId)
		})

		o("Setup entity throws when listid is passed", async function () {
			const newCustomer = createTestEntity(CustomerTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.setup("listId", newCustomer))
			o(result.message).equals("List id must not be defined for ETs")
		})

		o("Base URL option is passed to the rest client", async function () {
			const resultId = "resultId"
			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			const newCalendar = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "element"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
			})

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)

			when(restClient.request(anything(), anything(), anything()), { times: 1 }).thenResolve(JSON.stringify(untypedPersistentPostReturn))
			await entityRestClient.setup("listId", newCalendar, undefined, {
				baseUrl: "some url",
				ownerKey: ownerGroupKey,
			})
			verify(
				restClient.request(
					anything(),
					HttpMethod.POST,
					argThat((arg) => arg.baseUrl === "some url"),
				),
			)
		})

		o("when ownerKey is passed it is used instead for session key resolution", async function () {
			const typeModel = await typeModelResolver.resolveClientTypeReference(AccountingInfoTypeRef)
			const v = typeModel.version
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const newAccountingInfo = createTestEntity(AccountingInfoTypeRef, {
				_id: "id1",
				_permissions: "permissionsId",
				_ownerGroup: ownerGroupId,
			})

			const resultId = "resultId"
			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)

			when(
				restClient.request(`/rest/sys/accountinginfo`, HttpMethod.POST, {
					baseUrl: undefined,
					headers: { ...authHeader, v: String(v) },
					queryParams: undefined,
					responseType: MediaType.Json,
					body: argThat(async (json) => {
						const untypedInstance = JSON.parse(json)
						const ownerEncSk = base64ToUint8Array(
							AttributeModel.getAttribute<Base64>(
								untypedInstance,
								"_ownerEncSessionKey",
								await typeModelResolver.resolveClientTypeReference(AccountingInfoTypeRef),
							),
						)
						const sk = decryptKey(ownerGroupKey.object, ownerEncSk)
						const actualAccountingInfo = await instancePipeline.decryptAndMap(AccountingInfoTypeRef, untypedInstance, sk)
						return deepEqual(newAccountingInfo, actualAccountingInfo)
					}),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify(untypedPersistentPostReturn))

			const result = await entityRestClient.setup(null, newAccountingInfo, undefined, { ownerKey: ownerGroupKey })
			verify(cryptoFacadePartialStub.resolveSessionKey(anything()), { times: 0 })

			o(result).equals(resultId)
		})
	})

	o.spec("Setup multiple", function () {
		o("Less than 100 entities created should result in a single rest request", async function () {
			const newGroupMembers = groupMembers(1)
			const { version } = await typeModelResolver.resolveClientTypeReference(GroupMemberTypeRef)
			const resultId = "resultId"

			const untypedGroupMembers = await promiseMap(newGroupMembers, async (group) => {
				return instancePipeline.mapAndEncrypt(GroupMemberTypeRef, group, null)
			})

			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})
			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)

			when(
				restClient.request(`/rest/sys/groupmember/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "1" },
					responseType: MediaType.Json,
					body: JSON.stringify(untypedGroupMembers),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify([untypedPersistentPostReturn]))

			const result = await entityRestClient.setupMultiple("listId", newGroupMembers)

			o(result).deepEquals([resultId])
		})

		o("Exactly 100 entities created should result in a single rest request", async function () {
			const newGroupMembers = groupMembers(100)
			const resultIds = countFrom(0, 100).map(String)
			const { version } = await typeModelResolver.resolveClientTypeReference(GroupMemberTypeRef)
			const untypedGroupMembers = await promiseMap(newGroupMembers, async (group) => {
				return instancePipeline.mapAndEncrypt(GroupMemberTypeRef, group, null)
			})

			const untypedPostReturns = await promiseMap(resultIds, async (id) => {
				const instance = createTestEntity(PersistenceResourcePostReturnTypeRef, {
					generatedId: id,
					permissionListId: "permissionListId",
				})
				return await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, instance, null)
			})

			when(
				restClient.request(`/rest/sys/groupmember/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: JSON.stringify(untypedGroupMembers),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify(untypedPostReturns))

			const result = await entityRestClient.setupMultiple("listId", newGroupMembers)
			o(result).deepEquals(resultIds)
		})

		o("More than 100 entities created should result in 2 rest requests", async function () {
			const newGroupMembers = groupMembers(101)
			const resultIds = countFrom(0, 101).map(String)
			const { version } = await typeModelResolver.resolveClientTypeReference(GroupMemberTypeRef)
			const untypedGroupMembers = await promiseMap(newGroupMembers, async (group) => {
				return instancePipeline.mapAndEncrypt(GroupMemberTypeRef, group, null)
			})

			const untypedPostReturns = await promiseMap(resultIds, async (id) => {
				const instance = createTestEntity(PersistenceResourcePostReturnTypeRef, {
					generatedId: id,
					permissionListId: "permissionListId",
				})
				return await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, instance, null)
			})

			when(
				restClient.request(`/rest/sys/groupmember/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: JSON.stringify(untypedGroupMembers.slice(0, 100)),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify(untypedPostReturns.slice(0, 100)))

			when(
				restClient.request(`/rest/sys/groupmember/listId`, HttpMethod.POST, {
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "1" },
					responseType: MediaType.Json,
					body: JSON.stringify(untypedGroupMembers.slice(100)),
				}),
				{ times: 1 },
			).thenResolve(JSON.stringify(untypedPostReturns.slice(100)))

			const result = await entityRestClient.setupMultiple("listId", newGroupMembers)
			o(result).deepEquals(resultIds)
		})

		o("A single request is made and an error occurs, all entities should be returned as failedInstances", async function () {
			when(restClient.request(anything(), anything(), anything())).thenReject(new BadRequestError("canny do et"))

			const newContacts = groupMembers(100)
			const result = await assertThrows(SetupMultipleError, () => entityRestClient.setupMultiple("listId", newContacts))
			o(result.failedInstances.length).equals(newContacts.length)
			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof BadRequestError).equals(true)
			o(result.failedInstances).deepEquals(newContacts)
		})

		o("Post multiple: An error is encountered for part of the request, only failed entities are returned in the result", async function () {
			const newGroupMembers = groupMembers(400)
			const resultIds = countFrom(0, 400).map(String)
			const { version } = await typeModelResolver.resolveClientTypeReference(GroupMemberTypeRef)
			const untypedGroupMembers = await promiseMap(newGroupMembers, async (group) => {
				return instancePipeline.mapAndEncrypt(GroupMemberTypeRef, group, null)
			})

			const untypedPostReturns = await promiseMap(resultIds, async (id) => {
				const instance = createTestEntity(PersistenceResourcePostReturnTypeRef, {
					generatedId: id,
					permissionListId: "permissionListId",
				})
				return await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, instance, null)
			})
			let requestCounter = 0
			when(restClient.request(anything(), anything(), anything())).thenDo(() => {
				requestCounter += 1

				if (requestCounter % 2 === 0) {
					// Second and Fourth requests are success
					return JSON.stringify(untypedPostReturns.slice((requestCounter - 1) * 100, requestCounter * 100))
				} else {
					// First and Third requests are failure
					throw new BadRequestError("It was a bad request")
				}
			})

			const result = await assertThrows(SetupMultipleError, () => entityRestClient.setupMultiple("listId", newGroupMembers))
			verify(restClient.request(anything(), anything()), { times: 4, ignoreExtraArgs: true })
			o(result.failedInstances).deepEquals(newGroupMembers.slice(0, 100).concat(newGroupMembers.slice(200, 300)))
			o(result.errors.length).equals(2)
			o(result.errors.every((e) => e instanceof BadRequestError)).equals(true)
		})

		o("Post multiple: When a PayloadTooLarge error occurs individual instances are posted", async function () {
			const listId = "listId"
			const instances = groupMembers(3)
			const idArray = ["0", null, "2"] // GET fails for id 1

			const untypedPostReturns = await promiseMap(idArray, async (id) => {
				const instance = createTestEntity(PersistenceResourcePostReturnTypeRef, {
					generatedId: id,
					permissionListId: "permissionListId",
				})
				return await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, instance, null)
			})

			let step = 0
			when(restClient.request(anything(), anything(), anything())).thenDo((path: string, method: HttpMethod, { body }) => {
				//post multiple - body is an array
				if (body && body.startsWith("[")) {
					throw new PayloadTooLargeError("test") //post single
				} else if (step === 1) {
					step += 1
					throw new InternalServerError("might happen")
				} else {
					return JSON.stringify(untypedPostReturns[step++])
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
			const { version } = await typeModelResolver.resolveClientTypeReference(SupportDataTypeRef)
			const newSupportData = createTestEntity(SupportDataTypeRef, {
				_id: "id",
			})
			newSupportData._original = structuredClone(newSupportData)
			const patchPayload = createPatchList({ patches: [] })
			const untypedPatchPayload = await instancePipeline.mapAndEncrypt(PatchListTypeRef, patchPayload, null)
			when(
				restClient.request("/rest/tutanota/supportdata/id", HttpMethod.PATCH, {
					headers: { ...authHeader, v: String(version) },
					body: JSON.stringify(untypedPatchPayload),
				}),
			)

			await entityRestClient.update(newSupportData)
		})

		o("Update entity throws if entity does not have an id", async function () {
			const newCustomer = createTestEntity(CustomerTypeRef, { _id: undefined })
			const result = await assertThrows(Error, async () => await entityRestClient.update(newCustomer))
			o(result.message).equals("Id must be defined")
		})

		o("when ownerKey is passed it is used instead for session key resolution", async function () {
			const typeModel = await typeModelResolver.resolveClientTypeReference(AccountingInfoTypeRef)
			const version = typeModel.version
			const ownerKeyProviderSk = aes256RandomKey()
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const ownerEncSessionKey = _encryptKeyWithVersionedKey(ownerGroupKey, ownerKeyProviderSk)
			const newAccountingInfo = createTestEntity(AccountingInfoTypeRef, {
				_id: "id1",
				_permissions: "permissionsId",
				_ownerGroup: ownerGroupId,
			})
			newAccountingInfo._original = structuredClone(newAccountingInfo)
			newAccountingInfo._ownerEncSessionKey = ownerEncSessionKey.key
			newAccountingInfo._ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()

			when(restClient.request(anything(), anything(), anything())).thenResolve(null)
			await entityRestClient.update(newAccountingInfo, {
				ownerKeyProvider: async (version: KeyVersion) => {
					o(version).equals(ownerGroupKey.version)
					return ownerGroupKey.object
				},
			})

			verify(
				restClient.request(
					"/rest/sys/accountinginfo/id1",
					HttpMethod.PATCH,
					argThat(async (options) => {
						// this patch list must include two patch operations: replace for _ownerEncSessionKey and _ownerKeyVersion on newAccountingInfo
						const patchList = await instancePipeline.decryptAndMap(PatchListTypeRef, JSON.parse(options.body), null)
						const ownerEncSessionKeyOperation = assertNotNull(
							patchList.patches.find((operation) => typeModel.values[parseInt(operation.attributePath)].name == "_ownerEncSessionKey"),
						)
						const ownerKeyVersionOperation = assertNotNull(
							patchList.patches.find((operation) => typeModel.values[parseInt(operation.attributePath)].name == "_ownerKeyVersion"),
						)
						return (
							deepEqual(options.headers, {
								...authHeader,
								v: String(version),
							}) &&
							patchList.patches.length == 2 &&
							ownerEncSessionKeyOperation.value == uint8ArrayToBase64(ownerEncSessionKey.key) &&
							ownerKeyVersionOperation.value == ownerEncSessionKey.encryptingKeyVersion.toString() &&
							ownerEncSessionKeyOperation.patchOperation == PatchOperationType.REPLACE &&
							ownerKeyVersionOperation.patchOperation == PatchOperationType.REPLACE
						)
					}),
				),
			)
		})
	})

	o.spec("Delete", function () {
		o("Delete entity", async function () {
			const { version } = await typeModelResolver.resolveClientTypeReference(CustomerTypeRef)
			const id = "id"
			const newCustomer = createTestEntity(CustomerTypeRef, {
				_id: id,
			})
			when(
				restClient.request("/rest/sys/customer/id", HttpMethod.DELETE, {
					headers: { ...authHeader, v: String(version) },
				}),
			)

			await entityRestClient.erase(newCustomer)
		})

		o("Delete entities", async function () {
			const { version } = await typeModelResolver.resolveClientTypeReference(CustomerTypeRef)
			const id = "id"
			const idTwo = "id2"

			const newCustomer = createTestEntity(CalendarEventTypeRef, {
				_id: ["foo", id],
			})
			const secondNewCustomer = createTestEntity(CalendarEventTypeRef, {
				_id: ["foo", idTwo],
			})

			when(
				restClient.request("/rest/tutanota/calendarevent/foo?ids=id,id2", HttpMethod.DELETE, {
					headers: { ...authHeader, v: String(version) },
				}),
			)

			await entityRestClient.eraseMultiple("foo", [newCustomer, secondNewCustomer])
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

function typeRefOfModel(model: TypeModel): TypeRef<unknown> {
	return new TypeRef(model.app, model.id)
}

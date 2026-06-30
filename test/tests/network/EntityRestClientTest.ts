import o, { assertThrows, spy } from "@tutao/otest"
import { DEFAULT_REST_CLIENT_OPTIONS, RestClient, restError } from "../../../src/platform-kit/rest-client"
import { HttpMethod, MediaType, RestTextBody } from "../../../src/platform-kit/rest-client/types"
import { SetupMultipleError } from "../../../src/platform-kit/network/error/SetupMultipleError.js"
import { Entity, TypeRef } from "../../../src/platform-kit/meta"
import {
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	doBlobRequestWithRetry,
	EntityMigrator,
	EntityRestClient,
	tryServers,
} from "../../../src/platform-kit/network/EntityRestClient"
import { CryptoFacade } from "../../../src/platform-kit/base/base-crypto/CryptoFacade.js"
import { explain, func, instance, matchers, object, verify, when } from "testdouble"
import { UserFacade } from "../../../src/platform-kit/base/facades/UserFacade.js"
import {
	arrayEquals,
	assertNotNull,
	deepEqual,
	downcast,
	KeyVersion,
	Mapper,
	noOp,
	Nullable,
	ofClass,
	promiseMap,
	uint8ArrayToBase64,
} from "../../../src/platform-kit/utils"
import { ProgrammingError } from "../../../src/platform-kit/app-env"
import { BlobAccessTokenFacade } from "../../../src/platform-kit/network/BlobAccessTokenFacade.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../TestUtils.js"
import {
	DecryptedParsedInstance,
	EntityAdapter,
	InstancePipeline,
	LoggedInUserProvider,
	PatchOperationType,
	TypeModelResolver,
} from "../../../src/platform-kit/instance-pipeline"
import {
	aes256RandomKey,
	AesKey,
	generateKdfNonce,
	KdfNonce,
	SubKeyInfoWithGroupKey,
	SymmetricCipherVersion,
	VersionedKey,
} from "../../../src/platform-kit/crypto"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient"
import { KeyLoaderFacade } from "../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import { AsymmetricCryptoFacade } from "../../../src/platform-kit/base/base-crypto/AsymmetricCryptoFacade"
import PublicEncryptionKeyProvider from "../../../src/platform-kit/base/base-crypto/PublicEncryptionKeyProvider"
import { KeyRotationFacade } from "../../../src/platform-kit/base/base-crypto/KeyRotationFacade"
import { LoginIncompleteError } from "../../../src/platform-kit/rest-client/error"
import {
	BodyTypeRef,
	CalendarEventTypeRef,
	ContactTypeRef,
	FileTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	RecipientsTypeRef,
	SupportDataTypeRef,
	tutanotaModelInfo,
} from "@tutao/entities/tutanota"
import { BlobServerAccessInfoTypeRef, BlobServerUrlTypeRef } from "@tutao/entities/storage"
import { PersistenceResourcePostReturnTypeRef } from "@tutao/entities/base"
import {
	AccountingInfoTypeRef,
	createPatchList,
	CustomerTypeRef,
	GroupMemberTypeRef,
	PatchList,
	PatchListTypeRef,
	sysModelInfo,
	UpdateKdfNoncePostIn,
	UpdateKdfNoncePostOutTypeRef,
	UpdateKdfNonceService,
} from "@tutao/entities/sys"
import { ServiceExecutor } from "../../../src/platform-kit/network/ServiceExecutor"
import { CacheManager } from "../../../src/platform-kit/base/base-crypto/persistence/CacheManager"
import { SymmetricEncryptionScheme } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { CryptoWrapper } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/CryptoWrapper"
import { InstanceSessionKeysCache } from "../../../src/platform-kit/base/base-crypto/persistence/InstanceSessionKeysCache"
import { IncomingServerJson, OutgoingServerJson } from "../../../src/platform-kit/instance-pipeline/TypeMapper"
import { EntityUtils } from "../../../src/platform-kit/instance-pipeline/EntityUtils"

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

class EntityMigratorStub implements EntityMigrator {
	async applyMigrations(typeRef: TypeRef<Entity>, data: EntityAdapter): Promise<EntityAdapter> {
		return data
	}
}

type TestLoggedInUserProvider = LoggedInUserProvider & { encryptionScheme: SymmetricEncryptionScheme }

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
	let cryptoWrapper: CryptoWrapper
	let loggedInUserProvider: TestLoggedInUserProvider
	let serviceExecutor: ServiceExecutor

	async function typeRefToRestPath(typeRef: TypeRef<unknown>): Promise<string> {
		return EntityUtils.typeModelToRestPath(await typeModelResolver.resolveClientTypeReference(typeRef))
	}

	o.beforeEach(function () {
		currentDebuggingStatus = env.networkDebugging
		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		// instead of mocking the instance pipeline itself, mock it's internal mapper.
		blobAccessTokenFacade = instance(BlobAccessTokenFacade)
		cryptoWrapper = new CryptoWrapper()

		restClient = object()

		sk = aes256RandomKey()
		ownerGroupKey = { object: aes256RandomKey(), version: 0 }
		encryptedSessionKey = cryptoWrapper.encryptKeyWithVersionedKey(ownerGroupKey, sk)
		when(keyLoaderFacadeMock.loadSymGroupKey(ownerGroupId, 0)).thenResolve(ownerGroupKey.object)

		fullyLoggedIn = true
		serviceExecutor = instance(ServiceExecutor)
		cryptoFacadePartialStub = new CryptoFacade(
			instance(UserFacade),
			instance(EntityClient),
			instance(RestClient),
			serviceExecutor,
			instancePipeline,
			async () => object<CacheManager>(),
			keyLoaderFacadeMock,
			instance(AsymmetricCryptoFacade),
			instance(PublicEncryptionKeyProvider),
			new InstanceSessionKeysCache(),
			cryptoWrapper,
			() => instance(KeyRotationFacade),
			typeModelResolver,
			async () => {
				noOp()
			},
		)
		cryptoFacadePartialStub.resolveSessionKey = async (_instance: Entity): Promise<Nullable<AesKey>> => {
			return sk
		}

		loggedInUserProvider = downcast({
			encryptionScheme: SymmetricEncryptionScheme.AesCbc,
			createAuthHeaders(): Dict {
				return authHeader
			},
			isFullyLoggedIn(): boolean {
				return fullyLoggedIn
			},
			getDefaultSymmetricEncryptionScheme(): SymmetricEncryptionScheme {
				return this.encryptionScheme
			},
		})

		entityRestClient = new EntityRestClient(
			loggedInUserProvider,
			restClient,
			() => cryptoFacadePartialStub,
			instancePipeline,
			blobAccessTokenFacade,
			typeModelResolver,
			() => cryptoFacadePartialStub,
			() => new EntityMigratorStub(),
		)
	})

	o.afterEach(() => {
		env.networkDebugging = currentDebuggingStatus
	})

	function assertThatNoRequestsWereMade() {
		verify(restClient.request(anything(), anything(), anything()), { ignoreExtraArgs: true, times: 0 })
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
			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(instanceWithDebuggingInfo.getJsonRepresentation())
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
			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)
			when(
				restClient.request(requestPath, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version), dv: String(dependsOnVersion) },
					responseType: MediaType.Json,
				}),
			).thenResolve(untypedCalendarInstance.getJsonRepresentation())

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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(sysModelInfo.version) },
					responseType: MediaType.Json,
				}),
			).thenResolve(untypedAccountingInfo.getJsonRepresentation())

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
			when(restClient.request(anything(), anything(), anything())).thenResolve(untypedCalendarInstance.getJsonRepresentation())

			await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1], {
				...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
				queryParams: { foo: "bar" },
				extraHeaders: { baz: "quux" },
			})
			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)
			verify(
				restClient.request(requestPath, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version), dv: String(dependsOnVersion), baz: "quux" },
					responseType: MediaType.Json,
					queryParams: { foo: "bar" },
				}),
			)

			// repeat once again with network debugging enables
			env.networkDebugging = true
			const calendaroWithDebug = await instancePipeline.mapAndEncrypt(calendar._type, calendar, sk)
			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(calendaroWithDebug.getJsonRepresentation())
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
			const ownerKeyProviderEncryptedSessionKey = cryptoWrapper.encryptKeyWithVersionedKey(ownerGroupKey, ownerKeyProviderSk)
			const calendar = createTestEntity(CalendarEventTypeRef, {
				_id: [calendarListId, id1],
				_permissions: "some id",
				_ownerGroup: ownerGroupId,
				_ownerEncSessionKey: ownerKeyProviderEncryptedSessionKey.key,
				_ownerKeyVersion: ownerKeyProviderEncryptedSessionKey.encryptingKeyVersion.toString(),
			})
			const untypedCalendarInstance = await instancePipeline.mapAndEncrypt(CalendarEventTypeRef, calendar, ownerKeyProviderSk)

			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)
			when(
				restClient.request(`${await typeRefToRestPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version), dv: String(dependsOnVersion) },
					responseType: MediaType.Json,
				}),
			).thenResolve(untypedCalendarInstance.getJsonRepresentation())

			const result = await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1], {
				...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
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

			when(restClient.request(requestPath, HttpMethod.GET, anything())).thenResolve(
				OutgoingServerJson.getJsonRepresentationOfMultiple([untypedCalWithDebug1, untypedCalWithDebug2]),
			)
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

			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)
			when(
				restClient.request(`${await typeRefToRestPath(CalendarEventTypeRef)}/${listId}`, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version), dv: String(dependsOnVersion) },
					queryParams: { start: startId, count: String(count), reverse: String(false) },
					responseType: MediaType.Json,
				}),
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedCal1, untypedCal2]))

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
				OutgoingServerJson.getJsonRepresentationOfMultiple([instanceWithDebuggingInfo1, instanceWithDebuggingInfo2]),
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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: "0,1,2,3,4" },
					responseType: MediaType.Json,
				}),
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData1, untypedSupportData2]))

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
			when(restClient.request(anything(), anything(), anything())).thenResolve(
				OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData1, untypedSupportData2]),
			)

			const result = await entityRestClient.loadMultiple(SupportDataTypeRef, null, ids)

			verify(
				restClient.request(`${await typeRefToRestPath(SupportDataTypeRef)}`, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: ids.join(",") },
					responseType: MediaType.Json,
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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(0, 100).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData1]))

			when(
				restClient.request(`${await typeRefToRestPath(SupportDataTypeRef)}`, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: "100" },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData2]))

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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(0, 100).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData1]))

			when(
				restClient.request(await typeRefToRestPath(SupportDataTypeRef), HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(100, 100).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData2]))

			when(
				restClient.request(await typeRefToRestPath(SupportDataTypeRef), HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(tutanotaModelInfo.version) },
					queryParams: { ids: countFrom(200, 11).join(",") },
					responseType: MediaType.Json,
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedSupportData3]))

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

			when(restClient.request(anything(), HttpMethod.GET, anything())).thenResolve(
				OutgoingServerJson.getJsonRepresentationOfMultiple([untypedBlob1, untypedBlob2]),
			)

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
					...DEFAULT_REST_CLIENT_OPTIONS,
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
				}),
			).thenReject(new restError.ConnectionError("test connection error for retry"))
			when(
				restClient.request(anything(), HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
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
				}),
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedBlob1, untypedBlob2]))

			const result = await entityRestClient.loadMultiple(MailDetailsBlobTypeRef, archiveId, ids)
			result.map(removeOriginals)
			verify(restClient.request(`${await typeRefToRestPath(MailDetailsBlobTypeRef)}/${archiveId}`, HttpMethod.GET, anything()), {
				times: 2,
			})

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
			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)
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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version), dv: String(dependsOnVersion) },
					responseType: MediaType.Json,
					body: argThat(async (json: RestTextBody) => {
						const accountingInfoTypeModel = await typeModelResolver.resolveServerTypeReference(AccountingInfoTypeRef)
						const untypedInstance = IncomingServerJson.expectSingleInstance(json.payload, accountingInfoTypeModel)
						const calendarInstance = await instancePipeline.decryptAndMap(untypedInstance, sk)
						return deepEqual(newCalendar, calendarInstance)
					}),
				}),
				{ times: 1 },
			).thenResolve(untypedPersistentPostReturn.getJsonRepresentation())

			const result = await entityRestClient.setup("listId", newCalendar, null, { baseUrl: null, ownerKey: ownerGroupKey })

			o(result).equals(resultId)
		})

		o("Setup generates a random KDF nonce if encrypting with AeadWithGroupKey", async function () {
			loggedInUserProvider.encryptionScheme = SymmetricEncryptionScheme.Aead
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
			when(restClient.request(`/rest/tutanota/calendarevent/listId`, HttpMethod.POST, matchers.anything()), { times: 1 }).thenResolve(
				untypedPersistentPostReturn.getJsonRepresentation(),
			)

			instancePipeline.mapAndEncryptWithSubKeyInfo = spy(instancePipeline.mapAndEncryptWithSubKeyInfo)

			o.check(newCalendar._kdfNonce).equals(null)
			await entityRestClient.setup("listId", newCalendar, null, { baseUrl: null, ownerKey: ownerGroupKey })
			o.check(newCalendar._kdfNonce).notEquals(null)

			o.check(instancePipeline.mapAndEncryptWithSubKeyInfo.invocations.length).equals(1)
			const invocation = instancePipeline.mapAndEncryptWithSubKeyInfo.invocations[0]
			const subKeyInfo: SubKeyInfoWithGroupKey = invocation[1]
			if (subKeyInfo == null || subKeyInfo.cipherVersion !== SymmetricCipherVersion.AeadWithGroupKey) {
				throw new Error()
			}
			o.check(arrayEquals(subKeyInfo.kdfNonce!, newCalendar._kdfNonce!)).equals(true)
		})

		o("Setup overwrites KDF nonce with a random one if encrypting with AeadWithGroupKey", async function () {
			loggedInUserProvider.encryptionScheme = SymmetricEncryptionScheme.Aead
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
			when(restClient.request(`/rest/tutanota/calendarevent/listId`, HttpMethod.POST, matchers.anything()), { times: 1 }).thenResolve(
				untypedPersistentPostReturn.getJsonRepresentation(),
			)

			instancePipeline.mapAndEncryptWithSubKeyInfo = spy(instancePipeline.mapAndEncryptWithSubKeyInfo)

			const originalKdfNonce = new Uint8Array(33) as KdfNonce // not length 32 so that it's not equal to the randomly generated one
			newCalendar._kdfNonce = originalKdfNonce

			await entityRestClient.setup("listId", newCalendar, null, { baseUrl: null, ownerKey: ownerGroupKey })

			o.check(arrayEquals(newCalendar._kdfNonce, originalKdfNonce)).equals(false)

			o.check(instancePipeline.mapAndEncryptWithSubKeyInfo.invocations.length).equals(1)
			const invocation = instancePipeline.mapAndEncryptWithSubKeyInfo.invocations[0]
			const subKeyInfo: SubKeyInfoWithGroupKey = invocation[1]
			if (subKeyInfo == null || subKeyInfo.cipherVersion !== SymmetricCipherVersion.AeadWithGroupKey) {
				throw new Error()
			}
			o.check(arrayEquals(subKeyInfo.kdfNonce!, newCalendar._kdfNonce!)).equals(true)
		})

		o("Setup list entity throws when no listid is passed", async function () {
			const newContact = createTestEntity(ContactTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.setup(null, newContact, null, null))
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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(v) },
					responseType: MediaType.Json,
					body: new RestTextBody(untypedSupportData.getJsonRepresentation()),
				}),
				{ times: 1 },
			).thenResolve(untypedPersistentPostReturn.getJsonRepresentation())

			const result = await entityRestClient.setup(null, newSupportData, null, null)
			o(result).equals(resultId)
		})

		o("Setup entity throws when listid is passed", async function () {
			const newCustomer = createTestEntity(CustomerTypeRef)
			const result = await assertThrows(Error, async () => await entityRestClient.setup("listId", newCustomer, null, null))
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

			when(restClient.request(anything(), anything(), anything()), { times: 1 }).thenResolve(untypedPersistentPostReturn.getJsonRepresentation())
			await entityRestClient.setup("listId", newCalendar, null, {
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
			const { version } = typeModel
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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version) },
					responseType: MediaType.Json,
					body: argThat(async (json: RestTextBody) => {
						const untypedInstance = IncomingServerJson.expectSingleInstance(
							json.payload,
							await typeModelResolver.resolveServerTypeReference(AccountingInfoTypeRef),
						)
						const actualAccountingInfo = await instancePipeline.decryptAndMap(untypedInstance, sk)
						return deepEqual(newAccountingInfo, actualAccountingInfo)
					}),
				}),
				{ times: 1 },
			).thenResolve(untypedPersistentPostReturn.getJsonRepresentation())

			const result = await entityRestClient.setup(null, newAccountingInfo, null, { baseUrl: null, ownerKey: ownerGroupKey })
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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "1" },
					responseType: MediaType.Json,
					body: new RestTextBody(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedGroupMembers)),
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple([untypedPersistentPostReturn]))

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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: new RestTextBody(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedGroupMembers)),
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedPostReturns))

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
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "100" },
					responseType: MediaType.Json,
					body: new RestTextBody(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedGroupMembers.slice(0, 100))),
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedPostReturns.slice(0, 100)))

			when(
				restClient.request(`/rest/sys/groupmember/listId`, HttpMethod.POST, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version) },
					queryParams: { count: "1" },
					responseType: MediaType.Json,
					body: new RestTextBody(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedGroupMembers.slice(100))),
				}),
				{ times: 1 },
			).thenResolve(OutgoingServerJson.getJsonRepresentationOfMultiple(untypedPostReturns.slice(100)))

			const result = await entityRestClient.setupMultiple("listId", newGroupMembers)
			o(result).deepEquals(resultIds)
		})

		o("A single request is made and an error occurs, all entities should be returned as failedInstances", async function () {
			when(restClient.request(anything(), anything(), anything())).thenReject(new restError.BadRequestError("canny do et"))

			const newContacts = groupMembers(100)
			const result = await assertThrows(SetupMultipleError, () => entityRestClient.setupMultiple("listId", newContacts))
			o(result.failedInstances.length).equals(newContacts.length)
			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof restError.BadRequestError).equals(true)
			o(result.failedInstances).deepEquals(newContacts)
		})

		o("Post multiple: An error is encountered for part of the request, only failed entities are returned in the result", async function () {
			const newGroupMembers = groupMembers(400)
			const resultIds = countFrom(0, 400).map(String)

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
					return OutgoingServerJson.getJsonRepresentationOfMultiple(untypedPostReturns.slice((requestCounter - 1) * 100, requestCounter * 100))
				} else {
					// First and Third requests are failure
					throw new restError.BadRequestError("It was a bad request")
				}
			})

			const result = await assertThrows(SetupMultipleError, () => entityRestClient.setupMultiple("listId", newGroupMembers))
			o(explain(restClient.request).callCount).equals(4)
			o(result.failedInstances).deepEquals(newGroupMembers.slice(0, 100).concat(newGroupMembers.slice(200, 300)))
			o(result.errors.length).equals(2)
			o(result.errors.every((e) => e instanceof restError.BadRequestError)).equals(true)
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
				if (body instanceof RestTextBody && body.payload.startsWith("[")) {
					throw new restError.PayloadTooLargeError("test") //post single
				} else if (step === 1) {
					step += 1
					throw new restError.InternalServerError("might happen")
				} else {
					return untypedPostReturns.at(step++)?.getJsonRepresentation()
				}
			})
			const result = await assertThrows(SetupMultipleError, async () => {
				return await entityRestClient.setupMultiple(listId, instances)
			})
			//one post multiple and three individual posts
			verify(restClient.request(anything(), anything(), anything()), { ignoreExtraArgs: true, times: 4 })
			o(result.failedInstances.length).equals(1) //one individual post results in an error

			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof restError.InternalServerError).equals(true)
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
			const untypedPatchPayload = await instancePipeline.mapAndEncryptToParsedInstance(PatchListTypeRef, patchPayload, null)

			await entityRestClient.update(newSupportData)

			verify(
				restClient.request(
					"/rest/tutanota/supportdata/id",
					HttpMethod.PATCH,
					argThat(async (options) => {
						o(options.headers).deepEquals({ ...authHeader, v: String(version) })
						const patchListTypeModel = await typeModelResolver.resolveServerTypeReference(PatchListTypeRef)
						const actual = IncomingServerJson.expectSingleInstance(options.body, patchListTypeModel)
						o(untypedPatchPayload.getAttributeByName("patches")).deepEquals(actual.getValueByName("patches"))
						o(options.queryParams).equals(undefined)
						o(options.baseUrl).equals(undefined)
						o(options.responseType).equals(MediaType.Json)
					}),
				),
			)
		})

		o("Update entity with external aggregation sets dv header", async function () {
			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(FileTypeRef)
			const dummyFileData = createTestEntity(FileTypeRef, {
				name: "filename",
				_id: ["listId", "elementId"],
			})
			dummyFileData._original = structuredClone(dummyFileData)
			const patchPayload = createPatchList({ patches: [] })
			const untypedPatchPayload = await instancePipeline.mapAndEncryptToParsedInstance(PatchListTypeRef, patchPayload, null)

			await entityRestClient.update(dummyFileData)

			verify(
				restClient.request(
					"/rest/tutanota/file/listId/elementId",
					HttpMethod.PATCH,
					argThat(async (options) => {
						o(options.headers).deepEquals({
							...authHeader,
							v: String(version),
							dv: String(dependsOnVersion),
						})
						const actual = IncomingServerJson.expectSingleInstance(
							options.body,
							await typeModelResolver.resolveServerTypeReference(PatchListTypeRef),
						)
						o(untypedPatchPayload.getAttributeByName("patches")).deepEquals(actual.getValueByName("patches"))
						o(options.queryParams).equals(undefined)
						o(options.baseUrl).equals(undefined)
						o(options.responseType).equals(MediaType.Json)
					}),
				),
			)
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
			const ownerEncSessionKey = cryptoWrapper.encryptKeyWithVersionedKey(ownerGroupKey, ownerKeyProviderSk)
			const newAccountingInfo = createTestEntity(AccountingInfoTypeRef, {
				_id: "id1",
				_permissions: "permissionsId",
				_ownerGroup: ownerGroupId,
			})
			newAccountingInfo._original = structuredClone(newAccountingInfo)
			newAccountingInfo._ownerEncSessionKey = ownerEncSessionKey.key
			newAccountingInfo._ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()

			when(restClient.request(anything(), anything(), anything())).thenResolve(null)
			await entityRestClient.update(newAccountingInfo, { baseUrl: null, ownerKey: ownerGroupKey })

			verify(
				restClient.request(
					"/rest/sys/accountinginfo/id1",
					HttpMethod.PATCH,
					argThat(async (options) => {
						// this patch list must include two patch operations: replace for _ownerEncSessionKey and _ownerKeyVersion on newAccountingInfo
						const patchList = await instancePipeline.decryptAndMap<PatchList>(
							IncomingServerJson.expectSingleInstance(options.body, typeModel),
							null,
						)
						const ownerEncSessionKeyOperation = assertNotNull(
							patchList.patches.find((operation) => typeModel.values[parseInt(operation.attributePath)].name === "_ownerEncSessionKey"),
						)
						const ownerKeyVersionOperation = assertNotNull(
							patchList.patches.find((operation) => typeModel.values[parseInt(operation.attributePath)].name === "_ownerKeyVersion"),
						)
						return (
							deepEqual(options.headers, {
								...authHeader,
								v: String(version),
							}) &&
							patchList.patches.length === 2 &&
							ownerEncSessionKeyOperation.value === uint8ArrayToBase64(ownerEncSessionKey.key) &&
							ownerKeyVersionOperation.value === ownerEncSessionKey.encryptingKeyVersion.toString() &&
							ownerEncSessionKeyOperation.patchOperation === PatchOperationType.REPLACE &&
							ownerKeyVersionOperation.patchOperation === PatchOperationType.REPLACE
						)
					}),
				),
			)
		})

		o("Update creates new KDF nonce when it is missing and required", async function () {
			loggedInUserProvider.encryptionScheme = SymmetricEncryptionScheme.Aead
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const calendarEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "element"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
			})
			const resultId = "resultId"

			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			calendarEvent._kdfNonce = null

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)
			when(restClient.request(`/rest/tutanota/calendarevent/listId`, HttpMethod.POST, matchers.anything()), { times: 1 }).thenResolve(
				untypedPersistentPostReturn.getJsonRepresentation(),
			)

			instancePipeline.cryptoMapper.encryptParsedInstance = spy(instancePipeline.cryptoMapper.encryptParsedInstance)

			calendarEvent._original = structuredClone(calendarEvent)
			calendarEvent.summary = "totally different"
			calendarEvent._ownerKeyVersion = ownerGroupKey.version.toString()

			when(serviceExecutor.post(UpdateKdfNonceService, matchers.anything(), null)).thenDo((_: any, postIn: UpdateKdfNoncePostIn) =>
				createTestEntity(UpdateKdfNoncePostOutTypeRef, { kdfNonce: postIn.instanceKdfNonce.kdfNonce }),
			)

			await entityRestClient.update(calendarEvent, { baseUrl: null, ownerKey: ownerGroupKey })

			o.check(calendarEvent._kdfNonce).notEquals(null)

			let clientTypeModel = await typeModelResolver.resolveClientTypeReference(calendarEvent._type)

			o.check(instancePipeline.cryptoMapper.encryptParsedInstance.invocations.length).equals(3)
			const invocation = instancePipeline.cryptoMapper.encryptParsedInstance.invocations[0]
			o.check(clientTypeModel).deepEquals((invocation[0] as DecryptedParsedInstance).ensureOutgoing())
			const subKeyInfo: SubKeyInfoWithGroupKey = invocation[1]
			if (subKeyInfo == null || subKeyInfo.cipherVersion !== SymmetricCipherVersion.AeadWithGroupKey) {
				throw new Error()
			}
			o.check(arrayEquals(subKeyInfo.kdfNonce!, calendarEvent._kdfNonce!)).equals(true)
		})

		o("Update accepts KDF nonce from the server when trying to create a new one", async function () {
			loggedInUserProvider.encryptionScheme = SymmetricEncryptionScheme.Aead
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const calendarEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "element"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
			})
			const resultId = "resultId"

			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			calendarEvent._kdfNonce = null

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)
			when(restClient.request(`/rest/tutanota/calendarevent/listId`, HttpMethod.POST, matchers.anything()), { times: 1 }).thenResolve(
				untypedPersistentPostReturn.getJsonRepresentation(),
			)

			instancePipeline.cryptoMapper.encryptParsedInstance = spy(instancePipeline.cryptoMapper.encryptParsedInstance)

			calendarEvent._original = structuredClone(calendarEvent)
			calendarEvent.summary = "totally different"
			calendarEvent._ownerKeyVersion = ownerGroupKey.version.toString()

			let kdfNonce = generateKdfNonce()

			when(serviceExecutor.post(UpdateKdfNonceService, matchers.anything(), null)).thenResolve(
				createTestEntity(UpdateKdfNoncePostOutTypeRef, { kdfNonce }),
			)

			await entityRestClient.update(calendarEvent, { baseUrl: null, ownerKey: ownerGroupKey })

			o.check(calendarEvent._kdfNonce).notEquals(null)

			let clientTypeModel = await typeModelResolver.resolveClientTypeReference(calendarEvent._type)

			o.check(instancePipeline.cryptoMapper.encryptParsedInstance.invocations.length).equals(3)
			const invocation = instancePipeline.cryptoMapper.encryptParsedInstance.invocations[0]
			o.check(clientTypeModel).deepEquals((invocation[0] as DecryptedParsedInstance).ensureOutgoing())
			const subKeyInfo: SubKeyInfoWithGroupKey = invocation[1]
			if (subKeyInfo == null || subKeyInfo.cipherVersion !== SymmetricCipherVersion.AeadWithGroupKey) {
				throw new Error()
			}
			o.check(arrayEquals(subKeyInfo.kdfNonce!, calendarEvent._kdfNonce!)).equals(true)
			o.check(arrayEquals(subKeyInfo.kdfNonce!, kdfNonce)).equals(true)
		})

		o("Update does not overwrite KDF nonce", async function () {
			loggedInUserProvider.encryptionScheme = SymmetricEncryptionScheme.Aead
			const ownerGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const calendarEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "element"],
				_permissions: "permissions",
				_ownerGroup: ownerGroupId,
			})
			const resultId = "resultId"

			const persistentPostReturn = createTestEntity(PersistenceResourcePostReturnTypeRef, {
				generatedId: resultId,
				permissionListId: "permissionListId",
			})

			const originalKdfNonce = generateKdfNonce()
			calendarEvent._kdfNonce = originalKdfNonce

			const untypedPersistentPostReturn = await instancePipeline.mapAndEncrypt(PersistenceResourcePostReturnTypeRef, persistentPostReturn, null)
			when(restClient.request(`/rest/tutanota/calendarevent/listId`, HttpMethod.POST, matchers.anything()), { times: 1 }).thenResolve(
				untypedPersistentPostReturn.getJsonRepresentation(),
			)

			instancePipeline.cryptoMapper.encryptParsedInstance = spy(instancePipeline.cryptoMapper.encryptParsedInstance)

			calendarEvent._original = structuredClone(calendarEvent)
			calendarEvent.summary = "totally different"
			calendarEvent._ownerKeyVersion = ownerGroupKey.version.toString()

			await entityRestClient.update(calendarEvent, { baseUrl: null, ownerKey: ownerGroupKey })

			verify(serviceExecutor.post(UpdateKdfNonceService, matchers.anything(), null), { times: 0 })

			o.check(arrayEquals(calendarEvent._kdfNonce, originalKdfNonce)).equals(true)

			let clientTypeModel = await typeModelResolver.resolveClientTypeReference(calendarEvent._type)

			o.check(instancePipeline.cryptoMapper.encryptParsedInstance.invocations.length).equals(3)
			const invocation = instancePipeline.cryptoMapper.encryptParsedInstance.invocations[0]
			o.check(clientTypeModel).deepEquals((invocation[0] as DecryptedParsedInstance).ensureOutgoing())
			const subKeyInfo: SubKeyInfoWithGroupKey = invocation[1]
			if (subKeyInfo == null || subKeyInfo.cipherVersion !== SymmetricCipherVersion.AeadWithGroupKey) {
				throw new Error()
			}
			o.check(arrayEquals(subKeyInfo.kdfNonce!, calendarEvent._kdfNonce!)).equals(true)
		})
	})

	o.spec("Delete", function () {
		o("Delete entity", async function () {
			const { version } = await typeModelResolver.resolveClientTypeReference(CustomerTypeRef)
			const id = "id"
			const newCustomer = createTestEntity(CustomerTypeRef, {
				_id: id,
			})

			await entityRestClient.erase(newCustomer)

			verify(
				restClient.request("/rest/sys/customer/id", HttpMethod.DELETE, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version) },
				}),
			)
		})

		o("Delete entities", async function () {
			const { version, dependsOnVersion } = await typeModelResolver.resolveClientTypeReference(CalendarEventTypeRef)
			const id = "id"
			const idTwo = "id2"

			const newCustomer = createTestEntity(CalendarEventTypeRef, {
				_id: ["foo", id],
			})
			const secondNewCustomer = createTestEntity(CalendarEventTypeRef, {
				_id: ["foo", idTwo],
			})

			await entityRestClient.eraseMultiple("foo", [newCustomer, secondNewCustomer])

			verify(
				restClient.request("/rest/tutanota/calendarevent/foo", HttpMethod.DELETE, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					headers: { ...authHeader, v: String(version), dv: String(dependsOnVersion) },
					queryParams: { ids: "id,id2" },
				}),
			)
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
			when(mapperMock("w1", 0)).thenReject(new restError.ConnectionError("test"))
			when(mapperMock("w2", 1)).thenResolve(expectedResult)
			const result = await tryServers(servers, mapperMock, "error")
			o(result).deepEquals(expectedResult)
			verify(mapperMock(anything(), anything()), { times: 2 })
		})

		o("tryServers multiple ConnectionError", async function () {
			let servers = [createTestEntity(BlobServerUrlTypeRef, { url: "w1" }), createTestEntity(BlobServerUrlTypeRef, { url: "w2" })]
			const mapperMock = func<Mapper<string, object>>()
			when(mapperMock("w1", 0)).thenReject(new restError.ConnectionError("test"))
			when(mapperMock("w2", 1)).thenReject(new restError.ConnectionError("test"))
			const e = await assertThrows(restError.ConnectionError, () => tryServers(servers, mapperMock, "error log msg"))
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
				throw new restError.NotAuthorizedError("test error")
			}
			const evictCache = () => {
				evictCacheCallCount += 1
			}
			await doBlobRequestWithRetry(doBlobRequest, evictCache).catch(
				ofClass(restError.NotAuthorizedError, (_) => {
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
					throw new restError.NotAuthorizedError("test error")
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

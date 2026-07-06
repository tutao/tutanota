import o, { assertThrows, verify } from "@tutao/otest"
import { DEFAULT_REST_CLIENT_OPTIONS, RestClient } from "../../../src/platform-kit/rest-client"
import { HttpMethod, MediaType, RestClientOptions, RestTextBody } from "../../../src/platform-kit/rest-client/types"
import { CryptoFacade } from "../../../src/platform-kit/base/base-crypto/CryptoFacade.js"
import { matchers, object, when } from "testdouble"
import { DeleteService, GetService, PostService, PutService, ServerTypeModel } from "../../../src/platform-kit/meta"
import { assert, deepEqual, downcast } from "../../../src/platform-kit/utils"
import { ProgrammingError } from "../../../src/platform-kit/app-env"
import { clientInitializedTypeModelResolver, createTestEntity, removeOriginals } from "../TestUtils.js"
import { InstancePipeline, LoggedInUserProvider, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import { aes256RandomKey, AesKey, SymmetricCipherFacade, SymmetricEncryptionScheme } from "../../../src/platform-kit/crypto"
import { LoginIncompleteError } from "../../../src/platform-kit/rest-client/error"
import { CustomerAccountReturnTypeRef, CustomerAccountService } from "@tutao/entities/accounting"
import {
	AlarmNotificationTypeRef,
	AlarmServicePost,
	AlarmServicePostTypeRef,
	GiftCardCreateData,
	GiftCardCreateDataTypeRef,
	SaltData,
	SaltDataTypeRef,
	UserAlarmInfoDataTypeRef,
} from "@tutao/entities/sys"
import { ServiceExecutor } from "../../../src/platform-kit/network/ServiceExecutor"
import { IncomingServerJson } from "../../../src/platform-kit/instance-pipeline/TypeMapper"
import { AEAD_FACADE } from "@tutao/crypto/aead-facade"
import { AES_CBC_FACADE } from "@tutao/crypto/aes-cbc-facade"
import { SYMMETRIC_KEY_DERIVER } from "@tutao/crypto/symmetric-key-deriver"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../src/platform-kit/instance-pipeline/RestClientOptions"

const { anything } = matchers

o.spec("ServiceExecutor", function () {
	const service = {
		app: "testapp",
		name: "testservice",
	}
	let restClient: RestClient
	let authHeaders: Record<string, string> = {}
	let instancePipeline: InstancePipeline
	let cryptoFacade: CryptoFacade
	let executor: ServiceExecutor
	let fullyLoggedIn: boolean = true
	let sessionKey: AesKey
	let alarmServicePostData: AlarmServicePost
	let alarmServicePostDataTypeModel: ServerTypeModel
	let saltDataTypeModel: ServerTypeModel
	let saltData: SaltData
	let saltDataJson: string
	let alarmServicePostDataJson: string
	let typeModelResolver: TypeModelResolver

	const authDataProvider: LoggedInUserProvider = downcast({
		createAuthHeaders(): Dict {
			return authHeaders
		},
		isFullyLoggedIn(): boolean {
			return fullyLoggedIn
		},
		getDefaultSymmetricEncryptionScheme(): SymmetricEncryptionScheme {
			return SymmetricEncryptionScheme.AesCbc
		},
	})

	o.beforeEach(async () => {
		restClient = object()
		authHeaders = {}
		fullyLoggedIn = true

		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = new InstancePipeline(typeModelResolver, () => null!, new SymmetricCipherFacade(AES_CBC_FACADE, AEAD_FACADE, SYMMETRIC_KEY_DERIVER))
		sessionKey = aes256RandomKey()

		cryptoFacade = object()
		executor = new ServiceExecutor(restClient, authDataProvider, instancePipeline, () => cryptoFacade, typeModelResolver)

		saltData = createTestEntity(SaltDataTypeRef, { mailAddress: "someuser@example.org" }, { populateAggregates: true })
		alarmServicePostData = createTestEntity(AlarmServicePostTypeRef, {
			alarmNotifications: [createTestEntity(AlarmNotificationTypeRef, {}, { populateAggregates: true })],
			userAlarmInfoData: [createTestEntity(UserAlarmInfoDataTypeRef, {}, { populateAggregates: true })],
		})
		alarmServicePostData.alarmNotifications[0].user = "some-user"

		alarmServicePostDataJson = (await instancePipeline.mapAndEncrypt(alarmServicePostData._type, alarmServicePostData, sessionKey)).getJsonRepresentation()
		saltDataJson = (await instancePipeline.mapAndEncrypt(saltData._type, saltData, sessionKey)).getJsonRepresentation()

		alarmServicePostDataTypeModel = await typeModelResolver.resolveServerTypeReference(alarmServicePostData._type)
		saltDataTypeModel = await typeModelResolver.resolveServerTypeReference(saltData._type)
		assert(alarmServicePostDataTypeModel.encrypted, "AlarmServicePostTypeRef is used to test encrypted-related paths")
		assert(!saltDataTypeModel.encrypted, "SaltDataTypeRef is used to test encrypted-related paths")
	})

	function assertThatNoRequestsWereMade() {
		verify(restClient.request(anything(), anything(), anything()), { ignoreExtraArgs: true, times: 0 })
	}

	function respondWith(response: string | null) {
		when(restClient.request(anything(), anything(), anything()), { ignoreExtraArgs: true }).thenResolve(response ?? undefined)
	}

	o("decryptResponse removes network debugging info", async function () {
		const getService: GetService & DeleteService & PutService & PostService = {
			...service,
			get: { data: null, return: SaltDataTypeRef },
			post: { data: null, return: SaltDataTypeRef },
			put: { data: null, return: SaltDataTypeRef },
			delete: { data: null, return: SaltDataTypeRef },
		}

		env.networkDebugging = true

		const dataWithDebug = await instancePipeline.mapAndEncrypt(saltData._type, saltData, sessionKey)
		respondWith(dataWithDebug.getJsonRepresentation())

		const getResponse = await executor.get(getService, null, null)
		const postResponse = await executor.post(getService, null, null)
		const putResponse = await executor.put(getService, null, null)
		const deleteResponse = await executor.delete(getService, null, null)
		o(getResponse).deepEquals(saltData)
		o(postResponse).deepEquals(saltData)
		o(putResponse).deepEquals(saltData)
		o(deleteResponse).deepEquals(saltData)
	})

	o.spec("GET", function () {
		o("encrypts data", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: AlarmServicePostTypeRef,
					return: null,
				},
			}
			respondWith(null)

			const sessionKey = aes256RandomKey()
			const response = await executor.get(getService, alarmServicePostData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(response).equals(undefined)

			const requestCaptor = matchers.captor()
			verify(restClient.request("/rest/testapp/testservice", HttpMethod.GET, requestCaptor.capture()))

			const requestedEntity = await instancePipeline.decryptAndMap<AlarmServicePost>(
				IncomingServerJson.expectSingleInstance((requestCaptor.value.body as RestTextBody).payload, alarmServicePostDataTypeModel),
				sessionKey,
			)

			o(removeOriginals(requestedEntity)).deepEquals(alarmServicePostData)
		})

		o("maps unencrypted response data to instance", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: null,
					return: SaltDataTypeRef,
				},
			}

			respondWith(saltDataJson)
			const response = await executor.get(getService, null, null)

			o(removeOriginals(response!)).deepEquals(saltData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
		o("maps encrypted response data to instance", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}

			respondWith(alarmServicePostDataJson)
			const response = await executor.get(getService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(removeOriginals(response!)).deepEquals(alarmServicePostData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
		o("when get returns encrypted data and we are not logged in it throws an error", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => executor.get(getService, null, null))
			assertThatNoRequestsWereMade()
		})

		o("when get returns encrypted data and we are not logged in but we have a session key it returns decrypted data", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}
			fullyLoggedIn = false

			respondWith(alarmServicePostDataJson)
			const response = await executor.get(getService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(removeOriginals(response!)).deepEquals(alarmServicePostData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})

		o("when get returns unencrypted data and we are not logged in it does not throw an error", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: null,
					return: SaltDataTypeRef,
				},
			}
			fullyLoggedIn = false

			respondWith(saltDataJson)
			const response = await executor.get(getService, null, null)

			o(removeOriginals(response!)).deepEquals(saltData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
	})

	o.spec("POST", function () {
		o("encrypts data", async function () {
			const postService: PostService = {
				...service,
				post: {
					data: AlarmServicePostTypeRef,
					return: null,
				},
			}

			respondWith(null)
			const response = await executor.post(postService, alarmServicePostData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			const requestOptionsCaptor = matchers.captor()
			verify(restClient.request("/rest/testapp/testservice", HttpMethod.POST, requestOptionsCaptor.capture()))
			const postedJson = IncomingServerJson.expectSingleInstance((requestOptionsCaptor.value.body as RestTextBody).payload, alarmServicePostDataTypeModel)
			const requestedEntity = await instancePipeline.decryptAndMap<AlarmServicePost>(postedJson, sessionKey)

			o(response).equals(undefined)
			o(removeOriginals(requestedEntity!)).deepEquals(alarmServicePostData)
		})

		o("decrypts response data", async function () {
			const postService: PostService = {
				...service,
				post: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}

			respondWith(alarmServicePostDataJson)

			const response = await executor.post(postService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
			o(removeOriginals(response!)).deepEquals(alarmServicePostData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.POST,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
		o("when post returns encrypted data and we are not logged in it throws an error", async function () {
			const postService: PostService = {
				...service,
				post: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => executor.post(postService, null, null))
			assertThatNoRequestsWereMade()
		})

		o("when post returns encrypted data and we are not logged in but we have a session key it returns decrypted data", async function () {
			const getService: PostService = {
				...service,
				post: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}

			fullyLoggedIn = false
			respondWith(alarmServicePostDataJson)

			const response = await executor.post(getService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
			o(removeOriginals(response!)).deepEquals(alarmServicePostData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.POST,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
	})

	o.spec("PUT", function () {
		o("encrypts data", async function () {
			const putService: PutService = {
				...service,
				put: {
					data: AlarmServicePostTypeRef,
					return: null,
				},
			}

			respondWith(null)
			const response = await executor.put(putService, alarmServicePostData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			const optionsCaptor = matchers.captor()
			verify(restClient.request("/rest/testapp/testservice", HttpMethod.PUT, optionsCaptor.capture()))
			const putJson = IncomingServerJson.expectSingleInstance((optionsCaptor.value.body as RestTextBody).payload, alarmServicePostDataTypeModel)
			const putEntity = await instancePipeline.decryptAndMap<AlarmServicePost>(putJson, sessionKey)
			o(removeOriginals(putEntity!)).deepEquals(alarmServicePostData)
			o(response).equals(undefined)
		})

		o("decrypts response data x", async function () {
			const putService: PutService = {
				...service,
				put: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}
			respondWith(alarmServicePostDataJson)

			const response = await executor.put(putService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
			o(removeOriginals(response!)).deepEquals(alarmServicePostData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.PUT,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
		o("when put returns encrypted data and we are not logged in it throws an error", async function () {
			const putService: PutService = {
				...service,
				put: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => executor.put(putService, null, null))
			assertThatNoRequestsWereMade()
		})
	})

	o.spec("DELETE", function () {
		o("encrypts data", async function () {
			const deleteService: DeleteService = {
				...service,
				delete: {
					data: AlarmServicePostTypeRef,
					return: null,
				},
			}
			respondWith(null)

			const response = await executor.delete(deleteService, alarmServicePostData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			const optionsCaptor = matchers.captor()
			verify(restClient.request("/rest/testapp/testservice", HttpMethod.DELETE, optionsCaptor.capture()))
			const deleteJson = IncomingServerJson.expectSingleInstance((optionsCaptor.value.body as RestTextBody).payload, alarmServicePostDataTypeModel)
			const deleteEntity = await instancePipeline.decryptAndMap<AlarmServicePost>(deleteJson, sessionKey)
			o(removeOriginals(deleteEntity)).deepEquals(alarmServicePostData)
			o(response).equals(undefined)
		})

		o("decrypts response data", async function () {
			const deleteService: DeleteService = {
				...service,
				delete: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}

			respondWith(alarmServicePostDataJson)
			const response = await executor.delete(deleteService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(removeOriginals(response!)).deepEquals(alarmServicePostData)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.DELETE,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})

		o("when delete returns encrypted data and we are not logged in it throws an error", async function () {
			const deleteService: DeleteService = {
				...service,
				delete: {
					data: null,
					return: AlarmServicePostTypeRef,
				},
			}
			fullyLoggedIn = false
			await assertThrows(LoginIncompleteError, () => executor.delete(deleteService, null, null))
			assertThatNoRequestsWereMade()
		})
	})

	o.spec("params", function () {
		o("adds query params", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: SaltDataTypeRef,
					return: null,
				},
			}
			const query = Object.freeze({ myQueryParam: "2" })

			respondWith(null)
			const response = await executor.get(getService, saltData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, queryParams: query, sessionKey })

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) => deepEqual(opts.queryParams, query)),
				),
			)
		})

		o("adds extra headers", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: SaltDataTypeRef,
					return: null,
				},
			}

			respondWith(null)
			const response = await executor.get(getService, saltData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, extraHeaders: { myHeader: "2" } })
			o(response).equals(undefined)

			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) =>
						deepEqual(opts.headers, {
							v: String(saltDataTypeModel.version),
							myHeader: "2",
						}),
					),
				),
			)
		})

		o("adds auth headers", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: SaltDataTypeRef,
					return: null,
				},
			}
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const accessToken = "myAccessToken"
			authHeaders = { accessToken }

			respondWith(null)
			const response = await executor.get(getService, data, null)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) =>
						deepEqual(opts.headers, {
							v: String(saltDataTypeModel.version),
							accessToken,
						}),
					),
				),
			)
		})
	})

	o.spec("keys decrypt", function () {
		o.beforeEach(() => {
			executor = new ServiceExecutor(restClient, authDataProvider, instancePipeline, () => cryptoFacade, clientInitializedTypeModelResolver())
		})

		o("uses resolved key to decrypt response x", async function () {
			const customerAccountReturn = createTestEntity(CustomerAccountReturnTypeRef, {
				outstandingBookingsPrice: "42",
				balance: "123",
				postings: [],
			})

			const sk = aes256RandomKey()
			const untypedInstance = await instancePipeline.mapAndEncrypt(CustomerAccountReturnTypeRef, customerAccountReturn, sk)
			when(cryptoFacade.resolveServiceSessionKey(anything())).thenResolve(sk)

			respondWith(untypedInstance.getJsonRepresentation())
			const response = await executor.get(CustomerAccountService, null, null)

			o(removeOriginals(response!)).deepEquals(customerAccountReturn)
			verify(
				restClient.request(
					"/rest/accounting/customeraccountservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})

		o("uses passed key to decrypt response", async function () {
			const customerAccountReturn = createTestEntity(CustomerAccountReturnTypeRef, {
				outstandingBookingsPrice: "42",
				balance: "123",
				postings: [],
			})

			const sessionKey = aes256RandomKey()
			const untypedInstance = await instancePipeline.mapAndEncrypt(CustomerAccountReturnTypeRef, customerAccountReturn, sessionKey)
			when(cryptoFacade.resolveServiceSessionKey(anything())).thenResolve(null)

			respondWith(untypedInstance.getJsonRepresentation())

			const response = await executor.get(CustomerAccountService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
			o(removeOriginals(response!)).deepEquals(customerAccountReturn)
			verify(
				restClient.request(
					"/rest/accounting/customeraccountservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.responseType === MediaType.Json),
				),
			)
		})
	})

	o.spec("keys encrypt", function () {
		o("uses passed key to encrypt request data", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: GiftCardCreateDataTypeRef,
					return: null,
				},
			}
			const giftCardTypeModel = await typeModelResolver.resolveServerTypeReference(GiftCardCreateDataTypeRef)
			const giftCardCreateData = createTestEntity(GiftCardCreateDataTypeRef, { message: "test" })

			respondWith(null)
			const response = await executor.get(getService, giftCardCreateData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			const optionsCaptor = matchers.captor()
			verify(restClient.request("/rest/testapp/testservice", HttpMethod.GET, optionsCaptor.capture()))
			const getJson = IncomingServerJson.expectSingleInstance((optionsCaptor.value.body as RestTextBody).payload, giftCardTypeModel)
			const getEntity = await instancePipeline.decryptAndMap<GiftCardCreateData>(getJson, sessionKey)
			o(removeOriginals(getEntity)).deepEquals(giftCardCreateData)
			o(response).equals(undefined)
		})

		o("when data is encrypted and the key is not passed it throws", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: GiftCardCreateDataTypeRef,
					return: null,
				},
			}
			const giftCardCreateData = createTestEntity(GiftCardCreateDataTypeRef, { message: "test" })

			await o(() => executor.get(getService, giftCardCreateData, null)).asyncThrows(ProgrammingError)
			verify(restClient.request(anything(), anything(), DEFAULT_REST_CLIENT_OPTIONS), { ignoreExtraArgs: true, times: 0 })
		})
	})
})

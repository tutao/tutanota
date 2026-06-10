import o, { assertThrows, verify } from "@tutao/otest"
import { DEFAULT_REST_CLIENT_OPTIONS, RestClient } from "../../../src/platform-kit/rest-client"
import { HttpMethod, MediaType, RestClientOptions, RestTextBody } from "../../../src/platform-kit/rest-client/types"
import { CryptoFacade } from "../../../src/platform-kit/base/base-crypto/CryptoFacade.js"
import { matchers, object, when } from "testdouble"
import { AttributeModel, DeleteService, GetService, PostService, PutService, ServerModelUntypedInstance } from "../../../src/platform-kit/meta"
import { deepEqual, downcast } from "../../../src/platform-kit/utils"
import { ProgrammingError } from "../../../src/platform-kit/app-env"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../TestUtils.js"
import { InstancePipeline, LoggedInUserProvider, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import { Aes128Key, aes256RandomKey } from "../../../src/platform-kit/crypto"
import { LoginIncompleteError } from "../../../src/platform-kit/rest-client/error"
import { CustomerAccountReturnTypeRef, CustomerAccountService } from "@tutao/entities/accounting"

import { AlarmServicePostTypeRef, GiftCardCreateDataTypeRef, SaltDataTypeRef } from "@tutao/entities/sys"
import { ServiceExecutor } from "../../../src/platform-kit/network/ServiceExecutor"
import { SymmetricEncryptionScheme } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../src/platform-kit/network/ServiceRequest"

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
	let previousNetworkDebugging
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

	o.beforeEach(function () {
		restClient = object()
		authHeaders = {}
		fullyLoggedIn = true

		instancePipeline = object()
		cryptoFacade = object()
		typeModelResolver = clientInitializedTypeModelResolver()
		executor = new ServiceExecutor(restClient, authDataProvider, instancePipeline, () => cryptoFacade, typeModelResolver)
		previousNetworkDebugging = env.networkDebugging
		env.networkDebugging = false
	})
	o.afterEach(function () {
		env.networkDebugging = previousNetworkDebugging
	})

	function assertThatNoRequestsWereMade() {
		verify(restClient.request(anything(), anything(), DEFAULT_REST_CLIENT_OPTIONS), { ignoreExtraArgs: true, times: 0 })
	}

	function respondWith(response) {
		when(restClient.request(anything(), anything(), DEFAULT_REST_CLIENT_OPTIONS), { ignoreExtraArgs: true }).thenResolve(response)
	}

	o("decryptResponse removes network debugging info", async function () {
		env.networkDebugging = true

		const realInstancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)

		const getService: GetService & DeleteService & PutService & PostService = {
			...service,
			get: { data: null, return: SaltDataTypeRef },
			post: { data: null, return: SaltDataTypeRef },
			put: { data: null, return: SaltDataTypeRef },
			delete: { data: null, return: SaltDataTypeRef },
		}

		const expectedInstance = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
		const dataWithDebug = await realInstancePipeline.mapAndEncrypt(SaltDataTypeRef, expectedInstance, null)

		const dataAsUntypedInstance = AttributeModel.removeNetworkDebuggingInfoIfNeeded(dataWithDebug)
		when(
			instancePipeline.decryptAndMap(
				SaltDataTypeRef,
				// all field names should have been removed before doing description
				matchers.argThat((i) => deepEqual(i, dataAsUntypedInstance)),
				null,
			),
		).thenResolve(expectedInstance)

		respondWith(JSON.stringify(dataWithDebug))

		const getResponse = await executor.get(getService, null, null)
		const postResponse = await executor.post(getService, null, null)
		const putResponse = await executor.put(getService, null, null)
		const deleteResponse = await executor.delete(getService, null, null)
		o(getResponse).deepEquals(expectedInstance)
		o(postResponse).deepEquals(expectedInstance)
		o(putResponse).deepEquals(expectedInstance)
		o(deleteResponse).deepEquals(expectedInstance)

		env.networkDebugging = false
	})

	o.spec("GET", function () {
		o("encrypts data", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: SaltDataTypeRef,
					return: null,
				},
			}
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" }
			when(instancePipeline.mapAndEncrypt(SaltDataTypeRef, data, null)).thenResolve(literal)

			respondWith(undefined)

			const response = await executor.get(getService, data, null)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((options: RestClientOptions) => (options.body as RestTextBody).payload === `{"literal":"1"}`),
				),
			)
		})

		o("maps unencrypted response data to instance", async function () {
			const getService: GetService = {
				...service,
				get: {
					data: null,
					return: SaltDataTypeRef,
				},
			}
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, null)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.get(getService, null, null)

			o(response).equals(returnData)
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
					return: SaltDataTypeRef,
				},
			}
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, null)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.get(getService, null, null)

			o(response).equals(returnData)
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
					return: SaltDataTypeRef,
				},
			}
			const sessionKey = [1, 2, 3, 4] as Aes128Key
			fullyLoggedIn = false
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, sessionKey)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.get(getService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(response).equals(returnData)
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
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, null)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.get(getService, null, null)

			o(response).equals(returnData)
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
					data: SaltDataTypeRef,
					return: null,
				},
			}
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" }
			when(instancePipeline.mapAndEncrypt(SaltDataTypeRef, data, null)).thenResolve(literal)

			respondWith(undefined)

			const response = await executor.post(postService, data, null)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.POST,
					matchers.argThat((params: RestClientOptions) => (params.body as RestTextBody).payload === `{"literal":"1"}`),
				),
			)
		})

		o("decrypts response data", async function () {
			const postService: PostService = {
				...service,
				post: {
					data: null,
					return: SaltDataTypeRef,
				},
			}
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, null)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.post(postService, null, null)

			o(response).equals(returnData)
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
					return: SaltDataTypeRef,
				},
			}
			const sessionKey = [1, 2, 3, 4] as Aes128Key
			fullyLoggedIn = false
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, sessionKey)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.post(getService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(response).equals(returnData)
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
					data: SaltDataTypeRef,
					return: null,
				},
			}
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" }
			when(instancePipeline.mapAndEncrypt(SaltDataTypeRef, data, null)).thenResolve(literal)

			respondWith(undefined)

			const response = await executor.put(putService, data, null)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.PUT,
					matchers.argThat((options: RestClientOptions) => (options.body as RestTextBody).payload === `{"literal":"1"}`),
				),
			)
		})

		o("decrypts response data", async function () {
			const putService: PutService = {
				...service,
				put: {
					data: null,
					return: SaltDataTypeRef,
				},
			}
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, null)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.put(putService, null, null)

			o(response).equals(returnData)
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
					data: SaltDataTypeRef,
					return: null,
				},
			}
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" }
			when(instancePipeline.mapAndEncrypt(SaltDataTypeRef, data, null)).thenResolve(literal)

			respondWith(undefined)

			const response = await executor.delete(deleteService, data, null)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.DELETE,
					matchers.argThat((options: RestClientOptions) => (options.body as RestTextBody).payload === `{"literal":"1"}`),
				),
			)
		})

		o("decrypts response data", async function () {
			const deleteService: DeleteService = {
				...service,
				delete: {
					data: null,
					return: SaltDataTypeRef,
				},
			}
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, null)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.delete(deleteService, null, null)

			o(response).equals(returnData)
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
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const query = Object.freeze({ myQueryParam: "2" })
			when(instancePipeline.mapAndEncrypt(anything(), anything(), anything())).thenResolve({})
			respondWith(undefined)

			const response = await executor.get(getService, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, queryParams: query })

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
			const data = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const headers = Object.freeze({ myHeader: "2" })
			const saltTypeModel = await typeModelResolver.resolveClientTypeReference(SaltDataTypeRef)
			when(instancePipeline.mapAndEncrypt(anything(), anything(), anything())).thenResolve({})
			respondWith(undefined)

			const response = await executor.get(getService, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, extraHeaders: headers })

			o(response).equals(undefined)

			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) =>
						deepEqual(opts.headers, {
							v: String(saltTypeModel.version),
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
			const saltTypeModel = await typeModelResolver.resolveClientTypeReference(SaltDataTypeRef)
			when(instancePipeline.mapAndEncrypt(anything(), anything(), anything())).thenResolve({})
			respondWith(undefined)

			const response = await executor.get(getService, data, null)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) =>
						deepEqual(opts.headers, {
							v: String(saltTypeModel.version),
							accessToken,
						}),
					),
				),
			)
		})
	})

	o.spec("keys decrypt", function () {
		o.beforeEach(() => {
			instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
			executor = new ServiceExecutor(restClient, authDataProvider, instancePipeline, () => cryptoFacade, typeModelResolver)
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

			respondWith(JSON.stringify(untypedInstance))

			const response = await executor.get(CustomerAccountService, null, null)

			removeOriginals(response)
			o(response).deepEquals(customerAccountReturn)
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

			respondWith(JSON.stringify(untypedInstance))

			const response = await executor.get(CustomerAccountService, null, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			removeOriginals(response)

			o(response).deepEquals(customerAccountReturn)
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
			const giftCardCreateData = createTestEntity(GiftCardCreateDataTypeRef, { message: "test" })
			const sessionKey = [1, 2, 3, 4] as Aes128Key
			const encrypted = { encrypted: "1" }
			when(instancePipeline.mapAndEncrypt(GiftCardCreateDataTypeRef, giftCardCreateData, sessionKey)).thenResolve(encrypted)

			respondWith(undefined)

			const response = await executor.get(getService, giftCardCreateData, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((p) => (p.body as RestTextBody).payload === `{"encrypted":"1"}`),
				),
			)
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

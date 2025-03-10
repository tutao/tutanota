import o from "@tutao/otest"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { RestClient, RestClientOptions } from "../../../../../src/common/api/worker/rest/RestClient.js"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { matchers, object, when } from "testdouble"
import { DeleteService, GetService, PostService, PutService } from "../../../../../src/common/api/common/ServiceRequest.js"
import { AlarmServicePostTypeRef, GiftCardCreateDataTypeRef, SaltDataTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { HttpMethod, MediaType, resolveClientTypeReference, resolveServerTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { deepEqual, downcast } from "@tutao/tutanota-utils"
import { assertThrows, verify } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { AuthDataProvider } from "../../../../../src/common/api/worker/facades/UserFacade"
import { LoginIncompleteError } from "../../../../../src/common/api/common/error/LoginIncompleteError.js"
import { createTestEntity } from "../../../TestUtils.js"
import { InstancePipeline } from "../../../../../src/common/api/worker/crypto/InstancePipeline"
import { CustomerAccountReturnTypeRef } from "../../../../../src/common/api/entities/accounting/TypeRefs"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { CustomerAccountService } from "../../../../../src/common/api/entities/accounting/Services"
import { ServerModelUntypedInstance } from "../../../../../src/common/api/common/EntityTypes"

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
	const authDataProvider: AuthDataProvider = {
		createAuthHeaders(): Dict {
			return authHeaders
		},
		isFullyLoggedIn(): boolean {
			return fullyLoggedIn
		},
	}

	o.beforeEach(function () {
		restClient = object()
		authHeaders = {}
		fullyLoggedIn = true

		instancePipeline = object()
		cryptoFacade = object()
		executor = new ServiceExecutor(restClient, authDataProvider, instancePipeline, () => cryptoFacade)
	})

	function assertThatNoRequestsWereMade() {
		verify(restClient.request(anything(), anything()), { ignoreExtraArgs: true, times: 0 })
	}

	function respondWith(response) {
		when(restClient.request(anything(), anything()), { ignoreExtraArgs: true }).thenResolve(response)
	}

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

			const response = await executor.get(getService, data)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((options: RestClientOptions) => options.body === `{"literal":"1"}`),
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

			const response = await executor.get(getService, null)

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

			const response = await executor.get(getService, null)

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
			await assertThrows(LoginIncompleteError, () => executor.get(getService, null))
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
			const sessionKey = [1, 2, 3]
			fullyLoggedIn = false
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, sessionKey)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.get(getService, null, { sessionKey })

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

			const response = await executor.get(getService, null)

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

			const response = await executor.post(postService, data)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.POST,
					matchers.argThat((params: RestClientOptions) => params.body === `{"literal":"1"}`),
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

			const response = await executor.post(postService, null)

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
			await assertThrows(LoginIncompleteError, () => executor.post(postService, null))
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
			const sessionKey = [1, 2, 3]
			fullyLoggedIn = false
			const returnData = createTestEntity(SaltDataTypeRef, { mailAddress: "test" })
			const literal = { literal: "1" } as unknown as ServerModelUntypedInstance
			when(instancePipeline.decryptAndMap(SaltDataTypeRef, literal, sessionKey)).thenResolve(returnData)

			respondWith(`{"literal":"1"}`)

			const response = await executor.post(getService, null, { sessionKey })

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

			const response = await executor.put(putService, data)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.PUT,
					matchers.argThat((params: RestClientOptions) => params.body === `{"literal":"1"}`),
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

			const response = await executor.put(putService, null)

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
			await assertThrows(LoginIncompleteError, () => executor.put(putService, null))
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

			const response = await executor.delete(deleteService, data)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.DELETE,
					matchers.argThat((params: RestClientOptions) => params.body === `{"literal":"1"}`),
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

			const response = await executor.delete(deleteService, null)

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
			await assertThrows(LoginIncompleteError, () => executor.delete(deleteService, null))
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

			const response = await executor.get(getService, data, { queryParams: query })

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
			const saltTypeModel = await resolveClientTypeReference(SaltDataTypeRef)
			when(instancePipeline.mapAndEncrypt(anything(), anything(), anything())).thenResolve({})
			respondWith(undefined)

			const response = await executor.get(getService, data, { extraHeaders: headers })

			o(response).equals(undefined)

			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) =>
						deepEqual(opts.headers, {
							v: saltTypeModel.version,
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
			const saltTypeModel = await resolveClientTypeReference(SaltDataTypeRef)
			when(instancePipeline.mapAndEncrypt(anything(), anything(), anything())).thenResolve({})
			respondWith(undefined)

			const response = await executor.get(getService, data)

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((opts: RestClientOptions) =>
						deepEqual(opts.headers, {
							v: saltTypeModel.version,
							accessToken,
						}),
					),
				),
			)
		})
	})

	o.spec("keys decrypt", function () {
		o.beforeEach(() => {
			instancePipeline = new InstancePipeline(resolveClientTypeReference, resolveServerTypeReference)
			executor = new ServiceExecutor(restClient, authDataProvider, instancePipeline, () => cryptoFacade)
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

			const response = await executor.get(CustomerAccountService, null)

			delete downcast(response)._finalIvs
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

			const response = await executor.get(CustomerAccountService, null, { sessionKey })

			delete downcast(response)._finalIvs

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
			const sessionKey = [1, 2, 3]
			const encrypted = { encrypted: "1" }
			when(instancePipeline.mapAndEncrypt(GiftCardCreateDataTypeRef, giftCardCreateData, sessionKey)).thenResolve(encrypted)

			respondWith(undefined)

			const response = await executor.get(getService, giftCardCreateData, { sessionKey })

			o(response).equals(undefined)
			verify(
				restClient.request(
					"/rest/testapp/testservice",
					HttpMethod.GET,
					matchers.argThat((p) => p.body === `{"encrypted":"1"}`),
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

			await o(() => executor.get(getService, giftCardCreateData)).asyncThrows(ProgrammingError)
			verify(restClient.request(anything(), anything()), { ignoreExtraArgs: true, times: 0 })
		})
	})
})

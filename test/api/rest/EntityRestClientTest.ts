import o from "ospec"
import {Contact, ContactTypeRef, createContact} from "../../../src/api/entities/tutanota/Contact"
import {BadRequestError, InternalServerError, PayloadTooLargeError} from "../../../src/api/common/error/RestError"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {SetupMultipleError} from "../../../src/api/common/error/SetupMultipleError"
import {downcast, TypeRef} from "@tutao/tutanota-utils"
import {HttpMethod, MediaType, resolveTypeReference} from "../../../src/api/common/EntityFunctions"
import {createCustomer, Customer, CustomerTypeRef} from "../../../src/api/entities/sys/Customer"
import {EntityRestClient, typeRefToPath} from "../../../src/api/worker/rest/EntityRestClient"
import {RestClient} from "../../../src/api/worker/rest/RestClient"
import type {CryptoFacade} from "../../../src/api/worker/crypto/CryptoFacade"
import type {TypeModel} from "../../../src/api/common/EntityTypes"
import {createInternalRecipientKeyData} from "../../../src/api/entities/tutanota/InternalRecipientKeyData"
import {create} from "../../../src/api/common/utils/EntityUtils"
import {InstanceMapper} from "../../../src/api/worker/crypto/InstanceMapper"
import {CalendarEventTypeRef} from "../../../src/api/entities/tutanota/CalendarEvent"
import {ProgressListener} from "../../../src/api/common/utils/ProgressMonitor";

const accessToken = "My cool access token"
const authHeader = {
	accessToken: accessToken,
}

function createEntityRestClientWithMocks(
		requestMock: (...args: Array<any>) => any,
): {
	entityRestClient: EntityRestClient
	cryptoFacadeMock: CryptoFacade
	instanceMapperMock: InstanceMapper
	requestSpy: any
} {
	const cryptoFacadeMock: CryptoFacade = {
		// @ts-ignore
		applyMigrations: o.spy(
				async <T>(typeRef: TypeRef<T>, data: any): Promise<T> =>
						resolveTypeReference(typeRef).then(model => create(model, typeRef)),
		),
		applyMigrationsForInstance: o.spy(async <T>(decryptedInstance: T): Promise<T> => decryptedInstance),
		setNewOwnerEncSessionKey: o.spy((model: TypeModel, entity: Record<string, any>) => []),
		resolveServiceSessionKey: o.spy(async (typeModel: TypeModel, instance: Record<string, any>) => []),
		encryptBucketKeyForInternalRecipient: o.spy(
				async (bucketKey: Aes128Key, recipientMailAddress: string, notFoundRecipients: Array<string>) =>
						createInternalRecipientKeyData(),
		),
		resolveSessionKey: o.spy(async (typeModel: TypeModel, instance: Record<string, any>) => []),
	}
	const instanceMapperMock: InstanceMapper = downcast({
		encryptAndMapToLiteral: o.spy(async (model, instance, sk) => {
			return {
				dummyMessage: "encrypted",
			}
		}),
		decryptAndMapToInstance: o.spy(async (model, instance, sk) => {
			return {
				dummyMessage: "decrypted",
			}
		}),
	})
	const requestSpy = o.spy(requestMock)
	const entityRestClient = new EntityRestClient(
			() => authHeader, // Entity rest client doesn't allow requests without authorization
			downcast<RestClient>({
				request: async (...args) => requestSpy(...args),
			}),
			() => cryptoFacadeMock,
			instanceMapperMock,
	)
	return {
		instanceMapperMock,
		cryptoFacadeMock,
		entityRestClient,
		requestSpy,
	}
}

function createArrayOf<T>(count: number, factory: (index: number) => T): Array<T> {
	return Array(count)
			// @ts-ignore
			.fill()
			.map((_, idx) => factory(idx))
}

const range = (start, count) => createArrayOf(count, idx => String(idx + start))

function contacts(count) {
	const contactFactory = idx =>
			createContact({
				firstName: `Contact${idx}`,
			})

	return createArrayOf(count, contactFactory)
}

o.spec("EntityRestClient", async function () {
	o.spec("Load", function () {
		o("loading a list element", async function () {
			const {
				entityRestClient,
				requestSpy,
				instanceMapperMock,
				cryptoFacadeMock,
			} = createEntityRestClientWithMocks(() => JSON.stringify("The element that was returned from the server"))
			const calendarListId = "calendarListId"
			const id1 = "id1"
			const result = await entityRestClient.load(CalendarEventTypeRef, [calendarListId, id1])
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[0]).equals(`${typeRefToPath(CalendarEventTypeRef)}/${calendarListId}/${id1}`)(
					"path is correct",
			)
			o(requestSpy.args[1]).equals(HttpMethod.GET)("Method is GET")
			// @ts-ignore
			o(instanceMapperMock.decryptAndMapToInstance.callCount).equals(1)
			// @ts-ignore
			o(cryptoFacadeMock.applyMigrationsForInstance.callCount).equals(1)
		})
		o("loading an element ", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify("The element that was returned from the server"),
			)
			const id1 = "id1"
			const result = await entityRestClient.load(CustomerTypeRef, id1)
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[0]).equals(`${typeRefToPath(CustomerTypeRef)}/${id1}`)("path is correct")
			o(requestSpy.args[1]).equals(HttpMethod.GET)("Method is GET")
			o(result).deepEquals({
				dummyMessage: "decrypted",
			} as unknown as Customer)("decrypts and returns from the client")
		})
		o(
				"query parameters and additional headers + access token and version are always passed to the rest client",
				async function () {
					const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
							JSON.stringify("The element that was returned from the server"),
					)
					const id1 = "id1"
					const queryParameters = {
						foo: "bar",
					}
					const headers = {
						baz: "quux",
					}
					const result = await entityRestClient.load(CustomerTypeRef, id1, queryParameters, headers)
					const {version} = await resolveTypeReference(CustomerTypeRef)
					o(requestSpy.args[2]).deepEquals(queryParameters)("query parameters are passed")
					o(requestSpy.args[3]).deepEquals({
						accessToken: accessToken,
						v: version,
						baz: "quux",
					})("headers are passed")
				},
		)
	})
	o.spec("Load Range", function () {
		o("Loads a range of entities in a single request", async function () {
			const {
				entityRestClient,
				requestSpy,
				instanceMapperMock,
				cryptoFacadeMock,
			} = createEntityRestClientWithMocks(() => JSON.stringify(["e1", "e2", "e3"]))
			const startId = "42"
			const count = 5
			await entityRestClient.loadRange(CalendarEventTypeRef, "listId", startId, count, false)
			const {version} = await resolveTypeReference(CalendarEventTypeRef)
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.args[2]).deepEquals({
				start: `${startId}`,
				count: `${count}`,
				reverse: "false",
			})("Range is passed in as query params")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
		})
	})
	o.spec("Load multiple", function () {
		o("Less than 100 entities requested should result in a single rest request", async function () {
			const {
				entityRestClient,
				requestSpy,
				instanceMapperMock,
				cryptoFacadeMock,
			} = createEntityRestClientWithMocks(() => JSON.stringify(["e1", "e2", "e3"]))
			const ids = range(0, 5)
			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			const {version} = await resolveTypeReference(CustomerTypeRef)
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.args[2]).deepEquals({
				ids: ids.join(","),
			})("Requested IDs are passed in as query params")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
			// @ts-ignore
			o(instanceMapperMock.decryptAndMapToInstance.callCount).equals(3)
			// @ts-ignore
			o(cryptoFacadeMock.applyMigrationsForInstance.callCount).equals(3)
		})
		o("Exactly 100 entities requested should result in a single rest request", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify(["The elements that were returned from the server"]),
			)
			const ids = range(0, 100)
			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.args[2]).deepEquals({
				ids: ids.join(","),
			})("Requested IDs are passed in as query params")
			o(result).deepEquals([
				{
					dummyMessage: "decrypted",
				} as unknown as Customer,
			])("Returns what was returned by the rest client")
		})
		o("More than 100 entities requested results in 2 rest requests", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => JSON.stringify(["entities"]))
			const ids = range(0, 101)
			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			o(requestSpy.callCount).equals(2)
			o(requestSpy.calls[0].args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.calls[0].args[2]).deepEquals({
				ids: ids.slice(0, 100).join(","),
			})("The first 100 ids are requested")
			o(requestSpy.calls[1].args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.calls[1].args[2]).deepEquals({
				ids: ids.slice(100, 101).join(","),
			})("The remaining 1 id is requested")
			o(result).deepEquals([
				{
					dummyMessage: "decrypted",
				} as unknown as Customer,
				{
					dummyMessage: "decrypted",
				} as unknown as Customer,
			])("Returns what was returned by the rest client")
		})
		o("More than 200 entities requested results in 3 rest requests", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => JSON.stringify(["entities"]))
			const ids = range(0, 211)
			const result = await entityRestClient.loadMultiple(CustomerTypeRef, null, ids)
			o(requestSpy.callCount).equals(3)
			o(requestSpy.calls[0].args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.calls[0].args[2]).deepEquals({
				ids: ids.slice(0, 100).join(","),
			})("The first 100 ids are requested")
			o(requestSpy.calls[1].args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.calls[1].args[2]).deepEquals({
				ids: ids.slice(100, 200).join(","),
			})("The next 100 ids are requested")
			o(requestSpy.calls[2].args[1]).equals(HttpMethod.GET)("Method is GET")
			o(requestSpy.calls[2].args[2]).deepEquals({
				ids: ids.slice(200, 211).join(","),
			})("The remaining 11 ids are requested")
			o(result).deepEquals([
				{
					dummyMessage: "decrypted",
				} as unknown as Customer,
				{
					dummyMessage: "decrypted",
				} as unknown as Customer,
				{
					dummyMessage: "decrypted",
				} as unknown as Customer,
			])("Returns what was returned by the rest client")
		})
	})
	o.spec("Setup", async function () {
		o("Setup list entity", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify({
						generatedId: "id",
					}),
			)
			const newContact = createContact()
			const result = await entityRestClient.setup("listId", newContact)
			const {version} = await resolveTypeReference(ContactTypeRef)
			o(result).equals("id")
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
			o(requestSpy.args[4]).deepEquals(
					JSON.stringify({
						dummyMessage: "encrypted",
					}),
			)("Contact were sent")
		})
		o("Setup list entity throws when no listid is passed", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify({
						generatedId: "id",
					}),
			)
			const newContact = createContact()
			const result = await assertThrows(Error, async () => await entityRestClient.setup(null, newContact))
			o(result.message).equals("List id must be defined for LETs")
		})
		o("Setup entity", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify({
						generatedId: "id",
					}),
			)
			const newCustomer = createCustomer()
			const result = await entityRestClient.setup(null, newCustomer)
			const {version} = await resolveTypeReference(CustomerTypeRef)
			o(result).equals("id")
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
			o(requestSpy.args[4]).deepEquals(
					JSON.stringify({
						dummyMessage: "encrypted",
					}),
			)("Contact were sent")
		})
		o("Setup entity throws when listid is passed", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify({
						generatedId: "id",
					}),
			)
			const newCustomer = createCustomer()
			const result = await assertThrows(Error, async () => await entityRestClient.setup("listId", newCustomer))
			o(result.message).equals("List id must not be defined for ETs")
		})
	})
	o.spec("Setup multiple", async function () {
		o("Less than 100 entities created should result in a single rest request", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify([
						{
							generatedId: "someReturnedId",
						},
					]),
			)
			const newContacts = contacts(1)
			const result = await entityRestClient.setupMultiple("listId", newContacts)
			const {version} = await resolveTypeReference(ContactTypeRef)
			o(result).deepEquals(["someReturnedId"])
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
			o(requestSpy.args[4]).deepEquals(
					JSON.stringify(
							newContacts.map(() => ({
								dummyMessage: "encrypted",
							})),
					),
			)("All contacts were sent")
		})
		o("Exactly 100 entities created should result in a single rest request", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify([
						{
							generatedId: "someReturnedId",
						},
					]),
			)
			const newContacts = contacts(100)
			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals(["someReturnedId"])
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.args[4]).deepEquals(
					JSON.stringify(
							newContacts.map(() => ({
								dummyMessage: "encrypted",
							})),
					),
			)("All contacts were sent")
		})
		o("More than 100 entities created should result in 2 rest requests", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify([
						{
							generatedId: "someReturnedId",
						},
					]),
			)
			const newContacts = contacts(101)
			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals(["someReturnedId", "someReturnedId"])
			o(requestSpy.callCount).equals(2)
			o(requestSpy.calls[0].args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.calls[0].args[4]).deepEquals(
					JSON.stringify(
							newContacts
									.map(() => ({
										dummyMessage: "encrypted",
									}))
									.slice(0, 100),
					),
			)("First 100 contacts were sent")
			o(requestSpy.calls[1].args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.calls[1].args[4]).deepEquals(
					JSON.stringify(
							newContacts
									.map(() => ({
										dummyMessage: "encrypted",
									}))
									.slice(100, 101),
					),
			)("Remaining contact was sent")
		})
		o("More than 200 entities created should result in 3 rest requests", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() =>
					JSON.stringify([
						{
							generatedId: "someReturnedId",
						},
					]),
			)
			const newContacts = contacts(211)
			const result = await entityRestClient.setupMultiple("listId", newContacts)
			o(result).deepEquals(["someReturnedId", "someReturnedId", "someReturnedId"])
			o(requestSpy.callCount).equals(3)
			o(requestSpy.calls[0].args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.calls[0].args[4]).deepEquals(
					JSON.stringify(
							newContacts
									.map(() => ({
										dummyMessage: "encrypted",
									}))
									.slice(0, 100),
					),
			)("First 100 contacts were sent")
			o(requestSpy.calls[1].args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.calls[1].args[4]).deepEquals(
					JSON.stringify(
							newContacts
									.map(() => ({
										dummyMessage: "encrypted",
									}))
									.slice(100, 200),
					),
			)("Next 100 contacts were sent")
			o(requestSpy.calls[2].args[1]).equals(HttpMethod.POST)("The method is POST")
			o(requestSpy.calls[2].args[4]).deepEquals(
					JSON.stringify(
							newContacts
									.map(() => ({
										dummyMessage: "encrypted",
									}))
									.slice(200, 211),
					),
			)("Remaining 11 contacts were sent")
		})
		o(
				"A single request is made and an error occurs, all entites should be returned as failedInstances",
				async function () {
					const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => {
						throw new BadRequestError("canny do et")
					})
					const newContacts = contacts(100)
					const result = await assertThrows(SetupMultipleError, () =>
							entityRestClient.setupMultiple("listId", newContacts),
					)
					o(requestSpy.callCount).equals(1)
					o(result.failedInstances.length).equals(newContacts.length)
					o(result.errors.length).equals(1)
					o(result.errors[0] instanceof BadRequestError).equals(true)
					o(result.failedInstances).deepEquals(newContacts)
				},
		)
		o(
				"Post multiple: An error is encountered for part of the request, only failed entities are returned in the result",
				async function () {
					let requestCounter = 0
					const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => {
						requestCounter += 1

						if (requestCounter % 2 === 0) {
							// Second and Fourth requests are success
							return JSON.stringify(range(0, 100))
						} else {
							// First and Third requests are failure
							throw new BadRequestError("It was a bad request")
						}
					})
					const newContacts = contacts(400)
					const result = await assertThrows(SetupMultipleError, () =>
							entityRestClient.setupMultiple("listId", newContacts),
					)
					o(requestSpy.callCount).equals(4)
					o(result.failedInstances).deepEquals(newContacts.slice(0, 100).concat(newContacts.slice(200, 300)))
					o(result.errors.length).equals(2)
					o(result.errors.every(e => e instanceof BadRequestError)).equals(true)
				},
		)
		o("Post multiple: When a PayloadTooLarge error occurs individual instances are posted", async function () {
			const listId = "listId"
			const idArray = ["0", null, "2"] // GET fails for id 1

			let instances: Contact[] = []

			for (let i = 0; i < idArray.length; i++) {
				instances.push(createContact())
			}

			let step = 0
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(function (
					path: string,
					method: HttpMethod,
					queryParams: Dict,
					headers: Dict,
					body: string | null | undefined,
					responseType: MediaType | null | undefined,
					progressListener: ProgressListener | null | undefined,
					baseUrl?: string,
			) {
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
			o(requestSpy.callCount).equals(4) //one post multiple and three individual posts

			o(result.failedInstances.length).equals(1) //one individual post results in an error

			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof InternalServerError).equals(true)
			o(result.failedInstances).deepEquals([instances[1]])
		})
	})
	o.spec("Update", function () {
		o("Update entity", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => {
			})
			const newCustomer = createCustomer({
				_id: "id",
			})
			await entityRestClient.update(newCustomer)
			const {version} = await resolveTypeReference(CustomerTypeRef)
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[1]).equals(HttpMethod.PUT)("The method is PUT")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
			o(requestSpy.args[4]).deepEquals(
					JSON.stringify({
						dummyMessage: "encrypted",
					}),
			)("Contact were sent")
		})
		o("Update entity throws if entity does not have an id", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => {
			})
			const newCustomer = createCustomer()
			const result = await assertThrows(Error, async () => await entityRestClient.update(newCustomer))
			o(result.message).equals("Id must be defined")
		})
	})
	o.spec("Delete", function () {
		o("Delete entity", async function () {
			const {entityRestClient, requestSpy} = createEntityRestClientWithMocks(() => {
			})
			const id = "id"
			const newCustomer = createCustomer({
				_id: id,
			})
			await entityRestClient.erase(newCustomer)
			const {version} = await resolveTypeReference(CustomerTypeRef)
			o(requestSpy.callCount).equals(1)
			o(requestSpy.args[0]).equals(`${typeRefToPath(CustomerTypeRef)}/${id}`)("path is correct")
			o(requestSpy.args[1]).equals(HttpMethod.DELETE)("The method is DELETE")
			o(requestSpy.args[3]).deepEquals({
				accessToken,
				v: version,
			})("access token and version are passed")
		})
	})
})
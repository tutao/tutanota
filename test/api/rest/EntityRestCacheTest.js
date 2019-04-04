//@flow
import o from "ospec/ospec.js"
import {EntityRestCache} from "../../../src/api/worker/rest/EntityRestCache"
import {createMailBody, MailBodyTypeRef} from "../../../src/api/entities/tutanota/MailBody"
import type {OperationTypeEnum} from "../../../src/api/common/TutanotaConstants"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import {createEntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {
	CUSTOM_MIN_ID,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	getListId,
	HttpMethod,
	isSameTypeRef,
	readOnlyHeaders,
	sortCompareById,
	stringToCustomId,
	TypeRef
} from "../../../src/api/common/EntityFunctions"
import {createMail, MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {clone} from "../../../src/api/common/utils/Utils"
import {createExternalUserReference, ExternalUserReferenceTypeRef} from "../../../src/api/entities/sys/ExternalUserReference"
import {NotFoundError} from "../../../src/api/common/error/RestError"
import {typeRefToPath} from "../../../src/api/worker/rest/EntityRestClient"
import {lastThrow} from "../../../src/api/common/utils/ArrayUtils"

o.spec("entity rest cache", function () {

	let clientEntityRequest: Function
	let clientSpy: any
	let cache: EntityRestCache

	let createUpdate = function (typeRef: TypeRef<any>, listId: Id, id: Id, operation: OperationTypeEnum): EntityUpdate {
		let eu = createEntityUpdate()
		eu.application = typeRef.app
		eu.type = typeRef.type
		eu.instanceListId = listId
		eu.instanceId = id
		eu.operation = operation
		return eu
	}

	let createId = function (idText) {
		return Array(13 - idText.length).join("-") + idText
	}

	let createBodyInstance = function (id, bodyText): MailBody {
		let body = createMailBody()
		body._id = createId(id)
		body.text = bodyText
		return body;
	}

	let createMailInstance = function (listId, id, subject): Mail {
		let mail = createMail()
		mail._id = [listId, createId(id)]
		mail.subject = subject
		return mail;
	}

	o.beforeEach(function () {
		clientEntityRequest = function () {
			return Promise.resolve(null)
		} // dummy, overwrite in test case
		clientSpy = o.spy(function () {
			return clientEntityRequest.apply(this, arguments)
		})
		cache = new EntityRestCache({entityRequest: clientSpy})
	})

	o.spec("entityEventsReceived", function () {
		o("element create notifications are not put into cache", async function () {
			await cache.entityEventsReceived([createUpdate(MailBodyTypeRef, (null: any), "id1", OperationType.CREATE)])
			o(clientSpy.callCount).equals(0)
		})

		o("element update notifications are not put into cache", async function () {
			await cache.entityEventsReceived([createUpdate(MailBodyTypeRef, (null: any), "id1", OperationType.UPDATE)])
			o(clientSpy.callCount).equals(0)
		})

		// element notifications
		o("element is updated in cache", async function () {
			let initialBody = createBodyInstance("id1", "hello")
			cache._putIntoCache(initialBody)

			let bodyUpdate = createBodyInstance("id1", "goodbye")
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailBodyTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals(null)
				o(id).equals(createId("id1"))
				return Promise.resolve(bodyUpdate)
			}

			await cache.entityEventsReceived([createUpdate(MailBodyTypeRef, (null: any), createId("id1"), OperationType.UPDATE)])
			o(clientSpy.callCount).equals(1) // entity is loaded from server
			const body = await cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null)
			o(body.text).equals("goodbye")
			o(clientSpy.callCount).equals(1) // entity is provided from cache
		})

		o("element is deleted from cache", async function () {
			let initialBody = createBodyInstance("id1", "hello")
			cache._putIntoCache(initialBody)

			let newBody = createBodyInstance("id1", "goodbye")
			clientEntityRequest = function (args) {
				return Promise.reject(new NotFoundError("not found"))
			}

			await cache.entityEventsReceived([createUpdate(MailBodyTypeRef, (null: any), createId("id1"), OperationType.DELETE)])
			o(clientSpy.callCount).equals(0) // entity is not loaded from server
			const e = await cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null)
			                     .catch(e => e)
			o(e instanceof NotFoundError).equals(true)("Is NotFoundError")
			o(clientSpy.callCount).equals(1) // entity is provided from cache
		})

		o("move event is detected", async function () {
			const instance = createMailInstance("listId1", "id1", "henlo")
			cache._putIntoCache(instance)

			const newListId = "listid2"
			const newInstance = clone(instance)
			newInstance._id = [newListId, getElementId(instance)]

			await cache.entityEventsReceived([
				createUpdate(MailTypeRef, getListId(instance), getElementId(instance), OperationType.DELETE),
				createUpdate(MailTypeRef, newListId, getElementId(instance), OperationType.CREATE)
			])
			o(clientSpy.callCount).equals(0)

			clientEntityRequest = () => Promise.reject(new Error("error from test"))
			const result1 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, getListId(instance), getElementId(instance), null, null)
			                           .catch(e => e)
			// Checking prototypes doesn't really work because of the TutanotaError
			o(result1.constructor).equals(NotFoundError)
			o(clientSpy.callCount).equals(0)

			const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, newListId, getElementId(instance), null, null)
			o(result2).deepEquals(newInstance)
		})

		o("id is in range but instance doesn't exist after moving lower range", async function () {
			const mails = [1, 2, 3].map((i) => createMailInstance("listId1", "id" + i, "mail" + i))
			const newListId = "listId2"

			clientEntityRequest = () => Promise.resolve(mails)

			await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "3",
				reverse: "false"
			})
			o(clientSpy.callCount).equals(1)

			// Move email
			await cache.entityEventsReceived([
				createUpdate(MailTypeRef, getListId(mails[0]), getElementId(mails[0]), OperationType.DELETE),
				createUpdate(MailTypeRef, newListId, getElementId(mails[0]), OperationType.CREATE)
			])

			clientEntityRequest = () => Promise.reject(new Error("stub error"))

			const errorResult = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", getElementId(mails[0]), null, null)
			                               .catch(e => e)
			o(errorResult.constructor).equals(NotFoundError)
			o(clientSpy.callCount).equals(1)
		})


		o("id is in range but instance doesn't exist after moving upper range", async function () {
			const mails = [1, 2, 3].map((i) => createMailInstance("listId1", "id" + i, "mail" + i))
			const lastMail = lastThrow(mails)
			const newListId = "listId2"

			clientEntityRequest = () => Promise.resolve(mails)

			await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "3",
				reverse: "false"
			})
			o(clientSpy.callCount).equals(1)

			// Move email
			await cache.entityEventsReceived([
				createUpdate(MailTypeRef, getListId(lastMail), getElementId(lastMail), OperationType.DELETE),
				createUpdate(MailTypeRef, newListId, getElementId(lastMail), OperationType.CREATE)
			])

			clientEntityRequest = () => Promise.reject(new Error("stub error"))

			const errorResult = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", getElementId(lastMail), null, null)
			                               .catch(e => e)
			o(errorResult.constructor).equals(NotFoundError)
			o(clientSpy.callCount).equals(1)
		})

		// list element notifications
		o("list element create notifications are not put into cache", async function () {
			await cache.entityEventsReceived([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.CREATE)])
			o(clientSpy.callCount).equals(0)
		})

		o("list element update notifications are not put into cache", async function () {
			await cache.entityEventsReceived([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.UPDATE)])
			o(clientSpy.callCount).equals(0)
		})

		o("list element is updated in cache", function (done) {
			let initialMail = createMailInstance("listId1", createId("id1"), "hello")
			cache._putIntoCache(initialMail)

			let mailUpdate = createMailInstance("listId1", createId("id1"), "goodbye")
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(createId("id1"))
				return Promise.resolve(mailUpdate)
			}

			cache.entityEventsReceived([createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.UPDATE)]).then(() => {
				o(clientSpy.callCount).equals(1) // entity is loaded from server
				cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", createId("id1"), null, null).then(mail => {
					o(mail.subject).equals("goodbye")
				}).then(() => {
					o(clientSpy.callCount).equals(1) // entity is provided from cache
					done()
				})
			})
		})

		o("list element is deleted from range", function (done) {
			setupMailList(true, true).then(originalMails => {
				return cache.entityEventsReceived([createUpdate(MailTypeRef, "listId1", createId("id2"), OperationType.DELETE)]).then(() => {
					o(clientSpy.callCount).equals(1) // entity is not loaded from server
					return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
						start: GENERATED_MIN_ID,
						count: "4",
						reverse: "false"
					}).then(mails => {
						o(mails).deepEquals([originalMails[0], originalMails[2]])
					})
				})
			}).then(() => {
				o(clientSpy.callCount).equals(1) // entities are provided from cache
				done()
			})
		})
	})


	o("cloned elements are provided", function (done) {
		let body = createBodyInstance("id1", "hello")
		cache._putIntoCache(body)
		cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null).then(body1 => {
			o(body1 == body).equals(false)
			cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null).then(body2 => {
				o(body1 == body2).equals(false)
				done()
			})
		})
	})

	o("single element is provided from cache - read only", async function () {
		const body = createBodyInstance("id1", "hello")
		cache._putIntoCache(body)
		await cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null, readOnlyHeaders())
		o(clientSpy.callCount).equals(0)
	})

	o("single element is not added to cache when read only", async function () {
		const body = createBodyInstance("id1", "hello")
		clientEntityRequest = () => Promise.resolve(body)
		const result1 = await cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null, readOnlyHeaders())
		o(result1).deepEquals(body)
		o(clientSpy.callCount).equals(1)

		const result2 = await cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null, readOnlyHeaders())
		o(result2).deepEquals(body)
		o(clientSpy.callCount).equals(2)
	})

	o("single list element is provided from cache - read only", async function () {
		const mail = createMailInstance("listId1", "id1", "hello")
		cache._putIntoCache(mail)
		await cache.entityRequest(MailTypeRef, HttpMethod.GET, getListId(mail), getElementId(mail), null, null, readOnlyHeaders())
		o(clientSpy.callCount).equals(0)
	})

	o("single element is not added to cache when read only", async function () {
		const mail = createMailInstance("listId1", "id1", "hello")

		clientEntityRequest = () => Promise.resolve(mail)
		const result1 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, getListId(mail), getElementId(mail), null, null, readOnlyHeaders())
		o(result1).deepEquals(mail)
		o(clientSpy.callCount).equals(1)

		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, getListId(mail), getElementId(mail), null, null, readOnlyHeaders())
		o(result2).deepEquals(mail)
		o(clientSpy.callCount).equals(2)
	})

	o("cloned list elements are provided", function (done) {
		let mail = createMailInstance("listId1", "id1", "hello")
		cache._putIntoCache(mail)
		cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", createId("id1"), null, null).then(mail1 => {
			o(mail1 == mail).equals(false)
			cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", createId("id1"), null, null).then(mail2 => {
				o(mail1 == mail2).equals(false)
				done()
			})
		})
	})

	async function setupMailList(loadedUntilMinId: boolean, loadedUntilMaxId: boolean): Promise<Mail[]> {
		let mail1 = createMailInstance("listId1", "id1", "hello1")
		let mail2 = createMailInstance("listId1", "id2", "hello2")
		let mail3 = createMailInstance("listId1", "id3", "hello3")
		let startId = (loadedUntilMaxId) ? GENERATED_MAX_ID : createId("id4")
		let count = (loadedUntilMinId) ? "4" : "3"
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: startId, count: count, reverse: "true"})
			return Promise.resolve([mail3, mail2, mail1])
		}
		// load the mails in reverse because this is the mail use case. return them in reverse to have the intuitive order
		const mails = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: startId,
			count: count,
			reverse: "true"
		})
		o(mails).deepEquals(clone([mail3, mail2, mail1]))
		o(clientSpy.callCount).equals(1) // entities are loaded from server
		return clone([mail1, mail2, mail3])
	}

	o("cloned list elements are provided on range requests", function (done) {
		setupMailList(true, true).then(originalMails => {
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "3",
				reverse: "false"
			}).then(mails => {
				o(mails).deepEquals(originalMails)
				o(mails[0] == originalMails[0]).equals(false)
				o(mails[1] == originalMails[1]).equals(false)
				o(mails[2] == originalMails[2]).equals(false)
			})
		}).then(() => {
			o(clientSpy.callCount).equals(1) // entities are provided from cache
			done()
		})
	})

	o("list elements are provided from cache - range min to max loaded", function (done) {
		setupMailList(true, true).then(originalMails => {
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "3",
				reverse: "false"
			}).then(mails => {
				o(mails).deepEquals(originalMails)
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MIN_ID,
					count: "1",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(0, 1))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MIN_ID,
					count: "4",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals(originalMails)
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id1"),
					count: "2",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(1, 3))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MAX_ID,
					count: "3",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals([originalMails[2], originalMails[1], originalMails[0]])
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id2"),
					count: "1",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(0, 1))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id2"),
					count: "3",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(0, 1))
				})
			})
		}).then(() => {
			o(clientSpy.callCount).equals(1) // entities are provided from cache
			done()
		})
	})

	o("list elements are provided from cache - range min to id3 loaded", function (done) {
		setupMailList(true, false).then(originalMails => {
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "3",
				reverse: "false"
			}).then(mails => {
				o(mails).deepEquals(originalMails)
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MIN_ID,
					count: "1",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(0, 1))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id1"),
					count: "2",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(1, 3))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id2"),
					count: "1",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(0, 1))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id2"),
					count: "3",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals(originalMails.slice(0, 1))
				})
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id0"),
					count: "3",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals([])
				})
			})
		}).then(() => {
			o(clientSpy.callCount).equals(1) // entities are provided from cache
			done()
		})
	})

	o("list elements are provided from cache - range max to id1 loaded", function (done) {
		setupMailList(false, true).then(originalMails => {
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MAX_ID,
				count: "3",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([originalMails[2], originalMails[1], originalMails[0]])
			}).then(() => {
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MAX_ID,
					count: "2",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals([originalMails[2], originalMails[1]])
				}).then(() => {
					return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
						start: createId("id5"),
						count: "1",
						reverse: "false"
					}).then(mails => {
						o(mails).deepEquals([])
					})
				}).then(() => {
					return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
						start: createId("id2"),
						count: "1",
						reverse: "true"
					}).then(mails => {
						o(mails).deepEquals(originalMails.slice(0, 1))
					})
				}).then(() => {
					return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
						start: createId("id1"),
						count: "2",
						reverse: "false"
					}).then(mails => {
						o(mails).deepEquals(originalMails.slice(1, 3))
					})
				}).then(() => {
					o(clientSpy.callCount).equals(1) // entities are provided from cache
					done()
				})
			})
		})
	})

	o("load list elements partly from server - range min to id3 loaded", async function () {
		let mail4 = createMailInstance("listId1", "id4", "subject4")
		const cachedMails = await setupMailList(true, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: getElementId(cachedMails[2]), count: "1", reverse: "false"})
			o(typeof extraHeaders === "undefined").equals(true) // never pass read only parameter to network request
			return Promise.resolve([mail4])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MIN_ID,
			count: "4",
			reverse: "false"
		})

		o(result).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2], clone(mail4)])
		o(cache._getFromCache(MailTypeRef, getListId(mail4), getElementId(mail4))).deepEquals(mail4)
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})

	o("load list elements partly from server - range min to id3 loaded - read only", async function () {
		let mail4 = createMailInstance("listId1", "id4", "subject4")
		const cachedMails = await setupMailList(true, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: getElementId(cachedMails[2]), count: "1", reverse: "false"})
			o(typeof extraHeaders === "undefined").equals(true) // never pass read only parameter to network request
			return Promise.resolve([mail4])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "4",
				reverse: "false"
			},
			readOnlyHeaders())
		o(result).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2], clone(mail4)])
		o(cache._getFromCache(MailTypeRef, getListId(mail4), getElementId(mail4))).deepEquals(undefined)
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})

	o("load list elements partly from server - range max to id2 loaded - start in middle of range", async function () {
		let mail0 = createMailInstance("listId1", "id0", "subject0")
		const cachedMails = await setupMailList(false, true)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: getElementId(cachedMails[0]), count: "3", reverse: "true"})
			return Promise.resolve([mail0])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id2"),
			count: "4",
			reverse: "true"
		})

		o(cache._getFromCache(MailTypeRef, getListId(mail0), getElementId(mail0))).deepEquals(mail0)
		o(result).deepEquals([cachedMails[0], clone(mail0)])
		o(clientSpy.callCount).equals(2) // entities are provided from server

	})
	o("load list elements partly from server - range max to id2 loaded - start in middle of range - read only", async function () {
		let mail0 = createMailInstance("listId1", "id0", "subject0")
		const cachedMails = await setupMailList(false, true)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: getElementId(cachedMails[0]), count: "3", reverse: "true"})
			o(typeof extraHeaders === "undefined").equals(true) // never pass read only parameter to network request
			return Promise.resolve([mail0])
		}

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: createId("id2"),
				count: "4",
				reverse: "true"
			},
			readOnlyHeaders()
		)

		o(cache._getFromCache(MailTypeRef, getListId(mail0), getElementId(mail0))).deepEquals(undefined)
		o(result).deepEquals([cachedMails[0], clone(mail0)])
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})

	o("load list elements partly from server - range max to id2 loaded - loadMore", async function () {
		let mail0 = createMailInstance("listId1", "id0", "subject0")
		const cachedMails = await setupMailList(false, true)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: cachedMails[0]._id[1], count: "4", reverse: "true"})
			return Promise.resolve([mail0])
		}

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id1"),
			count: "4",
			reverse: "true"
		})
		o(cache._getFromCache(MailTypeRef, getListId(mail0), getElementId(mail0))).deepEquals(mail0)
		o(result).deepEquals([clone(mail0)])
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})

	o("load list elements partly from server - range max to id2 loaded - loadMore - read only", async function () {
		let mail0 = createMailInstance("listId1", "id0", "subject0")
		const cachedMails = await setupMailList(false, true)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: cachedMails[0]._id[1], count: "4", reverse: "true"})
			return Promise.resolve([mail0])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id1"),
			count: "4",
			reverse: "true"
		}, readOnlyHeaders())
		o(cache._getFromCache(MailTypeRef, getListId(mail0), getElementId(mail0))).equals(undefined)
		o(result).deepEquals([clone(mail0)])
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})


	o("load range starting outside of stored range - not reverse", async function () {
		let mail5 = createMailInstance("listId1", "id5", "subject5")
		let mail6 = createMailInstance("listId1", "id6", "subject6")
		const cachedMails = await setupMailList(true, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads from the end of the range which is id4
			//TODO ask arne, shouldn't it be id3?
			o(queryParameter).deepEquals({start: createId("id4"), count: "4", reverse: "false"})
			return Promise.resolve([mail5, mail6])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id5"),
			count: "4",
			reverse: "false"
		})
		o(clientSpy.callCount).equals(2) // entities are provided from server
		o(result).deepEquals([clone(mail6)])

		// further range reads are fully taken from range
		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id1"),
			count: "4",
			reverse: "false"
		})
		o(clientSpy.callCount).equals(2) // entities are provided from cache
		o(result2).deepEquals([cachedMails[1], cachedMails[2], clone(mail5), clone(mail6)])
	})

	o("load range starting outside of stored range - not reverse - read only", async function () {
		let mail5 = createMailInstance("listId1", "id5", "subject5")
		let mail6 = createMailInstance("listId1", "id6", "subject6")
		const cachedMails = await setupMailList(true, false)
		// nothing is delivered from cache when start id is outside of range
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(queryParameter).deepEquals({start: createId("id5"), count: "4", reverse: "false"})
			return Promise.resolve([mail6])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id5"),
			count: "4",
			reverse: "false"
		}, readOnlyHeaders())
		o(clientSpy.callCount).equals(2) // entities are provided from server
		o(result).deepEquals([clone(mail6)])

		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(queryParameter).deepEquals({start: createId("id3"), count: "2", reverse: "false"})
			return Promise.resolve([mail5, mail6])
		}

		// further range reads are fully taken from range
		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("id1"),
			count: "4",
			reverse: "false"
		}, readOnlyHeaders())

		o(clientSpy.callCount).equals(3) // entities are still provided from server
		o(result2).deepEquals([cachedMails[1], cachedMails[2], clone(mail5), clone(mail6)])
	})


	o("load range starting outside of stored range - reverse", async function () {
		let mailFirst = createMailInstance("listId1", "ic5", "subject") // use ids smaller than "id1"
		let mailSecond = createMailInstance("listId1", "ic8", "subject")
		await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads from the end of the range which is id1
			o(queryParameter).deepEquals({start: createId("id1"), count: "4", reverse: "true"})
			return Promise.resolve([mailSecond, mailFirst])
		}

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("ic6"),
			count: "4",
			reverse: "true"
		})
		o(result).deepEquals([clone(mailFirst)])
		o(cache._getFromCache(MailTypeRef, getListId(mailFirst), getElementId(mailFirst))).deepEquals(mailFirst)
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})

	o("load range starting outside of stored range - reverse - read only", async function () {
		let mailFirst = createMailInstance("listId1", "ic5", "subject") // use ids smaller than "id1"
		let mailSecond = createMailInstance("listId1", "ic8", "subject")
		await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			// load everything from network
			o(queryParameter).deepEquals({start: createId("ic6"), count: "4", reverse: "true"})
			return Promise.resolve([mailFirst])
		}

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("ic6"),
			count: "4",
			reverse: "true"
		}, readOnlyHeaders())

		o(result).deepEquals([clone(mailFirst)])
		o(cache._getFromCache(MailTypeRef, getListId(mailFirst), getElementId(mailFirst))).deepEquals(undefined)
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})


	o("load range starting outside of stored range - no new elements", async function () {
		const cachedMails = await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads from the end of the range which is id1
			o(queryParameter).deepEquals({start: createId("id1"), count: "4", reverse: "true"})
			return Promise.resolve([])
		}
		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: createId("ic6"),
			count: "4",
			reverse: "true"

		})
		o(result).deepEquals([])
		o(clientSpy.callCount).equals(2) // entities are provided from server
	})

	o("no elements in range", async function () {
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: GENERATED_MAX_ID, count: "100", reverse: "true"})
			return Promise.resolve([])
		}

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "100",
			reverse: "true"
		})
		o(result).deepEquals([])

		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "100",
			reverse: "true"
		})
		o(result2).deepEquals([])
		o(clientSpy.callCount).equals(1) // entities are only initially tried to be loaded from server
	})


	o("no elements in range - read only", async function () {
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: GENERATED_MAX_ID, count: "100", reverse: "true"})
			return Promise.resolve([])
		}

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "100",
			reverse: "true"
		}, readOnlyHeaders())
		o(result).deepEquals([])

		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "100",
			reverse: "true"
		}, readOnlyHeaders())
		o(result2).deepEquals([])
		o(clientSpy.callCount).equals(2) // entities are only initially tried to be loaded from server
	})


	o("custom id range is not stored", async function () {
		let ref = clone(createExternalUserReference())
		ref._id = ["listId1", stringToCustomId("custom")]
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, ExternalUserReferenceTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: CUSTOM_MIN_ID, count: "1", reverse: "false"})
			return Promise.resolve([ref])
		}
		const result1 = await cache.entityRequest(ExternalUserReferenceTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: CUSTOM_MIN_ID,
			count: "1",
			reverse: "false"
		})
		o(result1).deepEquals([ref])
		const result2 = await cache.entityRequest(ExternalUserReferenceTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: CUSTOM_MIN_ID,
			count: "1",
			reverse: "false"
		})
		o(result2).deepEquals([ref])
		o(clientSpy.callCount).equals(2) // entities are always provided from server
	})

	o("custom id range is not stored - read only", async function () {
		let ref = clone(createExternalUserReference())
		ref._id = ["listId1", stringToCustomId("custom")]
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, ExternalUserReferenceTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: CUSTOM_MIN_ID, count: "1", reverse: "false"})
			return Promise.resolve([ref])
		}
		const result1 = await cache.entityRequest(ExternalUserReferenceTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: CUSTOM_MIN_ID,
			count: "1",
			reverse: "false"
		}, readOnlyHeaders())
		o(result1).deepEquals([ref])
		const result2 = await cache.entityRequest(ExternalUserReferenceTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: CUSTOM_MIN_ID,
			count: "1",
			reverse: "false"
		}, readOnlyHeaders())
		o(result2).deepEquals([ref])
		o(clientSpy.callCount).equals(2) // entities are always provided from server
	})

	o("load range beginning at MAX_ID while range exists", async function () {
		const cachedMails = await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads all elements again and overwrites the current range
			o(queryParameter).deepEquals({start: GENERATED_MAX_ID, count: "10", reverse: "true"})
			return Promise.resolve([cachedMails[2], cachedMails[1], cachedMails[0]])
		}


		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MAX_ID)).equals(false)

		const result1 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "10",
			reverse: "true"
		})
		o(result1).deepEquals([cachedMails[2], cachedMails[1], cachedMails[0]])
		o(clientSpy.callCount).equals(2) // entities are provided from server
		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MAX_ID)).equals(true)

		// further requests are resolved from the cache
		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "10",
			reverse: "true"
		})

		o(result2).deepEquals([cachedMails[2], cachedMails[1], cachedMails[0]])
		o(clientSpy.callCount).equals(2) // entities are provided from cache
	})

	o("load range beginning at MAX_ID while range exists - read only", async function () {
		const cachedMails = await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads all elements again and overwrites the current range
			o(queryParameter).deepEquals({start: GENERATED_MAX_ID, count: "10", reverse: "true"})
			return Promise.resolve([cachedMails[2], cachedMails[1], cachedMails[0]])
		}


		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MAX_ID)).equals(false)

		const result1 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "10",
			reverse: "true"
		}, readOnlyHeaders())
		o(result1).deepEquals([cachedMails[2], cachedMails[1], cachedMails[0]])
		o(clientSpy.callCount).equals(2) // entities are provided from server

		// Should not modify cache
		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MAX_ID)).equals(false)

		// further requests are resolved from the cache
		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "10",
			reverse: "true"
		}, readOnlyHeaders())

		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MAX_ID)).equals(false)

		o(result2).deepEquals([cachedMails[2], cachedMails[1], cachedMails[0]])
		o(clientSpy.callCount).equals(3) // entities are provided from network
	})


	o("load range beginning at MIN_ID while range exists", async function () {
		const cachedMails = await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads all elements again and overwrites the current range
			o(queryParameter).deepEquals({start: GENERATED_MIN_ID, count: "10", reverse: "false"})
			return Promise.resolve(cachedMails)
		}

		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MIN_ID)).equals(false)

		const result1 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MIN_ID,
			count: "10",
			reverse: "false"
		})
		o(result1).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2]])
		// further reqests are resolved from the cache
		o(clientSpy.callCount).equals(2) // entities are provided from server

		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MIN_ID)).equals(true)
		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MIN_ID,
			count: "10",
			reverse: "false"
		})
		o(result2).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2]])
		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MIN_ID)).equals(true)
		o(clientSpy.callCount).equals(2) // entities are provided from cache
	})

	o("load range beginning at MIN_ID while range exists - read only", async function () {
		const cachedMails = await setupMailList(false, false)
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			// the cache actually loads all elements again and overwrites the current range
			o(queryParameter).deepEquals({start: GENERATED_MIN_ID, count: "10", reverse: "false"})
			return Promise.resolve(cachedMails)
		}

		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MIN_ID)).equals(false)

		const result1 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MIN_ID,
			count: "10",
			reverse: "false"
		}, readOnlyHeaders())
		o(result1).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2]])
		// further reqests are resolved from the cache
		o(clientSpy.callCount).equals(2) // entities are provided from server

		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MIN_ID)).equals(false)
		const result2 = await cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MIN_ID,
			count: "10",
			reverse: "false"
		}, readOnlyHeaders())
		o(result2).deepEquals([cachedMails[0], cachedMails[1], cachedMails[2]])
		o(cache._isInCacheRange(typeRefToPath(MailTypeRef), "listId1", GENERATED_MIN_ID)).equals(false)
		o(clientSpy.callCount).equals(3) // entities are provided from cache
	})

	o("loadMultiple", async function () {
		const listId = "listId"
		const inCache = [createMailInstance(listId, "1", "1"), createMailInstance(listId, "3", "3")]
		const notInCache = [createMailInstance(listId, "2", "2"), createMailInstance(listId, "5", "5")]
		inCache.forEach((i) => cache._putIntoCache(i))
		const ids = inCache.concat(notInCache).map(getElementId)

		clientEntityRequest = () => Promise.resolve(notInCache)

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, listId, null, null, {ids: ids.join(",")})

		o(result).deepEquals(notInCache.concat(inCache))
		o(clientSpy.callCount).equals(1)
		o(clientSpy.args).deepEquals(
			[MailTypeRef, HttpMethod.GET, listId, null, null, {ids: notInCache.map(getElementId).join(",")}, undefined]
		)
		inCache.concat(notInCache).forEach((e) => {
			o(cache._isInCache(MailTypeRef, listId, getElementId(e))).equals(true)
		})
	})

	o("loadMultiple - read only", async function () {
		const listId = "listId"
		const inCache = [createMailInstance(listId, "1", "1"), createMailInstance(listId, "3", "3")]
		const notInCache = [createMailInstance(listId, "2", "2"), createMailInstance(listId, "5", "5")]
		inCache.forEach((i) => cache._putIntoCache(i))
		const ids = inCache.concat(notInCache).map(getElementId)

		clientEntityRequest = () => Promise.resolve(notInCache)

		const result = await cache.entityRequest(MailTypeRef, HttpMethod.GET, listId, null, null, {ids: ids.join(",")}, readOnlyHeaders())
		o(result.sort(sortCompareById).map(getElementId)).deepEquals(inCache.concat(notInCache).sort(sortCompareById).map(getElementId))
		o(clientSpy.callCount).equals(1)
		o(clientSpy.args).deepEquals(
			[MailTypeRef, HttpMethod.GET, listId, null, null, {ids: notInCache.map(getElementId).join(",")}, {}]
		)
		notInCache.forEach((e) => {
			o(cache._isInCache(MailTypeRef, listId, getElementId(e))).equals(false)
		})

		inCache.forEach((e) => {
			o(cache._isInCache(MailTypeRef, listId, getElementId(e))).equals(true)
		})
	})
})

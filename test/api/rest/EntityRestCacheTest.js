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
	HttpMethod,
	isSameTypeRef,
	stringToCustomId,
	TypeRef
} from "../../../src/api/common/EntityFunctions"
import {createMail, MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {clone} from "../../../src/api/common/utils/Utils"
import {createExternalUserReference, ExternalUserReferenceTypeRef} from "../../../src/api/entities/sys/ExternalUserReference"
import {NotFoundError} from "../../../src/api/common/error/RestError"

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

	o("element create notifications are not put into cache", function () {
		cache.entityEventReceived(createUpdate(MailBodyTypeRef, (null: any), "id1", OperationType.CREATE))
		o(clientSpy.callCount).equals(0)
	})

	o("element update notifications are not put into cache", function () {
		cache.entityEventReceived(createUpdate(MailBodyTypeRef, (null: any), "id1", OperationType.UPDATE))
		o(clientSpy.callCount).equals(0)
	})

	// element notifications
	o("element is updated in cache", function (done) {
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

		cache.entityEventReceived(createUpdate(MailBodyTypeRef, (null: any), createId("id1"), OperationType.UPDATE)).then(() => {
			o(clientSpy.callCount).equals(1) // entity is loaded from server
			cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null).then(body => {
				o(body.text).equals("goodbye")
			}).then(() => {
				o(clientSpy.callCount).equals(1) // entity is provided from cache
				done()
			})
		})
	})

	o("element is deleted from cache", function (done) {
		let initialBody = createBodyInstance("id1", "hello")
		cache._putIntoCache(initialBody)

		let newBody = createBodyInstance("id1", "goodbye")
		clientEntityRequest = function (args) {
			return Promise.reject(new NotFoundError("not found"))
		}

		cache.entityEventReceived(createUpdate(MailBodyTypeRef, (null: any), createId("id1"), OperationType.DELETE)).then(() => {
			o(clientSpy.callCount).equals(0) // entity is not loaded from server
			cache.entityRequest(MailBodyTypeRef, HttpMethod.GET, null, createId("id1"), null, null).catch(e => {
				o(e instanceof NotFoundError).equals(true)
			}).then(() => {
				o(clientSpy.callCount).equals(1) // entity is provided from cache
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

	// list element notifications
	o("list element create notifications are not put into cache", function () {
		cache.entityEventReceived(createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.CREATE))
		o(clientSpy.callCount).equals(0)
	})

	o("list element update notifications are not put into cache", function () {
		cache.entityEventReceived(createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.UPDATE))
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

		cache.entityEventReceived(createUpdate(MailTypeRef, "listId1", createId("id1"), OperationType.UPDATE)).then(() => {
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
			return cache.entityEventReceived(createUpdate(MailTypeRef, "listId1", createId("id2"), OperationType.DELETE)).then(() => {
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

	let setupMailList = function (loadedUntilMinId: boolean, loadedUntilMaxId: boolean): Promise<Mail[]> {
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
		return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: startId,
			count: count,
			reverse: "true"
		}).then(mails => {
			o(mails).deepEquals(clone([mail3, mail2, mail1]))
			return clone([mail1, mail2, mail3])
		}).then(mails => {
			o(clientSpy.callCount).equals(1) // entities are loaded from server
			return mails
		})
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

	o("load list elements partly from server - range min to id3 loaded", function (done) {
		let mail4 = createMailInstance("listId1", "id4", "subject4")
		setupMailList(true, false).then(originalMails => {
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(null)
				o(entity).equals(null)
				o(queryParameter).deepEquals({start: originalMails[2]._id[1], count: "1", reverse: "false"})
				return Promise.resolve([mail4])
			}
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "4",
				reverse: "false"
			}).then(mails => {
				o(mails).deepEquals([originalMails[0], originalMails[1], originalMails[2], clone(mail4)])
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("load list elements partly from server - range max to id2 loaded - start in middle of range", function (done) {
		let mail0 = createMailInstance("listId1", "id0", "subject0")
		setupMailList(false, true).then(originalMails => {
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(null)
				o(entity).equals(null)
				o(queryParameter).deepEquals({start: originalMails[0]._id[1], count: "3", reverse: "true"})
				return Promise.resolve([mail0])
			}
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: createId("id2"),
				count: "4",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([originalMails[0], clone(mail0)])
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("load list elements partly from server - range max to id2 loaded - loadMore", function (done) {
		let mail0 = createMailInstance("listId1", "id0", "subject0")
		setupMailList(false, true).then(originalMails => {
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(null)
				o(entity).equals(null)
				o(queryParameter).deepEquals({start: originalMails[0]._id[1], count: "4", reverse: "true"})
				return Promise.resolve([mail0])
			}
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: createId("id1"),
				count: "4",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([clone(mail0)])
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("load range starting outside of stored range - not reverse", function (done) {
		let mail5 = createMailInstance("listId1", "id5", "subject5")
		let mail6 = createMailInstance("listId1", "id6", "subject6")
		setupMailList(true, false).then(originalMails => {
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(null)
				o(entity).equals(null)
				// the cache actually loads from the end of the range which is id4
				o(queryParameter).deepEquals({start: createId("id4"), count: "4", reverse: "false"})
				return Promise.resolve([mail5, mail6])
			}
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: createId("id5"),
				count: "4",
				reverse: "false"
			}).then(mails => {
				o(mails).deepEquals([clone(mail6)])
				// further range reads are fully taken from range
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: createId("id1"),
					count: "4",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals([originalMails[1], originalMails[2], clone(mail5), clone(mail6)])
				})
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("load range starting outside of stored range - reverse", function (done) {
		let mailFirst = createMailInstance("listId1", "ic5", "subject") // use ids smaller than "id1"
		let mailSecond = createMailInstance("listId1", "ic8", "subject")
		setupMailList(false, false).then(originalMails => {
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
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: createId("ic6"),
				count: "4",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([clone(mailFirst)])
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("load range starting outside of stored range - no new elements", function (done) {
		setupMailList(false, false).then(originalMails => {
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
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: createId("ic6"),
				count: "4",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([])
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("no elements in range", function (done) {
		clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
			o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
			o(method).equals(HttpMethod.GET)
			o(listId).equals("listId1")
			o(id).equals(null)
			o(entity).equals(null)
			o(queryParameter).deepEquals({start: GENERATED_MAX_ID, count: "100", reverse: "true"})
			return Promise.resolve([])
		}
		return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: GENERATED_MAX_ID,
			count: "100",
			reverse: "true"
		}).then(mails => {
			o(mails).deepEquals([])
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MAX_ID,
				count: "100",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([])
			})
		}).then(mails => {
			o(clientSpy.callCount).equals(1) // entities are only initially tried to be loaded from server
			done()
		})
	})

	o("custom id range is not stored", function (done) {
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
		return cache.entityRequest(ExternalUserReferenceTypeRef, HttpMethod.GET, "listId1", null, null, {
			start: CUSTOM_MIN_ID,
			count: "1",
			reverse: "false"
		}).then(refs => {
			o(refs).deepEquals([ref])
			return cache.entityRequest(ExternalUserReferenceTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: CUSTOM_MIN_ID,
				count: "1",
				reverse: "false"
			}).then(refs => {
				o(refs).deepEquals([ref])
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are always provided from server
			done()
		})
	})

	o("load range beginning at MAX_ID while range exists", function (done) {
		setupMailList(false, false).then(originalMails => {
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(null)
				o(entity).equals(null)
				// the cache actually loads all elements again and overwrites the current range
				o(queryParameter).deepEquals({start: GENERATED_MAX_ID, count: "10", reverse: "true"})
				return Promise.resolve([originalMails[2], originalMails[1], originalMails[0]])
			}
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MAX_ID,
				count: "10",
				reverse: "true"
			}).then(mails => {
				o(mails).deepEquals([originalMails[2], originalMails[1], originalMails[0]])
				// further reqests are resolved from the cache
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MAX_ID,
					count: "10",
					reverse: "true"
				}).then(mails => {
					o(mails).deepEquals([originalMails[2], originalMails[1], originalMails[0]])
				})
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
	})

	o("load range beginning at MIN_ID while range exists", function (done) {
		setupMailList(false, false).then(originalMails => {
			clientEntityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
				o(isSameTypeRef(typeRef, MailTypeRef)).equals(true)
				o(method).equals(HttpMethod.GET)
				o(listId).equals("listId1")
				o(id).equals(null)
				o(entity).equals(null)
				// the cache actually loads all elements again and overwrites the current range
				o(queryParameter).deepEquals({start: GENERATED_MIN_ID, count: "10", reverse: "false"})
				return Promise.resolve(originalMails)
			}
			return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
				start: GENERATED_MIN_ID,
				count: "10",
				reverse: "false"
			}).then(mails => {
				o(mails).deepEquals([originalMails[0], originalMails[1], originalMails[2]])
				// further reqests are resolved from the cache
				return cache.entityRequest(MailTypeRef, HttpMethod.GET, "listId1", null, null, {
					start: GENERATED_MIN_ID,
					count: "10",
					reverse: "false"
				}).then(mails => {
					o(mails).deepEquals([originalMails[0], originalMails[1], originalMails[2]])
				})
			})
		}).then(() => {
			o(clientSpy.callCount).equals(2) // entities are provided from server
			done()
		})
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
})

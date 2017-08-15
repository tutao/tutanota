// @flow
import o from "ospec/ospec.js"
import {EventBusClient} from "../../../src/api/worker/EventBusClient"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import {getEntityRestCache} from "../../../src/api/worker/rest/EntityRestCache"
import {mockAttribute, unmockAttribute} from "../TestUtils"
import {loginFacade} from "../../../src/api/worker/facades/LoginFacade"
import {mailFacade} from "../../../src/api/worker/facades/MailFacade"
import {workerImpl} from "../../../src/api/worker/WorkerImpl"

o.spec("EventBusClient test", () => {

	let ebc = new EventBusClient()

	o.beforeEach(() => {
		ebc = new EventBusClient()
		let e = (ebc:any)
		e.connect = function (reconnect: boolean) {
		}
	})

	// o("_loadMissedEntityEvents", () => {
	// 	let notificationMock = mockAttribute(workerImpl, workerImpl.sendNotification, () => {
	// 		o("outOfSync").equals("error")
	// 	})
	// 	let loggedInMock = mockAttribute(loginFacade, loginFacade.isLoggedIn, () => true)
	// 	let getAllGroupsMock = mockAttribute(loginFacade, loginFacade.getAllGroupIds, () => ["g1", "g2"])
	// 	let loadMock = null
	//
	// 	ebc._loadMissedEntityEvents().then(() => {
	//
	// 	}).finally(() => {
	// 		unmockAttribute(notificationMock)
	// 		unmockAttribute(loggedInMock)
	// 		unmockAttribute(getAllGroupsMock)
	// 	})
	// })

	o("parallel received event batches are passed sequentially to the entity rest cache", node((done, timeout) => {
		timeout(500)
		let cacheCallState = "initial"
		let cacheMock = mockAttribute(getEntityRestCache(), getEntityRestCache().entityEventReceived, (data: EntityUpdate) => {
			//console.log("enter", cacheCallState)
			if (cacheCallState == "initial") {
				cacheCallState = "firstEntered"
			} else if (cacheCallState == "firstFinished") {
				cacheCallState = "secondEntered"
			} else {
				o(cacheCallState).equals("invalid state found entering entityEventReceived")
			}
			return Promise.delay(10).then(() => {
				//console.log("finish", cacheCallState)
				if (cacheCallState == "firstEntered") {
					cacheCallState = "firstFinished"
				} else if (cacheCallState == "secondEntered") {
					cacheCallState = "secondFinished"
				} else {
					o(cacheCallState).equals("invalid state found finishing entityEventReceived")
				}
			})
		})
		let loginMock = mockAttribute(loginFacade, loginFacade.entityEventReceived, () => {
			return Promise.resolve()
		})
		let mailMock = mockAttribute(mailFacade, mailFacade.entityEventReceived, () => {
			return Promise.resolve()
		})
		let workerMock = mockAttribute(workerImpl, workerImpl.entityEventReceived, () => {
			return Promise.resolve()
		})

		let messageData1 = _createMessageData(1)
		let messageData2 = _createMessageData(2)

		// call twice as if it was received in parallel
		let p1 = ebc._message(({data: JSON.stringify(messageData1)}:any))
		let p2 = ebc._message(({data: JSON.stringify(messageData2)}:any))
		Promise.all([p1, p2]).then(() => {
			// make sure the second queued event was also processed
			o(cacheCallState).equals("secondFinished")
			unmockAttribute(workerMock)
			unmockAttribute(mailMock)
			unmockAttribute(loginMock)
			unmockAttribute(cacheMock)
			done()
		})
	}))

	let _createMessageData = function (eventBatchId: number) {
		return {
			_format: "0",
			clientVersion: "1",
			eventBatchId: String(eventBatchId),
			eventBatchOwner: "ownerId",
			modelVersions: "1,1",
			msgId: "1",
			type: "entityUpdate",
			authentication: null,
			chat: null,
			entityUpdate: null,
			exception: null,
			eventBatch: [{
				_id: "eventbatchid",
				application: "tutanota",
				type: "Mail",
				instanceListId: "listId1",
				instanceId: "id1",
				operation: OperationType.UPDATE
			}]
		}
	}

})
// @flow
import o from "ospec/ospec.js"
import {EventBusClient} from "../../../src/api/worker/EventBusClient"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import {spy} from "../TestUtils"

o.spec("EventBusClient test", () => {

	let ebc: any = null
	let cacheMock: any = null

	o.beforeEach(() => {
		cacheMock = ({
			cacheCallState: "initial",
			entityEventReceived: (data: EntityUpdate) => {
				//console.log("enter", cacheCallState)
				if (cacheMock.cacheCallState == "initial") {
					cacheMock.cacheCallState = "firstEntered"
				} else if (cacheMock.cacheCallState == "firstFinished") {
					cacheMock.cacheCallState = "secondEntered"
				} else {
					o(cacheMock.cacheCallState).equals("invalid state found entering entityEventsReceived")
				}
				return Promise.delay(10).then(() => {
					//console.log("finish", cacheCallState)
					if (cacheMock.cacheCallState == "firstEntered") {
						cacheMock.cacheCallState = "firstFinished"
					} else if (cacheMock.cacheCallState == "secondEntered") {
						cacheMock.cacheCallState = "secondFinished"
					} else {
						o(cacheMock.cacheCallState).equals("invalid state found finishing entityEventsReceived")
					}
				})
			}
		}: any)
		let loginMock: any = {
			entityEventsReceived: () => {
				return Promise.resolve()
			}
		}
		let mailMock: any = {
			entityEventsReceived: () => {
				return Promise.resolve()
			}
		}
		let workerMock: any = {
			entityEventsReceived: () => {
				return Promise.resolve()
			},
			updateCounter: () => {
				return Promise.resolve()
			}
		}
		let indexerMock: any = {
			processEntityEvents: (filteredEvents, groupId, batchId) => {
				return Promise.resolve()
			}
		}


		ebc = new EventBusClient(workerMock, indexerMock, cacheMock, mailMock, loginMock)
		let e = (ebc: any)
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

		let messageData1 = _createMessageData(1)
		let messageData2 = _createMessageData(2)

		// call twice as if it was received in parallel
		let p1 = ebc._message({data: messageData1})
		let p2 = ebc._message({data: messageData2})
		Promise.all([p1, p2]).then(() => {
			// make sure the second queued event was also processed
			o(cacheMock.cacheCallState).equals("secondFinished")
			done()
		})
	}))

	o("counter update", node((done, timeout) => {
		let counterUpdate = _createCounterData("group1", 4, "list1")
		ebc._worker.updateCounter = spy(ebc._worker.updateCounter)
		ebc._message({data: counterUpdate}).then(() => {
			o(ebc._worker.updateCounter.invocations).deepEquals([
				[
					{
						_format: "0",
						mailGroup: "group1",
						counterValues: [
							{
								_id: "counterupdateid",
								count: 4,
								mailListId: "list1"
							}
						]
					}
				]
			])
			done()
		})
	}))


	let _createMessageData = function (eventBatchId: number): string {
		const event = {
			_format: "0",
			eventBatchId: String(eventBatchId),
			eventBatchOwner: "ownerId",
			eventBatch: [
				{
					_id: "eventbatchid",
					application: "tutanota",
					type: "Mail",
					instanceListId: "listId1",
					instanceId: "id1",
					operation: OperationType.UPDATE
				}
			]
		}
		return "entityUpdate;" + JSON.stringify(event)
	}

	let _createCounterData = function (mailGroupId: Id, counterValue: number, listId: Id): string {
		const event = {
			_format: "0",
			mailGroup: mailGroupId,
			counterValues: [
				{
					_id: "counterupdateid",
					count: counterValue,
					mailListId: listId
				}
			]
		}
		return "unreadCounterUpdate;" + JSON.stringify(event)
	}

})
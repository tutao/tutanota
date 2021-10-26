// @flow
import o from "ospec"
import {EventBusClient, EventBusState} from "../../../src/api/worker/EventBusClient"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import {spy} from "@tutao/tutanota-test-utils"
import type {EntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {EntityRestClientMock} from "./EntityRestClientMock"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {defer, downcast} from "@tutao/tutanota-utils"
import {WorkerImpl} from "../../../src/api/worker/WorkerImpl"
import {LoginFacade, LoginFacadeImpl} from "../../../src/api/worker/facades/LoginFacade"
import {createUser} from "../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {EntityRestCache} from "../../../src/api/worker/rest/EntityRestCache"

o.spec("EventBusClient test", function () {

	let ebc: EventBusClient
	let cacheMock: $Shape<EntityRestCache>
	let restClient: EntityRestClientMock
	let workerMock: WorkerImpl
	let loginMock: LoginFacadeImpl

	o.beforeEach(function () {
		cacheMock = downcast({
			entityEventsReceived: (data: $ReadOnlyArray<EntityUpdate>): Promise<Array<EntityUpdate>> => Promise.resolve(data.slice()),
		})
		const user = createUser({
			userGroup: createGroupMembership({group: "userGroupId"}),
		})
		loginMock = downcast(({
				entityEventsReceived: () => {
					return Promise.resolve()
				},
				getLoggedInUser() {
					return user;
				}
			}: $Shape<LoginFacadeImpl>
		))
		let mailMock: any = {
			entityEventsReceived: () => {
				return Promise.resolve()
			}
		}
		workerMock = downcast(({
				entityEventsReceived: () => {
					return Promise.resolve()
				},
				updateCounter: () => {
					return Promise.resolve()
				},
				updateWebSocketState(state) {
					return Promise.resolve();
				},
				sendError(e) {
					throw e
				}
			}: $Shape<WorkerImpl>
		))

		let indexerMock: any = {
			processEntityEvents: (filteredEvents, groupId, batchId) => {
				return Promise.resolve()
			}
		}
		restClient = new EntityRestClientMock()
		const entityClient = new EntityClient(restClient)

		ebc = new EventBusClient(workerMock, indexerMock, cacheMock, mailMock, loginMock, entityClient)
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

	o("parallel received event batches are passed sequentially to the entity rest cache", node(async function () {
		o.timeout(500)
		ebc._state = EventBusState.Automatic
		await ebc._onOpen(false)

		let messageData1 = _createMessageData(1)
		let messageData2 = _createMessageData(2)

		const cacheDefer = defer()
		downcast(cacheMock).entityEventsReceived = o.spy(() => cacheDefer.promise)
		// call twice as if it was received in parallel
		let p1 = ebc._message(downcast({data: messageData1}))
		let p2 = ebc._message(downcast({data: messageData2}))
		await Promise.all([p1, p2])
		// make sure the second queued event was also processed
		cacheMock.entityEventsReceived.calls.length = 1
	}))

	o("counter update", node(async function () {
		let counterUpdate = _createCounterData("group1", 4, "list1")
		downcast(workerMock).updateCounter = spy(ebc._worker.updateCounter)
		await ebc._message(downcast({data: counterUpdate}))
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

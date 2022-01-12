import o from "ospec"
import {EventBusClient, EventBusState} from "../../../src/api/worker/EventBusClient"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import type {EntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {EntityRestClientMock} from "./EntityRestClientMock"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {defer, downcast} from "@tutao/tutanota-utils"
import {WorkerImpl} from "../../../src/api/worker/WorkerImpl"
import {LoginFacadeImpl} from "../../../src/api/worker/facades/LoginFacade"
import {createUser} from "../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {InstanceMapper} from "../../../src/api/worker/crypto/InstanceMapper"
import {EntityRestCache} from "../../../src/api/worker/rest/EntityRestCache"
import {QueuedBatch} from "../../../src/api/worker/search/EventQueue"
import {mockAttribute} from "@tutao/tutanota-test-utils"
import {OutOfSyncError} from "../../../src/api/common/error/OutOfSyncError"

o.spec("EventBusClient test", function () {
	let ebc: EventBusClient
	let cacheMock: EntityRestCache
	let restClient: EntityRestClientMock
	let workerMock: WorkerImpl
	let loginMock: LoginFacadeImpl
	o.beforeEach(async function () {
		const cacheTemplate: Partial<EntityRestCache> = {
			entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
				return Promise.resolve(batch.events.slice())
			},
			getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
				return Promise.resolve(null)
			},
			getServerTimestampMs(): number {
				return 0
			},
			async getLastUpdateTime(): Promise<number> {
				return 0
			},
			async setLastUpdateTime(value: number): Promise<void> {

			},
			purgeStorage: o.spy(async () => {
			})

		}
		cacheMock = cacheTemplate as EntityRestCache
		const user = createUser({
			userGroup: createGroupMembership({
				group: "userGroupId",
			}),
		})
		loginMock = downcast({
			entityEventsReceived: () => {
				return Promise.resolve()
			},

			getLoggedInUser() {
				return user
			},
			isLoggedIn(): boolean {
				return true
			}
		} as Partial<LoginFacadeImpl>)
		let mailMock: any = {
			entityEventsReceived: () => {
				return Promise.resolve()
			},
		}
		workerMock = downcast({
			entityEventsReceived: () => {
				return Promise.resolve()
			},
			updateCounter: () => {
				return Promise.resolve()
			},

			updateWebSocketState(state) {
				return Promise.resolve()
			},

			sendError(e) {
				throw e
			},
		} as Partial<WorkerImpl>)
		let indexerMock: any = {
			processEntityEvents: (filteredEvents, groupId, batchId) => {
				return Promise.resolve()
			},
		}
		restClient = new EntityRestClientMock()
		const entityClient = new EntityClient(restClient)
		const intanceMapper = new InstanceMapper()
		ebc = new EventBusClient(workerMock, indexerMock, cacheMock, mailMock, loginMock, entityClient, intanceMapper)
		let e = ebc as any

		e.connect = function (reconnect: boolean) {
		}
	})

	o.spec("loadMissedEntityEvents ", function () {
		o("When the cache is out of sync with the server, the cache is purged", async function () {
			mockAttribute(cacheMock, cacheMock.getServerTimestampMs, () => new Date().getTime())
			try {
				await ebc.loadMissedEntityEvents()
			} catch (e) {
				o(e instanceof OutOfSyncError).equals(true)
			}
			o(cacheMock.purgeStorage.callCount).equals(1)("The cache is purged")
		})
	})
	o("parallel received event batches are passed sequentially to the entity rest cache", node(async function () {
			o.timeout(500)
			ebc._state = EventBusState.Automatic
			await ebc._onOpen(false)

			let messageData1 = _createMessageData(1)

			let messageData2 = _createMessageData(2)

			const cacheDefer = defer()
			downcast(cacheMock).entityEventsReceived = o.spy(() => cacheDefer.promise)

			// call twice as if it was received in parallel
			let p1 = ebc._message(
				downcast({
					data: messageData1,
				}),
			)

			let p2 = ebc._message(
				downcast({
					data: messageData2,
				}),
			)

			await Promise.all([p1, p2])
			// make sure the second queued event was also processed
			cacheMock.entityEventsReceived.calls.length = 1
		}),
	)
	o("counter update", node(async function () {
			let counterUpdate = _createCounterData("group1", 4, "list1")

			downcast(workerMock).updateCounter = o.spy(ebc._worker.updateCounter)
			await ebc._message(
				downcast({
					data: counterUpdate,
				}),
			)
			o(ebc._worker.updateCounter.calls.map(c => c.args)).deepEquals([
				[
					{
						_format: "0",
						mailGroup: "group1",
						counterValues: [
							{
								_id: "counterupdateid",
								count: 4,
								mailListId: "list1",
							},
						],
					},
				],
			])
		}),
	)

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
					operation: OperationType.UPDATE,
				},
			],
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
					mailListId: listId,
				},
			],
		}
		return "unreadCounterUpdate;" + JSON.stringify(event)
	}
})
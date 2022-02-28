import o from "ospec"
import {EventBusClient, EventBusState} from "../../../src/api/worker/EventBusClient"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import type {EntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {createEntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {EntityRestClientMock} from "./EntityRestClientMock"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {downcast, noOp} from "@tutao/tutanota-utils"
import {WorkerImpl} from "../../../src/api/worker/WorkerImpl"
import {LoginFacadeImpl} from "../../../src/api/worker/facades/LoginFacade"
import {createUser} from "../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {InstanceMapper} from "../../../src/api/worker/crypto/InstanceMapper"
import {EntityRestCache} from "../../../src/api/worker/rest/EntityRestCache"
import {QueuedBatch} from "../../../src/api/worker/search/EventQueue"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {OutOfSyncError} from "../../../src/api/common/error/OutOfSyncError"
import {matchers, object, verify, when} from "testdouble"
import {MailFacade} from "../../../src/api/worker/facades/MailFacade"
import {Indexer} from "../../../src/api/worker/search/Indexer"
import {createWebsocketEntityData, WebsocketEntityData} from "../../../src/api/entities/sys/WebsocketEntityData"
import {createWebsocketCounterData, WebsocketCounterData} from "../../../src/api/entities/sys/WebsocketCounterData"
import {createWebsocketCounterValue} from "../../../src/api/entities/sys/WebsocketCounterValue"

o.spec("EventBusClient test", function () {
	let ebc: EventBusClient
	let cacheMock: EntityRestCache
	let restClient: EntityRestClientMock
	let workerMock: WorkerImpl
	let loginMock: LoginFacadeImpl
	let mailMock: MailFacade
	let indexerMock: Indexer

	o.beforeEach(async function () {
		cacheMock = object({
			async entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
				return batch.events.slice()
			},
			async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
				return null
			},
			getServerTimestampMs(): number {
				return 0
			},
			async getLastUpdateTime(): Promise<number | null> {
				return 0
			},
			async setLastUpdateTime(value: number): Promise<void> {
			},
			async purgeStorage(): Promise<void> {
			}
		} as EntityRestCache)

		const user = createUser({
			userGroup: createGroupMembership({
				group: "userGroupId",
			}),
		})

		loginMock = object("login")
		when(loginMock.entityEventsReceived(matchers.anything())).thenResolve(undefined)
		when(loginMock.getLoggedInUser()).thenReturn(user)
		when(loginMock.isLoggedIn()).thenReturn(true)

		mailMock = object("mail")
		when(mailMock.entityEventsReceived(matchers.anything())).thenResolve(undefined)

		workerMock = object("worker")
		when(workerMock.entityEventsReceived(matchers.anything(), matchers.anything())).thenResolve(undefined)
		when(workerMock.updateCounter(matchers.anything())).thenResolve(undefined)
		when(workerMock.updateWebSocketState(matchers.anything())).thenResolve(undefined)
		when(workerMock.sendError(matchers.anything())).thenDo((e) => {
			throw e
		})

		indexerMock = object("indexer")
		// TODO: ???
		// when(indexerMock.processEntityEvents(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(undefined)

		restClient = new EntityRestClientMock()
		const entityClient = new EntityClient(restClient)
		const intanceMapper = new InstanceMapper()
		ebc = new EventBusClient(workerMock, indexerMock, cacheMock, mailMock, loginMock, entityClient, intanceMapper)

		// TODO
		let e = ebc as any
		e.connect = function (reconnect: boolean) {
		}
	})

	o.spec("loadMissedEntityEvents ", function () {
		o("When the cache is out of sync with the server, the cache is purged", async function () {
			when(cacheMock.getServerTimestampMs()).thenReturn(Date.now())
			await assertThrows(OutOfSyncError, () => ebc.loadMissedEntityEvents())
			verify(cacheMock.purgeStorage(), {times: 1})
		})
	})
	o("parallel received event batches are passed sequentially to the entity rest cache", async function () {
			o.timeout(500)
			ebc._state = EventBusState.Automatic
			await ebc._onOpen(false)

			let messageData1 = createMessageData(1)
			let messageData2 = createMessageData(2)

			// Casting ot object here because promise stubber doesn't allow you to just return the promise
			// We never resolve the promise
			when(cacheMock.entityEventsReceived(matchers.anything()) as object).thenReturn(new Promise(noOp))


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

			// Is waiting for cache to process the first event
			verify(cacheMock.entityEventsReceived(matchers.anything()), {times: 1})
		},
	)

	o("counter update", async function () {
			let counterUpdate = createCounterData({mailGroupId: "group1", counterValue: 4, listId: "list1"})

			downcast(workerMock).updateCounter = o.spy(ebc._worker.updateCounter)
			await ebc._message(
				{
					data: createCounterMessage(counterUpdate),
				} as MessageEvent,
			)
			verify(workerMock.updateCounter(counterUpdate))
		},
	)

	function createMessageData(eventBatchId: number): string {
		const event: WebsocketEntityData = createWebsocketEntityData({
				eventBatchId: String(eventBatchId),
				eventBatchOwner: "ownerId",
				eventBatch: [
					createEntityUpdate({
						_id: "eventbatchid",
						application: "tutanota",
						type: "Mail",
						instanceListId: "listId1",
						instanceId: "id1",
						operation: OperationType.UPDATE,
					}),
				],
			}
		)
		return "entityUpdate;" + JSON.stringify(event)
	}

	type CounterMessageParams = {mailGroupId: Id, counterValue: number, listId: Id}

	function createCounterData({mailGroupId, counterValue, listId}: CounterMessageParams): WebsocketCounterData {
		return createWebsocketCounterData({
				_format: "0",
				mailGroup: mailGroupId,
				counterValues: [
					createWebsocketCounterValue({
						_id: "counterupdateid",
						count: String(counterValue),
						mailListId: listId,
					}),
				],
			}
		)
	}

	function createCounterMessage(event: WebsocketCounterData): string {
		return "unreadCounterUpdate;" + JSON.stringify(event)
	}
})
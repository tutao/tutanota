import o from "@tutao/otest"
import { object } from "testdouble"
import { DifferentialUidLoader, UidFetchRequestType } from "../../../../../src/applications/common/desktop/imapimport/imapsync/DifferentialUidLoader"
import { ImapMailId } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncState"
import type { FetchMessageObject, ImapFlow } from "imapflow"
import { ImapSyncEventType } from "../../../../../src/entities/tutanota/Utils"

function createFetchStream(messages: FetchMessageObject[]) {
	return (async function* () {
		for (const msg of messages) {
			yield msg
		}
	})()
}

o.spec("DifferentialUidLoader", () => {
	let imapClientMock: ImapFlow
	let importedUidToMailIdsMap: Map<number, ImapMailId>
	let isEnableImapQresync: boolean
	let emitAdSyncEventTypes: Set<ImapSyncEventType>
	let loader: DifferentialUidLoader

	o.beforeEach(() => {
		imapClientMock = object<ImapFlow>()
		importedUidToMailIdsMap = new Map<number, ImapMailId>()
		isEnableImapQresync = false
		emitAdSyncEventTypes = new Set([ImapSyncEventType.CREATE, ImapSyncEventType.UPDATE, ImapSyncEventType.DELETE])
		loader = new DifferentialUidLoader(imapClientMock, importedUidToMailIdsMap, isEnableImapQresync, emitAdSyncEventTypes)
	})

	o.spec("calculateUidDiff", () => {
		o.test("with QRESYNC enabled: pushes QRESYNC request and returns empty array", async () => {
			isEnableImapQresync = true
			loader = new DifferentialUidLoader(imapClientMock, importedUidToMailIdsMap, isEnableImapQresync, emitAdSyncEventTypes)
			const result = await loader.calculateUidDiff(0, 50, 100)
			o.check(result).deepEquals([])
			o.check(loader.uidFetchRequestQueue.length).equals(1)
			o.check(loader.uidFetchRequestQueue[0].fetchRequestType).equals(UidFetchRequestType.QRESYNC)
			o.check(loader.uidFetchRequestQueue[0].uidFetchSequenceString).equals("1:*")
			o.check(loader.uidDiffInProgress).equals(false)
		})

		o.test("without QRESYNC: calculates diff and returns deleted UIDs", async () => {
			importedUidToMailIdsMap.set(1, new ImapMailId(1))
			importedUidToMailIdsMap.set(2, new ImapMailId(2))
			importedUidToMailIdsMap.set(4, new ImapMailId(4))

			const fetchStream = createFetchStream([
				{ uid: 1 } as FetchMessageObject,
				{ uid: 2 } as FetchMessageObject,
				{ uid: 3 } as FetchMessageObject,
				{ uid: 4 } as FetchMessageObject,
			])
			imapClientMock.fetch = () => fetchStream

			const result = await loader.calculateUidDiff(0, null, 50)

			o.check(result).deepEquals([]) // No deletions because all imported are seen
			o.check(loader.uidCreateQueue).deepEquals([3])
			o.check(loader.uidUpdateQueue).deepEquals([1, 2, 4])
		})

		o.test("without QRESYNC: calculates diff and respects emitImapSyncEventTypes list only CREATES", async () => {
			// only allow CREATE events
			emitAdSyncEventTypes = new Set([ImapSyncEventType.CREATE])
			loader = new DifferentialUidLoader(imapClientMock, importedUidToMailIdsMap, isEnableImapQresync, emitAdSyncEventTypes)

			importedUidToMailIdsMap.set(1, new ImapMailId(1))
			importedUidToMailIdsMap.set(2, new ImapMailId(2))
			importedUidToMailIdsMap.set(4, new ImapMailId(4))

			const fetchStream = createFetchStream([
				{ uid: 1 } as FetchMessageObject,
				{ uid: 2 } as FetchMessageObject,
				{ uid: 3 } as FetchMessageObject,
				{ uid: 4 } as FetchMessageObject,
			])
			imapClientMock.fetch = () => fetchStream

			const result = await loader.calculateUidDiff(0, null, 50)

			o.check(result).deepEquals([]) // No deletions because all imported are seen
			o.check(loader.uidCreateQueue).deepEquals([3])
			o.check(loader.uidUpdateQueue).deepEquals([])
		})

		o.test("without QRESYNC: calculates diff and respects emitImapSyncEventTypes list only UPDATES", async () => {
			// only allow CREATE events
			emitAdSyncEventTypes = new Set([ImapSyncEventType.UPDATE])
			loader = new DifferentialUidLoader(imapClientMock, importedUidToMailIdsMap, isEnableImapQresync, emitAdSyncEventTypes)

			importedUidToMailIdsMap.set(1, new ImapMailId(1))
			importedUidToMailIdsMap.set(2, new ImapMailId(2))
			importedUidToMailIdsMap.set(4, new ImapMailId(4))

			const fetchStream = createFetchStream([
				{ uid: 1 } as FetchMessageObject,
				{ uid: 2 } as FetchMessageObject,
				{ uid: 3 } as FetchMessageObject,
				{ uid: 4 } as FetchMessageObject,
			])
			imapClientMock.fetch = (seq: string) => {
				if (seq === "1:*") return fetchStream
				throw new Error(`Unexpected fetch sequence: ${seq}`)
			}

			const result = await loader.calculateUidDiff(0, null, 50)

			o.check(result).deepEquals([]) // No deletions because all imported are seen
			o.check(loader.uidCreateQueue).deepEquals([])
			o.check(loader.uidUpdateQueue).deepEquals([1, 2, 4])
		})

		o.test("returns deleted UIDs correctly", async () => {
			importedUidToMailIdsMap.set(1, new ImapMailId(1))
			importedUidToMailIdsMap.set(2, new ImapMailId(2))
			importedUidToMailIdsMap.set(5, new ImapMailId(5))

			const fetchStream = createFetchStream([{ uid: 1 } as FetchMessageObject, { uid: 3 } as FetchMessageObject, { uid: 4 } as FetchMessageObject])
			imapClientMock.fetch = () => fetchStream

			const result = await loader.calculateUidDiff(0, null, 50)
			o.check(result).deepEquals([2, 5])
		})

		o.test("skips DELETE calculation if DELETE event type not in set", async () => {
			emitAdSyncEventTypes.delete(ImapSyncEventType.DELETE)
			loader = new DifferentialUidLoader(imapClientMock, importedUidToMailIdsMap, isEnableImapQresync, emitAdSyncEventTypes)
			importedUidToMailIdsMap.set(1, new ImapMailId(1))
			const fetchStream = createFetchStream([{ uid: 2 } as FetchMessageObject])
			imapClientMock.fetch = () => fetchStream
			const result = await loader.calculateUidDiff(0, null, 50)
			o.check(result).deepEquals([])
		})

		o.test("handles batch recursion correctly", async () => {
			const fetchStream1 = createFetchStream([{ uid: 1 }, { uid: 2 }, { uid: 3 }] as FetchMessageObject[])
			const fetchStream2 = createFetchStream([{ uid: 4 }, { uid: 5 }, { uid: 6 }] as FetchMessageObject[])
			const fetchStream3 = createFetchStream([{ uid: 7 }, { uid: 8 }, { uid: 9 }] as FetchMessageObject[])
			const fetchStream4 = createFetchStream([{ uid: 10 }] as FetchMessageObject[])
			imapClientMock.fetch = (seq: string) => {
				if (seq === "1:3") return fetchStream1
				if (seq === "4:6") return fetchStream2
				if (seq === "7:9") return fetchStream3
				if (seq === "10:10") return fetchStream4
				throw new Error(`Unexpected fetch sequence: ${seq}`)
			}
			const result = await loader.calculateUidDiff(0, 10, 3)
			o.check(result).deepEquals([])
			o.check(loader.uidCreateQueue.length).equals(10)
			o.check(loader.uidUpdateQueue.length).equals(0)
		})
	})

	o.spec("getNextUidFetchRequest", () => {
		o.test("returns queued request first", async () => {
			const queued = { uidFetchSequenceString: "1,2", fetchRequestType: UidFetchRequestType.CREATE }
			loader.uidFetchRequestQueue.push(queued)
			const request = await loader.getNextUidFetchRequest(50)
			o.check(request).equals(queued)
			o.check(loader.uidFetchRequestQueue.length).equals(0)
		})

		o.test("processes CREATE queue and batches sequences", async () => {
			loader.uidCreateQueue = [1, 2, 3, 4, 5]
			const request1 = await loader.getNextUidFetchRequest(3)
			o.check(request1!.fetchRequestType).equals(UidFetchRequestType.CREATE)
			o.check(request1!.uidFetchSequenceString).equals("1:3")
			o.check(loader.uidCreateQueue).deepEquals([4, 5])
			const request2 = await loader.getNextUidFetchRequest(2)
			o.check(request2!.fetchRequestType).equals(UidFetchRequestType.CREATE)
			o.check(request2!.uidFetchSequenceString).equals("4:5")
			o.check(loader.uidFetchRequestQueue.length).equals(0)
			o.check(loader.uidCreateQueue).deepEquals([])
		})

		o.test("processes UPDATE queue when CREATE empty", async () => {
			loader.uidUpdateQueue = [10, 11, 12, 13]
			const request = await loader.getNextUidFetchRequest(2)
			o.check(request!.fetchRequestType).equals(UidFetchRequestType.UPDATE)
			o.check(request!.uidFetchSequenceString).equals("10:11")
			o.check(loader.uidUpdateQueue).deepEquals([12, 13])
		})

		o.test("returns WAIT when diff in progress and no queues", async () => {
			loader.uidDiffInProgress = true
			const request = await loader.getNextUidFetchRequest(50)
			o.check(request!.fetchRequestType).equals(UidFetchRequestType.WAIT)
			o.check(request!.uidFetchSequenceString).equals("")
		})

		o.test("returns null when nothing to do", async () => {
			const request = await loader.getNextUidFetchRequest(50)
			o.check(request).equals(null)
		})

		o.test("handles merging consecutive UIDs into sequences", async () => {
			loader.uidCreateQueue = [1, 2, 3, 5, 7, 8, 9]
			const request = await loader.getNextUidFetchRequest(7)
			o.check(request!.uidFetchSequenceString).equals("1:3,5,7:9")
		})

		o.test("splits sequences into chunks if more than 25 sequences", async () => {
			const uids: number[] = []
			for (let i = 1; i <= 60; i += 2) {
				uids.push(i)
			}
			loader.uidCreateQueue = [...uids] // 30 items
			const request1 = await loader.getNextUidFetchRequest(30)
			o.check(request1!.fetchRequestType).equals(UidFetchRequestType.CREATE)
			const seqCount1 = request1!.uidFetchSequenceString.split(",").length
			o.check(seqCount1).equals(5)
			o.check(loader.uidFetchRequestQueue.length).equals(1)
			const request2 = await loader.getNextUidFetchRequest(30)
			o.check(request2!.fetchRequestType).equals(UidFetchRequestType.CREATE)
			const seqCount2 = request2!.uidFetchSequenceString.split(",").length
			o.check(seqCount2).equals(25)
		})
	})

	o.test("calculateUidDiff followed by getNextUidFetchRequest", async () => {
		importedUidToMailIdsMap.set(2, new ImapMailId(2))
		const fetchStream = createFetchStream([{ uid: 1 }, { uid: 2 }, { uid: 3 }] as FetchMessageObject[])
		imapClientMock.fetch = () => fetchStream
		await loader.calculateUidDiff(0, null, 50)
		let request = await loader.getNextUidFetchRequest(2)
		o.check(request!.fetchRequestType).equals(UidFetchRequestType.CREATE)
		o.check(request!.uidFetchSequenceString).equals("1,3")
		request = await loader.getNextUidFetchRequest(2)
		o.check(request!.fetchRequestType).equals(UidFetchRequestType.UPDATE)
		o.check(request!.uidFetchSequenceString).equals("2")
	})
})

import { ImapMailId } from "../../../api/common/utils/imapImportUtils/ImapSyncContext.js"
import type { ImapFlow } from "./imapflow-custom.js"
import { ImapSyncEventType } from "../../../../../entities/tutanota/Utils"

interface UidFetchSequence {
	fromUid: number
	toUid: number
}

export enum UidFetchRequestType {
	CREATE,
	UPDATE,
	QRESYNC,
	WAIT,
}

export const UID_FETCH_REQUEST_WAIT_TIME = 10 // in ms

export const DEFAULT_DOWNLOAD_BATCH_SIZE = 50

export interface UidFetchRequest {
	uidFetchSequenceString: string
	fetchRequestType: UidFetchRequestType
}

export type SeenUids = number[]
export type DeletedUids = number[]

export class DifferentialUidLoader {
	uidFetchRequestQueue: UidFetchRequest[] = []
	uidCreateQueue: number[] = []
	uidUpdateQueue: number[] = []
	uidDiffInProgress: boolean = false

	constructor(
		private readonly imapClient: ImapFlow,
		private readonly importedUidToImapMailId: Map<number, ImapMailId>,
		private readonly isEnableImapQresync: boolean,
		private readonly emitImapSyncEventTypes: Set<ImapSyncEventType>,
	) {}

	async calculateUidDiff(
		lastFetchedMailSeq: number,
		totalMessageCount: number | null,
		downloadBatchSize: number = DEFAULT_DOWNLOAD_BATCH_SIZE,
	): Promise<DeletedUids> {
		this.uidDiffInProgress = true
		// if IMAP QRESYNC is enabled and supported by the IMAP server, we do not need to calculate the diff on our own
		if (this.isEnableImapQresync) {
			this.uidFetchRequestQueue.push({
				uidFetchSequenceString: "1:*",
				fetchRequestType: UidFetchRequestType.QRESYNC,
			})
			this.uidDiffInProgress = false
			return [] // delete events are handle automatically by IMAP QRESYNC extension
		}

		const seenUids = await this.calculateUidDiffInBatches(lastFetchedMailSeq + 1, downloadBatchSize, totalMessageCount)

		const deletedUids: number[] = []
		if (this.emitImapSyncEventTypes.has(ImapSyncEventType.DELETE)) {
			deletedUids.push(...[...this.importedUidToImapMailId.keys()].filter((uid) => !seenUids.includes(uid)))
		}

		this.uidDiffInProgress = false
		return deletedUids
	}

	private async calculateUidDiffInBatches(fromSeq: number, downloadBatchSize: number, totalMessageCount: number | null): Promise<SeenUids> {
		const seenUids: number[] = []

		if (totalMessageCount === 0) {
			return seenUids
		}

		// we subtract 1 from the downloadBatchSize because the interval is inclusive on both ends,
		// to get a batch result that is equal to the downloadBatchSize
		const toSeq = fromSeq + (downloadBatchSize - 1)
		const isFinalBatch = totalMessageCount == null || toSeq >= totalMessageCount

		const fromSeqString = fromSeq.toString()
		const toSeqString = totalMessageCount == null ? "*" : isFinalBatch ? totalMessageCount.toString() : toSeq.toString()

		const mails = this.imapClient.fetch(`${fromSeqString}:${toSeqString}`, { uid: true }, {})

		for await (const mail of mails) {
			const uid = mail.uid
			seenUids.push(uid)

			if (this.importedUidToImapMailId.has(uid)) {
				// UPDATES
				if (this.emitImapSyncEventTypes.has(ImapSyncEventType.UPDATE)) {
					this.uidUpdateQueue.push(uid)
				}
			} else {
				// CREATES
				if (this.emitImapSyncEventTypes.has(ImapSyncEventType.CREATE)) {
					this.uidCreateQueue.push(uid)
				}
			}
		}

		if (!isFinalBatch) {
			seenUids.push(...(await this.calculateUidDiffInBatches(toSeq + 1, downloadBatchSize, totalMessageCount)))
		}

		return seenUids
	}

	async getNextUidFetchRequest(downloadBatchSize: number = DEFAULT_DOWNLOAD_BATCH_SIZE): Promise<UidFetchRequest | null> {
		const waitingUidFetchRequest = this.uidFetchRequestQueue.pop()
		if (waitingUidFetchRequest) {
			return waitingUidFetchRequest
		}

		let nextUidFetchRange: number[]
		let fetchRequestType: UidFetchRequestType

		if (this.emitImapSyncEventTypes.has(ImapSyncEventType.CREATE) && this.uidCreateQueue.length !== 0) {
			nextUidFetchRange = this.uidCreateQueue.splice(0, downloadBatchSize)
			fetchRequestType = UidFetchRequestType.CREATE
		} else if (this.emitImapSyncEventTypes.has(ImapSyncEventType.UPDATE) && this.uidUpdateQueue.length !== 0) {
			nextUidFetchRange = this.uidUpdateQueue.splice(0, downloadBatchSize)
			fetchRequestType = UidFetchRequestType.UPDATE
		} else if (this.uidDiffInProgress) {
			return {
				uidFetchSequenceString: "",
				fetchRequestType: UidFetchRequestType.WAIT,
			}
		} else {
			return null
		}

		const uidFetchSequenceStrings = this.buildUidFetchSequenceStrings(nextUidFetchRange)
		const nextUidFetchSequenceRequests = uidFetchSequenceStrings.map((uidFetchSequenceString) => {
			return {
				uidFetchSequenceString: uidFetchSequenceString,
				fetchRequestType: fetchRequestType,
			}
		})

		this.uidFetchRequestQueue.push(...nextUidFetchSequenceRequests)
		return this.uidFetchRequestQueue.pop() ?? null
	}

	private buildUidFetchSequenceStrings(uidsToFetch: number[]): string[] {
		const uidFetchSequenceList = uidsToFetch.reduce<UidFetchSequence[]>((uidFetchSequenceList, uid: number) => {
			const prevUidFetchSequence = uidFetchSequenceList.at(-1)

			if (prevUidFetchSequence && prevUidFetchSequence.toUid === uid - 1) {
				prevUidFetchSequence.toUid = uid
				uidFetchSequenceList[-1] = prevUidFetchSequence
			} else {
				const newUidFetchSequence = {
					fromUid: uid,
					toUid: uid,
				}
				uidFetchSequenceList.push(newUidFetchSequence)
			}
			return uidFetchSequenceList
		}, [])

		// we restrict the length of the uidFetchSequenceString to speed up IMAP server communication (we only allow 25 SequenceStrings per IMAP command)
		const perChunk = 25
		const uidFetchSequenceChunks = uidFetchSequenceList.reduce<UidFetchSequence[][]>(
			(uidFetchSequenceListChunks: UidFetchSequence[][], uidFetchSequenceList, index) => {
				const chunkIndex = Math.floor(index / perChunk)

				if (!uidFetchSequenceListChunks[chunkIndex]) {
					uidFetchSequenceListChunks[chunkIndex] = []
				}

				uidFetchSequenceListChunks[chunkIndex].push(uidFetchSequenceList)

				return uidFetchSequenceListChunks
			},
			[],
		)

		const uidFetchSequenceStrings = uidFetchSequenceChunks.map((uidFetchSequenceChunk) => {
			return uidFetchSequenceChunk.reduce<string>((uidFetchSequenceString, uidFetchSequence, index) => {
				if (uidFetchSequence.fromUid === uidFetchSequence.toUid) {
					return uidFetchSequenceString + `${uidFetchSequence.fromUid}` + (index === uidFetchSequenceChunk.length - 1 ? "" : ",")
				} else {
					return (
						uidFetchSequenceString +
						`${uidFetchSequence.fromUid}:${uidFetchSequence.toUid}` +
						(index === uidFetchSequenceChunk.length - 1 ? "" : ",")
					)
				}
			}, "")
		})

		return uidFetchSequenceStrings
	}
}

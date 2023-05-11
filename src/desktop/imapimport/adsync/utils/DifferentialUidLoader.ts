import { ImapMailIds } from "../ImapSyncState.js"
import { AdSyncEventListener, AdSyncEventType } from "../AdSyncEventListener.js"
import { ImapMailbox } from "../imapmail/ImapMailbox.js"
import { ImapFlow } from "imapflow"

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

export const UID_FETCH_REQUEST_WAIT_TIME = 5000 // in ms

export interface UidFetchRequest {
	uidFetchSequenceString: string
	fetchRequestType: UidFetchRequestType
	usedDownloadBatchSize?: number
}

export type SeenUids = number[]
export type DeletedUids = number[]

export class DifferentialUidLoader {
	private uidFetchRequestQueue: UidFetchRequest[] = []

	private uidCreateQueue: number[] = []
	private uidUpdateQueue: number[] = []

	private uidDiffInProgress: boolean = false

	private readonly imapClient: ImapFlow
	private readonly adSyncEventListener: AdSyncEventListener
	private readonly openedImapMailbox: ImapMailbox
	private readonly importedUidToMailIdsMap: Map<number, ImapMailIds>
	private readonly isEnableImapQresync: boolean
	private readonly emitAdSyncEventTypes: Set<AdSyncEventType>

	constructor(
		imapClient: ImapFlow,
		adSyncEventListener: AdSyncEventListener,
		openedImapMailbox: ImapMailbox,
		importedUidToMailIdsMap: Map<number, ImapMailIds>,
		isEnableImapQresync: boolean,
		emitAdSyncEventTypes: Set<AdSyncEventType>,
	) {
		this.imapClient = imapClient
		this.adSyncEventListener = adSyncEventListener
		this.openedImapMailbox = openedImapMailbox
		this.importedUidToMailIdsMap = importedUidToMailIdsMap
		this.isEnableImapQresync = isEnableImapQresync
		this.emitAdSyncEventTypes = emitAdSyncEventTypes
	}

	async calculateUidDiff(lastFetchedMailSeq: number, downloadBatchSize: number, totalMessageCount: number | null): Promise<DeletedUids> {
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

		let seenUids = await this.calculateUidDiffInBatches(lastFetchedMailSeq + 1, downloadBatchSize, totalMessageCount)

		let deletedUids: number[] = []
		if (this.emitAdSyncEventTypes.has(AdSyncEventType.DELETE)) {
			deletedUids = [...this.importedUidToMailIdsMap.keys()].filter((uid) => {
				!seenUids.includes(uid)
			})
		}

		this.uidDiffInProgress = false
		return deletedUids
	}

	async calculateUidDiffInBatches(fromSeq: number, downloadBatchSize: number, totalMessageCount: number | null): Promise<SeenUids> {
		let seenUids: number[] = []

		let toSeq = fromSeq + downloadBatchSize
		let isFinalBatch = totalMessageCount == null || toSeq > totalMessageCount

		let fromSeqString = fromSeq.toString()
		let toSeqString = totalMessageCount == null ? "*" : isFinalBatch ? totalMessageCount.toString() : toSeq.toString()

		let mails = this.imapClient.fetch(`${fromSeqString}:${toSeqString}`, { uid: true }, {})

		// @ts-ignore
		for await (const mail of mails) {
			let uid = mail.uid
			seenUids.push(uid)

			if (this.importedUidToMailIdsMap.has(uid)) {
				this.uidUpdateQueue.push(uid)
			} else {
				this.uidCreateQueue.push(uid)
			}
		}

		if (!isFinalBatch) {
			seenUids.push(...(await this.calculateUidDiffInBatches(toSeq + 1, downloadBatchSize, totalMessageCount)))
		}

		return seenUids
	}

	async getNextUidFetchRequest(downloadBatchSize: number): Promise<UidFetchRequest | null> {
		let waitingUidFetchRequest = this.uidFetchRequestQueue.pop()
		if (waitingUidFetchRequest) {
			return waitingUidFetchRequest
		}

		let nextUidFetchRange: number[]
		let fetchRequestType: UidFetchRequestType

		if (this.emitAdSyncEventTypes.has(AdSyncEventType.CREATE) && this.uidCreateQueue.length != 0) {
			nextUidFetchRange = this.uidCreateQueue.splice(0, downloadBatchSize)
			fetchRequestType = UidFetchRequestType.CREATE
		} else if (this.emitAdSyncEventTypes.has(AdSyncEventType.UPDATE) && this.uidUpdateQueue.length != 0) {
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

		let uidFetchSequenceStrings = this.buildUidFetchSequenceStrings(nextUidFetchRange)
		let nextUidFetchSequenceRequests = uidFetchSequenceStrings.map((uidFetchSequenceString) => {
			return {
				uidFetchSequenceString: uidFetchSequenceString,
				fetchRequestType: fetchRequestType,
				usedDownloadBatchSize: downloadBatchSize,
			}
		})

		this.uidFetchRequestQueue.push(...nextUidFetchSequenceRequests)
		return this.uidFetchRequestQueue.pop() ?? null
	}

	private buildUidFetchSequenceStrings(uidsToFetch: number[]): string[] {
		let uidFetchSequenceList = uidsToFetch.reduce<UidFetchSequence[]>((uidFetchSequenceList, uid: number) => {
			let prevUidFetchSequence = uidFetchSequenceList.at(-1)

			if (prevUidFetchSequence && prevUidFetchSequence.toUid == uid - 1) {
				prevUidFetchSequence.toUid = uid
				uidFetchSequenceList[-1] = prevUidFetchSequence
			} else {
				let newUidFetchSequence = {
					fromUid: uid,
					toUid: uid,
				}
				uidFetchSequenceList.push(newUidFetchSequence)
			}
			return uidFetchSequenceList
		}, [])

		// We restrict the length of the uidFetchSequenceString to speed up IMAP server communication (we only allow 25 SequenceStrings per IMAP command)
		let perChunk = 25
		let uidFetchSequenceChunks = uidFetchSequenceList.reduce<UidFetchSequence[][]>(
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

		let uidFetchSequenceStrings = uidFetchSequenceChunks.map((uidFetchSequenceChunk) => {
			return uidFetchSequenceChunk.reduce<string>((uidFetchSequenceString, uidFetchSequence, index) => {
				if (uidFetchSequence.fromUid == uidFetchSequence.toUid) {
					return uidFetchSequenceString + `${uidFetchSequence.fromUid}` + (index == uidFetchSequenceChunk.length - 1 ? "" : ",")
				} else {
					return (
						uidFetchSequenceString +
						`${uidFetchSequence.fromUid}:${uidFetchSequence.toUid}` +
						(index == uidFetchSequenceChunk.length - 1 ? "" : ",")
					)
				}
			}, "")
		})

		return uidFetchSequenceStrings
	}
}

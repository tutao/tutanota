import { ArchiveDownloaderFacade, ArchiveDownloadRangeHeaders, SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { FetchImpl, toGlobalResponse } from "./net/NetAgent"
import { tagSqlValue } from "../../../app-kit/local-store/SqlValue"
import { first, isNotEmpty } from "@tutao/utils"
import { TaggedSqlValue } from "../../../app-kit/local-store/Types"

const TAG = "[DesktopArchiveDownloaderFacade]"

export class DesktopArchiveDownloaderFacade implements ArchiveDownloaderFacade {
	private activeRequests: Map<string, AbortController> = new Map()
	private storageForArchive: Map<string, ArchiveStorageHelper> = new Map()

	constructor(
		private readonly fetch: FetchImpl,
		private readonly sqlCipherFacade: SqlCipherFacade,
	) {}

	async abortDownloadAndStoreArchive(archiveId: string): Promise<void> {
		if (this.activeRequests.has(archiveId)) {
			this.activeRequests.get(archiveId)?.abort()
			await this.cleanState(archiveId)
			console.log(TAG, `Aborted storing archive ${archiveId}`)
		}
	}

	async downloadAndStoreArchive(
		sourceUrl: string,
		archiveId: string,
		archiveType: string,
		modelVersion: number,
		rangeHeader: ArchiveDownloadRangeHeaders | null,
	): Promise<void> {
		const abortController = new AbortController()
		this.activeRequests.set(archiveId, abortController)
		try {
			const headers: Dict = { Accept: "text/csv;charset=utf-8", "Content-Type": "application/json", "Cache-Control": "no-cache" }
			if (rangeHeader != null) {
				headers["Range"] = `rows=${rangeHeader.rangeStart}-`
				headers["Repr-Digest"] = `sha-256=:${rangeHeader.reprDigest}:`
			}

			console.log(TAG, `Downloading archive ${archiveId} starting from row ${rangeHeader?.rangeStart ?? 0}`)
			const { status, body } = toGlobalResponse(
				await this.fetch(sourceUrl, {
					method: "GET",
					headers,
					signal: abortController.signal,
				}),
			)

			console.log(TAG, `Received status code ${status} when downloading archive ${archiveId}`)
			if ([200, 206].includes(status) && body != null) {
				// status code 200 -> we received the full archive, instead of the partial one we wanted -> clear cache
				if (status === 200) {
					console.log(TAG, `Clearing cached blobs for archive ${archiveId}`)
					await this.sqlCipherFacade.run("DELETE FROM encrypted_blobs WHERE archiveId = ?", [tagSqlValue(archiveId)])
				}

				const decoder = new TextDecoder()
				const storage = new ArchiveStorageHelper(archiveId, archiveType, modelVersion, new URL(sourceUrl).hostname, this.sqlCipherFacade)
				this.storageForArchive.set(archiveId, storage)
				await storage.init()

				const startTime = new Date().getTime()
				console.log(TAG, `Started storing archive ${archiveId}`)

				let currentChunkString = ""
				let isParsingBlobs = false
				for await (const chunk of body) {
					currentChunkString += decoder.decode(chunk.buffer)
					const lines = currentChunkString.split("\n")
					// start of next chunk is incomplete last line of current chunk
					currentChunkString = first(lines.splice(-1)) ?? ""

					for (const line of lines) {
						if (!this.activeRequests.has(archiveId)) {
							return
						}

						if (!isParsingBlobs) {
							// skip the first line (header)
							isParsingBlobs = true
						} else {
							await storage.storeBlob(line)
						}
					}
				}

				// an empty response contains only one line (the header).
				// In such cases, lines will be empty with currentChunkString containing the header
				if (isParsingBlobs) {
					// last line is always appended to currentChunkString, and is only guaranteed to be complete when the entire body is received
					await storage.storeBlob(currentChunkString)
				}

				await storage.flushAndClose()

				const timeToStore = new Date().getTime() - startTime
				console.log(TAG, `Finished storing archive ${archiveId} (took ${timeToStore} ms)`)
			}
		} finally {
			await this.cleanState(archiveId)
		}
	}

	private async cleanState(archiveId: string) {
		this.activeRequests.delete(archiveId)
		await this.storageForArchive.get(archiveId)?.flushAndClose()
		this.storageForArchive.delete(archiveId)
		console.log(TAG, `Cleaned up state of archive ${archiveId}, kept the blobs.`)
	}
}

class ArchiveStorageHelper {
	private readonly archiveId: TaggedSqlValue
	private readonly archiveType: TaggedSqlValue
	private readonly modelVersion: TaggedSqlValue
	private readonly serverHostname: TaggedSqlValue

	constructor(
		_archiveId: string,
		_archiveType: string,
		_modelVersion: number,
		_serverHostname: string,
		private readonly sqlCipherFacade: SqlCipherFacade,
	) {
		this.archiveId = tagSqlValue(_archiveId)
		this.archiveType = tagSqlValue(_archiveType)
		this.modelVersion = tagSqlValue(_modelVersion)
		this.serverHostname = tagSqlValue(_serverHostname)
	}

	async init() {
		const query = "INSERT OR REPLACE INTO encrypted_blobs_metadata (archiveId, type, modelVersion, serverHostname) VALUES (?, ?, ?, ?)"
		const params: TaggedSqlValue[] = [this.archiveId, this.archiveType, this.modelVersion, this.serverHostname]
		await this.sqlCipherFacade.run(query, params)
	}

	// store when 8 mb of data reached
	private readonly CACHE_BUFFER_SIZE = 4 * 1024 * 1024
	private unstoredBytes = 0
	private blobs: StoreBlob[] = []
	private closed = false

	private parseLine(line: string): StoreBlob {
		const separatorIndex = line.indexOf(";")
		return { blobId: line.slice(0, separatorIndex), json: line.slice(separatorIndex + 1) }
	}

	async storeBlob(line: string) {
		if (this.closed) return

		this.unstoredBytes += line.length
		this.blobs.push(this.parseLine(line))

		if (this.unstoredBytes > this.CACHE_BUFFER_SIZE) {
			await this.store()
		}
	}

	async flushAndClose() {
		await this.store()
		this.closed = true
	}

	private async store() {
		if (!this.closed && isNotEmpty(this.blobs)) {
			const query =
				"INSERT OR REPLACE INTO encrypted_blobs (blobId, archiveId, data, type, modelVersion) VALUES (?, ?, ?, ?, ?)" +
				", (?, ?, ?, ?, ?)".repeat(this.blobs.length - 1)
			const params = Array(this.blobs.length)
				.fill(null)
				.flatMap((_, i) => [tagSqlValue(this.blobs[i].blobId), this.archiveId, tagSqlValue(this.blobs[i].json), this.archiveType, this.modelVersion])

			await this.sqlCipherFacade.run(query, params)
		}

		this.unstoredBytes = 0
		this.blobs = []
	}
}

interface StoreBlob {
	blobId: string
	json: string
}

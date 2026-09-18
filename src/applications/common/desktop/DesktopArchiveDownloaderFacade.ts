import { ArchiveDownloaderFacade, SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { FetchImpl, toGlobalResponse } from "./net/NetAgent"
import { tagSqlValue } from "../../../app-kit/local-store/SqlValue"
import { first, isNotEmpty, lastThrow } from "@tutao/utils"
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
			console.log(TAG, `Aborted storing archive with id ${archiveId}`)
		}
	}

	async downloadAndStoreArchive(sourceUrl: string, archiveId: string, typeref: string, modelVersion: number): Promise<void> {
		const abortController = new AbortController()
		this.activeRequests.set(archiveId, abortController)
		try {
			console.log(TAG, `Downloading archive with id ${archiveId}`)
			const { status, body } = toGlobalResponse(
				await this.fetch(sourceUrl, {
					method: "GET",
					headers: { Accept: "text/csv;charset=utf-8", "Content-Type": "application/json", "Cache-Control": "no-cache" },
					signal: abortController.signal,
				}),
			)

			if (status === 200 && body != null) {
				const decoder = new TextDecoder()
				const storage = new ArchiveStorageHelper(archiveId, typeref, modelVersion, this.sqlCipherFacade)
				this.storageForArchive.set(archiveId, storage)

				const startTime = new Date().getTime()
				console.log(TAG, `Started storing archive with id ${archiveId}`)

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
				console.log(TAG, `Finished storing archive with id ${archiveId} (took ${timeToStore} ms)`)
			} else {
				console.log(TAG, `Received status code ${status} when trying to download archive with id ${archiveId}, aborting.`)
			}
		} finally {
			await this.cleanState(archiveId)
		}
	}

	private async cleanState(archiveId: string) {
		this.activeRequests.delete(archiveId)
		await this.storageForArchive.get(archiveId)?.flushAndClose()
		this.storageForArchive.delete(archiveId)
		console.log(TAG, `Cleaned up state of archive with id ${archiveId}, kept the blobs.`)
	}
}

class ArchiveStorageHelper {
	private readonly archiveId: TaggedSqlValue
	private readonly typeref: TaggedSqlValue
	private readonly modelVersion: TaggedSqlValue

	constructor(
		_archiveId: string,
		_typeref: string,
		_modelVersion: number,
		private readonly sqlCipherFacade: SqlCipherFacade,
	) {
		this.archiveId = tagSqlValue(_archiveId)
		this.typeref = tagSqlValue(_typeref)
		this.modelVersion = tagSqlValue(_modelVersion)
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
			{
				const query =
					"INSERT OR REPLACE INTO encrypted_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)" +
					", (?, ?, ?, ?, ?)".repeat(this.blobs.length - 1)
				const params = Array(this.blobs.length)
					.fill(null)
					.flatMap((_, i) => [tagSqlValue(this.blobs[i].blobId), this.archiveId, tagSqlValue(this.blobs[i].json), this.typeref, this.modelVersion])

				await this.sqlCipherFacade.run(query, params)
			}
			{
				const query = "INSERT OR REPLACE INTO encrypted_blobs_metadata (archiveId, loadedMaxBlobId, typeref, modelVersion) VALUES (?, ?, ?, ?)"
				const params: TaggedSqlValue[] = [this.archiveId, tagSqlValue(lastThrow(this.blobs).blobId), this.typeref, this.modelVersion]

				await this.sqlCipherFacade.run(query, params)
			}
		}

		this.unstoredBytes = 0
		this.blobs = []
	}
}

interface StoreBlob {
	blobId: string
	json: string
}

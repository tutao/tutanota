import { ArchiveDownloaderFacade, SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
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
			console.log(TAG, `Aborted storing archive with id ${archiveId}`)
		}
	}

	async clearStoredArchives(): Promise<void> {
		await this.sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", [])
		await this.sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", [])
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
				let skippedHeader = false
				for await (const chunk of body) {
					currentChunkString += decoder.decode(chunk.buffer)
					const lines = currentChunkString.split("\n")
					// start of next chunk is incomplete last line of current chunk
					currentChunkString = first(lines.splice(-1)) ?? ""

					for (const line of lines) {
						if (!skippedHeader) {
							skippedHeader = true
							continue
						} else if (!this.activeRequests.has(archiveId)) {
							return
						}

						// do the parsing
						const [blobId, json] = line.split(";", 2)
						await storage.storeBlob(blobId, json)
					}
				}

				// last line is just appended to currentChunkString, so after the last chunk came in this will just have another blob
				const [blobId, json] = currentChunkString.split(";", 2)
				await storage.storeBlob(blobId, json)

				await storage.success()

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
		this.storageForArchive.get(archiveId)?.flushAndClose()
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

	async storeBlob(blobId: string, bytesToStore: string) {
		if (this.closed) return

		this.blobs.push({ blobId, bytesToStore })
		this.unstoredBytes += bytesToStore.length

		if (this.unstoredBytes > this.CACHE_BUFFER_SIZE) {
			await this.store()
		}
	}

	async flushAndClose() {
		if (isNotEmpty(this.blobs)) {
			await this.store()
		}
		this.closed = true
	}

	async success() {
		await this.flushAndClose()
		await this.sqlCipherFacade.run("INSERT OR REPLACE INTO fully_persisted_mail_details_archives VALUES (?)", [this.archiveId])
	}

	private async store() {
		if (!this.closed) {
			const query =
				"INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)" +
				", (?, ?, ?, ?, ?)".repeat(this.blobs.length - 1)
			const params = Array(this.blobs.length)
				.fill(null)
				.flatMap((_, i) => [
					tagSqlValue(this.blobs[i].blobId),
					this.archiveId,
					tagSqlValue(this.blobs[i].bytesToStore),
					this.typeref,
					this.modelVersion,
				])

			await this.sqlCipherFacade.run(query, params)
		}

		this.unstoredBytes = 0
		this.blobs = []
	}
}

interface StoreBlob {
	blobId: string
	bytesToStore: string
}

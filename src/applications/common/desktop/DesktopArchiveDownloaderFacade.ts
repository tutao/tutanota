import { ArchiveDownloaderFacade, SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { FetchImpl, toGlobalResponse } from "./net/NetAgent"
import { log } from "./DesktopLog"
import { tagSqlValue } from "../../../app-kit/local-store/SqlValue"
import { first, isNotEmpty } from "@tutao/utils"

const TAG = "[DesktopArchiveDownloaderFacade]"

export class DesktopArchiveDownloaderFacade implements ArchiveDownloaderFacade {
	private activeRequests: Map<string, AbortController> = new Map()

	constructor(
		private readonly fetch: FetchImpl,
		private readonly sqlCipherFacade: SqlCipherFacade,
	) {}

	async abortDownloadAndStoreArchive(archiveId: string): Promise<void> {
		for (const key of this.activeRequests.keys()) {
			this.activeRequests.get(key)?.abort()
			this.activeRequests.delete(key)
		}
		// TODO clear sql table
		return Promise.resolve(undefined)
	}

	async clearStoredArchives(): Promise<void> {
		return Promise.resolve(undefined)
	}

	async downloadAndStoreArchive(sourceUrl: string, archiveId: string, typeref: string, modelVersion: number): Promise<void> {
		const abortController = new AbortController()
		this.activeRequests.set(archiveId, abortController)
		try {
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

				let currentChunkString = ""
				let skippedHeader = false
				for await (const chunk of body) {
					currentChunkString += decoder.decode(chunk.buffer)
					const lines = currentChunkString.split("\n")
					const incompleteLastLine = first(lines.splice(-1)) ?? ""
					currentChunkString = incompleteLastLine

					for (const line of lines) {
						if (!skippedHeader) {
							skippedHeader = true
							continue
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
			}
			log.info(TAG, "Download finished")
		} finally {
			this.activeRequests.delete(archiveId)
		}
	}
}
interface StoreBlob {
	blobId: string
	bytesToStore: string
}

class ArchiveStorageHelper {
	constructor(
		private readonly archiveId: string,
		private readonly typeref: string,
		private readonly modelVersion: number,
		private readonly sqlCipherFacade: SqlCipherFacade,
	) {}
	// store when 8 mb of data reached
	private readonly BYTE_COUNT_LIMIT = 4 * 1024 * 1024
	private byteCountCurrent = 0
	private blobs: StoreBlob[] = []
	private closed = false

	async storeBlob(blobId: string, bytesToStore: string) {
		if (this.closed) return

		this.blobs.push({ blobId, bytesToStore })
		this.byteCountCurrent += bytesToStore.length * 2

		if (this.byteCountCurrent > this.BYTE_COUNT_LIMIT) {
			await this.store()
			this.byteCountCurrent = 0
		}
	}

	async close() {
		if (isNotEmpty(this.blobs)) {
			await this.store()
		}
		this.closed = true
	}

	async success() {
		await this.sqlCipherFacade.run("INSERT OR REPLACE INTO fully_persisted_mail_details_archives VALUES (?)", [tagSqlValue(this.archiveId)])
	}

	private async store() {
		const archiveId = tagSqlValue(this.archiveId)
		const typeref = tagSqlValue(this.typeref)
		const modelVersion = tagSqlValue(this.modelVersion)

		if (!this.closed) {
			const query =
				"INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES " +
				"(?, ?, ?, ?, ?), ".repeat(this.blobs.length - 1) +
				"(?, ?, ?, ?, ?)"
			const params = Array(this.blobs.length * 5)
				.fill(null)
				.map((_, i) => {
					switch (i % 5) {
						case 0:
							return tagSqlValue(this.blobs[i / 5].blobId)
						case 1:
							return archiveId
						case 2:
							return tagSqlValue(this.blobs[i / 5].bytesToStore)
						case 3:
							return typeref
						case 4:
							return modelVersion
					}
				})

			await this.sqlCipherFacade.run(query, params)
		}

		this.byteCountCurrent = 0
		this.blobs = []
	}
}

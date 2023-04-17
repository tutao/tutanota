import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { Worker } from "node:worker_threads"
import path from "node:path"
import { MessageDispatcher, NodeWorkerTransport, Request } from "../../api/common/MessageDispatcher.js"
import { SqlCipherCommand } from "./sqlworker.js"

const TAG = "[WorkerSqlCipher]"

/** impl for SqlCipherFacade that passes any requests to a node worker thread that's running the sqlite db for the given user id
 * this code is running in the main thread of the node process. */
export class WorkerSqlCipher implements SqlCipherFacade {
	private readonly dispatcher: MessageDispatcher<SqlCipherCommand, never>

	constructor(private readonly nativeBindingPath: string, private readonly dbPath: string, private readonly integrityCheck: boolean) {
		console.log("new sqlcipherworker")
		const worker = new Worker(path.join(__dirname, "db", "sqlworker.js"), {
			workerData: { nativeBindingPath, dbPath, integrityCheck },
		})
		this.dispatcher = new MessageDispatcher<SqlCipherCommand, never>(new NodeWorkerTransport<SqlCipherCommand, never>(worker), {})
	}

	async all(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<ReadonlyArray<Record<string, TaggedSqlValue>>> {
		return this.dispatcher.postRequest(new Request("all", [query, params]))
	}

	async closeDb(): Promise<void> {
		return this.dispatcher.postRequest(new Request("closeDb", []))
	}

	async deleteDb(userId: string): Promise<void> {
		return this.dispatcher.postRequest(new Request("deleteDb", []))
	}

	async get(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<Record<string, TaggedSqlValue> | null> {
		return this.dispatcher.postRequest(new Request("get", [query, params]))
	}

	async lockRangesDbAccess(listId: string): Promise<void> {
		return this.dispatcher.postRequest(new Request("lockRangesDbAccess", [listId]))
	}

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		return this.dispatcher.postRequest(new Request("openDb", [userId, dbKey]))
	}

	async run(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<void> {
		return this.dispatcher.postRequest(new Request("run", [query, params]))
	}

	async unlockRangesDbAccess(listId: string): Promise<void> {
		return this.dispatcher.postRequest(new Request("unlockRangesDbAccess", [listId]))
	}
}

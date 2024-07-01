import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { Worker } from "node:worker_threads"
import path from "node:path"
import { MessageDispatcher, Request } from "../../api/common/threading/MessageDispatcher.js"
import { SqlCipherCommandNames, WorkerLogCommandNames } from "../sqlworker.js"
import { NodeWorkerTransport } from "../../api/common/threading/NodeWorkerTransport.js"

const TAG = "[WorkerSqlCipher]"

/** impl for SqlCipherFacade that passes any requests to a node worker thread that's running the sqlite db for the given user id
 * this code is running in the main thread of the node process. */
export class WorkerSqlCipher implements SqlCipherFacade {
	private readonly dispatcher: MessageDispatcher<SqlCipherCommandNames, WorkerLogCommandNames>
	private readonly worker: Worker

	constructor(private readonly nativeBindingPath: string, private readonly dbPath: string, private readonly integrityCheck: boolean) {
		// this is not ../sqlworker.js because this file is bundled into DesktopMain.js in the dev build
		// and the prod build dumps everything into the same dir anyway.
		const worker = new Worker(path.join(__dirname, "./sqlworker.js"), {
			workerData: { nativeBindingPath, dbPath, integrityCheck },
		}).on("error", (error) => {
			// this is where uncaught errors in the worker end up.
			console.log(TAG, `error in sqlcipher-worker-${worker.threadId}:`, error)
			worker.unref()
			throw error
		})
		console.log(TAG, `started sqlcipher-worker-${worker.threadId}`)
		this.dispatcher = new MessageDispatcher<SqlCipherCommandNames, WorkerLogCommandNames>(
			new NodeWorkerTransport<SqlCipherCommandNames, never>(worker),
			{
				info: async (msg: Request<"info">) => console.info(`[sqlcipher-worker-${worker.threadId}]`, ...msg.args),
				log: async (msg: Request<"log">) => console.log(`[sqlcipher-worker-${worker.threadId}]`, ...msg.args),
				error: async (msg: Request<"error">) => console.error(`[sqlcipher-worker-${worker.threadId}]`, ...msg.args),
				warn: async (msg: Request<"warn">) => console.warn(`[sqlcipher-worker-${worker.threadId}]`, ...msg.args),
				trace: async (msg: Request<"trace">) => console.trace(`[sqlcipher-worker-${worker.threadId}]`, ...msg.args),
			},
			"node-nodeworker",
		)

		this.worker = worker
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

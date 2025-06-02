import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue } from "../../api/worker/offline/SqlValue.js"
import { Worker } from "node:worker_threads"
import { MessageDispatcher, Request } from "../../api/common/threading/MessageDispatcher.js"
import { SqlCipherCommandNames, WorkerLogCommandNames } from "../sqlworker.js"
import { NodeWorkerTransport } from "../../api/common/threading/NodeWorkerTransport.js"
import { createRequire } from "node:module"

const TAG = "[WorkerSqlCipher]"

/** impl for SqlCipherFacade that passes any requests to a node worker thread that's running the sqlite db for the given user id
 * this code is running in the main thread of the node process. */
export class WorkerSqlCipher implements SqlCipherFacade {
	private readonly dispatcher: MessageDispatcher<SqlCipherCommandNames, WorkerLogCommandNames>
	private readonly worker: Worker

	constructor(dbPath: string, integrityCheck: boolean) {
		// All entry points are bundled into the same directory
		const require = createRequire(import.meta.url)
		const worker = new Worker(require.resolve("./sqlworker.js"), {
			workerData: { dbPath, integrityCheck },
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

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		return this.dispatcher.postRequest(new Request("openDb", [userId, dbKey]))
	}

	async run(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<void> {
		return this.dispatcher.postRequest(new Request("run", [query, params]))
	}

	tokenize(query: string): Promise<ReadonlyArray<string>> {
		return this.dispatcher.postRequest(new Request("tokenize", [query]))
	}
}

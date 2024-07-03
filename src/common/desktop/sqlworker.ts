/**
 * entry point to the sqlite worker threads. one is created for each user's offline database.
 * it's possible for multiple windows to access the same sqlite database through the same thread.
 * it must be ensured that there is never more than one thread accessing the same database.
 *
 * its purpose is
 * * to trap console.log calls when it is created
 * * then create an instance of DesktopSqlCipher
 * * then wait for commands, pass them to the DesktopSqlCihper and return the results
 *
 * trapping the console.log is necessary for the output to be spliced into our logging system. using
 * the default console.log from a worker writes directly to stdout.
 * */
import { parentPort, workerData } from "node:worker_threads"
import { DesktopSqlCipher } from "./db/DesktopSqlCipher.js"
import { Command, MessageDispatcher, Request } from "../api/common/threading/MessageDispatcher.js"
import { SqlCipherFacade } from "../native/common/generatedipc/SqlCipherFacade.js"
import { NodeWorkerTransport } from "../api/common/threading/NodeWorkerTransport.js"

/** make this generic over all possible facades? The generic parameter needs some constraint to not expand this to any */
export type SqlCipherCommandNames = keyof SqlCipherFacade
type SqlCipherCommandObject = { [K in SqlCipherCommandNames]: Command<K> }

export type WorkerLogCommandNames = "log" | "info" | "error" | "warn" | "trace"

if (parentPort != null) {
	try {
		const sqlCipherFacade = new DesktopSqlCipher(workerData.nativeBindingPath, workerData.dbPath, workerData.integrityCheck)
		const commands: SqlCipherCommandObject = {
			all: (msg: Request<"all">) => sqlCipherFacade.all(msg.args[0], msg.args[1]),
			closeDb: async () => {
				await sqlCipherFacade.closeDb()
				// this lets the thread exit once the port is the only thing on the event loop
				parentPort?.unref()
			},
			deleteDb: (msg: Request<"deleteDb">) => sqlCipherFacade.deleteDb(msg.args[0]),
			get: (msg: Request<"get">) => sqlCipherFacade.get(msg.args[0], msg.args[1]),
			lockRangesDbAccess: (msg: Request<"lockRangesDbAccess">) => sqlCipherFacade.lockRangesDbAccess(msg.args[0]),
			openDb: (msg: Request<"openDb">) => sqlCipherFacade.openDb(msg.args[0], msg.args[1]),
			run: (msg: Request<"run">) => sqlCipherFacade.run(msg.args[0], msg.args[1]),
			unlockRangesDbAccess: (msg: Request<"unlockRangesDbAccess">) => sqlCipherFacade.unlockRangesDbAccess(msg.args[0]),
		}

		const workerTransport = new MessageDispatcher(
			new NodeWorkerTransport<WorkerLogCommandNames, SqlCipherCommandNames>(parentPort),
			commands,
			"nodeworker-node",
		)

		;(console as any).info = (...args: any[]) => workerTransport.postRequest(new Request("info", args))
		;(console as any).log = (...args: any[]) => workerTransport.postRequest(new Request("log", args))
		;(console as any).error = (...args: any[]) => workerTransport.postRequest(new Request("error", args))
		;(console as any).warn = (...args: any[]) => workerTransport.postRequest(new Request("warn", args))
		;(console as any).trace = (...args: any[]) => workerTransport.postRequest(new Request("trace", args))
		console.log("set up sql cipher done")
	} catch (e) {
		parentPort.unref()
	}
} else {
	// if there's no parent port, there's nothing we can do really
	process.exit(1)
}

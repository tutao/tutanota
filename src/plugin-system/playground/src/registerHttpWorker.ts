import { utilityProcess } from "electron"
import path from "node:path"
import UtilityProcess = Electron.UtilityProcess
import { fileURLToPath } from "node:url"
import { createServer } from "node:http"
import { MailService } from "./gen/proto/v1/worker_rpc_pb.js"
import { connectNodeAdapter } from "@connectrpc/connect-node"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function registerHttpWorker() {
	const worker = utilityProcess.fork(path.join(__dirname, "worker.js"))

	initializeWorker(worker)
	onExit(worker)

	startHttpServer(worker)
}

function initializeWorker(worker: UtilityProcess) {
	console.log("Hello World")
}

function onExit(worker: UtilityProcess) {
	worker.on("exit", (code) => {
		console.log("Worker exited:", code)
	})
}

function startHttpServer(worker: UtilityProcess) {
	const server = createServer(
		connectNodeAdapter({
			routes: (router) => {
				router.service(MailService, {
					async getMail(req) {
						console.log("GetMail:", req.id)

						return {
							mail: {
								recipient: "user@example.com",
								subject: "Hello from the server",
								body: `Requested mail with ID: ${req.id}`,
							},
						}
					},
				})
			},
		}),
	)

	const port = 55556
	const address = "127.0.0.1"
	const url = `http://${address}:${port}`
	server.listen(port, address, () => {
		console.log(`Connect server listening on ${url}`)
	})

	worker.postMessage({
		type: "server-ready",
		url,
	})
}
// gRPC/ connectrpc does not work because communication between plugin and host is bidirectional

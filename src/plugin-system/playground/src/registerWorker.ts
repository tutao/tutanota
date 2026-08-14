import { utilityProcess } from "electron"
import path from "node:path"
import { create, fromBinary, toBinary } from "@bufbuild/protobuf"
import UtilityProcess = Electron.UtilityProcess
import { InitializeRequestSchema, WorkerRequestSchema, WorkerResponseSchema } from "./gen/proto/v1/worker_pb.js"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function registerWorker() {
	const worker = utilityProcess.fork(path.join(__dirname, "worker.js"))

	worker.on("message", (data) => {
		const response = fromBinary(WorkerResponseSchema, data)
		console.log("Response:", response.payload.case)
	})

	onExit(worker)
	initializeWorker(worker)
}

function initializeWorker(worker: UtilityProcess) {
	const request = create(WorkerRequestSchema, {
		payload: {
			case: "initialize",
			value: create(InitializeRequestSchema),
		},
	})

	worker.postMessage(toBinary(WorkerRequestSchema, request))
}

function onExit(worker: UtilityProcess) {
	worker.on("exit", (code) => {
		console.log("Worker exited:", code)
	})
}

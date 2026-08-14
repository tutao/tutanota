import { create, fromBinary, toBinary } from "@bufbuild/protobuf"
import {
	ButtonClickRequest,
	ButtonClickRequestSchema,
	CalculateRequest,
	InitializeRequest,
	InitializeResponseSchema,
	Status,
	WorkerRequest,
	WorkerRequestSchema,
	WorkerResponseSchema,
} from "./gen/proto/v1/worker_pb.js"

process.parentPort.on("message", (event) => {
	const request = fromBinary(WorkerRequestSchema, event.data)
	handleRequest(request)
})

function handleRequest(request: WorkerRequest) {
	const payloadValue = request.payload.value
	switch (request.payload.case) {
		case "initialize":
			return handleInitialize(payloadValue as InitializeRequest)
		case "calculate":
			return handleCalculate(payloadValue as CalculateRequest)
		case "buttonClick":
			return handleButtonClick(payloadValue as ButtonClickRequest)
		default:
			throw new Error(`Unexpected value: ${request.payload.case}`)
	}
}

function handleInitialize(data: InitializeRequest) {
	const ack = create(WorkerResponseSchema, {
		payload: {
			case: "initialize",
			value: create(InitializeResponseSchema, {
				status: Status.OK,
				error: "",
			}),
		},
	})
	process.parentPort.postMessage(toBinary(WorkerResponseSchema, ack))

	const request = create(WorkerRequestSchema, {
		payload: {
			case: "buttonClick",
			value: create(ButtonClickRequestSchema, {
				id: 1,
			}),
		},
	})
	process.parentPort.postMessage(toBinary(WorkerResponseSchema, request))
}

function handleCalculate(data: CalculateRequest) {
	console.log(data)
}

function handleButtonClick(data: ButtonClickRequest) {
	console.log(data)
}

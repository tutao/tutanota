import { createClient } from "@connectrpc/connect"
import { createConnectTransport } from "@connectrpc/connect-web"
import { MailService } from "./gen/proto/v1/worker_rpc_pb.js"

process.parentPort.on("message", (event) => {
	const message = event.data

	if (message.type === "server-ready") {
		console.log("Server is ready:", message.url)

		startClient(message.url).then()
	}
})

async function startClient(baseUrl: string) {
	const transport = createConnectTransport({
		baseUrl,
	})
	const client = createClient(MailService, transport)
	console.log("Created Client.")
	console.log("Sending GetMail request...")

	const response = await client.getMail({
		id: "0",
	})

	console.log("Received Subject: " + response.mail?.subject)
}

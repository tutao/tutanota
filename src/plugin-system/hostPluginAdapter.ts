import { RpcTarget } from "capnweb"
import { IHostApi, Mail } from "./IHostApi.js"

export class HostApi extends RpcTarget implements IHostApi {
	getMail(id: string): Promise<Mail> {
		return Promise.resolve({
			id: id,
			from: "test@test.test",
			to: ["test2@test.test"],
			cc: [],
			bcc: [],
			subject: "Test Subject",
			body: "Test Body",
			sentAt: new Date(),
			attachments: [],
			isRead: true,
		})
	}
}

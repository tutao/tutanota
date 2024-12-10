import { DesktopConfig } from "../config/DesktopConfig.js"
import { DesktopConfigKey } from "../config/ConfigKeys.js"

export type MailboxExportState =
	| {
			type: "running"
			userId: Id
			mailboxId: Id
			exportDirectoryPath: string
			mailBagId: Id
			mailId: Id
			exportedMails: number
	  }
	| {
			type: "finished"
			userId: Id
			mailboxId: Id
			exportDirectoryPath: string
	  }
	| {
			type: "locked"
			userId: Id
	  }

export class MailboxExportPersistence {
	constructor(private readonly conf: DesktopConfig) {}

	async getStateForUser(userId: Id): Promise<MailboxExportState | null> {
		return (await this.getMap())[userId]
	}

	async setStateForUser(state: MailboxExportState) {
		const map = await this.getMap()
		map[state.userId] = state
		await this.conf.setVar(DesktopConfigKey.mailboxExportState, map)
	}

	async clearStateForUser(userId: Id) {
		const map = await this.getMap()
		delete map[userId]
		await this.conf.setVar(DesktopConfigKey.mailboxExportState, map)
	}

	private async getMap(): Promise<Record<Id, MailboxExportState>> {
		return await this.conf.getVar(DesktopConfigKey.mailboxExportState)
	}
}

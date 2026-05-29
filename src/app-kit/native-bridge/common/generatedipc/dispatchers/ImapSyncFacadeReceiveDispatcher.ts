/* generated file, don't edit. */

import { ImapMailbox } from "../types/ImapMailbox"
import { ImapSyncEventType } from "../types/ImapSyncEventType"
import { ImapMailboxStatus } from "../types/ImapMailboxStatus"
import { ImapMail } from "../types/ImapMail"
import { ImapError } from "../types/ImapError"
import { ImapSyncFacade } from "@tutao/native-bridge/generatedIpc/types"

export class ImapSyncFacadeReceiveDispatcher {
	constructor(private readonly facade: ImapSyncFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "onMailbox": {
				const accountSyncId: IdTuple = arg[0]
				const imapMailbox: ImapMailbox = arg[1]
				const eventType: ImapSyncEventType = arg[2]
				return this.facade.onMailbox(accountSyncId, imapMailbox, eventType)
			}
			case "onMailboxStatus": {
				const accountSyncId: IdTuple = arg[0]
				const imapMailboxStatus: ImapMailboxStatus = arg[1]
				return this.facade.onMailboxStatus(accountSyncId, imapMailboxStatus)
			}
			case "onMultipleMails": {
				const accountSyncId: IdTuple = arg[0]
				const imapMails: ReadonlyArray<ImapMail> = arg[1]
				const eventType: ImapSyncEventType = arg[2]
				return this.facade.onMultipleMails(accountSyncId, imapMails, eventType)
			}
			case "onPostpone": {
				const accountSyncId: IdTuple = arg[0]
				const postponedUntil: number = arg[1]
				return this.facade.onPostpone(accountSyncId, postponedUntil)
			}
			case "onFinish": {
				const accountSyncId: IdTuple = arg[0]
				return this.facade.onFinish(accountSyncId)
			}
			case "onError": {
				const accountSyncId: IdTuple = arg[0]
				const imapError: ImapError = arg[1]
				return this.facade.onError(accountSyncId, imapError)
			}
		}
	}
}

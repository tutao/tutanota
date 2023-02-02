/* generated file, don't edit. */

import { ImapMailbox } from "./ImapMailbox.js"
import { AdSyncEventType } from "./AdSyncEventType.js"
import { ImapMailboxStatus } from "./ImapMailboxStatus.js"
import { ImapMail } from "./ImapMail.js"
import { ImapError } from "./ImapError.js"
import { ImapImportFacade } from "./ImapImportFacade.js"

export class ImapImportFacadeReceiveDispatcher {
	constructor(private readonly facade: ImapImportFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "onMailbox": {
				const imapMailbox: ImapMailbox = arg[0]
				const eventType: AdSyncEventType = arg[1]
				return this.facade.onMailbox(imapMailbox, eventType)
			}
			case "onMailboxStatus": {
				const imapMailboxStatus: ImapMailboxStatus = arg[0]
				return this.facade.onMailboxStatus(imapMailboxStatus)
			}
			case "onMail": {
				const imapMail: ImapMail = arg[0]
				const eventType: AdSyncEventType = arg[1]
				return this.facade.onMail(imapMail, eventType)
			}
			case "onPostpone": {
				const postponedUntil: Date = arg[0]
				return this.facade.onPostpone(postponedUntil)
			}
			case "onFinish": {
				const downloadedQuota: number = arg[0]
				return this.facade.onFinish(downloadedQuota)
			}
			case "onError": {
				const imapError: ImapError = arg[0]
				return this.facade.onError(imapError)
			}
		}
	}
}

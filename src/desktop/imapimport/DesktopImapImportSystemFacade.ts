import { ImapImportSystemFacade } from "../../native/common/generatedipc/ImapImportSystemFacade.js"
import { ImapSyncState } from "./adsync/ImapSyncState.js"
import { ImapAdSync } from "./adsync/ImapAdSync.js"
import { AdSyncEventListener, AdSyncEventType } from "./adsync/AdSyncEventListener.js"
import { ImapError } from "./adsync/imapmail/ImapError.js"
import { ImapMail } from "./adsync/imapmail/ImapMail.js"
import { ImapMailbox, ImapMailboxStatus } from "./adsync/imapmail/ImapMailbox.js"
import { ApplicationWindow } from "../ApplicationWindow.js"

export class DesktopImapImportSystemFacade implements ImapImportSystemFacade, AdSyncEventListener {
	constructor(private readonly win: ApplicationWindow) {}

	private imapAdSync?: ImapAdSync

	startImport(imapSyncState: ImapSyncState): Promise<void> {
		if (this.imapAdSync === undefined) {
			this.imapAdSync = new ImapAdSync(this)
		}
		this.imapAdSync?.startAdSync(imapSyncState)
		return Promise.resolve()
	}

	stopImport(): Promise<void> {
		this.imapAdSync?.stopAdSync()
		return Promise.resolve()
	}

	onError(error: ImapError): void {
		this.win.imapImportFacade.onError(error)
	}

	onFinish(downloadedQuota: number): void {
		this.win.imapImportFacade.onFinish(downloadedQuota)
	}

	onMail(mail: ImapMail, eventType: AdSyncEventType): void {
		this.win.imapImportFacade.onMail(mail, eventType)
	}

	onMailbox(mailbox: ImapMailbox, eventType: AdSyncEventType): void {
		this.win.imapImportFacade.onMailbox(mailbox, eventType)
	}

	onMailboxStatus(mailboxStatus: ImapMailboxStatus): void {
		this.win.imapImportFacade.onMailboxStatus(mailboxStatus)
	}

	onPostpone(postponedUntil: Date): void {
		this.win.imapImportFacade.onPostpone(postponedUntil)
	}
}

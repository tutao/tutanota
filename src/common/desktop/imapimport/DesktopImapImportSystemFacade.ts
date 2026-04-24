import { ImapImportSystemFacade } from "../../native/common/generatedipc/ImapImportSystemFacade.js"
import { ImapSyncState } from "./adsync/ImapSyncState.js"
import { ImapAdSync } from "./adsync/ImapAdSync.js"
import { AdSyncEventListener, AdSyncEventType } from "./adsync/AdSyncEventListener.js"
import { ImapError } from "./adsync/imapmail/ImapError.js"
import { ImapMail } from "../../api/common/utils/imapImportUtils/ImapMail.js"
import { ImapMailbox, ImapMailboxStatus } from "../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ApplicationWindow } from "../ApplicationWindow.js"

export class DesktopImapImportSystemFacade implements ImapImportSystemFacade, AdSyncEventListener {
	constructor(private readonly win: ApplicationWindow) {}

	private imapAdSync?: ImapAdSync

	async startImport(imapSyncState: ImapSyncState): Promise<ImapError | null> {
		if (this.imapAdSync === undefined) {
			this.imapAdSync = new ImapAdSync(this)
		}
		const startResult = await this.imapAdSync?.startAdSync(imapSyncState).then((result) => result)
		return Promise.resolve(startResult)
	}

	stopImport(): Promise<void> {
		this.imapAdSync?.stopAdSync()
		return Promise.resolve()
	}

	async onError(error: ImapError): Promise<void> {
		this.win.imapImportFacade.onError(error)
	}

	async onFinish(downloadedQuota: number): Promise<void> {
		this.win.imapImportFacade.onFinish(downloadedQuota)
	}

	async onMail(mail: ImapMail, eventType: AdSyncEventType): Promise<void> {
		this.win.imapImportFacade.onMail(mail, eventType)
	}

	async onMultipleMails(mails: ImapMail[], eventType: AdSyncEventType): Promise<void> {
		this.win.imapImportFacade.onMultipleMails(mails, eventType)
	}

	async onMailbox(mailbox: ImapMailbox, eventType: AdSyncEventType): Promise<void> {
		this.win.imapImportFacade.onMailbox(mailbox, eventType)
	}

	async onMailboxStatus(mailboxStatus: ImapMailboxStatus): Promise<void> {
		this.win.imapImportFacade.onMailboxStatus(mailboxStatus)
	}

	async onPostpone(postponedUntil: number): Promise<void> {
		this.win.imapImportFacade.onPostpone(postponedUntil)
	}
}

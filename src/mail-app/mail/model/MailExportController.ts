import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import Stream from "mithril/stream"
import stream from "mithril/stream"

export type MailExportState =
	| { type: "idle"; lastExport: Date | null }
	| { type: "exporting"; mailbox: MailboxDetail; progress: number; exportedMails: number }
	| {
			type: "finished"
			mailbox: MailboxDetail
			exportedMails: number
	  }

/**
 * Controller to keep the state of mail exporting with the details.
 */
export class MailExportController {
	private _state: Stream<MailExportState> = stream({ type: "idle", lastExport: new Date() })
	private progressTimeout: number | null = null

	get state(): Stream<MailExportState> {
		return this._state
	}

	/**
	 * Start exporting the mailbox for the user
	 * @param mailbox
	 */
	startExport(mailbox: MailboxDetail) {
		this._state({ type: "exporting", mailbox: mailbox, progress: 0, exportedMails: 0 })
		this.progressTimeout = window.setInterval(() => {
			const oldState = this._state()
			if (oldState.type === "exporting") {
				if (oldState.progress >= 0.9) {
					this._state({ type: "finished", mailbox: mailbox, exportedMails: oldState.exportedMails })
				} else {
					this._state({
						...oldState,
						progress: oldState.progress + 0.1,
						exportedMails: oldState.exportedMails + 100,
					})
				}
			}
		}, 1000)
	}

	/**
	 * When the user wants to cancel the exporting
	 */
	cancelExport() {
		if (this.progressTimeout) {
			clearInterval(this.progressTimeout)
			this.progressTimeout = null
		}
	}
}

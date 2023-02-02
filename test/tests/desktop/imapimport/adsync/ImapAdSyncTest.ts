import o from "ospec"
import { ImapAdSync } from "../../../../../src/desktop/imapimport/adsync/ImapAdSync.js"
import { ImapAccount, ImapMailboxState, ImapSyncState } from "../../../../../src/desktop/imapimport/adsync/ImapSyncState.js"

o.spec("ImapAdSyncTest", function () {
	let imapAdSync: ImapAdSync

	o.beforeEach(function () {
		let imapAccount = new ImapAccount("192.168.178.83", 25, "johannes")
		imapAccount.password = "Wsw6r6dzEH7Y9mDJ"
		let mailboxStates = [new ImapMailboxState("\\Drafts", new Map())]
		let imapSyncState = new ImapSyncState(imapAccount, 2500, mailboxStates, new Map())
		let imapAdSync = new ImapAdSync(this)
	})

	o.only("trigger AdSyncEventListener onMail event", async function () {
		// TODO write some test cases
	})
})

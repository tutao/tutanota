import o from "@tutao/otest"
import { initLocator, locator } from "../../src/mail-app/workerUtils/worker/WorkerLocator.js"
import { browserDataStub, createTestEntity } from "./TestUtils.js"
import { SessionType } from "../../src/common/api/common/SessionType.js"
import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { GroupType } from "@tutao/appEnv"

function loadFolders(folderListId: Id): Promise<tutanotaTypeRefs.MailSet[]> {
	return locator.cachingEntityClient.loadAll(tutanotaTypeRefs.MailSetTypeRef, folderListId)
}

function loadMailboxSystemFolders(): Promise<tutanotaTypeRefs.MailSet[]> {
	return locator.cachingEntityClient.loadRoot(tutanotaTypeRefs.MailBoxTypeRef, locator.user.getUserGroupId()).then((mailbox) => {
		return loadFolders(mailbox.mailSets.mailSets)
	})
}

function loadContactList() {
	return locator.cachingEntityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, locator.user.getUserGroupId())
}

o.spec("integration test", function () {
	let mailbox = null
	o("login, read mails, update contact", async function () {
		env.staticUrl = "http://localhost:9000"
		initLocator(null as any, browserDataStub)
		o.timeout(20000)
		await locator.login.createSession("map-free@tutanota.de", "map", "Linux node", SessionType.Temporary, null)
		const folders = await loadMailboxSystemFolders()
		const mailSetEntries = await locator.cachingEntityClient.loadAll(tutanotaTypeRefs.MailSetEntryTypeRef, folders[0].entries)
		o(mailSetEntries.length).equals(8)
		const contactList = await loadContactList()
		// create new contact
		let address = createTestEntity(tutanotaTypeRefs.ContactAddressTypeRef)
		address.type = "0"
		address.address = "Entenhausen"
		address.customTypeName = "0"
		let contact = createTestEntity(tutanotaTypeRefs.ContactTypeRef)
		contact._ownerGroup = locator.user.getGroupId(GroupType.Contact)
		contact.title = "Dr."
		contact.firstName = "Max"
		contact.lastName = "Meier"
		contact.comment = "what?"
		contact.company = "WIW"
		contact.addresses = [address]
		await locator.cachingEntityClient.setup(contactList.contacts, contact)
		const contacts = await locator.cachingEntityClient.loadAll(tutanotaTypeRefs.ContactTypeRef, contactList.contacts)
		const firstNames = contacts.map((contact) => contact.firstName)
		o(firstNames.indexOf("Max")).notEquals(-1)
	})
})

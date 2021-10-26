// @flow
import o from "ospec"
import {setup} from "../../../src/api/worker/EntityWorker"
import {GroupType} from "../../../src/api/common/TutanotaConstants"
import {ContactTypeRef, createContact} from "../../../src/api/entities/tutanota/Contact"
import {MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {createContactAddress} from "../../../src/api/entities/tutanota/ContactAddress"
import type {MailFolder} from "../../../src/api/entities/tutanota/MailFolder"
import {MailFolderTypeRef} from "../../../src/api/entities/tutanota/MailFolder"
import {MailBoxTypeRef} from "../../../src/api/entities/tutanota/MailBox"
import {neverNull} from "@tutao/tutanota-utils"
import {ContactListTypeRef} from "../../../src/api/entities/tutanota/ContactList"
import {initLocator, locator} from "../../../src/api/worker/WorkerLocator"
import {browserDataStub} from "../TestUtils"

function loadFolders(folderListId: Id): Promise<MailFolder[]> {
	return locator.cachingEntityClient.loadAll(MailFolderTypeRef, folderListId)
}

function loadMailboxSystemFolders(): Promise<MailFolder[]> {
	return locator.cachingEntityClient.loadRoot(MailBoxTypeRef, locator.login.getUserGroupId()).then(mailbox => {
		return loadFolders(neverNull(mailbox.systemFolders).folders)
	})
}

function loadContactList() {
	return locator.cachingEntityClient.loadRoot(ContactListTypeRef, locator.login.getUserGroupId())
}

o.spec("integration test", function () {

	let mailbox = null

	o("login, read mails, update contact", async function () {
		env.staticUrl = 'http://localhost:9000'
		env.versionNumber
		initLocator((null: any), browserDataStub)
		o.timeout(20000)
		await locator.login.createSession("map-free@tutanota.de", "map", "Linux node", false, false)
		const folders = await loadMailboxSystemFolders()

		const mails = await locator.cachingEntityClient.loadAll(MailTypeRef, folders[0].mails)
		o(mails.length).equals(8)

		const contactList = await loadContactList()

		// create new contact
		let address = createContactAddress()
		address.type = "0"
		address.address = "Entenhausen"
		address.customTypeName = "0"
		let contact = createContact()
		contact._area = "0"
		contact._owner = locator.login.getLoggedInUser()._id
		contact._ownerGroup = locator.login.getGroupId(GroupType.Contact)
		contact.title = "Dr."
		contact.firstName = "Max"
		contact.lastName = "Meier"
		contact.comment = "what?"
		contact.company = "WIW"
		contact.autoTransmitPassword = "stop bugging me!"
		contact.addresses = [address]
		await setup(contactList.contacts, contact)
		const contacts = await locator.cachingEntityClient.loadAll(ContactTypeRef, contactList.contacts)
		const firstNames = contacts.map(contact => contact.firstName)
		o(firstNames.indexOf("Max")).notEquals(-1)
	})
})

// @flow
import o from "ospec/ospec.js"
import {loginFacade} from "../../../src/api/worker/facades/LoginFacade"
import {setup, loadAll, loadRoot} from "../../../src/api/worker/EntityWorker"
import {GroupType} from "../../../src/api/common/TutanotaConstants"
import {ContactTypeRef, createContact} from "../../../src/api/entities/tutanota/Contact"
import {MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {createContactAddress} from "../../../src/api/entities/tutanota/ContactAddress"
import {MailFolderTypeRef} from "../../../src/api/entities/tutanota/MailFolder"
import {MailBoxTypeRef} from "../../../src/api/entities/tutanota/MailBox"
import {neverNull} from "../../../src/api/common/utils/Utils"
import {ContactListTypeRef} from "../../../src/api/entities/tutanota/ContactList"

function loadFolders(folderListId: Id): Promise<MailFolder[]> {
	return loadAll(MailFolderTypeRef, folderListId)
}

function loadMailboxSystemFolders(): Promise<MailFolder[]> {
	return loadRoot(MailBoxTypeRef, loginFacade.getUserGroupId()).then(mailbox => {
		return loadFolders(neverNull(mailbox.systemFolders).folders)
	})
}

function loadContactList() {
	return loadRoot(ContactListTypeRef, loginFacade.getUserGroupId())
}

o.spec("integration test", function () {

	let mailbox = null

	o("login, read mails, update contact", function (done, timeout) {
		timeout(10000)
		env.staticUrl = 'http://localhost:9000'
		loginFacade.createSession("map-free@tutanota.de", "map", "Linux node", false)
			.then(() => Promise.all(
				[
					loadMailboxSystemFolders().then(folders => {
						return loadAll(MailTypeRef, folders[0].mails).then(mails => o(mails.length).equals(7))
					}).then(() => loadContactList()).then(contactList => {
						// create new contact
						let address = createContactAddress()
						address.type = "0"
						address.address = "Entenhausen"
						address.customTypeName = "0"
						let contact = createContact()
						contact._area = "0"
						contact._owner = loginFacade.getLoggedInUser()._id
						contact._ownerGroup = loginFacade.getGroupId(GroupType.Contact)
						contact.title = "Dr."
						contact.firstName = "Max"
						contact.lastName = "Meier"
						contact.comment = "what?"
						contact.company = "WIW"
						contact.autoTransmitPassword = "stop bugging me!"
						contact.addresses = [address]
						return setup(contactList.contacts, contact).then(() => {
							return loadAll(ContactTypeRef, contactList.contacts).map((contact: Contact) => contact.firstName)
								.then(firstNames => o(firstNames.indexOf("Max")).notEquals(-1))
						})
					})
				]))
			.then(done)
		/*

		 */

		/*
		 return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
		 return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.TutanotaProperties, tutao.entity.tutanota.TutanotaProperties.PATH, root.getReference(), null, {"v": tutao.entity.tutanota.TutanotaProperties.MODEL_VERSION}, tutao.entity.EntityHelper.createAuthHeaders());
		 });*/
//        load() 
	})


	/*********************** LoginViewModel ************************/


})

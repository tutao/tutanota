import o from "@tutao/otest"
import { initLocator, locator } from "../../src/applications/mail-app/workerUtils/worker/WorkerLocator.js"
import { browserDataStub, createTestEntity } from "./TestUtils.js"
import { SessionType } from "../../src/platform-kit/app-env"
import {
	ContactAddressTypeRef,
	ContactListTypeRef,
	ContactTypeRef,
	MailBoxTypeRef,
	MailSet,
	MailSetEntryTypeRef,
	MailSetTypeRef,
	tutanotaModelInfo,
	tutanotaTypeModels,
} from "@tutao/entities/tutanota"
import { GroupType } from "../../src/entities/sys/Utils"
import { baseModelInfo, baseTypeModels } from "@tutao/entities/base"
import { sysModelInfo, sysTypeModels } from "@tutao/entities/sys"
import { driveModelInfo, driveTypeModels } from "@tutao/entities/drive"
import { storageModelInfo, storageTypeModels } from "@tutao/entities/storage"
import { monitorModelInfo, monitorTypeModels } from "@tutao/entities/monitor"
import { usageModelInfo, usageTypeModels } from "@tutao/entities/usage"
import { accountingModelInfo, accountingTypeModels } from "@tutao/entities/accounting"
import { NamedClientModel } from "../../src/platform-kit/instance-pipeline"
import { AppNameEnum } from "../../src/platform-kit/meta"

function loadFolders(folderListId: Id): Promise<MailSet[]> {
	return locator.base.cachingEntityClient.loadAll(MailSetTypeRef, folderListId)
}

function loadMailboxSystemFolders(): Promise<MailSet[]> {
	return locator.base.cachingEntityClient.loadRoot(MailBoxTypeRef, locator.base.user.getUserGroupId()).then((mailbox) => {
		return loadFolders(mailbox.mailSets.mailSets)
	})
}

function loadContactList() {
	return locator.base.cachingEntityClient.loadRoot(ContactListTypeRef, locator.base.user.getUserGroupId())
}

o.spec("integration test", function () {
	let mailbox = null
	o("login, read mails, update contact", async function () {
		env.staticUrl = "http://localhost:9000"
		const apps: Array<NamedClientModel> = [
			{ app: AppNameEnum.Base, clientModel: baseTypeModels, modelInfo: baseModelInfo },
			{ app: "sys", clientModel: sysTypeModels, modelInfo: sysModelInfo },
			{ app: "tutanota", clientModel: tutanotaTypeModels, modelInfo: tutanotaModelInfo },
			{ app: "drive", clientModel: driveTypeModels, modelInfo: driveModelInfo },
			{ app: "storage", clientModel: storageTypeModels, modelInfo: storageModelInfo },
			{ app: "monitor", clientModel: monitorTypeModels, modelInfo: monitorModelInfo },
			{ app: "usage", clientModel: usageTypeModels, modelInfo: usageModelInfo },
			{ app: "accounting", clientModel: accountingTypeModels, modelInfo: accountingModelInfo },
		]
		initLocator(null as any, browserDataStub, apps)
		o.timeout(20000)
		await locator.base.login.createSession("map-free@tutanota.de", "map", "Linux node", SessionType.Temporary, null)
		const folders = await loadMailboxSystemFolders()
		const mailSetEntries = await locator.base.cachingEntityClient.loadAll(MailSetEntryTypeRef, folders[0].entries)
		o(mailSetEntries.length).equals(8)
		const contactList = await loadContactList()
		// create new contact
		let address = createTestEntity(ContactAddressTypeRef)
		address.type = "0"
		address.address = "Entenhausen"
		address.customTypeName = "0"
		let contact = createTestEntity(ContactTypeRef)
		contact._ownerGroup = locator.base.user.getGroupId(GroupType.Contact)
		contact.title = "Dr."
		contact.firstName = "Max"
		contact.lastName = "Meier"
		contact.comment = "what?"
		contact.company = "WIW"
		contact.addresses = [address]
		await locator.base.cachingEntityClient.setup(contactList.contacts, contact)
		const contacts = await locator.base.cachingEntityClient.loadAll(ContactTypeRef, contactList.contacts)
		const firstNames = contacts.map((contact) => contact.firstName)
		o(firstNames.indexOf("Max")).notEquals(-1)
	})
})

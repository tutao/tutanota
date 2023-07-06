import o from "ospec"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import { object } from "testdouble"
import { ContactListEditorModel } from "../../../src/contacts/ContactListEditor.js"

o.spec("ContactListEditorModelTest", function () {
	let contactListEditorModel: ContactListEditorModel

	let entityClient: EntityClient

	o.beforeEach(() => {
		entityClient = object()

		contactListEditorModel = new ContactListEditorModel("test", null, entityClient)
	})

	o.spec("adding addresses", function () {
		o("adding address adds it to the address list", function () {
			const newEmail = "test@test.com"

			contactListEditorModel.addRecipient(newEmail)

			o(contactListEditorModel.addresses.length).equals(1)
			o(contactListEditorModel.addresses[0]).equals(newEmail)
		})

		o("adding address already in list does not add it to the address list", function () {
			const newEmail = "test@test.com"

			contactListEditorModel.addRecipient(newEmail)
			contactListEditorModel.addRecipient(newEmail)

			o(contactListEditorModel.addresses.length).equals(1)
			o(contactListEditorModel.addresses[0]).equals(newEmail)
		})
	})

	o("removing address removes address from address list", function () {
		const newEmail = "test@test.com"

		contactListEditorModel.addRecipient(newEmail)
		contactListEditorModel.addRecipient("test1@test.com")
		contactListEditorModel.addRecipient("test2@test.com")

		contactListEditorModel.removeRecipient(newEmail)

		o(contactListEditorModel.addresses.length).equals(2)
		o(contactListEditorModel.addresses.includes(newEmail)).equals(false)
	})
})

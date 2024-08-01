import o from "ospec"
import { ContactListEditorModel } from "../../../src/mail-app/contacts/ContactListEditor.js"

o.spec("ContactListEditorModelTest", function () {
	let contactListEditorModel: ContactListEditorModel

	o.beforeEach(() => {
		contactListEditorModel = new ContactListEditorModel([])
	})

	o.spec("adding addresses", function () {
		o("adding address adds it to the address list", function () {
			const newEmail = "test@test.com"

			contactListEditorModel.addRecipient(newEmail)

			o(contactListEditorModel.newAddresses.length).equals(1)
			o(contactListEditorModel.newAddresses[0]).equals(newEmail)
		})

		o("adding address already in list does not add it to the address list", function () {
			const newEmail = "test@test.com"

			contactListEditorModel.addRecipient(newEmail)
			contactListEditorModel.addRecipient(newEmail)

			o(contactListEditorModel.newAddresses.length).equals(1)
			o(contactListEditorModel.newAddresses[0]).equals(newEmail)
		})
	})

	o("removing address removes address from address list", function () {
		const newEmail = "test@test.com"

		contactListEditorModel.addRecipient(newEmail)
		contactListEditorModel.addRecipient("test1@test.com")
		contactListEditorModel.addRecipient("test2@test.com")

		contactListEditorModel.removeRecipient(newEmail)

		o(contactListEditorModel.newAddresses.length).equals(2)
		o(contactListEditorModel.newAddresses.includes(newEmail)).equals(false)
	})
})

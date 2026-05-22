import { EntityClient } from "../../../platform-kits/network/EntityClient"
import { ContactModel } from "../../common/contactsFunctionality/ContactModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Router } from "../../../ui/ScopedRouter"
import { ContactEditor } from "./ContactEditor"
import { CONTACTS_PREFIX } from "../../../ui/utils/RouteChange"
import { QuickAction } from "../../common/misc/quickactions/QuickActionsModel"

export async function quickContactsActions(contactModel: ContactModel, router: Router, entityClient: EntityClient): Promise<readonly QuickAction[]> {
	const newContactAction: QuickAction = {
		description: lang.getTranslationText("newContact_action"),
		exec: async () => {
			const contactListId = await contactModel.getContactListId()
			if (contactListId) {
				new ContactEditor(entityClient, null, contactListId).show()
			}
		},
	}

	const contactTabAction: QuickAction = {
		description: lang.getTranslationText("contacts_label"),
		exec: () => router.routeTo(CONTACTS_PREFIX, {}),
	}

	return [contactTabAction, newContactAction]
}

import { Contact } from "@tutao/entities/tutanota"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { QuickSearchBar } from "../../../common/gui/QuickSearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { getContactListName } from "../../../common/contactsFunctionality/ContactUtils"
import type { LiveSearchResult, QuickSearchQuery, SearchQuery } from "../../../common/search/SearchUtils"
import { Dialog } from "../../../../ui/base/Dialog"
import { EnvProvider } from "@tutao/app-env"

export interface ContactSearchBarAttrs {
	loadResults: (searchQuery: QuickSearchQuery) => Promise<LiveSearchResult<Contact>>
	selectResult: (searchQuery: SearchQuery, entry: Contact | null) => unknown
	indexingSupported: () => Promise<boolean>
}
export class ContactQuickSearchBar implements ClassComponent<ContactSearchBarAttrs> {
	view({ attrs }: Vnode<ContactSearchBarAttrs, this>): Children {
		return m(QuickSearchBar<Contact>, {
			placeholder: lang.getTranslationText("searchContacts_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10,
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry, _isSelected) => this.renderContactResult(entry),
			shouldOfferUpgrade: false,
			confirmSearch: async () => {
				if (!(await attrs.indexingSupported())) {
					Dialog.message(EnvProvider.get().isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
					return false
				} else {
					return true
				}
			},
		})
	}

	renderContactResult(contact: Contact): Children {
		return [
			m(".top.flex-space-between", m(".name", getContactListName(contact))),
			m(
				".bottom.flex-space-between",
				m("small.mail-address", contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : ""),
			),
		]
	}
}

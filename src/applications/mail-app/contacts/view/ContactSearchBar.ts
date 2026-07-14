import { LiveSearchResult, SearchQuery } from "../../search/model/SearchModel"
import { Contact } from "@tutao/entities/tutanota"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar } from "../../search/SearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { createRestriction } from "../../search/model/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { getContactListName } from "../../../common/contactsFunctionality/ContactUtils"

export interface ContactSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<Contact>>
	selectResult: (searchQuery: SearchQuery, entry: Contact | null) => unknown
	shouldOfferUpgrade: boolean
}
export class ContactSearchBar implements ClassComponent<ContactSearchBarAttrs> {
	view({ attrs }: Vnode<ContactSearchBarAttrs, this>): Children | null {
		return m(SearchBar<Contact>, {
			placeholder: lang.getTranslationText("searchContacts_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10, // FIXME
					restriction: createRestriction(SearchCategoryType.contact, null, null, null, [], false),
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry, _isSelected) => this.renderContactResult(entry),
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
		})
	}

	renderContactResult(contact: Contact) {
		return [
			m(".top.flex-space-between", m(".name", getContactListName(contact))),
			m(
				".bottom.flex-space-between",
				m("small.mail-address", contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : ""),
			),
		]
	}
}

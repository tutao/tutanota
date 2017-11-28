//@flow
import m from "mithril"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"


export function setSearchUrl(category: string, query: string, selectedId: ?Id) {
	let newUrl = `/search/${category}${selectedId ? "/" + selectedId : ""}?query=${encodeURIComponent(query)}`
	if (newUrl !== m.route.get()) {
		m.route.set(newUrl)
	}
}


export function getRestriction(route: string): ?SearchRestriction {
	if (route.startsWith('/mail') || route.startsWith('/search/mail')) {
		return {type: MailTypeRef, attributes: []}
	} else if (route.startsWith('/contact') || route.startsWith('/search/contact')) {
		return {type: ContactTypeRef, attributes: []}
	} else {
		return null
	}
}
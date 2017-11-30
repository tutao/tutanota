//@flow
import m from "mithril"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"


export function setSearchUrl(category: string, query: string, selectedId: ?Id) {
	let newUrl = `/search/${category}${selectedId ? "/" + selectedId : ""}?query=${encodeURIComponent(query)}`
	if (newUrl !== m.route.get()) {
		m.route.set(newUrl)
	}
}


export function getRestriction(route: string, listId: ?Id): ?SearchRestriction {
	if (route.startsWith('/mail') || route.startsWith('/search/mail')) {
		return {type: MailTypeRef, attributes: [], listId: listId}
	} else if (route.startsWith('/contact') || route.startsWith('/search/contact')) {
		return {type: ContactTypeRef, attributes: [], listId: listId}
	} else if (route.startsWith('/settings/users') || route.startsWith('/settings/groups')) {
		return {type: GroupInfoTypeRef, attributes: [], listId: listId}
	} else {
		return null
	}
}
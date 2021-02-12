//@flow
import {lang} from "../misc/LanguageViewModel"
import {loadAll, load} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {AdministratedGroupTypeRef} from "../api/entities/sys/AdministratedGroup"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {createContactFormLanguage} from "../api/entities/tutanota/ContactFormLanguage"
import type {ContactFormLanguage} from "../api/entities/tutanota/ContactFormLanguage"
import {getElementId} from "../api/common/utils/EntityUtils"
import {flat} from "../api/common/utils/ArrayUtils"

export function getDefaultContactFormLanguage(supportedLanguages: ContactFormLanguage[]): ContactFormLanguage {
	let language = supportedLanguages.find(l => l.code === lang.code || l.code + '_sie' === lang.code)
	if (!language) {
		language = supportedLanguages.find(l => l.code === 'en')
	}
	if (!language) {
		language = supportedLanguages[0]
	}
	if (!language) { // FIXME: only needed for existing contact forms remove after all existing contact forms have been saved.
		language = createContactFormLanguage()
		language.code = lang.code
	}
	return language
}

export async function getAdministratedGroupIds(): Promise<Id[]> {
	const localAdminGroups = await Promise.mapSeries(logins.getUserController()
	                                                       .getLocalAdminGroupMemberships(), (gm) => load(GroupTypeRef, gm.group))
	const administratedGroupIds = await Promise.mapSeries(localAdminGroups, async (localAdminGroup) => {
		if (localAdminGroup.administratedGroups) {
			const administratedGroups = await loadAll(AdministratedGroupTypeRef, localAdminGroup.administratedGroups.items)
			return administratedGroups.map(getElementId)
		} else {
			return []
		}
	})
	return flat(administratedGroupIds)
}
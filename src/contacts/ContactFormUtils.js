//@flow
import {lang} from "../misc/LanguageViewModel"
import {loadAll, load} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {GroupType} from "../api/common/TutanotaConstants"
import {AdministratedGroupTypeRef} from "../api/entities/sys/AdministratedGroup"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {createContactFormLanguage} from "../api/entities/tutanota/ContactFormLanguage"

export function getDefaultContactFormLanguage(languages: ContactFormLanguage[]): ContactFormLanguage {
	let language = languages.find(l => l.code == lang.code)
	if (!language) {
		language = languages.find(l => l.code == 'en')
	}
	if (!language) {
		language = languages[0]
	}
	if (!language) { // FIXME: only needed for existing contact forms remove after all existing contact forms have been saved.
		language = createContactFormLanguage()
		language.code = lang.code
	}
	return language
}

export function getAdministratedGroupIds(): Promise<Id[]> {
	return Promise.all(logins.getUserController().getLocalAdminGroupMemberships().map(gm => load(GroupTypeRef, gm.group))).map(localAdminGroup => {
		if (localAdminGroup.administratedGroups) {
			return loadAll(AdministratedGroupTypeRef, localAdminGroup.administratedGroups.items).map(ag => {
				return ag._id[1]
			})
		}
	}).reduce((allAdministratedGroupIds, administratedGroupIds) => {
		if (administratedGroupIds) {
			return allAdministratedGroupIds.concat(administratedGroupIds)
		}
		return allAdministratedGroupIds
	}, [])
}
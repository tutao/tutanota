import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {AdministratedGroupTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {GroupTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {createContactFormLanguage} from "../../api/entities/tutanota/TypeRefs.js"
import type {ContactFormLanguage} from "../../api/entities/tutanota/TypeRefs.js"
import {getElementId} from "../../api/common/utils/EntityUtils"
import {flat} from "@tutao/tutanota-utils"
import {promiseMap} from "@tutao/tutanota-utils"
import {locator} from "../../api/main/MainLocator"

export function getDefaultContactFormLanguage(supportedLanguages: ContactFormLanguage[]): ContactFormLanguage {
	let language = supportedLanguages.find(l => l.code === lang.code || l.code + "_sie" === lang.code)

	if (!language) {
		language = supportedLanguages.find(l => l.code === "en")
	}

	if (!language) {
		language = supportedLanguages[0]
	}

	if (!language) {
		// FIXME: only needed for existing contact forms remove after all existing contact forms have been saved.
		language = createContactFormLanguage()
		language.code = lang.code
	}

	return language
}

export async function getAdministratedGroupIds(): Promise<Id[]> {
	const localAdminGroups = await promiseMap(logins.getUserController().getLocalAdminGroupMemberships(), gm =>
		locator.entityClient.load(GroupTypeRef, gm.group),
	)
	const administratedGroupIds = await promiseMap(localAdminGroups, async localAdminGroup => {
		if (localAdminGroup.administratedGroups) {
			const administratedGroups = await locator.entityClient.loadAll(AdministratedGroupTypeRef, localAdminGroup.administratedGroups.items)
			return administratedGroups.map(getElementId)
		} else {
			return []
		}
	})
	return flat(administratedGroupIds)
}
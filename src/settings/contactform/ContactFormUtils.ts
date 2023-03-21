import { lang } from "../../misc/LanguageViewModel"
import { AdministratedGroupTypeRef, GroupTypeRef } from "../../api/entities/sys/TypeRefs.js"
import type { ContactFormLanguage } from "../../api/entities/tutanota/TypeRefs.js"
import { createContactFormLanguage } from "../../api/entities/tutanota/TypeRefs.js"
import { getElementId } from "../../api/common/utils/EntityUtils"
import { flat, promiseMap } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/MainLocator"

export function getDefaultContactFormLanguage(supportedLanguages: ContactFormLanguage[]): ContactFormLanguage {
	let language = supportedLanguages.find((l) => l.code === lang.code || l.code + "_sie" === lang.code)

	if (!language) {
		language = supportedLanguages.find((l) => l.code === "en")
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
	const localAdminGroups = await promiseMap(locator.logins.getUserController().getLocalAdminGroupMemberships(), (gm) =>
		locator.entityClient.load(GroupTypeRef, gm.group),
	)
	const administratedGroupIds = await promiseMap(localAdminGroups, async (localAdminGroup) => {
		if (localAdminGroup.administratedGroups) {
			const administratedGroups = await locator.entityClient.loadAll(AdministratedGroupTypeRef, localAdminGroup.administratedGroups.items)
			return administratedGroups.map(getElementId)
		} else {
			return []
		}
	})
	return flat(administratedGroupIds)
}

export function getContactFormUrl(domain: string | null, path: string): string {
	let pathPrefix = ""

	if (location.pathname.indexOf("client/build") !== -1) {
		// local
		pathPrefix = ":9000/client/build"
	}

	// In case whitelabel domain was deleted but contact form is there we display a placeholder.
	const displayDomain = domain ?? "[no domain]"
	return "https://" + displayDomain + pathPrefix + "/contactform/" + path
}

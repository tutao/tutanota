import type { InfoLink } from "../../../../ui/utils/LanguageViewModel"
import { Children } from "mithril"
import { LoginController } from "../../api/main/LoginController"

/**
 * Executes the passed function if the user is allowed to see `tuta.com` links.
 * @param logins LoginController to ask about login information
 * @param linkId
 * @param render receives the resolved link
 * @returns {Children|null}
 */
export function ifAllowedTutaLinks(logins: LoginController, linkId: InfoLink, render: (linkId: InfoLink) => Children): Children | null {
	// this is currently in gui-base, preventing us from accessing logins ourselves.
	// may be subject to change
	if (canSeeTutaLinks(logins)) {
		return render(linkId)
	}
	return null
}

/**
 * Check if the user is allowed to see `tutanota.com` links or other major references to Tutanota.
 *
 * If the user is on whitelabel and they are not global admin, information like this should not be shown.
 * @param logins LoginController to ask about login information
 * @returns true if the user should see tutanota links or false if they should not
 */
export function canSeeTutaLinks(logins: LoginController): boolean {
	return !logins.isWhitelabel() || logins.getUserController().isGlobalAdmin()
}

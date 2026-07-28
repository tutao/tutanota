import m, { Children } from "mithril"
import { InfoLink, lang } from "../../../../ui/utils/LanguageViewModel"
import { assertMainOrNode, isBrowser } from "../../../../platform-kit/app-env"

assertMainOrNode()

export function renderSearchInOurApps(): Children | null {
	if (!isBrowser()) {
		return null
	} else {
		return m.trust(
			lang.get("searchInOurApps_msg", {
				"{link}": `<a href="${InfoLink.Download}" target="_blank">${lang.get("searchInOurAppsLinkText_msg")}</a>`,
			}),
		)
	}
}

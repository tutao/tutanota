import m, { Children, Component } from "mithril"
import { Card } from "../../../ui/base/Card"
import { InfoLink, lang } from "../../../ui/utils/LanguageViewModel"
import { EnvProvider } from "@tutao/app-env"

export function renderSearchInOurApps(): Children {
	if (!EnvProvider.get().isBrowser()) {
		return null
	} else {
		return m.trust(
			lang.get("searchInOurApps_msg", {
				"{link}": `<a href="${InfoLink.Download}" target="_blank">${lang.get("searchInOurAppsLinkText_msg")}</a>`,
			}),
		)
	}
}

export class AppPromo implements Component {
	view(): Children {
		const searchText = renderSearchInOurApps()
		if (searchText == null) {
			return null
		}
		return m("div.ml-8.mt-12.small.plr-8.content-fg.mb-16", m(Card, searchText))
	}
}

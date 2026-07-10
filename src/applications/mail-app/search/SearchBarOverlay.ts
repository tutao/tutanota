import { CalendarEvent, Contact, Mail } from "@tutao/entities/tutanota"
import type { ShowMoreAction } from "./SearchBar"
import { px, size } from "../../../ui/size"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { isEmpty } from "@tutao/utils"
import { FULL_INDEXED_TIMESTAMP } from "@tutao/app-env"
import { formatDate, formatTimeOrDateOrYesterday } from "../../../ui/utils/Formatter"
import Badge from "../../../ui/base/Badge"
import { Icon } from "../../../ui/base/Icon"
import m, { Children, Component, Vnode } from "mithril"
import { getMailFolderIcon } from "../mail/view/MailGuiUtils"
import { locator } from "../../common/api/main/CommonLocator"
import { getTimeZone } from "../../common/calendar/date/CalendarUtils.js"
import { formatEventDuration } from "../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { getContactListName } from "../../common/contactsFunctionality/ContactUtils.js"
import { getSenderOrRecipientHeading } from "../mail/view/MailViewerUtils.js"
import { mailLocator } from "../mailLocator.js"
import { renderSearchInOurApps } from "./view/SearchView"
import { isTutaTeamMail } from "../../common/mailFunctionality/SharedMailUtils"
import { companyTeamLabel } from "../../../platform-kit/app-env/boot/ClientConstants"

export interface SearchBarOverlayAttrs<T> {
	items: readonly T[]
	selected: T | null
	isFocused: boolean
	renderResult: (entry: T, isSelected: boolean) => Children
	selectResult: (result: T | null) => void
}

export class SearchBarOverlay<T> implements Component<SearchBarOverlayAttrs<T>> {
	view({ attrs }: Vnode<SearchBarOverlayAttrs<T>>): Children {
		const { items } = attrs
		return [!isEmpty(items) && attrs.isFocused ? this.renderResults(attrs) : null]
	}

	renderResults(attrs: SearchBarOverlayAttrs<T>): Children {
		const searchInOurAppsElement = renderSearchInOurApps()

		return [
			m("ul.list.click.mail-list", [
				(attrs.items ?? []).map((entry) => {
					const isSelected = attrs.selected === entry
					return m(
						"li.plr-24.flex-v-center.",
						{
							style: {
								height: px(52),
								"border-left": px(size.radius_4) + " solid transparent",
							},
							// avoid closing overlay before the click event can be received
							onmousedown: (e: MouseEvent) => e.preventDefault(),
							onclick: () => attrs.selectResult(entry),
							class: isSelected ? "row-selected" : "",
						},
						attrs.renderResult(entry, isSelected),
					)
				}),
			]),
			searchInOurAppsElement &&
				m(
					".bottom.small.pt-8.pb-8.plr-12.text-center",
					{
						// avoid closing overlay before the click event can be received
						onmousedown: (e: MouseEvent) => e.preventDefault(),
					},
					searchInOurAppsElement,
				),
		]
	}

	private renderShowMoreAction(showMoreAction: ShowMoreAction): Children {
		let infoText
		let indexInfo

		if (showMoreAction.resultCount === 0) {
			infoText = lang.get("searchNoResults_msg")

			if (locator.logins.getUserController().isFreeAccount()) {
				indexInfo = lang.get("changeTimeFrame_msg")
			}
		} else if (showMoreAction.allowShowMore) {
			infoText = lang.get("showMore_action")
		} else {
			infoText = lang.get("moreResultsFound_msg", {
				"{1}": showMoreAction.resultCount - showMoreAction.shownCount,
			})
		}

		if (showMoreAction.indexTimestamp > FULL_INDEXED_TIMESTAMP && !indexInfo) {
			indexInfo = lang.get("searchedUntil_msg") + " " + formatDate(new Date(showMoreAction.indexTimestamp))
		}

		return indexInfo
			? [m(".top.flex-center", infoText), m(".bottom.flex-center.small", indexInfo)]
			: m("li.plr-24.pt-8.pb-8.items-center.flex-center", m(".flex-center", infoText))
	}

	private renderContactResult(contact: Contact): Children {
		return [
			m(".top.flex-space-between", m(".name", getContactListName(contact))),
			m(
				".bottom.flex-space-between",
				m("small.mail-address", contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : ""),
			),
		]
	}
}

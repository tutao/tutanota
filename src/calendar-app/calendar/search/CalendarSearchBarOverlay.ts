import { CalendarSearchBarAttrs, CalendarSearchBarState, Entry, ShowMoreAction } from "./CalendarSearchBar.js"
import m, { Children, Component, Vnode } from "mithril"
import { downcast, isEmpty, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import { px, size } from "../../../common/gui/size.js"
import { CalendarEvent, CalendarEventTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { FULL_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants.js"
import { formatDate } from "../../../common/misc/Formatter.js"
import { formatEventDuration } from "../gui/CalendarGuiUtils.js"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"

type CalendarSearchBarOverlayAttrs = {
	state: CalendarSearchBarState
	isQuickSearch: boolean
	isFocused: boolean
	selectResult: (result: Entry | null) => void
}

export class CalendarSearchBarOverlay implements Component<CalendarSearchBarOverlayAttrs> {
	view({ attrs }: Vnode<CalendarSearchBarOverlayAttrs>): Children {
		const { state } = attrs
		return [state.entities && !isEmpty(state.entities) && attrs.isQuickSearch && attrs.isFocused ? this.renderResults(state, attrs) : null]
	}

	renderResults(state: CalendarSearchBarState, attrs: CalendarSearchBarOverlayAttrs): Children {
		return m("ul.list.click.mail-list", [
			state.entities.map((result) => {
				return m(
					"li.plr-l.flex-v-center.",
					{
						style: {
							height: px(52),
							"border-left": px(size.border_selection) + " solid transparent",
						},
						// avoid closing overlay before the click event can be received
						onmousedown: (e: MouseEvent) => e.preventDefault(),
						onclick: () => attrs.selectResult(result),
						class: state.selected === result ? "row-selected" : "",
					},
					this.renderResult(state, result),
				)
			}),
		])
	}

	renderResult(state: CalendarSearchBarState, result: Entry): Children {
		let type: TypeRef<any> | null = "_type" in result ? result._type : null

		if (!type) {
			return this.renderShowMoreAction(downcast(result))
		} else if (isSameTypeRef(CalendarEventTypeRef, type)) {
			return this.renderCalendarEventResult(downcast(result))
		} else {
			return []
		}
	}

	private renderShowMoreAction(result: ShowMoreAction): Children {
		// show more action
		let showMoreAction = result as any as ShowMoreAction
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
			: m("li.plr-l.pt-s.pb-s.items-center.flex-center", m(".flex-center", infoText))
	}

	private renderCalendarEventResult(event: CalendarEvent): Children {
		return [
			m(".top.flex-space-between", m(".name.text-ellipsis", { title: event.summary }, event.summary)),
			m(".bottom.flex-space-between", m("small.mail-address", formatEventDuration(event, getTimeZone(), false))),
		]
	}
}

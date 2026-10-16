import type { ShowMoreAction } from "./QuickSearchBar"
import { px, size } from "../../../ui/size"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { EnvProvider, TutanotaConstants } from "@tutao/app-env"
import { formatDate } from "../../../ui/utils/Formatter"
import m, { Children, Component, Vnode } from "mithril"
import { pureComponent } from "../../../ui/base/PureComponent"
import { isNotEmpty } from "@tutao/utils"

import { renderSearchInOurApps } from "./AppPromo"

export interface SearchBarOverlayAttrs<T> {
	items: readonly T[]
	selected: number | "showmore" | null
	isFocused: boolean
	renderResult: (entry: T, isSelected: boolean) => Children
	selectResult: (result: T | null) => void
	showMoreAction: ShowMoreAction | null
}

const OverlayRow = pureComponent(({ isSelected, onclick }: { isSelected: boolean; onclick: () => unknown }, children) =>
	m(
		"li.plr-24.flex-v-center.",
		{
			style: {
				height: px(52),
				"border-left": px(size.radius_4) + " solid transparent",
			},
			// avoid closing overlay before the click event can be received
			onmousedown: (e: MouseEvent) => e.preventDefault(),
			onclick: onclick,
			class: isSelected ? "row-selected" : "",
		},
		children,
	),
)

export class SearchBarOverlay<T> implements Component<SearchBarOverlayAttrs<T>> {
	view({ attrs }: Vnode<SearchBarOverlayAttrs<T>>): Children {
		const { items, showMoreAction } = attrs
		return [(isNotEmpty(items) || showMoreAction) && attrs.isFocused ? this.renderResults(attrs) : null]
	}

	renderResults(attrs: SearchBarOverlayAttrs<T>): Children {
		const searchInOurAppsElement = renderSearchInOurApps()

		return [
			m("ul.list.click.mail-list", [
				(attrs.items ?? []).map((entry, index) => {
					const isSelected = attrs.selected === index
					return m(
						OverlayRow,
						{
							isSelected,
							onclick: () => attrs.selectResult(entry),
						},
						attrs.renderResult(entry, isSelected),
					)
				}),
				attrs.showMoreAction
					? m(
							OverlayRow,
							{
								isSelected: attrs.selected === "showmore",
								onclick: () => attrs.selectResult(null),
							},
							this.renderShowMoreAction(attrs.items.length, attrs.showMoreAction),
						)
					: null,
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

	private renderShowMoreAction(itemCount: number, { indexTimestamp, shouldOfferUpgrade }: ShowMoreAction): Children {
		let infoText
		let indexInfo

		if (itemCount === 0) {
			infoText = lang.getTranslationText("searchNoResults_msg")

			if (shouldOfferUpgrade) {
				indexInfo = lang.getTranslationText("changeTimeFrame_msg")
			}
		} else {
			infoText = lang.getTranslationText("showMore_action")
		}

		if (indexTimestamp > TutanotaConstants.FULL_INDEXED_TIMESTAMP && !indexInfo) {
			indexInfo = !EnvProvider.get().isOfflineStorageAvailable() // we have isNonBlockingSearchAvailable() at home
				? lang.getTranslationText("searchedUntil_msg") + " " + formatDate(new Date(indexTimestamp))
				: lang.getTranslationText("notAllMailsSearchable_msg")
		}

		return indexInfo
			? [m(".top.flex-center", infoText), m(".bottom.flex-center.small", indexInfo)]
			: m("li.plr-24.pt-8.pb-8.items-center.flex-center", m(".flex-center", infoText))
	}
}

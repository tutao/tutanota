import m, { Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { PositionRect } from "../../../common/gui/base/Overlay"
import { displayOverlay } from "../../../common/gui/base/Overlay"
import type { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { Shortcut } from "../../../common/misc/KeyManager"
import { isKeyPressed, keyManager } from "../../../common/misc/KeyManager"
import { encodeCalendarSearchKey, getRestriction } from "./model/SearchUtils"
import { FULL_INDEXED_TIMESTAMP, Keys } from "../../../common/api/common/TutanotaConstants"
import { assertMainOrNode, isApp } from "../../../common/api/common/Env"
import { styles } from "../../../common/gui/styles"
import { client } from "../../../common/misc/ClientDetector"
import { debounce, downcast, memoized, mod, TypeRef } from "@tutao/tutanota-utils"
import { BrowserType } from "../../../common/misc/ClientConstants"
import { hasMoreResults } from "./model/CalendarSearchModel.js"
import type { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { LayerType } from "../../../RootView"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../common/gui/base/BaseSearchBar.js"
import { generateCalendarInstancesInRange } from "../../../common/calendar/date/CalendarUtils.js"

import { loadMultipleFromLists } from "../../../common/api/common/EntityClient.js"
import { SearchRouter } from "../../../common/search/view/SearchRouter.js"
import { calendarLocator } from "../../calendarLocator.js"
import { CalendarSearchBarOverlay } from "./CalendarSearchBarOverlay.js"

assertMainOrNode()
export type ShowMoreAction = {
	resultCount: number
	shownCount: number
	indexTimestamp: number
	allowShowMore: boolean
}
export type CalendarSearchBarAttrs = {
	placeholder?: string | null
	returnListener?: (() => unknown) | null
	disabled?: boolean
}

const MAX_SEARCH_PREVIEW_RESULTS = 10
export type Entry = CalendarEvent | ShowMoreAction
type Entries = Array<Entry>
export type CalendarSearchBarState = {
	query: string
	searchResult: SearchResult | null
	entities: Entries
	selected: Entry | null
}

// create our own copy which is not perfect because we don't benefit from the shared cache but currently there's no way to get async dependencies into
// singletons like this (without top-level await at least)
// once SearchBar is rewritten this should be removed
const searchRouter = new SearchRouter(calendarLocator.throttledRouter())

export class CalendarSearchBar implements Component<CalendarSearchBarAttrs> {
	focused: boolean = false
	private readonly state: Stream<CalendarSearchBarState>
	busy: boolean = false
	private closeOverlayFunction: (() => void) | null = null
	private readonly overlayContentComponent: Component
	private domWrapper!: HTMLElement
	private domInput!: HTMLElement
	private indexStateStream: Stream<unknown> | null = null
	private stateStream: Stream<unknown> | null = null
	private lastQueryStream: Stream<unknown> | null = null

	constructor() {
		this.state = stream<CalendarSearchBarState>({
			query: "",
			searchResult: null,
			entities: [] as Entries,
			selected: null,
		})
		this.overlayContentComponent = {
			view: () => {
				return m(CalendarSearchBarOverlay, {
					state: this.state(),
					isQuickSearch: this.isQuickSearch(),
					isFocused: this.focused,
					selectResult: (selected) => this.selectResult(selected),
				})
			},
		}

		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
		this.onremove = this.onremove.bind(this)
	}

	/**
	 * this reacts to URL changes by clearing the suggestions - the selected item may have changed
	 * that shouldn't clear our current state, but if the URL changed in a way that makes the previous state outdated, we clear it.
	 */
	private readonly onPathChange = memoized((newPath: string) => {
		if (calendarLocator.search.isNewSearch(this.state().query, getRestriction(newPath))) {
			this.updateState({
				searchResult: null,
				selected: null,
				entities: [],
			})
		}
	})

	view(vnode: Vnode<CalendarSearchBarAttrs>) {
		this.onPathChange(m.route.get())

		return m(BaseSearchBar, {
			placeholder: vnode.attrs.placeholder,
			text: this.state().query,
			busy: this.busy,
			disabled: vnode.attrs.disabled,
			onInput: (text) => this.search(text),
			onSearchClick: () => this.handleSearchClick(),
			onClear: () => {
				this.clear()
			},
			onWrapperCreated: (dom) => {
				this.domWrapper = dom
				this.showOverlay()
			},
			onInputCreated: (dom) => {
				this.domInput = dom
			},
			onFocus: () => (this.focused = true),
			onBlur: () => this.onBlur(),
			onKeyDown: (e) => this.onkeydown(e),
		} satisfies BaseSearchBarAttrs)
	}

	private readonly onkeydown = (e: KeyboardEvent) => {
		const { selected, entities } = this.state()

		const keyHandlers = [
			{
				key: Keys.F1,
				exec: () => keyManager.openF1Help(),
			},
			{
				key: Keys.ESC,
				exec: () => this.clear(),
			},
			{
				key: Keys.RETURN,
				exec: () => {
					if (selected) {
						this.selectResult(selected)
					} else {
						this.search()
					}
				},
			},
			{
				key: Keys.UP,
				exec: () => {
					if (entities.length > 0) {
						let oldSelected = selected || entities[0]

						this.updateState({
							selected: entities[mod(entities.indexOf(oldSelected) - 1, entities.length)],
						})
					}
				},
			},
			{
				key: Keys.DOWN,
				exec: () => {
					if (entities.length > 0) {
						let newSelected = selected || entities[0]

						this.updateState({
							selected: entities[mod(entities.indexOf(newSelected) + 1, entities.length)],
						})
					}
				},
			},
		]
		let keyHandler = keyHandlers.find((handler) => isKeyPressed(e.key, handler.key))

		if (keyHandler) {
			keyHandler.exec()
			e.preventDefault()
		}

		// disable shortcuts
		e.stopPropagation()
		return true
	}

	oncreate() {
		if (isApp()) {
			// only focus in the mobile app, the search bar always exists in desktop/web and will always be grabbing attention
			this.onFocus()
		}
		keyManager.registerShortcuts(this.shortcuts)
		this.stateStream = this.state.map((state) => m.redraw())
		this.lastQueryStream = calendarLocator.search.lastQueryString.map((value) => {
			// Set value from the model when it's set from the URL e.g. reloading the page on the search screen
			if (value) {
				this.updateState({
					query: value,
				})
			}
		})
	}

	onremove() {
		this.focused = false

		this.shortcuts && keyManager.unregisterShortcuts(this.shortcuts)

		this.stateStream?.end(true)

		this.lastQueryStream?.end(true)

		this.indexStateStream?.end(true)

		this.closeOverlay()
	}

	private timePeriodHasChanged(oldEnd: number | null, aimedEnd: number): boolean {
		return oldEnd !== aimedEnd
	}

	/**
	 * Ensure that overlay exists in DOM
	 */
	private showOverlay() {
		if (this.closeOverlayFunction == null && this.domWrapper != null) {
			this.closeOverlayFunction = displayOverlay(
				() => this.makeOverlayRect(),
				this.overlayContentComponent,
				undefined,
				undefined,
				"dropdown-shadow border-radius",
			)
		} else {
			m.redraw()
		}
	}

	private closeOverlay() {
		if (this.closeOverlayFunction) {
			this.closeOverlayFunction()

			this.closeOverlayFunction = null
		}
	}

	private makeOverlayRect(): PositionRect {
		// note: this is called on every render which probably thrashes our layout constantly.
		// we should at least not do it while we don't have anything to show
		let overlayRect: PositionRect

		const domRect = this.domWrapper.getBoundingClientRect()

		if (styles.isDesktopLayout()) {
			overlayRect = {
				top: px(domRect.bottom + 5),
				right: px(window.innerWidth - domRect.right),
				width: px(350),
				zIndex: LayerType.LowPriorityOverlay,
			}
		} else if (window.innerWidth < 500) {
			overlayRect = {
				top: px(size.navbar_height_mobile + 6),
				left: px(16),
				right: px(16),
				zIndex: LayerType.LowPriorityOverlay,
			}
		} else {
			overlayRect = {
				top: px(size.navbar_height_mobile + 6),
				left: px(domRect.left),
				right: px(window.innerWidth - domRect.right),
				zIndex: LayerType.LowPriorityOverlay,
			}
		}

		return overlayRect
	}

	private readonly shortcuts: ReadonlyArray<Shortcut> = [
		{
			key: Keys.F,
			enabled: () => true,
			exec: () => {
				this.onFocus()
				m.redraw()
			},
			help: "search_label",
		},
	]

	private selectResult(result: CalendarEvent | ShowMoreAction | null) {
		const { query } = this.state()

		if (result != null) {
			let type: TypeRef<any> | null = "_type" in result ? result._type : null

			if (!type) {
				// click on SHOW MORE button
				if ((result as ShowMoreAction).allowShowMore) {
					this.updateSearchUrl(query)
				}
			} else {
				this.updateSearchUrl(query, downcast(result))
			}
		}
	}

	handleSearchClick() {
		if (!this.focused) {
			this.onFocus()
		} else {
			this.search()
		}
	}

	private getRestriction(): SearchRestriction {
		return getRestriction(m.route.get())
	}

	private updateSearchUrl(query: string, selected?: CalendarEvent) {
		searchRouter.routeTo(query, this.getRestriction(), selected && encodeCalendarSearchKey(selected))
	}

	private search(query?: string) {
		let oldQuery = this.state().query

		if (query != null) {
			this.updateState({
				query,
			})
		} else {
			query = oldQuery
		}

		let restriction = this.getRestriction()

		if (!calendarLocator.search.isNewSearch(query, restriction) && oldQuery === query) {
			const result = calendarLocator.search.result()

			if (this.isQuickSearch() && result) {
				this.showResultsInOverlay(result)
			}

			this.busy = false
		} else {
			if (query.trim() !== "") {
				this.busy = true
			}

			this.doSearch(query, restriction, () => {
				this.busy = false
				m.redraw()
			})
		}
	}

	private readonly doSearch = debounce(300, (query: string, restriction: SearchRestriction, cb: () => void) => {
		if (!this.isQuickSearch()) {
			// if we're already on the search view, we don't want to wait until there's a new result to update the
			// UI. we can directly go to the URL and let the SearchViewModel do its thing from there.
			searchRouter.routeTo(query, restriction)
			return cb()
		}

		let useSuggestions = m.route.get().startsWith("/settings")
		// This is a vestige of the searchbar for mail, keeping just in case
		// we do not need to limit calendar events since they are local
		const limit = null

		calendarLocator.search
			.search(
				{
					query: query ?? "",
					restriction,
					minSuggestionCount: useSuggestions ? 10 : 0,
					maxResults: limit,
				},
				calendarLocator.progressTracker,
			)
			.then((result) => this.loadAndDisplayResult(query, result ? result : null, limit))
			.finally(() => cb())
	})

	/** Given the result from the search load additional results if needed and then display them or set URL. */
	private loadAndDisplayResult(query: string, result: SearchResult | null, limit: number | null) {
		const safeResult = result,
			safeLimit = limit

		this.updateState({
			searchResult: safeResult,
		})

		if (!safeResult || calendarLocator.search.isNewSearch(query, safeResult.restriction)) {
			return
		}

		if (this.isQuickSearch()) {
			// Calendar does not have a quick search bar, so this has been taken out
			// but this is left in case this changes in the future
		} else {
			// instances will be displayed as part of the list of the search view, when the search view is displayed
			searchRouter.routeTo(query, safeResult.restriction)
		}
	}

	private clear() {
		if (m.route.get().startsWith("/search")) {
			// this needs to happen in this order, otherwise the list's result subscription will override our
			// routing.
			this.updateSearchUrl("")
			calendarLocator.search.result(null)
		}

		this.updateState({
			query: "",
			entities: [],
			selected: null,
			searchResult: null,
		})
	}

	private async showResultsInOverlay(result: SearchResult): Promise<void> {
		const entries = await loadMultipleFromLists(result.restriction.type, calendarLocator.entityClient, result.results)
		// If there was no new search while we've been downloading the result
		if (!calendarLocator.search.isNewSearch(result.query, result.restriction)) {
			const { filteredEntries, couldShowMore } = this.filterResults(entries, result.restriction)

			if (
				result.query.trim() !== "" &&
				(filteredEntries.length === 0 || hasMoreResults(result) || couldShowMore || result.currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP)
			) {
				const moreEntry: ShowMoreAction = {
					resultCount: result.results.length,
					shownCount: filteredEntries.length,
					indexTimestamp: result.currentIndexTimestamp,
					allowShowMore: true,
				}
				filteredEntries.push(moreEntry)
			}

			this.updateState({
				entities: filteredEntries,
				selected: filteredEntries[0],
			})
		}
	}

	private isQuickSearch(): boolean {
		return !m.route.get().startsWith("/search")
	}

	private filterResults(
		instances: Array<Entry>,
		restriction: SearchRestriction,
	): {
		filteredEntries: Entries
		couldShowMore: boolean
	} {
		const range = { start: restriction.start ?? 0, end: restriction.end ?? 0 }
		const generatedInstances = generateCalendarInstancesInRange(downcast(instances), range, MAX_SEARCH_PREVIEW_RESULTS + 1)
		return {
			filteredEntries: generatedInstances.slice(0, MAX_SEARCH_PREVIEW_RESULTS),
			couldShowMore: generatedInstances.length > MAX_SEARCH_PREVIEW_RESULTS,
		}
	}

	private onFocus() {
		if (!this.focused) {
			this.focused = true
			// setTimeout to fix bug in current Safari with losing focus
			setTimeout(
				() => {
					this.domInput.focus()

					this.search()
				},
				client.browser === BrowserType.SAFARI ? 200 : 0,
			)
		}
	}

	private onBlur() {
		this.focused = false

		if (this.state().query === "") {
			if (m.route.get().startsWith("/search")) {
				const restriction = searchRouter.getRestriction()
				searchRouter.routeTo("", restriction)
			}
		}
		m.redraw()
	}

	private updateState(update: Partial<CalendarSearchBarState>): CalendarSearchBarState {
		const newState = Object.assign({}, this.state(), update)

		this.state(newState)

		return newState
	}
}

// Should be changed to not be a singleton and be proper component (instantiated by mithril).
// We need to extract some state of it into some kind of viewModel, pluggable depending on the current view but this requires complete rewrite of SearchBar.
export const searchBar = new CalendarSearchBar()

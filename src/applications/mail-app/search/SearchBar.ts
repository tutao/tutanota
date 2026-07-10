import m, { Component, Vnode } from "mithril"
import { layout_size, px, size } from "../../../ui/size"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { displayOverlay, overlayBottomMargin, PositionRect } from "../../../ui/base/Overlay"
import { assertIsEntity, getElementId, isSameTypeRef, ListElementEntity, TypeRef } from "@tutao/meta"
import type { Shortcut } from "../../../ui/utils/KeyManager"
import { isKeyPressed, keyManager } from "../../../ui/utils/KeyManager"
import { encodeCalendarSearchKey, getRestriction, hasMoreResults } from "./model/SearchUtils"
import { Dialog } from "../../../ui/base/Dialog"
import { assertMainOrNode, FULL_INDEXED_TIMESTAMP, isApp, Keys } from "@tutao/app-env"
import { styles } from "../../../ui/styles"
import { client } from "../../../platform-kit/app-env/boot/ClientDetector"
import { debounce, isNotEmpty, mod, ofClass } from "@tutao/utils"
import { BrowserType } from "../../../platform-kit/app-env/boot/ClientConstants"
import { SearchBarOverlay } from "./SearchBarOverlay"
import { IndexingNotSupportedError } from "../../common/api/common/error/IndexingNotSupportedError"
import { SearchCategoryType, SearchRestriction } from "../../common/api/worker/search/SearchTypes"
import { LayerType } from "../../../ui/base/RootView"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../ui/base/BaseSearchBar.js"
import { SearchRouter } from "../../common/search/view/SearchRouter.js"
import { PageSize } from "../../../ui/base/ListUtils.js"
import { mailLocator } from "../mailLocator.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { windowFacade } from "../../common/misc/WindowFacade"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { LiveSearchResult, SearchQuery } from "./model/SearchModel"

assertMainOrNode()
export type ShowMoreAction = {
	resultCount: number
	shownCount: number
	indexTimestamp: number
	allowShowMore: boolean
}
export type SearchBarAttrs = {
	placeholder?: string | null
	returnListener?: (() => unknown) | null
	disabled?: boolean
}

const MAX_SEARCH_PREVIEW_RESULTS = 10
export type Entry = Mail | Contact | CalendarEvent | DriveFile | DriveFolder | ShowMoreAction
type Entries = Array<Entry>
export type SearchBarState = {
	query: SearchQuery | null
	searchResult: LiveSearchResult<Entry> | null
	selected: Entry | null
}

// create our own copy which is not perfect because we don't benefit from the shared cache but currently there's no way to get async dependencies into
// singletons like this (without top-level await at least)
// once SearchBar is rewritten this should be removed
const searchRouter = new SearchRouter(mailLocator.throttledRouter())

export class SearchBar implements Component<SearchBarAttrs> {
	focused: boolean = false
	private readonly state: Stream<SearchBarState>
	busy: boolean = false
	private closeOverlayFunction: (() => void) | null = null
	private readonly overlayContentComponent: Component
	private confirmDialogShown: boolean = false
	private domWrapper!: HTMLElement
	private domInput!: HTMLElement
	private stateStream: Stream<unknown> | null = null

	constructor() {
		this.state = stream<SearchBarState>({
			query: null,
			searchResult: null,
			selected: null,
		})
		this.overlayContentComponent = {
			view: () => {
				return m(SearchBarOverlay, {
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

	// /**
	//  * this reacts to URL changes by clearing the suggestions - the selected item may have changed (in the mail view maybe)
	//  * that shouldn't clear our current state, but if the URL changed in a way that makes the previous state outdated, we clear it.
	//  */
	// private readonly onPathChange = memoized((newPath: string) => {
	// 	// if we assume quick search then we only care about query (and type)
	// 	if (searchQueryEquals(this.state().query, ))
	// 	// FIXME won't work
	// 	if (mailLocator.search.isNewSearch(this.state().query, getRestriction(newPath))) {
	// 		this.updateState({
	// 			searchResult: null,
	// 			selected: null,
	// 		})
	// 	}
	// })

	view(vnode: Vnode<SearchBarAttrs>) {
		return m(
			// form wrapper to isolate the search input and prevent it from being autofilled when unrelated buttons are clicked on chrome
			// this is done because chrome doesn't appear to respect `autocomplete="off"` and will autofill the field anyway
			"form.full-width",
			{
				style: {
					maxWidth: styles.isUsingBottomNavigation() ? "" : px(layout_size.second_col_max_width + 50),
				},
				onsubmit: (e: SubmitEvent) => {
					e.stopPropagation()
					e.preventDefault()
				},
			},
			m(BaseSearchBar, {
				placeholder: vnode.attrs.placeholder,
				text: this.state().query?.query ?? "",
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
			} satisfies BaseSearchBarAttrs),
		)
	}

	private readonly onkeydown = (e: KeyboardEvent) => {
		const { selected, searchResult } = this.state()
		const entities = searchResult?.items
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
					// blur() is used to hide keyboard on return button click
					this.domInput.blur()
				},
			},
			{
				key: Keys.UP,
				exec: () => {
					if (entities && entities.length > 0) {
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
					if (entities && entities.length > 0) {
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
	}

	onremove() {
		this.focused = false

		if (this.shortcuts) keyManager.unregisterShortcuts(this.shortcuts)

		this.stateStream?.end(true)

		this.closeOverlay()
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
		// Adjust position when the keyboard is open. Keyboard is not included in safe area insets.
		// We need to subtract overlay margin because by default it included bottom nav and safe area which we don't
		// need if the keyboard is open.
		const overlayMargin = overlayBottomMargin() ?? 0
		const bottom = windowFacade.keyboardSize() === 0 ? px(size.spacing_16) : px(windowFacade.keyboardSize() - overlayMargin + size.spacing_16)
		if (styles.isDesktopLayout()) {
			overlayRect = {
				top: px(domRect.bottom + 5),
				right: px(window.innerWidth - domRect.right),
				width: px(350),
				zIndex: LayerType.LowPriorityOverlay,
			}
		} else if (window.innerWidth < 500) {
			overlayRect = {
				bottom,
				left: px(16),
				right: px(16),
				zIndex: LayerType.LowPriorityOverlay,
			}
		} else {
			overlayRect = {
				bottom,
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

	private selectResult(result: (Mail | null) | Contact | CalendarEvent | ShowMoreAction | DriveFile | DriveFolder) {
		const { query } = this.state()
		const queryString = query?.query ?? ""

		// FIXME: move this outside
		if (result != null) {
			let type: TypeRef<any> | null = "_type" in result ? result._type : null

			if (!type) {
				// click on SHOW MORE button
				if ((result as ShowMoreAction).allowShowMore) {
					this.updateSearchUrl(queryString)
				}
			} else if (isSameTypeRef(MailTypeRef, type)) {
				this.updateSearchUrl(queryString, result as Mail)
			} else if (isSameTypeRef(ContactTypeRef, type)) {
				this.updateSearchUrl(queryString, result as Contact)
			} else if (isSameTypeRef(CalendarEventTypeRef, type)) {
				this.updateSearchUrl(queryString, result as CalendarEvent)
			} else if (isSameTypeRef(DriveFolderTypeRef, type) || isSameTypeRef(DriveFileTypeRef, type)) {
				this.updateSearchUrl(queryString, result as DriveFolder | DriveFile)
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

	private updateSearchUrl(query: string, selected?: ListElementEntity) {
		if (selected && assertIsEntity(selected, CalendarEventTypeRef)) {
			searchRouter.routeTo(query, this.getRestriction(), selected && encodeCalendarSearchKey(selected))
		} else {
			searchRouter.routeTo(query, this.getRestriction(), selected && getElementId(selected))
		}
	}

	private search(query?: string) {
		let oldQuery = this.state().query
		let restriction = this.getRestriction()
		let searchQuery: SearchQuery
		if (query != null) {
			searchQuery = {
				query: query ?? "",
				restriction,
				// FIXME: these 2 are wrong
				maxResults: null,
				minSuggestionCount: 0,
			}
			this.updateState({
				query: searchQuery,
			})
		} else {
			searchQuery = oldQuery ?? {
				query: query ?? "",
				restriction,
				// FIXME: these 2 are wrong
				maxResults: null,
				minSuggestionCount: 0,
			}
		}

		if (!mailLocator.search.indexState().mailIndexEnabled && restriction && restriction.type === SearchCategoryType.mail && !this.confirmDialogShown) {
			this.focused = false
			this.confirmDialogShown = true
			Dialog.confirm("enableSearchMailbox_msg", "search_label")
				.then((confirmed) => {
					if (confirmed) {
						mailLocator.indexerFacade
							.enableMailIndexing()
							.then(() => {
								this.search()
								this.onFocus()
							})
							.catch(
								ofClass(IndexingNotSupportedError, () => {
									Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
								}),
							)
					}
				})
				.finally(() => (this.confirmDialogShown = false))
		} else {
			// Skip the search if the user is trying to bypass the search dialog
			if (!mailLocator.search.indexState().mailIndexEnabled && restriction.type === SearchCategoryType.mail) {
				return
			}

			// FIXME: wtf we are doing here? Why are we in quick search with search result but without a loaded result?
			// if (!mailLocator.search.isNewSearch(query, restriction)&& oldQuery === query) {
			// 	const result = mailLocator.search.result()
			//
			// 	if (this.isQuickSearch() && result) {
			// 		this.showResultsInOverlay(result)
			// 	}
			//
			// 	this.busy = false
			// } else {

			if (searchQuery.query.trim() !== "") {
				this.busy = true
			}

			this.doSearch(searchQuery.query, restriction, () => {
				this.busy = false
				m.redraw()
			})
			// }
		}
	}

	private readonly doSearch = debounce(300, (query: string, restriction: SearchRestriction, cb: () => void) => {
		;(async () => {
			if (!this.isQuickSearch()) {
				// if we're already on the search view, we don't want to wait until there's a new result to update the
				// UI. we can directly go to the URL and let the SearchViewModel do its thing from there.
				searchRouter.routeTo(query, restriction)
				return
			}

			this.state().searchResult?.dispose()

			let liveResult: LiveSearchResult<Entry>
			switch (restriction.type) {
				case SearchCategoryType.mail:
					liveResult = await mailLocator.search.coolNewSearchMails(
						{
							query,
							restriction,
							minSuggestionCount: 0,
							maxResults: this.isQuickSearch() ? MAX_SEARCH_PREVIEW_RESULTS : PageSize,
						},
						mailLocator.progressTracker,
					)
					break
				case SearchCategoryType.contact:
					liveResult = await mailLocator.search.coolNewSearchContacts(
						{ query, restriction, minSuggestionCount: 0, maxResults: MAX_SEARCH_PREVIEW_RESULTS },
						mailLocator.progressTracker,
					)
					break
				case SearchCategoryType.calendar:
				case SearchCategoryType.drive:
					// FIXME: other search types
					return
			}
			const results: Entries = liveResult.items
			const { searchResult } = liveResult

			if (
				// FIXME: we changed the behavior for empty search result
				isNotEmpty(searchResult.results) &&
				(hasMoreResults(searchResult) ||
					liveResult.items.length > MAX_SEARCH_PREVIEW_RESULTS ||
					searchResult.currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP)
			) {
				const moreEntry: ShowMoreAction = {
					resultCount: liveResult.items.length,
					shownCount: liveResult.items.length,
					indexTimestamp: searchResult.currentIndexTimestamp,
					allowShowMore: true,
				}
				results.push(moreEntry)
			}

			this.updateState({
				searchResult: liveResult,
				selected: liveResult.items[0],
			})
		})().finally(() => cb())
	})

	private clear() {
		if (m.route.get().startsWith("/search")) {
			// this needs to happen in this order, otherwise the list's result subscription will override our
			// routing.
			this.updateSearchUrl("")
			mailLocator.search.result(null)
		}

		this.updateState({
			query: null,
			selected: null,
			searchResult: null,
		})
	}

	private isQuickSearch(): boolean {
		return !m.route.get().startsWith("/search")
	}

	private onFocus() {
		if (!mailLocator.search.indexingSupported) {
			Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
		} else if (!this.focused) {
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

		const query = this.state().query
		if (query == null || query.query === "") {
			if (m.route.get().startsWith("/search")) {
				const restriction = searchRouter.getRestriction()
				searchRouter.routeTo("", restriction)
			}
		}
		m.redraw()
	}

	private updateState(update: Partial<SearchBarState>): SearchBarState {
		const newState = Object.assign({}, this.state(), update)

		this.state(newState)

		return newState
	}
}

// Should be changed to not be a singleton and be proper component (instantiated by mithril).
// We need to extract some state of it into some kind of viewModel, pluggable depending on the current view but this requires complete rewrite of SearchBar.
export const searchBar = new SearchBar()

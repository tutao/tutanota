import m, { Children, Component, Vnode } from "mithril"
import { layout_size, px, size } from "../../../ui/size"
import { displayOverlay, overlayBottomMargin, PositionRect } from "../../../ui/base/Overlay"
import { assertIsEntity, getElementId, ListElementEntity } from "@tutao/meta"
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
import { mailLocator } from "../mailLocator.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, Mail } from "@tutao/entities/tutanota"
import { windowFacade } from "../../common/misc/WindowFacade"
import { DriveFile, DriveFolder } from "@tutao/entities/drive"
import { LiveSearchResult, SearchQuery } from "./model/SearchModel"

assertMainOrNode()
export type ShowMoreAction = {
	resultCount: number
	shownCount: number
	indexTimestamp: number
	allowShowMore: boolean
}
type ResultLoader<T> = (query: string) => Promise<LiveSearchResult<T>>

export type SearchBarAttrs<T> = {
	placeholder?: string | null
	returnListener?: (() => unknown) | null
	disabled?: boolean
	loadResults: ResultLoader<T>
	renderResult: (entry: T, isSelected: boolean) => Children
	selectResult: (searchQuery: SearchQuery, entry: T) => unknown
}

const MAX_SEARCH_PREVIEW_RESULTS = 10
export type Entry = Mail | Contact | CalendarEvent | DriveFile | DriveFolder | ShowMoreAction

interface SearchBarState<T> {
	query: SearchQuery | null
	searchResult: LiveSearchResult<T> | null
	selected: T | null
	busy: boolean
}

// create our own copy which is not perfect because we don't benefit from the shared cache but currently there's no way to get async dependencies into
// singletons like this (without top-level await at least)
// once SearchBar is rewritten this should be removed
const searchRouter = new SearchRouter(mailLocator.throttledRouter())

// by the age of 12, each SearchBar need to know:
//  - how to get search results
//  - how to display them
//  - how to finally select a result
export class SearchBar<T> implements Component<SearchBarAttrs<T>> {
	private focused: boolean = false
	private state: SearchBarState<T>
	private closeOverlayFunction: (() => void) | null = null
	private readonly overlayContentComponent: Component
	private confirmDialogShown: boolean = false
	private domWrapper!: HTMLElement
	private domInput!: HTMLElement
	private lastAttrs: SearchBarAttrs<T>

	constructor({ attrs }: Vnode<SearchBarAttrs<T>>) {
		this.state = {
			query: null,
			searchResult: null,
			selected: null,
			busy: false,
		}
		this.lastAttrs = attrs

		this.overlayContentComponent = {
			view: () => {
				return m(SearchBarOverlay<T>, {
					items: this.state.searchResult?.items ?? [],
					selected: this.state.selected,
					isFocused: this.focused,
					renderResult: this.lastAttrs.renderResult,
					selectResult: (entry) => entry && this.state.query && this.lastAttrs.selectResult(this.state.query, entry),
				})
			},
		}
	}

	view(vnode: Vnode<SearchBarAttrs<T>>) {
		this.lastAttrs = vnode.attrs

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
				text: this.state.query?.query ?? "",
				busy: this.state.busy,
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
				onKeyDown: (e) => this.onkeydown(e, vnode.attrs.loadResults),
			} satisfies BaseSearchBarAttrs),
		)
	}

	private readonly onkeydown = (e: KeyboardEvent, loadResults: (query: string) => Promise<LiveSearchResult<T>>) => {
		const { selected, searchResult, query } = this.state
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
					if (selected && query) {
						this.lastAttrs.selectResult(query, selected)
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
	}

	onremove() {
		this.focused = false

		if (this.shortcuts) keyManager.unregisterShortcuts(this.shortcuts)

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

	private search(query?: string) {
		let oldQuery = this.state.query
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
								this.search(query)
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

			if (searchQuery.query.trim() !== "") {
				this.updateState({ busy: true })
			}

			this.doSearch(searchQuery.query, restriction, () => {
				this.updateState({ busy: false })
			})
			// }
		}
	}

	private readonly doSearch = debounce(300, (query: string, restriction: SearchRestriction, cb: () => void) => {
		;(async () => {
			this.state.searchResult?.dispose()

			const liveResult: LiveSearchResult<T> = await this.lastAttrs.loadResults(query)
			const { searchResult } = liveResult

			if (
				// FIXME: we changed the behavior for empty search result
				isNotEmpty(searchResult.results) &&
				(hasMoreResults(searchResult) ||
					liveResult.items.length > MAX_SEARCH_PREVIEW_RESULTS ||
					searchResult.currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP)
			) {
				// FIXME: show more action
				// const moreEntry: ShowMoreAction = {
				// 	resultCount: liveResult.items.length,
				// 	shownCount: liveResult.items.length,
				// 	indexTimestamp: searchResult.currentIndexTimestamp,
				// 	allowShowMore: true,
				// }
				// results.push(moreEntry)
			}

			this.updateState({
				searchResult: liveResult,
				selected: liveResult.items[0],
			})
		})().finally(() => cb())
	})

	private clear() {
		this.updateState({
			query: null,
			selected: null,
			searchResult: null,
		})
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
		m.redraw()
	}

	private updateState(update: Partial<SearchBarState<T>>) {
		this.state = { ...this.state, ...update }
		m.redraw()
	}
}

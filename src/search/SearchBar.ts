import { TextFieldType } from "../gui/base/TextField.js"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../gui/base/icons/Icons"
import { inputLineHeight, px, size } from "../gui/size"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { theme } from "../gui/theme"
import { Icon } from "../gui/base/Icon"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { BootIcons } from "../gui/base/icons/BootIcons"
import type { PositionRect } from "../gui/base/Overlay"
import { displayOverlay } from "../gui/base/Overlay"
import type { Contact, Mail } from "../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef, MailTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import type { Shortcut } from "../misc/KeyManager"
import { keyManager } from "../misc/KeyManager"
import { NotAuthorizedError, NotFoundError } from "../api/common/error/RestError"
import { getRestriction, getSearchUrl, isAdministratedGroup, setSearchUrl } from "./model/SearchUtils"
import { locator } from "../api/main/MainLocator"
import { Dialog } from "../gui/base/Dialog"
import type { GroupInfo, WhitelabelChild } from "../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, WhitelabelChildTypeRef } from "../api/entities/sys/TypeRefs.js"
import { FULL_INDEXED_TIMESTAMP, Keys, TabIndex } from "../api/common/TutanotaConstants"
import { assertMainOrNode, isApp } from "../api/common/Env"
import { styles } from "../gui/styles"
import { client } from "../misc/ClientDetector"
import { debounce, downcast, flat, groupBy, isSameTypeRef, mod, noOp, ofClass, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { PageSize } from "../gui/base/List"
import { BrowserType } from "../misc/ClientConstants"
import { hasMoreResults } from "./model/SearchModel"
import { SearchBarOverlay } from "./SearchBarOverlay"
import { IndexingNotSupportedError } from "../api/common/error/IndexingNotSupportedError"
import { lang } from "../misc/LanguageViewModel"
import { AriaLandmarks, landmarkAttrs } from "../gui/AriaUtils"
import type { SearchIndexStateInfo, SearchRestriction, SearchResult } from "../api/worker/search/SearchTypes"
import type { ListElement } from "../api/common/utils/EntityUtils"
import { elementIdPart, getElementId, listIdPart } from "../api/common/utils/EntityUtils"
import { compareContacts } from "../contacts/view/ContactGuiUtils"
import { LayerType } from "../RootView"

assertMainOrNode()
export type ShowMoreAction = {
	resultCount: number
	shownCount: number
	indexTimestamp: number
	allowShowMore: boolean
}
export type SearchBarAttrs = {
	classes?: string
	style?: Record<string, string>
	alwaysExpanded?: boolean
	placeholder?: string | null
	returnListener?: (() => unknown) | null
}
const SEARCH_INPUT_WIDTH = 200 // includes input field and close/progress icon

const MAX_SEARCH_PREVIEW_RESULTS = 10
export type Entry = Mail | Contact | GroupInfo | WhitelabelChild | ShowMoreAction
type Entries = Array<Entry>
export type SearchBarState = {
	query: string
	searchResult: SearchResult | null
	indexState: SearchIndexStateInfo
	entities: Entries
	selected: Entry | null
}

export class SearchBar implements Component<SearchBarAttrs> {
	view: Component<SearchBarAttrs>["view"]
	private _domInput!: HTMLInputElement
	private _domWrapper!: HTMLElement
	focused: boolean
	expanded!: boolean
	skipNextBlur: Stream<boolean>
	private _state: Stream<SearchBarState>
	oncreate: Component<SearchBarAttrs>["oncreate"]
	busy: boolean
	lastSelectedGroupInfoResult: Stream<GroupInfo>
	lastSelectedWhitelabelChildrenInfoResult: Stream<WhitelabelChild>
	private _closeOverlayFunction: (() => Promise<void>) | null = null
	private _overlayContentComponent: Component
	private _confirmDialogShown: boolean = false

	constructor() {
		this.lastSelectedGroupInfoResult = stream()
		this.lastSelectedWhitelabelChildrenInfoResult = stream()
		this.focused = false
		this.skipNextBlur = stream<boolean>(false)
		this.busy = false
		this._state = stream<SearchBarState>({
			query: "",
			searchResult: null,
			indexState: locator.search.indexState(),
			entities: [] as Entries,
			selected: null,
		})
		this._overlayContentComponent = {
			view: () => {
				return m(SearchBarOverlay, {
					state: this._state(),
					isQuickSearch: this._isQuickSearch(),
					isFocused: this.focused,
					isExpanded: this.expanded,
					skipNextBlur: this.skipNextBlur,
					selectResult: (selected) => this._selectResult(selected),
				})
			},
		}
		let stateStream: Stream<void>
		let lastQueryStream: Stream<void>
		let indexStateStream: Stream<void>
		let shortcuts: Shortcut[]
		// a little optimization to not call getRestriction() on every redraw
		let lastPath: string | null = null

		this.view = (vnode: Vnode<SearchBarAttrs>): Children => {
			const newPath = m.route.get()
			if (lastPath == null || newPath !== lastPath) {
				lastPath = newPath
				if (locator.search.isNewSearch(this._state().query, getRestriction(newPath))) {
					this._updateState({
						searchResult: null,
						entities: [],
					})
				}
			}
			return m(
				".flex" + (vnode.attrs.classes || ""),
				{
					style: vnode.attrs.style,
				},
				[
					m(
						".search-bar.flex-end.items-center",
						{
							...landmarkAttrs(AriaLandmarks.Search),
							oncreate: (vnode) => {
								this._domWrapper = vnode.dom as HTMLElement
								shortcuts = this._setupShortcuts()
								keyManager.registerShortcuts(shortcuts)
								indexStateStream = locator.search.indexState.map((indexState) => {
									// When we finished indexing, search again forcibly to not confuse anyone with old results
									const currentResult = this._state().searchResult

									if (
										!indexState.failedIndexingUpTo &&
										currentResult &&
										this._state().indexState.progress !== 0 &&
										indexState.progress === 0 &&
										//if period is changed from search view a new search is triggered there,  and we do not want to overwrite its result
										!this.timePeriodHasChanged(currentResult.restriction.end, indexState.aimedMailIndexTimestamp)
									) {
										this._doSearch(this._state().query, currentResult.restriction, m.redraw)
									}

									this._updateState({
										indexState,
									})
								})
								stateStream = this._state.map((state) => {
									this._showOverlay()

									if (this._domInput) {
										const input = this._domInput

										if (state.query !== input.value) {
											input.value = state.query
										}
									}

									m.redraw()
								})
								lastQueryStream = locator.search.lastQuery.map((value) => {
									// Set value from the model when we it's set from the URL e.g. reloading the page on the search screen
									if (value) {
										this._updateState({
											query: value,
										})

										this.expanded = true
									}
								})
							},
							onremove: () => {
								shortcuts && keyManager.unregisterShortcuts(shortcuts)

								stateStream?.end(true)

								lastQueryStream?.end(true)

								indexStateStream?.end(true)

								this._closeOverlay()
							},
							style: {
								"min-height": px(inputLineHeight + 2),
								// 2 px border
								"padding-bottom": this.expanded ? (this.focused ? px(0) : px(1)) : px(2),
								"padding-top": px(2),
								// center input field
								"margin-right": px(styles.isDesktopLayout() ? 15 : 8),
								"border-bottom":
									vnode.attrs.alwaysExpanded || this.expanded
										? this.focused
											? `2px solid ${theme.content_accent}`
											: `1px solid ${theme.content_border}`
										: "0px",
								"align-self": "center",
								"max-width": px(400),
								flex: "1",
							},
						},
						[
							styles.isDesktopLayout()
								? m(
										"button.ml-negative-xs.click",
										{
											tabindex: TabIndex.Default,
											title: lang.get("search_label"),
											onmousedown: () => {
												if (this.focused) {
													this.skipNextBlur(true) // avoid closing of overlay when clicking search icon
												}
											},
											onclick: (e: MouseEvent) => {
												e.preventDefault()
												this.handleSearchClick(e)
											},
										},
										m(Icon, {
											icon: BootIcons.Search,
											class: "flex-center items-center icon-large",
											style: {
												fill: this.focused ? theme.header_button_selected : theme.header_button,
											},
										}),
								  )
								: null,
							m(
								".searchInputWrapper.flex.items-center",
								{
									"aria-hidden": String(!this.expanded),
									tabindex: this.expanded ? TabIndex.Default : TabIndex.Programmatic,
									style: (() => {
										let paddingLeft: string

										if (this.expanded || vnode.attrs.alwaysExpanded) {
											if (styles.isDesktopLayout()) {
												paddingLeft = px(10)
											} else {
												paddingLeft = px(6)
											}
										} else {
											paddingLeft = px(0)
										}

										return {
											width: this.inputWrapperWidth(!!vnode.attrs.alwaysExpanded),
											transition: `width ${DefaultAnimationTime}ms`,
											"padding-left": paddingLeft,
											"padding-top": "3px",
											"padding-bottom": "3px",
											"overflow-x": "hidden",
										}
									})(),
								},
								[
									this._getInputField(vnode.attrs),
									m(
										"button.closeIconWrapper",
										{
											onclick: () => this.close(),
											style: {
												width: size.icon_size_large,
											},
											title: lang.get("close_alt"),
											tabindex: this.expanded ? TabIndex.Default : TabIndex.Programmatic,
										},
										this.busy
											? m(Icon, {
													icon: BootIcons.Progress,
													class: "flex-center items-center icon-progress-search icon-progress",
											  })
											: m(Icon, {
													icon: Icons.Close,
													class: "flex-center items-center icon-large",
													style: {
														fill: theme.header_button,
													},
											  }),
									),
								],
							),
						],
					),
				],
			)
		}
	}

	private timePeriodHasChanged(oldEnd: number | null, aimedEnd: number): boolean {
		return oldEnd !== aimedEnd
	}

	inputWrapperWidth(alwaysExpanded: boolean): string | null {
		if (alwaysExpanded) {
			return "100%"
		} else {
			return this.expanded ? px(SEARCH_INPUT_WIDTH) : px(0)
		}
	}

	/**
	 * Replace contents of the overlay if it was shown or display a new one
	 * if it wasn't
	 * @param contentFunction what to show in overlay
	 * @private
	 */
	_showOverlay() {
		if (this._closeOverlayFunction == null) {
			this._closeOverlayFunction = displayOverlay(() => this._makeOverlayRect(), this._overlayContentComponent)
		} else {
			m.redraw()
		}
	}

	_closeOverlay() {
		if (this._closeOverlayFunction) {
			this._closeOverlayFunction()

			this._closeOverlayFunction = null
		}
	}

	_makeOverlayRect(): PositionRect {
		let overlayRect: PositionRect

		const domRect = this._domWrapper.getBoundingClientRect()

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

	_setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.F,
				enabled: () => true,
				exec: (key) => {
					this.focus()
					m.redraw()
				},
				help: "search_label",
			},
		]
	}

	_downloadResults({ results, restriction }: SearchResult): Promise<Array<Entry>> {
		if (results.length === 0) {
			return Promise.resolve([])
		}

		const byList = groupBy(results, listIdPart)
		return promiseMap(
			byList,
			([listId, idTuples]) => {
				return locator.entityClient
					.loadMultiple(restriction.type, listId, idTuples.map(elementIdPart))
					.catch(
						ofClass(NotFoundError, () => {
							console.log("mail list from search index not found")
							return []
						}),
					)
					.catch(
						ofClass(NotAuthorizedError, () => {
							console.log("no permission on instance from search index")
							return []
						}),
					)
			},
			{
				concurrency: 3,
			},
		) // Higher concurrency to not wait too long for search results of multiple lists
			.then(flat)
	}

	_selectResult(result: (Mail | null) | Contact | GroupInfo | WhitelabelChild | ShowMoreAction) {
		const { query } = this._state()

		if (result != null) {
			this._domInput.blur()

			let type: TypeRef<any> | null = "_type" in result ? result._type : null

			if (!type) {
				// click on SHOW MORE button
				if ((result as ShowMoreAction).allowShowMore) {
					this._updateSearchUrl(query)
				}
			} else if (isSameTypeRef(MailTypeRef, type)) {
				this._updateSearchUrl(query, downcast(result))
			} else if (isSameTypeRef(ContactTypeRef, type)) {
				this._updateSearchUrl(query, downcast(result))
			} else if (isSameTypeRef(GroupInfoTypeRef, type)) {
				this.lastSelectedGroupInfoResult(downcast(result))
			} else if (isSameTypeRef(WhitelabelChildTypeRef, type)) {
				this.lastSelectedWhitelabelChildrenInfoResult(downcast(result))
			}
		}
	}

	handleSearchClick(e: MouseEvent) {
		if (!this.focused) {
			this.focus()
		} else {
			this.search()
		}
	}

	_getRestriction(): SearchRestriction {
		return getRestriction(m.route.get())
	}

	_updateSearchUrl(query: string, selected?: ListElement) {
		setSearchUrl(getSearchUrl(query, this._getRestriction(), selected && getElementId(selected)))
	}

	search(query?: string) {
		let oldQuery = this._state().query

		if (query != null) {
			this._updateState({
				query,
			})
		} else {
			query = oldQuery
		}

		let restriction = this._getRestriction()

		if (isSameTypeRef(restriction.type, GroupInfoTypeRef)) {
			restriction.listId = locator.search.getGroupInfoRestrictionListId()
		}

		if (!locator.search.indexState().mailIndexEnabled && restriction && isSameTypeRef(restriction.type, MailTypeRef) && !this._confirmDialogShown) {
			this.expanded = false
			this.focused = false
			this._confirmDialogShown = true
			Dialog.confirm("enableSearchMailbox_msg", "search_label")
				.then((confirmed) => {
					if (confirmed) {
						locator.indexerFacade
							.enableMailIndexing()
							.then(() => {
								this.search()
								this.focus()
							})
							.catch(
								ofClass(IndexingNotSupportedError, () => {
									Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
								}),
							)
					}
				})
				.finally(() => (this._confirmDialogShown = false))
		} else {
			if (!locator.search.isNewSearch(query, restriction) && oldQuery === query) {
				const result = locator.search.result()

				if (this._isQuickSearch() && result) {
					this._showResultsInOverlay(result)
				}

				this.busy = false
			} else {
				if (query.trim() !== "") {
					this.busy = true
				}

				this._doSearch(query, restriction, () => {
					this.busy = false
					m.redraw()
				})
			}
		}
	}

	_doSearch: (query: string, restriction: SearchRestriction, cb: () => void) => void = debounce(
		300,
		(query: string, restriction: SearchRestriction, cb: () => void) => {
			let useSuggestions = m.route.get().startsWith("/settings")
			// We don't limit contacts because we need to download all of them to sort them. They should be cached anyway.
			const limit = isSameTypeRef(MailTypeRef, restriction.type) ? (this._isQuickSearch() ? MAX_SEARCH_PREVIEW_RESULTS : PageSize) : null
			locator.search
				.search({
					query: query ?? "",
					restriction,
					minSuggestionCount: useSuggestions ? 10 : 0,
					maxResults: limit,
				})
				.then((result) => this._loadAndDisplayResult(query, result ? result : null, limit))
				.finally(() => cb())
		},
	)

	/** Given the result from the search load additional results if needed and then display them or set URL. */
	_loadAndDisplayResult(query: string, result: SearchResult | null, limit: number | null) {
		const safeResult = result,
			safeLimit = limit

		this._updateState({
			searchResult: safeResult,
		})

		if (!safeResult || locator.search.isNewSearch(query, safeResult.restriction)) {
			return
		}

		if (this._isQuickSearch()) {
			if (safeLimit && hasMoreResults(safeResult) && safeResult.results.length < safeLimit) {
				locator.searchFacade.getMoreSearchResults(safeResult, safeLimit - safeResult.results.length).then((moreResults) => {
					if (locator.search.isNewSearch(query, moreResults.restriction)) {
						return
					} else {
						this._loadAndDisplayResult(query, moreResults, limit)
					}
				})
			} else {
				this._showResultsInOverlay(safeResult)
			}
		} else {
			// instances will be displayed as part of the list of the search view, when the search view is displayed
			setSearchUrl(getSearchUrl(query, safeResult.restriction))
		}
	}

	close() {
		if (this.expanded) {
			this.expanded = false

			this._updateState({
				query: "",
			})

			locator.search.lastQuery("")

			this._domInput.blur() // remove focus from the input field in case ESC is pressed
		}

		if (m.route.get().startsWith("/search")) {
			locator.search.result(null)

			this._updateSearchUrl("")
		}
	}

	_showResultsInOverlay(result: SearchResult): Promise<void> {
		return this._downloadResults(result).then((entries) => {
			// If there was no new search while we've been downloading the result
			if (!locator.search.isNewSearch(result.query, result.restriction)) {
				const filteredResults = this._filterResults(entries, result.restriction)

				const overlayEntries = filteredResults.slice(0, MAX_SEARCH_PREVIEW_RESULTS)

				if (
					result.query.trim() !== "" &&
					(overlayEntries.length === 0 ||
						hasMoreResults(result) ||
						overlayEntries.length < filteredResults.length ||
						result.currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP)
				) {
					const moreEntry: ShowMoreAction = {
						resultCount: result.results.length,
						shownCount: overlayEntries.length,
						indexTimestamp: result.currentIndexTimestamp,
						allowShowMore:
							!isSameTypeRef(result.restriction.type, GroupInfoTypeRef) && !isSameTypeRef(result.restriction.type, WhitelabelChildTypeRef),
					}
					overlayEntries.push(moreEntry)
				}

				this._updateState({
					entities: overlayEntries,
					selected: overlayEntries[0],
				})
			}
		})
	}

	_isQuickSearch(): boolean {
		return !m.route.get().startsWith("/search")
	}

	_filterResults(instances: ReadonlyArray<Entry>, restriction: SearchRestriction): Entries {
		let filteredInstances = instances.slice()

		// filter group infos for local admins
		if (isSameTypeRef(restriction.type, GroupInfoTypeRef) && !locator.logins.getUserController().isGlobalAdmin()) {
			const localAdminGroupIds = locator.logins
				.getUserController()
				.getLocalAdminGroupMemberships()
				.map((gm) => gm.group)
			filteredInstances = filteredInstances.filter((gi) => isAdministratedGroup(localAdminGroupIds, downcast(gi)))
		} else if (isSameTypeRef(restriction.type, ContactTypeRef)) {
			// Sort contacts by name
			filteredInstances.sort((o1, o2) => compareContacts(o1 as any, o2 as any))
		}

		return filteredInstances
	}

	_getInputField(attrs: SearchBarAttrs): Children {
		return m("input.input.input-no-clear", {
			"aria-autocomplete": "list",
			tabindex: this.expanded ? TabIndex.Default : TabIndex.Programmatic,
			role: "combobox",
			placeholder: attrs.placeholder,
			type: TextFieldType.Text,
			value: this._state().query,
			oncreate: (vnode) => {
				this._domInput = vnode.dom as HTMLInputElement
			},
			onclick: () => this.focus(),
			onfocus: () => {
				// to highlight elements correctly when focused via keyboard
				this.focused = true
			},
			onblur: (e: FocusEvent) => {
				if (this.skipNextBlur()) {
					setTimeout(() => this._domInput.focus(), 0) // setTimeout needed in Firefox to keep focus
				} else {
					this.blur()
				}

				this.skipNextBlur(false)
			},
			onremove: () => {
				this._domInput.onblur = null
			},
			oninput: () => {
				const domValue = this._domInput.value

				if (this._state().query !== domValue) {
					// update the input on each change
					this.search(domValue)
				}
			},
			onkeydown: (e: KeyboardEvent) => {
				const { selected, entities } = this._state()

				const keyHandlers = [
					{
						key: Keys.F1,
						exec: () => keyManager.openF1Help(),
					},
					{
						key: Keys.ESC,
						exec: () => this.close(),
					},
					{
						key: Keys.RETURN,
						exec: () => {
							if (selected) {
								this._selectResult(selected)
							} else {
								if (isApp()) {
									this._domInput.blur()
								} else {
									this.search()
								}
							}

							attrs
						},
					},
					{
						key: Keys.UP,
						exec: () => {
							if (entities.length > 0) {
								let oldSelected = selected || entities[0]

								this._updateState({
									selected: entities[mod(entities.indexOf(oldSelected) - 1, entities.length)],
								})
							}

							e.preventDefault()
						},
					},
					{
						key: Keys.DOWN,
						exec: () => {
							if (entities.length > 0) {
								let newSelected = selected || entities[0]

								this._updateState({
									selected: entities[mod(entities.indexOf(newSelected) + 1, entities.length)],
								})
							}

							e.preventDefault()
						},
					},
				]
				let keyCode = e.which
				let keyHandler = keyHandlers.find((handler) => handler.key.code === keyCode)

				if (keyHandler) {
					keyHandler.exec()
					e.preventDefault()
				}

				// disable key bindings
				e.stopPropagation()
				return true
			},
			style: {
				"line-height": px(inputLineHeight),
			},
		})
	}

	focus() {
		if (!locator.search.indexingSupported) {
			Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
		} else if (!this.expanded) {
			this.focused = true
			this.expanded = true
			// setTimeout to fix bug in current Safari with losing focus
			setTimeout(
				() => {
					this._domInput.select()

					this._domInput.focus()

					this.search()
				},
				client.browser === BrowserType.SAFARI ? 200 : 0,
			)
		}
	}

	blur() {
		this.focused = false

		if (this._state().query === "") {
			this.expanded = false

			if (m.route.get().startsWith("/search")) {
				locator.search.result(null)
				setSearchUrl(getSearchUrl("", getRestriction(m.route.get())))
			}
		}
	}

	getMaxWidth(): number {
		return SEARCH_INPUT_WIDTH + 40 // includes  input width + search icon(21) + margin right(15) + spacer(4)
	}

	_updateState(update: Partial<SearchBarState>): SearchBarState {
		const newState = Object.assign({}, this._state(), update)

		this._state(newState)

		return newState
	}
}

// Should be change to not be a singleton and be proper component (instantiated by mithril).
// We need to extract some state of it into some kind of viewModel, pluggable depending on the current view but this requires complete rewrite of SearchBar.
export const searchBar = new SearchBar()

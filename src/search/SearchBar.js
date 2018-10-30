// @flow
import {Type} from "../gui/base/TextField"
import m from "mithril"
import {Icons} from "../gui/base/icons/Icons"
import {logins} from "../api/main/LoginController"
import {inputLineHeight, px, size} from "../gui/size"
import stream from "mithril/stream/stream.js"
import {theme} from "../gui/theme"
import type {AllIconsEnum} from "../gui/base/Icon"
import {Icon} from "../gui/base/Icon"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {BootIcons} from "../gui/base/icons/BootIcons"
import type {PositionRect} from "../gui/base/Overlay"
import {displayOverlay} from "../gui/base/Overlay"
import {NavButton} from "../gui/base/NavButton"
import {Dropdown} from "../gui/base/Dropdown"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {keyManager, Keys} from "../misc/KeyManager"
import {formatDate, formatDateTimeFromYesterdayOn, formatDateWithMonth} from "../misc/Formatter"
import {getFolderIcon, getSenderOrRecipientHeading, isTutanotaTeamMail} from "../mail/MailUtils"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {mod} from "../misc/MathUtils"
import type {RouteChangeEvent} from "../misc/RouteChange"
import {routeChange} from "../misc/RouteChange"
import {lang} from "../misc/LanguageViewModel"
import {NotAuthorizedError, NotFoundError} from "../api/common/error/RestError"
import {getRestriction, getSearchUrl, isAdministratedGroup, setSearchUrl} from "./SearchUtils"
import {locator} from "../api/main/MainLocator"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {FULL_INDEXED_TIMESTAMP} from "../api/common/TutanotaConstants"
import {Button} from "../gui/base/Button"
import {assertMainOrNode, isApp} from "../api/Env"
import {compareContacts} from "../contacts/ContactUtils"
import {mailModel} from "../mail/MailModel"
import {WhitelabelChildTypeRef} from "../api/entities/sys/WhitelabelChild"
import {styles} from "../gui/styles"
import {client} from "../misc/ClientDetector";
import {downcast} from "../api/common/utils/Utils"
import {load} from "../api/main/Entity"
import {PageSize} from "../gui/base/List"
import {BrowserType} from "../misc/ClientConstants"
import Badge from "../gui/base/Badge"

assertMainOrNode()

type ShowMoreAction = {
	resultCount: number,
	shownCount: number,
	indexTimestamp: number,
	allowShowMore: boolean
}

type SearchBarAttrs = {
	classes?: string,
	style?: { [string]: string },
	alwaysExpanded?: boolean,
	spacer?: boolean,
	placeholder?: ?string
}

const SEARCH_INPUT_WIDTH = 200 // includes input field and close/progress icon

const MAX_SEARCH_PREVIEW_RESULTS = 10

export class SearchBar implements Component {
	view: Function;
	_domInput: HTMLInputElement;
	_domWrapper: HTMLElement;
	value: Stream<string>;
	focused: boolean;
	expanded: boolean;
	dropdown: Dropdown;
	skipNextBlur: boolean;
	_results: Array<Mail | Contact | GroupInfo | WhitelabelChild | ShowMoreAction>;
	oncreate: Function;
	onbeforeremove: Function;
	busy: boolean;
	_selected: ?Mail | Contact | GroupInfo | WhitelabelChild | ShowMoreAction;
	_groupInfoRestrictionListId: ?Id;
	lastSelectedGroupInfoResult: Stream<GroupInfo>;
	lastSelectedWhitelabelChildrenInfoResult: Stream<WhitelabelChild>;
	_closeOverlayFunction: ?(() => void);
	_overlayContentComponent: { view: () => Children };

	constructor() {
		this._groupInfoRestrictionListId = null
		this.lastSelectedGroupInfoResult = stream()
		this.lastSelectedWhitelabelChildrenInfoResult = stream()
		this.expanded = false
		this.focused = false
		this.skipNextBlur = false
		this.busy = false
		this.value = stream("")
		this.value.map(v => {
			if (v) {
				this.expanded = true
			}
		})
		locator.search.lastQuery.map(this.value)
		let b = new NavButton('search_label', () => BootIcons.Mail, () => "/search", "/search")
		this.dropdown = new Dropdown(() => [b], 250)
		this._results = []
		this._overlayContentComponent = {view: () => null}
		this.view = (vnode: Vnode<SearchBarAttrs>): VirtualElement => {
			return m(".flex.flex-no-grow" + (vnode.attrs.classes || ""), {style: vnode.attrs.style}, [
				m(".search-bar.flex-end.items-center", {
					oncreate: (vnode) => {
						this._domWrapper = vnode.dom
					},
					style: {
						'min-height': px(inputLineHeight + 2), // 2 px border
						'padding-bottom': this.expanded ? (this.focused ? px(0) : px(1)) : px(2),
						'padding-top': px(2), // center input field
						'margin-right': px(styles.isDesktopLayout() ? 15 : 8),
						'border-bottom': vnode.attrs.alwaysExpanded
						|| this.expanded ? (this.focused ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`) : "0px",
						'align-self': "center",
						'max-width': px(400),
						'flex': "1"
					}
				}, [
					styles.isDesktopLayout() ? m(".ml-negative-xs.click", {
						onmousedown: (e) => {
							if (this.focused) {
								this.skipNextBlur = true // avoid closing of overlay when clicking search icon
							}
						},
						onclick: (e) => {
							e.preventDefault()
							this.handleSearchClick(e)
						}
					}, m(Icon, {
						icon: BootIcons.Search,
						class: "flex-center items-center icon-large",
						style: {
							fill: this.focused ? theme.header_button_selected : theme.header_button,
							//"margin-top": (this._hideLabel) ? "0px" : "-2px"
						}
					})) : null,
					m(".searchInputWrapper.flex.items-center", {
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
									"width": this.inputWrapperWidth(!!vnode.attrs.alwaysExpanded),
									"transition": `width ${DefaultAnimationTime}ms`,
									'padding-left': paddingLeft,
									'padding-top': '3px',
									'padding-bottom': '3px',
									'overflow-x': 'hidden',
								}
							})()
						},
						[
							this._getInputField(vnode.attrs), m(".closeIconWrapper", {
							onclick: (e) => this.close(),
							style: {width: size.icon_size_large}
						}, this.busy ? m(Icon, {
							icon: BootIcons.Progress,
							class: 'flex-center items-center icon-progress-search icon-progress'
						}) : m(Icon, {
							icon: Icons.Close,
							class: "flex-center items-center icon-large",
							style: {
								fill: theme.header_button
							}
						}))
						]
					),

				]),
				(vnode.attrs.spacer ? m(".nav-bar-spacer") : null)
			])
		}
		let shortcuts = null

		let indexStateStream
		let routeChangeStream
		this.oncreate = () => {
			shortcuts = this._setupShortcuts()
			keyManager.registerShortcuts(shortcuts)
			indexStateStream = locator.search.indexState.map((newState: SearchIndexStateInfo) => {
				this.showIndexingProgress(newState, m.route.get())
				m.redraw() // redraw in any case, especially to show the search bar after the db is initialized
				// Fix bug in current Safari with losing focus
				if (this.focused) {
					setTimeout(() => this._domInput.focus(), 50)
				}
			})
			routeChangeStream = routeChange.map((e: RouteChangeEvent) => {
				if (e.requestedPath.startsWith("/search/mail")) {
					let indexState = locator.search.indexState()
					this.showIndexingProgress(indexState, e.requestedPath)
				} else {
					this._closeOverlay()
				}
			})
		}
		this.onbeforeremove = () => {
			shortcuts && keyManager.unregisterShortcuts(shortcuts)
			if (indexStateStream) {
				indexStateStream.end(true)
			}
			if (routeChangeStream) {
				routeChangeStream.end(true)
			}
			this._closeOverlay()
		}
	}

	inputWrapperWidth(alwaysExpanded: boolean): ?string {
		if (alwaysExpanded) {
			return "100%"
		} else {
			return this.expanded ? px(SEARCH_INPUT_WIDTH) : px(0)
		}
	}

	showIndexingProgress(newState: SearchIndexStateInfo, route: string) {
		if (this._domWrapper && newState.progress > 0 && ((this.focused && route.startsWith("/mail"))
			|| (route.startsWith("/search/mail") && newState.progress <= 100))) {
			let cancelButton = new Button("cancel_action", () => {
				worker.cancelMailIndexing()
			}, () => Icons.Cancel)
			this._showOverlay(() => {
				return m(".plr-l.pt-s.pb-s.flex.items-center.flex-space-between", {
					style: {
						height: px(52)
					}
				}, [
					m("", lang.get("createSearchIndex_msg", {"{progress}": newState.progress})),
					newState.progress !== 100
						? m("div", {onmousedown: e => this.skipNextBlur = true,}, m(cancelButton)) : null // avoid closing overlay before the click event can be received
				])
			})
		} else if ((route.startsWith("/search/mail") && newState.progress === 0)) {
			this._closeOverlay()
		}
	}

	/**
	 * Replace contents of the overlay if it was shown or display a new one
	 * if it wasn't
	 * @param contentFunction what to show in overlay
	 * @private
	 */
	_showOverlay(contentFunction: () => Children) {
		this._overlayContentComponent.view = contentFunction;
		if (this._closeOverlayFunction == null) {
			this._closeOverlayFunction = displayOverlay(this._makeOverlayRect(), this._overlayContentComponent)
		} else {
			m.redraw()
		}
	}

	_closeOverlay() {
		if (this._closeOverlayFunction) {
			this._closeOverlayFunction()
			this._closeOverlayFunction = null
			this._overlayContentComponent.view = () => null
		}
	}

	_makeOverlayRect(): PositionRect {
		let overlayRect: PositionRect
		if (styles.isDesktopLayout()) {
			const domRect = this._domWrapper.getBoundingClientRect()
			overlayRect = {
				top: px(domRect.bottom + 5),
				right: px(window.innerWidth - domRect.right),
				width: px(350)
			}
		} else {
			overlayRect = {
				top: px(size.navbar_height_mobile + 6),
				left: px(16),
				right: px(16),
			}
		}
		return overlayRect
	}

	_setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.F,
				enabled: () => true,
				exec: key => {
					this.focus()
					m.redraw()
				},
				help: "search_label"
			},
		]


	}

	// TODO: remove this and take the list id from the url as soon as the list id is included in user and group settings
	setGroupInfoRestrictionListId(listId: Id) {
		this._groupInfoRestrictionListId = listId
	}

	_downloadResults(searchResult: SearchResult): Promise<Array<Mail | Contact | GroupInfo | WhitelabelChild | ShowMoreAction>> {
		if (searchResult.results.length === 0) {
			return Promise.resolve([])
		}
		const toFetch = searchResult.results.slice(0, MAX_SEARCH_PREVIEW_RESULTS)
		return Promise.map(toFetch, r => load(searchResult.restriction.type, r)
			.catch(NotFoundError, () => console.log("mail from search index not found"))
			.catch(NotAuthorizedError, () => console.log("no permission on instance from search index")))
	}

	showDropdown(searchResult: SearchResult) {
		let newResults = []
		this._downloadResults(searchResult)
			.then(resultInstances => {
				let filteredInstances = resultInstances.filter(instance => instance) // filter not found results

				// filter group infos for local admins
				if (isSameTypeRef(GroupInfoTypeRef, searchResult.restriction.type) && !logins.getUserController()
					.isGlobalAdmin()) {
					let localAdminGroupIds = logins.getUserController()
						.getLocalAdminGroupMemberships()
						.map(gm => gm.group)
					filteredInstances = filteredInstances.filter(gi => isAdministratedGroup(localAdminGroupIds, downcast(gi)))
				}
				if (isSameTypeRef(searchResult.restriction.type, ContactTypeRef)) {
					filteredInstances.sort((o1, o2) => compareContacts((o1: any), (o2: any)))
				}
				newResults.push(...filteredInstances)
			})
			.then(() => {
				if (this.value() === searchResult.query) {
					this._results = newResults
					let resultCount = (searchResult.results.length)
					if (resultCount === 0
						|| searchResult.moreResultsEntries.length > 0
						|| searchResult.currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP) {
						this._results.push({
							resultCount: resultCount,
							shownCount: this._results.length,
							indexTimestamp: searchResult.currentIndexTimestamp,
							allowShowMore: !isSameTypeRef(searchResult.restriction.type, GroupInfoTypeRef)
							&& !isSameTypeRef(searchResult.restriction.type, WhitelabelChildTypeRef)
						}) // add SearchMoreAction
					}
					if (this._results.length > 0) {
						this._selected = this._results[0]
					} else {
						this._selected = null
					}
				}
				if (this._domWrapper != null && this.value().trim() != "" && this.focused) {
					this._showOverlay(() =>
						m("ul.list.click.mail-list", [
							this._results.map(result => {
								return m("li.plr-l.flex-v-center.", {
									style: {
										height: px(52),
										'border-left': px(size.border_selection) + " solid transparent",
									},
									onmousedown: e => this.skipNextBlur = true, // avoid closing overlay before the click event can be received
									onclick: e => this._selectResult(result),
									class: this._selected === result ? "row-selected" : "",
								}, this.renderResult(result))
							}),
						]))
				}
				// updates the suggestion list if the dropdown is already visible
				m.redraw()
			})
	}

	renderResult(result: Mail | Contact | GroupInfo | WhitelabelChild | ShowMoreAction) {
		let type: ?TypeRef = result._type ? result._type : null
		if (!type) { // show more action
			let showMoreAction = ((result: any): ShowMoreAction)
			let infoText
			let indexInfo
			if (showMoreAction.resultCount === 0) {
				infoText = lang.get("searchNoResults_msg")
				if (logins.getUserController().isFreeAccount()) {
					indexInfo = lang.get("changeTimeFrame_msg")
				}
			} else if (showMoreAction.allowShowMore) {
				infoText = lang.get("showMore_action")
			} else {
				infoText = lang.get("moreResultsFound_msg", {
					"{1}": showMoreAction.resultCount - showMoreAction.shownCount
				})
			}
			if (showMoreAction.indexTimestamp > FULL_INDEXED_TIMESTAMP && !indexInfo) {
				indexInfo = lang.get("searchedUntil_msg") + " "
					+ formatDate(new Date(showMoreAction.indexTimestamp))
			}

			return indexInfo ? [
				m(".top.flex-center", infoText), m(".bottom.flex-center.small", indexInfo)
			] : m("li.plr-l.pt-s.pb-s.items-center.flex-center", m(".flex-center", infoText))

		} else if (isSameTypeRef(MailTypeRef, type)) {
			let mail = ((result: any): Mail)
			return [
				m(".top.flex-space-between.badge-line-height", [
					isTutanotaTeamMail(mail) ? m(Badge, {classes: ".small.mr-s"}, "Tutanota Team") : null,
					m("small.text-ellipsis", getSenderOrRecipientHeading(mail, true)),
					m("small.text-ellipsis.flex-fixed", formatDateTimeFromYesterdayOn(mail.receivedDate))
				]),
				m(".bottom.flex-space-between", [
					m(".text-ellipsis", mail.subject),
					m(".icons.flex-fixed", {style: {"margin-right": "-3px"}}, [ // 3px to neutralize the svg icons internal border border
						m(Icon, {
							icon: this._getMailFolderIcon(mail),
							class: this._selected === result ? "svg-content-accent-fg" : "svg-content-fg",
						}),
						m(Icon, {
							icon: Icons.Attachment,
							class: this._selected === result ? "svg-content-accent-fg" : "svg-content-fg",
							style: {display: mail.attachments.length > 0 ? '' : 'none'},
						}),
					])
				])
			]
		} else if (isSameTypeRef(ContactTypeRef, type)) {
			let contact = ((result: any): Contact)
			return [
				m(".top.flex-space-between",
					m(".name", contact.firstName + " " + contact.lastName),
				),
				m(".bottom.flex-space-between",
					m("small.mail-address", (contact.mailAddresses && contact.mailAddresses.length
						> 0) ? contact.mailAddresses[0].address : ""),
				)
			]
		} else if (isSameTypeRef(GroupInfoTypeRef, type)) {
			let groupInfo = ((result: any): GroupInfo)
			return [
				m(".top.flex-space-between",
					m(".name", groupInfo.name),
				),
				m(".bottom.flex-space-between", [
					m("small.mail-address", groupInfo.mailAddress),
					m(".icons.flex", [
						(groupInfo.deleted) ? m(Icon, {
							icon: Icons.Trash,
							class: "svg-list-accent-fg",
						}) : null,
						(!groupInfo.mailAddress && m.route.get().startsWith('/settings/groups')) ? m(Icon, {
							icon: BootIcons.Settings,
							class: "svg-list-accent-fg",
						}) : null,
						(groupInfo.mailAddress && m.route.get().startsWith('/settings/groups')) ? m(Icon, {
							icon: BootIcons.Mail,
							class: "svg-list-accent-fg",
						}) : null
					])
				])
			]
		} else if (isSameTypeRef(WhitelabelChildTypeRef, type)) {
			let whitelabelChild = ((result: any): WhitelabelChild)
			return [
				m(".top.flex-space-between",
					m(".name", whitelabelChild.mailAddress),
				),
				m(".bottom.flex-space-between", [
					m("small.mail-address", formatDateWithMonth(whitelabelChild.createdDate)),
					m(".icons.flex", [
						(whitelabelChild.deletedDate) ? m(Icon, {
							icon: Icons.Trash,
							class: "svg-list-accent-fg",
						}) : null
					])
				])
			]
		}
	}

	_getMailFolderIcon(mail: Mail): AllIconsEnum {
		let folder = mailModel.getMailFolder(mail._id[0])
		if (folder) {
			return getFolderIcon(folder)()
		} else {
			return Icons.Folder
		}
	}

	_selectResult(result: ?Mail | Contact | GroupInfo | WhitelabelChild | ShowMoreAction) {
		if (result != null) {
			this._closeOverlay()
			this._domInput.blur()
			let type: ?TypeRef = result._type ? result._type : null
			if (!type) { // click on SHOW MORE button
				if (result.allowShowMore) {
					setSearchUrl(getSearchUrl(this.value(), getRestriction(m.route.get())))
				}
			} else if (isSameTypeRef(MailTypeRef, type)) {
				let mail: Mail = downcast(result)
				setSearchUrl(getSearchUrl(this.value(), getRestriction(m.route.get()), mail._id[1]))
			} else if (isSameTypeRef(ContactTypeRef, type)) {
				let contact: Contact = downcast(result)
				setSearchUrl(getSearchUrl(this.value(), getRestriction(m.route.get()), contact._id[1]))
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

	search() {
		let value = this.value()
		let restriction = getRestriction(m.route.get())
		if (isSameTypeRef(restriction.type, GroupInfoTypeRef)) {
			restriction.listId = this._groupInfoRestrictionListId
		}

		if (!locator.search.indexState().mailIndexEnabled && restriction
			&& isSameTypeRef(restriction.type, MailTypeRef)) {
			this.expanded = false
			Dialog.confirm("enableSearchMailbox_msg", "search_label").then(confirmed => {
				if (confirmed) {
					worker.enableMailIndexing().then(() => {
						this.search()
						this.focus()
					})
				}
			})

		} else {
			if (value.trim() === "") {
				this.busy = false
				if (m.route.get().startsWith("/search")) {
					setSearchUrl(getSearchUrl("", restriction))
				}
			} else if (!locator.search.isNewSearch(value, restriction)) {
				const result = locator.search.result()
				if (!m.route.get().startsWith("/search") && result) {
					this.showDropdown(result)
				}
				this.busy = false
			} else {
				this.busy = true
				setTimeout(() => {
					if (value === this.value()) {
						if (this.value().trim() !== "") {
							let useSuggestions = m.route.get().startsWith("/settings")
							const isQuickSearch = !m.route.get().startsWith("/search")
							locator.search.search(value, restriction, useSuggestions ? 10 : 0,
								isSameTypeRef(MailTypeRef, restriction.type)
									? isQuickSearch ? MAX_SEARCH_PREVIEW_RESULTS : PageSize
									: null)
								.then(result => {
									if (m.route.get().startsWith("/search")) {
										// instances will be displayed as part of the list of the search view, when the search view is displayed
										this.busy = false
										setSearchUrl(getSearchUrl(value, restriction))
									} else {
										this.showDropdown(result)
									}
								})
								.finally(() => {
									this.busy = false
									m.redraw()
								})
						} else {
							this.busy = false
						}
					} else if (this.value().trim() === "") {
						locator.search.lastQuery("")
						locator.search.result(null)
						this.busy = false
					}
					m.redraw()
				}, 500)
			}

		}
	}

	close() {
		if (this.expanded) {
			this.expanded = false
			this.value("")
			this._domInput.blur() // remove focus from the input field in case ESC is pressed
			this._closeOverlay()
		}
		if (m.route.get().startsWith("/search")) {
			locator.search.result(null)
			setSearchUrl(getSearchUrl("", getRestriction(m.route.get())))
		}
	}

	_getInputField(attrs: any): VirtualElement {
		return m("input.input.input-no-clear", {
			placeholder: attrs.placeholder,
			type: Type.Text,
			value: this.value(),
			oncreate: (vnode) => {
				this._domInput = vnode.dom
			},
			onfocus: (e) => this.focus(),
			onblur: e => {
				if (this.skipNextBlur) {
					setTimeout(() => this._domInput.focus(), 0) // setTimeout needed in Firefox to keep focus
				} else {
					this.blur(e)
				}
				this.skipNextBlur = false
			},
			onremove: () => {
				this._domInput.onblur = null
			},
			oninput: e => {
				if (this.value() !== this._domInput.value) {
					this.value(this._domInput.value) // update the input on each change
					let value = this.value()
					if (value.trim() === "") {
						this._closeOverlay()
						locator.search.result(null)
						if (m.route.get().startsWith("/search")) {
							setSearchUrl(getSearchUrl("", getRestriction(m.route.get())))
						}
					} else {
						this.search()
					}
				}
			},
			onkeydown: e => {
				let keyCode = e.which
				if (keyCode === Keys.ESC.code) {
					this.close()
				} else if (keyCode === Keys.RETURN.code) {
					if (this._selected) {
						this._selectResult(this._selected)
					} else {
						if (isApp()) {
							this._domInput.blur()
						} else {
							this.search()
						}
					}
				} else if (keyCode === Keys.UP.code) {
					if (this._results.length > 0) {
						let selected = this._selected ? this._selected : this._results[0]
						this._selected = this._results[mod(this._results.indexOf(selected) - 1, this._results.length)]
					}
				} else if (keyCode === Keys.DOWN.code) {
					if (this._results.length > 0) {
						let selected = this._selected ? this._selected : this._results[0]
						this._selected = this._results[mod(this._results.indexOf(selected) + 1, this._results.length)]
					}
				}
				// disable key bindings
				e.stopPropagation()
				return true
			},
			style: {
				"line-height": px(inputLineHeight)
			}
		})
	}


	focus() {
		if (!this.focused) {
			this.focused = true
			this.expanded = true
			// setTimeout to fix bug in current Safari with losing focus
			setTimeout(() => {
				this._domInput.select()
				this._domInput.focus()
				this.showIndexingProgress(locator.search.indexState(), m.route.get())
				this.search()
			}, client.browser === BrowserType.SAFARI ? 200 : 0)
			//this._domWrapper.classList.add("active")
		}
	}

	blur(e: MouseEvent) {
		//this._domInput.classList.remove("active")
		this.focused = false
		this._closeOverlay()
		if (this.value().trim() === "") {
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
}

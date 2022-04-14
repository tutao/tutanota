import m, {Children} from "mithril"
import {ViewSlider} from "../../gui/base/ViewSlider"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {
	FeatureType,
	FULL_INDEXED_TIMESTAMP,
	Keys,
	MailFolderType,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType
} from "../../api/common/TutanotaConstants"
import stream from "mithril/stream"
import {assertMainOrNode} from "../../api/common/Env"
import {keyManager, Shortcut} from "../../misc/KeyManager"
import type {NavButtonAttrs} from "../../gui/base/NavButtonN"
import {isNavButtonSelected, NavButtonColor, NavButtonN} from "../../gui/base/NavButtonN"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {ContactTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {SearchListView, SearchResultListEntry} from "./SearchListView"
import {size} from "../../gui/size"
import {SearchResultDetailsViewer} from "./SearchResultDetailsViewer"
import {
	createRestriction,
	getFreeSearchStartDate,
	getRestriction,
	getSearchUrl,
	SEARCH_CATEGORIES,
	SEARCH_MAIL_FIELDS,
	setSearchUrl,
} from "../model/SearchUtils"
import {MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {Dialog} from "../../gui/base/Dialog"
import {locator} from "../../api/main/MainLocator"
import {DropDownSelector} from "../../gui/base/DropDownSelector"
import {getFolderName, getSortedCustomFolders, getSortedSystemFolders} from "../../mail/model/MailUtils"
import {
	getEndOfDay,
	getStartOfDay,
	isSameDay,
	isSameTypeRef,
	isToday,
	neverNull,
	noOp,
	ofClass,
	promiseMap,
	TypeRef
} from "@tutao/tutanota-utils"
import {formatDateWithMonth, formatDateWithTimeIfNotEven} from "../../misc/Formatter"
import {showDateRangeSelectionDialog} from "../../gui/date/DatePickerDialog"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import {PageSize} from "../../gui/base/List"
import {MultiSelectionBar} from "../../gui/base/MultiSelectionBar"
import type {CurrentView} from "../../gui/base/Header"
import {header} from "../../gui/base/Header"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {getStartOfTheWeekOffsetForUser} from "../../calendar/date/CalendarUtils"
import {ButtonColor, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {PermissionError} from "../../api/common/error/PermissionError"
import {ContactEditor} from "../../contacts/ContactEditor"
import {styles} from "../../gui/styles"
import {FolderColumnView} from "../../gui/base/FolderColumnView"
import {ActionBar} from "../../gui/base/ActionBar"
import {getGroupInfoDisplayName} from "../../api/common/utils/GroupUtils"
import {isNewMailActionAvailable} from "../../gui/nav/NavFunctions"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {SidebarSection} from "../../gui/SidebarSection"
import type {clickHandler} from "../../gui/base/GuiUtils"
import {Entity, SomeEntity} from "../../api/common/EntityTypes"

assertMainOrNode()

export class SearchView implements CurrentView {
	resultListColumn: ViewColumn
	resultDetailsColumn: ViewColumn
	folderColumn: ViewColumn
	private _viewer: SearchResultDetailsViewer
	viewSlider: ViewSlider
	private _searchList: SearchListView
	view: CurrentView["view"]
	oncreate: CurrentView["oncreate"]
	onremove: CurrentView["onremove"]
	private _mailFolder: NavButtonAttrs
	private _contactFolder: NavButtonAttrs
	private _endDate: Date | null // null = today

	private _startDate: Date | null // null = current mail index date. this allows us to start the search (and the url) without end date set

	private _mailFolderSelection: DropDownSelector<string | null> | null = null
	private _mailFieldSelection: DropDownSelector<string | null> | null = null
	private _doNotUpdateQuery: boolean

	constructor() {
		this._mailFolder = {
			label: "emails_label",
			icon: () => BootIcons.Mail,
			href: () => this._getCurrentSearchUrl("mail", null),
			isSelectedPrefix: "/search/mail",
			colors: NavButtonColor.Nav,
		}
		this._contactFolder = {
			label: "contacts_label",
			icon: () => BootIcons.Contacts,
			href: "/search/contact",
			colors: NavButtonColor.Nav,
		}
		this._endDate = null
		this._startDate = null
		let mailAttributes = SEARCH_MAIL_FIELDS.map(f => {
			return {
				name: lang.get(f.textId),
				value: f.field,
			}
		})
		this._mailFieldSelection = new DropDownSelector("field_label", null, mailAttributes, stream(mailAttributes[0].value), 250)
		this._doNotUpdateQuery = true // the stream obeserver is immediately called when map() is called and we must not search again now

		this._mailFieldSelection.selectedValue.map(newValue => {
			if (logins.getUserController().isFreeAccount()) {
				if (newValue != null) {
					neverNull(this._mailFieldSelection).selectedValue(null)
					showNotAvailableForFreeDialog(true)
				}
			} else {
				this._searchAgain()
			}
		})

		this._doNotUpdateQuery = false
		locator.mailModel.mailboxDetails.map(mailboxes => {
			const mailFolders: {name: string, value: Id | null}[] = [
				{
					name: lang.get("all_label"),
					value: null,
				},
			]
			mailboxes.forEach((mailbox, mailboxIndex) => {
				getSortedSystemFolders(mailbox.folders)
					.concat(getSortedCustomFolders(mailbox.folders))
					.forEach(folder => {
						if (folder.folderType !== MailFolderType.SPAM) {
							mailFolders.push({
								name: getFolderName(folder) + (mailboxIndex === 0 ? "" : " (" + getGroupInfoDisplayName(mailbox.mailGroupInfo) + ")"),
								value: folder.mails,
							})
						}
					})
			})
			let newSelection = this._mailFolderSelection ? this._mailFolderSelection.selectedValue() : mailFolders[0].value

			if (!mailFolders.find(f => f.value === newSelection)) {
				newSelection = mailFolders[0].value
			}

			this._mailFolderSelection = new DropDownSelector("mailFolder_label", null, mailFolders, stream(newSelection), 250)
			this._doNotUpdateQuery = true

			this._mailFolderSelection.selectedValue.map(newValue => {
				if (logins.getUserController().isFreeAccount()) {
					if (newValue != null) {
						neverNull(this._mailFolderSelection).selectedValue(null)
						showNotAvailableForFreeDialog(true)
					}
				} else {
					this._searchAgain()
				}
			})

			this._doNotUpdateQuery = false
		})
		this.folderColumn = new ViewColumn(
			{
				view: () => {
					const restriction = getRestriction(m.route.get())
					return m(FolderColumnView, {
						button: this.getMainButton(restriction.type),
						content: [
							m(
								SidebarSection,
								{
									name: "search_label",
								},
								[
									m(
										".folder-row.flex-start.plr-l",
										{
											class: isNavButtonSelected(this._mailFolder) ? "row-selected" : "",
										},
										m(NavButtonN, this._mailFolder),
									),
									m(
										".folder-row.flex-start.plr-l",
										{
											class: isNavButtonSelected(this._contactFolder) ? "row-selected" : "",
										},
										m(NavButtonN, this._contactFolder),
									),
								],
							),
							isNavButtonSelected(this._mailFolder)
								? m(
									SidebarSection,
									{
										name: "filter_label",
									},
									this._renderSearchFilters(),
								)
								: null,
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			size.first_col_min_width,
			size.first_col_max_width,
			() => lang.get("search_label"),
		)
		this._searchList = new SearchListView(this)
		this.resultListColumn = new ViewColumn(
			{
				view: () => m(".list-column", [m(this._searchList)]),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => lang.get("searchResult_label"),
		)
		this._viewer = new SearchResultDetailsViewer(this._searchList)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => m(".search", m(this._viewer)),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], "ContactView")

		this.view = (): Children => {
			return m("#search.main-view", m(this.viewSlider))
		}

		this._setupShortcuts()

		locator.eventController.addEntityListener(updates => {
			return promiseMap(updates, update => {
				return this.entityEventReceived(update)
			}).then(noOp)
		})
	}

	_renderSearchFilters(): Children {
		return [
			this._getUpdatedTimeField(),
			this._mailFieldSelection ? m(this._mailFieldSelection) : null,
			this._mailFolderSelection ? m(this._mailFolderSelection) : null,
		].map(row => m(".folder-row.plr-l.content-fg", row))
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	headerRightView(): Children {
		const restriction = getRestriction(m.route.get())
		return styles.isUsingBottomNavigation()
			? isSameTypeRef(restriction.type, MailTypeRef) && isNewMailActionAvailable()
				? m(ButtonN, {
					click: () => {
						newMailEditor()
							.then(editor => editor.show())
							.catch(ofClass(PermissionError, noOp))
					},
					label: "newMail_action",
					type: ButtonType.Action,
					colors: ButtonColor.Header,
					icon: () => Icons.PencilSquare,
				})
				: isSameTypeRef(restriction.type, ContactTypeRef)
					? m(ButtonN, {
						click: () => {
							locator.contactModel.contactListId().then(contactListId => {
								new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
							})
						},
						label: "newContact_action",
						type: ButtonType.Action,
						colors: ButtonColor.Header,
						icon: () => Icons.Add,
					})
					: null
			: null
	}

	/**
	 * @returns null if the complete mailbox is indexed
	 */
	_getCurrentMailIndexDate(): Date | null {
		let timestamp = locator.search.indexState().currentMailIndexTimestamp

		if (timestamp === FULL_INDEXED_TIMESTAMP) {
			return null
		} else if (timestamp === NOTHING_INDEXED_TIMESTAMP) {
			return getEndOfDay(new Date())
		} else {
			return new Date(timestamp)
		}
	}

	_getUpdatedTimeField(): Children {
		let end: string
		let start: string

		if (logins.getUserController().isFreeAccount()) {
			end = lang.get("today_label")
			start = formatDateWithMonth(getFreeSearchStartDate())
		} else {
			if (this._endDate) {
				end = formatDateWithTimeIfNotEven(this._endDate)
			} else {
				end = lang.get("today_label")
			}

			if (this._startDate) {
				start = formatDateWithTimeIfNotEven(this._startDate)
			} else {
				let currentIndexDate = this._getCurrentMailIndexDate()

				if (currentIndexDate) {
					if (isSameDay(currentIndexDate, new Date())) {
						start = lang.get("today_label")
					} else {
						start = formatDateWithTimeIfNotEven(currentIndexDate)
					}
				} else {
					start = lang.get("unlimited_label")
				}
			}
		}

		const timeDisplayValue = start + " - " + end
		const changeTimeButtonAttrs = {
			label: "selectPeriodOfTime_label",
			click: async () => {
				if (logins.getUserController().isFreeAccount()) {
					showNotAvailableForFreeDialog(true)
				} else {
					const startOfWeek = getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot)
					const {end, start} = await showDateRangeSelectionDialog(
						startOfWeek,
						this._startDate ?? this._getCurrentMailIndexDate() ?? new Date(),
						this._endDate ?? new Date(),
					)

					if (end && isToday(end)) {
						this._endDate = null
					} else {
						this._endDate = end
					}

					let current = this._getCurrentMailIndexDate()

					if (start && current && isSameDay(current, start)) {
						this._startDate = null
					} else {
						this._startDate = start
					}

					this._searchAgain()
				}
			},
			icon: () => Icons.Edit,
		} as const
		const timeDisplayAttrs = {
			label: "periodOfTime_label",
			value: stream(timeDisplayValue),
			disabled: true,
			injectionsRight: () => [m(ButtonN, changeTimeButtonAttrs)],
		} as const
		return m(TextFieldN, timeDisplayAttrs)
	}

	_searchAgain(): void {
		// only run the seach if all stream observers are initialized
		if (!this._doNotUpdateQuery) {
			const startDate = this._startDate

			if (startDate && startDate.getTime() < locator.search.indexState().currentMailIndexTimestamp) {
				Dialog.confirm("continueSearchMailbox_msg", "search_label").then(confirmed => {
					if (confirmed) {
						locator.indexerFacade.extendMailIndex(startDate.getTime()).then(() => {
							setSearchUrl(this._getCurrentSearchUrl(this._getCategory(), null))
						})
					}
				})
			} else {
				setSearchUrl(this._getCurrentSearchUrl(this._getCategory(), null))
			}
		}
	}

	_getCurrentSearchUrl(searchCategory: string, selectedId: Id | null): string {
		let restriction = createRestriction(
			searchCategory,
			this._endDate ? getEndOfDay(this._endDate).getTime() : null,
			this._startDate ? getStartOfDay(this._startDate).getTime() : null,
			this._mailFieldSelection && this._mailFieldSelection.selectedValue(),
			this._mailFolderSelection && this._mailFolderSelection.selectedValue(),
		)
		return getSearchUrl(locator.search.lastQuery(), restriction, selectedId ?? undefined)
	}

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.UP,
				exec: () => this._searchList.selectPrevious(false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.K,
				exec: () => this._searchList.selectPrevious(false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.UP,
				shift: true,
				exec: () => this._searchList.selectPrevious(true),
				help: "addPrevious_action",
			},
			{
				key: Keys.K,
				shift: true,
				exec: () => this._searchList.selectPrevious(true),
				help: "addPrevious_action",
			},
			{
				key: Keys.DOWN,
				exec: () => this._searchList.selectNext(false),
				help: "selectNext_action",
			},
			{
				key: Keys.J,
				exec: () => this._searchList.selectNext(false),
				help: "selectNext_action",
			},
			{
				key: Keys.DOWN,
				shift: true,
				exec: () => this._searchList.selectNext(true),
				help: "addNext_action",
			},
			{
				key: Keys.J,
				shift: true,
				exec: () => this._searchList.selectNext(true),
				help: "addNext_action",
			},
			{
				key: Keys.N,
				exec: () => {
					const restriction = getRestriction(m.route.get()).type

					if (isSameTypeRef(restriction, MailTypeRef)) {
						newMailEditor()
							.then(editor => editor.show())
							.catch(ofClass(PermissionError, noOp))
					} else if (isSameTypeRef(restriction, ContactTypeRef)) {
						locator.contactModel.contactListId().then(contactListId => {
							new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
						})
					}
				},
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.ReplyOnly),
				help: "newMail_action",
			},
			{
				key: Keys.DELETE,
				exec: () => this._searchList.deleteSelected(),
				help: "delete_action",
			},
			{
				key: Keys.A,
				exec: () => this._searchList.archiveSelected(),
				help: "archive_action",
			},
			{
				key: Keys.I,
				exec: () => this._searchList.moveSelectedToInbox(),
				help: "moveToInbox_action",
			},
		] as Array<Shortcut>

		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			neverNull(header.searchBar).setReturnListener(() => this.resultListColumn.focus())
		}

		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
			neverNull(header.searchBar).setReturnListener(noOp)
		}
	}

	elementSelected(entries: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		this._viewer.elementSelected(entries, elementClicked, selectionChanged, multiSelectOperation)

		if (entries.length === 1 && !multiSelectOperation && (selectionChanged || !this._viewer._viewer)) {
			// do not set the search url if an element is removed from this list by another view
			if (m.route.get().startsWith("/search")) {
				setSearchUrl(getSearchUrl(locator.search.lastQuery(), getRestriction(m.route.get()), entries[0]._id[1]))
			}
		}

		if (!multiSelectOperation && elementClicked) {
			this._searchList.loading().then(() => {
				this.viewSlider.focus(this.resultDetailsColumn)
			})
		}
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and contactId for the contact view.
	 */
	updateUrl(args: Record<string, any>, requestedPath: string) {
		let restriction

		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			setSearchUrl(getSearchUrl(args.query, createRestriction("mail", null, null, null, null)))
			return
		}

		const lastQuery = locator.search.lastQuery()
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? PageSize : null

		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		if (args.hasOwnProperty("query")) {
			if (locator.search.isNewSearch(args.query, restriction)) {
				locator.search.search({
					query: args.query,
					restriction,
					minSuggestionCount: 0,
					maxResults,
				})
			}
		} else if (lastQuery && locator.search.isNewSearch(lastQuery, restriction)) {
			// If query is not set for some reason (e.g. switching search type), use the last query value
			locator.search.search({
				query: lastQuery,
				restriction,
				minSuggestionCount: 0,
				maxResults,
			})
		}

		// update the filters
		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			this._doNotUpdateQuery = true
			this._endDate = restriction.start ? new Date(restriction.start) : null
			this._startDate = restriction.end ? new Date(restriction.end) : null
			this._mailFolderSelection && this._mailFolderSelection.selectedValue(restriction.listId)
			this._mailFieldSelection && this._mailFieldSelection.selectedValue(restriction.field)
			this._doNotUpdateQuery = false
		}

		if (args.id && this._searchList.isListAvailable() && !this._searchList.isEntitySelected(args.id)) {
			// the mail list is visible already, just the selected mail is changed
			this._searchList.scrollToIdAndSelect(args.id)
		} else if (!args.id && this._searchList.isListAvailable() && this._searchList.getSelectedEntities().length > 0) {
			this._searchList.selectNone()
		}
	}

	_getCategory(): string {
		let restriction = getRestriction(m.route.get())
		return neverNull(SEARCH_CATEGORIES.find(c => isSameTypeRef(c.typeRef, restriction.type))).name
	}

	entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(MailTypeRef, update) || isUpdateForTypeRef(ContactTypeRef, update)) {
			const {instanceListId, instanceId, operation} = update
			const id = [neverNull(instanceListId), instanceId] as const
			const typeRef = new TypeRef<SomeEntity>(update.application, update.type)

			if (this._searchList.isInSearchResult(typeRef, id)) {
				return this._searchList.entityEventReceived(instanceId, operation).then(() => {
					// run the mail or contact update after the update on the list is finished to avoid parallel loading
					if (operation === OperationType.UPDATE && this._viewer && this._viewer.isShownEntity(id)) {
						return locator.entityClient
									  .load(typeRef, id)
									  .then(updatedEntity => {
										  this._viewer.showEntity(updatedEntity, false)
									  })
									  .catch(() => {
										  // ignore. might happen if a mail was just sent
									  })
					}
				})
			} else {
				return Promise.resolve()
			}
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	headerView(): Children {
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 && this._searchList.list && this._searchList.list.isMobileMultiSelectionActionActive()
			? m(MultiSelectionBar, {
				selectNoneHandler: () => this._searchList.selectNone(),
				selectedEntiesLength: this._searchList.getSelectedEntities().length,
				content: {
					view: () =>
						m(ActionBar, {
							buttons: this._viewer.multiSearchActionBarButtons(),
						}),
				},
			})
			: null
	}

	getMainButton(
		typeRef: TypeRef<unknown>,
	):
		| {
		label: TranslationKey
		click: clickHandler
	}
		| null
		| undefined {
		if (styles.isUsingBottomNavigation()) {
			return null
		} else if (isSameTypeRef(typeRef, MailTypeRef) && isNewMailActionAvailable()) {
			return {
				click: () => {
					newMailEditor()
						.then(editor => editor.show())
						.catch(ofClass(PermissionError, noOp))
				},
				label: "newMail_action",
			}
		} else if (isSameTypeRef(typeRef, ContactTypeRef)) {
			return {
				click: () => {
					locator.contactModel.contactListId().then(contactListId => {
						new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
					})
				},
				label: "newContact_action",
			}
		} else {
			return null
		}
	}
}

function newMailEditor(): Promise<Dialog> {
	return Promise.all([locator.mailModel.getUserMailboxDetails(), import("../../mail/editor/MailEditor")]).then(([mailboxDetails, {newMailEditor}]) => {
		return newMailEditor(mailboxDetails)
	})
}
import m, {Children} from "mithril"
import {ViewSlider} from "../../gui/nav/ViewSlider.js"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {FeatureType, FULL_INDEXED_TIMESTAMP, Keys, MailFolderType, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../api/common/TutanotaConstants"
import {assertMainOrNode} from "../../api/common/Env"
import {keyManager, Shortcut} from "../../misc/KeyManager"
import type {NavButtonAttrs} from "../../gui/base/NavButton.js"
import {isNavButtonSelected, NavButton, NavButtonColor} from "../../gui/base/NavButton.js"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {ContactTypeRef, MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
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
import {Dialog} from "../../gui/base/Dialog"
import {locator} from "../../api/main/MainLocator"
import {getFolderName, getSortedCustomFolders, getSortedSystemFolders} from "../../mail/model/MailUtils"
import {getEndOfDay, getStartOfDay, isSameDay, isSameTypeRef, isToday, neverNull, noOp, ofClass, promiseMap, TypeRef} from "@tutao/tutanota-utils"
import {formatDateWithMonth, formatDateWithTimeIfNotEven} from "../../misc/Formatter"
import {showDateRangeSelectionDialog} from "../../gui/date/DatePickerDialog"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import {PageSize} from "../../gui/base/List"
import {MultiSelectionBar} from "../../gui/base/MultiSelectionBar"
import type {CurrentView} from "../../gui/Header.js"
import {header} from "../../gui/Header.js"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {getStartOfTheWeekOffsetForUser} from "../../calendar/date/CalendarUtils"
import {Button, ButtonColor, ButtonType} from "../../gui/base/Button.js"
import {PermissionError} from "../../api/common/error/PermissionError"
import {ContactEditor} from "../../contacts/ContactEditor"
import {styles} from "../../gui/styles"
import {FolderColumnView} from "../../gui/FolderColumnView.js"
import {ActionBar} from "../../gui/base/ActionBar"
import {getGroupInfoDisplayName} from "../../api/common/utils/GroupUtils"
import {isNewMailActionAvailable} from "../../gui/nav/NavFunctions"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs"
import {TextField} from "../../gui/base/TextField.js"
import {SidebarSection} from "../../gui/SidebarSection"
import type {clickHandler} from "../../gui/base/GuiUtils"
import {SomeEntity} from "../../api/common/EntityTypes"
import {DropDownSelector, SelectorItem} from "../../gui/base/DropDownSelector.js"
import {IconButton} from "../../gui/base/IconButton.js"
import {ButtonSize} from "../../gui/base/ButtonSize.js";
import {BottomNav} from "../../gui/nav/BottomNav.js"
import {MobileMailActionBar} from "../../mail/view/MobileMailActionBar.js"

assertMainOrNode()

export class SearchView implements CurrentView {
	view: CurrentView["view"]
	oncreate: CurrentView["oncreate"]
	onremove: CurrentView["onremove"]

	private resultListColumn: ViewColumn
	private resultDetailsColumn: ViewColumn
	private folderColumn: ViewColumn
	private viewer: SearchResultDetailsViewer
	private viewSlider: ViewSlider
	private searchList: SearchListView

	private readonly mailFolder: NavButtonAttrs = {
		label: "emails_label",
		icon: () => BootIcons.Mail,
		href: () => this._getCurrentSearchUrl("mail", null),
		isSelectedPrefix: "/search/mail",
		colors: NavButtonColor.Nav,
	}

	private readonly contactFolder: NavButtonAttrs = {
		label: "contacts_label",
		icon: () => BootIcons.Contacts,
		href: "/search/contact",
		colors: NavButtonColor.Nav,
	}

	private endDate: Date | null = null// null = today

	private startDate: Date | null = null // null = current mail index date. this allows us to start the search (and the url) without end date set

	private selectedMailFolder: string | null = null
	private availableMailFolders: Array<SelectorItem<Id | null>> = []
	private selectedMailField: string | null = null
	private readonly availableMailFields = SEARCH_MAIL_FIELDS.map(f => ({name: lang.get(f.textId), value: f.field}))

	constructor() {
		locator.mailModel.mailboxDetails.map(mailboxes => {
			this.availableMailFolders = [
				{
					name: lang.get("all_label"),
					value: null,
				},
			]

			for (const mailbox of mailboxes) {
				const mailboxIndex = mailboxes.indexOf(mailbox);
				const mailFolders = getSortedSystemFolders(mailbox.folders).concat(getSortedCustomFolders(mailbox.folders))
				for (const folder of mailFolders) {
					if (folder.folderType !== MailFolderType.SPAM) {
						this.availableMailFolders.push({
							name: getFolderName(folder) + (mailboxIndex === 0 ? "" : " (" + getGroupInfoDisplayName(mailbox.mailGroupInfo) + ")"),
							value: folder.mails,
						})
					}
				}
			}

			if (!this.availableMailFolders.find(f => f.value === this.selectedMailFolder)) {
				this.selectedMailFolder = this.availableMailFolders[0].value
			}
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
											class: isNavButtonSelected(this.mailFolder) ? "row-selected" : "",
										},
										m(NavButton, this.mailFolder),
									),
									m(
										".folder-row.flex-start.plr-l",
										{
											class: isNavButtonSelected(this.contactFolder) ? "row-selected" : "",
										},
										m(NavButton, this.contactFolder),
									),
								],
							),
							isNavButtonSelected(this.mailFolder)
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
		this.searchList = new SearchListView(this)
		this.resultListColumn = new ViewColumn(
			{
				view: () => m(".list-column", [m(this.searchList)]),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => lang.get("searchResult_label"),
		)
		this.viewer = new SearchResultDetailsViewer(this.searchList)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => m(".search", m(this.viewer)),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], "ContactView")

		this.view = (): Children => {
			return m("#search.main-view", m(this.viewSlider, {
				header: m(header),
				bottomNav: styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.resultDetailsColumn && this.viewer._viewer?.mode === "mail"
					? m(MobileMailActionBar, {viewModel: this.viewer._viewer.viewModel})
					: m(BottomNav),
			}))
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
			m(DropDownSelector, {
				label: "field_label",
				items: this.availableMailFields,
				selectedValue: this.selectedMailField,
				selectionChangedHandler: (newValue: string | null) => {
					this.selectedMailField = newValue
					if (logins.getUserController().isFreeAccount()) {
						if (newValue != null) {
							this.selectedMailField = null
							showNotAvailableForFreeDialog(true)
						}
					} else {
						this._searchAgain()
					}
				},
				dropdownWidth: 250
			}),
			this.availableMailFolders.length > 0
				? m(DropDownSelector, {
					label: "mailFolder_label",
					items: this.availableMailFolders,
					selectedValue: this.selectedMailFolder,
					selectionChangedHandler: (newValue: string | null) => {
						this.selectedMailFolder = newValue
						if (logins.getUserController().isFreeAccount()) {
							if (newValue != null) {
								this.selectedMailFolder = null
								showNotAvailableForFreeDialog(true)
							}
						} else {
							this._searchAgain()
						}
					},
					dropdownWidth: 250
				})
				: null,
		].map(row => m(".folder-row.plr-l.content-fg", row))
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	headerRightView(): Children {
		const restriction = getRestriction(m.route.get())
		return styles.isUsingBottomNavigation()
			? isSameTypeRef(restriction.type, MailTypeRef) && isNewMailActionAvailable()
				? m(Button, {
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
					? m(Button, {
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
			if (this.endDate) {
				end = formatDateWithTimeIfNotEven(this.endDate)
			} else {
				end = lang.get("today_label")
			}

			if (this.startDate) {
				start = formatDateWithTimeIfNotEven(this.startDate)
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
		return m(TextField, {
			label: "periodOfTime_label",
			value: timeDisplayValue,
			disabled: true,
			injectionsRight: () => m(IconButton, {
				title: "selectPeriodOfTime_label",
				click: () => this.selectTimePeriod(),
				icon: Icons.Edit,
				size: ButtonSize.Compact,
			}),
		})
	}

	private async selectTimePeriod() {
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(true)
		} else {
			const startOfWeek = getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot)
			const {end, start} = await showDateRangeSelectionDialog(
				startOfWeek,
				this.startDate ?? this._getCurrentMailIndexDate() ?? new Date(),
				this.endDate ?? new Date(),
			)

			if (end && isToday(end)) {
				this.endDate = null
			} else {
				this.endDate = end
			}

			let current = this._getCurrentMailIndexDate()

			if (start && current && isSameDay(current, start)) {
				this.startDate = null
			} else {
				this.startDate = start
			}

			this._searchAgain()
		}
	}

	_searchAgain(): void {
		const startDate = this.startDate

		if (startDate && startDate.getTime() < locator.search.indexState().currentMailIndexTimestamp) {
			Dialog.confirm("continueSearchMailbox_msg", "search_label").then(confirmed => {
				if (confirmed) {
					locator.indexerFacade.extendMailIndex(startDate.getTime()).then(() => {
						setSearchUrl(this._getCurrentSearchUrl(this._getCategory(), null))
						m.redraw()
					})
				}
			})
		} else {
			setSearchUrl(this._getCurrentSearchUrl(this._getCategory(), null))
			m.redraw()
		}
	}

	_getCurrentSearchUrl(searchCategory: string, selectedId: Id | null): string {
		let restriction = createRestriction(
			searchCategory,
			this.endDate ? getEndOfDay(this.endDate).getTime() : null,
			this.startDate ? getStartOfDay(this.startDate).getTime() : null,
			this.selectedMailField,
			this.selectedMailFolder
		)
		return getSearchUrl(locator.search.lastQuery(), restriction, selectedId ?? undefined)
	}

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.UP,
				exec: () => this.searchList.selectPrevious(false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.K,
				exec: () => this.searchList.selectPrevious(false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.UP,
				shift: true,
				exec: () => this.searchList.selectPrevious(true),
				help: "addPrevious_action",
			},
			{
				key: Keys.K,
				shift: true,
				exec: () => this.searchList.selectPrevious(true),
				help: "addPrevious_action",
			},
			{
				key: Keys.DOWN,
				exec: () => this.searchList.selectNext(false),
				help: "selectNext_action",
			},
			{
				key: Keys.J,
				exec: () => this.searchList.selectNext(false),
				help: "selectNext_action",
			},
			{
				key: Keys.DOWN,
				shift: true,
				exec: () => this.searchList.selectNext(true),
				help: "addNext_action",
			},
			{
				key: Keys.J,
				shift: true,
				exec: () => this.searchList.selectNext(true),
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
				exec: () => this.searchList.deleteSelected(),
				help: "delete_action",
			},
			{
				key: Keys.A,
				exec: () => this.searchList.archiveSelected(),
				help: "archive_action",
			},
			{
				key: Keys.I,
				exec: () => this.searchList.moveSelectedToInbox(),
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
		this.viewer.elementSelected(entries, elementClicked, selectionChanged, multiSelectOperation)

		if (entries.length === 1 && !multiSelectOperation && (selectionChanged || !this.viewer._viewer)) {
			// do not set the search url if an element is removed from this list by another view
			if (m.route.get().startsWith("/search")) {
				setSearchUrl(getSearchUrl(locator.search.lastQuery(), getRestriction(m.route.get()), entries[0]._id[1]))
			}
		}

		if (!multiSelectOperation && elementClicked) {
			this.searchList.loading().then(() => {
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
			this.endDate = restriction.start ? new Date(restriction.start) : null
			this.startDate = restriction.end ? new Date(restriction.end) : null
			this.selectedMailField = restriction.field
			this.selectedMailFolder = restriction.listId
		}

		if (args.id && !this.searchList.isEntitySelected(args.id)) {
			// the mail list is visible already, just the selected mail is changed
			this.searchList.scrollToIdAndSelect(args.id)
		} else if (!args.id && this.searchList.getSelectedEntities().length > 0) {
			this.searchList.selectNone()
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

			if (this.searchList.isInSearchResult(typeRef, id)) {
				return this.searchList.entityEventReceived(instanceId, operation).then(() => {
					// run the mail or contact update after the update on the list is finished to avoid parallel loading
					if (operation === OperationType.UPDATE && this.viewer && this.viewer.isShownEntity(id)) {
						return locator.entityClient
									  .load(typeRef, id)
									  .then(updatedEntity => {
										  this.viewer.showEntity(updatedEntity, false)
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
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 && this.searchList.list && this.searchList.list.isMobileMultiSelectionActionActive()
			? m(MultiSelectionBar, {
				selectNoneHandler: () => this.searchList.selectNone(),
				text: String(this.searchList.getSelectedEntities().length),
			}, m(ActionBar, {
				buttons: this.viewer.multiSearchActionBarButtons(),
			}))
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

async function newMailEditor(): Promise<Dialog> {
	const [mailboxDetails, {newMailEditor}] = await Promise.all([locator.mailModel.getUserMailboxDetails(), import("../../mail/editor/MailEditor")])
	return newMailEditor(mailboxDetails)
}
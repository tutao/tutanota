import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { FeatureType, FULL_INDEXED_TIMESTAMP, Keys, MailFolderType, NOTHING_INDEXED_TIMESTAMP, OperationType } from "../../api/common/TutanotaConstants"
import { assertMainOrNode, isDesktop } from "../../api/common/Env"
import { keyManager, Shortcut } from "../../misc/KeyManager"
import type { NavButtonAttrs } from "../../gui/base/NavButton.js"
import { isNavButtonSelected, NavButton, NavButtonColor } from "../../gui/base/NavButton.js"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { ContactTypeRef, Mail, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { SearchListView, SearchResultListEntry } from "./SearchListView"
import { px, size } from "../../gui/size"
import {
	createRestriction,
	getFreeSearchStartDate,
	getRestriction,
	getSearchUrl,
	SEARCH_CATEGORIES,
	SEARCH_MAIL_FIELDS,
	setSearchUrl,
} from "../model/SearchUtils"
import { Dialog } from "../../gui/base/Dialog"
import { locator } from "../../api/main/MainLocator"
import { getIndentedFolderNameForDropdown } from "../../mail/model/MailUtils"
import { getEndOfDay, getStartOfDay, isSameDay, isSameTypeRef, isToday, neverNull, noOp, ofClass, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { formatDateWithMonth, formatDateWithTimeIfNotEven } from "../../misc/Formatter"
import { showDateRangeSelectionDialog } from "../../gui/date/DatePickerDialog"
import { Icons } from "../../gui/base/icons/Icons"
import { PageSize } from "../../gui/base/List"
import { MultiSelectionBar } from "../../gui/base/MultiSelectionBar"
import { BaseHeaderAttrs, Header } from "../../gui/Header.js"
import type { EntityUpdateData } from "../../api/main/EventController"
import { isUpdateForTypeRef } from "../../api/main/EventController"
import { getStartOfTheWeekOffsetForUser } from "../../calendar/date/CalendarUtils"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { PermissionError } from "../../api/common/error/PermissionError"
import { ContactEditor } from "../../contacts/ContactEditor"
import { styles } from "../../gui/styles"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { getGroupInfoDisplayName } from "../../api/common/utils/GroupUtils"
import { isNewMailActionAvailable } from "../../gui/nav/NavFunctions"
import { showNotAvailableForFreeDialog } from "../../misc/SubscriptionDialogs"
import { TextField } from "../../gui/base/TextField.js"
import { SidebarSection } from "../../gui/SidebarSection"
import type { clickHandler } from "../../gui/base/GuiUtils"
import { SomeEntity } from "../../api/common/EntityTypes"
import { DropDownSelector, SelectorItem } from "../../gui/base/DropDownSelector.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { BottomNav } from "../../gui/nav/BottomNav.js"
import { MobileMailActionBar } from "../../mail/view/MobileMailActionBar.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { MailboxDetail } from "../../mail/model/MailModel.js"
import Stream from "mithril/stream"
import { MultiContactViewer } from "../../contacts/view/MultiContactViewer.js"
import { assertIsEntity2, elementIdPart, getElementId } from "../../api/common/utils/EntityUtils.js"
import { ContactCardViewer } from "../../contacts/view/ContactCardViewer.js"
import { getMultiMailViewerActionButtonAttrs, MultiMailViewer } from "../../mail/view/MultiMailViewer.js"
import { ConversationViewer } from "../../mail/view/ConversationViewer.js"
import { ConversationViewModel } from "../../mail/view/ConversationViewModel.js"
import { ContactViewToolbar } from "../../contacts/view/ContactViewToolbar.js"
import { confirmMerge, deleteContacts, getMultiContactViewActionAttrs, writeMail } from "../../contacts/view/ContactView.js"
import { ActionBar } from "../../gui/base/ActionBar.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"
import { SearchResult } from "../../api/worker/search/SearchTypes.js"
import { isSameSearchRestriction } from "../model/SearchModel.js"
import { searchBar } from "../SearchBar.js"

assertMainOrNode()

export interface SearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: BaseHeaderAttrs
}

export class SearchView extends BaseTopLevelView implements TopLevelView<SearchViewAttrs> {
	oncreate: TopLevelView["oncreate"]
	onremove: TopLevelView["onremove"]

	private resultListColumn: ViewColumn
	private resultDetailsColumn: ViewColumn
	private folderColumn: ViewColumn
	private viewSlider: ViewSlider
	private searchList: SearchListView

	private readonly mailFolder: NavButtonAttrs = {
		label: "emails_label",
		icon: () => BootIcons.Mail,
		href: () => this._getCurrentSearchUrl("mail", null),
		isSelectedPrefix: "/search/mail",
		colors: NavButtonColor.Nav,
		persistentBackground: true,
	}

	private readonly contactFolder: NavButtonAttrs = {
		label: "contacts_label",
		icon: () => BootIcons.Contacts,
		href: "/search/contact",
		colors: NavButtonColor.Nav,
		persistentBackground: true,
	}

	private endDate: Date | null = null // null = today

	private startDate: Date | null = null // null = current mail index date. this allows us to start the search (and the url) without end date set

	private selectedMailFolder: string | null = null
	private availableMailFolders: Array<SelectorItem<Id | null>> = []
	private selectedMailField: string | null = null
	private readonly availableMailFields = SEARCH_MAIL_FIELDS.map((f) => ({ name: lang.get(f.textId), value: f.field }))
	private mailboxSubscription: Stream<void> | null = null
	private loadingAllForSearchResult: SearchResult | null = null

	/** if there is exactly one mail selected, we want to fetch the view model async and redraw. */
	private conversationViewModel: ConversationViewModel | null = null

	constructor(vnode: Vnode<SearchViewAttrs>) {
		super()
		this.folderColumn = new ViewColumn(
			{
				view: () => {
					const restriction = getRestriction(m.route.get())
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: this.getMainButton(restriction.type),
						content: [
							m(
								SidebarSection,
								{
									name: "search_label",
								},
								[
									m(".folder-row.flex-start.mlr-button", m(NavButton, this.mailFolder)),
									m(".folder-row.flex-start.mlr-button", m(NavButton, this.contactFolder)),
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
				view: () => m(this.searchList),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => lang.get("searchResult_label"),
		)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => this.renderDetailsView(),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], "ContactView")

		const shortcuts = this.getShortcuts()

		this.oncreate = (vnode) => {
			keyManager.registerShortcuts(shortcuts)
			locator.eventController.addEntityListener(this.entityListener)
			this.mailboxSubscription = locator.mailModel.mailboxDetails.map((mailboxes) => this.onMailboxesChanged(mailboxes))
		}

		this.onremove = () => {
			// cancel the loading if we are destroyed
			this.loadingAllForSearchResult = null

			keyManager.unregisterShortcuts(shortcuts)
			locator.eventController.removeEntityListener(this.entityListener)
			this.mailboxSubscription?.end(true)
		}
	}

	/** depending on the search and selection state we want to render a
	 * (multi) mail viewer or a (multi) contact viewer
	 */
	private renderDetailsView(): Children {
		if (getCurrentSearchMode() === "contact") {
			const selectedContacts =
				this.searchList.list
					?.getSelectedEntities()
					.map(({ entry }) => entry)
					.filter(assertIsEntity2(ContactTypeRef)) ?? []

			return m(
				".fill-absolute.flex.col.nav-bg",
				m(ContactViewToolbar, {
					contacts: selectedContacts,
					deleteAction: selectedContacts.length > 0 ? () => deleteContacts(selectedContacts) : undefined,
					editAction: selectedContacts.length === 1 ? () => new ContactEditor(locator.entityClient, selectedContacts[0]).show() : undefined,
					mergeAction: selectedContacts.length === 2 ? () => confirmMerge(selectedContacts[0], selectedContacts[1]) : undefined,
				}),
				this.searchList.list?.isMultiSelectionActive() || selectedContacts.length === 0
					? m(
							".flex-grow.rel.overflow-hidden",
							m(MultiContactViewer, {
								selectedEntities: selectedContacts,
								selectNone: () => this.searchList.selectNone(),
							}),
					  )
					: m(ContactCardViewer, { contact: selectedContacts[0], onWriteMail: writeMail }),
			)
		} else if (getCurrentSearchMode() === "mail") {
			const selectedMails =
				this.searchList.list
					?.getSelectedEntities()
					.map(({ entry }) => entry)
					.filter(assertIsEntity2(MailTypeRef)) ?? []

			if (this.searchList.list?.isMultiSelectionActive() || !this.conversationViewModel) {
				return m(MultiMailViewer, {
					selectedEntities: selectedMails,
					selectNone: () => this.searchList.selectNone(),
					loadAll: () => this.loadAll(),
					stopLoadAll: () => (this.loadingAllForSearchResult = null),
					loadingAll: this.loadingAllForSearchResult != null ? "loading" : this.searchList.list?.isLoadedCompletely() ? "loaded" : "can_load",
				})
			} else {
				return m(ConversationViewer, { viewModel: this.conversationViewModel })
			}
		} else {
			return m(
				".flex.col.fill-absolute",
				// Using contactViewToolbar because it will display empty
				m(ContactViewToolbar, { contacts: [] }),
				m(
					".flex-grow.rel.overflow-hidden",
					m(ColumnEmptyMessageBox, {
						message: () => lang.get("noSelection_msg"),
						color: theme.content_message_bg,
						backgroundColor: theme.navigation_bg,
					}),
				),
			)
		}
	}

	async loadAll() {
		if (this.loadingAllForSearchResult != null) return
		this.loadingAllForSearchResult = this.searchList._searchResult ?? null
		this.searchList.list?.selectAll()
		try {
			while (
				this.searchList.list &&
				this.searchList._searchResult?.restriction &&
				this.loadingAllForSearchResult &&
				isSameSearchRestriction(this.searchList._searchResult?.restriction, this.loadingAllForSearchResult.restriction) &&
				!this.searchList.list.isLoadedCompletely()
			) {
				await this.searchList.list.loadMoreItems()
				if (
					this.searchList._searchResult.restriction &&
					this.loadingAllForSearchResult.restriction &&
					isSameSearchRestriction(this.searchList._searchResult.restriction, this.loadingAllForSearchResult.restriction)
				) {
					this.searchList.list.selectAll()
				}
			}
		} finally {
			this.loadingAllForSearchResult = null
			m.redraw()
		}
	}

	private onMailboxesChanged(mailboxes: MailboxDetail[]) {
		this.availableMailFolders = [
			{
				name: lang.get("all_label"),
				value: null,
				indentationLevel: 0,
			},
		]

		for (const mailbox of mailboxes) {
			const mailboxIndex = mailboxes.indexOf(mailbox)
			const mailFolders = mailbox.folders.getIndentedList()
			for (const folderInfo of mailFolders) {
				if (folderInfo.folder.folderType !== MailFolderType.SPAM) {
					const mailboxLabel = mailboxIndex === 0 ? "" : ` (${getGroupInfoDisplayName(mailbox.mailGroupInfo)})`
					this.availableMailFolders.push({
						name: getIndentedFolderNameForDropdown(folderInfo) + mailboxLabel,
						value: folderInfo.folder.mails,
					})
				}
			}
		}

		if (!this.availableMailFolders.find((f) => f.value === this.selectedMailFolder)) {
			this.selectedMailFolder = this.availableMailFolders[0].value
		}
	}

	private entityListener = (updates: EntityUpdateData[]) => {
		return promiseMap(updates, (update) => {
			return this.entityEventReceived(update)
		}).then(noOp)
	}

	view({ attrs }: Vnode<SearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					headerView: this.renderHeaderView(),
					rightView: this.renderHeaderRightView(),
					viewSlider: this.viewSlider,
					searchBar: () =>
						m(searchBar, {
							placeholder: this.searchBarPlaceholder(),
							returnListener: () => this.resultListColumn.focus(),
						}),
					centerContent: () => this.centerContent(),
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.resultDetailsColumn && this.conversationViewModel
						? m(MobileMailActionBar, { viewModel: this.conversationViewModel?.primaryViewModel() })
						: m(BottomNav),
			}),
		)
	}

	private searchBarPlaceholder() {
		return lang.get(m.route.get().startsWith("/search/mail") ? "searchEmails_placeholder" : "searchContacts_placeholder")
	}

	private centerContent() {
		return styles.isUsingBottomNavigation()
			? m(searchBar, {
					alwaysExpanded: true,
					classes: ".flex-center",
					placeholder: this.searchBarPlaceholder(),
					style: {
						height: "100%",
						"margin-left": px(size.navbar_edge_width_mobile),
						"margin-right": px(size.navbar_edge_width_mobile),
					},
			  })
			: null
	}

	_renderSearchFilters(): Children {
		return [
			this._getUpdatedTimeField(),
			m("div.mlr-button", [
				m(DropDownSelector, {
					label: "field_label",
					items: this.availableMailFields,
					selectedValue: this.selectedMailField,
					selectionChangedHandler: (newValue: string | null) => {
						this.selectedMailField = newValue
						if (locator.logins.getUserController().isFreeAccount()) {
							if (newValue != null) {
								this.selectedMailField = null
								showNotAvailableForFreeDialog(true)
							}
						} else {
							this._searchAgain()
						}
					},
					dropdownWidth: 250,
				}),
				this.availableMailFolders.length > 0
					? m(DropDownSelector, {
							label: "mailFolder_label",
							items: this.availableMailFolders,
							selectedValue: this.selectedMailFolder,
							selectionChangedHandler: (newValue: string | null) => {
								this.selectedMailFolder = newValue
								if (locator.logins.getUserController().isFreeAccount()) {
									if (newValue != null) {
										this.selectedMailFolder = null
										showNotAvailableForFreeDialog(true)
									}
								} else {
									this._searchAgain()
								}
							},
							dropdownWidth: 250,
					  })
					: null,
			]),
		].map((row) => m(".folder-row.plr-button.content-fg", row))
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	private renderHeaderRightView(): Children {
		const restriction = getRestriction(m.route.get())
		return styles.isUsingBottomNavigation()
			? isSameTypeRef(restriction.type, MailTypeRef) && isNewMailActionAvailable()
				? m(Button, {
						click: () => {
							newMailEditor()
								.then((editor) => editor.show())
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
							locator.contactModel.contactListId().then((contactListId) => {
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

		if (locator.logins.getUserController().isFreeAccount()) {
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
			class: "plr-button",
			injectionsRight: () =>
				m(IconButton, {
					title: "selectPeriodOfTime_label",
					click: () => this.selectTimePeriod(),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private async selectTimePeriod() {
		if (locator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(true)
		} else {
			const startOfWeek = getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot)
			const { end, start } = await showDateRangeSelectionDialog(
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
			Dialog.confirm("continueSearchMailbox_msg", "search_label").then((confirmed) => {
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
			this.selectedMailFolder,
		)
		return getSearchUrl(locator.search.lastQuery(), restriction, selectedId ?? undefined)
	}

	getShortcuts(): Shortcut[] {
		return [
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
							.then((editor) => editor.show())
							.catch(ofClass(PermissionError, noOp))
					} else if (isSameTypeRef(restriction, ContactTypeRef)) {
						locator.contactModel.contactListId().then((contactListId) => {
							new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
						})
					}
				},
				enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly),
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
				enabled: () => isSameTypeRef(this.searchList._lastType, MailTypeRef),
			},
			{
				key: Keys.I,
				exec: () => this.searchList.moveSelectedToInbox(),
				help: "moveToInbox_action",
				enabled: () => isSameTypeRef(this.searchList._lastType, MailTypeRef),
			},
			{
				key: Keys.V,
				exec: () => this.searchList.move(),
				help: "move_action",
				enabled: () => isSameTypeRef(this.searchList._lastType, MailTypeRef),
			},
			{
				key: Keys.U,
				exec: () => this.searchList.toggleUnreadStatus(),
				help: "toggleUnread_action",
				enabled: () => isSameTypeRef(this.searchList._lastType, MailTypeRef),
			},
		]
	}

	elementSelected(newSelection: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (selectionChanged) {
			m.redraw()
		} else {
			return
		}

		if (newSelection.length === 1 && !multiSelectOperation) {
			// do not set the search url if an element is removed from this list by another view
			const selectedElementId = getElementId(newSelection[0])
			setSearchUrl(getSearchUrl(locator.search.lastQuery(), getRestriction(m.route.get()), selectedElementId))
			if (getCurrentSearchMode() === "mail") {
				this.updateDisplayedConversation(newSelection[0].entry as Mail).then(m.redraw)
			} else {
				this.conversationViewModel = null
				m.redraw()
			}
		} else {
			this.conversationViewModel = null
			m.redraw()
		}

		if (!multiSelectOperation && elementClicked) {
			this.searchList.loading().then(() => {
				this.viewSlider.focus(this.resultDetailsColumn)
			})
		}
	}

	private async updateDisplayedConversation(mail: Mail): Promise<void> {
		const viewModelParams = {
			mail,
			showFolder: true,
		}
		const mailboxDetails = await locator.mailModel.getMailboxDetailsForMail(viewModelParams.mail)
		if (mailboxDetails == null) {
			this.conversationViewModel = null
			return
		} else {
			const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
			const viewModel = await locator.conversationViewModel({ mail, showFolder: true }, mailboxDetails, mailboxProperties)
			await viewModel.init()
			if (viewModel && isDesktop()) {
				// Notify the admin client about the mail being selected
				locator.desktopSystemFacade?.sendSocketMessage(viewModel.primaryMail.sender.address)
			}
			this.conversationViewModel = viewModel
		}
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
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
		return neverNull(SEARCH_CATEGORIES.find((c) => isSameTypeRef(c.typeRef, restriction.type))).name
	}

	async entityEventReceived(update: EntityUpdateData): Promise<void> {
		const mode = getCurrentSearchMode()
		if (!((isUpdateForTypeRef(MailTypeRef, update) && mode === "mail") || (isUpdateForTypeRef(ContactTypeRef, update) && mode === "contact"))) {
			return
		}
		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = new TypeRef<SomeEntity>(update.application, update.type)
		if (!this.searchList.isInSearchResult(typeRef, id)) {
			return
		}
		await this.searchList.entityEventReceived(instanceId, operation)
		// run the mail or contact update after the update on the list is finished to avoid parallel loading
		if (operation === OperationType.UPDATE && this.searchList.list?.isEntitySelected(elementIdPart(id))) {
			try {
				await locator.entityClient.load(typeRef, id)
				m.redraw()
			} catch (e) {
				// ignore. might happen if a mail was just sent
			}
		}
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	private renderHeaderView(): Children {
		if (getCurrentSearchMode() === "contact") {
			const selectedContacts =
				this.searchList.list
					?.getSelectedEntities()
					.map(({ entry }) => entry)
					.filter(assertIsEntity2(ContactTypeRef)) ?? []

			return this.viewSlider.getVisibleBackgroundColumns().length === 1 &&
				this.searchList.list &&
				this.searchList.list.isMobileMultiSelectionActionActive()
				? m(
						MultiSelectionBar,
						{
							selectNoneHandler: () => this.searchList.selectNone(),
							text: String(selectedContacts.length),
						},
						m(ActionBar, { buttons: getMultiContactViewActionAttrs(selectedContacts, false, () => this.searchList.selectNone()) }),
				  )
				: null
		} else {
			const selectedMails =
				this.searchList.list
					?.getSelectedEntities()
					.map(({ entry }) => entry)
					.filter(assertIsEntity2(MailTypeRef)) ?? []

			return this.viewSlider.getVisibleBackgroundColumns().length === 1 &&
				this.searchList.list &&
				this.searchList.list.isMobileMultiSelectionActionActive()
				? m(
						MultiSelectionBar,
						{
							selectNoneHandler: () => this.searchList.selectNone(),
							text: String(selectedMails.length),
						},
						m(ActionBar, { buttons: getMultiMailViewerActionButtonAttrs(selectedMails, () => this.searchList.selectNone(), false) }),
				  )
				: null
		}
	}

	getMainButton(typeRef: TypeRef<unknown>):
		| {
				type: ButtonType
				label: TranslationKey
				click: clickHandler
		  }
		| null
		| undefined {
		if (styles.isUsingBottomNavigation()) {
			return null
		} else if (isSameTypeRef(typeRef, MailTypeRef) && isNewMailActionAvailable()) {
			return {
				type: ButtonType.FolderColumnHeader,
				click: () => {
					newMailEditor()
						.then((editor) => editor.show())
						.catch(ofClass(PermissionError, noOp))
				},
				label: "newMail_action",
			}
		} else if (isSameTypeRef(typeRef, ContactTypeRef)) {
			return {
				type: ButtonType.FolderColumnHeader,
				click: () => {
					locator.contactModel.contactListId().then((contactListId) => {
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

function getCurrentSearchMode() {
	return m.route.get().startsWith("/search/contact") ? "contact" : "mail"
}

async function newMailEditor(): Promise<Dialog> {
	const [mailboxDetails, { newMailEditor }] = await Promise.all([locator.mailModel.getUserMailboxDetails(), import("../../mail/editor/MailEditor")])
	return newMailEditor(mailboxDetails)
}

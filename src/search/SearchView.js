// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ViewColumn, ColumnType} from "../gui/base/ViewColumn"
import {header} from "../gui/base/Header"
import {TypeRef, isSameTypeRef} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {assertMainOrNode} from "../api/Env"
import {keyManager, Keys} from "../misc/KeyManager"
import {NavButton} from "../gui/base/NavButton"
import {theme} from "../gui/theme"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {SearchListView, SearchResultListEntry} from "./SearchListView"
import {size, px} from "../gui/size"
import {SearchResultDetailsViewer} from "./SearchResultDetailsViewer"
import {getRestriction, getSearchUrl, createRestriction, setSearchUrl} from "./SearchUtils"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {Dialog} from "../gui/base/Dialog"
import {NotFoundError} from "../api/common/error/RestError"
import {erase} from "../api/main/Entity"
import {mailModel} from "../mail/MailModel"
import {locator} from "../api/main/MainLocator"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {SEARCH_MAIL_FIELDS, SEARCH_CATEGORIES} from "../search/SearchUtils"
import {getFolderName} from "../mail/MailUtils"
import {getGroupInfoDisplayName, neverNull} from "../api/common/utils/Utils"
import {formatDateWithMonth} from "../misc/Formatter"
import {TextField} from "../gui/base/TextField"
import {Button} from "../gui/base/Button"
import {showDatePickerDialog} from "../gui/base/DatePickerDialog"
import {Icons} from "../gui/base/icons/Icons"
import {getStartOfDay, isToday, getEndOfDay, isSameDay} from "../api/common/utils/DateUtils"

assertMainOrNode()

export class SearchView {
	resultListColumn: ViewColumn;
	resultDetailsColumn: ViewColumn;
	folderColumn: ViewColumn;
	_viewer: SearchResultDetailsViewer;
	viewSlider: ViewSlider;
	_searchList: SearchListView;
	view: Function;
	oncreate: Function;
	onbeforeremove: Function;

	_mailFolder: NavButton;
	_contactFolder: NavButton;
	_time: TextField;
	_startDate: ?Date; // null = today
	_endDate: ?Date; // null = current mail index date
	_mailFolderSelection: DropDownSelector<?string>;
	_mailFieldSelection: DropDownSelector<?string>;

	_doNotUpdateQuery: boolean;

	constructor() {
		this._mailFolder = new NavButton('emails_label', () => BootIcons.Mail, () => this._getCurrentSearchUrl("mail", null), "/search/mail")
		this._contactFolder = new NavButton('contacts_label', () => BootIcons.Contacts, () => "/search/contact", "/search/contact")

		this._startDate = null
		this._endDate = null
		this._time = new TextField("time_label").setValue(this._getTimeText()).setDisabled()
		let changeTimeButton = new Button("selectTime_label", () => showDatePickerDialog((this._startDate) ? this._startDate : new Date(), (this._endDate) ? this._endDate : this._getIndexedMailEndDate(), false).then(dates => {
			if (dates.start && isToday(dates.start)) {
				this._startDate = null
			} else {
				this._startDate = dates.start
			}
			if (dates.end && isSameDay(this._getIndexedMailEndDate(), neverNull(dates.end))) {
				this._endDate = null
			} else {
				this._endDate = dates.end
			}

			this._time.setValue(this._getTimeText())
			this._searchAgain()
		}), () => Icons.Edit)
		this._time._injectionsRight = () => [m(changeTimeButton)]

		let mailAttributes = SEARCH_MAIL_FIELDS.map(f => {
			return {name: lang.get(f.textId), value: f.field}
		})
		this._mailFieldSelection = new DropDownSelector("field_label", null, mailAttributes, mailAttributes[0].value, 250)
		this._doNotUpdateQuery = true // the stream obeserver is immediately called when map() is called and we must not search again now
		this._mailFieldSelection.selectedValue.map(() => {
			this._searchAgain()
		})
		this._doNotUpdateQuery = false

		mailModel.mailboxDetails.map(mailboxes => {
			let mailFolders = [
				{name: lang.get("all_label"), value: null}
			]
			mailboxes.forEach((mailbox, mailboxIndex) => {
				mailbox.folders.forEach(folder => {
					mailFolders.push({
						name: getFolderName(folder) + ((mailboxIndex == 0) ? "" : " (" + getGroupInfoDisplayName(mailbox.mailGroupInfo) + ")"),
						value: folder.mails
					})
				})
			})
			let newSelection = this._mailFolderSelection ? this._mailFolderSelection.selectedValue() : mailFolders[0].value
			if (!mailFolders.find(f => f.value == newSelection)) {
				newSelection = mailFolders[0].value
			}
			this._mailFolderSelection = new DropDownSelector("mailFolder_label", null, mailFolders, newSelection, 250)
			this._doNotUpdateQuery = true
			this._mailFolderSelection.selectedValue.map(() => {
				this._searchAgain()
			})
			this._doNotUpdateQuery = false
		})

		let filterExpander = new ExpanderButton("filter_label", new ExpanderPanel({
			view: () => this._mailFolder.isSelected() ? m(".mt-negative", [
					m(this._time),
					m(this._mailFieldSelection),
					m(this._mailFolderSelection),
				]) : m("")
		}), false)
		filterExpander.toggle()

		this.folderColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden", [
				m(".folder-row.flex-space-between.pt-s.plr-l", {style: {height: px(size.button_height)}}, [m("small.b.align-self-center.ml-negative-xs", {style: {color: theme.navigation_button}}, lang.get("search_label").toLocaleUpperCase())]),
				m(".folders", [
					m(".folder-row.plr-l", {class: this._mailFolder.isSelected() ? "row-selected" : ""}, m(this._mailFolder)),
					m(".folder-row.plr-l", {class: this._contactFolder.isSelected() ? "row-selected" : ""}, m(this._contactFolder)),
				]),
				m(".mlr-l", [
					m(".mr-negative-s.flex-space-between", m(filterExpander)),
					m(filterExpander.panel)
				])
			])
		}, ColumnType.Foreground, 200, 300, () => lang.get("search_label"))

		this._searchList = new SearchListView(this)
		this.resultListColumn = new ViewColumn({
			view: () => m(".list-column", [
				m(this._searchList),
			])
		}, ColumnType.Background, 300, 500, () => lang.get("searchResult_label"))

		this._viewer = new SearchResultDetailsViewer(this._searchList)
		this.resultDetailsColumn = new ViewColumn({
			view: () => m(".search", m(this._viewer))
		}, ColumnType.Background, 600, 2400, () => {
			return
		})

		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], "ContactView")

		this.view = (): VirtualElement => {
			return m("#search.main-view", m(this.viewSlider))
		}
		this._setupShortcuts()

		locator.entityEvent.addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	_getIndexedMailEndDate(): Date {
		return getStartOfDay(new Date(2017, 0, 1)) // FIXME set end of index
	}

	_getTimeText(): string {
		return ((this._startDate) ? formatDateWithMonth(this._startDate) : lang.get("today_label")) + " - " + (formatDateWithMonth((this._endDate) ? this._endDate : this._getIndexedMailEndDate()))
	}

	_searchAgain(): void {
		// only run the seach if all stream observers are initialized
		if (!this._doNotUpdateQuery) {
			setSearchUrl(this._getCurrentSearchUrl(this._getCategory(), null))
		}
	}

	_getCurrentSearchUrl(searchCategory: string, selectedId: ?Id): string {
		let restriction = {
			type: (searchCategory == "mail" ? MailTypeRef : ContactTypeRef),
			start: (this._startDate) ? getEndOfDay(this._startDate).getTime() : null,
			end: (this._endDate) ? getStartOfDay(this._endDate).getTime() : null,
			field: this._mailFieldSelection.selectedValue(),
			attributeIds: null,
			listId: this._mailFolderSelection.selectedValue()
		}
		return getSearchUrl(header.buttonBar.searchBar.value(), restriction, selectedId)
	}


	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.UP,
				exec: () => this._searchList.list.selectPrevious(false),
				help: "selectPrevious_action"
			},
			{
				key: Keys.UP,
				shift: true,
				exec: () => this._searchList.list.selectPrevious(true),
				help: "addPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => this._searchList.list.selectNext(false),
				help: "selectNext_action"
			},
			{
				key: Keys.DOWN,
				shift: true,
				exec: () => this._searchList.list.selectNext(true),
				help: "addNext_action"
			},
			{
				key: Keys.DELETE,
				exec: () => this._deleteSelected(),
				help: "deleteContacts_action"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	elementSelected(entries: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		this._viewer.elementSelected(entries, elementClicked, selectionChanged, multiSelectOperation)

		if (entries.length == 1 && m.route.get().startsWith("/search/")) {
			setSearchUrl(getSearchUrl(header.buttonBar.searchBar.value(), getRestriction(m.route.get()), entries[0]._id[1]))
		}
		if (!multiSelectOperation && elementClicked) {
			this._searchList.list._loading.then(() => {
				this.viewSlider.focus(this.resultDetailsColumn)
			})
		}
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and contactId for the contact view.
	 */
	updateUrl(args: Object, requestedPath: string) {
		if (args.query) {
			header.buttonBar.searchBar.value(args.query)
		}
		let restriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			console.log("invalid search url", e)
			setSearchUrl(getSearchUrl(args.query, createRestriction("mail")))
			return
		}
		if (locator.search.isNewSearch(header.buttonBar.searchBar.value(), restriction)) {
			locator.search.search(header.buttonBar.searchBar.value(), restriction)
		}
		// update the filters
		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			this._doNotUpdateQuery = true
			this._startDate = restriction.start ? new Date(restriction.start) : null
			this._endDate = restriction.end ? new Date(restriction.end) : null
			this._time.setValue(this._getTimeText())
			this._mailFolderSelection.selectedValue(restriction.listId)
			this._mailFieldSelection.selectedValue(restriction.field)
			this._doNotUpdateQuery = false
		}

		if (args.id && this._searchList.list && !this._searchList.list.isEntitySelected(args.id) && this._searchList.list._domList) {
			// the mail list is visible already, just the selected mail is changed
			this._searchList.list.scrollToIdAndSelect(args.id)
		} else if (!args.id && this._searchList.list && this._searchList.list.getSelectedEntities().length > 0) {
			this._searchList.list.selectNone()
		}
	}

	_deleteSelected(): void {
		let selected = this._searchList.list.getSelectedEntities()
		if (selected.length > 0) {
			if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
				let selectedMail = ((selected[0].entry:any):Mail)
				mailModel.deleteMails([selectedMail]).then(() => this._searchList.list._deleteLoadedEntity(selected[0]._id[1]))
			} else if (isSameTypeRef(selected[0].entry._type, ContactTypeRef)) {
				let selectedContact = ((selected[0].entry:any):Contact)
				Dialog.confirm("deleteContacts_msg").then(confirmed => {
					if (confirmed) {
						erase(selectedContact).catch(NotFoundError, e => {
							// ignore because the delete key shortcut may be executed again while the contact is already deleted
						}).then(() => this._searchList.list._deleteLoadedEntity(selected[0]._id[1]))
					}
				})
			}
		}
	}


	_getCategory(): string {
		let restriction = getRestriction(m.route.get())
		return neverNull(SEARCH_CATEGORIES.find(c => isSameTypeRef(c.typeRef, restriction.type))).name
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, ContactTypeRef) && this._contactList && listId == this._contactList.listId) {
			//FIXME
		}
	}
}

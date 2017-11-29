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
import {setSearchUrl, getRestriction} from "./SearchUtils"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {Dialog} from "../gui/base/Dialog"
import {NotFoundError} from "../api/common/error/RestError"
import {erase} from "../api/main/Entity"
import {mailModel} from "../mail/MailModel"
import {locator} from "../api/main/MainLocator"
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

	constructor() {

		let mailFolder = new NavButton('emails_label', () => BootIcons.Mail, () => "/search/mail", "/search/mail")
		let contactFolder = new NavButton('contacts_label', () => BootIcons.Contacts, () => "/search/contact", "/search/contact")

		this.folderColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden", [
				m(".folder-row.flex-space-between.pt-s.plr-l", {style: {height: px(size.button_height)}}, [m("small.b.align-self-center.ml-negative-xs", {style: {color: theme.navigation_button}}, lang.get("search_label").toLocaleUpperCase())]),
				m(".folders", [
					m(".folder-row.plr-l", {class: mailFolder.isSelected() ? "row-selected" : ""}, m(mailFolder)),
					m(".folder-row.plr-l", {class: contactFolder.isSelected() ? "row-selected" : ""}, m(contactFolder)),
				])
				//m(".mr-negative-s.flex-space-between.plr-l", m(expander)),
				//m(expander.panel)
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

		if (entries.length == 1) {
			setSearchUrl(m.route.param()['category'], header.buttonBar.searchBar.value(), entries[0]._id[1])
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
		if (locator.search.isNewSearch(header.buttonBar.searchBar.value(), getRestriction(requestedPath))) {
			locator.search.search(header.buttonBar.searchBar.value(), getRestriction(requestedPath))
		}
		if (args.id && this._searchList.list && !this._searchList.list.isEntitySelected(args.id) && this._searchList.list._domList) {
			// the mail list is visible already, just the selected mail is changed
			this._searchList.list.scrollToIdAndSelect(args.id)
		} else if (!args.id && this._searchList.list.getSelectedEntities().length > 0) {
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


	getCategory() {
		let route = m.route.get().split("/")
		if (route.length < 2) {
			return ""
		}
		return route[2]
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, ContactTypeRef) && this._contactList && listId == this._contactList.listId) {
			//FIXME
		}
	}
}

// @flow
import m from "mithril"
import {assertMainOrNode, Mode} from "../api/Env"
import {ActionBar} from "../gui/base/ActionBar"
import {Icons} from "../gui/base/icons/Icons"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {lang} from "../misc/LanguageViewModel"
import MessageBox from "../gui/base/MessageBox"
import {SearchListView} from "./SearchListView"
import {erase, load, update} from "../api/main/Entity"
import type {MailboxDetail} from "../mail/MailModel"
import {mailModel} from "../mail/MailModel"
import {NotFoundError} from "../api/common/error/RestError"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {Dialog} from "../gui/base/Dialog"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {getFolderIcon, getFolderName, getSortedCustomFolders, getSortedSystemFolders} from "../mail/MailUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {mergeContacts} from "../contacts/ContactMergeUtils"
import {logins} from "../api/main/LoginController"
import {FeatureType} from "../api/common/TutanotaConstants"
import {exportAsEml} from "../mail/Exporter"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {groupBy} from "../api/common/utils/ArrayUtils"
import {exportContacts} from "../contacts/VCardExporter"
import {lazyMemoized, noOp} from "../api/common/utils/Utils"

assertMainOrNode()

export class MultiSearchViewer {
	view: Function;
	_searchListView: SearchListView;
	_isMailList: boolean;
	_mobileMailActionBar = lazyMemoized(() => this.createMailActionBar(false))
	_mobileContactActionBar = lazyMemoized(() => this.createContactActionBar(false))

	constructor(searchListView: SearchListView) {
		const mailActionBar = this.createMailActionBar(true)
		const contactActionBar = this.createContactActionBar(true)
		this._searchListView = searchListView


// //todo check searchlist for contacts or mails then display different message
		let emptyMessageBox = new MessageBox(() => this._getSearchSelectionMessage(this._searchListView))
		this.view = () => {
			if (this._searchListView._lastType) {
				if (this._searchListView._lastType === MailTypeRef) {
					this._isMailList = true
				} else {
					this._isMailList = false
				}
			} else {
				console.log("ERROR LIST TYPE NOT FOUND")
			}
			return [
				m(".fill-absolute.mt-xs.plr-l",
					(this._searchListView.list && this._searchListView.list._selectedEntities.length > 0) ? [
						m(".button-height"), // just for the margin
						m(".flex-space-between", [
							m(".flex.items-center", this._getSearchSelectionMessage(this._searchListView)),
							m(this._viewingMails() ? mailActionBar : contactActionBar)
						])
					] : [m(emptyMessageBox)])
			]
		}
	}

	_getSearchSelectionMessage(searchListView: SearchListView) {
		let nbrOfSelectedSearchEntities = (searchListView.list) ? searchListView.list._selectedEntities.length : 0
		if (this._isMailList) {
			if (nbrOfSelectedSearchEntities === 0) {
				return lang.get("noMail_msg")
			} else if (nbrOfSelectedSearchEntities === 1) {
				return lang.get("oneMailSelected_msg")
			} else {
				return lang.get("nbrOfMailsSelected_msg", {"{1}": nbrOfSelectedSearchEntities})
			}
		} else {
			if (nbrOfSelectedSearchEntities === 0) {
				return lang.get("noContact_msg")
			} else if (nbrOfSelectedSearchEntities === 1) {
				return lang.get("oneContactSelected_msg")
			} else {
				return lang.get("nbrOfContactsSelected_msg", {"{1}": nbrOfSelectedSearchEntities})
			}
		}
	}


	createContactActionBar(prependCancel: boolean = false): ActionBar {
		let actionBar = new ActionBar()
		if (prependCancel) {
			actionBar.add(new Button("cancel_action", () =>
					this._searchListView.list ? this._searchListView.list.selectNone() : null
				/*this._searchView._searchList.list.selectNone()*/,
				() => Icons.Cancel))
		}
		actionBar.add(new Button('delete_action', () => {
			this._searchListView.deleteSelected()
		}, () => Icons.Trash))
		actionBar.add(new Button("merge_action", () => this.mergeSelected(),
			() => Icons.People)
			.setIsVisibleHandler(() => this._searchListView.getSelectedEntities().length === 2))
		actionBar.add(new Button("exportSelectedAsVCard_action", () => {
			let selected = this._searchListView.getSelectedEntities()
			let selectedContacts = []
			if (selected.length > 0) {
				if (isSameTypeRef(selected[0].entry._type, ContactTypeRef)) {
					selected.forEach(c => {
						selectedContacts.push(((c.entry: any): Contact))
					})
				}
			}
			exportContacts(selectedContacts)
		}, () => Icons.Export))
		return actionBar
	}

	createMailActionBar(prependCancel: boolean = false): ActionBar {
		let actionBar = new ActionBar()
		if (prependCancel) {
			actionBar.add(new Button("cancel_action", () =>
					this._searchListView.list ? this._searchListView.list.selectNone() : null
				/*this._searchView._searchList.list.selectNone()*/,
				() => Icons.Cancel))
		}

		actionBar.add(new Button('delete_action', () => {
			this._searchListView.deleteSelected()

		}, () => Icons.Trash))

		actionBar.add(createDropDownButton('move_action', () => Icons.Folder, () => {
			let selected = this._searchListView.getSelectedEntities()
			let selectedMails = []
			if (selected.length > 0) {
				if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
					selected.forEach(m => {
						selectedMails.push(((m.entry: any): Mail))
					})
				}
			}
			let sourceMailboxes = selectedMails.reduce((set, mail) => {
				let mailBox = mailModel.getMailboxDetails(mail)
				if (set.indexOf(mailBox) < 0) {
					set.push(mailBox)
				}
				return set
			}, ([]: MailboxDetail[]))
			if (sourceMailboxes.length !== 1) {
				return []
			} else {
				return (getSortedSystemFolders(sourceMailboxes[0].folders)
					.concat(getSortedCustomFolders(sourceMailboxes[0].folders)))
					.map(f => {
						return new Button(() => getFolderName(f), () => {
								let groupedMails = groupBy(selectedMails, mail => mail._id[0])
								//is needed for correct selection behavior on mobile
								this._searchListView.selectNone()
								// move all groups in parallel
								Array.from(groupedMails.values()).forEach(mails => {
									mailModel.moveMails(mails, f)
								})
							}, getFolderIcon(f)
						).setType(ButtonType.Dropdown)
					})
			}
		}))

		actionBar.add(createDropDownButton('more_label', () => Icons.More, () => {
			//select non is needed for mobile
			let moreButtons = []
			moreButtons.push(new Button("markUnread_action",
				this.getSelectedMails((mails) => this._markAll(mails, true).then(this._searchListView.selectNone())),
				() => Icons.NoEye)
				.setType(ButtonType.Dropdown))
			moreButtons.push(new Button("markRead_action",
				this.getSelectedMails((mails) => this._markAll(mails, false).then(this._searchListView.selectNone())),
				() => Icons.Eye)
				.setType(ButtonType.Dropdown))
			if (env.mode !== Mode.App && !logins.isEnabled(FeatureType.DisableMailExport)) {
				moreButtons.push(new Button("export_action",
					this.getSelectedMails((mails) => this._exportAll(mails).then(this._searchListView.selectNone())),
					() => Icons.Export)
					.setType(ButtonType.Dropdown))
			}
			return moreButtons
		}))
		return actionBar
	}

	_exportAll(mails: Mail[]): Promise<void> {
		return Promise.map(mails, mail => load(MailBodyTypeRef, mail.body).then(body => {
			return exportAsEml(mail, htmlSanitizer.sanitize(body.text, false).text)
		}), {concurrency: 5}).return()
	}

	_markAll(mails: Mail[], unread: boolean): Promise<void> {
		return Promise.all(mails.map(mail => {
			if (mail.unread !== unread) {
				mail.unread = unread
				return update(mail)
					.catch(NotFoundError, noOp)
			} else {
				return Promise.resolve()
			}
		})).return()

	}

	mergeSelected(): Promise<void> {
		if (this._searchListView.getSelectedEntities().length === 2) {
			if (isSameTypeRef(this._searchListView.getSelectedEntities()[0].entry._type, ContactTypeRef)) {
				let keptContact = ((this._searchListView.getSelectedEntities()[0].entry: any): Contact)
				let goodbyeContact = ((this._searchListView.getSelectedEntities()[1].entry: any): Contact)

				if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword
					|| (keptContact.presharedPassword === goodbyeContact.presharedPassword)) {
					return Dialog.confirm("mergeAllSelectedContacts_msg").then(confirmed => {
						if (confirmed) {
							mergeContacts(keptContact, goodbyeContact)
							return showProgressDialog("pleaseWait_msg", update(keptContact).then(() => {
								return erase(goodbyeContact).catch(NotFoundError, noOp).then(() => {//is needed for correct selection behavior on mobile
									this._searchListView.selectNone()
								})
							}))
						}
					})
				} else {
					return Dialog.error("presharedPasswordsUnequal_msg")
				}
			} else {
				return Promise.resolve()
			}
		} else {
			return Promise.resolve()
		}

	}

	getSelectedMails(action: (Mail[]) => mixed): () => void {
		return () => {
			let selected = this._searchListView.getSelectedEntities()
			let selectedMails = []
			if (selected.length > 0) {
				if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
					selected.forEach(m => {
						selectedMails.push(((m.entry: any): Mail))
					})
				}
			}
			action(selectedMails)
		}

	}

	actionBar(): ActionBar {
		return this._viewingMails() ? this._mobileMailActionBar() : this._mobileContactActionBar()
	}

	_viewingMails() {
		return this._searchListView._lastType.type === "Mail"
	}
}

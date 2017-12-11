//@flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {SearchResultListEntry, SearchListView} from "./SearchListView"
import {isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {NotFoundError} from "../api/common/error/RestError"
import {update} from "../api/main/Entity"
import {MailViewer} from "../mail/MailViewer"
import {ContactViewer} from "../contacts/ContactViewer"
import MessageBox from "../gui/base/MessageBox"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

export class SearchResultDetailsViewer {
	_listView: SearchListView;
	_viewer: ?MailViewer|ContactViewer;
	_messageBox: MessageBox;
	_viewerEntityId: ?IdTuple;

	constructor(list: SearchListView) {
		this._listView = list
		this._viewer = null
		this._viewerEntityId = null
		this._messageBox = new MessageBox(() => lang.get("noSelection_msg"))
	}

	view(): Children {
		let selected = this._listView.list ? this._listView.list.getSelectedEntities() : []
		if (selected.length === 0) {
			return m(".fill-absolute.mt-xs.plr-l", m(this._messageBox))
		} else {
			return this._viewer ? m(this._viewer) : null
		}
	}

	isShownEntity(id: IdTuple): boolean {
		return this._viewerEntityId != null && isSameId(id, this._viewerEntityId)
	}

	showEntity(entity: Object, entitySelected: boolean): void {
		if (isSameTypeRef(MailTypeRef, entity._type)) {
			let mail = ((entity:any):Mail)
			this._viewer = new MailViewer(mail)
			this._viewerEntityId = mail._id
			if (entitySelected && mail.unread && !mail._errors) {
				mail.unread = false
				update(mail).catch(NotFoundError, e => console.log("could not set read flag as mail has been moved/deleted already", e))
			}
			m.redraw()
		}
		if (isSameTypeRef(ContactTypeRef, entity._type)) {
			let contact = ((entity:any):Contact)
			this._viewer = new ContactViewer(contact)
			this._viewerEntityId = contact._id
			m.redraw()
		}
	}

	elementSelected(entries: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (entries.length == 1 && !multiSelectOperation && (selectionChanged || !this._viewer)) {
			// set or update the visible mail
			this.showEntity(entries[0].entry, true)
		} else if (selectionChanged && (entries.length == 0 || multiSelectOperation) && this._viewer) {
			// remove the visible mail
			this._viewer = null
			this._viewerEntityId = null
			//let url = `/mail/${this.mailList.listId}`
			//this._folderToUrl[this.selectedFolder._id[1]] = url
			//this._setUrl(url)
			m.redraw()
		} else if (selectionChanged) {
			// update the multi mail viewer
			m.redraw()
		}
	}
}

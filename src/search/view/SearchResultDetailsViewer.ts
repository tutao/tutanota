import m, { Children } from "mithril"
import { SearchListView, SearchResultListEntry } from "./SearchListView"
import type { Contact, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { LockedError, NotFoundError } from "../../api/common/error/RestError"
import { MailViewer } from "../../mail/view/MailViewer"
import { ContactViewer } from "../../contacts/view/ContactViewer"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import { assertMainOrNode } from "../../api/common/Env"
import { MultiSearchViewer } from "./MultiSearchViewer"
import { theme } from "../../gui/theme"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { isSameTypeRef, noOp, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/MainLocator"
import { isSameId } from "../../api/common/utils/EntityUtils"
import { MailViewerViewModel } from "../../mail/view/MailViewerViewModel"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"

assertMainOrNode()

type Viewer = { mode: "mail"; viewModel: MailViewerViewModel } | { mode: "contact"; viewer: ContactViewer } | { mode: "multiSearch"; viewer: MultiSearchViewer }

export class SearchResultDetailsViewer {
	/** DO NOT use directly, use {@link viewer}. */
	private _viewer: Viewer | null = null

	get viewer(): Viewer | null {
		return this._viewer
	}

	private set viewer(viewer: Viewer | null) {
		if (this._viewer?.mode === "mail") {
			this._viewer.viewModel.dispose()
		}
		this._viewer = viewer
	}

	private get viewerEntityId(): IdTuple | null {
		if (this.viewer == null) return null
		switch (this.viewer.mode) {
			case "mail":
				return this.viewer.viewModel.mail._id
			case "contact":
				return this.viewer.viewer.contact._id
			case "multiSearch":
				return null
		}
	}

	// we keep it around for multiselect buttons, we should refactor the whole thing
	private multiSearchViewer: MultiSearchViewer

	constructor(private listView: SearchListView) {
		this.multiSearchViewer = new MultiSearchViewer(this.listView)
	}

	view(): Children {
		const selected = this.listView.list ? this.listView.list.getSelectedEntities() : []

		if (selected.length === 0) {
			return m(
				".fill-absolute.mt-xs.plr-l",
				m(ColumnEmptyMessageBox, {
					message: "noSelection_msg",
					color: theme.content_message_bg,
					icon: isSameTypeRef(this.listView._lastType, MailTypeRef) ? BootIcons.Mail : BootIcons.Contacts,
				}),
			)
		} else {
			const viewer = this.viewer
			return viewer?.mode === "mail"
				? m(MailViewer, {
						viewModel: viewer.viewModel,
				  })
				: viewer != null
				? m(viewer.viewer)
				: null
		}
	}

	isShownEntity(id: IdTuple): boolean {
		return isSameId(id, this.viewerEntityId)
	}

	async showEntity(entity: Record<string, any>, entitySelected: boolean) {
		if (isSameTypeRef(MailTypeRef, entity._type)) {
			const mail = entity as Mail
			const viewModelParams = {
				mail,
				showFolder: true,
			}
			if (this.viewer == null || this.viewer.mode !== "mail" || !isSameId(this.viewer.viewModel.mail._id, mail._id)) {
				const mailboxDetails = await locator.mailModel.getMailboxDetailsForMail(viewModelParams.mail)
				if (mailboxDetails == null) {
					this.viewer = null
				} else {
					const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
					this.viewer = {
						mode: "mail",
						viewModel: await locator.mailViewerViewModel(viewModelParams, mailboxDetails, mailboxProperties),
					}
				}
			}

			if (entitySelected && mail.unread && !mail._errors) {
				mail.unread = false
				locator.entityClient
					.update(mail)
					.catch(ofClass(NotFoundError, (e) => console.log("could not set read flag as mail has been moved/deleted already", e)))
					.catch(ofClass(LockedError, noOp))
			}

			m.redraw()
		} else if (isSameTypeRef(ContactTypeRef, entity._type)) {
			let contact = entity as Contact
			this.viewer = { mode: "contact", viewer: new ContactViewer(contact) }
			m.redraw()
		}
	}

	elementSelected(entries: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (entries.length === 1 && !multiSelectOperation && (selectionChanged || !this.viewer || this.viewer.mode === "multiSearch")) {
			// set or update the visible mail
			this.showEntity(entries[0].entry, true)
		} else if (selectionChanged && (entries.length === 0 || multiSelectOperation)) {
			// remove the visible mail
			if (entries.length == 0) {
				this.viewer = null
			} else {
				this.viewer = { mode: "multiSearch", viewer: this.multiSearchViewer }
			}

			m.redraw()
		} else if (selectionChanged) {
			// update the multi mail viewer
			m.redraw()
		}
	}

	multiSearchActionBarButtons(): IconButtonAttrs[] {
		return this.multiSearchViewer.actionBarButtons()
	}
}

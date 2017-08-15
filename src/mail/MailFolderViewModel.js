// @flow
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {Icons} from "../gui/base/icons/Icons"
import {BootIcons} from "../gui/base/icons/BootIcons"

assertMainOrNode()

export const MailFolderType = {
	CUSTOM: '0',
	INBOX: '1',
	SENT: '2',
	TRASH: '3',
	ARCHIVE: '4',
	SPAM: '5',
	DRAFT: '6'
}

export class MailFolderViewModel {
	folder: MailFolder;
	url: string; // can be changed from outside

	constructor(folder: MailFolder) {
		this.folder = folder
		this.url = `/mail/${folder.mails}`
	}

	isFinallyDeleteAllowed() {
		return this.folder.folderType === MailFolderType.TRASH || this.folder.folderType === MailFolderType.SPAM
	}

	getDisplayName(): string {
		return getDisplayName(this.folder)
	}

	getDisplayIcon() {
		switch (this.folder.folderType) {
			case '0':
				return () => Icons.Folder
			case '1':
				return () => Icons.Inbox
			case '2':
				return () => Icons.Send
			case '3':
				return () => Icons.Trash
			case '4':
				return () => Icons.Archive
			case '5':
				return () => Icons.Spam
			case '6':
				return () => BootIcons.Edit
			default:
				return () => Icons.Folder
		}
	}

	getDisplayName() {
		switch (this.folder.folderType) {
			case '0':
				return this.folder.name
			case '1':
				return lang.get("received_action")
			case '2':
				return lang.get("sent_action")
			case '3':
				return lang.get("trash_action")
			case '4':
				return lang.get("archive_action")
			case '5':
				return lang.get("spam_action")
			case '6':
				return lang.get("draft_action")
			default:
				// do not throw an error - new system folders may cause problems
				//throw new Error("illegal folder type: " + this.folder.getFolderType())
				return ""
		}
	}
}
// @flow
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {Icons} from "../gui/base/icons/Icons"

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


}
// @flow
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {Icons} from "../gui/base/icons/Icons"

assertMainOrNode()


export class MailFolderViewModel {
	folder: MailFolder;
	url: string; // can be changed from outside

	constructor(folder: MailFolder) {
		this.folder = folder
		this.url = `/mail/${folder.mails}`
	}


}
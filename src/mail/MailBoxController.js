//@flow
import {loadAll, load} from "../api/main/Entity"
import {MailFolderViewModel} from "./MailFolderViewModel"
import {isSameId} from "../api/common/EntityFunctions"
import {MailBoxTypeRef} from "../api/entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../api/entities/tutanota/MailFolder"
import {MailFolderType, FeatureType} from "../api/common/TutanotaConstants"
import {assertMainOrNode} from "../api/Env"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {NavButton} from "../gui/base/NavButton"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {neverNull} from "../api/common/utils/Utils"
import {logins} from "../api/main/LoginController"
import {ExpanderButton} from "../gui/base/Expander"
import {Button} from "../gui/base/Button"

assertMainOrNode()

export class MailBoxController {
	_mailbox: ?MailBox;
	_mailGroup: ?Group;
	mailGroupInfo: ?GroupInfo;
	_folders: MailFolderViewModel[];
	mailGroupMembership: GroupMembership;
	systemFolderButtons: NavButton[];
	customFolderButtons: NavButton[];
	mailboxExpander: ? ExpanderButton;
	folderAddButton: ? Button;


	constructor(mailGroupMembership: GroupMembership) {
		this._mailbox = null
		this.mailGroupInfo = null
		this._mailGroup = null
		this.mailboxExpander = null;
		this._folders = []
		this.mailGroupMembership = mailGroupMembership

	}

	loadMailBox(): Promise<MailBoxController> {
		let promises = []
		promises.push(load(MailboxGroupRootTypeRef, this.mailGroupMembership.group).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox).then(mbox => {
			this._mailbox = mbox
			return this._loadFolders(neverNull(mbox.systemFolders).folders, true)
		})))
		promises.push(load(GroupInfoTypeRef, this.mailGroupMembership.groupInfo).then(mailGroupInfo => this.mailGroupInfo = mailGroupInfo))
		promises.push(load(GroupTypeRef, this.mailGroupMembership.group).then(mailGroup => this._mailGroup = mailGroup))
		return Promise.all(promises).then(() => {
			return this
		})
	}


	_loadFolders(folderListId: Id, loadSubFolders: boolean): Promise<void> {
		return loadAll(MailFolderTypeRef, folderListId).map(folder => {
			this._folders.push(new MailFolderViewModel(folder))
			if (loadSubFolders) {
				return this._loadFolders(folder.subFolders, false)
			}
		}).return()
	}

	addFolder(folderId: IdTuple): Promise<boolean> {
		// check if the new folder is part of an existing folder list
		let parentFolder = this._folders.find(fvm => {
			return fvm.folder.subFolders === folderId[0];
		}, this)

		if (!parentFolder) {
			return Promise.resolve(false);
		}

		return load(MailFolderTypeRef, folderId, null).then(mailFolder => {
			// check if mailFolder is already in list. add the folder otherwise
			let mailFolderInList = this._folders.find(fvm => {
				return fvm.folder._id[1] === mailFolder._id[1]
			}, this)
			if (!mailFolderInList) {
				this._folders.push(new MailFolderViewModel(mailFolder));
				return true;
			} else {
				return false;
			}
		})
	}

	updateFolder(folderId: IdTuple): Promise<boolean> {
		// check if the new folder is part of an existing folder list
		let folderInList = this._folders.find(fvm => {
			return isSameId(fvm.folder._id, folderId);
		}, this)

		if (!folderInList) {
			return Promise.resolve(false);
		}

		return load(MailFolderTypeRef, folderId, null).then(mailFolder => {
			// check if we have the mailFolder
			for (let i = 0; i < this._folders.length; i++) {
				if (isSameId(this._folders[i].folder._id, folderId)) {
					this._folders.splice(i, 1, new MailFolderViewModel(mailFolder));
					return true;
				}
			}
			return false;
		})
	}

	deleteFolder(folderId: IdTuple): Promise<boolean> {
		// check if the new folder is part of an existing folder list
		for (let i = 0; i < this._folders.length; i++) {
			if (isSameId(this._folders[i].folder._id, folderId)) {
				this._folders.splice(i, 1)
				return Promise.resolve(true)
			}
		}
		return Promise.resolve(false)
	}


}
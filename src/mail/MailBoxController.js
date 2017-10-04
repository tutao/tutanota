//@flow
import {loadAll, load} from "../api/main/Entity"
import {MailFolderViewModel} from "./MailFolderViewModel"
import {isSameId} from "../api/common/EntityFunctions"
import {MailBoxTypeRef} from "../api/entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../api/entities/tutanota/MailFolder"
import {MailFolderType, EmailSignatureType as TutanotaConstants, FeatureType} from "../api/common/TutanotaConstants"
import {assertMainOrNode} from "../api/Env"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {NavButton} from "../gui/base/NavButton"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {neverNull, getEnabledMailAddressesForGroupInfo, getGroupInfoDisplayName} from "../api/common/utils/Utils"
import {logins} from "../api/main/LoginController"
import {ExpanderButton} from "../gui/base/Expander"
import {Button} from "../gui/base/Button"
import {contains} from "../api/common/utils/ArrayUtils"
import {getDefaultSignature} from "./MailUtils"
import {lang} from "../misc/LanguageViewModel"

assertMainOrNode()

export class MailBoxController {
	_mailbox: ?MailBox;
	_mailGroup: ?Group;
	mailGroupInfo: ?GroupInfo;
	displayName: string;
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
		this.displayName = ""
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
			if (!logins.isInternalUserLoggedIn()) {
				this.displayName = lang.get("mailbox_label")
			} else if (this.isUserMailbox()) {
				this.displayName = getGroupInfoDisplayName(logins.getUserController().userGroupInfo)
			} else {
				this.displayName = getGroupInfoDisplayName(neverNull(this.mailGroupInfo))
			}
			return this
		})
	}

	isUserMailbox() {
		return this._mailGroup && neverNull(this._mailGroup).user != null
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

	getSystemFolders(): MailFolderViewModel[] {
		return this._folders.filter(f => {
			if (f.folder.folderType == MailFolderType.CUSTOM) {
				return false
			} else if (f.folder.folderType == MailFolderType.SPAM && !logins.isInternalUserLoggedIn()) {
				return false
			} else if (logins.isEnabled(FeatureType.InternalCommunication) && f.folder.folderType === MailFolderType.SPAM) {
				return false
			} else {
				return true
			}
		}).sort((folder1, folder2) => {
			// insert the draft folder after inbox (use type number 1.5 which is after inbox)
			if (folder1.folder.folderType == MailFolderType.DRAFT) {
				return 1.5 - Number(folder2.folder.folderType);
			} else if (folder2.folder.folderType == MailFolderType.DRAFT) {
				return Number(folder1.folder.folderType) - 1.5;
			}
			return Number(folder1.folder.folderType) - Number(folder2.folder.folderType);
		})
	}

	getTrashFolder(): MailFolderViewModel {
		return (this._folders.find(vm => vm.folder.folderType === MailFolderType.TRASH):any)
	}

	getInboxFolder(): MailFolderViewModel {
		return (this._folders.find(vm => vm.folder.folderType === MailFolderType.INBOX):any)
	}

	getArchiveFolder(): MailFolderViewModel {
		return (this._folders.find(vm => vm.folder.folderType === MailFolderType.ARCHIVE):any)
	}

	getCustomFolders(): MailFolderViewModel[] {
		return this._folders.filter(f => f.folder.folderType == MailFolderType.CUSTOM).sort((folder1, folder2) => {
			return folder1.folder.name.localeCompare(folder2.folder.name)
		});
	}

	getAllFolders(): MailFolderViewModel[] {
		return this.getSystemFolders().concat(this.getCustomFolders())
	}

	updateNameFromGroupInfo(groupInfoId: IdTuple): Promise<boolean> {
		if (this.isUserMailbox() && isSameId(logins.getUserController().userGroupInfo._id, groupInfoId)) {
			return load(GroupInfoTypeRef, groupInfoId).then(groupInfo => {
				this.displayName = getGroupInfoDisplayName(groupInfo)
				return true
			})
		} else if (!this.isUserMailbox() && isSameId(this.mailGroupMembership.groupInfo, groupInfoId)) {
			return load(GroupInfoTypeRef, groupInfoId).then(groupInfo => {
				this.mailGroupInfo = groupInfo
				this.displayName = getGroupInfoDisplayName(groupInfo)
				return true
			})
		} else {
			return Promise.resolve(false)
		}
	}

	getEnabledMailAddresses(): string[] {
		if (this.isUserMailbox()) {
			return getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo)
		} else {
			return this._mailGroup != null ? getEnabledMailAddressesForGroupInfo(neverNull(this.mailGroupInfo)) : []
		}
	}


	getEmailSignature(): string {
		// provide the user signature, even for shared mail groups
		var type = logins.getUserController().props.emailSignatureType
		if (type == TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT) {
			return getDefaultSignature()
		} else if (type == TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM) {
			return logins.getUserController().props.customEmailSignature
		} else {
			return ""
		}
	}


	getDefaultSender(): string {
		if (this.isUserMailbox()) {
			let props = logins.getUserController().props
			return (props.defaultSender && contains(this.getEnabledMailAddresses(), props.defaultSender)) ? props.defaultSender : neverNull(logins.getUserController().userGroupInfo.mailAddress)
		} else {
			return neverNull(neverNull(this.mailGroupInfo).mailAddress)
		}
	}

	getSenderName(): string {
		let senderName = ""
		if (this.isUserMailbox()) {
			// external users do not have access to the user group info
			return logins.getUserController().userGroupInfo.name
		} else {
			return this.mailGroupInfo ? this.mailGroupInfo.name : ""
		}
	}


}
import {
	AdministratedGroupTypeRef,
	CustomerTypeRef,
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	UserTypeRef
} from "../../api/entities/sys/TypeRefs.js"
import {assertNotNull, LazyLoaded, neverNull, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {EntityClient} from "../../api/common/EntityClient.js"
import {GENERATED_MAX_ID, GENERATED_MIN_ID, isSameId} from "../../api/common/utils/EntityUtils.js"
import {BookingItemFeatureType, GroupType, OperationType} from "../../api/common/TutanotaConstants.js"
import {localAdminGroupInfoModel} from "../LocalAdminGroupInfoModel.js"
import {lang} from "../../misc/LanguageViewModel.js"
import {SelectorItemList} from "../../gui/base/DropDownSelector.js"
import {logins} from "../../api/main/LoginController.js"
import {Dialog, stringValidator} from "../../gui/base/Dialog.js"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog.js"
import {showBuyDialog} from "../../subscription/BuyDialog.js"
import {locator} from "../../api/main/MainLocator.js"
import {BadRequestError, NotAuthorizedError, PreconditionFailedError} from "../../api/common/error/RestError.js"
import {compareGroupInfos, getGroupInfoDisplayName} from "../../api/common/utils/GroupUtils.js"
import {EntityUpdateData, isUpdateForTypeRef} from "../../api/main/EventController.js"

export class GroupDetailsModel {
	groupInfo: GroupInfo
	private readonly group: LazyLoaded<Group>
	private usedStorageInBytes!: number
	private readonly members: LazyLoaded<Array<GroupInfo>>
	private administratedGroups!: LazyLoaded<Array<GroupInfo>>
	private localAdminGroupInfo: LazyLoaded<Array<GroupInfo>>

	constructor(
		groupInfo: GroupInfo,
		private readonly entityClient: EntityClient,
		private readonly updateViewCallback: () => void,
	) {
		this.entityClient = entityClient
		this.groupInfo = groupInfo
		this.group = new LazyLoaded(() => this.entityClient.load(GroupTypeRef, this.groupInfo.group))

		this.group.getAsync().then(() => this.updateViewCallback())

		this.members = new LazyLoaded(async () => {
			const group = await this.group.getAsync()
			// load only up to 200 members to avoid too long loading, like for account groups
			const groupMembers = await this.entityClient.loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 200, false)
			return promiseMap(groupMembers, member => this.entityClient.load(GroupInfoTypeRef, member.userGroupInfo))
		})

		// noinspection JSIgnoredPromiseFromCall
		this.updateMembers()

		if (this.groupInfo.groupType === GroupType.LocalAdmin) {
			this.administratedGroups = new LazyLoaded(async () => {
				const group = await this.group.getAsync()
				// load only up to 200 members to avoid too long loading, like for account groups
				const administratedGroups = await this.entityClient.loadRange(
					AdministratedGroupTypeRef,
					assertNotNull(group.administratedGroups).items,
					GENERATED_MAX_ID,
					200,
					true
				)
				return promiseMap(administratedGroups, administratedGroup => this.entityClient.load(GroupInfoTypeRef, administratedGroup.groupInfo))
			})

			// noinspection JSIgnoredPromiseFromCall
			this.updateAdministratedGroups()
		}

		this.localAdminGroupInfo = new LazyLoaded(() => localAdminGroupInfoModel.init())

		this.localAdminGroupInfo.getAsync().then(() => this.updateViewCallback())

		// noinspection JSIgnoredPromiseFromCall
		this.updateUsedStorage()
	}

	isGroupActive(): boolean {
		return this.groupInfo.deleted == null
	}

	getGroupType(): string | null {
		return this.group.isLoaded()
			? this.group.getLoaded().type
			: null

	}

	getGroupName(): string {
		return this.groupInfo.name
	}

	getUsedStorage(): number | null {
		return this.usedStorageInBytes
	}

	getCreationDate(): Date {
		return this.groupInfo.created
	}

	getMembersInfo(): Array<GroupInfo> {
		return this.members.isLoaded()
			? this.members.getLoaded()
			: []
	}

	getAdministratedGroups(): Array<GroupInfo> {
		return this.administratedGroups.isLoaded()
			? this.administratedGroups.getLoaded()
			: []
	}

	getGroupMailAddress(): string {
		return this.groupInfo.mailAddress ?? ""
	}

	/**
	 * remove the group of the given groupInfo from this group
	 */
	removeGroupMember(userGroupInfo: GroupInfo): void {
		showProgressDialog(
			"pleaseWait_msg",
			this.entityClient
				.load(GroupTypeRef, userGroupInfo.group)
				.then(userGroup => locator.groupManagementFacade.removeUserFromGroup(assertNotNull(userGroup.user), this.groupInfo.group)),
		).catch(
			ofClass(NotAuthorizedError, () => {
				Dialog.message("removeUserFromGroupNotAdministratedError_msg")
			}),
		)
	}

	async showGroupBuyDialog(deactivate: boolean): Promise<void> {
		const bookingItemType = this.groupInfo.groupType === GroupType.LocalAdmin
			? BookingItemFeatureType.LocalAdminGroup
			: BookingItemFeatureType.SharedMailGroup

		const confirmed = await showBuyDialog({featureType: bookingItemType, count: deactivate ? -1 : 1, freeAmount: 0, reactivate: !deactivate})
		if (confirmed) {
			const group = await this.group.getAsync()
			try {
				return await locator.groupManagementFacade.deactivateGroup(group, !deactivate)
			} catch (e) {
				if (!(e instanceof PreconditionFailedError)) throw e
				if (this.groupInfo.groupType === GroupType.LocalAdmin) {
					return Dialog.message("localAdminGroupAssignedError_msg")
				} else if (!deactivate) {
					return Dialog.message("emailAddressInUse_msg")
				} else {
					return Dialog.message("stillReferencedFromContactForm_msg")
				}
			}
		}
	}

	changeGroupName(newName: string): Promise<void> {
		const newGroupInfo: GroupInfo = Object.assign({}, this.groupInfo)
		newGroupInfo.name = newName

		return this.entityClient.update(newGroupInfo)
	}

	validateGroupName(newName: string): ReturnType<stringValidator> {
		if (this.group.isLoaded() && this.group.getLoaded().type === GroupType.MailingList && newName.trim() === "") {
			return "enterName_msg"
		} else {
			return null
		}
	}

	async onActivationStatusSelected(deactivate: boolean): Promise<void> {
		const members = await this.members.getAsync()
		if (deactivate && members.length > 0) {
			return Dialog.message("groupNotEmpty_msg")
		} else {
			return showProgressDialog("pleaseWait_msg", this.showGroupBuyDialog(deactivate))
		}
	}

	createAdministratedByInfo(): {options: SelectorItemList<Id | null>, currentVal: Id | null} | null {
		if (!this.localAdminGroupInfo.isLoaded()) return null

		const filteredLocalAdminGroupInfo = this.localAdminGroupInfo.getLoaded().filter(groupInfo => !groupInfo.deleted)

		const adminGroupIdToName: SelectorItemList<Id | null> = [
			{
				name: lang.get("globalAdmin_label"),
				value: null,
			},
			...filteredLocalAdminGroupInfo.map(gi => {
				return {
					name: getGroupInfoDisplayName(gi),
					value: gi.group,
				}
			})
		]

		return {
			options: adminGroupIdToName,
			currentVal: this.groupInfo.localAdmin
		}
	}

	onAdministratedBySelected(id: Id | null): void {
		if (this.groupInfo.groupType === GroupType.LocalAdmin) {
			// noinspection JSIgnoredPromiseFromCall
			Dialog.message("updateAdminshipLocalAdminGroupError_msg")
		} else {
			// noinspection JSIgnoredPromiseFromCall
			showProgressDialog(
				"pleaseWait_msg",
				Promise.resolve().then(() => {
					let newAdminGroupId = id
						? id
						: neverNull(logins.getUserController().user.memberships.find(gm => gm.groupType === GroupType.Admin)).group
					return locator.userManagementFacade.updateAdminship(this.groupInfo.group, newAdminGroupId)
				}),
			)
		}
	}

	async getPossibleMembers(): Promise<Array<{name: string, value: Id}>> {
		const customer = await this.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
		// remove all users that are already member
		let globalAdmin = logins.isGlobalAdminUserLoggedIn()
		let localAdminGroupIds = logins
			.getUserController()
			.getLocalAdminGroupMemberships()
			.map(gm => gm.group)
		let availableUserGroupInfos = userGroupInfos.filter(g => {
			if (!globalAdmin && localAdminGroupIds.indexOf(assertNotNull(g.localAdmin)) === -1) {
				return false
			} else {
				return !g.deleted && this.members.getLoaded().find(m => isSameId(m._id, g._id)) == null
			}
		})

		availableUserGroupInfos.sort(compareGroupInfos)
		return availableUserGroupInfos.map(g => ({name: getGroupInfoDisplayName(g), value: g.group}))
	}

	async addUserToGroup(group: Id): Promise<any> {
		const userGroup = await this.entityClient.load(GroupTypeRef, group)
		const user = await this.entityClient.load(UserTypeRef, neverNull(userGroup.user))
		return locator.groupManagementFacade.addUserToGroup(user, this.groupInfo.group)
	}

	private async updateMembers(): Promise<void> {
		if (this.members) {
			this.members.reset()
			await this.members.getAsync()
			this.updateViewCallback()
		}
	}

	private async updateAdministratedGroups(): Promise<void> {
		if (this.administratedGroups) {
			this.administratedGroups.reset()
			await this.administratedGroups.getAsync()
			this.updateViewCallback()
		}
	}

	isMailGroup(): boolean {
		return this.groupInfo.groupType === GroupType.Mail
	}

	private async updateUsedStorage(): Promise<void> {
		if (this.isMailGroup()) {
			try {
				this.usedStorageInBytes = await locator.groupManagementFacade.readUsedGroupStorage(this.groupInfo.group)
			} catch (e) {
				if (!(e instanceof BadRequestError)) throw e
				// may happen if the user gets the admin flag removed
			}
		} else {
			this.usedStorageInBytes = 0
		}

		this.updateViewCallback()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await promiseMap(updates, async update => {
			const {instanceListId, instanceId, operation} = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE) {
				const updatedUserGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.groupInfo._id)
				if (isSameId(this.groupInfo._id, [neverNull(instanceListId), instanceId])) {
					this.groupInfo = updatedUserGroupInfo
					return this.updateUsedStorage()
				} else {
					// a member name may have changed
					return this.updateMembers()
				}
			} else if (
				isUpdateForTypeRef(GroupMemberTypeRef, update) &&
				this.group.isLoaded() &&
				this.group.getLoaded().members === neverNull(instanceListId)
			) {
				// the members have changed
				return this.updateMembers()
			} else if (
				isUpdateForTypeRef(AdministratedGroupTypeRef, update) &&
				this.group.isLoaded() &&
				this.group.getLoaded().administratedGroups &&
				neverNull(this.group.getLoaded().administratedGroups).items === neverNull(instanceListId)
			) {
				return this.updateAdministratedGroups()
			}
		})
	}
}
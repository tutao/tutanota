import {
	AdministratedGroupTypeRef,
	createGroupInfo,
	CustomerTypeRef,
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	UserTypeRef,
} from "../../api/entities/sys/TypeRefs.js"
import { assertNotNull, getFirstOrThrow, LazyLoaded, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { EntityClient } from "../../api/common/EntityClient.js"
import { GENERATED_MAX_ID, GENERATED_MIN_ID, isSameId } from "../../api/common/utils/EntityUtils.js"
import { BookingItemFeatureType, GroupType, OperationType } from "../../api/common/TutanotaConstants.js"
import { localAdminGroupInfoModel } from "../LocalAdminGroupInfoModel.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { stringValidator } from "../../gui/base/Dialog.js"
import { locator } from "../../api/main/MainLocator.js"
import { BadRequestError, NotAuthorizedError, PreconditionFailedError } from "../../api/common/error/RestError.js"
import { compareGroupInfos, getGroupInfoDisplayName } from "../../api/common/utils/GroupUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/main/EventController.js"
import { MailboxPropertiesTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { UserError } from "../../api/main/UserError.js"
import { BookingParams } from "../../subscription/BuyDialog.js"

export class GroupDetailsModel {
	groupInfo: GroupInfo
	private readonly group: LazyLoaded<Group>
	private usedStorageInBytes!: number
	private readonly members: LazyLoaded<Array<GroupInfo>>
	private administratedGroups!: LazyLoaded<Array<GroupInfo>>
	private localAdminGroupInfo: LazyLoaded<Array<GroupInfo>>

	private senderName!: LazyLoaded<string>

	constructor(groupInfo: GroupInfo, private readonly entityClient: EntityClient, private readonly updateViewCallback: () => void) {
		this.entityClient = entityClient
		this.groupInfo = groupInfo
		this.group = new LazyLoaded(() => this.entityClient.load(GroupTypeRef, this.groupInfo.group))

		this.group.getAsync().then(() => this.updateViewCallback())

		this.members = new LazyLoaded(async () => {
			const group = await this.group.getAsync()
			// load only up to 200 members to avoid too long loading, like for account groups
			const groupMembers = await this.entityClient.loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 200, false)
			return promiseMap(groupMembers, (member) => this.entityClient.load(GroupInfoTypeRef, member.userGroupInfo))
		})

		// noinspection JSIgnoredPromiseFromCall
		this.updateMembers()

		if (this.groupInfo.groupType === GroupType.LocalAdmin) {
			this.administratedGroups = new LazyLoaded(() => this.loadAdministratedGroups())
			// noinspection JSIgnoredPromiseFromCall
			this.updateAdministratedGroups()
		} else if (this.groupInfo.groupType === GroupType.Mail) {
			this.senderName = new LazyLoaded<string>(() => this.loadSenderName())
			// noinspection JSIgnoredPromiseFromCall
			this.updateSenderName()
		}

		this.localAdminGroupInfo = new LazyLoaded(() => localAdminGroupInfoModel.init())

		this.localAdminGroupInfo.getAsync().then(() => this.updateViewCallback())

		// noinspection JSIgnoredPromiseFromCall
		this.updateUsedStorage()
	}

	isMailGroup(): boolean {
		return this.groupInfo.groupType === GroupType.Mail
	}

	private async loadAdministratedGroups(): Promise<Array<GroupInfo>> {
		const group = await this.group.getAsync()
		// load only up to 200 members to avoid too long loading, like for account groups
		const administratedGroups = await this.entityClient.loadRange(
			AdministratedGroupTypeRef,
			assertNotNull(group.administratedGroups).items,
			GENERATED_MAX_ID,
			200,
			true,
		)
		return promiseMap(administratedGroups, (administratedGroup) => this.entityClient.load(GroupInfoTypeRef, administratedGroup.groupInfo))
	}

	private async loadSenderName(): Promise<string> {
		const names = await locator.mailAddressFacade.getSenderNames(this.groupInfo.group)
		return getFirstOrThrow(Array.from(names.values()))
	}

	isGroupActive(): boolean {
		return this.groupInfo.deleted == null
	}

	getGroupType(): string | null {
		return this.group.isLoaded() ? this.group.getLoaded().type : null
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
		return this.members.isLoaded() ? this.members.getLoaded() : []
	}

	getAdministratedGroups(): Array<GroupInfo> {
		return this.administratedGroups.isLoaded() ? this.administratedGroups.getLoaded() : []
	}

	getGroupMailAddress(): string {
		return this.groupInfo.mailAddress ?? ""
	}

	getGroupSenderName(): string {
		return this.senderName.isLoaded() ? this.senderName.getLoaded() : lang.get("loading_msg")
	}

	/**
	 * remove the group of the given groupInfo from this group
	 */
	async removeGroupMember(userGroupInfo: GroupInfo): Promise<void> {
		try {
			const userGroup = await this.entityClient.load(GroupTypeRef, userGroupInfo.group)
			return locator.groupManagementFacade.removeUserFromGroup(assertNotNull(userGroup.user), this.groupInfo.group)
		} catch (e) {
			if (!(e instanceof NotAuthorizedError)) throw e
			throw new UserError("removeUserFromGroupNotAdministratedError_msg")
		}
	}

	async executeGroupBuy(deactivate: boolean): Promise<void> {
		const group = await this.group.getAsync()
		try {
			return await locator.groupManagementFacade.deactivateGroup(group, !deactivate)
		} catch (e) {
			if (!(e instanceof PreconditionFailedError)) throw e
			if (this.groupInfo.groupType === GroupType.LocalAdmin) {
				throw new UserError("localAdminGroupAssignedError_msg")
			} else if (!deactivate) {
				throw new UserError("emailAddressInUse_msg")
			} else {
				throw new UserError("stillReferencedFromContactForm_msg")
			}
		}
	}

	changeGroupName(newName: string): Promise<void> {
		const newGroupInfo: GroupInfo = createGroupInfo(this.groupInfo)
		newGroupInfo.name = newName
		return this.entityClient.update(newGroupInfo)
	}

	async changeGroupSenderName(newName: string): Promise<void> {
		if (this.senderName.isLoaded() && this.senderName.getLoaded() === newName) return
		const mailGroupId = await this.groupInfo.group
		await locator.mailAddressFacade.setSenderName(mailGroupId, this.getGroupMailAddress(), newName)

		// we may not be a member of the group and therefore won't necessarily receive updates
		// for updated mailbox properties.
		this.senderName.reset()
		// noinspection ES6MissingAwait
		this.senderName.getAsync()
		this.updateViewCallback()
	}

	validateGroupName(newName: string): ReturnType<stringValidator> {
		if (this.group.isLoaded() && this.group.getLoaded().type === GroupType.MailingList && newName.trim() === "") {
			return "enterName_msg"
		} else {
			return null
		}
	}

	/**
	 * validate if the given deactivation/activation is valid for this group and return information about the item to book, if any
	 * @param deactivate true if the group should be deactivated
	 * @return the relevant BookingParams if the activation/deactivatian may go ahead, null otherwise (no action necessary)
	 */
	async validateGroupActivationStatus(deactivate: boolean): Promise<BookingParams | null> {
		if (deactivate !== this.isGroupActive()) {
			console.log("tried to set activation status to current status.")
			return null
		}
		const members = await this.members.getAsync()
		if (deactivate && members.length > 0) {
			throw new UserError("groupNotEmpty_msg")
		} else {
			const bookingItemType =
				this.groupInfo.groupType === GroupType.LocalAdmin ? BookingItemFeatureType.LocalAdminGroup : BookingItemFeatureType.SharedMailGroup

			return {
				featureType: bookingItemType,
				count: deactivate ? -1 : 1,
				freeAmount: 0,
				reactivate: !deactivate,
			}
		}
	}

	createAdministratedByInfo(): { options: SelectorItemList<Id | null>; currentVal: Id | null } | null {
		if (!locator.logins.getUserController().isGlobalAdmin() || !this.localAdminGroupInfo.isLoaded()) return null

		const filteredLocalAdminGroupInfo = this.localAdminGroupInfo.getLoaded().filter((groupInfo) => !groupInfo.deleted)

		const adminGroupIdToName: SelectorItemList<Id | null> = [
			{
				name: lang.get("globalAdmin_label"),
				value: null,
			},
			...filteredLocalAdminGroupInfo.map((gi) => {
				return {
					name: getGroupInfoDisplayName(gi),
					value: gi.group,
				}
			}),
		]

		return {
			options: adminGroupIdToName,
			currentVal: this.groupInfo.localAdmin,
		}
	}

	/**
	 * change the local admin of this group to the group with the given id
	 * @param id the new admin groups id or null if it should be administrated by the global admin
	 */
	async changeAdministratedBy(id: Id | null): Promise<void> {
		if (this.groupInfo.groupType === GroupType.LocalAdmin) {
			throw new UserError("updateAdminshipLocalAdminGroupError_msg")
		} else {
			const newAdminGroupId = id || this.getAdminGroupId()
			return locator.userManagementFacade.updateAdminship(this.groupInfo.group, newAdminGroupId)
		}
	}

	/**
	 * whether this user can remove administrated groups.
	 */
	canRemoveAdminship(): boolean {
		return locator.logins.getUserController().isGlobalAdmin()
	}

	async removeAdministratedGroup(groupId: Id): Promise<void> {
		let adminGroupId = this.getAdminGroupId()
		return locator.userManagementFacade.updateAdminship(groupId, adminGroupId)
	}

	private getAdminGroupId(): Id {
		return assertNotNull(
			locator.logins.getUserController().user.memberships.find((gm) => gm.groupType === GroupType.Admin),
			"this user is not in any admin group",
		).group
	}

	async getPossibleMembers(): Promise<Array<{ name: string; value: Id }>> {
		const customer = await this.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
		// remove all users that are already member
		let globalAdmin = locator.logins.isGlobalAdminUserLoggedIn()
		let myLocalAdminShips = locator.logins
			.getUserController()
			.getLocalAdminGroupMemberships()
			.map((gm) => gm.group)
		let availableUserGroupInfos = userGroupInfos.filter((userGroupInfo) => {
			if (
				!globalAdmin && // if we are global admin we may add anyone, don't filter
				!(
					// don't filter if both:
					(
						userGroupInfo.localAdmin != null && // the user does have a local admin and
						myLocalAdminShips.includes(userGroupInfo.localAdmin)
					) // we are a member of the users local admin group
				)
			) {
				return false
			} else {
				// only show users that are not deleted and not already in the group.
				return !userGroupInfo.deleted && this.members.getLoaded().find((m) => isSameId(m._id, userGroupInfo._id)) == null
			}
		})

		availableUserGroupInfos.sort(compareGroupInfos)
		return availableUserGroupInfos.map((g) => ({ name: getGroupInfoDisplayName(g), value: g.group }))
	}

	async addUserToGroup(group: Id): Promise<any> {
		const userGroup = await this.entityClient.load(GroupTypeRef, group)
		const user = await this.entityClient.load(UserTypeRef, neverNull(userGroup.user))
		return locator.groupManagementFacade.addUserToGroup(user, this.groupInfo.group)
	}

	private async updateMembers(): Promise<void> {
		this.members.reset()
		await this.members.getAsync()
		this.updateViewCallback()
	}

	private async updateAdministratedGroups(): Promise<void> {
		this.administratedGroups.reset()
		await this.administratedGroups.getAsync()
		this.updateViewCallback()
	}

	private async updateSenderName(): Promise<void> {
		this.senderName.reset()
		await this.senderName.getAsync()
		this.updateViewCallback()
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
		await promiseMap(updates, async (update) => {
			const { instanceListId, instanceId, operation } = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE) {
				const updatedUserGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.groupInfo._id)
				if (isSameId(this.groupInfo._id, [assertNotNull(instanceListId, "got groupInfo update without instanceListId"), instanceId])) {
					this.groupInfo = updatedUserGroupInfo
					return this.updateUsedStorage()
				} else {
					// a member name may have changed
					return this.updateMembers()
				}
			} else if (
				isUpdateForTypeRef(GroupMemberTypeRef, update) &&
				this.group.isLoaded() &&
				this.group.getLoaded().members === assertNotNull(instanceListId, "got a groupMember update without instanceListId")
			) {
				// the members have changed
				return this.updateMembers()
			} else if (
				isUpdateForTypeRef(AdministratedGroupTypeRef, update) &&
				this.group.isLoaded() &&
				this.group.getLoaded().administratedGroups &&
				this.group.getLoaded().administratedGroups!.items === assertNotNull(instanceListId, "got administratedGroup update without instanceListId")
			) {
				return this.updateAdministratedGroups()
			} else if (this.isMailGroup() && isUpdateForTypeRef(MailboxPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				// the sender name belonging to this group may have changed.
				// noinspection ES6MissingAwait
				this.updateSenderName()
			}
		})
	}
}

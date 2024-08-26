import {
	createGroupInfo,
	CustomerTypeRef,
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	UserTypeRef,
} from "../../../common/api/entities/sys/TypeRefs.js"
import { assertNotNull, getFirstOrThrow, LazyLoaded, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { GENERATED_MIN_ID, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { BookingItemFeatureType, GroupType, OperationType } from "../../../common/api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { stringValidator } from "../../../common/gui/base/Dialog.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { BadRequestError, NotAuthorizedError, PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { compareGroupInfos, getGroupInfoDisplayName } from "../../../common/api/common/utils/GroupUtils.js"
import { MailboxPropertiesTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { BookingParams } from "../../../common/subscription/BuyDialog.js"
import { toFeatureType } from "../../../common/subscription/SubscriptionUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"

export class GroupDetailsModel {
	groupInfo: GroupInfo
	private readonly group: LazyLoaded<Group>
	private usedStorageInBytes!: number
	private readonly members: LazyLoaded<Array<GroupInfo>>

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

		if (this.groupInfo.groupType === GroupType.Mail) {
			this.senderName = new LazyLoaded<string>(() => this.loadSenderName())
			// noinspection JSIgnoredPromiseFromCall
			this.updateSenderName()
		}

		// noinspection JSIgnoredPromiseFromCall
		this.updateUsedStorage()
	}

	isMailGroup(): boolean {
		return this.groupInfo.groupType === GroupType.Mail
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
			if (!deactivate) {
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
			const userController = locator.logins.getUserController()
			const planType = await userController.getPlanType()
			const useLegacyBookingItem = await userController.useLegacyBookingItem()

			const bookingItemType = useLegacyBookingItem ? toFeatureType(planType) : BookingItemFeatureType.SharedMailGroup
			const bookingText: TranslationKey = deactivate ? "cancelSharedMailbox_label" : "sharedMailbox_label"

			return {
				featureType: bookingItemType,
				bookingText: bookingText,
				count: deactivate ? -1 : 1,
				freeAmount: 0,
				reactivate: !deactivate,
			}
		}
	}

	async getPossibleMembers(): Promise<Array<{ name: string; value: Id }>> {
		const customer = await this.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
		// remove all users that are already member
		let globalAdmin = locator.logins.isGlobalAdminUserLoggedIn()
		let availableUserGroupInfos = userGroupInfos.filter((userGroupInfo) => {
			if (
				!globalAdmin // if we are not a  global admin we may not add anyone, don't filter
			) {
				return false
			} else {
				// only show users that are not deleted and not already in the group.
				return !userGroupInfo.deleted && !this.members.getLoaded().some((m) => isSameId(m._id, userGroupInfo._id))
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

	private async updateSenderName(): Promise<void> {
		this.senderName.reset()
		await this.senderName.getAsync()
		this.updateViewCallback()
	}

	private async updateUsedStorage(): Promise<void> {
		if (this.isMailGroup()) {
			try {
				this.usedStorageInBytes = await locator.groupManagementFacade.readUsedSharedMailGroupStorage(await this.group.getAsync())
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
			} else if (this.isMailGroup() && isUpdateForTypeRef(MailboxPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				// the sender name belonging to this group may have changed.
				// noinspection ES6MissingAwait
				this.updateSenderName()
			}
		})
	}
}

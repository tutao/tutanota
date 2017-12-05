// @flow
import type {OperationTypeEnum} from "../common/TutanotaConstants"
import {AccountType, OperationType, GroupType} from "../common/TutanotaConstants"
import {load, loadRoot} from "./Entity"
import {neverNull} from "../common/utils/Utils"
import {CustomerTypeRef} from "../entities/sys/Customer"
import {UserTypeRef} from "../entities/sys/User"
import {isSameTypeRef, isSameId} from "../common/EntityFunctions"
import {GroupInfoTypeRef} from "../entities/sys/GroupInfo"
import {assertMainOrNode, getHttpOrigin} from "../Env"
import {TutanotaPropertiesTypeRef} from "../entities/tutanota/TutanotaProperties"
import {_TypeModel as SessionModelType} from "../entities/sys/Session"

assertMainOrNode()

export class UserController {
	user: User;
	userGroupInfo: GroupInfo;
	props: TutanotaProperties;
	sessionId: IdTuple;
	accessToken: Base64Url;
	persistentSession: boolean;

	constructor(user: User, userGroupInfo: GroupInfo, sessionId: IdTuple, props: TutanotaProperties, accessToken: Base64Url, persistentSession: boolean) {
		this.user = user
		this.userGroupInfo = userGroupInfo
		this.props = props
		this.sessionId = sessionId
		this.accessToken = accessToken
		this.persistentSession = persistentSession
	}

	/**
	 * Checks if the current user is an admin of the customer.
	 * @return True if the user is an admin
	 */
	isAdmin() {
		if (this.isInternalUser()) {
			return this.user.memberships.find(m => m.admin) != null
		} else {
			return false;
		}
	}

	/**
	 * Checks if the account type of the logged in user is FREE.
	 * @returns True if the account type is FREE otherwise false
	 */
	isFreeAccount(): boolean {
		return this.user.accountType === AccountType.FREE
	}


	isPremiumAccount(): boolean {
		return this.user.accountType === AccountType.PREMIUM
	}

	isOutlookAccount(): boolean {
		return this.user.accountType === AccountType.STARTER
	}

	/**
	 * Provides the information if an internal user is logged in.
	 * @return True if an internal user is logged in, false if no user or an external user is logged in.
	 */
	isInternalUser(): boolean {
		return this.user.accountType !== AccountType.EXTERNAL
	}

	loadCustomer(): Promise<Customer> {
		return load(CustomerTypeRef, neverNull(this.user.customer))
	}


	getMailGroupMemberships(): GroupMembership[] {
		return this.user.memberships.filter(membership => membership.groupType == GroupType.Mail)
	}

	getUserMailGroupMembership(): GroupMembership {
		return this.getMailGroupMemberships()[0]
	}

	entityEventReceived(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum):void{
		if (operation == OperationType.UPDATE && isSameTypeRef(typeRef, UserTypeRef) && isSameId(this.user._id, elementId)) {
			load(UserTypeRef, this.user._id).then(updatedUser => {
				this.user = updatedUser
			})
		} else if (operation == OperationType.UPDATE && isSameTypeRef(typeRef, GroupInfoTypeRef) && isSameId(this.userGroupInfo._id, [neverNull(listId), elementId])) {
			load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
				this.userGroupInfo = updatedUserGroupInfo
			})
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && operation == OperationType.UPDATE) {
			loadRoot(TutanotaPropertiesTypeRef, this.user.userGroup.group).then(props => {
				this.props = props
			})
		}
	}

	deleteSession(sync: boolean): Promise<void> {
		if (this.persistentSession) return Promise.resolve()
		let path = '/rest/sys/session/' + this.sessionId[0] + "/" + this.sessionId[1]

		return Promise.fromCallback((resolve, reject) => {
			var xhr = new XMLHttpRequest()
			xhr.open("DELETE", getHttpOrigin() + path, !sync) // sync requests increase reliablity when invoke in onunload
			xhr.setRequestHeader('accessToken', this.accessToken)
			xhr.setRequestHeader('v', SessionModelType.version)
			xhr.onload = function () { // XMLHttpRequestProgressEvent, but not needed
				if (xhr.status === 200) {
					console.log("deleted session")
					resolve()
				} else if (xhr.status == 401) {
					console.log("authentication failed => session is already deleted")
					resolve()
				} else {
					console.error("could not delete session " + xhr.status)
					reject("could not delete session " + xhr.status)
				}
			}
			xhr.onerror = function () {
				console.error("failed to request delete session")
				reject("failed to request delete session")
			}
			xhr.send()
		})
	}

}

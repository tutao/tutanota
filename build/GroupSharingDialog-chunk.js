import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assert, assertNotNull, downcast, findAndRemove, neverNull, noOp, ofClass, pMap, remove } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { OperationType, ShareCapability } from "./TutanotaConstants-chunk.js";
import { getElementId, getEtId, isSameId } from "./EntityUtils-chunk.js";
import { cleanMailAddress, findRecipientWithAddress } from "./CommonCalendarUtils-chunk.js";
import { GroupMemberTypeRef, GroupTypeRef, SentGroupInvitationTypeRef } from "./TypeRefs2-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { NotFoundError, PreconditionFailedError, TooManyRequestsError } from "./RestError-chunk.js";
import { RecipientsNotFoundError } from "./RecipientsNotFoundError-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, DialogType, DropDownSelector, TextField, getConfirmation } from "./Dialog-chunk.js";
import { getCapabilityText, getMemberCapability, getSharedGroupName, hasCapabilityOnGroup, isShareableGroupType, isSharedGroupOwner, loadGroupInfoForMember, loadGroupMembers } from "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { getMailAddressDisplayText } from "./SharedMailUtils-chunk.js";
import { RecipientType } from "./Recipient-chunk.js";
import { ResolveMode } from "./RecipientsModel-chunk.js";
import { MailRecipientsTextField } from "./MailRecipientsTextField-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { ColumnWidth, Table } from "./Table-chunk.js";
import { getTextsForGroupType, sendShareNotificationEmail } from "./GroupGuiUtils-chunk.js";

//#region src/common/sharing/model/GroupSharingModel.ts
var import_stream$1 = __toESM(require_stream(), 1);
var GroupSharingModel = class GroupSharingModel {
	info;
	group;
	memberInfos;
	sentGroupInvitations;
	eventController;
	entityClient;
	logins;
	onEntityUpdate;
	_mailFacade;
	_shareFacade;
	_groupManagementFacade;
	constructor(groupInfo, group, memberInfos, sentGroupInvitations, eventController, entityClient, logins, mailFacade, shareFacade, groupManagementFacade, recipientsModel) {
		this.recipientsModel = recipientsModel;
		this.info = groupInfo;
		this.group = group;
		this.memberInfos = memberInfos;
		this.sentGroupInvitations = sentGroupInvitations;
		this.eventController = eventController;
		this.entityClient = entityClient;
		this.logins = logins;
		this._mailFacade = mailFacade;
		this._shareFacade = shareFacade;
		this._groupManagementFacade = groupManagementFacade;
		this.onEntityUpdate = (0, import_stream$1.default)();
		this.eventController.addEntityListener(this.onEntityEvents);
	}
	onEntityEvents = (events, id) => this.entityEventsReceived(events, id);
	static newAsync(info, eventController, entityClient, logins, mailFacade, shareFacade, groupManagementFacade, recipientsModel) {
		return entityClient.load(GroupTypeRef, info.group).then((group) => Promise.all([entityClient.loadAll(SentGroupInvitationTypeRef, group.invitations), loadGroupMembers(group, entityClient)]).then(([sentGroupInvitations, memberInfos]) => new GroupSharingModel(info, group, memberInfos, sentGroupInvitations, eventController, entityClient, logins, mailFacade, shareFacade, groupManagementFacade, recipientsModel)));
	}
	dispose() {
		this.eventController.removeEntityListener(this.onEntityEvents);
	}
	/**
	* Whether or not a given member can be removed from the group by the current user
	*/
	canRemoveGroupMember(member) {
		return (hasCapabilityOnGroup(this.logins.getUserController().user, this.group, ShareCapability.Invite) || this.memberIsSelf(member)) && !isSharedGroupOwner(this.group, member.user);
	}
	removeGroupMember(member) {
		return this.canRemoveGroupMember(member) ? this._groupManagementFacade.removeUserFromGroup(member.user, getEtId(this.group)) : Promise.reject(new ProgrammingError("User does not have permission to remove this member from the group"));
	}
	/**
	* Whether or not a given invitation can be cancelled by the current user
	* @param group
	* @param sentGroupInvitation
	* @returns {boolean}
	*/
	canCancelInvitation(sentGroupInvitation) {
		return hasCapabilityOnGroup(this.logins.getUserController().user, this.group, ShareCapability.Invite) || isSharedGroupOwner(this.group, this.logins.getUserController().user._id);
	}
	memberIsSelf(member) {
		return isSameId(this.logins.getUserController().user._id, member.user);
	}
	cancelInvitation(invitation) {
		return this.canCancelInvitation(invitation) && invitation.receivedInvitation ? this._shareFacade.rejectOrCancelGroupInvitation(invitation.receivedInvitation) : Promise.reject(new Error("User does not have permission to cancel this invitation"));
	}
	async sendGroupInvitation(sharedGroupInfo, recipients, capability) {
		const externalRecipients = [];
		for (let recipient of recipients) {
			const resolved = await this.recipientsModel.resolve(recipient, ResolveMode.Eager).resolved();
			if (resolved.type !== RecipientType.INTERNAL) externalRecipients.push(resolved.address);
		}
		if (externalRecipients.length) throw new UserError(lang.makeTranslation("featureTutanotaOnly_msg", lang.get("featureTutanotaOnly_msg") + " " + lang.get("invalidRecipients_msg") + "\n" + externalRecipients.join("\n")));
		let groupInvitationReturn;
		try {
			groupInvitationReturn = await this._shareFacade.sendGroupInvitation(sharedGroupInfo, recipients.map((r) => r.address), capability);
		} catch (e) {
			if (e instanceof RecipientsNotFoundError) throw new UserError(lang.makeTranslation("tutanotaAddressDoesNotExist_msg", `${lang.get("tutanotaAddressDoesNotExist_msg")} ${lang.get("invalidRecipients_msg")}\n${e.message}`));
else throw e;
		}
		if (groupInvitationReturn.existingMailAddresses.length > 0 || groupInvitationReturn.invalidMailAddresses.length > 0) {
			const existingMailAddresses = groupInvitationReturn.existingMailAddresses.map((ma) => ma.address).join("\n");
			const invalidMailAddresses = groupInvitationReturn.invalidMailAddresses.map((ma) => ma.address).join("\n");
			let msg = "";
			msg += existingMailAddresses.length === 0 ? "" : lang.get("existingMailAddress_msg") + "\n" + existingMailAddresses;
			msg += existingMailAddresses.length === 0 && invalidMailAddresses.length === 0 ? "" : "\n\n";
			msg += invalidMailAddresses.length === 0 ? "" : lang.get("invalidMailAddress_msg") + "\n" + invalidMailAddresses;
			throw new UserError(lang.makeTranslation("group_invitation_err", msg));
		}
		return groupInvitationReturn.invitedMailAddresses;
	}
	entityEventsReceived(updates, eventOwnerGroupId) {
		return pMap(updates, (update) => {
			if (!isSameId(eventOwnerGroupId, getEtId(this.group))) return;
			if (isUpdateForTypeRef(SentGroupInvitationTypeRef, update)) {
				if (update.operation === OperationType.CREATE && isSameId(update.instanceListId, this.group.invitations)) return this.entityClient.load(SentGroupInvitationTypeRef, [update.instanceListId, update.instanceId]).then((instance) => {
					if (instance) {
						this.sentGroupInvitations.push(instance);
						this.onEntityUpdate();
					}
				}).catch(ofClass(NotFoundError, (e) => console.log("sent invitation not found", update)));
				if (update.operation === OperationType.DELETE) {
					findAndRemove(this.sentGroupInvitations, (sentGroupInvitation) => isSameId(getElementId(sentGroupInvitation), update.instanceId));
					this.onEntityUpdate();
				}
			} else if (isUpdateForTypeRef(GroupMemberTypeRef, update)) {
				console.log("update received in share dialog", update);
				if (update.operation === OperationType.CREATE && isSameId(update.instanceListId, this.group.members)) return this.entityClient.load(GroupMemberTypeRef, [update.instanceListId, update.instanceId]).then((instance) => {
					if (instance) return loadGroupInfoForMember(instance, this.entityClient).then((groupMemberInfo) => {
						console.log("new member", groupMemberInfo);
						this.memberInfos.push(groupMemberInfo);
						this.onEntityUpdate();
					});
				}).catch(ofClass(NotFoundError, (e) => console.log("group member not found", update)));
				if (update.operation === OperationType.DELETE) {
					findAndRemove(this.memberInfos, (memberInfo) => isSameId(getElementId(memberInfo.member), update.instanceId));
					this.onEntityUpdate();
				}
			}
		}).then(noOp);
	}
};

//#endregion
//#region src/common/sharing/view/GroupSharingDialog.ts
var import_stream = __toESM(require_stream(), 1);
async function showGroupSharingDialog(groupInfo, allowGroupNameOverride) {
	const groupType = downcast(assertNotNull(groupInfo.groupType));
	assert(isShareableGroupType(groupInfo.groupType), `Group type "${groupType}" must be shareable`);
	const texts = getTextsForGroupType(groupType);
	const recipientsModel = await locator.recipientsModel();
	showProgressDialog("loading_msg", GroupSharingModel.newAsync(groupInfo, locator.eventController, locator.entityClient, locator.logins, locator.mailFacade, locator.shareFacade, locator.groupManagementFacade, recipientsModel)).then((model) => {
		model.onEntityUpdate.map(mithril_default.redraw.bind(mithril_default));
		let dialog = Dialog.showActionDialog({
			title: "sharing_label",
			type: DialogType.EditMedium,
			child: () => mithril_default(GroupSharingDialogContent, {
				model,
				allowGroupNameOverride,
				texts,
				dialog
			}),
			okAction: null,
			cancelAction: () => model.dispose(),
			cancelActionTextId: "close_alt"
		});
	});
}
var GroupSharingDialogContent = class {
	view(vnode) {
		const { model, allowGroupNameOverride, texts, dialog } = vnode.attrs;
		const groupName = getSharedGroupName(model.info, model.logins.getUserController(), allowGroupNameOverride);
		return mithril_default(".flex.col.pt-s", [mithril_default(Table, {
			columnHeading: [lang.makeTranslation("column_heading", texts.participantsLabel(groupName))],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			lines: this._renderMemberInfos(model, texts, groupName, dialog).concat(this._renderGroupInvitations(model, texts, groupName)),
			showActionButtonColumn: true,
			addButtonAttrs: hasCapabilityOnGroup(locator.logins.getUserController().user, model.group, ShareCapability.Invite) ? {
				title: "addParticipant_action",
				click: () => showAddParticipantDialog(model, texts),
				icon: Icons.Add
			} : null
		})]);
	}
	_renderGroupInvitations(model, texts, groupName) {
		return model.sentGroupInvitations.map((sentGroupInvitation) => {
			let iconBtn = {
				title: "remove_action",
				click: () => {
					getConfirmation(lang.makeTranslation("confirmation_msg", texts.removeMemberMessage(groupName, sentGroupInvitation.inviteeMailAddress))).confirmed(async () => {
						await model.cancelInvitation(sentGroupInvitation);
						mithril_default.redraw();
					});
				},
				icon: Icons.Cancel
			};
			return {
				cells: () => [{
					main: sentGroupInvitation.inviteeMailAddress,
					info: [`${lang.get("invited_label")}, ${getCapabilityText(downcast(sentGroupInvitation.capability))}`],
					mainStyle: ".i"
				}],
				actionButtonAttrs: model.canCancelInvitation(sentGroupInvitation) ? iconBtn : null
			};
		});
	}
	_renderMemberInfos(model, texts, groupName, dialog) {
		return model.memberInfos.map((memberInfo) => {
			return {
				cells: () => [{
					main: getMailAddressDisplayText(memberInfo.info.name, neverNull(memberInfo.info.mailAddress), false),
					info: [(isSharedGroupOwner(model.group, memberInfo.member.user) ? lang.get("owner_label") : lang.get("participant_label")) + ", " + getCapabilityText(getMemberCapability(memberInfo, model.group))]
				}],
				actionButtonAttrs: model.canRemoveGroupMember(memberInfo.member) ? {
					title: "delete_action",
					icon: Icons.Cancel,
					click: () => {
						getConfirmation(lang.makeTranslation("confirmation_msg", texts.removeMemberMessage(groupName, downcast(memberInfo.info.mailAddress)))).confirmed(async () => {
							await model.removeGroupMember(memberInfo.member);
							if (model.memberIsSelf(memberInfo.member)) dialog.close();
							mithril_default.redraw();
						});
					}
				} : null
			};
		});
	}
};
async function showAddParticipantDialog(model, texts) {
	const recipientsText = (0, import_stream.default)("");
	const recipients = [];
	const capability = (0, import_stream.default)(ShareCapability.Read);
	const realGroupName = getSharedGroupName(model.info, locator.logins.getUserController(), false);
	const customGroupName = getSharedGroupName(model.info, locator.logins.getUserController(), true);
	const search = await locator.recipientsSearchModel();
	const recipientsModel = await locator.recipientsModel();
	let dialog = Dialog.showActionDialog({
		type: DialogType.EditMedium,
		title: "addParticipant_action",
		child: () => [
			mithril_default(".rel", mithril_default(MailRecipientsTextField, {
				label: "shareWithEmailRecipient_label",
				text: recipientsText(),
				recipients,
				disabled: false,
				getRecipientClickedDropdownAttrs: async (address) => [{
					info: address,
					center: false,
					bold: false
				}, {
					label: "remove_action",
					type: ButtonType.Secondary,
					click: () => {
						const bubbleToRemove = findRecipientWithAddress(recipients, address);
						if (bubbleToRemove) remove(recipients, bubbleToRemove);
					}
				}],
				onRecipientAdded: (address, name, contact) => recipients.push(recipientsModel.resolve({
					address,
					name,
					contact
				}, ResolveMode.Eager).whenResolved(() => mithril_default.redraw())),
				onRecipientRemoved: (address) => findAndRemove(recipients, (recipient) => cleanMailAddress(recipient.address) === cleanMailAddress(address)),
				onTextChanged: recipientsText,
				search,
				maxSuggestionsToShow: 3
			})),
			mithril_default(DropDownSelector, {
				label: "permissions_label",
				items: [
					{
						name: getCapabilityText(ShareCapability.Invite),
						value: ShareCapability.Invite
					},
					{
						name: getCapabilityText(ShareCapability.Write),
						value: ShareCapability.Write
					},
					{
						name: getCapabilityText(ShareCapability.Read),
						value: ShareCapability.Read
					}
				],
				selectedValue: capability(),
				selectionChangedHandler: capability,
				dropdownWidth: 300
			}),
			mithril_default(TextField, {
				value: realGroupName,
				label: texts.groupNameLabel,
				isReadOnly: true,
				helpLabel: () => {
					return mithril_default("", customGroupName === realGroupName ? null : texts.yourCustomNameLabel(customGroupName));
				}
			}),
			mithril_default(".pt", texts.addMemberMessage(customGroupName || realGroupName))
		],
		okAction: async () => {
			if (recipients.length === 0) return Dialog.message("noRecipients_msg");
			const { checkPaidSubscription, showPlanUpgradeRequiredDialog } = await import("./SubscriptionDialogs2-chunk.js");
			if (await checkPaidSubscription()) try {
				const invitedMailAddresses = await showProgressDialog("calendarInvitationProgress_msg", model.sendGroupInvitation(model.info, recipients, capability()));
				dialog.close();
				await sendShareNotificationEmail(model.info, invitedMailAddresses, texts);
			} catch (e) {
				if (e instanceof PreconditionFailedError) if (locator.logins.getUserController().isGlobalAdmin()) {
					const { getAvailablePlansWithSharing } = await import("./SubscriptionUtils2-chunk.js");
					const plans = await getAvailablePlansWithSharing();
					await showPlanUpgradeRequiredDialog(plans);
				} else Dialog.message("contactAdmin_msg");
else if (e instanceof UserError) showUserError(e);
else if (e instanceof TooManyRequestsError) Dialog.message("tooManyAttempts_msg");
else throw e;
			}
		},
		okActionTextId: "invite_alt"
	}).setCloseHandler(() => {
		dialog.close();
	});
}

//#endregion
export { showGroupSharingDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JvdXBTaGFyaW5nRGlhbG9nLWNodW5rLmpzIiwibmFtZXMiOlsiZ3JvdXBJbmZvOiBHcm91cEluZm8iLCJncm91cDogR3JvdXAiLCJtZW1iZXJJbmZvczogQXJyYXk8R3JvdXBNZW1iZXJJbmZvPiIsInNlbnRHcm91cEludml0YXRpb25zOiBBcnJheTxTZW50R3JvdXBJbnZpdGF0aW9uPiIsImV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyIiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsIm1haWxGYWNhZGU6IE1haWxGYWNhZGUiLCJzaGFyZUZhY2FkZTogU2hhcmVGYWNhZGUiLCJncm91cE1hbmFnZW1lbnRGYWNhZGU6IEdyb3VwTWFuYWdlbWVudEZhY2FkZSIsInJlY2lwaWVudHNNb2RlbDogUmVjaXBpZW50c01vZGVsIiwiaW5mbzogR3JvdXBJbmZvIiwibWVtYmVyOiBHcm91cE1lbWJlciIsInNlbnRHcm91cEludml0YXRpb246IFNlbnRHcm91cEludml0YXRpb24iLCJpbnZpdGF0aW9uOiBTZW50R3JvdXBJbnZpdGF0aW9uIiwic2hhcmVkR3JvdXBJbmZvOiBHcm91cEluZm8iLCJyZWNpcGllbnRzOiBBcnJheTxSZWNpcGllbnQ+IiwiY2FwYWJpbGl0eTogU2hhcmVDYXBhYmlsaXR5IiwiZXh0ZXJuYWxSZWNpcGllbnRzOiBzdHJpbmdbXSIsInVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4iLCJldmVudE93bmVyR3JvdXBJZDogSWQiLCJncm91cEluZm86IEdyb3VwSW5mbyIsImFsbG93R3JvdXBOYW1lT3ZlcnJpZGU6IGJvb2xlYW4iLCJtIiwidm5vZGU6IFZub2RlPEdyb3VwU2hhcmluZ0RpYWxvZ0F0dHJzPiIsIm1vZGVsOiBHcm91cFNoYXJpbmdNb2RlbCIsInRleHRzOiBHcm91cFNoYXJpbmdUZXh0cyIsImdyb3VwTmFtZTogc3RyaW5nIiwiaWNvbkJ0bjogSWNvbkJ1dHRvbkF0dHJzIiwiZGlhbG9nOiBEaWFsb2ciXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL3NoYXJpbmcvbW9kZWwvR3JvdXBTaGFyaW5nTW9kZWwudHMiLCIuLi9zcmMvY29tbW9uL3NoYXJpbmcvdmlldy9Hcm91cFNoYXJpbmdEaWFsb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRW50aXR5RXZlbnRzTGlzdGVuZXIsIEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXJcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IGdldEVsZW1lbnRJZCwgZ2V0RXRJZCwgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgdHlwZSB7IEdyb3VwLCBHcm91cEluZm8sIEdyb3VwTWVtYmVyLCBTZW50R3JvdXBJbnZpdGF0aW9uIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgR3JvdXBNZW1iZXJUeXBlUmVmLCBHcm91cFR5cGVSZWYsIFNlbnRHcm91cEludml0YXRpb25UeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgT3BlcmF0aW9uVHlwZSwgU2hhcmVDYXBhYmlsaXR5IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQgeyBmaW5kQW5kUmVtb3ZlLCBub09wLCBvZkNsYXNzLCBwcm9taXNlTWFwIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IEdyb3VwTWVtYmVySW5mbyB9IGZyb20gXCIuLi9Hcm91cFV0aWxzXCJcbmltcG9ydCB7IGhhc0NhcGFiaWxpdHlPbkdyb3VwLCBpc1NoYXJlZEdyb3VwT3duZXIsIGxvYWRHcm91cEluZm9Gb3JNZW1iZXIsIGxvYWRHcm91cE1lbWJlcnMgfSBmcm9tIFwiLi4vR3JvdXBVdGlsc1wiXG5pbXBvcnQgdHlwZSB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXJcIlxuaW1wb3J0IHsgVXNlckVycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL1VzZXJFcnJvclwiXG5pbXBvcnQgdHlwZSB7IE1haWxBZGRyZXNzIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgUmVjaXBpZW50c05vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9SZWNpcGllbnRzTm90Rm91bmRFcnJvclwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvclwiXG5pbXBvcnQgdHlwZSB7IE1haWxGYWNhZGUgfSBmcm9tIFwiLi4vLi4vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvTWFpbEZhY2FkZS5qc1wiXG5pbXBvcnQgdHlwZSB7IFNoYXJlRmFjYWRlIH0gZnJvbSBcIi4uLy4uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L1NoYXJlRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgR3JvdXBNYW5hZ2VtZW50RmFjYWRlIH0gZnJvbSBcIi4uLy4uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dyb3VwTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBSZWNpcGllbnQsIFJlY2lwaWVudFR5cGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9yZWNpcGllbnRzL1JlY2lwaWVudFwiXG5pbXBvcnQgeyBSZWNpcGllbnRzTW9kZWwsIFJlc29sdmVNb2RlIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL1JlY2lwaWVudHNNb2RlbFwiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5cbmV4cG9ydCBjbGFzcyBHcm91cFNoYXJpbmdNb2RlbCB7XG5cdHJlYWRvbmx5IGluZm86IEdyb3VwSW5mb1xuXHRyZWFkb25seSBncm91cDogR3JvdXBcblx0cmVhZG9ubHkgbWVtYmVySW5mb3M6IEFycmF5PEdyb3VwTWVtYmVySW5mbz5cblx0cmVhZG9ubHkgc2VudEdyb3VwSW52aXRhdGlvbnM6IEFycmF5PFNlbnRHcm91cEludml0YXRpb24+XG5cdGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyXG5cdGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50XG5cdGxvZ2luczogTG9naW5Db250cm9sbGVyXG5cdC8vIG5vdGlmaWVyIGZvciBvdXRzaWRlIHRvIGRvIGEgcmVkcmF3XG5cdG9uRW50aXR5VXBkYXRlOiBTdHJlYW08dm9pZD5cblx0X21haWxGYWNhZGU6IE1haWxGYWNhZGVcblx0X3NoYXJlRmFjYWRlOiBTaGFyZUZhY2FkZVxuXHRfZ3JvdXBNYW5hZ2VtZW50RmFjYWRlOiBHcm91cE1hbmFnZW1lbnRGYWNhZGVcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRncm91cEluZm86IEdyb3VwSW5mbyxcblx0XHRncm91cDogR3JvdXAsXG5cdFx0bWVtYmVySW5mb3M6IEFycmF5PEdyb3VwTWVtYmVySW5mbz4sXG5cdFx0c2VudEdyb3VwSW52aXRhdGlvbnM6IEFycmF5PFNlbnRHcm91cEludml0YXRpb24+LFxuXHRcdGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdGxvZ2luczogTG9naW5Db250cm9sbGVyLFxuXHRcdG1haWxGYWNhZGU6IE1haWxGYWNhZGUsXG5cdFx0c2hhcmVGYWNhZGU6IFNoYXJlRmFjYWRlLFxuXHRcdGdyb3VwTWFuYWdlbWVudEZhY2FkZTogR3JvdXBNYW5hZ2VtZW50RmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcmVjaXBpZW50c01vZGVsOiBSZWNpcGllbnRzTW9kZWwsXG5cdCkge1xuXHRcdHRoaXMuaW5mbyA9IGdyb3VwSW5mb1xuXHRcdHRoaXMuZ3JvdXAgPSBncm91cFxuXHRcdHRoaXMubWVtYmVySW5mb3MgPSBtZW1iZXJJbmZvc1xuXHRcdHRoaXMuc2VudEdyb3VwSW52aXRhdGlvbnMgPSBzZW50R3JvdXBJbnZpdGF0aW9uc1xuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyID0gZXZlbnRDb250cm9sbGVyXG5cdFx0dGhpcy5lbnRpdHlDbGllbnQgPSBlbnRpdHlDbGllbnRcblx0XHR0aGlzLmxvZ2lucyA9IGxvZ2luc1xuXHRcdHRoaXMuX21haWxGYWNhZGUgPSBtYWlsRmFjYWRlXG5cdFx0dGhpcy5fc2hhcmVGYWNhZGUgPSBzaGFyZUZhY2FkZVxuXHRcdHRoaXMuX2dyb3VwTWFuYWdlbWVudEZhY2FkZSA9IGdyb3VwTWFuYWdlbWVudEZhY2FkZVxuXHRcdHRoaXMub25FbnRpdHlVcGRhdGUgPSBzdHJlYW0oKVxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKHRoaXMub25FbnRpdHlFdmVudHMpXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IG9uRW50aXR5RXZlbnRzOiBFbnRpdHlFdmVudHNMaXN0ZW5lciA9IChldmVudHMsIGlkKSA9PiB0aGlzLmVudGl0eUV2ZW50c1JlY2VpdmVkKGV2ZW50cywgaWQpXG5cblx0c3RhdGljIG5ld0FzeW5jKFxuXHRcdGluZm86IEdyb3VwSW5mbyxcblx0XHRldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlcixcblx0XHRlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRsb2dpbnM6IExvZ2luQ29udHJvbGxlcixcblx0XHRtYWlsRmFjYWRlOiBNYWlsRmFjYWRlLFxuXHRcdHNoYXJlRmFjYWRlOiBTaGFyZUZhY2FkZSxcblx0XHRncm91cE1hbmFnZW1lbnRGYWNhZGU6IEdyb3VwTWFuYWdlbWVudEZhY2FkZSxcblx0XHRyZWNpcGllbnRzTW9kZWw6IFJlY2lwaWVudHNNb2RlbCxcblx0KTogUHJvbWlzZTxHcm91cFNoYXJpbmdNb2RlbD4ge1xuXHRcdHJldHVybiBlbnRpdHlDbGllbnRcblx0XHRcdC5sb2FkKEdyb3VwVHlwZVJlZiwgaW5mby5ncm91cClcblx0XHRcdC50aGVuKChncm91cCkgPT5cblx0XHRcdFx0UHJvbWlzZS5hbGwoW2VudGl0eUNsaWVudC5sb2FkQWxsKFNlbnRHcm91cEludml0YXRpb25UeXBlUmVmLCBncm91cC5pbnZpdGF0aW9ucyksIGxvYWRHcm91cE1lbWJlcnMoZ3JvdXAsIGVudGl0eUNsaWVudCldKS50aGVuKFxuXHRcdFx0XHRcdChbc2VudEdyb3VwSW52aXRhdGlvbnMsIG1lbWJlckluZm9zXSkgPT5cblx0XHRcdFx0XHRcdG5ldyBHcm91cFNoYXJpbmdNb2RlbChcblx0XHRcdFx0XHRcdFx0aW5mbyxcblx0XHRcdFx0XHRcdFx0Z3JvdXAsXG5cdFx0XHRcdFx0XHRcdG1lbWJlckluZm9zLFxuXHRcdFx0XHRcdFx0XHRzZW50R3JvdXBJbnZpdGF0aW9ucyxcblx0XHRcdFx0XHRcdFx0ZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRlbnRpdHlDbGllbnQsXG5cdFx0XHRcdFx0XHRcdGxvZ2lucyxcblx0XHRcdFx0XHRcdFx0bWFpbEZhY2FkZSxcblx0XHRcdFx0XHRcdFx0c2hhcmVGYWNhZGUsXG5cdFx0XHRcdFx0XHRcdGdyb3VwTWFuYWdlbWVudEZhY2FkZSxcblx0XHRcdFx0XHRcdFx0cmVjaXBpZW50c01vZGVsLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0KSxcblx0XHRcdClcblx0fVxuXG5cdGRpc3Bvc2UoKSB7XG5cdFx0dGhpcy5ldmVudENvbnRyb2xsZXIucmVtb3ZlRW50aXR5TGlzdGVuZXIodGhpcy5vbkVudGl0eUV2ZW50cylcblx0fVxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIG9yIG5vdCBhIGdpdmVuIG1lbWJlciBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZSBncm91cCBieSB0aGUgY3VycmVudCB1c2VyXG5cdCAqL1xuXHRjYW5SZW1vdmVHcm91cE1lbWJlcihtZW1iZXI6IEdyb3VwTWVtYmVyKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIChcblx0XHRcdChoYXNDYXBhYmlsaXR5T25Hcm91cCh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIsIHRoaXMuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5JbnZpdGUpIHx8IHRoaXMubWVtYmVySXNTZWxmKG1lbWJlcikpICYmXG5cdFx0XHQhaXNTaGFyZWRHcm91cE93bmVyKHRoaXMuZ3JvdXAsIG1lbWJlci51c2VyKVxuXHRcdClcblx0fVxuXG5cdHJlbW92ZUdyb3VwTWVtYmVyKG1lbWJlcjogR3JvdXBNZW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5jYW5SZW1vdmVHcm91cE1lbWJlcihtZW1iZXIpXG5cdFx0XHQ/IHRoaXMuX2dyb3VwTWFuYWdlbWVudEZhY2FkZS5yZW1vdmVVc2VyRnJvbUdyb3VwKG1lbWJlci51c2VyLCBnZXRFdElkKHRoaXMuZ3JvdXApKVxuXHRcdFx0OiBQcm9taXNlLnJlamVjdChuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIlVzZXIgZG9lcyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIHJlbW92ZSB0aGlzIG1lbWJlciBmcm9tIHRoZSBncm91cFwiKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIG9yIG5vdCBhIGdpdmVuIGludml0YXRpb24gY2FuIGJlIGNhbmNlbGxlZCBieSB0aGUgY3VycmVudCB1c2VyXG5cdCAqIEBwYXJhbSBncm91cFxuXHQgKiBAcGFyYW0gc2VudEdyb3VwSW52aXRhdGlvblxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdGNhbkNhbmNlbEludml0YXRpb24oc2VudEdyb3VwSW52aXRhdGlvbjogU2VudEdyb3VwSW52aXRhdGlvbik6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAoXG5cdFx0XHRoYXNDYXBhYmlsaXR5T25Hcm91cCh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIsIHRoaXMuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5JbnZpdGUpIHx8XG5cdFx0XHRpc1NoYXJlZEdyb3VwT3duZXIodGhpcy5ncm91cCwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLl9pZClcblx0XHQpXG5cdH1cblxuXHRtZW1iZXJJc1NlbGYobWVtYmVyOiBHcm91cE1lbWJlcik6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBpc1NhbWVJZCh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIuX2lkLCBtZW1iZXIudXNlcilcblx0fVxuXG5cdGNhbmNlbEludml0YXRpb24oaW52aXRhdGlvbjogU2VudEdyb3VwSW52aXRhdGlvbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmNhbkNhbmNlbEludml0YXRpb24oaW52aXRhdGlvbikgJiYgaW52aXRhdGlvbi5yZWNlaXZlZEludml0YXRpb25cblx0XHRcdD8gdGhpcy5fc2hhcmVGYWNhZGUucmVqZWN0T3JDYW5jZWxHcm91cEludml0YXRpb24oaW52aXRhdGlvbi5yZWNlaXZlZEludml0YXRpb24pXG5cdFx0XHQ6IFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIlVzZXIgZG9lcyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIGNhbmNlbCB0aGlzIGludml0YXRpb25cIikpIC8vIFRPRE8gZXJyb3IgdHlwZVxuXHR9XG5cblx0YXN5bmMgc2VuZEdyb3VwSW52aXRhdGlvbihzaGFyZWRHcm91cEluZm86IEdyb3VwSW5mbywgcmVjaXBpZW50czogQXJyYXk8UmVjaXBpZW50PiwgY2FwYWJpbGl0eTogU2hhcmVDYXBhYmlsaXR5KTogUHJvbWlzZTxBcnJheTxNYWlsQWRkcmVzcz4+IHtcblx0XHRjb25zdCBleHRlcm5hbFJlY2lwaWVudHM6IHN0cmluZ1tdID0gW11cblx0XHRmb3IgKGxldCByZWNpcGllbnQgb2YgcmVjaXBpZW50cykge1xuXHRcdFx0Y29uc3QgcmVzb2x2ZWQgPSBhd2FpdCB0aGlzLnJlY2lwaWVudHNNb2RlbC5yZXNvbHZlKHJlY2lwaWVudCwgUmVzb2x2ZU1vZGUuRWFnZXIpLnJlc29sdmVkKClcblx0XHRcdGlmIChyZXNvbHZlZC50eXBlICE9PSBSZWNpcGllbnRUeXBlLklOVEVSTkFMKSB7XG5cdFx0XHRcdGV4dGVybmFsUmVjaXBpZW50cy5wdXNoKHJlc29sdmVkLmFkZHJlc3MpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChleHRlcm5hbFJlY2lwaWVudHMubGVuZ3RoKSB7XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFxuXHRcdFx0XHRsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XHRcImZlYXR1cmVUdXRhbm90YU9ubHlfbXNnXCIsXG5cdFx0XHRcdFx0bGFuZy5nZXQoXCJmZWF0dXJlVHV0YW5vdGFPbmx5X21zZ1wiKSArIFwiIFwiICsgbGFuZy5nZXQoXCJpbnZhbGlkUmVjaXBpZW50c19tc2dcIikgKyBcIlxcblwiICsgZXh0ZXJuYWxSZWNpcGllbnRzLmpvaW4oXCJcXG5cIiksXG5cdFx0XHRcdCksXG5cdFx0XHQpXG5cdFx0fVxuXG5cdFx0bGV0IGdyb3VwSW52aXRhdGlvblJldHVyblxuXHRcdHRyeSB7XG5cdFx0XHRncm91cEludml0YXRpb25SZXR1cm4gPSBhd2FpdCB0aGlzLl9zaGFyZUZhY2FkZS5zZW5kR3JvdXBJbnZpdGF0aW9uKFxuXHRcdFx0XHRzaGFyZWRHcm91cEluZm8sXG5cdFx0XHRcdHJlY2lwaWVudHMubWFwKChyKSA9PiByLmFkZHJlc3MpLFxuXHRcdFx0XHRjYXBhYmlsaXR5LFxuXHRcdFx0KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgUmVjaXBpZW50c05vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcblx0XHRcdFx0XHRsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XHRcdFwidHV0YW5vdGFBZGRyZXNzRG9lc05vdEV4aXN0X21zZ1wiLFxuXHRcdFx0XHRcdFx0YCR7bGFuZy5nZXQoXCJ0dXRhbm90YUFkZHJlc3NEb2VzTm90RXhpc3RfbXNnXCIpfSAke2xhbmcuZ2V0KFwiaW52YWxpZFJlY2lwaWVudHNfbXNnXCIpfVxcbiR7ZS5tZXNzYWdlfWAsXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChncm91cEludml0YXRpb25SZXR1cm4uZXhpc3RpbmdNYWlsQWRkcmVzc2VzLmxlbmd0aCA+IDAgfHwgZ3JvdXBJbnZpdGF0aW9uUmV0dXJuLmludmFsaWRNYWlsQWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IGV4aXN0aW5nTWFpbEFkZHJlc3NlcyA9IGdyb3VwSW52aXRhdGlvblJldHVybi5leGlzdGluZ01haWxBZGRyZXNzZXMubWFwKChtYSkgPT4gbWEuYWRkcmVzcykuam9pbihcIlxcblwiKVxuXHRcdFx0Y29uc3QgaW52YWxpZE1haWxBZGRyZXNzZXMgPSBncm91cEludml0YXRpb25SZXR1cm4uaW52YWxpZE1haWxBZGRyZXNzZXMubWFwKChtYSkgPT4gbWEuYWRkcmVzcykuam9pbihcIlxcblwiKVxuXHRcdFx0bGV0IG1zZyA9IFwiXCJcblx0XHRcdG1zZyArPSBleGlzdGluZ01haWxBZGRyZXNzZXMubGVuZ3RoID09PSAwID8gXCJcIiA6IGxhbmcuZ2V0KFwiZXhpc3RpbmdNYWlsQWRkcmVzc19tc2dcIikgKyBcIlxcblwiICsgZXhpc3RpbmdNYWlsQWRkcmVzc2VzXG5cdFx0XHRtc2cgKz0gZXhpc3RpbmdNYWlsQWRkcmVzc2VzLmxlbmd0aCA9PT0gMCAmJiBpbnZhbGlkTWFpbEFkZHJlc3Nlcy5sZW5ndGggPT09IDAgPyBcIlwiIDogXCJcXG5cXG5cIlxuXHRcdFx0bXNnICs9IGludmFsaWRNYWlsQWRkcmVzc2VzLmxlbmd0aCA9PT0gMCA/IFwiXCIgOiBsYW5nLmdldChcImludmFsaWRNYWlsQWRkcmVzc19tc2dcIikgKyBcIlxcblwiICsgaW52YWxpZE1haWxBZGRyZXNzZXNcblx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IobGFuZy5tYWtlVHJhbnNsYXRpb24oXCJncm91cF9pbnZpdGF0aW9uX2VyclwiLCBtc2cpKVxuXHRcdH1cblxuXHRcdHJldHVybiBncm91cEludml0YXRpb25SZXR1cm4uaW52aXRlZE1haWxBZGRyZXNzZXNcblx0fVxuXG5cdGVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4sIGV2ZW50T3duZXJHcm91cElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBwcm9taXNlTWFwKHVwZGF0ZXMsICh1cGRhdGUpID0+IHtcblx0XHRcdGlmICghaXNTYW1lSWQoZXZlbnRPd25lckdyb3VwSWQsIGdldEV0SWQodGhpcy5ncm91cCkpKSB7XG5cdFx0XHRcdC8vIGlnbm9yZSBldmVudHMgb2YgZGlmZmVyZW50IGdyb3VwIGhlcmVcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoU2VudEdyb3VwSW52aXRhdGlvblR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0aWYgKHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFICYmIGlzU2FtZUlkKHVwZGF0ZS5pbnN0YW5jZUxpc3RJZCwgdGhpcy5ncm91cC5pbnZpdGF0aW9ucykpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnRcblx0XHRcdFx0XHRcdC5sb2FkKFNlbnRHcm91cEludml0YXRpb25UeXBlUmVmLCBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF0pXG5cdFx0XHRcdFx0XHQudGhlbigoaW5zdGFuY2UpID0+IHtcblx0XHRcdFx0XHRcdFx0aWYgKGluc3RhbmNlKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZW50R3JvdXBJbnZpdGF0aW9ucy5wdXNoKGluc3RhbmNlKVxuXHRcdFx0XHRcdFx0XHRcdHRoaXMub25FbnRpdHlVcGRhdGUoKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwic2VudCBpbnZpdGF0aW9uIG5vdCBmb3VuZFwiLCB1cGRhdGUpKSlcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkRFTEVURSkge1xuXHRcdFx0XHRcdGZpbmRBbmRSZW1vdmUodGhpcy5zZW50R3JvdXBJbnZpdGF0aW9ucywgKHNlbnRHcm91cEludml0YXRpb24pID0+IGlzU2FtZUlkKGdldEVsZW1lbnRJZChzZW50R3JvdXBJbnZpdGF0aW9uKSwgdXBkYXRlLmluc3RhbmNlSWQpKVxuXHRcdFx0XHRcdHRoaXMub25FbnRpdHlVcGRhdGUoKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlzVXBkYXRlRm9yVHlwZVJlZihHcm91cE1lbWJlclR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJ1cGRhdGUgcmVjZWl2ZWQgaW4gc2hhcmUgZGlhbG9nXCIsIHVwZGF0ZSlcblxuXHRcdFx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUgJiYgaXNTYW1lSWQodXBkYXRlLmluc3RhbmNlTGlzdElkLCB0aGlzLmdyb3VwLm1lbWJlcnMpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZW50aXR5Q2xpZW50XG5cdFx0XHRcdFx0XHQubG9hZChHcm91cE1lbWJlclR5cGVSZWYsIFt1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHVwZGF0ZS5pbnN0YW5jZUlkXSlcblx0XHRcdFx0XHRcdC50aGVuKChpbnN0YW5jZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAoaW5zdGFuY2UpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbG9hZEdyb3VwSW5mb0Zvck1lbWJlcihpbnN0YW5jZSwgdGhpcy5lbnRpdHlDbGllbnQpLnRoZW4oKGdyb3VwTWVtYmVySW5mbykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJuZXcgbWVtYmVyXCIsIGdyb3VwTWVtYmVySW5mbylcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWVtYmVySW5mb3MucHVzaChncm91cE1lbWJlckluZm8pXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm9uRW50aXR5VXBkYXRlKClcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwiZ3JvdXAgbWVtYmVyIG5vdCBmb3VuZFwiLCB1cGRhdGUpKSlcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkRFTEVURSkge1xuXHRcdFx0XHRcdGZpbmRBbmRSZW1vdmUodGhpcy5tZW1iZXJJbmZvcywgKG1lbWJlckluZm8pID0+IGlzU2FtZUlkKGdldEVsZW1lbnRJZChtZW1iZXJJbmZvLm1lbWJlciksIHVwZGF0ZS5pbnN0YW5jZUlkKSlcblx0XHRcdFx0XHR0aGlzLm9uRW50aXR5VXBkYXRlKClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pLnRoZW4obm9PcClcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBEaWFsb2csIERpYWxvZ1R5cGUgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB0eXBlIHsgVGFibGVMaW5lQXR0cnMgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvVGFibGUuanNcIlxuaW1wb3J0IHsgQ29sdW1uV2lkdGgsIFRhYmxlIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL1RhYmxlLmpzXCJcbmltcG9ydCB7IGFzc2VydCwgYXNzZXJ0Tm90TnVsbCwgZG93bmNhc3QsIGZpbmRBbmRSZW1vdmUsIG5ldmVyTnVsbCwgcmVtb3ZlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IEdyb3VwVHlwZSwgU2hhcmVDYXBhYmlsaXR5IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgRHJvcERvd25TZWxlY3RvciB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9Ecm9wRG93blNlbGVjdG9yLmpzXCJcbmltcG9ydCB7IFByZWNvbmRpdGlvbkZhaWxlZEVycm9yLCBUb29NYW55UmVxdWVzdHNFcnJvciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQgeyBUZXh0RmllbGQgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB0eXBlIHsgR3JvdXBJbmZvIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgZ2V0Q2FwYWJpbGl0eVRleHQsIGdldE1lbWJlckNhcGFiaWxpdHksIGdldFNoYXJlZEdyb3VwTmFtZSwgaGFzQ2FwYWJpbGl0eU9uR3JvdXAsIGlzU2hhcmVhYmxlR3JvdXBUeXBlLCBpc1NoYXJlZEdyb3VwT3duZXIgfSBmcm9tIFwiLi4vR3JvdXBVdGlsc1wiXG5pbXBvcnQgeyBzZW5kU2hhcmVOb3RpZmljYXRpb25FbWFpbCB9IGZyb20gXCIuLi9Hcm91cFNoYXJpbmdVdGlsc1wiXG5pbXBvcnQgeyBHcm91cFNoYXJpbmdNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9Hcm91cFNoYXJpbmdNb2RlbFwiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgVXNlckVycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL1VzZXJFcnJvclwiXG5pbXBvcnQgeyBzaG93VXNlckVycm9yIH0gZnJvbSBcIi4uLy4uL21pc2MvRXJyb3JIYW5kbGVySW1wbFwiXG5pbXBvcnQgeyBnZXRDb25maXJtYXRpb24gfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvR3VpVXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBHcm91cFNoYXJpbmdUZXh0cyB9IGZyb20gXCIuLi9Hcm91cEd1aVV0aWxzXCJcbmltcG9ydCB7IGdldFRleHRzRm9yR3JvdXBUeXBlIH0gZnJvbSBcIi4uL0dyb3VwR3VpVXRpbHNcIlxuaW1wb3J0IHsgUmVzb2x2YWJsZVJlY2lwaWVudCwgUmVzb2x2ZU1vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vUmVjaXBpZW50c01vZGVsXCJcbmltcG9ydCB7IE1haWxSZWNpcGllbnRzVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uL2d1aS9NYWlsUmVjaXBpZW50c1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBjbGVhbk1haWxBZGRyZXNzLCBmaW5kUmVjaXBpZW50V2l0aEFkZHJlc3MgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IHNob3dQbGFuVXBncmFkZVJlcXVpcmVkRGlhbG9nIH0gZnJvbSBcIi4uLy4uL21pc2MvU3Vic2NyaXB0aW9uRGlhbG9ncy5qc1wiXG5pbXBvcnQgeyBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0IH0gZnJvbSBcIi4uLy4uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzaG93R3JvdXBTaGFyaW5nRGlhbG9nKGdyb3VwSW5mbzogR3JvdXBJbmZvLCBhbGxvd0dyb3VwTmFtZU92ZXJyaWRlOiBib29sZWFuKSB7XG5cdGNvbnN0IGdyb3VwVHlwZSA9IGRvd25jYXN0KGFzc2VydE5vdE51bGwoZ3JvdXBJbmZvLmdyb3VwVHlwZSkpXG5cdGFzc2VydChpc1NoYXJlYWJsZUdyb3VwVHlwZShncm91cEluZm8uZ3JvdXBUeXBlIGFzIEdyb3VwVHlwZSksIGBHcm91cCB0eXBlIFwiJHtncm91cFR5cGV9XCIgbXVzdCBiZSBzaGFyZWFibGVgKVxuXHRjb25zdCB0ZXh0cyA9IGdldFRleHRzRm9yR3JvdXBUeXBlKGdyb3VwVHlwZSlcblx0Y29uc3QgcmVjaXBpZW50c01vZGVsID0gYXdhaXQgbG9jYXRvci5yZWNpcGllbnRzTW9kZWwoKVxuXHRzaG93UHJvZ3Jlc3NEaWFsb2coXG5cdFx0XCJsb2FkaW5nX21zZ1wiLFxuXHRcdEdyb3VwU2hhcmluZ01vZGVsLm5ld0FzeW5jKFxuXHRcdFx0Z3JvdXBJbmZvLFxuXHRcdFx0bG9jYXRvci5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudCxcblx0XHRcdGxvY2F0b3IubG9naW5zLFxuXHRcdFx0bG9jYXRvci5tYWlsRmFjYWRlLFxuXHRcdFx0bG9jYXRvci5zaGFyZUZhY2FkZSxcblx0XHRcdGxvY2F0b3IuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlLFxuXHRcdFx0cmVjaXBpZW50c01vZGVsLFxuXHRcdCksXG5cdCkudGhlbigobW9kZWwpID0+IHtcblx0XHRtb2RlbC5vbkVudGl0eVVwZGF0ZS5tYXAobS5yZWRyYXcuYmluZChtKSlcblx0XHRsZXQgZGlhbG9nID0gRGlhbG9nLnNob3dBY3Rpb25EaWFsb2coe1xuXHRcdFx0dGl0bGU6IFwic2hhcmluZ19sYWJlbFwiLFxuXHRcdFx0dHlwZTogRGlhbG9nVHlwZS5FZGl0TWVkaXVtLFxuXHRcdFx0Y2hpbGQ6ICgpID0+XG5cdFx0XHRcdG0oR3JvdXBTaGFyaW5nRGlhbG9nQ29udGVudCwge1xuXHRcdFx0XHRcdG1vZGVsLFxuXHRcdFx0XHRcdGFsbG93R3JvdXBOYW1lT3ZlcnJpZGUsXG5cdFx0XHRcdFx0dGV4dHMsXG5cdFx0XHRcdFx0ZGlhbG9nLFxuXHRcdFx0XHR9KSxcblx0XHRcdG9rQWN0aW9uOiBudWxsLFxuXHRcdFx0Y2FuY2VsQWN0aW9uOiAoKSA9PiBtb2RlbC5kaXNwb3NlKCksXG5cdFx0XHRjYW5jZWxBY3Rpb25UZXh0SWQ6IFwiY2xvc2VfYWx0XCIsXG5cdFx0fSlcblx0fSlcbn1cblxudHlwZSBHcm91cFNoYXJpbmdEaWFsb2dBdHRycyA9IHtcblx0bW9kZWw6IEdyb3VwU2hhcmluZ01vZGVsXG5cdGFsbG93R3JvdXBOYW1lT3ZlcnJpZGU6IGJvb2xlYW5cblx0dGV4dHM6IEdyb3VwU2hhcmluZ1RleHRzXG5cdGRpYWxvZzogRGlhbG9nXG59XG5cbmNsYXNzIEdyb3VwU2hhcmluZ0RpYWxvZ0NvbnRlbnQgaW1wbGVtZW50cyBDb21wb25lbnQ8R3JvdXBTaGFyaW5nRGlhbG9nQXR0cnM+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8R3JvdXBTaGFyaW5nRGlhbG9nQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgbW9kZWwsIGFsbG93R3JvdXBOYW1lT3ZlcnJpZGUsIHRleHRzLCBkaWFsb2cgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgZ3JvdXBOYW1lID0gZ2V0U2hhcmVkR3JvdXBOYW1lKG1vZGVsLmluZm8sIG1vZGVsLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCBhbGxvd0dyb3VwTmFtZU92ZXJyaWRlKVxuXHRcdHJldHVybiBtKFwiLmZsZXguY29sLnB0LXNcIiwgW1xuXHRcdFx0bShUYWJsZSwge1xuXHRcdFx0XHRjb2x1bW5IZWFkaW5nOiBbbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJjb2x1bW5faGVhZGluZ1wiLCB0ZXh0cy5wYXJ0aWNpcGFudHNMYWJlbChncm91cE5hbWUpKV0sXG5cdFx0XHRcdGNvbHVtbldpZHRoczogW0NvbHVtbldpZHRoLkxhcmdlc3QsIENvbHVtbldpZHRoLkxhcmdlc3RdLFxuXHRcdFx0XHRsaW5lczogdGhpcy5fcmVuZGVyTWVtYmVySW5mb3MobW9kZWwsIHRleHRzLCBncm91cE5hbWUsIGRpYWxvZykuY29uY2F0KHRoaXMuX3JlbmRlckdyb3VwSW52aXRhdGlvbnMobW9kZWwsIHRleHRzLCBncm91cE5hbWUpKSxcblx0XHRcdFx0c2hvd0FjdGlvbkJ1dHRvbkNvbHVtbjogdHJ1ZSxcblx0XHRcdFx0YWRkQnV0dG9uQXR0cnM6IGhhc0NhcGFiaWxpdHlPbkdyb3VwKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlciwgbW9kZWwuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5JbnZpdGUpXG5cdFx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcImFkZFBhcnRpY2lwYW50X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gc2hvd0FkZFBhcnRpY2lwYW50RGlhbG9nKG1vZGVsLCB0ZXh0cyksXG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHR9KSxcblx0XHRdKVxuXHR9XG5cblx0X3JlbmRlckdyb3VwSW52aXRhdGlvbnMobW9kZWw6IEdyb3VwU2hhcmluZ01vZGVsLCB0ZXh0czogR3JvdXBTaGFyaW5nVGV4dHMsIGdyb3VwTmFtZTogc3RyaW5nKTogQXJyYXk8VGFibGVMaW5lQXR0cnM+IHtcblx0XHRyZXR1cm4gbW9kZWwuc2VudEdyb3VwSW52aXRhdGlvbnMubWFwKChzZW50R3JvdXBJbnZpdGF0aW9uKSA9PiB7XG5cdFx0XHRsZXQgaWNvbkJ0bjogSWNvbkJ1dHRvbkF0dHJzID0ge1xuXHRcdFx0XHR0aXRsZTogXCJyZW1vdmVfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0Z2V0Q29uZmlybWF0aW9uKFxuXHRcdFx0XHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXCJjb25maXJtYXRpb25fbXNnXCIsIHRleHRzLnJlbW92ZU1lbWJlck1lc3NhZ2UoZ3JvdXBOYW1lLCBzZW50R3JvdXBJbnZpdGF0aW9uLmludml0ZWVNYWlsQWRkcmVzcykpLFxuXHRcdFx0XHRcdCkuY29uZmlybWVkKGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdGF3YWl0IG1vZGVsLmNhbmNlbEludml0YXRpb24oc2VudEdyb3VwSW52aXRhdGlvbilcblx0XHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRpY29uOiBJY29ucy5DYW5jZWwsXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRjZWxsczogKCkgPT4gW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG1haW46IHNlbnRHcm91cEludml0YXRpb24uaW52aXRlZU1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdFx0aW5mbzogW2Ake2xhbmcuZ2V0KFwiaW52aXRlZF9sYWJlbFwiKX0sICR7Z2V0Q2FwYWJpbGl0eVRleHQoZG93bmNhc3Qoc2VudEdyb3VwSW52aXRhdGlvbi5jYXBhYmlsaXR5KSl9YF0sXG5cdFx0XHRcdFx0XHRtYWluU3R5bGU6IFwiLmlcIixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRhY3Rpb25CdXR0b25BdHRyczogbW9kZWwuY2FuQ2FuY2VsSW52aXRhdGlvbihzZW50R3JvdXBJbnZpdGF0aW9uKSA/IGljb25CdG4gOiBudWxsLFxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRfcmVuZGVyTWVtYmVySW5mb3MobW9kZWw6IEdyb3VwU2hhcmluZ01vZGVsLCB0ZXh0czogR3JvdXBTaGFyaW5nVGV4dHMsIGdyb3VwTmFtZTogc3RyaW5nLCBkaWFsb2c6IERpYWxvZyk6IEFycmF5PFRhYmxlTGluZUF0dHJzPiB7XG5cdFx0cmV0dXJuIG1vZGVsLm1lbWJlckluZm9zLm1hcCgobWVtYmVySW5mbykgPT4ge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y2VsbHM6ICgpID0+IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRtYWluOiBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KG1lbWJlckluZm8uaW5mby5uYW1lLCBuZXZlck51bGwobWVtYmVySW5mby5pbmZvLm1haWxBZGRyZXNzKSwgZmFsc2UpLFxuXHRcdFx0XHRcdFx0aW5mbzogW1xuXHRcdFx0XHRcdFx0XHQoaXNTaGFyZWRHcm91cE93bmVyKG1vZGVsLmdyb3VwLCBtZW1iZXJJbmZvLm1lbWJlci51c2VyKSA/IGxhbmcuZ2V0KFwib3duZXJfbGFiZWxcIikgOiBsYW5nLmdldChcInBhcnRpY2lwYW50X2xhYmVsXCIpKSArXG5cdFx0XHRcdFx0XHRcdFx0XCIsIFwiICtcblx0XHRcdFx0XHRcdFx0XHRnZXRDYXBhYmlsaXR5VGV4dChnZXRNZW1iZXJDYXBhYmlsaXR5KG1lbWJlckluZm8sIG1vZGVsLmdyb3VwKSksXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdF0sXG5cdFx0XHRcdGFjdGlvbkJ1dHRvbkF0dHJzOiBtb2RlbC5jYW5SZW1vdmVHcm91cE1lbWJlcihtZW1iZXJJbmZvLm1lbWJlcilcblx0XHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5DYW5jZWwsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Z2V0Q29uZmlybWF0aW9uKFxuXHRcdFx0XHRcdFx0XHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXCJjb25maXJtYXRpb25fbXNnXCIsIHRleHRzLnJlbW92ZU1lbWJlck1lc3NhZ2UoZ3JvdXBOYW1lLCBkb3duY2FzdChtZW1iZXJJbmZvLmluZm8ubWFpbEFkZHJlc3MpKSksXG5cdFx0XHRcdFx0XHRcdFx0KS5jb25maXJtZWQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgbW9kZWwucmVtb3ZlR3JvdXBNZW1iZXIobWVtYmVySW5mby5tZW1iZXIpXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAobW9kZWwubWVtYmVySXNTZWxmKG1lbWJlckluZm8ubWVtYmVyKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ICB9XG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2hvd0FkZFBhcnRpY2lwYW50RGlhbG9nKG1vZGVsOiBHcm91cFNoYXJpbmdNb2RlbCwgdGV4dHM6IEdyb3VwU2hhcmluZ1RleHRzKSB7XG5cdGNvbnN0IHJlY2lwaWVudHNUZXh0ID0gc3RyZWFtKFwiXCIpXG5cdGNvbnN0IHJlY2lwaWVudHMgPSBbXSBhcyBBcnJheTxSZXNvbHZhYmxlUmVjaXBpZW50PlxuXHRjb25zdCBjYXBhYmlsaXR5ID0gc3RyZWFtPFNoYXJlQ2FwYWJpbGl0eT4oU2hhcmVDYXBhYmlsaXR5LlJlYWQpXG5cdGNvbnN0IHJlYWxHcm91cE5hbWUgPSBnZXRTaGFyZWRHcm91cE5hbWUobW9kZWwuaW5mbywgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSwgZmFsc2UpXG5cdGNvbnN0IGN1c3RvbUdyb3VwTmFtZSA9IGdldFNoYXJlZEdyb3VwTmFtZShtb2RlbC5pbmZvLCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCB0cnVlKVxuXG5cdGNvbnN0IHNlYXJjaCA9IGF3YWl0IGxvY2F0b3IucmVjaXBpZW50c1NlYXJjaE1vZGVsKClcblx0Y29uc3QgcmVjaXBpZW50c01vZGVsID0gYXdhaXQgbG9jYXRvci5yZWNpcGllbnRzTW9kZWwoKVxuXG5cdGxldCBkaWFsb2cgPSBEaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0dHlwZTogRGlhbG9nVHlwZS5FZGl0TWVkaXVtLFxuXHRcdHRpdGxlOiBcImFkZFBhcnRpY2lwYW50X2FjdGlvblwiLFxuXHRcdGNoaWxkOiAoKSA9PiBbXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5yZWxcIixcblx0XHRcdFx0bShNYWlsUmVjaXBpZW50c1RleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBcInNoYXJlV2l0aEVtYWlsUmVjaXBpZW50X2xhYmVsXCIsXG5cdFx0XHRcdFx0dGV4dDogcmVjaXBpZW50c1RleHQoKSxcblx0XHRcdFx0XHRyZWNpcGllbnRzOiByZWNpcGllbnRzLFxuXHRcdFx0XHRcdGRpc2FibGVkOiBmYWxzZSxcblx0XHRcdFx0XHRnZXRSZWNpcGllbnRDbGlja2VkRHJvcGRvd25BdHRyczogYXN5bmMgKGFkZHJlc3MpID0+IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aW5mbzogYWRkcmVzcyxcblx0XHRcdFx0XHRcdFx0Y2VudGVyOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0Ym9sZDogZmFsc2UsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJyZW1vdmVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGJ1YmJsZVRvUmVtb3ZlID0gZmluZFJlY2lwaWVudFdpdGhBZGRyZXNzKHJlY2lwaWVudHMsIGFkZHJlc3MpXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGJ1YmJsZVRvUmVtb3ZlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZW1vdmUocmVjaXBpZW50cywgYnViYmxlVG9SZW1vdmUpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdG9uUmVjaXBpZW50QWRkZWQ6IChhZGRyZXNzLCBuYW1lLCBjb250YWN0KSA9PlxuXHRcdFx0XHRcdFx0cmVjaXBpZW50cy5wdXNoKHJlY2lwaWVudHNNb2RlbC5yZXNvbHZlKHsgYWRkcmVzcywgbmFtZSwgY29udGFjdCB9LCBSZXNvbHZlTW9kZS5FYWdlcikud2hlblJlc29sdmVkKCgpID0+IG0ucmVkcmF3KCkpKSxcblx0XHRcdFx0XHRvblJlY2lwaWVudFJlbW92ZWQ6IChhZGRyZXNzKSA9PlxuXHRcdFx0XHRcdFx0ZmluZEFuZFJlbW92ZShyZWNpcGllbnRzLCAocmVjaXBpZW50KSA9PiBjbGVhbk1haWxBZGRyZXNzKHJlY2lwaWVudC5hZGRyZXNzKSA9PT0gY2xlYW5NYWlsQWRkcmVzcyhhZGRyZXNzKSksXG5cdFx0XHRcdFx0b25UZXh0Q2hhbmdlZDogcmVjaXBpZW50c1RleHQsXG5cdFx0XHRcdFx0c2VhcmNoLFxuXHRcdFx0XHRcdG1heFN1Z2dlc3Rpb25zVG9TaG93OiAzLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKERyb3BEb3duU2VsZWN0b3IsIHtcblx0XHRcdFx0bGFiZWw6IFwicGVybWlzc2lvbnNfbGFiZWxcIixcblx0XHRcdFx0aXRlbXM6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRuYW1lOiBnZXRDYXBhYmlsaXR5VGV4dChTaGFyZUNhcGFiaWxpdHkuSW52aXRlKSxcblx0XHRcdFx0XHRcdHZhbHVlOiBTaGFyZUNhcGFiaWxpdHkuSW52aXRlLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bmFtZTogZ2V0Q2FwYWJpbGl0eVRleHQoU2hhcmVDYXBhYmlsaXR5LldyaXRlKSxcblx0XHRcdFx0XHRcdHZhbHVlOiBTaGFyZUNhcGFiaWxpdHkuV3JpdGUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRuYW1lOiBnZXRDYXBhYmlsaXR5VGV4dChTaGFyZUNhcGFiaWxpdHkuUmVhZCksXG5cdFx0XHRcdFx0XHR2YWx1ZTogU2hhcmVDYXBhYmlsaXR5LlJlYWQsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0c2VsZWN0ZWRWYWx1ZTogY2FwYWJpbGl0eSgpLFxuXHRcdFx0XHRzZWxlY3Rpb25DaGFuZ2VkSGFuZGxlcjogY2FwYWJpbGl0eSxcblx0XHRcdFx0ZHJvcGRvd25XaWR0aDogMzAwLFxuXHRcdFx0fSksXG5cdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHR2YWx1ZTogcmVhbEdyb3VwTmFtZSxcblx0XHRcdFx0bGFiZWw6IHRleHRzLmdyb3VwTmFtZUxhYmVsLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gbShcIlwiLCBjdXN0b21Hcm91cE5hbWUgPT09IHJlYWxHcm91cE5hbWUgPyBudWxsIDogdGV4dHMueW91ckN1c3RvbU5hbWVMYWJlbChjdXN0b21Hcm91cE5hbWUpKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0XHRtKFwiLnB0XCIsIHRleHRzLmFkZE1lbWJlck1lc3NhZ2UoY3VzdG9tR3JvdXBOYW1lIHx8IHJlYWxHcm91cE5hbWUpKSxcblx0XHRdLFxuXHRcdG9rQWN0aW9uOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRpZiAocmVjaXBpZW50cy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwibm9SZWNpcGllbnRzX21zZ1wiKVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB7IGNoZWNrUGFpZFN1YnNjcmlwdGlvbiwgc2hvd1BsYW5VcGdyYWRlUmVxdWlyZWREaWFsb2cgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uL21pc2MvU3Vic2NyaXB0aW9uRGlhbG9nc1wiKVxuXHRcdFx0aWYgKGF3YWl0IGNoZWNrUGFpZFN1YnNjcmlwdGlvbigpKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgaW52aXRlZE1haWxBZGRyZXNzZXMgPSBhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXG5cdFx0XHRcdFx0XHRcImNhbGVuZGFySW52aXRhdGlvblByb2dyZXNzX21zZ1wiLFxuXHRcdFx0XHRcdFx0bW9kZWwuc2VuZEdyb3VwSW52aXRhdGlvbihtb2RlbC5pbmZvLCByZWNpcGllbnRzLCBjYXBhYmlsaXR5KCkpLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRcdGF3YWl0IHNlbmRTaGFyZU5vdGlmaWNhdGlvbkVtYWlsKG1vZGVsLmluZm8sIGludml0ZWRNYWlsQWRkcmVzc2VzLCB0ZXh0cylcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IpIHtcblx0XHRcdFx0XHRcdGlmIChsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzR2xvYmFsQWRtaW4oKSkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB7IGdldEF2YWlsYWJsZVBsYW5zV2l0aFNoYXJpbmcgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uL3N1YnNjcmlwdGlvbi9TdWJzY3JpcHRpb25VdGlscy5qc1wiKVxuXHRcdFx0XHRcdFx0XHRjb25zdCBwbGFucyA9IGF3YWl0IGdldEF2YWlsYWJsZVBsYW5zV2l0aFNoYXJpbmcoKVxuXHRcdFx0XHRcdFx0XHRhd2FpdCBzaG93UGxhblVwZ3JhZGVSZXF1aXJlZERpYWxvZyhwbGFucylcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwiY29udGFjdEFkbWluX21zZ1wiKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIFVzZXJFcnJvcikge1xuXHRcdFx0XHRcdFx0c2hvd1VzZXJFcnJvcihlKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIFRvb01hbnlSZXF1ZXN0c0Vycm9yKSB7XG5cdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcInRvb01hbnlBdHRlbXB0c19tc2dcIilcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b2tBY3Rpb25UZXh0SWQ6IFwiaW52aXRlX2FsdFwiLFxuXHR9KS5zZXRDbG9zZUhhbmRsZXIoKCkgPT4ge1xuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdH0pXG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXlCYSxvQkFBTixNQUFNLGtCQUFrQjtDQUM5QixBQUFTO0NBQ1QsQUFBUztDQUNULEFBQVM7Q0FDVCxBQUFTO0NBQ1Q7Q0FDQTtDQUNBO0NBRUE7Q0FDQTtDQUNBO0NBQ0E7Q0FFQSxZQUNDQSxXQUNBQyxPQUNBQyxh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
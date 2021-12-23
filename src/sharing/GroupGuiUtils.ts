// @flow


import type {TranslationKey, TranslationText} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {GroupTypeEnum} from "../api/common/TutanotaConstants"
import {GroupType} from "../api/common/TutanotaConstants"
import {ProgrammingError} from "../api/common/error/ProgrammingError"
import {getDefaultGroupName} from "./GroupUtils"
import type {ReceivedGroupInvitation} from "../api/entities/sys/ReceivedGroupInvitation"
import type {lazy} from "@tutao/tutanota-utils"

export type GroupSharingTexts = {
	+groupNameLabel: TranslationKey,
	+participantsLabel: (groupName: string) => string,
	+acceptEmailSubject: string,
	+acceptEmailBody: (userName: string, invitee: string, groupName: string) => string,
	+declineEmailSubject: string,
	+declineEmailBody: (userName: string, invitee: string, groupName: string) => string,
	+shareEmailSubject: string,
	+shareEmailBody: (sharer: string, groupName: string) => string,

	+addMemberMessage: (groupName: string) => string,
	+removeMemberMessage: (groupName: string, member: string) => string,
	+sharingNotOrderedUser: string,
	+sharingNotOrderedAdmin: string,

	+alreadyGroupMemberMessage: TranslationText,
	+receivedGroupInvitationMessage: string,
	+sharedGroupDefaultCustomName: (invitation: ReceivedGroupInvitation) => string,
	+yourCustomNameLabel: (groupName: string) => string,

}

const CALENDAR_SHARING_TEXTS: lazy<GroupSharingTexts> = () => ({
	groupNameLabel: "calendarName_label",
	participantsLabel: (groupName) => lang.get("participants_label", {"{name}": groupName}),
	acceptEmailSubject: lang.get("shareCalendarAcceptEmailSubject_msg"),
	acceptEmailBody: (userName, invitee, groupName) => lang.get("shareCalendarAcceptEmailBody_msg", {
		"{invitee}": invitee,
		"{calendarName}": groupName,
		"{recipientName}": userName
	}),
	declineEmailSubject: lang.get("shareCalendarDeclineEmailSubject_msg"),
	declineEmailBody: (userName, invitee, groupName) => lang.get("shareCalendarDeclineEmailBody_msg", {
		"{invitee}": invitee,
		"{calendarName}": groupName,
		"{recipientName}": userName
	}),
	shareEmailSubject: lang.get("shareCalendarInvitationEmailSubject_msg"),
	shareEmailBody: (calendarName, sender) => lang.get("shareCalendarInvitationEmailBody_msg", {
		// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
		"{inviter}": sender,
		"{calendarName}": calendarName
	}),
	addMemberMessage: (_) => `${lang.get("shareCalendarWarning_msg")} ${lang.get("shareCalendarWarningAliases_msg")}`,
	removeMemberMessage: (calendarName, invitee) => lang.get("removeCalendarParticipantConfirm_msg", {
		"{participant}": invitee,
		"{calendarName}": calendarName,
	}),
	sharingNotOrderedAdmin: lang.get("sharingFeatureNotOrderedAdmin_msg"),
	sharingNotOrderedUser: lang.get("sharingFeatureNotOrderedUser_msg"),
	alreadyGroupMemberMessage: "alreadyMember_msg",
	receivedGroupInvitationMessage: `${lang.get("shareCalendarWarning_msg")} ${lang.get("shareCalendarWarningAliases_msg")}`,
	sharedGroupDefaultCustomName: groupOwnerName => getDefaultGroupName(GroupType.Calendar),
	yourCustomNameLabel: groupName => lang.get("customName_label", {"{customName}": groupName})
})

const TEMPLATE_SHARING_TEXTS: lazy<GroupSharingTexts> = () => ({
	groupNameLabel: "templateGroupName_label",
	participantsLabel: (groupName) => lang.get("templateGroupParticipants_label", {"{groupName}": groupName}),
	acceptEmailSubject: lang.get("acceptTemplateGroupEmailSubject_msg"),
	acceptEmailBody: (userName, invitee, groupName) => lang.get("acceptTemplateGroupEmailBody_msg", {
		"{recipientName}": userName,
		"{invitee}": invitee,
		"{groupName}": groupName
	}),
	declineEmailSubject: lang.get("declineTemplateGroupEmailSubject_msg"),
	declineEmailBody: (userName, invitee, groupName) => lang.get("declineTemplateGroupEmailBody_msg", {
		"{recipientName}": userName,
		"{invitee}": invitee,
		"{groupName}": groupName
	}),
	shareEmailSubject: lang.get("shareTemplateGroupEmailSubject_msg"),
	shareEmailBody: (sharer: string, groupName: string) => lang.get("shareTemplateGroupEmailBody_msg", {
		"{inviter}": sharer,
		"{groupName}": groupName
	}),
	addMemberMessage: (groupName: string) => `${lang.get("shareTemplateGroupWarning_msg")} ${lang.get("shareCalendarWarningAliases_msg")}`,
	removeMemberMessage: (groupName: string, member: string) => lang.get("removeTemplateGroupMemberConfirm_msg", {
		"{member}": member,
		"{groupName}": groupName
	}),
	sharingNotOrderedUser: lang.get("templateSharingNotOrdered_msg"),
	sharingNotOrderedAdmin: lang.get("templateSharingNotOrdered_msg"),
	alreadyGroupMemberMessage: "alreadyTemplateGroupMember_msg",
	receivedGroupInvitationMessage: `${lang.get("shareTemplateGroupWarning_msg")} ${lang.get("shareCalendarWarningAliases_msg")}`,
	sharedGroupDefaultCustomName: invitation => lang.get("sharedTemplateGroupDefaultName_label", {
		"{ownerName}": invitation.inviterName || invitation.inviterMailAddress
	}),
	yourCustomNameLabel: groupName => lang.get("customTemplateListName_label", {"{customName}": groupName})
})

export function getTextsForGroupType(groupType: GroupTypeEnum): GroupSharingTexts {
	switch (groupType) {
		case GroupType.Calendar:
			return CALENDAR_SHARING_TEXTS()
		case GroupType.Template:
			return TEMPLATE_SHARING_TEXTS()
		default:
			throw new ProgrammingError(`Group type ${groupType} is not shareable`)
	}
}



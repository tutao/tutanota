// @flow

import m from "mithril"
import {size} from "../../gui/size"
import {getCapabilityText} from "../GroupUtils"
import {downcast} from "@tutao/tutanota-utils"
import {getDisplayText} from "../../mail/model/MailUtils"
import {ButtonN} from "../../gui/base/ButtonN"
import {showGroupInvitationDialog} from "./ReceivedGroupInvitationDialog"
import {Icons} from "../../gui/base/icons/Icons"
import type {ReceivedGroupInvitation} from "../../api/entities/sys/ReceivedGroupInvitation"
import type {AllIconsEnum} from "../../gui/base/Icon"

export type GroupInvitationFolderRowAttrs = {
	invitation: ReceivedGroupInvitation,
	icon?: AllIconsEnum
}

export class GroupInvitationFolderRow implements MComponent<GroupInvitationFolderRowAttrs> {

	view(vnode: Vnode<GroupInvitationFolderRowAttrs>): Children {
		const {invitation, icon} = vnode.attrs

		return [
			m(".folder-row.flex-start.plr-l", [
				m(".flex-v-center.flex-grow.button-height", {
					style: {
						// It's kinda hard to tell this element to not eat up all the row and truncate text instead because it
						// is vertical flex. With this it will stop at 80% of what it could be and that's enough for the button.
						"max-width": `calc(100% - ${size.button_height}px)`
					}
				}, [
					m(".b.text-ellipsis", {title: getCapabilityText(downcast(invitation.capability))}, invitation.sharedGroupName),
					m(".small.text-ellipsis", {title: invitation.inviterMailAddress},
						(getDisplayText(invitation.inviterName, invitation.inviterMailAddress, true)))
				]),
				m(ButtonN, {
					label: "show_action",
					click: () => showGroupInvitationDialog(invitation),
					icon: () => icon ? icon : Icons.Eye
				})
			])
		]
	}
}
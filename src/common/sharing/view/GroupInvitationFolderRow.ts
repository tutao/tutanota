import m, { Children, Component, Vnode } from "mithril"
import { size } from "../../gui/size"
import { getCapabilityText } from "../GroupUtils"
import { downcast } from "@tutao/tutanota-utils"
import { showGroupInvitationDialog } from "./ReceivedGroupInvitationDialog.js"
import { Icons } from "../../gui/base/icons/Icons"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import type { AllIcons } from "../../gui/base/Icon"
import { IconButton } from "../../gui/base/IconButton.js"
import { getMailAddressDisplayText } from "../../mailFunctionality/SharedMailUtils.js"

export type GroupInvitationFolderRowAttrs = {
	invitation: ReceivedGroupInvitation
	icon?: AllIcons
}

export class GroupInvitationFolderRow implements Component<GroupInvitationFolderRowAttrs> {
	view(vnode: Vnode<GroupInvitationFolderRowAttrs>): Children {
		const { invitation, icon } = vnode.attrs
		return [
			m(".folder-row.flex-start.plr-l", [
				m(
					".flex-v-center.flex-grow.button-height",
					{
						style: {
							// It's kinda hard to tell this element to not eat up all the row and truncate text instead because it
							// is vertical flex. With this it will stop at 80% of what it could be and that's enough for the button.
							"max-width": `calc(100% - ${size.button_height}px)`,
						},
					},
					[
						m(
							".b.text-ellipsis",
							{
								title: getCapabilityText(downcast(invitation.capability)),
							},
							invitation.sharedGroupName,
						),
						m(
							".small.text-ellipsis",
							{
								title: invitation.inviterMailAddress,
							},
							getMailAddressDisplayText(invitation.inviterName, invitation.inviterMailAddress, true),
						),
					],
				),
				m(IconButton, {
					title: "show_action",
					click: () => showGroupInvitationDialog(invitation),
					icon: icon ?? Icons.Eye,
				}),
			]),
		]
	}
}

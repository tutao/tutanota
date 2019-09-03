// @flow

import {Dialog, DialogType} from "../gui/base/Dialog"
import m from "mithril"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"
import {load, loadAll} from "../api/main/Entity"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {neverNull} from "../api/common/utils/Utils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {Icons} from "../gui/base/icons/Icons"

export function showCalendarSharingDialog(groupInfo: GroupInfo) {
	let members = []
	load(GroupTypeRef, groupInfo.group)
		.then((group) => loadAll(GroupMemberTypeRef, group.members))
		.then((members) => Promise.map(members, (member) => {
				return load(GroupInfoTypeRef, member.userGroupInfo)
					.then((userGroupInfo) => {
						return {
							mailAddress: neverNull(userGroupInfo.mailAddress),
							capability: member.capability
						}
					})
			}
		))
		.then((loadedMembers) => {
			members = loadedMembers
			m.redraw()
		})

	const invitePeopleValue = stream("")
	Dialog.showActionDialog({
		title: () => "",
		type: DialogType.EditLarge,
		child: () => m(".flex.col", [
			m(".h5", "Invite"),
			m(TextFieldN, {
				label: () => "People to invite",
				value: invitePeopleValue,
			}),
			m(".h5", "Pending invites"),
			m(".h5", "Members"),
			m(TableN, {
				columnHeadingTextIds: ["mailAddress_label", "permissions_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: members.map((member) => {
					return {
						cells: [member.mailAddress, member.capability], actionButtonAttrs: {
							label: "more_label",
							click: () => {},
							icon: () => Icons.More,
						}
					}
				}),
				showActionButtonColumn: true,
			})
		]),
		okAction: null
	})
}

import { TemplateGroupRoot } from "@tutao/entities/tutanota"
import { Group, GroupInfo, GroupMembership } from "@tutao/entities/sys"

export type TemplateGroupInstance = {
	group: Group
	groupInfo: GroupInfo
	groupRoot: TemplateGroupRoot
	groupMembership: GroupMembership
}

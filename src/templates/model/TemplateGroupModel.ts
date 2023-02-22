import type { Group, GroupInfo, GroupMembership } from "../../api/entities/sys/TypeRefs.js"
import type { TemplateGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"

export type TemplateGroupInstance = {
	group: Group
	groupInfo: GroupInfo
	groupRoot: TemplateGroupRoot
	groupMembership: GroupMembership
}

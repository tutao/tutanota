import type { Group, GroupInfo, GroupMembership } from "../../../common/api/entities/sys/TypeRefs.js"
import { tutanotaTypeRefs } from "@tutao/typeRefs"

export type TemplateGroupInstance = {
	group: Group
	groupInfo: GroupInfo
	groupRoot: tutanotaTypeRefs.TemplateGroupRoot
	groupMembership: GroupMembership
}

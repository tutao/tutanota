import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { sysTypeRefs } from "@tutao/typeRefs"

export type TemplateGroupInstance = {
	group: sysTypeRefs.Group
	groupInfo: sysTypeRefs.GroupInfo
	groupRoot: tutanotaTypeRefs.TemplateGroupRoot
	groupMembership: sysTypeRefs.GroupMembership
}

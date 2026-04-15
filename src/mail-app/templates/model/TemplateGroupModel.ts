import { tutanotaTypeRefs } from "@tutao/typerefs"
import { sysTypeRefs } from "@tutao/typerefs"

export type TemplateGroupInstance = {
	group: sysTypeRefs.Group
	groupInfo: sysTypeRefs.GroupInfo
	groupRoot: tutanotaTypeRefs.TemplateGroupRoot
	groupMembership: sysTypeRefs.GroupMembership
}

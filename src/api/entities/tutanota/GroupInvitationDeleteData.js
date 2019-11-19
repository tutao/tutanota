// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupInvitationDeleteDataTypeRef:TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", "GroupInvitationDeleteData")
export const _TypeModel:TypeModel= {"name":"GroupInvitationDeleteData","since":38,"type":"DATA_TRANSFER_TYPE","id":1016,"rootId":"CHR1dGFub3RhAAP4","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1017,"since":38,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"receivedInvitation":{"name":"receivedInvitation","id":1018,"since":38,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"One","refType":"ReceivedGroupInvitation","final":false,"external":true}},"app":"tutanota","version":"40"}

export function createGroupInvitationDeleteData(values?: $Shape<$Exact<GroupInvitationDeleteData>>):GroupInvitationDeleteData {
    return Object.assign(create(_TypeModel, GroupInvitationDeleteDataTypeRef), values)
}

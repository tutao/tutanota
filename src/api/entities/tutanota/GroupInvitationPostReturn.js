// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupInvitationPostReturnTypeRef:TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", "GroupInvitationPostReturn")
export const _TypeModel:TypeModel= {"name":"GroupInvitationPostReturn","since":38,"type":"DATA_TRANSFER_TYPE","id":1006,"rootId":"CHR1dGFub3RhAAPu","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1007,"since":38,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"existingMailAddresses":{"name":"existingMailAddresses","id":1008,"since":38,"type":"AGGREGATION","cardinality":"Any","refType":"MailAddress","final":false},"invalidMailAddresses":{"name":"invalidMailAddresses","id":1009,"since":38,"type":"AGGREGATION","cardinality":"Any","refType":"MailAddress","final":false},"invitedMailAddresses":{"name":"invitedMailAddresses","id":1010,"since":38,"type":"AGGREGATION","cardinality":"Any","refType":"MailAddress","final":false}},"app":"tutanota","version":"40"}

export function createGroupInvitationPostReturn(values?: $Shape<$Exact<GroupInvitationPostReturn>>):GroupInvitationPostReturn {
    return Object.assign(create(_TypeModel, GroupInvitationPostReturnTypeRef), values)
}

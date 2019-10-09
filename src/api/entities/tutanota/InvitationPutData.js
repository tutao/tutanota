// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InvitationPutDataTypeRef:TypeRef<InvitationPutData> = new TypeRef("tutanota", "InvitationPutData")
export const _TypeModel:TypeModel= {"name":"InvitationPutData","since":37,"type":"DATA_TRANSFER_TYPE","id":1001,"rootId":"CHR1dGFub3RhAAPp","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1002,"since":37,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"invite":{"name":"invite","id":1003,"since":37,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"One","refType":"IncomingInvite","final":false,"external":true}},"app":"tutanota","version":"37"}

export function createInvitationPutData(values?: $Shape<$Exact<InvitationPutData>>):InvitationPutData {
    return Object.assign(create(_TypeModel, InvitationPutDataTypeRef), values)
}

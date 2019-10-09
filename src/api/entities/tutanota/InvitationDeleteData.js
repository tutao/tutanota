// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InvitationDeleteDataTypeRef:TypeRef<InvitationDeleteData> = new TypeRef("tutanota", "InvitationDeleteData")
export const _TypeModel:TypeModel= {"name":"InvitationDeleteData","since":37,"type":"DATA_TRANSFER_TYPE","id":1004,"rootId":"CHR1dGFub3RhAAPs","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1005,"since":37,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"invite":{"name":"invite","id":1006,"since":37,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"One","refType":"IncomingInvite","final":false,"external":true}},"app":"tutanota","version":"37"}

export function createInvitationDeleteData(values?: $Shape<$Exact<InvitationDeleteData>>):InvitationDeleteData {
    return Object.assign(create(_TypeModel, InvitationDeleteDataTypeRef), values)
}

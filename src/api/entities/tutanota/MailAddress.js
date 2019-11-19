// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailAddressTypeRef:TypeRef<MailAddress> = new TypeRef("tutanota", "MailAddress")
export const _TypeModel:TypeModel= {"name":"MailAddress","since":1,"type":"AGGREGATED_TYPE","id":92,"rootId":"CHR1dGFub3RhAFw","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":93,"since":1,"type":"CustomId","cardinality":"One","final":true,"encrypted":false},"address":{"name":"address","id":95,"since":1,"type":"String","cardinality":"One","final":true,"encrypted":false},"name":{"name":"name","id":94,"since":1,"type":"String","cardinality":"One","final":true,"encrypted":true}},"associations":{"contact":{"name":"contact","id":96,"since":1,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"ZeroOrOne","refType":"Contact","final":false,"external":false}},"app":"tutanota","version":"40"}

export function createMailAddress(values?: $Shape<$Exact<MailAddress>>):MailAddress {
    return Object.assign(create(_TypeModel, MailAddressTypeRef), values)
}

// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PasswordChannelPhoneNumberTypeRef:TypeRef<PasswordChannelPhoneNumber> = new TypeRef("tutanota", "PasswordChannelPhoneNumber")
export const _TypeModel:TypeModel= {"name":"PasswordChannelPhoneNumber","since":1,"type":"AGGREGATED_TYPE","id":135,"rootId":"CHR1dGFub3RhAACH","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":136,"since":1,"type":"CustomId","cardinality":"One","final":true,"encrypted":false},"number":{"name":"number","id":137,"since":1,"type":"String","cardinality":"One","final":true,"encrypted":false}},"associations":{},"app":"tutanota","version":"40"}

export function createPasswordChannelPhoneNumber(values?: $Shape<$Exact<PasswordChannelPhoneNumber>>):PasswordChannelPhoneNumber {
    return Object.assign(create(_TypeModel, PasswordChannelPhoneNumberTypeRef), values)
}

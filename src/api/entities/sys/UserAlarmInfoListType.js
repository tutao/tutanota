// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserAlarmInfoListTypeTypeRef:TypeRef<UserAlarmInfoListType> = new TypeRef("sys", "UserAlarmInfoListType")
export const _TypeModel:TypeModel= {"name":"UserAlarmInfoListType","since":47,"type":"AGGREGATED_TYPE","id":1537,"rootId":"A3N5cwAGAQ","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":1538,"since":47,"type":"CustomId","cardinality":"One","final":true,"encrypted":false}},"associations":{"alarms":{"name":"alarms","id":1539,"since":47,"type":"LIST_ASSOCIATION","cardinality":"One","refType":"UserAlarmInfo","final":true,"external":false}},"app":"sys","version":"47"}

export function createUserAlarmInfoListType():UserAlarmInfoListType {
    return create(_TypeModel, UserAlarmInfoListTypeTypeRef)
}

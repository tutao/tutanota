// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const AlarmServicePostTypeRef:TypeRef<AlarmServicePost> = new TypeRef("sys", "AlarmServicePost")
export const _TypeModel:TypeModel= {"name":"AlarmServicePost","since":47,"type":"DATA_TRANSFER_TYPE","id":1531,"rootId":"A3N5cwAF-w","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1532,"since":47,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"alarmInfos":{"name":"alarmInfos","id":1533,"since":47,"type":"AGGREGATION","cardinality":"Any","refType":"AlarmInfo","final":false},"group":{"name":"group","id":1534,"since":47,"type":"ELEMENT_ASSOCIATION","cardinality":"One","refType":"Group","final":false,"external":false}},"app":"sys","version":"47"}

export function createAlarmServicePost():AlarmServicePost {
    return create(_TypeModel, AlarmServicePostTypeRef)
}

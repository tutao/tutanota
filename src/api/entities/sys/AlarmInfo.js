// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const AlarmInfoTypeRef:TypeRef<AlarmInfo> = new TypeRef("sys", "AlarmInfo")
export const _TypeModel:TypeModel= {"name":"AlarmInfo","since":47,"type":"AGGREGATED_TYPE","id":1525,"rootId":"A3N5cwAF9Q","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":1526,"since":47,"type":"CustomId","cardinality":"One","final":true,"encrypted":false},"identifier":{"name":"identifier","id":1529,"since":47,"type":"Number","cardinality":"One","final":false,"encrypted":false},"operation":{"name":"operation","id":1527,"since":47,"type":"Number","cardinality":"One","final":false,"encrypted":false},"trigger":{"name":"trigger","id":1528,"since":47,"type":"Date","cardinality":"One","final":false,"encrypted":false}},"associations":{},"app":"sys","version":"47"}

export function createAlarmInfo():AlarmInfo {
    return create(_TypeModel, AlarmInfoTypeRef)
}

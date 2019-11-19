// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const StatisticLogRefTypeRef:TypeRef<StatisticLogRef> = new TypeRef("tutanota", "StatisticLogRef")
export const _TypeModel:TypeModel= {"name":"StatisticLogRef","since":25,"type":"AGGREGATED_TYPE","id":875,"rootId":"CHR1dGFub3RhAANr","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":876,"since":25,"type":"CustomId","cardinality":"One","final":true,"encrypted":false}},"associations":{"items":{"name":"items","id":877,"since":25,"type":"LIST_ASSOCIATION","cardinality":"One","refType":"StatisticLogEntry","final":true,"external":false}},"app":"tutanota","version":"40"}

export function createStatisticLogRef(values?: $Shape<$Exact<StatisticLogRef>>):StatisticLogRef {
    return Object.assign(create(_TypeModel, StatisticLogRefTypeRef), values)
}

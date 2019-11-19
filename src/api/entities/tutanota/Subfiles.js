// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SubfilesTypeRef:TypeRef<Subfiles> = new TypeRef("tutanota", "Subfiles")
export const _TypeModel:TypeModel= {"name":"Subfiles","since":1,"type":"AGGREGATED_TYPE","id":11,"rootId":"CHR1dGFub3RhAAs","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":12,"since":1,"type":"CustomId","cardinality":"One","final":true,"encrypted":false}},"associations":{"files":{"name":"files","id":27,"since":1,"type":"LIST_ASSOCIATION","cardinality":"One","refType":"File","final":true,"external":false}},"app":"tutanota","version":"40"}

export function createSubfiles(values?: $Shape<$Exact<Subfiles>>):Subfiles {
    return Object.assign(create(_TypeModel, SubfilesTypeRef), values)
}

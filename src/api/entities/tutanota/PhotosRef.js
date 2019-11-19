// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PhotosRefTypeRef:TypeRef<PhotosRef> = new TypeRef("tutanota", "PhotosRef")
export const _TypeModel:TypeModel= {"name":"PhotosRef","since":23,"type":"AGGREGATED_TYPE","id":853,"rootId":"CHR1dGFub3RhAANV","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":854,"since":23,"type":"CustomId","cardinality":"One","final":true,"encrypted":false}},"associations":{"files":{"name":"files","id":855,"since":23,"type":"LIST_ASSOCIATION","cardinality":"One","refType":"File","final":true,"external":false}},"app":"tutanota","version":"40"}

export function createPhotosRef(values?: $Shape<$Exact<PhotosRef>>):PhotosRef {
    return Object.assign(create(_TypeModel, PhotosRefTypeRef), values)
}

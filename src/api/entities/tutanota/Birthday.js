// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const BirthdayTypeRef:TypeRef<Birthday> = new TypeRef("tutanota", "Birthday")
export const _TypeModel:TypeModel= {"name":"Birthday","since":23,"type":"AGGREGATED_TYPE","id":844,"rootId":"CHR1dGFub3RhAANM","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":845,"since":23,"type":"CustomId","cardinality":"One","final":true,"encrypted":false},"day":{"name":"day","id":846,"since":23,"type":"Number","cardinality":"One","final":false,"encrypted":false},"month":{"name":"month","id":847,"since":23,"type":"Number","cardinality":"One","final":false,"encrypted":false},"year":{"name":"year","id":848,"since":23,"type":"Number","cardinality":"ZeroOrOne","final":false,"encrypted":false}},"associations":{},"app":"tutanota","version":"40"}

export function createBirthday(values?: $Shape<$Exact<Birthday>>):Birthday {
    return Object.assign(create(_TypeModel, BirthdayTypeRef), values)
}

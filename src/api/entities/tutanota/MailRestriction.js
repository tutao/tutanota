// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailRestrictionTypeRef:TypeRef<MailRestriction> = new TypeRef("tutanota", "MailRestriction")
export const _TypeModel:TypeModel= {"name":"MailRestriction","since":19,"type":"AGGREGATED_TYPE","id":719,"rootId":"CHR1dGFub3RhAALP","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":720,"since":19,"type":"CustomId","cardinality":"One","final":true,"encrypted":false}},"associations":{"delegationGroups_removed":{"name":"delegationGroups_removed","id":722,"since":19,"type":"ELEMENT_ASSOCIATION","cardinality":"Any","refType":"Group","final":true,"external":true},"participantGroupInfos":{"name":"participantGroupInfos","id":820,"since":21,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"Any","refType":"GroupInfo","final":true,"external":true}},"app":"tutanota","version":"40"}

export function createMailRestriction(values?: $Shape<$Exact<MailRestriction>>):MailRestriction {
    return Object.assign(create(_TypeModel, MailRestrictionTypeRef), values)
}

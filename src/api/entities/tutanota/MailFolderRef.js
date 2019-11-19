// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailFolderRefTypeRef:TypeRef<MailFolderRef> = new TypeRef("tutanota", "MailFolderRef")
export const _TypeModel:TypeModel= {"name":"MailFolderRef","since":7,"type":"AGGREGATED_TYPE","id":440,"rootId":"CHR1dGFub3RhAAG4","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":441,"since":7,"type":"CustomId","cardinality":"One","final":true,"encrypted":false}},"associations":{"folders":{"name":"folders","id":442,"since":7,"type":"LIST_ASSOCIATION","cardinality":"One","refType":"MailFolder","final":true,"external":false}},"app":"tutanota","version":"40"}

export function createMailFolderRef(values?: $Shape<$Exact<MailFolderRef>>):MailFolderRef {
    return Object.assign(create(_TypeModel, MailFolderRefTypeRef), values)
}

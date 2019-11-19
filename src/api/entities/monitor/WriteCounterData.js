// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const WriteCounterDataTypeRef:TypeRef<WriteCounterData> = new TypeRef("monitor", "WriteCounterData")
export const _TypeModel:TypeModel= {"name":"WriteCounterData","since":4,"type":"DATA_TRANSFER_TYPE","id":49,"rootId":"B21vbml0b3IAMQ","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":50,"since":4,"type":"Number","cardinality":"One","final":false,"encrypted":false},"counterType":{"name":"counterType","id":215,"since":12,"type":"Number","cardinality":"ZeroOrOne","final":false,"encrypted":false},"row":{"name":"row","id":51,"since":4,"type":"String","cardinality":"One","final":false,"encrypted":false},"column":{"name":"column","id":52,"since":4,"type":"GeneratedId","cardinality":"One","final":false,"encrypted":false},"value":{"name":"value","id":53,"since":4,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{},"app":"monitor","version":"13"}

export function createWriteCounterData(values?: $Shape<$Exact<WriteCounterData>>):WriteCounterData {
    return Object.assign(create(_TypeModel, WriteCounterDataTypeRef), values)
}

// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CustomerAccountReturnTypeRef:TypeRef<CustomerAccountReturn> = new TypeRef("accounting", "CustomerAccountReturn")
export const _TypeModel:TypeModel= {"name":"CustomerAccountReturn","since":3,"type":"DATA_TRANSFER_TYPE","id":86,"rootId":"CmFjY291bnRpbmcAVg","versioned":false,"encrypted":true,"values":{"_format":{"name":"_format","id":87,"since":3,"type":"Number","cardinality":"One","final":false,"encrypted":false},"_ownerGroup":{"name":"_ownerGroup","id":88,"since":3,"type":"GeneratedId","cardinality":"ZeroOrOne","final":true,"encrypted":false},"_ownerPublicEncSessionKey":{"name":"_ownerPublicEncSessionKey","id":89,"since":3,"type":"Bytes","cardinality":"ZeroOrOne","final":true,"encrypted":false}},"associations":{"postings":{"name":"postings","id":90,"since":3,"type":"AGGREGATION","cardinality":"Any","refType":"CustomerAccountPosting","final":false}},"app":"accounting","version":"3"}

export function createCustomerAccountReturn(values?: $Shape<$Exact<CustomerAccountReturn>>):CustomerAccountReturn {
    return Object.assign(create(_TypeModel, CustomerAccountReturnTypeRef), values)
}

import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"


export const CustomerAccountPostingTypeRef: TypeRef<CustomerAccountPosting> = new TypeRef("accounting", "CustomerAccountPosting")

export function createCustomerAccountPosting(values: StrippedEntity<CustomerAccountPosting>): CustomerAccountPosting {
	return Object.assign(create(typeModels.CustomerAccountPosting, CustomerAccountPostingTypeRef), values)
}

export type CustomerAccountPosting = {
	_type: TypeRef<CustomerAccountPosting>;

	_id: Id;
	amount: NumberString;
	invoiceNumber: null | string;
	type: NumberString;
	valueDate: Date;
}
export const CustomerAccountReturnTypeRef: TypeRef<CustomerAccountReturn> = new TypeRef("accounting", "CustomerAccountReturn")

export function createCustomerAccountReturn(values: StrippedEntity<CustomerAccountReturn>): CustomerAccountReturn {
	return Object.assign(create(typeModels.CustomerAccountReturn, CustomerAccountReturnTypeRef), values)
}

export type CustomerAccountReturn = {
	_type: TypeRef<CustomerAccountReturn>;
	_errors: Object;

	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerPublicEncSessionKey: null | Uint8Array;
	_publicCryptoProtocolVersion: null | NumberString;
	balance: NumberString;
	outstandingBookingsPrice: NumberString;

	postings: CustomerAccountPosting[];
}

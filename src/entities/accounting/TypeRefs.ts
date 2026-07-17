import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"


export const CustomerAccountPostingTypeRef: TypeRef<CustomerAccountPosting> = new TypeRef("accounting", 79)

export function createCustomerAccountPosting(values: CustomerAccountPostingParams): CustomerAccountPosting {
    return Object.assign(create(typeModels[CustomerAccountPostingTypeRef.typeId], CustomerAccountPostingTypeRef), values)
}

export type CustomerAccountPostingParams = {


	type: NumberString;
	valueDate: Date;
	invoiceNumber: null | string;
	amount: NumberString;
}

export type CustomerAccountPosting = {
	_type: TypeRef<CustomerAccountPosting>;
	_original?: CustomerAccountPosting

	_id: Id;
	type: NumberString;
	valueDate: Date;
	invoiceNumber: null | string;
	amount: NumberString;
}
export const CustomerAccountReturnTypeRef: TypeRef<CustomerAccountReturn> = new TypeRef("accounting", 86)

export function createCustomerAccountReturn(values: CustomerAccountReturnParams): CustomerAccountReturn {
    return Object.assign(create(typeModels[CustomerAccountReturnTypeRef.typeId], CustomerAccountReturnTypeRef), values)
}

export type CustomerAccountReturnParams = {


	_ownerPublicEncSessionKey: null | Uint8Array;
	outstandingBookingsPrice: NumberString;
	balance: NumberString;
	_publicCryptoProtocolVersion: null | NumberString;

	postings: CustomerAccountPosting[];
}

export type CustomerAccountReturn = {
	_type: TypeRef<CustomerAccountReturn>;
	_errors: Object;
	_original?: CustomerAccountReturn

	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerPublicEncSessionKey: null | Uint8Array;
	outstandingBookingsPrice: NumberString;
	balance: NumberString;
	_publicCryptoProtocolVersion: null | NumberString;

	postings: CustomerAccountPosting[];
}

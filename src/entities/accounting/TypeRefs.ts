import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"


export const CustomerAccountPostingTypeRef: TypeRef<CustomerAccountPosting> = new TypeRef("accounting", 79)

export function createCustomerAccountPosting(values: StrippedEntity<CustomerAccountPosting>): CustomerAccountPosting {
    return Object.assign(create(typeModels[CustomerAccountPostingTypeRef.typeId], CustomerAccountPostingTypeRef), values)
}

export type CustomerAccountPostingParams = {

	_id: Id;
	type: NumberString;
	valueDate: Date;
	invoiceNumber: null | string;
	amount: NumberString;
}

export class CustomerAccountPosting extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerAccountPosting> { return CustomerAccountPostingTypeRef };
	

	get _id(): Id { return this._attrs[80] }
	get type(): NumberString { return this._attrs[81] }
	get valueDate(): Date { return this._attrs[82] }
	get invoiceNumber(): null | string { return this._attrs[83] }
	get amount(): NumberString { return this._attrs[84] }
	
}
export const CustomerAccountReturnTypeRef: TypeRef<CustomerAccountReturn> = new TypeRef("accounting", 86)

export function createCustomerAccountReturn(values: StrippedEntity<CustomerAccountReturn>): CustomerAccountReturn {
    return Object.assign(create(typeModels[CustomerAccountReturnTypeRef.typeId], CustomerAccountReturnTypeRef), values)
}

export type CustomerAccountReturnParams = {

	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerPublicEncSessionKey: null | Uint8Array;
	outstandingBookingsPrice: NumberString;
	balance: NumberString;
	_publicCryptoProtocolVersion: null | NumberString;

	postings: CustomerAccountPosting[];
}

export class CustomerAccountReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerAccountReturn> { return CustomerAccountReturnTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[87] }
	get _ownerGroup(): null | Id { return this._attrs[88] }
	get _ownerPublicEncSessionKey(): null | Uint8Array { return this._attrs[89] }
	get outstandingBookingsPrice(): NumberString { return this._attrs[92] }
	get balance(): NumberString { return this._attrs[94] }
	get _publicCryptoProtocolVersion(): null | NumberString { return this._attrs[96] }
	

	get postings(): CustomerAccountPosting[] { return this._attrs[96] }
	set postings(a: CustomerAccountPosting[])  { this._attrs[90] = a } 
}

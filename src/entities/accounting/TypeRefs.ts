import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId, DataTransferId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"

export const CustomerAccountPostingTypeRef: TypeRef<CustomerAccountPosting> = new TypeRef("accounting", 79)

export function createCustomerAccountPosting(values: CustomerAccountPostingParams): CustomerAccountPosting {
	return Object.assign(create(typeModels[CustomerAccountPostingTypeRef.typeId], CustomerAccountPostingTypeRef), values)
}

export type CustomerAccountPostingParams = {
	type: NumberString
	valueDate: Date
	invoiceNumber: null | string
	amount: NumberString
}

export type CustomerAccountPosting = {
	// == values

	_id: Id
	type: NumberString
	valueDate: Date
	invoiceNumber: null | string
	amount: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CustomerAccountPosting>
	_original: Nullable<CustomerAccountPosting>
	isAdapter: false
}
export const CustomerAccountReturnTypeRef: TypeRef<CustomerAccountReturn> = new TypeRef("accounting", 86)

export function createCustomerAccountReturn(values: CustomerAccountReturnParams): CustomerAccountReturn {
	return Object.assign(create(typeModels[CustomerAccountReturnTypeRef.typeId], CustomerAccountReturnTypeRef), values)
}

export type CustomerAccountReturnParams = {
	_ownerPublicEncSessionKey: null | Uint8Array<ArrayBuffer>
	outstandingBookingsPrice: NumberString
	balance: NumberString
	_publicCryptoProtocolVersion: null | NumberString

	postings: CustomerAccountPosting[]
}

export type CustomerAccountReturn = {
	// == values

	_format: NumberString
	_ownerGroup: null | Id
	_ownerPublicEncSessionKey: null | Uint8Array<ArrayBuffer>
	outstandingBookingsPrice: NumberString
	balance: NumberString
	_publicCryptoProtocolVersion: null | NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	postings: CustomerAccountPosting[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CustomerAccountReturn>
	_errors: Object
	_original: Nullable<CustomerAccountReturn>
	isAdapter: false
}

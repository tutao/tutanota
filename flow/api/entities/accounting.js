type CustomerAccountPosting = {
	_type: TypeRef<CustomerAccountPosting>;
	_id: Id;
	amount: NumberString;
	balance: NumberString;
	invoiceNumber: ?string;
	type: NumberString;
	valueDate: Date;

}

type CustomerAccountReturn = {
	_type: TypeRef<CustomerAccountReturn>;
	_errors: Object;
	_format: NumberString;
	_ownerGroup: ?Id;
	_ownerPublicEncSessionKey: ?Uint8Array;

	postings: CustomerAccountPosting[];
}


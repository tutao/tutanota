type CustomerAccountPosting = {
	_type: TypeRef<CustomerAccountPosting>;
	_id: Id;
	amount: NumberString;
	balance: NumberString;
	invoiceNumber: ?string;
	paymentMethod: ?NumberString;
	type: NumberString;
	valueDate: Date;

}

type CustomerAccountReturn = {
	_type: TypeRef<CustomerAccountReturn>;
	_errors: Object;
	_format: NumberString;
	_ownerAsyncEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;

	postings: CustomerAccountPosting[];
}

// if ever changed, keep in sync with the version in tutanota-next/
export const enum PaymentCredit2Stages {
	// completed the first time we enter the cc input page
	// may still choose another payment method
	Entered,
	// completed when we focus one of the inputs on the cc page (we actually want
	// probably wants to use cc payment
	FocusedInput,
	// pressed the "next" button on the cc page
	TriedClientValidation,
	// got the result of the updatePaymentData call to the server
	TDSPreValidation,
	// pressed the confirm button on the dialog that informs about 3DS
	TDSInfoConfirmed,
	// got a 3DS result from braintree (in an entity update)
	TDSValidationResult,
	// 3DS was successful, cc is accepted.
	TDSSuccess,
}

import {
	AlarmServicePostTypeRef,
	AutoLoginDataDeleteTypeRef,
	AutoLoginDataGetTypeRef,
	AutoLoginDataReturnTypeRef,
	AutoLoginPostReturnTypeRef,
	BrandingDomainDataTypeRef,
	BrandingDomainDeleteDataTypeRef,
	BrandingDomainGetReturnTypeRef,
	ChangeKdfPostInTypeRef,
	ChangePasswordDataTypeRef,
	CloseSessionServicePostTypeRef,
	CreateCustomerServerPropertiesDataTypeRef,
	CreateCustomerServerPropertiesReturnTypeRef,
	CreateSessionDataTypeRef,
	CreateSessionReturnTypeRef,
	CustomDomainCheckGetInTypeRef,
	CustomDomainCheckGetOutTypeRef,
	CustomDomainDataTypeRef,
	CustomDomainReturnTypeRef,
	CustomerAccountTerminationPostInTypeRef,
	CustomerAccountTerminationPostOutTypeRef,
	DebitServicePutDataTypeRef,
	DeleteCustomerDataTypeRef,
	DomainMailAddressAvailabilityDataTypeRef,
	DomainMailAddressAvailabilityReturnTypeRef,
	ExternalPropertiesReturnTypeRef,
	GiftCardCreateDataTypeRef,
	GiftCardCreateReturnTypeRef,
	GiftCardDeleteDataTypeRef,
	GiftCardGetReturnTypeRef,
	GiftCardRedeemDataTypeRef,
	GiftCardRedeemGetReturnTypeRef,
	InvoiceDataGetInTypeRef,
	InvoiceDataGetOutTypeRef,
	LocationServiceGetReturnTypeRef,
	MailAddressAliasGetInTypeRef,
	MailAddressAliasServiceDataDeleteTypeRef,
	MailAddressAliasServiceDataTypeRef,
	MailAddressAliasServiceReturnTypeRef,
	MembershipAddDataTypeRef,
	MembershipRemoveDataTypeRef,
	MultipleMailAddressAvailabilityDataTypeRef,
	MultipleMailAddressAvailabilityReturnTypeRef,
	PaymentDataServiceGetDataTypeRef,
	PaymentDataServiceGetReturnTypeRef,
	PaymentDataServicePostDataTypeRef,
	PaymentDataServicePutDataTypeRef,
	PaymentDataServicePutReturnTypeRef,
	PdfInvoiceServiceDataTypeRef,
	PdfInvoiceServiceReturnTypeRef,
	PlanServiceGetOutTypeRef,
	PremiumFeatureDataTypeRef,
	PremiumFeatureReturnTypeRef,
	PriceServiceDataTypeRef,
	PriceServiceReturnTypeRef,
	PublicKeyGetInTypeRef,
	PublicKeyGetOutTypeRef,
	PublicKeyPutInTypeRef,
	ReferralCodeGetInTypeRef,
	ReferralCodePostInTypeRef,
	ReferralCodePostOutTypeRef,
	RegistrationCaptchaServiceDataTypeRef,
	RegistrationCaptchaServiceGetDataTypeRef,
	RegistrationCaptchaServiceReturnTypeRef,
	RegistrationReturnTypeRef,
	RegistrationServiceDataTypeRef,
	ResetFactorsDeleteDataTypeRef,
	ResetPasswordDataTypeRef,
	SaltDataTypeRef,
	SaltReturnTypeRef,
	SecondFactorAuthAllowedReturnTypeRef,
	SecondFactorAuthDataTypeRef,
	SecondFactorAuthDeleteDataTypeRef,
	SecondFactorAuthGetDataTypeRef,
	SecondFactorAuthGetReturnTypeRef,
	SignOrderProcessingAgreementDataTypeRef,
	SwitchAccountTypePostInTypeRef,
	SystemKeysReturnTypeRef,
	TakeOverDeletedAddressDataTypeRef,
	UpdateAdminshipDataTypeRef,
	UpdatePermissionKeyDataTypeRef,
	UpdateSessionKeysPostInTypeRef,
	UpgradePriceServiceDataTypeRef,
	UpgradePriceServiceReturnTypeRef,
	UserDataDeleteTypeRef,
	VersionDataTypeRef,
	VersionReturnTypeRef
} from "./TypeRefs.js"

export const AlarmService = Object.freeze({
	app: "sys",
	name: "AlarmService",
	get: null,
	post: {data: AlarmServicePostTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const AutoLoginService = Object.freeze({
	app: "sys",
	name: "AutoLoginService",
	get: {data: AutoLoginDataGetTypeRef, return: AutoLoginDataReturnTypeRef},
	post: {data: AutoLoginDataReturnTypeRef, return: AutoLoginPostReturnTypeRef},
	put: null,
	delete: {data: AutoLoginDataDeleteTypeRef, return: null},
} as const)

export const BrandingDomainService = Object.freeze({
	app: "sys",
	name: "BrandingDomainService",
	get: {data: null, return: BrandingDomainGetReturnTypeRef},
	post: {data: BrandingDomainDataTypeRef, return: null},
	put: {data: BrandingDomainDataTypeRef, return: null},
	delete: {data: BrandingDomainDeleteDataTypeRef, return: null},
} as const)

export const ChangeKdfService = Object.freeze({
	app: "sys",
	name: "ChangeKdfService",
	get: null,
	post: {data: ChangeKdfPostInTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const ChangePasswordService = Object.freeze({
	app: "sys",
	name: "ChangePasswordService",
	get: null,
	post: {data: ChangePasswordDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const CloseSessionService = Object.freeze({
	app: "sys",
	name: "CloseSessionService",
	get: null,
	post: {data: CloseSessionServicePostTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const CreateCustomerServerProperties = Object.freeze({
	app: "sys",
	name: "CreateCustomerServerProperties",
	get: null,
	post: {data: CreateCustomerServerPropertiesDataTypeRef, return: CreateCustomerServerPropertiesReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const CustomDomainCheckService = Object.freeze({
	app: "sys",
	name: "CustomDomainCheckService",
	get: {data: CustomDomainCheckGetInTypeRef, return: CustomDomainCheckGetOutTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const CustomDomainService = Object.freeze({
	app: "sys",
	name: "CustomDomainService",
	get: null,
	post: {data: CustomDomainDataTypeRef, return: CustomDomainReturnTypeRef},
	put: {data: CustomDomainDataTypeRef, return: null},
	delete: {data: CustomDomainDataTypeRef, return: null},
} as const)

export const CustomerAccountTerminationService = Object.freeze({
	app: "sys",
	name: "CustomerAccountTerminationService",
	get: null,
	post: {data: CustomerAccountTerminationPostInTypeRef, return: CustomerAccountTerminationPostOutTypeRef},
	put: null,
	delete: null,
} as const)

export const CustomerPublicKeyService = Object.freeze({
	app: "sys",
	name: "CustomerPublicKeyService",
	get: {data: null, return: PublicKeyGetOutTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const CustomerService = Object.freeze({
	app: "sys",
	name: "CustomerService",
	get: null,
	post: null,
	put: null,
	delete: {data: DeleteCustomerDataTypeRef, return: null},
} as const)

export const DebitService = Object.freeze({
	app: "sys",
	name: "DebitService",
	get: null,
	post: null,
	put: {data: DebitServicePutDataTypeRef, return: null},
	delete: null,
} as const)

export const DomainMailAddressAvailabilityService = Object.freeze({
	app: "sys",
	name: "DomainMailAddressAvailabilityService",
	get: {data: DomainMailAddressAvailabilityDataTypeRef, return: DomainMailAddressAvailabilityReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const ExternalPropertiesService = Object.freeze({
	app: "sys",
	name: "ExternalPropertiesService",
	get: {data: null, return: ExternalPropertiesReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const GiftCardRedeemService = Object.freeze({
	app: "sys",
	name: "GiftCardRedeemService",
	get: {data: GiftCardRedeemDataTypeRef, return: GiftCardRedeemGetReturnTypeRef},
	post: {data: GiftCardRedeemDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const GiftCardService = Object.freeze({
	app: "sys",
	name: "GiftCardService",
	get: {data: null, return: GiftCardGetReturnTypeRef},
	post: {data: GiftCardCreateDataTypeRef, return: GiftCardCreateReturnTypeRef},
	put: null,
	delete: {data: GiftCardDeleteDataTypeRef, return: null},
} as const)

export const InvoiceDataService = Object.freeze({
	app: "sys",
	name: "InvoiceDataService",
	get: {data: InvoiceDataGetInTypeRef, return: InvoiceDataGetOutTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const LocationService = Object.freeze({
	app: "sys",
	name: "LocationService",
	get: {data: null, return: LocationServiceGetReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const MailAddressAliasService = Object.freeze({
	app: "sys",
	name: "MailAddressAliasService",
	get: {data: MailAddressAliasGetInTypeRef, return: MailAddressAliasServiceReturnTypeRef},
	post: {data: MailAddressAliasServiceDataTypeRef, return: null},
	put: null,
	delete: {data: MailAddressAliasServiceDataDeleteTypeRef, return: null},
} as const)

export const MembershipService = Object.freeze({
	app: "sys",
	name: "MembershipService",
	get: null,
	post: {data: MembershipAddDataTypeRef, return: null},
	put: null,
	delete: {data: MembershipRemoveDataTypeRef, return: null},
} as const)

export const MultipleMailAddressAvailabilityService = Object.freeze({
	app: "sys",
	name: "MultipleMailAddressAvailabilityService",
	get: {data: MultipleMailAddressAvailabilityDataTypeRef, return: MultipleMailAddressAvailabilityReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const PaymentDataService = Object.freeze({
	app: "sys",
	name: "PaymentDataService",
	get: {data: PaymentDataServiceGetDataTypeRef, return: PaymentDataServiceGetReturnTypeRef},
	post: {data: PaymentDataServicePostDataTypeRef, return: null},
	put: {data: PaymentDataServicePutDataTypeRef, return: PaymentDataServicePutReturnTypeRef},
	delete: null,
} as const)

export const PdfInvoiceService = Object.freeze({
	app: "sys",
	name: "PdfInvoiceService",
	get: {data: PdfInvoiceServiceDataTypeRef, return: PdfInvoiceServiceReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const PlanService = Object.freeze({
	app: "sys",
	name: "PlanService",
	get: {data: null, return: PlanServiceGetOutTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const PremiumFeatureService = Object.freeze({
	app: "sys",
	name: "PremiumFeatureService",
	get: null,
	post: {data: PremiumFeatureDataTypeRef, return: PremiumFeatureReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const PriceService = Object.freeze({
	app: "sys",
	name: "PriceService",
	get: {data: PriceServiceDataTypeRef, return: PriceServiceReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const PublicKeyService = Object.freeze({
	app: "sys",
	name: "PublicKeyService",
	get: {data: PublicKeyGetInTypeRef, return: PublicKeyGetOutTypeRef},
	post: null,
	put: {data: PublicKeyPutInTypeRef, return: null},
	delete: null,
} as const)

export const ReferralCodeService = Object.freeze({
	app: "sys",
	name: "ReferralCodeService",
	get: {data: ReferralCodeGetInTypeRef, return: null},
	post: {data: ReferralCodePostInTypeRef, return: ReferralCodePostOutTypeRef},
	put: null,
	delete: null,
} as const)

export const RegistrationCaptchaService = Object.freeze({
	app: "sys",
	name: "RegistrationCaptchaService",
	get: {data: RegistrationCaptchaServiceGetDataTypeRef, return: RegistrationCaptchaServiceReturnTypeRef},
	post: {data: RegistrationCaptchaServiceDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const RegistrationService = Object.freeze({
	app: "sys",
	name: "RegistrationService",
	get: {data: null, return: RegistrationServiceDataTypeRef},
	post: {data: RegistrationServiceDataTypeRef, return: RegistrationReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const ResetFactorsService = Object.freeze({
	app: "sys",
	name: "ResetFactorsService",
	get: null,
	post: null,
	put: null,
	delete: {data: ResetFactorsDeleteDataTypeRef, return: null},
} as const)

export const ResetPasswordService = Object.freeze({
	app: "sys",
	name: "ResetPasswordService",
	get: null,
	post: {data: ResetPasswordDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const SaltService = Object.freeze({
	app: "sys",
	name: "SaltService",
	get: {data: SaltDataTypeRef, return: SaltReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const SecondFactorAuthAllowedService = Object.freeze({
	app: "sys",
	name: "SecondFactorAuthAllowedService",
	get: {data: null, return: SecondFactorAuthAllowedReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const SecondFactorAuthService = Object.freeze({
	app: "sys",
	name: "SecondFactorAuthService",
	get: {data: SecondFactorAuthGetDataTypeRef, return: SecondFactorAuthGetReturnTypeRef},
	post: {data: SecondFactorAuthDataTypeRef, return: null},
	put: null,
	delete: {data: SecondFactorAuthDeleteDataTypeRef, return: null},
} as const)

export const SessionService = Object.freeze({
	app: "sys",
	name: "SessionService",
	get: null,
	post: {data: CreateSessionDataTypeRef, return: CreateSessionReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const SignOrderProcessingAgreementService = Object.freeze({
	app: "sys",
	name: "SignOrderProcessingAgreementService",
	get: null,
	post: {data: SignOrderProcessingAgreementDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const SwitchAccountTypeService = Object.freeze({
	app: "sys",
	name: "SwitchAccountTypeService",
	get: null,
	post: {data: SwitchAccountTypePostInTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const SystemKeysService = Object.freeze({
	app: "sys",
	name: "SystemKeysService",
	get: {data: null, return: SystemKeysReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const TakeOverDeletedAddressService = Object.freeze({
	app: "sys",
	name: "TakeOverDeletedAddressService",
	get: null,
	post: {data: TakeOverDeletedAddressDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const UpdateAdminshipService = Object.freeze({
	app: "sys",
	name: "UpdateAdminshipService",
	get: null,
	post: {data: UpdateAdminshipDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const UpdatePermissionKeyService = Object.freeze({
	app: "sys",
	name: "UpdatePermissionKeyService",
	get: null,
	post: {data: UpdatePermissionKeyDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const UpdateSessionKeysService = Object.freeze({
	app: "sys",
	name: "UpdateSessionKeysService",
	get: null,
	post: {data: UpdateSessionKeysPostInTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const UpgradePriceService = Object.freeze({
	app: "sys",
	name: "UpgradePriceService",
	get: {data: UpgradePriceServiceDataTypeRef, return: UpgradePriceServiceReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const UserService = Object.freeze({
	app: "sys",
	name: "UserService",
	get: null,
	post: null,
	put: null,
	delete: {data: UserDataDeleteTypeRef, return: null},
} as const)

export const VersionService = Object.freeze({
	app: "sys",
	name: "VersionService",
	get: {data: VersionDataTypeRef, return: VersionReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)
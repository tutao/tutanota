import * as sysTypeRefs from "./TypeRefs.js"
export const AdminGroupKeyRotationService = Object.freeze({
	app: "sys",
	name: "AdminGroupKeyRotationService",
	get: { data: null, return: sysTypeRefs.AdminGroupKeyRotationGetOutTypeRef },
	post: { data: sysTypeRefs.AdminGroupKeyRotationPostInTypeRef, return: null },
	put: { data: sysTypeRefs.AdminGroupKeyRotationPutInTypeRef, return: null },
	delete: null,
} as const)

export const AffiliatePartnerKpiService = Object.freeze({
	app: "sys",
	name: "AffiliatePartnerKpiService",
	get: { data: null, return: sysTypeRefs.AffiliatePartnerKpiServiceGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const AlarmService = Object.freeze({
	app: "sys",
	name: "AlarmService",
	get: null,
	post: { data: sysTypeRefs.AlarmServicePostTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const AppStoreSubscriptionService = Object.freeze({
	app: "sys",
	name: "AppStoreSubscriptionService",
	get: { data: sysTypeRefs.AppStoreSubscriptionGetInTypeRef, return: sysTypeRefs.AppStoreSubscriptionGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const AutoLoginService = Object.freeze({
	app: "sys",
	name: "AutoLoginService",
	get: { data: sysTypeRefs.AutoLoginDataGetTypeRef, return: sysTypeRefs.AutoLoginDataReturnTypeRef },
	post: { data: sysTypeRefs.AutoLoginDataReturnTypeRef, return: sysTypeRefs.AutoLoginPostReturnTypeRef },
	put: null,
	delete: { data: sysTypeRefs.AutoLoginDataDeleteTypeRef, return: null },
} as const)

export const BrandingDomainService = Object.freeze({
	app: "sys",
	name: "BrandingDomainService",
	get: { data: null, return: sysTypeRefs.BrandingDomainGetReturnTypeRef },
	post: { data: sysTypeRefs.BrandingDomainDataTypeRef, return: null },
	put: { data: sysTypeRefs.BrandingDomainDataTypeRef, return: null },
	delete: { data: sysTypeRefs.BrandingDomainDeleteDataTypeRef, return: null },
} as const)

export const ChangeKdfService = Object.freeze({
	app: "sys",
	name: "ChangeKdfService",
	get: null,
	post: { data: sysTypeRefs.ChangeKdfPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const ChangePasswordService = Object.freeze({
	app: "sys",
	name: "ChangePasswordService",
	get: null,
	post: { data: sysTypeRefs.ChangePasswordPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const CloseSessionService = Object.freeze({
	app: "sys",
	name: "CloseSessionService",
	get: null,
	post: { data: sysTypeRefs.CloseSessionServicePostTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const CreateCustomerServerProperties = Object.freeze({
	app: "sys",
	name: "CreateCustomerServerProperties",
	get: null,
	post: { data: sysTypeRefs.CreateCustomerServerPropertiesDataTypeRef, return: sysTypeRefs.CreateCustomerServerPropertiesReturnTypeRef },
	put: null,
	delete: null,
} as const)

export const CustomDomainCheckService = Object.freeze({
	app: "sys",
	name: "CustomDomainCheckService",
	get: { data: sysTypeRefs.CustomDomainCheckGetInTypeRef, return: sysTypeRefs.CustomDomainCheckGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const CustomDomainService = Object.freeze({
	app: "sys",
	name: "CustomDomainService",
	get: null,
	post: { data: sysTypeRefs.CustomDomainDataTypeRef, return: sysTypeRefs.CustomDomainReturnTypeRef },
	put: { data: sysTypeRefs.CustomDomainDataTypeRef, return: null },
	delete: { data: sysTypeRefs.CustomDomainDataTypeRef, return: null },
} as const)

export const CustomerAccountTerminationService = Object.freeze({
	app: "sys",
	name: "CustomerAccountTerminationService",
	get: null,
	post: { data: sysTypeRefs.CustomerAccountTerminationPostInTypeRef, return: sysTypeRefs.CustomerAccountTerminationPostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const CustomerPublicKeyService = Object.freeze({
	app: "sys",
	name: "CustomerPublicKeyService",
	get: { data: null, return: sysTypeRefs.PublicKeyGetOutTypeRef },
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
	delete: { data: sysTypeRefs.DeleteCustomerDataTypeRef, return: null },
} as const)

export const DebitService = Object.freeze({
	app: "sys",
	name: "DebitService",
	get: null,
	post: null,
	put: { data: sysTypeRefs.DebitServicePutDataTypeRef, return: null },
	delete: null,
} as const)

export const DomainMailAddressAvailabilityService = Object.freeze({
	app: "sys",
	name: "DomainMailAddressAvailabilityService",
	get: { data: sysTypeRefs.DomainMailAddressAvailabilityDataTypeRef, return: sysTypeRefs.DomainMailAddressAvailabilityReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const ExternalPropertiesService = Object.freeze({
	app: "sys",
	name: "ExternalPropertiesService",
	get: { data: null, return: sysTypeRefs.ExternalPropertiesReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const GiftCardRedeemService = Object.freeze({
	app: "sys",
	name: "GiftCardRedeemService",
	get: { data: sysTypeRefs.GiftCardRedeemDataTypeRef, return: sysTypeRefs.GiftCardRedeemGetReturnTypeRef },
	post: { data: sysTypeRefs.GiftCardRedeemDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const GiftCardService = Object.freeze({
	app: "sys",
	name: "GiftCardService",
	get: { data: null, return: sysTypeRefs.GiftCardGetReturnTypeRef },
	post: { data: sysTypeRefs.GiftCardCreateDataTypeRef, return: sysTypeRefs.GiftCardCreateReturnTypeRef },
	put: null,
	delete: { data: sysTypeRefs.GiftCardDeleteDataTypeRef, return: null },
} as const)

export const GroupKeyRotationInfoService = Object.freeze({
	app: "sys",
	name: "GroupKeyRotationInfoService",
	get: { data: null, return: sysTypeRefs.GroupKeyRotationInfoGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const GroupKeyRotationService = Object.freeze({
	app: "sys",
	name: "GroupKeyRotationService",
	get: null,
	post: { data: sysTypeRefs.GroupKeyRotationPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const IdentityKeyService = Object.freeze({
	app: "sys",
	name: "IdentityKeyService",
	get: { data: sysTypeRefs.IdentityKeyGetInTypeRef, return: sysTypeRefs.IdentityKeyGetOutTypeRef },
	post: { data: sysTypeRefs.IdentityKeyPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const InvoiceDataService = Object.freeze({
	app: "sys",
	name: "InvoiceDataService",
	get: { data: sysTypeRefs.InvoiceDataGetInTypeRef, return: sysTypeRefs.InvoiceDataGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const LocationService = Object.freeze({
	app: "sys",
	name: "LocationService",
	get: { data: null, return: sysTypeRefs.LocationServiceGetReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const MailAddressAliasService = Object.freeze({
	app: "sys",
	name: "MailAddressAliasService",
	get: { data: sysTypeRefs.MailAddressAliasGetInTypeRef, return: sysTypeRefs.MailAddressAliasServiceReturnTypeRef },
	post: { data: sysTypeRefs.MailAddressAliasServiceDataTypeRef, return: null },
	put: null,
	delete: { data: sysTypeRefs.MailAddressAliasServiceDataDeleteTypeRef, return: null },
} as const)

export const MembershipService = Object.freeze({
	app: "sys",
	name: "MembershipService",
	get: null,
	post: { data: sysTypeRefs.MembershipAddDataTypeRef, return: null },
	put: { data: sysTypeRefs.MembershipPutInTypeRef, return: null },
	delete: { data: sysTypeRefs.MembershipRemoveDataTypeRef, return: null },
} as const)

export const MultipleMailAddressAvailabilityService = Object.freeze({
	app: "sys",
	name: "MultipleMailAddressAvailabilityService",
	get: { data: sysTypeRefs.MultipleMailAddressAvailabilityDataTypeRef, return: sysTypeRefs.MultipleMailAddressAvailabilityReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const PaymentDataService = Object.freeze({
	app: "sys",
	name: "PaymentDataService",
	get: { data: sysTypeRefs.PaymentDataServiceGetDataTypeRef, return: sysTypeRefs.PaymentDataServiceGetReturnTypeRef },
	post: { data: sysTypeRefs.PaymentDataServicePostDataTypeRef, return: null },
	put: { data: sysTypeRefs.PaymentDataServicePutDataTypeRef, return: sysTypeRefs.PaymentDataServicePutReturnTypeRef },
	delete: null,
} as const)

export const PlanService = Object.freeze({
	app: "sys",
	name: "PlanService",
	get: { data: null, return: sysTypeRefs.PlanServiceGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const PriceService = Object.freeze({
	app: "sys",
	name: "PriceService",
	get: { data: sysTypeRefs.PriceServiceDataTypeRef, return: sysTypeRefs.PriceServiceReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const PublicKeyService = Object.freeze({
	app: "sys",
	name: "PublicKeyService",
	get: { data: sysTypeRefs.PublicKeyGetInTypeRef, return: sysTypeRefs.PublicKeyGetOutTypeRef },
	post: null,
	put: { data: sysTypeRefs.PublicKeyPutInTypeRef, return: null },
	delete: null,
} as const)

export const ReferralCodeService = Object.freeze({
	app: "sys",
	name: "ReferralCodeService",
	get: { data: sysTypeRefs.ReferralCodeGetInTypeRef, return: null },
	post: { data: sysTypeRefs.ReferralCodePostInTypeRef, return: sysTypeRefs.ReferralCodePostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const RegistrationCaptchaService = Object.freeze({
	app: "sys",
	name: "RegistrationCaptchaService",
	get: { data: sysTypeRefs.RegistrationCaptchaServiceGetDataTypeRef, return: sysTypeRefs.RegistrationCaptchaServiceReturnTypeRef },
	post: { data: sysTypeRefs.RegistrationCaptchaServiceDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const RegistrationService = Object.freeze({
	app: "sys",
	name: "RegistrationService",
	get: { data: null, return: sysTypeRefs.RegistrationServiceDataTypeRef },
	post: { data: sysTypeRefs.RegistrationServiceDataTypeRef, return: sysTypeRefs.RegistrationReturnTypeRef },
	put: null,
	delete: null,
} as const)

export const ResetFactorsService = Object.freeze({
	app: "sys",
	name: "ResetFactorsService",
	get: null,
	post: null,
	put: null,
	delete: { data: sysTypeRefs.ResetFactorsDeleteDataTypeRef, return: null },
} as const)

export const ResetPasswordService = Object.freeze({
	app: "sys",
	name: "ResetPasswordService",
	get: null,
	post: { data: sysTypeRefs.ResetPasswordPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const RolloutService = Object.freeze({
	app: "sys",
	name: "RolloutService",
	get: { data: null, return: sysTypeRefs.RolloutGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const SaltService = Object.freeze({
	app: "sys",
	name: "SaltService",
	get: { data: sysTypeRefs.SaltDataTypeRef, return: sysTypeRefs.SaltReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const SecondFactorAuthAllowedService = Object.freeze({
	app: "sys",
	name: "SecondFactorAuthAllowedService",
	get: { data: null, return: sysTypeRefs.SecondFactorAuthAllowedReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const SecondFactorAuthService = Object.freeze({
	app: "sys",
	name: "SecondFactorAuthService",
	get: { data: sysTypeRefs.SecondFactorAuthGetDataTypeRef, return: sysTypeRefs.SecondFactorAuthGetReturnTypeRef },
	post: { data: sysTypeRefs.SecondFactorAuthDataTypeRef, return: null },
	put: null,
	delete: { data: sysTypeRefs.SecondFactorAuthDeleteDataTypeRef, return: null },
} as const)

export const SessionService = Object.freeze({
	app: "sys",
	name: "SessionService",
	get: null,
	post: { data: sysTypeRefs.CreateSessionDataTypeRef, return: sysTypeRefs.CreateSessionReturnTypeRef },
	put: null,
	delete: null,
} as const)

export const SignOrderProcessingAgreementService = Object.freeze({
	app: "sys",
	name: "SignOrderProcessingAgreementService",
	get: null,
	post: { data: sysTypeRefs.SignOrderProcessingAgreementDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const SurveyService = Object.freeze({
	app: "sys",
	name: "SurveyService",
	get: null,
	post: { data: sysTypeRefs.SurveyDataPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const SwitchAccountTypeService = Object.freeze({
	app: "sys",
	name: "SwitchAccountTypeService",
	get: null,
	post: { data: sysTypeRefs.SwitchAccountTypePostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const SystemKeysService = Object.freeze({
	app: "sys",
	name: "SystemKeysService",
	get: { data: null, return: sysTypeRefs.SystemKeysReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const TakeOverDeletedAddressService = Object.freeze({
	app: "sys",
	name: "TakeOverDeletedAddressService",
	get: null,
	post: { data: sysTypeRefs.TakeOverDeletedAddressDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const TimelockCaptchaService = Object.freeze({
	app: "sys",
	name: "TimelockCaptchaService",
	get: { data: sysTypeRefs.TimelockCaptchaGetInTypeRef, return: sysTypeRefs.TimelockCaptchaGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const UpdatePermissionKeyService = Object.freeze({
	app: "sys",
	name: "UpdatePermissionKeyService",
	get: null,
	post: { data: sysTypeRefs.UpdatePermissionKeyDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const UpdateSessionKeysService = Object.freeze({
	app: "sys",
	name: "UpdateSessionKeysService",
	get: null,
	post: { data: sysTypeRefs.UpdateSessionKeysPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const UpgradePriceService = Object.freeze({
	app: "sys",
	name: "UpgradePriceService",
	get: { data: sysTypeRefs.UpgradePriceServiceDataTypeRef, return: sysTypeRefs.UpgradePriceServiceReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const UserGroupKeyRotationService = Object.freeze({
	app: "sys",
	name: "UserGroupKeyRotationService",
	get: null,
	post: { data: sysTypeRefs.UserGroupKeyRotationPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const UserService = Object.freeze({
	app: "sys",
	name: "UserService",
	get: null,
	post: null,
	put: null,
	delete: { data: sysTypeRefs.UserDataDeleteTypeRef, return: null },
} as const)

export const VerifierTokenService = Object.freeze({
	app: "sys",
	name: "VerifierTokenService",
	get: null,
	post: { data: sysTypeRefs.VerifierTokenServiceInTypeRef, return: sysTypeRefs.VerifierTokenServiceOutTypeRef },
	put: null,
	delete: null,
} as const)

export const VersionService = Object.freeze({
	app: "sys",
	name: "VersionService",
	get: { data: sysTypeRefs.VersionDataTypeRef, return: sysTypeRefs.VersionReturnTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)
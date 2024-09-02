import {AdminGroupKeyRotationPostInTypeRef} from "./TypeRefs.js"
import {AffiliatePartnerKpiServiceGetOutTypeRef} from "./TypeRefs.js"
import {AlarmServicePostTypeRef} from "./TypeRefs.js"
import {AutoLoginDataGetTypeRef} from "./TypeRefs.js"
import {AutoLoginDataReturnTypeRef} from "./TypeRefs.js"
import {AutoLoginPostReturnTypeRef} from "./TypeRefs.js"
import {AutoLoginDataDeleteTypeRef} from "./TypeRefs.js"
import {BrandingDomainGetReturnTypeRef} from "./TypeRefs.js"
import {BrandingDomainDataTypeRef} from "./TypeRefs.js"
import {BrandingDomainDeleteDataTypeRef} from "./TypeRefs.js"
import {ChangeKdfPostInTypeRef} from "./TypeRefs.js"
import {ChangePasswordPostInTypeRef} from "./TypeRefs.js"
import {CloseSessionServicePostTypeRef} from "./TypeRefs.js"
import {CreateCustomerServerPropertiesDataTypeRef} from "./TypeRefs.js"
import {CreateCustomerServerPropertiesReturnTypeRef} from "./TypeRefs.js"
import {CustomDomainCheckGetInTypeRef} from "./TypeRefs.js"
import {CustomDomainCheckGetOutTypeRef} from "./TypeRefs.js"
import {CustomDomainDataTypeRef} from "./TypeRefs.js"
import {CustomDomainReturnTypeRef} from "./TypeRefs.js"
import {CustomerAccountTerminationPostInTypeRef} from "./TypeRefs.js"
import {CustomerAccountTerminationPostOutTypeRef} from "./TypeRefs.js"
import {PublicKeyGetOutTypeRef} from "./TypeRefs.js"
import {DeleteCustomerDataTypeRef} from "./TypeRefs.js"
import {DebitServicePutDataTypeRef} from "./TypeRefs.js"
import {DomainMailAddressAvailabilityDataTypeRef} from "./TypeRefs.js"
import {DomainMailAddressAvailabilityReturnTypeRef} from "./TypeRefs.js"
import {ExternalPropertiesReturnTypeRef} from "./TypeRefs.js"
import {GiftCardRedeemDataTypeRef} from "./TypeRefs.js"
import {GiftCardRedeemGetReturnTypeRef} from "./TypeRefs.js"
import {GiftCardGetReturnTypeRef} from "./TypeRefs.js"
import {GiftCardCreateDataTypeRef} from "./TypeRefs.js"
import {GiftCardCreateReturnTypeRef} from "./TypeRefs.js"
import {GiftCardDeleteDataTypeRef} from "./TypeRefs.js"
import {GroupKeyRotationInfoGetOutTypeRef} from "./TypeRefs.js"
import {GroupKeyRotationPostInTypeRef} from "./TypeRefs.js"
import {InvoiceDataGetInTypeRef} from "./TypeRefs.js"
import {InvoiceDataGetOutTypeRef} from "./TypeRefs.js"
import {LocationServiceGetReturnTypeRef} from "./TypeRefs.js"
import {MailAddressAliasGetInTypeRef} from "./TypeRefs.js"
import {MailAddressAliasServiceReturnTypeRef} from "./TypeRefs.js"
import {MailAddressAliasServiceDataTypeRef} from "./TypeRefs.js"
import {MailAddressAliasServiceDataDeleteTypeRef} from "./TypeRefs.js"
import {MembershipAddDataTypeRef} from "./TypeRefs.js"
import {MembershipPutInTypeRef} from "./TypeRefs.js"
import {MembershipRemoveDataTypeRef} from "./TypeRefs.js"
import {MultipleMailAddressAvailabilityDataTypeRef} from "./TypeRefs.js"
import {MultipleMailAddressAvailabilityReturnTypeRef} from "./TypeRefs.js"
import {PaymentDataServiceGetDataTypeRef} from "./TypeRefs.js"
import {PaymentDataServiceGetReturnTypeRef} from "./TypeRefs.js"
import {PaymentDataServicePostDataTypeRef} from "./TypeRefs.js"
import {PaymentDataServicePutDataTypeRef} from "./TypeRefs.js"
import {PaymentDataServicePutReturnTypeRef} from "./TypeRefs.js"
import {PlanServiceGetOutTypeRef} from "./TypeRefs.js"
import {PriceServiceDataTypeRef} from "./TypeRefs.js"
import {PriceServiceReturnTypeRef} from "./TypeRefs.js"
import {PublicKeyGetInTypeRef} from "./TypeRefs.js"
import {PublicKeyPutInTypeRef} from "./TypeRefs.js"
import {ReferralCodeGetInTypeRef} from "./TypeRefs.js"
import {ReferralCodePostInTypeRef} from "./TypeRefs.js"
import {ReferralCodePostOutTypeRef} from "./TypeRefs.js"
import {RegistrationCaptchaServiceGetDataTypeRef} from "./TypeRefs.js"
import {RegistrationCaptchaServiceReturnTypeRef} from "./TypeRefs.js"
import {RegistrationCaptchaServiceDataTypeRef} from "./TypeRefs.js"
import {RegistrationServiceDataTypeRef} from "./TypeRefs.js"
import {RegistrationReturnTypeRef} from "./TypeRefs.js"
import {ResetFactorsDeleteDataTypeRef} from "./TypeRefs.js"
import {ResetPasswordPostInTypeRef} from "./TypeRefs.js"
import {SaltDataTypeRef} from "./TypeRefs.js"
import {SaltReturnTypeRef} from "./TypeRefs.js"
import {SecondFactorAuthAllowedReturnTypeRef} from "./TypeRefs.js"
import {SecondFactorAuthGetDataTypeRef} from "./TypeRefs.js"
import {SecondFactorAuthGetReturnTypeRef} from "./TypeRefs.js"
import {SecondFactorAuthDataTypeRef} from "./TypeRefs.js"
import {SecondFactorAuthDeleteDataTypeRef} from "./TypeRefs.js"
import {CreateSessionDataTypeRef} from "./TypeRefs.js"
import {CreateSessionReturnTypeRef} from "./TypeRefs.js"
import {SignOrderProcessingAgreementDataTypeRef} from "./TypeRefs.js"
import {SwitchAccountTypePostInTypeRef} from "./TypeRefs.js"
import {SystemKeysReturnTypeRef} from "./TypeRefs.js"
import {TakeOverDeletedAddressDataTypeRef} from "./TypeRefs.js"
import {UpdatePermissionKeyDataTypeRef} from "./TypeRefs.js"
import {UpdateSessionKeysPostInTypeRef} from "./TypeRefs.js"
import {UpgradePriceServiceDataTypeRef} from "./TypeRefs.js"
import {UpgradePriceServiceReturnTypeRef} from "./TypeRefs.js"
import {UserGroupKeyRotationPostInTypeRef} from "./TypeRefs.js"
import {UserDataDeleteTypeRef} from "./TypeRefs.js"
import {VersionDataTypeRef} from "./TypeRefs.js"
import {VersionReturnTypeRef} from "./TypeRefs.js"

export const AdminGroupKeyRotationService = Object.freeze({
	app: "sys",
	name: "AdminGroupKeyRotationService",
	get: null,
	post: {data: AdminGroupKeyRotationPostInTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const AffiliatePartnerKpiService = Object.freeze({
	app: "sys",
	name: "AffiliatePartnerKpiService",
	get: {data: null, return: AffiliatePartnerKpiServiceGetOutTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

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
	post: {data: ChangePasswordPostInTypeRef, return: null},
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

export const GroupKeyRotationInfoService = Object.freeze({
	app: "sys",
	name: "GroupKeyRotationInfoService",
	get: {data: null, return: GroupKeyRotationInfoGetOutTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const GroupKeyRotationService = Object.freeze({
	app: "sys",
	name: "GroupKeyRotationService",
	get: null,
	post: {data: GroupKeyRotationPostInTypeRef, return: null},
	put: null,
	delete: null,
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
	put: {data: MembershipPutInTypeRef, return: null},
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

export const PlanService = Object.freeze({
	app: "sys",
	name: "PlanService",
	get: {data: null, return: PlanServiceGetOutTypeRef},
	post: null,
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
	post: {data: ResetPasswordPostInTypeRef, return: null},
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

export const UserGroupKeyRotationService = Object.freeze({
	app: "sys",
	name: "UserGroupKeyRotationService",
	get: null,
	post: {data: UserGroupKeyRotationPostInTypeRef, return: null},
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
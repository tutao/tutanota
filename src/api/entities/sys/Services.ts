import {AlarmServicePostTypeRef} from "./AlarmServicePost.js"
import {AutoLoginDataGetTypeRef} from "./AutoLoginDataGet.js"
import {AutoLoginDataReturnTypeRef} from "./AutoLoginDataReturn.js"
import {AutoLoginPostReturnTypeRef} from "./AutoLoginPostReturn.js"
import {AutoLoginDataDeleteTypeRef} from "./AutoLoginDataDelete.js"
import {BookingServiceDataTypeRef} from "./BookingServiceData.js"
import {BrandingDomainGetReturnTypeRef} from "./BrandingDomainGetReturn.js"
import {BrandingDomainDataTypeRef} from "./BrandingDomainData.js"
import {BrandingDomainDeleteDataTypeRef} from "./BrandingDomainDeleteData.js"
import {ChangePasswordDataTypeRef} from "./ChangePasswordData.js"
import {CloseSessionServicePostTypeRef} from "./CloseSessionServicePost.js"
import {CreateCustomerServerPropertiesDataTypeRef} from "./CreateCustomerServerPropertiesData.js"
import {CreateCustomerServerPropertiesReturnTypeRef} from "./CreateCustomerServerPropertiesReturn.js"
import {CustomDomainCheckDataTypeRef} from "./CustomDomainCheckData.js"
import {CustomDomainCheckReturnTypeRef} from "./CustomDomainCheckReturn.js"
import {CustomDomainDataTypeRef} from "./CustomDomainData.js"
import {CustomDomainReturnTypeRef} from "./CustomDomainReturn.js"
import {CustomerInfoReturnTypeRef} from "./CustomerInfoReturn.js"
import {PublicKeyReturnTypeRef} from "./PublicKeyReturn.js"
import {CustomerDataTypeRef} from "./CustomerData.js"
import {CustomerReturnTypeRef} from "./CustomerReturn.js"
import {DeleteCustomerDataTypeRef} from "./DeleteCustomerData.js"
import {DebitServicePutDataTypeRef} from "./DebitServicePutData.js"
import {DomainMailAddressAvailabilityDataTypeRef} from "./DomainMailAddressAvailabilityData.js"
import {DomainMailAddressAvailabilityReturnTypeRef} from "./DomainMailAddressAvailabilityReturn.js"
import {ExternalPropertiesReturnTypeRef} from "./ExternalPropertiesReturn.js"
import {GiftCardRedeemDataTypeRef} from "./GiftCardRedeemData.js"
import {GiftCardRedeemGetReturnTypeRef} from "./GiftCardRedeemGetReturn.js"
import {GiftCardGetReturnTypeRef} from "./GiftCardGetReturn.js"
import {GiftCardCreateDataTypeRef} from "./GiftCardCreateData.js"
import {GiftCardCreateReturnTypeRef} from "./GiftCardCreateReturn.js"
import {GiftCardDeleteDataTypeRef} from "./GiftCardDeleteData.js"
import {LocationServiceGetReturnTypeRef} from "./LocationServiceGetReturn.js"
import {MailAddressAliasServiceReturnTypeRef} from "./MailAddressAliasServiceReturn.js"
import {MailAddressAliasServiceDataTypeRef} from "./MailAddressAliasServiceData.js"
import {MailAddressAliasServiceDataDeleteTypeRef} from "./MailAddressAliasServiceDataDelete.js"
import {MailAddressAvailabilityDataTypeRef} from "./MailAddressAvailabilityData.js"
import {MailAddressAvailabilityReturnTypeRef} from "./MailAddressAvailabilityReturn.js"
import {MembershipAddDataTypeRef} from "./MembershipAddData.js"
import {MembershipRemoveDataTypeRef} from "./MembershipRemoveData.js"
import {PaymentDataServiceGetDataTypeRef} from "./PaymentDataServiceGetData.js"
import {PaymentDataServiceGetReturnTypeRef} from "./PaymentDataServiceGetReturn.js"
import {PaymentDataServicePostDataTypeRef} from "./PaymentDataServicePostData.js"
import {PaymentDataServicePutDataTypeRef} from "./PaymentDataServicePutData.js"
import {PaymentDataServicePutReturnTypeRef} from "./PaymentDataServicePutReturn.js"
import {PdfInvoiceServiceDataTypeRef} from "./PdfInvoiceServiceData.js"
import {PdfInvoiceServiceReturnTypeRef} from "./PdfInvoiceServiceReturn.js"
import {PremiumFeatureDataTypeRef} from "./PremiumFeatureData.js"
import {PremiumFeatureReturnTypeRef} from "./PremiumFeatureReturn.js"
import {PriceServiceDataTypeRef} from "./PriceServiceData.js"
import {PriceServiceReturnTypeRef} from "./PriceServiceReturn.js"
import {PublicKeyDataTypeRef} from "./PublicKeyData.js"
import {RegistrationCaptchaServiceGetDataTypeRef} from "./RegistrationCaptchaServiceGetData.js"
import {RegistrationCaptchaServiceReturnTypeRef} from "./RegistrationCaptchaServiceReturn.js"
import {RegistrationCaptchaServiceDataTypeRef} from "./RegistrationCaptchaServiceData.js"
import {RegistrationServiceDataTypeRef} from "./RegistrationServiceData.js"
import {RegistrationReturnTypeRef} from "./RegistrationReturn.js"
import {ResetFactorsDeleteDataTypeRef} from "./ResetFactorsDeleteData.js"
import {ResetPasswordDataTypeRef} from "./ResetPasswordData.js"
import {SaltDataTypeRef} from "./SaltData.js"
import {SaltReturnTypeRef} from "./SaltReturn.js"
import {SecondFactorAuthAllowedReturnTypeRef} from "./SecondFactorAuthAllowedReturn.js"
import {SecondFactorAuthGetDataTypeRef} from "./SecondFactorAuthGetData.js"
import {SecondFactorAuthGetReturnTypeRef} from "./SecondFactorAuthGetReturn.js"
import {SecondFactorAuthDataTypeRef} from "./SecondFactorAuthData.js"
import {SecondFactorAuthDeleteDataTypeRef} from "./SecondFactorAuthDeleteData.js"
import {CreateSessionDataTypeRef} from "./CreateSessionData.js"
import {CreateSessionReturnTypeRef} from "./CreateSessionReturn.js"
import {SignOrderProcessingAgreementDataTypeRef} from "./SignOrderProcessingAgreementData.js"
import {SwitchAccountTypeDataTypeRef} from "./SwitchAccountTypeData.js"
import {SystemKeysReturnTypeRef} from "./SystemKeysReturn.js"
import {TakeOverDeletedAddressDataTypeRef} from "./TakeOverDeletedAddressData.js"
import {UpdateAdminshipDataTypeRef} from "./UpdateAdminshipData.js"
import {UpdatePermissionKeyDataTypeRef} from "./UpdatePermissionKeyData.js"
import {UpgradePriceServiceDataTypeRef} from "./UpgradePriceServiceData.js"
import {UpgradePriceServiceReturnTypeRef} from "./UpgradePriceServiceReturn.js"
import {UsageTestAssignmentInTypeRef} from "./UsageTestAssignmentIn.js"
import {UsageTestAssignmentOutTypeRef} from "./UsageTestAssignmentOut.js"
import {UsageTestParticipationInTypeRef} from "./UsageTestParticipationIn.js"
import {UserIdDataTypeRef} from "./UserIdData.js"
import {UserIdReturnTypeRef} from "./UserIdReturn.js"
import {UserDataTypeRef} from "./UserData.js"
import {UserReturnTypeRef} from "./UserReturn.js"
import {UserDataDeleteTypeRef} from "./UserDataDelete.js"
import {VersionDataTypeRef} from "./VersionData.js"
import {VersionReturnTypeRef} from "./VersionReturn.js"

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

export const BookingService = Object.freeze({
	app: "sys",
	name: "BookingService",
	get: null,
	post: {data: BookingServiceDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const BrandingDomainService = Object.freeze({
	app: "sys",
	name: "BrandingDomainService",
	get: {data: null, return: BrandingDomainGetReturnTypeRef},
	post: {data: BrandingDomainDataTypeRef, return: null},
	put: {data: BrandingDomainDataTypeRef, return: null},
	delete: {data: BrandingDomainDeleteDataTypeRef, return: null},
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
	get: {data: CustomDomainCheckDataTypeRef, return: CustomDomainCheckReturnTypeRef},
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

export const CustomerInfoService = Object.freeze({
	app: "sys",
	name: "CustomerInfoService",
	get: {data: null, return: CustomerInfoReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const CustomerPublicKeyService = Object.freeze({
	app: "sys",
	name: "CustomerPublicKeyService",
	get: {data: null, return: PublicKeyReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const CustomerService = Object.freeze({
	app: "sys",
	name: "CustomerService",
	get: null,
	post: {data: CustomerDataTypeRef, return: CustomerReturnTypeRef},
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
	get: {data: null, return: MailAddressAliasServiceReturnTypeRef},
	post: {data: MailAddressAliasServiceDataTypeRef, return: null},
	put: null,
	delete: {data: MailAddressAliasServiceDataDeleteTypeRef, return: null},
} as const)

export const MailAddressAvailabilityService = Object.freeze({
	app: "sys",
	name: "MailAddressAvailabilityService",
	get: {data: MailAddressAvailabilityDataTypeRef, return: MailAddressAvailabilityReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const MembershipService = Object.freeze({
	app: "sys",
	name: "MembershipService",
	get: null,
	post: {data: MembershipAddDataTypeRef, return: null},
	put: null,
	delete: {data: MembershipRemoveDataTypeRef, return: null},
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
	get: {data: PublicKeyDataTypeRef, return: PublicKeyReturnTypeRef},
	post: null,
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
	post: {data: SwitchAccountTypeDataTypeRef, return: null},
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

export const UpgradePriceService = Object.freeze({
	app: "sys",
	name: "UpgradePriceService",
	get: {data: UpgradePriceServiceDataTypeRef, return: UpgradePriceServiceReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const UsageTestAssignmentService = Object.freeze({
	app: "sys",
	name: "UsageTestAssignmentService",
	get: null,
	post: {data: UsageTestAssignmentInTypeRef, return: UsageTestAssignmentOutTypeRef},
	put: {data: UsageTestAssignmentInTypeRef, return: UsageTestAssignmentOutTypeRef},
	delete: null,
} as const)

export const UsageTestParticipationService = Object.freeze({
	app: "sys",
	name: "UsageTestParticipationService",
	get: null,
	post: {data: UsageTestParticipationInTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const UserIdService = Object.freeze({
	app: "sys",
	name: "UserIdService",
	get: {data: UserIdDataTypeRef, return: UserIdReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)

export const UserService = Object.freeze({
	app: "sys",
	name: "UserService",
	get: null,
	post: {data: UserDataTypeRef, return: UserReturnTypeRef},
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
import {
	AccountType,
	BookingItemFeatureType,
	Const,
	CounterType,
	CryptoProtocolVersion,
	FeatureType,
	GroupType,
	InvoiceData,
	PaymentData,
	SpamRuleFieldType,
	SpamRuleType,
} from "../../../common/TutanotaConstants.js"
import {
	AccountingInfo,
	AccountingInfoTypeRef,
	createBrandingDomainData,
	createBrandingDomainDeleteData,
	createCreateCustomerServerPropertiesData,
	createCustomDomainData,
	createEmailSenderListElement,
	createInvoiceDataGetIn,
	createPaymentDataServicePutData,
	CustomDomainReturn,
	CustomerInfoTypeRef,
	CustomerServerProperties,
	CustomerServerPropertiesTypeRef,
	CustomerTypeRef,
	EmailSenderListElement,
	PaymentDataServicePutReturn,
	User,
} from "../../../entities/sys/TypeRefs.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import type { Hex, lazyAsync, Nullable } from "@tutao/tutanota-utils"
import { assertNotNull, neverNull, noOp, ofClass, stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import {
	BrandingDomainService,
	CreateCustomerServerProperties,
	CustomDomainService,
	InvoiceDataService,
	PaymentDataService,
	SystemKeysService,
} from "../../../entities/sys/Services.js"
import type { UserManagementFacade } from "./UserManagementFacade.js"
import type { GroupManagementFacade } from "./GroupManagementFacade.js"
import { CounterFacade } from "./CounterFacade.js"
import type { Country } from "../../../common/CountryList.js"
import { getByAbbreviation } from "../../../common/CountryList.js"
import { LockedError } from "../../../common/error/RestError.js"
import type { RsaImplementation } from "../../crypto/RsaImplementation.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { DataFile } from "../../../common/DataFile.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { CustomerAccountService } from "../../../entities/tutanota/Services.js"
import { BookingFacade } from "./BookingFacade.js"
import { UserFacade } from "../UserFacade.js"
import { PaymentInterval } from "../../../../subscription/utils/PriceUtils.js"
import { ExposedOperationProgressTracker, OperationId } from "../../../main/OperationProgressTracker.js"
import { formatNameAndAddress } from "../../../common/utils/CommonFormatter.js"
import { PQFacade } from "../PQFacade.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { getWhitelabelDomainInfo } from "../../../common/utils/CustomerUtils.js"
import type { PdfWriter } from "../../pdf/PdfWriter.js"
import { createCustomerAccountCreateData } from "../../../entities/tutanota/TypeRefs.js"
import { KeyLoaderFacade, parseKeyVersion } from "../KeyLoaderFacade.js"
import { RecoverCodeFacade } from "./RecoverCodeFacade.js"
import { _encryptKeyWithVersionedKey, CryptoWrapper, VersionedEncryptedKey, VersionedKey } from "../../crypto/CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "../../crypto/AsymmetricCryptoFacade.js"
import { XRechnungInvoiceGenerator } from "../../invoicegen/XRechnungInvoiceGenerator.js"
import { PublicEncryptionKeyProvider } from "../PublicEncryptionKeyProvider"
import { isInternalUser } from "../../../common/utils/UserUtils"
import { CacheMode } from "../../rest/EntityRestClient"
import { SubscriptionApp } from "../../../../subscription/utils/SubscriptionUtils"
import { bitArrayToUint8Array, hexToRsaPublicKey, PQKeyPairs } from "@tutao/tutanota-crypto"

assertWorkerOrNode()

export class CustomerFacade {
	// they are FeatureType but we might not be aware of newer values for it, so it is not just FeatureType
	private customizations: NumberString[] | null = null

	constructor(
		private readonly userFacade: UserFacade,
		private readonly groupManagement: GroupManagementFacade,
		private readonly userManagement: UserManagementFacade,
		private readonly counters: CounterFacade,
		private readonly rsa: RsaImplementation,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly bookingFacade: BookingFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly operationProgressTracker: ExposedOperationProgressTracker,
		private readonly pdfWriter: lazyAsync<PdfWriter>,
		private readonly pqFacade: PQFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly recoverCodeFacade: RecoverCodeFacade,
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
		private readonly publicEncryptionKeyProvider: PublicEncryptionKeyProvider,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async getDomainValidationRecord(domainName: string): Promise<string> {
		const customer = this.getCustomerId()
		const baseString = domainName.trim().toLowerCase() + customer
		const hash = this.cryptoWrapper.sha256Hash(stringToUtf8Uint8Array(baseString)).slice(0, 16)
		return "t-verify=" + uint8ArrayToHex(hash)
	}

	addDomain(domainName: string): Promise<CustomDomainReturn> {
		const data = createCustomDomainData({
			domain: domainName.trim().toLowerCase(),
			catchAllMailGroup: null,
		})
		return this.serviceExecutor.post(CustomDomainService, data)
	}

	async removeDomain(domainName: string): Promise<void> {
		const data = createCustomDomainData({
			domain: domainName.trim().toLowerCase(),
			catchAllMailGroup: null,
		})
		await this.serviceExecutor.delete(CustomDomainService, data)
	}

	async setCatchAllGroup(domainName: string, mailGroupId: Id | null): Promise<void> {
		const data = createCustomDomainData({
			domain: domainName.trim().toLowerCase(),
			catchAllMailGroup: mailGroupId,
		})
		await this.serviceExecutor.put(CustomDomainService, data)
	}

	async orderWhitelabelCertificate(domainName: string): Promise<void> {
		const customerId = this.getCustomerId()
		const customer = await this.entityClient.load(CustomerTypeRef, customerId)
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		let existingBrandingDomain = getWhitelabelDomainInfo(customerInfo, domainName)
		let sessionKey = this.cryptoWrapper.aes256RandomKey()

		const keyData = await this.serviceExecutor.get(SystemKeysService, null)
		const systemAdminPubKeys = this.publicEncryptionKeyProvider.convertFromSystemKeysReturn(keyData)
		const { pubEncSymKeyBytes, cryptoProtocolVersion } = await this.asymmetricCryptoFacade.asymEncryptSymKey(
			sessionKey,
			systemAdminPubKeys,
			this.userFacade.getUserGroupId(),
		)
		const data = createBrandingDomainData({
			domain: domainName,
			systemAdminPubEncSessionKey: pubEncSymKeyBytes,
			systemAdminPubKeyVersion: String(systemAdminPubKeys.version),
			systemAdminPublicProtocolVersion: cryptoProtocolVersion,
			sessionEncPemPrivateKey: null,
			sessionEncPemCertificateChain: null,
		})
		if (existingBrandingDomain) {
			await this.serviceExecutor.put(BrandingDomainService, data)
		} else {
			await this.serviceExecutor.post(BrandingDomainService, data)
		}
	}

	private getCustomerId() {
		return assertNotNull(this.userFacade.getLoggedInUser().customer)
	}

	async deleteCertificate(domainName: string): Promise<void> {
		const data = createBrandingDomainDeleteData({
			domain: domainName,
		})
		await this.serviceExecutor.delete(BrandingDomainService, data)
	}

	/**
	 * Reads the used storage of a customer in bytes.
	 * @return The amount of used storage in byte.
	 */
	async readUsedCustomerStorage(customerId: Id): Promise<number> {
		const customerCounters = await this.counters.readAllCustomerCounterValues(CounterType.UserStorageLegacy, customerId)
		return customerCounters.reduce((sum, counterValue) => sum + Number(counterValue.value), 0)
	}

	/**
	 * Reads the available storage capacity of a customer in bytes.
	 * @return The amount of available storage capacity in byte.
	 */
	readAvailableCustomerStorage(customerId: Id): Promise<number> {
		return this.entityClient.load(CustomerTypeRef, customerId).then((customer) => {
			return this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then((customerInfo) => {
				let includedStorage = Number(customerInfo.includedStorageCapacity)
				let promotionStorage = Number(customerInfo.promotionStorageCapacity)
				let availableStorage = Math.max(includedStorage, promotionStorage)
				let bookedStorage = 0

				if (customer.type === AccountType.PAID) {
					return this.bookingFacade.getCurrentPrice().then((price) => {
						let currentStorageItem = this.bookingFacade.getPriceItem(price.currentPriceNextPeriod, BookingItemFeatureType.Storage)

						if (currentStorageItem != null) {
							bookedStorage = Number(currentStorageItem.count)
						}

						availableStorage = Math.max(bookedStorage, availableStorage)
						return availableStorage * Const.MEMORY_GB_FACTOR
					})
				} else {
					return availableStorage * Const.MEMORY_GB_FACTOR
				}
			})
		})
	}

	async loadCustomerServerProperties(): Promise<CustomerServerProperties> {
		const customer = await this.entityClient.load(CustomerTypeRef, this.getCustomerId())
		let cspId
		if (customer.serverProperties) {
			cspId = customer.serverProperties
		} else {
			// create properties
			const sessionKey = this.cryptoWrapper.aes256RandomKey()
			const adminGroupId = this.userFacade.getGroupId(GroupType.Admin)
			const adminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)

			const adminGroupEncSessionKey = _encryptKeyWithVersionedKey(adminGroupKey, sessionKey)
			const data = createCreateCustomerServerPropertiesData({
				adminGroupEncSessionKey: adminGroupEncSessionKey.key,
				adminGroupKeyVersion: adminGroupEncSessionKey.encryptingKeyVersion.toString(),
			})
			const returnData = await this.serviceExecutor.post(CreateCustomerServerProperties, data)
			cspId = returnData.id
		}
		return this.entityClient.load(CustomerServerPropertiesTypeRef, cspId)
	}

	addSpamRule(field: SpamRuleFieldType, type: SpamRuleType, value: string): Promise<void> {
		return this.loadCustomerServerProperties().then((props) => {
			value = value.toLowerCase().trim()
			let newListEntry = createEmailSenderListElement({
				value,
				hashedValue: uint8ArrayToBase64(this.cryptoWrapper.sha256Hash(stringToUtf8Uint8Array(value))),
				type,
				field,
			})
			props.emailSenderList.push(newListEntry)
			return this.entityClient.update(props).catch(ofClass(LockedError, noOp))
		})
	}

	editSpamRule(spamRule: EmailSenderListElement): Promise<void> {
		return this.loadCustomerServerProperties().then((props) => {
			spamRule.value = spamRule.value.toLowerCase().trim()
			const index = props.emailSenderList.findIndex((item) => spamRule._id === item._id)

			if (index === -1) {
				throw new Error("spam rule does not exist " + JSON.stringify(spamRule))
			}

			props.emailSenderList[index] = spamRule
			return this.entityClient.update(props).catch(ofClass(LockedError, noOp))
		})
	}

	async generateSignupKeys(operationId: OperationId): Promise<[PQKeyPairs, PQKeyPairs, PQKeyPairs]> {
		const key1 = await this.pqFacade.generateKeyPairs()
		await this.operationProgressTracker.onProgress(operationId, 33)
		const key2 = await this.pqFacade.generateKeyPairs()
		await this.operationProgressTracker.onProgress(operationId, 66)
		const key3 = await this.pqFacade.generateKeyPairs()
		await this.operationProgressTracker.onProgress(operationId, 100)
		return [key1, key2, key3]
	}

	async signup(
		keyPairs: [PQKeyPairs, PQKeyPairs, PQKeyPairs],
		authToken: string,
		mailAddress: string,
		password: string,
		registrationCode: string,
		currentLanguage: string,
		app: SubscriptionApp,
	): Promise<Hex> {
		const userGroupKey: VersionedKey = { object: this.cryptoWrapper.aes256RandomKey(), version: 0 }
		const adminGroupKey: VersionedKey = { object: this.cryptoWrapper.aes256RandomKey(), version: 0 }
		const customerGroupKey: VersionedKey = { object: this.cryptoWrapper.aes256RandomKey(), version: 0 }
		const userGroupInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const adminGroupInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const customerGroupInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const accountingInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const customerServerPropertiesSessionKey = this.cryptoWrapper.aes256RandomKey()

		const keyData = await this.serviceExecutor.get(SystemKeysService, null)
		const pubRsaKey = keyData.systemAdminPubRsaKey
		let systemAdminPubEncAccountingInfoSessionKey: VersionedEncryptedKey
		let systemAdminPublicProtocolVersion: CryptoProtocolVersion

		if (pubRsaKey) {
			const rsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(pubRsaKey))
			const systemAdminPubEncAccountingInfoSessionKeyBytes = await this.rsa.encrypt(rsaPublicKey, bitArrayToUint8Array(accountingInfoSessionKey))
			systemAdminPubEncAccountingInfoSessionKey = {
				key: systemAdminPubEncAccountingInfoSessionKeyBytes,
				encryptingKeyVersion: parseKeyVersion(keyData.systemAdminPubKeyVersion),
			}
			systemAdminPublicProtocolVersion = CryptoProtocolVersion.RSA
		} else {
			// we need to release tuta-crypt by default first before we can encrypt keys for the system admin with PQ public keys.
			throw new ProgrammingError("system admin having pq key pair is not supported")
		}

		const userGroupData = this.groupManagement.generateInternalGroupData(
			keyPairs[0],
			userGroupKey.object,
			userGroupInfoSessionKey,
			null,
			adminGroupKey,
			customerGroupKey,
		)

		const adminGroupData = this.groupManagement.generateInternalGroupData(
			keyPairs[1],
			adminGroupKey.object,
			adminGroupInfoSessionKey,
			null,
			adminGroupKey,
			customerGroupKey,
		)

		const customerGroupData = this.groupManagement.generateInternalGroupData(
			keyPairs[2],
			customerGroupKey.object,
			customerGroupInfoSessionKey,
			null,
			adminGroupKey,
			customerGroupKey,
		)

		const recoverData = this.recoverCodeFacade.generateRecoveryCode(userGroupKey)

		const userEncAdminGroupKey = _encryptKeyWithVersionedKey(userGroupKey, adminGroupKey.object)
		const adminEncAccountingInfoSessionKey = _encryptKeyWithVersionedKey(adminGroupKey, accountingInfoSessionKey)
		const adminEncCustomerServerPropertiesSessionKey = _encryptKeyWithVersionedKey(adminGroupKey, customerServerPropertiesSessionKey)

		const data = createCustomerAccountCreateData({
			authToken,
			date: Const.CURRENT_DATE,
			lang: currentLanguage,
			code: registrationCode,
			userData: await this.userManagement.generateUserAccountData(
				userGroupKey,
				userGroupInfoSessionKey,
				customerGroupKey,
				mailAddress,
				password,
				"",
				recoverData,
			),
			userEncAdminGroupKey: userEncAdminGroupKey.key,
			userGroupData,
			adminGroupData,
			customerGroupData,
			adminEncAccountingInfoSessionKey: adminEncAccountingInfoSessionKey.key,
			systemAdminPubEncAccountingInfoSessionKey: systemAdminPubEncAccountingInfoSessionKey.key,
			systemAdminPubKeyVersion: String(systemAdminPubEncAccountingInfoSessionKey.encryptingKeyVersion),
			systemAdminPublicProtocolVersion,
			adminEncCustomerServerPropertiesSessionKey: adminEncCustomerServerPropertiesSessionKey.key,
			userEncAccountGroupKey: new Uint8Array(0), // if we some day start passing the right key here, we'll also need to pass the right version
			accountGroupKeyVersion: "0",
			app,
		})
		await this.serviceExecutor.post(CustomerAccountService, data)

		return recoverData.hexCode
	}

	async updatePaymentData(
		paymentInterval: PaymentInterval,
		invoiceData: InvoiceData,
		paymentData: PaymentData | null,
		confirmedInvoiceCountry: Country | null,
	): Promise<PaymentDataServicePutReturn> {
		let customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(this.userFacade.getLoggedInUser().customer))
		let customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		let accountingInfo = await this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
		let accountingInfoSessionKey = await this.cryptoFacade.resolveSessionKey(accountingInfo)
		const service = createPaymentDataServicePutData({
			paymentInterval: paymentInterval.toString(),
			invoiceName: "",
			invoiceAddress: invoiceData.invoiceAddress,
			invoiceCountry: invoiceData.country ? invoiceData.country.a : "",
			invoiceVatIdNo: invoiceData.vatNumber ? invoiceData.vatNumber : "",
			paymentMethod: paymentData ? paymentData.paymentMethod : accountingInfo.paymentMethod ? accountingInfo.paymentMethod : "",
			paymentMethodInfo: null,
			paymentToken: null,
			creditCard: paymentData && paymentData.creditCardData ? paymentData.creditCardData : null,
			confirmedCountry: confirmedInvoiceCountry ? confirmedInvoiceCountry.a : null,
		})
		return this.serviceExecutor.put(PaymentDataService, service, { sessionKey: accountingInfoSessionKey ?? undefined })
	}

	/**
	 * Convenience function to change the payment interval for the current subscription
	 * @param accountingInfo accounting info
	 * @param newPaymentInterval new payment interval
	 */
	async changePaymentInterval(accountingInfo: AccountingInfo, newPaymentInterval: PaymentInterval): Promise<PaymentDataServicePutReturn> {
		const invoiceCountry = neverNull(getByAbbreviation(neverNull(accountingInfo.invoiceCountry)))

		return this.updatePaymentData(
			newPaymentInterval,
			{
				invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
				country: invoiceCountry,
				vatNumber: accountingInfo.invoiceVatIdNo,
			},
			null,
			invoiceCountry,
		)
	}

	async generatePdfInvoice(invoiceNumber: string): Promise<DataFile> {
		const invoiceData = await this.serviceExecutor.get(InvoiceDataService, createInvoiceDataGetIn({ invoiceNumber }))
		const writer = await this.pdfWriter()
		const { PdfInvoiceGenerator } = await import("../../invoicegen/PdfInvoiceGenerator.js")
		const pdfGenerator = new PdfInvoiceGenerator(writer, invoiceData, invoiceNumber, this.getCustomerId())
		const pdfFile = await pdfGenerator.generate()
		return {
			_type: "DataFile",
			name: String(invoiceNumber) + ".pdf",
			mimeType: "application/pdf",
			data: pdfFile,
			size: pdfFile.byteLength,
			id: undefined,
		}
	}

	async generatePdfRecoveryDocument(recoveryCode: string): Promise<DataFile> {
		const writer = await this.pdfWriter()
		const { PdfRecoveryDocumentGenerator } = await import("../../recoveryDocumentGenerator/RecoveryDocumentGenerator.js")
		const pdfGenerator = new PdfRecoveryDocumentGenerator(writer, recoveryCode)
		const pdfFile = await pdfGenerator.generate()
		return {
			_type: "DataFile",
			name: "MyCoolRecoveryCode.pdf",
			mimeType: "application/pdf",
			data: pdfFile,
			size: pdfFile.byteLength,
			id: undefined,
		}
	}

	async generateXRechnungInvoice(invoiceNumber: string): Promise<DataFile> {
		const customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(this.userFacade.getUser()?.customer))
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		const invoiceData = await this.serviceExecutor.get(InvoiceDataService, createInvoiceDataGetIn({ invoiceNumber }))
		const { XRechnungInvoiceGenerator } = await import("../../invoicegen/XRechnungInvoiceGenerator.js")
		const xRechnungGenerator = new XRechnungInvoiceGenerator(invoiceData, invoiceNumber, this.getCustomerId(), customerInfo.registrationMailAddress)
		const xRechnungFile = xRechnungGenerator.generate()
		return {
			_type: "DataFile",
			name: String(invoiceNumber) + ".xml",
			mimeType: "application/xml",
			data: xRechnungFile,
			size: xRechnungFile.byteLength,
			id: undefined,
		}
	}

	async loadAccountingInfo(): Promise<AccountingInfo> {
		const customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(this.userFacade.getUser()?.customer))
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		return this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
	}

	// This also exists in LoginController. Look at the comment in LoginController for an explanation.
	async isEnabled(feature: FeatureType): Promise<boolean> {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false
	}

	async loadCustomizations(cacheMode: CacheMode = CacheMode.ReadAndWrite): Promise<string[] | null> {
		if (this.customizations) {
			return this.customizations
		} else {
			const user = this.userFacade.getLoggedInUser()
			if (isInternalUser(user)) {
				const customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(user.customer), { cacheMode })
				this.customizations = customer.customizations.map((f) => f.feature)
				return this.customizations
			} else {
				return null
			}
		}
	}

	async getUser(): Promise<Nullable<User>> {
		return this.userFacade.getUser()
	}
}

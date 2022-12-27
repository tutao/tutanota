import type { InvoiceData, PaymentData, SpamRuleFieldType, SpamRuleType } from "../../common/TutanotaConstants"
import { AccountType, BookingItemFeatureType, Const, GroupType } from "../../common/TutanotaConstants"
import type {
	AccountingInfo,
	CustomDomainReturn,
	CustomerServerProperties,
	EmailSenderListElement,
	PaymentDataServicePutReturn,
} from "../../entities/sys/TypeRefs.js"
import {
	AccountingInfoTypeRef,
	createBrandingDomainData,
	createBrandingDomainDeleteData,
	createCreateCustomerServerPropertiesData,
	createCustomDomainData,
	createEmailSenderListElement,
	createMembershipAddData,
	createMembershipRemoveData,
	createPaymentDataServicePutData,
	createPdfInvoiceServiceData,
	CustomerInfoTypeRef,
	CustomerServerPropertiesTypeRef,
	CustomerTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { assertWorkerOrNode } from "../../common/Env"
import type { Hex } from "@tutao/tutanota-utils"
import { assertNotNull, downcast, neverNull, noOp, ofClass, stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { getWhitelabelDomain } from "../../common/utils/Utils"
import { CryptoFacade } from "../crypto/CryptoFacade"
import {
	BrandingDomainService,
	CreateCustomerServerProperties,
	CustomDomainService,
	MembershipService,
	PaymentDataService,
	PdfInvoiceService,
	SystemKeysService,
} from "../../entities/sys/Services.js"
import type { ContactFormAccountReturn, InternalGroupData } from "../../entities/tutanota/TypeRefs.js"
import { createContactFormAccountData, createCustomerAccountCreateData } from "../../entities/tutanota/TypeRefs.js"
import type { UserManagementFacade } from "./UserManagementFacade"
import type { GroupManagementFacade } from "./GroupManagementFacade"
import type { WorkerImpl } from "../WorkerImpl"
import { CounterFacade } from "./CounterFacade"
import type { Country } from "../../common/CountryList"
import { LockedError } from "../../common/error/RestError"
import type { RsaKeyPair } from "@tutao/tutanota-crypto"
import { aes128RandomKey, bitArrayToUint8Array, encryptKey, hexToPublicKey, sha256Hash, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import type { RsaImplementation } from "../crypto/RsaImplementation"
import { EntityClient } from "../../common/EntityClient"
import { DataFile } from "../../common/DataFile"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { ContactFormAccountService, CustomerAccountService } from "../../entities/tutanota/Services"
import { BookingFacade } from "./BookingFacade"
import { UserFacade } from "./UserFacade"
import { PaymentInterval } from "../../../subscription/PriceUtils.js"

assertWorkerOrNode()

interface ContactFormUserGroupData {
	userGroupKey: Aes128Key
	userGroupData: InternalGroupData
}

export class CustomerFacade {
	private contactFormUserGroupData: Promise<ContactFormUserGroupData> | null

	constructor(
		private readonly worker: WorkerImpl,
		private readonly userFacade: UserFacade,
		private readonly groupManagement: GroupManagementFacade,
		private readonly userManagement: UserManagementFacade,
		private readonly counters: CounterFacade,
		private readonly rsa: RsaImplementation,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly bookingFacade: BookingFacade,
		private readonly cryptoFacade: CryptoFacade,
	) {
		this.contactFormUserGroupData = null
	}

	async getDomainValidationRecord(domainName: string): Promise<string> {
		const customer = this.getCustomerId()
		const baseString = domainName.trim().toLowerCase() + customer
		const hash = sha256Hash(stringToUtf8Uint8Array(baseString)).slice(0, 16)
		return "t-verify=" + uint8ArrayToHex(hash)
	}

	addDomain(domainName: string): Promise<CustomDomainReturn> {
		const data = createCustomDomainData({
			domain: domainName.trim().toLowerCase(),
		})
		return this.serviceExecutor.post(CustomDomainService, data)
	}

	async removeDomain(domainName: string): Promise<void> {
		const data = createCustomDomainData({
			domain: domainName.trim().toLowerCase(),
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
		let existingBrandingDomain = getWhitelabelDomain(customerInfo, domainName)
		const keyData = await this.serviceExecutor.get(SystemKeysService, null)
		let systemAdminPubKey = hexToPublicKey(uint8ArrayToHex(keyData.systemAdminPubKey))
		let sessionKey = aes128RandomKey()
		const systemAdminPubEncAccountingInfoSessionKey = await this.rsa.encrypt(systemAdminPubKey, bitArrayToUint8Array(sessionKey))

		const data = createBrandingDomainData({
			domain: domainName,
			systemAdminPubEncSessionKey: systemAdminPubEncAccountingInfoSessionKey,
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
	readUsedCustomerStorage(customerId: Id): Promise<number> {
		return this.counters.readCounterValue(Const.COUNTER_USED_MEMORY_INTERNAL, customerId).then((usedMemoryInternal) => {
			return this.counters.readCounterValue(Const.COUNTER_USED_MEMORY_EXTERNAL, customerId).then((usedMemoryExternal) => {
				return Number(usedMemoryInternal) + Number(usedMemoryExternal)
			})
		})
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

				if (customer.type === AccountType.PREMIUM) {
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
			const sessionKey = aes128RandomKey()
			const adminGroupKey = this.userFacade.getGroupKey(this.userFacade.getGroupId(GroupType.Admin))

			const groupEncSessionKey = encryptKey(adminGroupKey, sessionKey)
			const data = createCreateCustomerServerPropertiesData({
				adminGroupEncSessionKey: groupEncSessionKey,
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
				hashedValue: uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(value))),
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

	async generateSignupKeys(): Promise<[RsaKeyPair, RsaKeyPair, RsaKeyPair]> {
		const key1 = await this.rsa.generateKey()
		await this.worker.sendProgress(33)
		const key2 = await this.rsa.generateKey()
		await this.worker.sendProgress(66)
		const key3 = await this.rsa.generateKey()
		await this.worker.sendProgress(100)
		return [key1, key2, key3]
	}

	async signup(
		keyPairs: [RsaKeyPair, RsaKeyPair, RsaKeyPair],
		accountType: AccountType,
		authToken: string,
		mailAddress: string,
		password: string,
		registrationCode: string,
		currentLanguage: string,
	): Promise<Hex> {
		const keyData = await this.serviceExecutor.get(SystemKeysService, null)
		const systemAdminPubKey = hexToPublicKey(uint8ArrayToHex(keyData.systemAdminPubKey))
		const userGroupKey = aes128RandomKey()
		const adminGroupKey = aes128RandomKey()
		const customerGroupKey = aes128RandomKey()
		const userGroupInfoSessionKey = aes128RandomKey()
		const adminGroupInfoSessionKey = aes128RandomKey()
		const customerGroupInfoSessionKey = aes128RandomKey()
		const accountingInfoSessionKey = aes128RandomKey()
		const customerServerPropertiesSessionKey = aes128RandomKey()
		const systemAdminPubEncAccountingInfoSessionKey = await this.rsa.encrypt(systemAdminPubKey, bitArrayToUint8Array(accountingInfoSessionKey))
		const userGroupData = this.groupManagement.generateInternalGroupData(
			keyPairs[0],
			userGroupKey,
			userGroupInfoSessionKey,
			null,
			adminGroupKey,
			customerGroupKey,
		)

		const adminGroupData = this.groupManagement.generateInternalGroupData(
			keyPairs[1],
			adminGroupKey,
			adminGroupInfoSessionKey,
			null,
			adminGroupKey,
			customerGroupKey,
		)

		const customerGroupData = this.groupManagement.generateInternalGroupData(
			keyPairs[2],
			customerGroupKey,
			customerGroupInfoSessionKey,
			null,
			adminGroupKey,
			customerGroupKey,
		)

		const recoverData = this.userManagement.generateRecoveryCode(userGroupKey)

		const data = createCustomerAccountCreateData({
			authToken,
			date: Const.CURRENT_DATE,
			lang: currentLanguage,
			code: registrationCode,
			userData: this.userManagement.generateUserAccountData(
				userGroupKey,
				userGroupInfoSessionKey,
				customerGroupKey,
				mailAddress,
				password,
				"",
				recoverData,
			),
			userEncAdminGroupKey: encryptKey(userGroupKey, adminGroupKey),
			userGroupData,
			adminGroupData,
			customerGroupData,
			adminEncAccountingInfoSessionKey: encryptKey(adminGroupKey, accountingInfoSessionKey),
			systemAdminPubEncAccountingInfoSessionKey,
			adminEncCustomerServerPropertiesSessionKey: encryptKey(adminGroupKey, customerServerPropertiesSessionKey),
		})
		await this.serviceExecutor.post(CustomerAccountService, data)
		return recoverData.hexCode
	}

	createContactFormUserGroupData(): Promise<void> {
		let userGroupKey = aes128RandomKey()
		let userGroupInfoSessionKey = aes128RandomKey()
		this.contactFormUserGroupData = this.rsa
			.generateKey()
			.then((keyPair) => this.groupManagement.generateInternalGroupData(keyPair, userGroupKey, userGroupInfoSessionKey, null, userGroupKey, userGroupKey))
			.then((userGroupData) => {
				return {
					userGroupKey,
					userGroupData,
				}
			})
		return Promise.resolve()
	}

	private async getContactFormUserGroupData(): Promise<ContactFormUserGroupData> {
		if (this.contactFormUserGroupData) {
			return this.contactFormUserGroupData
		} else {
			await this.createContactFormUserGroupData()
			return downcast(this.contactFormUserGroupData)
		}
	}

	/**
	 * @pre CustomerFacade#createContactFormUserGroupData has been invoked before
	 */
	async createContactFormUser(password: string, contactFormId: IdTuple): Promise<ContactFormAccountReturn> {
		const contactFormUserGroupData = await this.getContactFormUserGroupData()
		let { userGroupKey, userGroupData } = contactFormUserGroupData
		await this.worker.sendProgress(35)
		let data = createContactFormAccountData()
		data.userData = this.userManagement.generateContactFormUserAccountData(userGroupKey, password)
		await this.worker.sendProgress(95)
		data.userGroupData = userGroupData
		data.contactForm = contactFormId
		const result = this.serviceExecutor.post(ContactFormAccountService, data)
		this.contactFormUserGroupData = null
		return result
	}

	async switchFreeToPremiumGroup(): Promise<void> {
		try {
			const keyData = await this.serviceExecutor.get(SystemKeysService, null)
			const membershipAddData = createMembershipAddData({
				user: this.userFacade.getLoggedInUser()._id,
				group: neverNull(keyData.premiumGroup),
				symEncGKey: encryptKey(this.userFacade.getUserGroupKey(), uint8ArrayToBitArray(keyData.premiumGroupKey)),
			})
			await this.serviceExecutor.post(MembershipService, membershipAddData)
			const membershipRemoveData = createMembershipRemoveData({
				user: this.userFacade.getLoggedInUser()._id,
				group: neverNull(keyData.freeGroup),
			})
			await this.serviceExecutor.delete(MembershipService, membershipRemoveData)
		} catch (e) {
			e.message = e.message + " error switching free to premium group"
			console.log(e)
			throw e
		}
	}

	async switchPremiumToFreeGroup(): Promise<void> {
		try {
			const keyData = await this.serviceExecutor.get(SystemKeysService, null)
			const membershipAddData = createMembershipAddData({
				user: this.userFacade.getLoggedInUser()._id,
				group: neverNull(keyData.freeGroup),
				symEncGKey: encryptKey(this.userFacade.getUserGroupKey(), uint8ArrayToBitArray(keyData.freeGroupKey)),
			})
			await this.serviceExecutor.post(MembershipService, membershipAddData)
			const membershipRemoveData = createMembershipRemoveData({
				user: this.userFacade.getLoggedInUser()._id,
				group: neverNull(keyData.premiumGroup),
			})
			await this.serviceExecutor.delete(MembershipService, membershipRemoveData)
		} catch (e) {
			e.message = e.message + " error switching premium to free group"
			console.log(e)
			throw e
		}
	}

	updatePaymentData(
		paymentInterval: PaymentInterval,
		invoiceData: InvoiceData,
		paymentData: PaymentData | null,
		confirmedInvoiceCountry: Country | null,
	): Promise<PaymentDataServicePutReturn> {
		return this.entityClient.load(CustomerTypeRef, assertNotNull(this.userFacade.getLoggedInUser().customer)).then((customer) => {
			return this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then((customerInfo) => {
				return this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(async (accountingInfo) => {
					return this.cryptoFacade.resolveSessionKeyForInstance(accountingInfo).then((accountingInfoSessionKey) => {
						const service = createPaymentDataServicePutData()
						service.business = false // not used, must be set to false currently, will be removed later

						service.paymentInterval = paymentInterval.toString()
						service.invoiceName = ""
						service.invoiceAddress = invoiceData.invoiceAddress
						service.invoiceCountry = invoiceData.country ? invoiceData.country.a : ""
						service.invoiceVatIdNo = invoiceData.vatNumber ? invoiceData.vatNumber : ""
						service.paymentMethod = paymentData ? paymentData.paymentMethod : accountingInfo.paymentMethod ? accountingInfo.paymentMethod : ""
						service.paymentMethodInfo = null
						service.paymentToken = null

						if (paymentData && paymentData.creditCardData) {
							service.creditCard = paymentData.creditCardData
						}

						service.confirmedCountry = confirmedInvoiceCountry ? confirmedInvoiceCountry.a : null
						return this.serviceExecutor.put(PaymentDataService, service, { sessionKey: accountingInfoSessionKey ?? undefined })
					})
				})
			})
		})
	}

	async downloadInvoice(invoiceNumber: string): Promise<DataFile> {
		const data = createPdfInvoiceServiceData({
			invoiceNumber,
		})
		return this.serviceExecutor.get(PdfInvoiceService, data).then((returnData) => {
			return {
				_type: "DataFile",
				name: String(invoiceNumber) + ".pdf",
				mimeType: "application/pdf",
				data: returnData.data,
				size: returnData.data.byteLength,
				id: undefined,
			}
		})
	}

	async loadAccountingInfo(): Promise<AccountingInfo> {
		const customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(this.userFacade.getUser()?.customer))
		const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		return this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
	}
}

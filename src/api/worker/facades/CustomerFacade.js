// @flow
import {load, serviceRequest, serviceRequestVoid, update} from "../EntityWorker"
import type {AccountTypeEnum, SpamRuleFieldTypeEnum, SpamRuleTypeEnum} from "../../common/TutanotaConstants"
import {AccountType, BookingItemFeatureType, Const, GroupType} from "../../common/TutanotaConstants"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {CustomerInfoTypeRef} from "../../entities/sys/CustomerInfo"
import {bookingFacade} from "./BookingFacade"
import {assertWorkerOrNode} from "../../common/Env"
import {HttpMethod} from "../../common/EntityFunctions"
import type {EmailSenderListElement} from "../../entities/sys/EmailSenderListElement"
import {createEmailSenderListElement} from "../../entities/sys/EmailSenderListElement"
import {stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToHex} from "../../common/utils/Encoding"
import {hash} from "../crypto/Sha256"
import type {CustomerServerProperties} from "../../entities/sys/CustomerServerProperties"
import {CustomerServerPropertiesTypeRef} from "../../entities/sys/CustomerServerProperties"
import {downcast, getWhitelabelDomain, neverNull, noOp} from "../../common/utils/Utils"
import {aes128RandomKey} from "../crypto/Aes"
import {encryptKey, encryptString, resolveSessionKey} from "../crypto/CryptoFacade"
import {createCreateCustomerServerPropertiesData} from "../../entities/sys/CreateCustomerServerPropertiesData"
import {CreateCustomerServerPropertiesReturnTypeRef} from "../../entities/sys/CreateCustomerServerPropertiesReturn"
import {bitArrayToUint8Array, uint8ArrayToBitArray} from "../crypto/CryptoUtils"
import {generateRsaKey, hexToPublicKey, rsaEncrypt} from "../crypto/Rsa"
import {SysService} from "../../entities/sys/Services"
import type {SystemKeysReturn} from "../../entities/sys/SystemKeysReturn"
import {SystemKeysReturnTypeRef} from "../../entities/sys/SystemKeysReturn"
import {createCustomerAccountCreateData} from "../../entities/tutanota/CustomerAccountCreateData"
import {createContactFormAccountData} from "../../entities/tutanota/ContactFormAccountData"
import {TutanotaService} from "../../entities/tutanota/Services"
import type {UserManagementFacade} from "./UserManagementFacade"
import type {GroupManagementFacade} from "./GroupManagementFacade"
import {createCustomDomainData} from "../../entities/sys/CustomDomainData"
import type {CustomDomainReturn} from "../../entities/sys/CustomDomainReturn"
import {CustomDomainReturnTypeRef} from "../../entities/sys/CustomDomainReturn"
import type {ContactFormAccountReturn} from "../../entities/tutanota/ContactFormAccountReturn"
import {ContactFormAccountReturnTypeRef} from "../../entities/tutanota/ContactFormAccountReturn"
import {createBrandingDomainDeleteData} from "../../entities/sys/BrandingDomainDeleteData"
import {createBrandingDomainData} from "../../entities/sys/BrandingDomainData"
import type {LoginFacade} from "./LoginFacade"
import type {WorkerImpl} from "../WorkerImpl"
import {CounterFacade} from "./CounterFacade"
import {createMembershipAddData} from "../../entities/sys/MembershipAddData"
import {createMembershipRemoveData} from "../../entities/sys/MembershipRemoveData"
import {createPaymentDataServicePutData} from "../../entities/sys/PaymentDataServicePutData"
import type {Country} from "../../common/CountryList"
import type {PaymentDataServicePutReturn} from "../../entities/sys/PaymentDataServicePutReturn"
import {PaymentDataServicePutReturnTypeRef} from "../../entities/sys/PaymentDataServicePutReturn"
import {_TypeModel as AccountingInfoTypeModel, AccountingInfoTypeRef} from "../../entities/sys/AccountingInfo"
import {createPdfInvoiceServiceData} from "../../entities/sys/PdfInvoiceServiceData"
import {PdfInvoiceServiceReturnTypeRef} from "../../entities/sys/PdfInvoiceServiceReturn"
import {AccountingService} from "../../entities/accounting/Services"
import type {InternalGroupData} from "../../entities/tutanota/InternalGroupData"
import {LockedError} from "../../common/error/RestError"

assertWorkerOrNode()

export class CustomerFacade {
	_login: LoginFacade;
	_groupManagement: GroupManagementFacade;
	_userManagement: UserManagementFacade;
	_worker: WorkerImpl;
	_counters: CounterFacade
	contactFormUserGroupData: ?Promise<{userGroupKey: Aes128Key, userGroupData: InternalGroupData}>;


	constructor(worker: WorkerImpl, login: LoginFacade, groupManagement: GroupManagementFacade, userManagement: UserManagementFacade, counters: CounterFacade) {
		this._worker = worker
		this._login = login
		this._groupManagement = groupManagement
		this._userManagement = userManagement
		this._counters = counters
	}

	getDomainValidationRecord(domainName: string): Promise<string> {
		return Promise.resolve("t-verify="
			+ uint8ArrayToHex(hash(stringToUtf8Uint8Array(domainName.trim().toLowerCase()
				+ neverNull(this._login.getLoggedInUser().customer))).slice(0, 16)))
	}

	addDomain(domainName: string): Promise<CustomDomainReturn> {
		let data = createCustomDomainData()
		data.domain = domainName.trim().toLowerCase()
		return serviceRequest(SysService.CustomDomainService, HttpMethod.POST, data, CustomDomainReturnTypeRef)
	}

	removeDomain(domainName: string): Promise<void> {
		let data = createCustomDomainData()
		data.domain = domainName.trim().toLowerCase()
		return serviceRequestVoid(SysService.CustomDomainService, HttpMethod.DELETE, data)
	}

	setCatchAllGroup(domainName: string, mailGroupId: ?Id): Promise<void> {
		let data = createCustomDomainData()
		data.domain = domainName.trim().toLowerCase()
		data.catchAllMailGroup = mailGroupId
		return serviceRequestVoid(SysService.CustomDomainService, HttpMethod.PUT, data)
	}

	uploadCertificate(domainName: string, pemCertificateChain: ?string, pemPrivateKey: ?string): Promise<void> {
		return load(CustomerTypeRef, neverNull(this._login.getLoggedInUser().customer)).then(customer => {
			return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				let existingBrandingDomain = getWhitelabelDomain(customerInfo, domainName)
				return serviceRequest(SysService.SystemKeysService, HttpMethod.GET, null, SystemKeysReturnTypeRef)
					.then(keyData => {
						let systemAdminPubKey = hexToPublicKey(uint8ArrayToHex(keyData.systemAdminPubKey))
						let sessionKey = aes128RandomKey()
						return rsaEncrypt(systemAdminPubKey, bitArrayToUint8Array(sessionKey))
							.then(systemAdminPubEncAccountingInfoSessionKey => {
								let data = createBrandingDomainData()
								data.domain = domainName
								if (pemCertificateChain) {
									data.sessionEncPemCertificateChain = encryptString(sessionKey, pemCertificateChain)
								}
								if (pemPrivateKey) {
									data.sessionEncPemPrivateKey = encryptString(sessionKey, pemPrivateKey)
								}
								data.systemAdminPubEncSessionKey = systemAdminPubEncAccountingInfoSessionKey
								return serviceRequestVoid(SysService.BrandingDomainService,
									(existingBrandingDomain) ? HttpMethod.PUT : HttpMethod.POST, data)
							})
					})
			})
		})
	}

	deleteCertificate(domainName: string): Promise<void> {
		let data = createBrandingDomainDeleteData()
		data.domain = domainName
		return serviceRequestVoid(SysService.BrandingDomainService, HttpMethod.DELETE, data)
	}

	readUsedCustomerStorage(customerId: Id): Promise<number> {
		return this._counters.readCounterValue(Const.COUNTER_USED_MEMORY_INTERNAL, customerId)
		           .then(usedMemoryInternal => {
			           return this._counters.readCounterValue(Const.COUNTER_USED_MEMORY_EXTERNAL, customerId)
			                      .then(usedMemoryExternal => {
				                      return (Number(usedMemoryInternal) + Number(usedMemoryExternal));
			                      })
		           })
	}

	readAvailableCustomerStorage(customerId: Id): Promise<number> {
		return load(CustomerTypeRef, customerId).then(customer => {
			return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				let includedStorage = Number(customerInfo.includedStorageCapacity);
				let promotionStorage = Number(customerInfo.promotionStorageCapacity);
				let availableStorage = Math.max(includedStorage, promotionStorage)
				let bookedStorage = 0;
				if (customer.type === AccountType.PREMIUM) {
					return bookingFacade.getCurrentPrice().then(price => {
						let currentStorageItem = bookingFacade.getPriceItem(price.currentPriceNextPeriod, BookingItemFeatureType.Storage);
						if (currentStorageItem != null) {
							bookedStorage = Number(currentStorageItem.count);
						}
						availableStorage = Math.max(bookedStorage, availableStorage);
						return availableStorage * Const.MEMORY_GB_FACTOR;
					})
				} else {
					return availableStorage * Const.MEMORY_GB_FACTOR;
				}
			})
		})
	}

	loadCustomerServerProperties(): Promise<CustomerServerProperties> {
		return load(CustomerTypeRef, neverNull(this._login.getLoggedInUser().customer)).then(customer => {
			let p
			if (customer.serverProperties) {
				p = Promise.resolve(customer.serverProperties)
			} else {
				// create properties
				let sessionKey = aes128RandomKey()
				let adminGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Admin))
				let groupEncSessionKey = encryptKey(adminGroupKey, sessionKey)
				let data = createCreateCustomerServerPropertiesData()
				data.adminGroupEncSessionKey = groupEncSessionKey
				p = serviceRequest(SysService.CreateCustomerServerProperties, HttpMethod.POST, data,
					CreateCustomerServerPropertiesReturnTypeRef)
					.then(returnData => {
						return returnData.id
					})
			}
			return p.then(cspId => {
				return load(CustomerServerPropertiesTypeRef, cspId)
			})
		})
	}

	addSpamRule(field: SpamRuleFieldTypeEnum, type: SpamRuleTypeEnum, value: string): Promise<void> {
		return this.loadCustomerServerProperties().then(props => {
			value = value.toLowerCase().trim()
			let newListEntry = createEmailSenderListElement({
				value,
				hashedValue: uint8ArrayToBase64(hash(stringToUtf8Uint8Array(value))),
				type,
				field,
			})
			props.emailSenderList.push(newListEntry)
			return update(props)
				.catch(LockedError, noOp)
		})
	}

	editSpamRule(spamRule: EmailSenderListElement): Promise<void> {
		return this.loadCustomerServerProperties().then(props => {
			spamRule.value = spamRule.value.toLowerCase().trim()

			const index = props.emailSenderList.findIndex(item => spamRule._id === item._id)
			if (index === -1) {
				throw new Error("spam rule does not exist " + JSON.stringify(spamRule))
			}
			props.emailSenderList[index] = spamRule
			return update(props)
				.catch(LockedError, noOp)
		})
	}

	generateSignupKeys(): Promise<[RsaKeyPair, RsaKeyPair, RsaKeyPair]> {
		return generateRsaKey().then(k1 => {
			return this._worker.sendProgress(33).then(() => {
				return generateRsaKey().then(k2 => {
					return this._worker.sendProgress(66).then(() => {
						return generateRsaKey().then(k3 => {
							return this._worker.sendProgress(100).then(() => {
								return [k1, k2, k3]
							})
						})
					})
				})
			})
		})
	}

	signup(keyPairs: [RsaKeyPair, RsaKeyPair, RsaKeyPair], accountType: AccountTypeEnum, authToken: string, mailAddress: string, password: string, registrationCode: string, currentLanguage: string): Promise<Hex> {
		return serviceRequest(SysService.SystemKeysService, HttpMethod.GET, null, SystemKeysReturnTypeRef)
			.then(keyData => {
				let systemAdminPubKey = hexToPublicKey(uint8ArrayToHex(keyData.systemAdminPubKey))
				let userGroupKey = aes128RandomKey()
				let adminGroupKey = aes128RandomKey()
				let customerGroupKey = aes128RandomKey()
				let userGroupInfoSessionKey = aes128RandomKey()
				let adminGroupInfoSessionKey = aes128RandomKey()
				let customerGroupInfoSessionKey = aes128RandomKey()
				let accountingInfoSessionKey = aes128RandomKey()
				let customerServerPropertiesSessionKey = aes128RandomKey()

				// we can not join all the following promises because they are running sync and therefore would not allow the worker sending the progress
				return rsaEncrypt(systemAdminPubKey, bitArrayToUint8Array(accountingInfoSessionKey))
					.then(systemAdminPubEncAccountingInfoSessionKey => {
						let userGroupData = this._groupManagement.generateInternalGroupData(keyPairs[0], userGroupKey, userGroupInfoSessionKey, null, adminGroupKey, customerGroupKey)
						let adminGroupData = this._groupManagement.generateInternalGroupData(keyPairs[1], adminGroupKey, adminGroupInfoSessionKey, null, adminGroupKey, customerGroupKey)
						let customerGroupData = this._groupManagement.generateInternalGroupData(keyPairs[2], customerGroupKey, customerGroupInfoSessionKey, null, adminGroupKey, customerGroupKey)
						const recoverData = this._login.generateRecoveryCode(userGroupKey)
						let data = createCustomerAccountCreateData()
						data.authToken = authToken
						data.date = Const.CURRENT_DATE
						data.lang = currentLanguage
						data.code = registrationCode
						data.userData = this._userManagement.generateUserAccountData(userGroupKey, userGroupInfoSessionKey, customerGroupKey, mailAddress, password, "", recoverData)
						data.userEncAdminGroupKey = encryptKey(userGroupKey, adminGroupKey)
						data.userEncAccountGroupKey = encryptKey(userGroupKey, this._getAccountGroupKey(keyData, accountType))
						data.userGroupData = userGroupData
						data.adminGroupData = adminGroupData
						data.customerGroupData = customerGroupData
						data.adminEncAccountingInfoSessionKey = encryptKey(adminGroupKey, accountingInfoSessionKey)
						data.systemAdminPubEncAccountingInfoSessionKey = systemAdminPubEncAccountingInfoSessionKey
						data.adminEncCustomerServerPropertiesSessionKey = encryptKey(adminGroupKey, customerServerPropertiesSessionKey)
						return serviceRequestVoid(AccountingService.CustomerAccountService, HttpMethod.POST, data)
							.return(recoverData.hexCode)
					})
			})
	}

	createContactFormUserGroupData(): Promise<void> {
		let userGroupKey = aes128RandomKey()
		let userGroupInfoSessionKey = aes128RandomKey()
		this.contactFormUserGroupData = generateRsaKey()
			.then(keyPair => this._groupManagement.generateInternalGroupData(keyPair, userGroupKey, userGroupInfoSessionKey, null, userGroupKey, userGroupKey))
			.then(userGroupData => {
				return {userGroupKey, userGroupData}
			})
		return Promise.resolve()
	}

	async _getContactFormUserGroupData(): Promise<{userGroupKey: Aes128Key, userGroupData: InternalGroupData}> {
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
		const contactFormUserGroupData = await this._getContactFormUserGroupData()
		let {userGroupKey, userGroupData} = contactFormUserGroupData
		await this._worker.sendProgress(35)
		let data = createContactFormAccountData()
		data.userData = this._userManagement.generateContactFormUserAccountData(userGroupKey, password)
		await this._worker.sendProgress(95)
		data.userGroupData = userGroupData
		data.contactForm = contactFormId
		const result = serviceRequest(TutanotaService.ContactFormAccountService, HttpMethod.POST, data, ContactFormAccountReturnTypeRef)
		this.contactFormUserGroupData = null
		return result
	}

	_getAccountGroupKey(keyData: SystemKeysReturn, accountType: AccountTypeEnum): Aes128Key {
		if (accountType === AccountType.FREE) {
			return uint8ArrayToBitArray(keyData.freeGroupKey)
		} else if (accountType === AccountType.STARTER) {
			return uint8ArrayToBitArray(keyData.starterGroupKey);
		} else {
			throw Error("Illegal account type");
		}
	}


	switchFreeToPremiumGroup(): Promise<void> {
		return serviceRequest(SysService.SystemKeysService, HttpMethod.GET, null, SystemKeysReturnTypeRef)
			.then(keyData => {
				let membershipAddData = createMembershipAddData()
				membershipAddData.user = this._login.getLoggedInUser()._id
				membershipAddData.group = neverNull(keyData.premiumGroup)
				membershipAddData.symEncGKey = encryptKey(this._login.getUserGroupKey(), uint8ArrayToBitArray(keyData.premiumGroupKey))

				return serviceRequestVoid(SysService.MembershipService, HttpMethod.POST, membershipAddData).then(() => {
					let membershipRemoveData = createMembershipRemoveData()
					membershipRemoveData.user = this._login.getLoggedInUser()._id
					membershipRemoveData.group = neverNull(keyData.freeGroup)
					return serviceRequestVoid(SysService.MembershipService, HttpMethod.DELETE, membershipRemoveData)
				})
			})
			.catch(e => {
				e.message = e.message + " error switching free to premium group"
				console.log(e)
				throw e
			})
	}

	switchPremiumToFreeGroup(): Promise<void> {
		return serviceRequest(SysService.SystemKeysService, HttpMethod.GET, null, SystemKeysReturnTypeRef)
			.then(keyData => {
				let membershipAddData = createMembershipAddData()
				membershipAddData.user = this._login.getLoggedInUser()._id
				membershipAddData.group = neverNull(keyData.freeGroup)
				membershipAddData.symEncGKey = encryptKey(this._login.getUserGroupKey(), uint8ArrayToBitArray(keyData.freeGroupKey))

				return serviceRequestVoid(SysService.MembershipService, HttpMethod.POST, membershipAddData).then(() => {
					let membershipRemoveData = createMembershipRemoveData()
					membershipRemoveData.user = this._login.getLoggedInUser()._id
					membershipRemoveData.group = neverNull(keyData.premiumGroup)
					return serviceRequestVoid(SysService.MembershipService, HttpMethod.DELETE, membershipRemoveData)
				})
			})
			.catch(e => {
				e.message = e.message + " error switching premium to free group"
				console.log(e)
				throw e
			})
	}

	updatePaymentData(paymentInterval: number, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedInvoiceCountry: ?Country): Promise<PaymentDataServicePutReturn> {
		return load(CustomerTypeRef, neverNull(this._login.getLoggedInUser().customer)).then(customer => {
			return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				return load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
					return resolveSessionKey(AccountingInfoTypeModel, accountingInfo).then(accountingInfoSessionKey => {
						const service = createPaymentDataServicePutData()
						service.business = false // not used, must be set to false currently, will be removed later
						service.paymentInterval = paymentInterval.toString()
						service.invoiceName = ""
						service.invoiceAddress = invoiceData.invoiceAddress
						service.invoiceCountry = invoiceData.country ? invoiceData.country.a : ""
						service.invoiceVatIdNo = invoiceData.vatNumber ? invoiceData.vatNumber : ""
						service.paymentMethod = paymentData ? paymentData.paymentMethod : (accountingInfo.paymentMethod ? accountingInfo.paymentMethod : "")
						service.paymentMethodInfo = null
						service.paymentToken = null
						if (paymentData && paymentData.creditCardData) {
							service.creditCard = paymentData.creditCardData
						}
						service.confirmedCountry = confirmedInvoiceCountry ? confirmedInvoiceCountry.a : null
						return serviceRequest(SysService.PaymentDataService, HttpMethod.PUT, service, PaymentDataServicePutReturnTypeRef, null, accountingInfoSessionKey)
					})
				})
			})
		})
	}

	downloadInvoice(invoiceNumber: string): Promise<DataFile> {
		let data = createPdfInvoiceServiceData()
		data.invoiceNumber = invoiceNumber
		return serviceRequest(SysService.PdfInvoiceService, HttpMethod.GET, data, PdfInvoiceServiceReturnTypeRef)
			.then(returnData => {
				return {
					_type: 'DataFile',
					name: String(invoiceNumber) + ".pdf",
					mimeType: "application/pdf",
					data: returnData.data,
					size: returnData.data.byteLength,
					id: null
				}
			})
	}
}

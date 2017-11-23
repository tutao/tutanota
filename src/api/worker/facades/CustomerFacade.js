// @flow
import {serviceRequest, load, update, serviceRequestVoid} from "../EntityWorker"
import type {AccountTypeEnum} from "../../common/TutanotaConstants"
import {Const, AccountType, BookingItemFeatureType, GroupType} from "../../common/TutanotaConstants"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {CustomerInfoTypeRef} from "../../entities/sys/CustomerInfo"
import {bookingFacade} from "./BookingFacade"
import {assertWorkerOrNode} from "../../Env"
import {HttpMethod} from "../../common/EntityFunctions"
import {createEmailSenderListElement} from "../../entities/sys/EmailSenderListElement"
import {uint8ArrayToBase64, stringToUtf8Uint8Array, uint8ArrayToHex} from "../../common/utils/Encoding"
import {hash} from "../crypto/Sha256"
import {CustomerServerPropertiesTypeRef} from "../../entities/sys/CustomerServerProperties"
import {neverNull} from "../../common/utils/Utils"
import {aes128RandomKey} from "../crypto/Aes"
import {encryptKey, encryptString} from "../crypto/CryptoFacade"
import {createCreateCustomerServerPropertiesData} from "../../entities/sys/CreateCustomerServerPropertiesData"
import {CreateCustomerServerPropertiesReturnTypeRef} from "../../entities/sys/CreateCustomerServerPropertiesReturn"
import {uint8ArrayToBitArray, bitArrayToUint8Array} from "../crypto/CryptoUtils"
import {hexToPublicKey, rsaEncrypt} from "../crypto/Rsa"
import {SysService} from "../../entities/sys/Services"
import {SystemKeysReturnTypeRef} from "../../entities/sys/SystemKeysReturn"
import {createCustomerAccountCreateData} from "../../entities/tutanota/CustomerAccountCreateData"
import {createContactFormAccountData} from "../../entities/tutanota/ContactFormAccountData"
import {TutanotaService} from "../../entities/tutanota/Services"
import type {UserManagementFacade} from "./UserManagementFacade"
import type {GroupManagementFacade} from "./GroupManagementFacade"
import {createCustomDomainData} from "../../entities/sys/CustomDomainData"
import {CustomDomainReturnTypeRef} from "../../entities/sys/CustomDomainReturn"
import {ContactFormAccountReturnTypeRef} from "../../entities/tutanota/ContactFormAccountReturn"
import {createBrandingDomainDeleteData} from "../../entities/sys/BrandingDomainDeleteData"
import {createBrandingDomainData} from "../../entities/sys/BrandingDomainData"
import {createContactFormStatisticEntry} from "../../entities/tutanota/ContactFormStatisticEntry"
import {PublicKeyReturnTypeRef} from "../../entities/sys/PublicKeyReturn"
import {createContactFormStatisticField} from "../../entities/tutanota/ContactFormStatisticField"
import type {LoginFacade} from "./LoginFacade"
import type {WorkerImpl} from "../WorkerImpl"
import {readCounterValue} from "./CounterFacade"

assertWorkerOrNode()

export class CustomerFacade {
	_login: LoginFacade;
	_groupManagement: GroupManagementFacade;
	_userManagement: UserManagementFacade;
	_worker: WorkerImpl;
	contactFormUserGroupData: ?Promise<{userGroupKey: Aes128Key, userGroupData: InternalGroupData}>;


	constructor(worker: WorkerImpl, login: LoginFacade, groupManagement: GroupManagementFacade, userManagement: UserManagementFacade) {
		this._worker = worker
		this._login = login
		this._groupManagement = groupManagement
		this._userManagement = userManagement
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

	uploadCertificate(domainName: string, pemCertificateChain: string, pemPrivateKey: string): Promise<void> {
		return load(CustomerTypeRef, neverNull(this._login.getLoggedInUser().customer)).then(customer => {
			return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				let updateCertificate = neverNull(customerInfo.domainInfos.find(info => info.domain == domainName)).certificate != null
				return serviceRequest(SysService.SystemKeysService, HttpMethod.GET, null, SystemKeysReturnTypeRef).then(keyData => {
					let systemAdminPubKey = hexToPublicKey(uint8ArrayToHex(keyData.systemAdminPubKey))
					let sessionKey = aes128RandomKey()
					return rsaEncrypt(systemAdminPubKey, bitArrayToUint8Array(sessionKey)).then(systemAdminPubEncAccountingInfoSessionKey => {
						let data = createBrandingDomainData()
						data.domain = domainName
						data.sessionEncPemCertificateChain = encryptString(sessionKey, pemCertificateChain)
						data.sessionEncPemPrivateKey = encryptString(sessionKey, pemPrivateKey)
						data.systemAdminPubEncSessionKey = systemAdminPubEncAccountingInfoSessionKey
						return serviceRequestVoid(SysService.BrandingDomainService, (updateCertificate) ? HttpMethod.PUT : HttpMethod.POST, data)
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
		return readCounterValue(Const.COUNTER_USED_MEMORY_INTERNAL, customerId).then(usedMemoryInternal => {
			return readCounterValue(Const.COUNTER_USED_MEMORY_EXTERNAL, customerId).then(usedMemoryExternal => {
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
				p = serviceRequest("createcustomerserverproperties", HttpMethod.POST, data, CreateCustomerServerPropertiesReturnTypeRef).then(returnData => {
					return returnData.id
				})
			}
			return p.then(cspId => {
				return load(CustomerServerPropertiesTypeRef, cspId)
			})
		})
	}

	addSpamRule(type: NumberString, value: string): Promise<void> {
		return this.loadCustomerServerProperties().then(props => {
			value = value.toLowerCase().trim()
			let newListEntry = createEmailSenderListElement()
			newListEntry.value = value
			newListEntry.hashedValue = uint8ArrayToBase64(hash(stringToUtf8Uint8Array(value)))
			newListEntry.type = type
			props.emailSenderList.push(newListEntry)
			update(props)
		})
	}

	signup(accountType: AccountTypeEnum, authToken: string, mailAddress: string, password: string, currentLanguage: string) {
		return serviceRequest(SysService.SystemKeysService, HttpMethod.GET, null, SystemKeysReturnTypeRef).then(keyData => {
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
			return rsaEncrypt(systemAdminPubKey, bitArrayToUint8Array(accountingInfoSessionKey)).then(systemAdminPubEncAccountingInfoSessionKey => {
				return this._worker.sendProgress(5).then(() => {
					return this._groupManagement.generateInternalGroupData(userGroupKey, userGroupInfoSessionKey, adminGroupKey, customerGroupKey).then(userGroupData => {
						return this._worker.sendProgress(35).then(() => {
							return this._groupManagement.generateInternalGroupData(adminGroupKey, adminGroupInfoSessionKey, adminGroupKey, customerGroupKey).then(adminGroupData => {
								return this._worker.sendProgress(65).then(() => {
									return this._groupManagement.generateInternalGroupData(customerGroupKey, customerGroupInfoSessionKey, adminGroupKey, customerGroupKey).then(customerGroupData => {
										return this._worker.sendProgress(95).then(() => {
											let data = createCustomerAccountCreateData()
											data.authToken = authToken
											data.date = Const.CURRENT_DATE
											data.lang = currentLanguage
											data.userData = this._userManagement.generateUserAccountData(userGroupKey, userGroupInfoSessionKey, customerGroupKey, mailAddress, password, "")
											data.userEncAdminGroupKey = encryptKey(userGroupKey, adminGroupKey)
											data.userEncAccountGroupKey = encryptKey(userGroupKey, this._getAccountGroupKey(keyData, accountType))
											data.userGroupData = userGroupData
											data.adminGroupData = adminGroupData
											data.customerGroupData = customerGroupData
											data.adminEncAccountingInfoSessionKey = encryptKey(adminGroupKey, accountingInfoSessionKey)
											data.systemAdminPubEncAccountingInfoSessionKey = systemAdminPubEncAccountingInfoSessionKey
											data.adminEncCustomerServerPropertiesSessionKey = encryptKey(adminGroupKey, customerServerPropertiesSessionKey)
											return serviceRequestVoid(TutanotaService.CustomerAccountService, HttpMethod.POST, data)
										})
									})
								})
							})
						})
					})
				})
			})
		})
	}

	createContactFormUserGroupData(): Promise<void> {
		let userGroupKey = aes128RandomKey()
		let userGroupInfoSessionKey = aes128RandomKey()
		this.contactFormUserGroupData = this._groupManagement.generateInternalGroupData(userGroupKey, userGroupInfoSessionKey, userGroupKey, userGroupKey).then(userGroupData => {
			return {userGroupKey, userGroupData}
		})
		return Promise.resolve()
	}

	/**
	 * @pre CustomerFacade#createContactFormUserGroupData has been invoked before
	 */
	createContactFormUser(password: string, contactFormId: IdTuple, statisticFields: {name: string, value: string}[]): Promise<ContactFormAccountReturn> {
		// we can not join all the following promises because they are running sync and therefore would not allow the worker sending the progress
		return neverNull(this.contactFormUserGroupData).then(contactFormUserGroupData => {
			let {userGroupKey, userGroupData} = contactFormUserGroupData
			return this._worker.sendProgress(35).then(() => {
				let data = createContactFormAccountData()
				data.userData = this._userManagement.generateContactFormUserAccountData(userGroupKey, password)
				return this._worker.sendProgress(95).then(() => {
					return serviceRequest(SysService.CustomerPublicKeyService, HttpMethod.GET, null, PublicKeyReturnTypeRef).then(publicKeyData => {
						let publicKey = hexToPublicKey(uint8ArrayToHex(publicKeyData.pubKey))

						let sessionKey = aes128RandomKey()
						let bucketKey = aes128RandomKey()
						return rsaEncrypt(publicKey, bitArrayToUint8Array(bucketKey)).then(customerPubEncBucketKey => {
							let stats = createContactFormStatisticEntry()
							stats.customerPubEncBucketKey = customerPubEncBucketKey
							stats.bucketEncSessionKey = encryptKey(bucketKey, sessionKey)
							stats.customerPubKeyVersion = publicKeyData.pubKeyVersion

							stats.statisticFields = statisticFields.map(sf => {
								let esf = createContactFormStatisticField()
								esf.encryptedName = encryptString(sessionKey, sf.name)
								esf.encryptedValue = encryptString(sessionKey, sf.value)
								return esf
							})

							data.userGroupData = userGroupData
							data.contactForm = contactFormId
							data.statistics = stats
							return serviceRequest(TutanotaService.ContactFormAccountService, HttpMethod.POST, data, ContactFormAccountReturnTypeRef)
						})

					})
				})
			})
		}).then((result) => {
			this.contactFormUserGroupData = null
			return result
		})
	}

	_getAccountGroupKey(keyData: SystemKeysReturn, accountType: AccountTypeEnum): Aes128Key {
		if (accountType == AccountType.FREE) {
			return uint8ArrayToBitArray(keyData.freeGroupKey)
		} else if (accountType == AccountType.STARTER) {
			return uint8ArrayToBitArray(keyData.starterGroupKey);
		} else {
			throw Error("Illegal account type");
		}
	}

}

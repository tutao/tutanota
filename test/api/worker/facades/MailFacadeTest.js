// @flow
import o from "ospec/ospec.js"
import {MailFacade} from "../../../../src/api/worker/facades/MailFacade"
import {aes128RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {downcast} from "../../../../src/api/common/utils/Utils"
import {decryptKey} from "../../../../src/api/worker/crypto/CryptoFacade"
import {EntityWorker} from "../../../../src/api/worker/EntityWorker"
import {LoginFacade} from "../../../../src/api/worker/facades/LoginFacade"
import {ConversationType, GroupType, MailState} from "../../../../src/api/common/TutanotaConstants"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {createGroupInfo, GroupInfoTypeRef} from "../../../../src/api/entities/sys/GroupInfo"
import {MailAddressAliasTypeRef} from "../../../../src/api/entities/sys/MailAddressAlias"
import {DraftCreateReturnTypeRef} from "../../../../src/api/entities/tutanota/DraftCreateReturn"
import {spy} from "../../TestUtils"
import {isSameTypeRef} from "../../../../src/api/common/EntityFunctions"
import {createMail, MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import {NotFoundError} from "../../../../src/api/common/error/RestError"
import {createGroup, GroupTypeRef} from "../../../../src/api/entities/sys/Group"

const makeRecipientInfo = (name): RecipientInfo => ({
	_type: "RecipientInfo",
	type: "internal",
	contact: null,
	mailAddress: name + "@tutanota.com",
	name: name + "name",
	resolveContactPromise: null
})

const recipientInfoEqualsRecipients = (recipientInfo: RecipientInfo[], recipients: DraftRecipient[]) => {
	o(recipientInfo.length).equals(recipients.length)("Different recipient length: " + JSON.stringify(recipientInfo) + " " + JSON.stringify(recipients))

	for (let i = 0; i < recipientInfo.length; i++) {
		const ri = recipientInfo[i]
		const r = recipients[i]

		o([ri.name, ri.mailAddress]).deepEquals([r.name, r.mailAddress])
	}
}

o.spec("MailFacade test", function () {


	o.beforeEach(function () {

	})

	o('createAndEncryptDraftAttachment', function () {
		const entityWorker: any = null
		const login: any = null
		const fileFacade: any = null

		const fileDataId: string = "randomid"
		const sessionKey = aes128RandomKey()
		const groupKey = aes128RandomKey()
		const file: DataFile = {
			_type: 'DataFile',
			name: 'filename.jpg',
			mimeType: 'text/plain',
			data: new Uint8Array(3),
			id: null,
			size: 300
		}
		let mailFacade = new MailFacade(entityWorker, login, fileFacade)
		const result = mailFacade.createAndEncryptDraftAttachment(fileDataId, sessionKey, file, groupKey)
		const newFile: NewDraftAttachment = downcast(result.newFile)
		o(newFile.fileData).equals(fileDataId)
		o(decryptKey(groupKey, result.ownerEncFileSessionKey)).deepEquals(sessionKey)
	})

	o.only("createDraft", async function () {
		const userGroupKey = aes128RandomKey()
		const groupKey = aes128RandomKey()
		const mailMembership = createGroupMembership()
		mailMembership.groupType = GroupType.Mail
		mailMembership.groupInfo = ['firstpart', 'someid']

		const groupInfo = createGroupInfo()
		groupInfo.mailAddressAliases = [
			{
				enabled: true,
				mailAddress: 'sender@tutanota.com',
				_id: 'someid',
				_type: MailAddressAliasTypeRef
			}
		]

		const loginFacade: LoginFacade = downcast({
			getLoggedInUser: () => {
				return {
					memberships: [mailMembership]
				}
			},
			getUserGroupKey: () => userGroupKey,
			getGroupKey: () => groupKey
		})

		const createDraftReturn = {
			_type: DraftCreateReturnTypeRef,
			_format: '0',
			_draft: ['id', 'tuple']
		}

		const toRecipients = [makeRecipientInfo("to"), makeRecipientInfo("to1")]
		const ccRecipients = [makeRecipientInfo("cc"), makeRecipientInfo("cc1")]
		const bccRecipients = [makeRecipientInfo("bcc"), makeRecipientInfo("bcc1"), makeRecipientInfo("bcc2")]

		const entityWorker: EntityWorker = downcast({
			load: (typeRef, ...args) => {
				if (isSameTypeRef(typeRef, GroupTypeRef)) {
					return Promise.resolve(createGroup())
				} else if (isSameTypeRef(typeRef, GroupInfoTypeRef)) {
					return Promise.resolve(groupInfo)
				} else if (isSameTypeRef(typeRef, MailTypeRef)) {
					const mail = createMail()
					mail.state = MailState.DRAFT
					mail.body = "something"
					return Promise.resolve(mail)
				} else {
					return Promise.reject(new NotFoundError(`Not found ${JSON.stringify(typeRef)}, ${JSON.stringify(args)}`))
				}
			},
			serviceRequest: spy(() => {
				return Promise.resolve(createDraftReturn)
			})
		})
		let mailFacade = new MailFacade(entityWorker, loginFacade, (null: any))
		await mailFacade.createDraft("subject", "body", "sender@tutanota.com", "SenderName", toRecipients, ccRecipients, bccRecipients,
			ConversationType.NEW, null, null, true, [])
		o(entityWorker.serviceRequest.invocations.length).equals(1)
		const invocation = entityWorker.serviceRequest.invocations[0]
		const createData: DraftCreateData = invocation[2]

		recipientInfoEqualsRecipients(toRecipients, createData.draftData.toRecipients)
		recipientInfoEqualsRecipients(ccRecipients, createData.draftData.ccRecipients)
		recipientInfoEqualsRecipients(bccRecipients, createData.draftData.bccRecipients)
	})
})
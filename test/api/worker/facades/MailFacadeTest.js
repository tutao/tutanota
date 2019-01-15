// @flow
import o from "ospec/ospec.js"
import {MailFacade} from "../../../../src/api/worker/facades/MailFacade"
import {aes128RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {downcast} from "../../../../src/api/common/utils/Utils"
import {decryptKey} from "../../../../src/api/worker/crypto/CryptoFacade"
import {EntityWorker} from "../../../../src/api/worker/EntityWorker"
import {LoginFacade} from "../../../../src/api/worker/facades/LoginFacade"
import {ConversationType, GroupType} from "../../../../src/api/common/TutanotaConstants"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {createGroupInfo} from "../../../../src/api/entities/sys/GroupInfo"
import {MailAddressAliasTypeRef} from "../../../../src/api/entities/sys/MailAddressAlias"
import {DraftCreateReturnTypeRef} from "../../../../src/api/entities/tutanota/DraftCreateReturn"
import {spy} from "../../TestUtils"

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
		const createDraftReturn = {
			_type: DraftCreateReturnTypeRef,
			_format: '0',
			_draft: ['id', 'tuple']
		}
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
		const entityWorker: EntityWorker = downcast({
			load: () => {
				return Promise.resolve(groupInfo)
			},
			serviceRequest: spy(() => {
				return Promise.resolve(createDraftReturn)
			})
		})
		let mailFacade = new MailFacade(entityWorker, loginFacade, (null: any))
		await mailFacade.createDraft("subject", "body", "sender@tutanota.com", "SenderName", [], [], [], ConversationType.NEW, null, null, true, [])
		o(entityWorker.serviceRequest.invocations[0][2].draftData.toRecipients).deepEquals([])
	})
})
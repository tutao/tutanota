import o from "@tutao/otest"
import { OfflineStorageIndexer } from "../../../../../src/mail-app/workerUtils/index/OfflineStorageIndexer"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { IndexedGroupData, OfflineStoragePersistence } from "../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { MailIndexer } from "../../../../../src/mail-app/workerUtils/index/MailIndexer"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer"
import { matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils"
import { GroupMembershipTypeRef, User, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { GroupType, NOTHING_INDEXED_TIMESTAMP } from "../../../../../src/common/api/common/TutanotaConstants"

o.spec("OfflineStorageIndexer", () => {
	let userFacade: UserFacade
	let persistence: OfflineStoragePersistence
	let mailIndexer: MailIndexer
	let infoMessageHandler: InfoMessageHandler
	let contactIndexer: ContactIndexer

	let indexer: OfflineStorageIndexer

	o.beforeEach(() => {
		userFacade = object()
		persistence = object()
		mailIndexer = object()
		infoMessageHandler = object()
		contactIndexer = object()
		indexer = new OfflineStorageIndexer(userFacade, persistence, mailIndexer, infoMessageHandler, contactIndexer)
	})

	o.spec("fullLoginInit", () => {
		let user: User
		o.beforeEach(() => {
			user = createTestEntity(UserTypeRef, {})
			when(userFacade.getUser()).thenReturn(user)
		})

		o.test("when some indexed memberships are not on the user they are removed", async () => {
			const removedGroupId = "removed group"
			const removedGroup: IndexedGroupData = {
				groupId: removedGroupId,
				type: GroupType.Mail,
				indexedTimestamp: 1234,
			}
			const groupThatStaysId = "groupThatStays"
			const groupThatStays: IndexedGroupData = {
				groupId: groupThatStaysId,
				type: GroupType.Contact,
				indexedTimestamp: 12345,
			}
			when(persistence.getIndexedGroups()).thenResolve([removedGroup, groupThatStays])
			user.memberships.push(
				createTestEntity(GroupMembershipTypeRef, {
					group: groupThatStaysId,
					groupType: groupThatStays.type,
				}),
			)

			await indexer.fullLoginInit()
			verify(persistence.removeIndexedGroup(removedGroupId))
			verify(persistence.removeIndexedGroup(groupThatStaysId), { times: 0 })
			verify(persistence.addIndexedGroup(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(contactIndexer.indexFullContactList())
		})

		o.test("when some user memberships are not on the indexer they are added", async () => {
			const addedGroupId = "added group"
			const addedGroup: IndexedGroupData = {
				groupId: addedGroupId,
				type: GroupType.Mail,
				indexedTimestamp: 1234,
			}
			const groupThatStaysId = "groupThatStays"
			const groupThatStays: IndexedGroupData = {
				groupId: groupThatStaysId,
				type: GroupType.Contact,
				indexedTimestamp: 12345,
			}
			when(persistence.getIndexedGroups()).thenResolve([groupThatStays])
			user.memberships.push(
				createTestEntity(GroupMembershipTypeRef, {
					group: groupThatStaysId,
					groupType: groupThatStays.type,
				}),
			)
			const addedGroupMembership = createTestEntity(GroupMembershipTypeRef, {
				group: addedGroupId,
				groupType: addedGroup.type,
			})
			user.memberships.push(addedGroupMembership)
			when(userFacade.getMembership(addedGroupId)).thenReturn(addedGroupMembership)

			await indexer.fullLoginInit()
			verify(persistence.addIndexedGroup(addedGroupId, GroupType.Mail, NOTHING_INDEXED_TIMESTAMP))
			verify(persistence.addIndexedGroup(matchers.not(addedGroupId), matchers.anything(), matchers.anything()), { times: 0 })
			verify(persistence.removeIndexedGroup(matchers.anything()), { times: 0 })
			verify(contactIndexer.indexFullContactList())
		})
	})
})

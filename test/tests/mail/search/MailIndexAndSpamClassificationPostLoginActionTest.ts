import o from "@tutao/otest"
import { OfflineStorageSettingsModel } from "../../../../src/common/offline/OfflineStorageSettingsModel"
import { SpamClassifier } from "../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { Indexer } from "../../../../src/mail-app/workerUtils/index/Indexer"
import { CustomerFacade } from "../../../../src/common/api/worker/facades/lazy/CustomerFacade"
import { matchers, object, verify, when } from "testdouble"
import { MailIndexAndSpamClassificationPostLoginAction } from "../../../../src/mail-app/search/model/MailIndexAndSpamClassificationPostLoginAction"
import { LoggedInEvent } from "../../../../src/common/api/main/LoginController"
import { SessionType } from "../../../../src/common/api/common/SessionType"
import { User } from "../../../../src/common/api/entities/sys/TypeRefs"
import { FeatureType, GroupType } from "../../../../src/common/api/common/TutanotaConstants"

o.spec("MailIndexAndSpamClassificationPostLoginAction", () => {
	let offlineStorageSettingsMock: OfflineStorageSettingsModel
	let indexerMock: Indexer
	let spamClassifierMock: SpamClassifier
	let customerFacadeMock: CustomerFacade
	let postLoginAction: MailIndexAndSpamClassificationPostLoginAction

	o.beforeEach(() => {
		offlineStorageSettingsMock = object<OfflineStorageSettingsModel>()
		indexerMock = object<Indexer>()
		spamClassifierMock = object<SpamClassifier>()
		customerFacadeMock = object<CustomerFacade>()
		postLoginAction = new MailIndexAndSpamClassificationPostLoginAction(offlineStorageSettingsMock, indexerMock, spamClassifierMock, customerFacadeMock)

		when(offlineStorageSettingsMock.getTimeRange()).thenReturn(new Date())
		when(indexerMock.resizeMailIndex(matchers.anything())).thenResolve()
		when(customerFacadeMock.isEnabled(FeatureType.SpamClientClassification)).thenResolve(true)
		when(spamClassifierMock.initialize(matchers.anything())).thenResolve()
	})

	o.test("Initialize spamClassifier for all mailGroups", async () => {
		const loggedInEvent: LoggedInEvent = { sessionType: SessionType.Persistent, userId: "userId" }
		const user = object<User>({
			memberships: [
				{ group: "firstMailGroup", groupType: GroupType.Mail },
				{ group: "secondMailGroup", groupType: GroupType.Mail },
				{ group: "calendarGroup", groupType: GroupType.Calendar },
			],
		} as User)

		when(customerFacadeMock.getUser()).thenResolve(user)
		const { asyncAction } = await postLoginAction.onPartialLoginSuccess(loggedInEvent)
		await asyncAction

		verify(spamClassifierMock.initialize("firstMailGroup"), { times: 1 })
		verify(spamClassifierMock.initialize("secondMailGroup"), { times: 1 })
	})
})

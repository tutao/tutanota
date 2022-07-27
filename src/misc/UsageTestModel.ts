import {
	createUsageTestAssignmentIn,
	createUsageTestMetricData,
	createUsageTestParticipationIn,
	UsageTestAssignment,
	UsageTestAssignmentOut,
	UsageTestAssignmentTypeRef,
} from "../api/entities/usage/TypeRefs.js"
import {PingAdapter, Stage, UsageTest} from "@tutao/tutanota-usagetests"
import {assertNotNull, filterInt, lazy, neverNull} from "@tutao/tutanota-utils"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {Keys, UsageTestMetricType} from "../api/common/TutanotaConstants"
import {SuspensionError} from "../api/common/error/SuspensionError"
import {SuspensionBehavior} from "../api/worker/rest/RestClient"
import {DateProvider} from "../api/common/DateProvider.js"
import {IServiceExecutor} from "../api/common/ServiceRequest"
import {UsageTestAssignmentService, UsageTestParticipationService} from "../api/entities/usage/Services.js"
import {resolveTypeReference} from "../api/common/EntityFunctions"
import {InfoLink, lang, TranslationKey} from "./LanguageViewModel"
import stream from "mithril/stream"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {DropDownSelector, SelectorItem} from "../gui/base/DropDownSelector"
import {UsageTestMetricType} from "../api/common/TutanotaConstants"
import m, {Children, Component, Vnode} from "mithril"
import {isOfflineError} from "../api/common/utils/ErrorCheckUtils.js"
import {ButtonAttrs, ButtonN, ButtonType} from "../gui/base/ButtonN.js"
import {LoginController, logins} from "../api/main/LoginController.js"
import {locator} from "../api/main/MainLocator.js"
import {CustomerProperties, CustomerPropertiesTypeRef, CustomerTypeRef} from "../api/entities/sys/TypeRefs.js"
import {EntityClient} from "../api/common/EntityClient.js"
import {EntityUpdateData, EventController, isUpdateForTypeRef} from "../api/main/EventController.js"


const PRESELECTED_LIKERT_VALUE = null

type ExperienceSamplingOptions = {
	title?: lazy<string> | string,
	explanationText?: TranslationKey | lazy<string>,
	perMetric: {
		[key: string]: {
			question: TranslationKey | lazy<string>,
			answerOptions: Array<string>,
		}
	}
}

export async function showExperienceSamplingDialog(stage: Stage, experienceSamplingOptions: ExperienceSamplingOptions): Promise<void> {
	const likertMetrics = Array.from(stage.metricConfigs.values()).filter(metricConfig => metricConfig.type as UsageTestMetricType === UsageTestMetricType.Likert)
	const selectedValues = new Map(likertMetrics.map(likertMetric => [likertMetric.name, stream(PRESELECTED_LIKERT_VALUE)]))

	Dialog.showActionDialog({
		type: DialogType.EditMedium,
		okAction: (dialog: Dialog) => {
			for (let [metricName, selectedValue] of selectedValues) {
				const selection = selectedValue()

				if (selection === null) {
					// User did not select an answer
					return Dialog.message("experienceSamplingSelectAnswer_msg")
				}

				stage.setMetric({
					name: metricName,
					value: selection,
				})
			}

			stage.complete().then(() => dialog.close())
			return Dialog.message("experienceSamplingThankYou_msg")
		},
		title: experienceSamplingOptions.title ?? lang.get("experienceSamplingHeader_label"),
		child: () => {
			const children: Array<Children> = []

			if (experienceSamplingOptions.explanationText) {
				const explanationTextLines = lang.getMaybeLazy(experienceSamplingOptions.explanationText).split("\n")

				children.push(m(
					"#dialog-message.text-break.text-prewrap.selectable.scroll",
					[
						explanationTextLines.map(line => m(".text-break.selectable", line))
					]
				))
			}

			for (let likertMetricConfig of likertMetrics) {
				const metricOptions = experienceSamplingOptions["perMetric"][likertMetricConfig.name]

				const answerOptionItems: Array<SelectorItem<string>> = metricOptions.answerOptions.map((answerOption, index) => {
					return {
						name: answerOption,
						value: (index + 1).toString(),
					}
				})

				children.push(m(
					"p.text-prewrap.scroll",
					lang.getMaybeLazy(metricOptions.question)
				))

				children.push(
					m(DropDownSelector, {
						label: "experienceSamplingAnswer_label",
						items: answerOptionItems,
						selectedValue: selectedValues.get(likertMetricConfig.name)!,
					})
				)
			}

			return children
		},
	})
}


export function showUsageTestOptInDialog(): Promise<void> {
	return new Promise(resolve => {
		const lnk = InfoLink.Privacy
		const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot
		let dialog: Dialog

		const closeAction = (optedIn?: boolean) => {
			dialog.close()

			if (optedIn) {
				Dialog.message("userUsageDataOptInThankYouOptedIn_msg")
			} else if (optedIn !== undefined) {
				Dialog.message("userUsageDataOptInThankYouOptedOut_msg")
			}

			resolve()
		}

		const buttonAttrs: Array<ButtonAttrs> = [
			{
				label: "decideLater_action",
				click: () => closeAction(),
				type: ButtonType.Secondary,
			},
			{
				label: "deactivate_action",
				click: () => {
					userSettingsGroupRoot.usageDataOptedIn = false
					locator.entityClient.update(userSettingsGroupRoot)

					closeAction(false)
				},
				type: ButtonType.Secondary,
			},
			{
				label: "activate_action",
				click: () => {
					userSettingsGroupRoot.usageDataOptedIn = true
					locator.entityClient.update(userSettingsGroupRoot)

					closeAction(true)
				},
				type: ButtonType.Primary,
			},
		]
		dialog = new Dialog(DialogType.Reminder, {
			view: () => [
				m(".dialog-contentButtonsBottom.text-break.scroll", [
					m("h1", lang.get("userUsageDataOptIn_title")),
					m("p", lang.get("userUsageDataOptInExplanation_msg")),
					m("ul.usage-test-opt-in-bullets", [
						m("li.list-item-check", lang.get("userUsageDataOptInStatement1_msg")),
						m("li.list-item-check", lang.get("userUsageDataOptInStatement2_msg")),
						m("li.list-item-info", lang.get("userUsageDataOptInStatement3_msg")),
						m("li.list-item-info", lang.get("userUsageDataOptInStatement4_msg")),
					]),
					m("p", lang.get("moreInfo_msg") + " ", m("small.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)])),

				]),
				m(
					".flex-center.dialog-buttons.flex-no-grow-no-shrink-auto",
					buttonAttrs.map(a => m(ButtonN, a)),
				),
			],
		})
			.setCloseHandler(() => closeAction())
			.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: () => closeAction(),
				help: "cancel_action",
			})
			.show()
	})
}

export interface PersistedAssignmentData {
	updatedAt: number
	assignments: UsageTestAssignment[]
	usageModelVersion: number
}

export interface UsageTestStorage {
	getTestDeviceId(): Promise<string | null>

	storeTestDeviceId(testDeviceId: string): Promise<void>

	getAssignments(): Promise<PersistedAssignmentData | null>

	storeAssignments(persistedAssignmentData: PersistedAssignmentData): Promise<void>
}

export class EphemeralUsageTestStorage implements UsageTestStorage {
	private assignments: PersistedAssignmentData | null = null
	private testDeviceId: string | null = null

	getAssignments(): Promise<PersistedAssignmentData | null> {
		return Promise.resolve(this.assignments)
	}

	getTestDeviceId(): Promise<string | null> {
		return Promise.resolve(this.testDeviceId)
	}

	storeAssignments(persistedAssignmentData: PersistedAssignmentData): Promise<void> {
		this.assignments = persistedAssignmentData
		return Promise.resolve()
	}

	storeTestDeviceId(testDeviceId: string): Promise<void> {
		this.testDeviceId = testDeviceId
		return Promise.resolve()
	}

}

export const ASSIGNMENT_UPDATE_INTERVAL_MS = 1000 * 60 * 60 // 1h

export const enum TtlBehavior {
	/* Prefer loading usage test assignments from cache even if they are slightly stale (according to ASSIGNMENT_UPDATE_INTERVAL_MS). */
	PossiblyOutdated,
	/* Always fetch the latest assignments from the server. */
	UpToDateOnly,
}

export const enum StorageBehavior {
	/* Store usage test assignments in the "persistent" storage. Currently, this is the client's instance of DeviceConfig, which uses the browser's local storage.
	Use if the user is logged in and has opted in to sending usage data. */
	Persist,
	/* Store usage test assignments in the "ephemeral" storage. Currently, this is an instance of EphemeralUsageTestStorage.
	Use if the user is not logged in. */
	Ephemeral,
}

export class UsageTestModel implements PingAdapter {
	private storageBehavior = StorageBehavior.Ephemeral
	private customerProperties?: CustomerProperties

	constructor(
		private readonly storages: { [key in StorageBehavior]: UsageTestStorage },
		private readonly dateProvider: DateProvider,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly loginController: LoginController,
		private readonly eventController: EventController,
	) {
		eventController.addEntityListener((updates: ReadonlyArray<EntityUpdateData>) => {
			return this.entityEventsReceived(updates)
		})
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update)) {
				await this.updateCustomerProperties()
			}
		}
	}

	private async updateCustomerProperties() {
		this.customerProperties = await this.entityClient.load(CustomerTypeRef, neverNull(this.loginController.getUserController().user.customer)).then(customer => this.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
	}

	/**
	 * Needs to be called after construction, ideally after login, so that the logged-in user's CustomerProperties are loaded.
	 */
	async init() {
		await this.updateCustomerProperties()
	}

	setStorageBehavior(storageBehavior: StorageBehavior) {
		this.storageBehavior = storageBehavior
	}

	private storage() {
		return this.storages[this.storageBehavior]
	}

	/**
	 * Returns true if the customer has opted out.
	 * Defaults to true if init() has not been called.
	 */
	isCustomerOptedOut(): boolean {
		return this.customerProperties?.usageDataOptedOut ?? true
	}

	/**
	 * Returns true if the opt-in dialog indicator should be shown, depending on the user's and the customer's decisions.
	 * Defaults to false if init() has not been called.
	 */
	showOptInIndicator(): boolean {
		if (!this.loginController.isUserLoggedIn() || this.isCustomerOptedOut()) {
			// shortcut if customer has opted out (or is not logged in)
			return false
		}

		return this.loginController.getUserController().userSettingsGroupRoot.usageDataOptedIn === null
	}

	private getOptInDecision(): boolean {
		if (!this.loginController.isUserLoggedIn()) {
			return false
		}

		const userOptIn = this.loginController.getUserController().userSettingsGroupRoot.usageDataOptedIn

		if (!userOptIn) {
			// shortcut if userOptIn not set or equal to false
			return false
		}

		// customer opt-out overrides the user setting
		return !assertNotNull(this.customerProperties).usageDataOptedOut
	}

	/**
	 * If the storageBehavior is set to StorageBehavior.Persist, then init() must have been called before calling this method.
	 */
	async loadActiveUsageTests(ttlBehavior: TtlBehavior): Promise<UsageTest[]> {
		if (this.storageBehavior === StorageBehavior.Persist && !this.getOptInDecision()) {
			return []
		}

		const persistedData = await this.storage().getAssignments()
		const modelVersion = await this.modelVersion()

		if (persistedData == null ||
			persistedData.usageModelVersion !== modelVersion ||
			(ttlBehavior === TtlBehavior.UpToDateOnly && Date.now() - persistedData.updatedAt > ASSIGNMENT_UPDATE_INTERVAL_MS)
		) {
			return this.assignmentsToTests(await this.loadAssignments())
		} else {
			return this.assignmentsToTests(persistedData.assignments)
		}
	}

	private async modelVersion(): Promise<number> {
		const model = await resolveTypeReference(UsageTestAssignmentTypeRef)
		return filterInt(model.version)
	}

	private async loadAssignments(): Promise<UsageTestAssignment[]> {
		const testDeviceId = await this.storage().getTestDeviceId()
		const data = createUsageTestAssignmentIn({
			testDeviceId: testDeviceId
		})

		try {
			const response: UsageTestAssignmentOut = (testDeviceId)
				? await this.serviceExecutor.put(UsageTestAssignmentService, data, {
					suspensionBehavior: SuspensionBehavior.Throw,
				})
				: await this.serviceExecutor.post(UsageTestAssignmentService, data, {
					suspensionBehavior: SuspensionBehavior.Throw,
				})
			await this.storage().storeTestDeviceId(response.testDeviceId)
			await this.storage().storeAssignments({
				assignments: response.assignments,
				updatedAt: this.dateProvider.now(),
				usageModelVersion: await this.modelVersion(),
			})

			return response.assignments
		} catch (e) {
			if (e instanceof SuspensionError) {
				console.log("rate-limit for new assignments reached, disabling tests")
				return []
			} else if (isOfflineError(e)) {
				console.log("offline, disabling tests")
				return []
			}

			throw e
		}
	}

	private assignmentsToTests(assignments: UsageTestAssignment[]): UsageTest[] {
		return assignments.map(usageTestAssignment => {
			const test = new UsageTest(
				usageTestAssignment.testId,
				usageTestAssignment.name,
				Number(usageTestAssignment.variant),
				usageTestAssignment.sendPings,
			)

			for (const [index, stageConfig] of usageTestAssignment.stages.entries()) {
				const stage = new Stage(index, test)
				stageConfig.metrics.forEach(metricConfig => {
					const configValues = new Map<string, string>()

					metricConfig.configValues.forEach(metricConfigValue => {
						configValues.set(metricConfigValue.key, metricConfigValue.value)
					})

					stage.setMetricConfig({
						name: metricConfig.name,
						type: metricConfig.type,
						configValues,
					})
				})

				test.addStage(stage)
			}

			return test
		})
	}

	async sendPing(test: UsageTest, stage: Stage): Promise<void> {
		// Immediately stop sending pings if the user has opted out.
		// Only applicable if the user opts out and then does not re-log.
		if (this.storageBehavior === StorageBehavior.Persist && !this.getOptInDecision()) {
			return
		}

		const testDeviceId = await this.storage().getTestDeviceId()
		if (testDeviceId == null) {
			console.warn("No device id set before sending pings")
			return
		}

		const metrics = Array.from(stage.collectedMetrics).map(([key, {name, value}]) =>
			createUsageTestMetricData({
				name: name,
				value: value,
			}))

		const data = createUsageTestParticipationIn({
			testId: test.testId,
			metrics,
			stage: stage.number.toString(),
			testDeviceId: testDeviceId,
		})

		try {
			await this.serviceExecutor.post(UsageTestParticipationService, data, {
				suspensionBehavior: SuspensionBehavior.Throw,
			})
		} catch (e) {
			if (e instanceof SuspensionError) {
				test.active = false
				console.log("rate-limit for pings reached")
			} else if (e instanceof PreconditionFailedError) {
				if (e.data === "invalid_state") {
					test.active = false
					console.log("Tried to send ping for paused test", e)
				} else if (e.data === "invalid_restart") {
					test.active = false
					console.log("Tried to restart test in ParticipationMode.Once that device has already participated in", e)
				} else if (e.data === "invalid_stage") {
					console.log("Tried to send ping for wrong stage", e)
				} else {
					throw e
				}
			} else if (e instanceof NotFoundError) {
				// Cached assignments are likely out of date if we run into a NotFoundError here.
				// We should not attempt to re-send pings, as the relevant test has likely been deleted.
				// Hence, we just remove the cached assignment and disable the test.
				test.active = false
				console.log(`Tried to send ping. Removing test '${test.testId}' from storage`, e)

				const storedAssignments = await this.storage().getAssignments()
				if (storedAssignments) {
					await this.storage().storeAssignments({
						updatedAt: storedAssignments.updatedAt,
						usageModelVersion: storedAssignments.usageModelVersion,
						assignments: storedAssignments.assignments.filter(assignment => assignment.testId !== test.testId),
					})
				}
			} else if (isOfflineError(e)) {
				console.log("Tried to send ping, but we are offline", e)
			} else {
				throw e
			}
		}
	}
}
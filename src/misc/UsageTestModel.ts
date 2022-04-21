import {
	createUsageTestAssignmentIn,
	createUsageTestMetricData,
	createUsageTestParticipationIn,
	UsageTestAssignment,
	UsageTestAssignmentOut,
	UsageTestAssignmentTypeRef,
} from "../api/entities/usage/TypeRefs.js"
import {PingAdapter, Stage, UsageTest} from "@tutao/tutanota-usagetests"
import {filterInt, lazy} from "@tutao/tutanota-utils"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {SuspensionError} from "../api/common/error/SuspensionError"
import {SuspensionBehavior} from "../api/worker/rest/RestClient"
import {DateProvider} from "../api/common/DateProvider.js"
import {IServiceExecutor} from "../api/common/ServiceRequest"
import {UsageTestAssignmentService, UsageTestParticipationService} from "../api/entities/usage/Services.js"
import {resolveTypeReference} from "../api/common/EntityFunctions"
import {lang, TranslationKey} from "./LanguageViewModel"
import stream from "mithril/stream"
import {Dialog} from "../gui/base/Dialog"
import m, {Children} from "mithril"
import {DropDownSelectorN, SelectorItem} from "../gui/base/DropDownSelectorN"
import {UsageTestMetricType} from "../api/common/TutanotaConstants"


const PRESELECTED_LIKERT_VALUE = "3"

type ExperienceSamplingOptions = {
	title?: lazy<string> | string,
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
		okAction: (dialog: Dialog) => {
			for (let [metricName, selectedValue] of selectedValues) {
				stage.setMetric({
					name: metricName,
					value: selectedValue(),
				})
			}

			stage.complete().then(() => dialog.close())
			return Dialog.message("experienceSampling_thankYou_msg")
		},
		title: experienceSamplingOptions.title ?? lang.get("experienceSampling_header_label"),
		child: () => {
			const children: Array<Children> = []

			for (let likertMetricConfig of likertMetrics) {
				const metricOptions = experienceSamplingOptions["perMetric"][likertMetricConfig.name]

				const answerOptionItems: Array<SelectorItem<string>> = metricOptions.answerOptions.map((answerOption, index) => {
					return {
						name: answerOption,
						value: (index + 1).toString(),
					}
				})

				children.push(
					m(DropDownSelectorN, {
						label: metricOptions.question,
						items: answerOptionItems,
						selectedValue: selectedValues.get(likertMetricConfig.name)!,
					})
				)
			}

			return children
		},
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

export const ASSIGNMENT_UPDATE_INTERVAL_MS = 1000 * 60 * 60 // 1h

export const enum TtlBehavior {
	PossiblyOutdated,
	UpToDateOnly,
}

const USAGE_TESTS_ENABLED = true

export class UsageTestModel implements PingAdapter {

	constructor(
		private readonly testStorage: UsageTestStorage,
		private readonly dateProvider: DateProvider,
		private readonly serviceExecutor: IServiceExecutor,
	) {
	}

	async loadActiveUsageTests(ttlBehavior: TtlBehavior): Promise<UsageTest[]> {
		if (!USAGE_TESTS_ENABLED) return []

		const persistedData = await this.testStorage.getAssignments()
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
		const testDeviceId = await this.testStorage.getTestDeviceId()

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
			await this.testStorage.storeTestDeviceId(response.testDeviceId)
			await this.testStorage.storeAssignments({
				assignments: response.assignments,
				updatedAt: this.dateProvider.now(),
				usageModelVersion: await this.modelVersion(),
			})

			return response.assignments
		} catch (e) {
			if (e instanceof SuspensionError) {
				console.log("rate-limit for new assignments reached, disabling tests")
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
		const testDeviceId = await this.testStorage.getTestDeviceId()
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
			await this.serviceExecutor.post(UsageTestParticipationService, data)
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

				const storedAssignments = await this.testStorage.getAssignments()
				if (storedAssignments) {
					await this.testStorage.storeAssignments({
						updatedAt: storedAssignments.updatedAt,
						usageModelVersion: storedAssignments.usageModelVersion,
						assignments: storedAssignments.assignments.filter(assignment => assignment.testId !== test.testId),
					})
				}
			} else {
				throw e
			}
		}
	}
}
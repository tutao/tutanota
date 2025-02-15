import { __toESM } from "./chunk-chunk.js";
import { TypeRef, assertNotNull, filterInt, neverNull } from "./dist2-chunk.js";
import { create } from "./EntityUtils-chunk.js";
import { UserSettingsGroupRootTypeRef, createUserSettingsGroupRoot } from "./TypeRefs-chunk.js";
import { CustomerPropertiesTypeRef, CustomerTypeRef } from "./TypeRefs2-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { resolveTypeReference, typeModels$1 as typeModels } from "./EntityFunctions-chunk.js";
import { isOfflineError } from "./ErrorUtils-chunk.js";
import { BadRequestError, NotFoundError, PreconditionFailedError } from "./RestError-chunk.js";
import { SuspensionError } from "./SuspensionError-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { SuspensionBehavior } from "./RestClient-chunk.js";

//#region packages/tutanota-usagetests/dist/model/Stage.js
var Stage = class {
	number;
	test;
	minPings;
	maxPings;
	collectedMetrics = new Map();
	metricConfigs = new Map();
	constructor(number, test, minPings, maxPings) {
		this.number = number;
		this.test = test;
		this.minPings = minPings;
		this.maxPings = maxPings;
	}
	/**
	* Attempts to complete the stage and returns true if a ping has been sent successfully.
	*/
	async complete() {
		return await this.test.completeStage(this);
	}
	setMetric(metric) {
		this.collectedMetrics.set(metric.name, metric);
	}
	setMetricConfig(metricConfig) {
		this.metricConfigs.set(metricConfig.name, metricConfig);
	}
};
var ObsoleteStage = class extends Stage {
	async complete() {
		return true;
	}
	setMetric(metric) {}
};

//#endregion
//#region packages/tutanota-usagetests/dist/model/UsageTest.js
const NO_PARTICIPATION_VARIANT = 0;
var UsageTest = class {
	testId;
	testName;
	variant;
	active;
	stages = new Map();
	pingAdapter;
	lastCompletedStage = 0;
	meta = {};
	/**
	* Enabling this makes it possible to restart a test even if the last stage has not been sent.
	*/
	allowEarlyRestarts = false;
	sentPings = 0;
	started = false;
	recordTime = false;
	lastPingDate;
	constructor(testId, testName, variant, active) {
		this.testId = testId;
		this.testName = testName;
		this.variant = variant;
		this.active = active;
	}
	/**
	Tries to restart the test (by sending stage 0) regardless of the allowEarlyRestarts setting
	*/
	forceRestart() {
		return this.completeStage(this.getStage(0), true);
	}
	isStarted() {
		return this.started;
	}
	getStage(stageNum) {
		const stage = this.stages.get(stageNum);
		if (!stage) {
			console.log(`Stage ${stageNum} is not registered, meaning that test '${this.testName}' is likely misconfigured`);
			return new ObsoleteStage(0, this, 0, 0);
		}
		return stage;
	}
	addStage(stage) {
		if (this.stages.get(stage.number)) throw new Error(`Stage ${stage.number} is already registered`);
		this.stages.set(stage.number, stage);
		return stage;
	}
	getVariant(variants) {
		return variants[this.variant]();
	}
	/**
	* Completes a range of stages in the case that we want to make sure that previous stages are/have been sent.
	*
	* Useful when reaching a stage necessitates (and implies) that all previous stages have been sent successfully.
	*/
	async completeRange(start, end) {
		for (let i = start; i <= end; i++) await this.getStage(i).complete();
	}
	/**
	* Should not be used directly. Use stage.complete() instead.
	*/
	async completeStage(stage, forceRestart = false) {
		if (!this.pingAdapter) throw new Error("no ping adapter has been registered");
else if (this.variant === NO_PARTICIPATION_VARIANT || !this.active) return false;
else if (this.sentPings >= stage.maxPings && this.lastCompletedStage === stage.number && (stage.number !== 0 || !this.allowEarlyRestarts)) {
			console.log(`Not sending ping for stage (${stage.number}) of test '${this.testId}' because maxPings=${stage.maxPings} has been reached`);
			return false;
		} else if (!forceRestart && !this.allowEarlyRestarts && this.isStarted() && stage.number === 0 && this.lastCompletedStage !== this.stages.size - 1) {
			console.log(`Cannot restart test '${this.testName}' because allowEarlyRestarts=false and the final stage has not been reached`);
			return false;
		} else if (stage.number < this.lastCompletedStage && stage.number !== 0) {
			console.log(`Cannot send ping for stage (${stage.number}) of test '${this.testId}' because stage ${this.lastCompletedStage} has already been sent`);
			return false;
		}
		for (let i = this.lastCompletedStage + 1; i < stage.number; i++) {
			let currentStage = this.stages.get(i);
			if (!!currentStage && currentStage.minPings != 0) {
				console.log(`Not sending ping for stage (${stage.number}) in wrong order of test '${this.testId}' because stage ${currentStage.number} is not finished`);
				return false;
			}
		}
		console.log(`Test '${this.testName}': Completing stage ${stage.number}, variant ${this.variant}`);
		this.sentPings = stage.number === this.lastCompletedStage ? this.sentPings + 1 : 1;
		this.lastCompletedStage = stage.number;
		if (this.recordTime) {
			const currentDate = new Date();
			if (stage.number > 0) {
				const secondsPassed = this.lastPingDate ? (currentDate.getTime() - this.lastPingDate.getTime()) / 1e3 : 0;
				stage.setMetric({
					name: "secondsPassed",
					value: secondsPassed.toString()
				});
			}
			this.lastPingDate = currentDate;
		}
		await this.pingAdapter.sendPing(this, stage);
		this.started = true;
		return true;
	}
};
var ObsoleteUsageTest = class extends UsageTest {
	obsoleteStage;
	constructor(testId, testName, variant) {
		super(testId, testName, variant, false);
		this.obsoleteStage = new ObsoleteStage(0, this, 1, 1);
	}
	getStage(stageNum) {
		return this.obsoleteStage;
	}
	addStage(stage) {
		return this.obsoleteStage;
	}
	getVariant(variants) {
		return variants[0]();
	}
	async completeStage(stage) {
		return true;
	}
};

//#endregion
//#region packages/tutanota-usagetests/dist/model/UsageTestController.js
var UsageTestController = class {
	pingAdapter;
	tests = new Map();
	obsoleteUsageTest = new ObsoleteUsageTest("obsolete", "obsolete", 0);
	constructor(pingAdapter) {
		this.pingAdapter = pingAdapter;
	}
	addTest(test) {
		test.pingAdapter = this.pingAdapter;
		this.tests.set(test.testId, test);
	}
	addTests(tests) {
		for (let test of tests) this.addTest(test);
	}
	setTests(tests) {
		this.tests.clear();
		this.addTests(tests);
	}
	/**
	* Searches a test first by its ID and then, if no match is found, by its name.
	* If no test matches by name either, then we assume that the test is finished and the server no longer sends assignments for it.
	* In that case, we want to render the no-participation variant, so a sham test instance needs to be returned.
	*
	* @param testIdOrName The test's ID or its name
	*/
	getTest(testIdOrName) {
		let result = this.tests.get(testIdOrName);
		if (result) return result;
		for (let test of this.tests.values()) if (test.testName === testIdOrName) return test;
		console.log(`Test '${testIdOrName}' not found, using obsolete...`);
		return this.obsoleteUsageTest;
	}
	/**
	* some components are used in multiple places, but only want to do a test in one of them.
	* use this to get a test that always renders variant 0 and doesn't send pings.
	*/
	getObsoleteTest() {
		return this.obsoleteUsageTest;
	}
};

//#endregion
//#region src/common/api/entities/usage/TypeRefs.ts
const UsageTestAssignmentTypeRef = new TypeRef("usage", "UsageTestAssignment");
const UsageTestAssignmentInTypeRef = new TypeRef("usage", "UsageTestAssignmentIn");
function createUsageTestAssignmentIn(values) {
	return Object.assign(create(typeModels.UsageTestAssignmentIn, UsageTestAssignmentInTypeRef), values);
}
const UsageTestAssignmentOutTypeRef = new TypeRef("usage", "UsageTestAssignmentOut");
const UsageTestMetricConfigTypeRef = new TypeRef("usage", "UsageTestMetricConfig");
const UsageTestMetricConfigValueTypeRef = new TypeRef("usage", "UsageTestMetricConfigValue");
const UsageTestMetricDataTypeRef = new TypeRef("usage", "UsageTestMetricData");
function createUsageTestMetricData(values) {
	return Object.assign(create(typeModels.UsageTestMetricData, UsageTestMetricDataTypeRef), values);
}
const UsageTestParticipationInTypeRef = new TypeRef("usage", "UsageTestParticipationIn");
function createUsageTestParticipationIn(values) {
	return Object.assign(create(typeModels.UsageTestParticipationIn, UsageTestParticipationInTypeRef), values);
}
const UsageTestStageTypeRef = new TypeRef("usage", "UsageTestStage");

//#endregion
//#region src/common/api/entities/usage/Services.ts
const UsageTestAssignmentService = Object.freeze({
	app: "usage",
	name: "UsageTestAssignmentService",
	get: null,
	post: {
		data: UsageTestAssignmentInTypeRef,
		return: UsageTestAssignmentOutTypeRef
	},
	put: {
		data: UsageTestAssignmentInTypeRef,
		return: UsageTestAssignmentOutTypeRef
	},
	delete: null
});
const UsageTestParticipationService = Object.freeze({
	app: "usage",
	name: "UsageTestParticipationService",
	get: null,
	post: {
		data: UsageTestParticipationInTypeRef,
		return: null
	},
	put: null,
	delete: null
});

//#endregion
//#region src/common/misc/UsageTestModel.ts
var import_stream = __toESM(require_stream(), 1);
var EphemeralUsageTestStorage = class {
	assignments = null;
	testDeviceId = null;
	getAssignments() {
		return Promise.resolve(this.assignments);
	}
	getTestDeviceId() {
		return Promise.resolve(this.testDeviceId);
	}
	storeAssignments(persistedAssignmentData) {
		this.assignments = persistedAssignmentData;
		return Promise.resolve();
	}
	storeTestDeviceId(testDeviceId) {
		this.testDeviceId = testDeviceId;
		return Promise.resolve();
	}
};
const ASSIGNMENT_UPDATE_INTERVAL_MS = 36e5;
let StorageBehavior = function(StorageBehavior$1) {
	StorageBehavior$1[StorageBehavior$1["Persist"] = 0] = "Persist";
	StorageBehavior$1[StorageBehavior$1["Ephemeral"] = 1] = "Ephemeral";
	return StorageBehavior$1;
}({});
var UsageTestModel = class {
	storageBehavior = StorageBehavior.Ephemeral;
	customerProperties;
	lastOptInDecision = null;
	lastPing = Promise.resolve();
	constructor(storages, dateProvider, serviceExecutor, entityClient, loginController, eventController, usageTestController) {
		this.storages = storages;
		this.dateProvider = dateProvider;
		this.serviceExecutor = serviceExecutor;
		this.entityClient = entityClient;
		this.loginController = loginController;
		this.eventController = eventController;
		this.usageTestController = usageTestController;
		eventController.addEntityListener((updates) => {
			return this.entityEventsReceived(updates);
		});
	}
	async entityEventsReceived(updates) {
		for (const update of updates) if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update)) {
			await this.loginController.waitForFullLogin();
			await this.updateCustomerProperties();
		} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
			await this.loginController.waitForFullLogin();
			const updatedOptInDecision = this.loginController.getUserController().userSettingsGroupRoot.usageDataOptedIn;
			if (this.lastOptInDecision === updatedOptInDecision) return;
			const tests = await this.loadActiveUsageTests();
			this.usageTestController().setTests(tests);
			this.lastOptInDecision = updatedOptInDecision;
		}
	}
	/**
	* only for usage from the console. may have unintended consequences when used too early or too late.
	* @param test the name of the test to change the variant on
	* @param variant the number of the variant to use from here on
	*/
	setVariant(test, variant) {
		this.usageTestController().getTest(test).variant = variant;
	}
	async updateCustomerProperties() {
		const customer = await this.entityClient.load(CustomerTypeRef, neverNull(this.loginController.getUserController().user.customer));
		this.customerProperties = await this.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties));
	}
	/**
	* Needs to be called after construction, ideally after login, so that the logged-in user's CustomerProperties are loaded.
	*/
	async init() {
		await this.updateCustomerProperties();
	}
	setStorageBehavior(storageBehavior) {
		this.storageBehavior = storageBehavior;
	}
	storage() {
		return this.storages[this.storageBehavior];
	}
	/**
	* Returns true if the customer has opted out.
	* Defaults to true if init() has not been called.
	*/
	isCustomerOptedOut() {
		return this.customerProperties?.usageDataOptedOut ?? true;
	}
	/**
	* Returns true if the opt-in dialog indicator should be shown, depending on the user's and the customer's decisions.
	* Defaults to false if init() has not been called.
	*/
	showOptInIndicator() {
		if (!this.loginController.isUserLoggedIn() || this.isCustomerOptedOut()) return false;
		return this.loginController.getUserController().userSettingsGroupRoot.usageDataOptedIn === null;
	}
	/**
	* Sets the user's usage data opt-in decision. True means they opt in.
	*
	* Immediately refetches the user's active usage tests if they opted in.
	*/
	async setOptInDecision(decision) {
		const userSettingsGroupRoot = createUserSettingsGroupRoot(this.loginController.getUserController().userSettingsGroupRoot);
		userSettingsGroupRoot.usageDataOptedIn = decision;
		await this.entityClient.update(userSettingsGroupRoot);
		this.lastOptInDecision = decision;
		const tests = decision ? await this.doLoadActiveUsageTests() : [];
		this.usageTestController().setTests(tests);
	}
	getOptInDecision() {
		if (!this.loginController.isUserLoggedIn()) return false;
		const userOptIn = this.loginController.getUserController().userSettingsGroupRoot.usageDataOptedIn;
		if (!userOptIn) return false;
		return !assertNotNull(this.customerProperties).usageDataOptedOut;
	}
	/**
	* If the storageBehavior is set to StorageBehavior.Persist, then init() must have been called before calling this method.
	*/
	async loadActiveUsageTests() {
		if (this.storageBehavior === StorageBehavior.Persist && !this.getOptInDecision()) return [];
		return await this.doLoadActiveUsageTests();
	}
	async doLoadActiveUsageTests() {
		const persistedData = await this.storage().getAssignments();
		const modelVersion = await this.modelVersion();
		if (persistedData == null || persistedData.usageModelVersion !== modelVersion || Date.now() - persistedData.updatedAt > ASSIGNMENT_UPDATE_INTERVAL_MS) return this.assignmentsToTests(await this.loadAssignments());
else return this.assignmentsToTests(persistedData.assignments);
	}
	async modelVersion() {
		const model = await resolveTypeReference(UsageTestAssignmentTypeRef);
		return filterInt(model.version);
	}
	async loadAssignments() {
		const testDeviceId = await this.storage().getTestDeviceId();
		const data = createUsageTestAssignmentIn({ testDeviceId });
		try {
			const response = testDeviceId ? await this.serviceExecutor.put(UsageTestAssignmentService, data, { suspensionBehavior: SuspensionBehavior.Throw }) : await this.serviceExecutor.post(UsageTestAssignmentService, data, { suspensionBehavior: SuspensionBehavior.Throw });
			await this.storage().storeTestDeviceId(response.testDeviceId);
			await this.storage().storeAssignments({
				assignments: response.assignments,
				updatedAt: this.dateProvider.now(),
				usageModelVersion: await this.modelVersion()
			});
			return response.assignments;
		} catch (e) {
			if (e instanceof SuspensionError) {
				console.log("rate-limit for new assignments reached, disabling tests");
				return [];
			} else if (isOfflineError(e)) {
				console.log("offline, disabling tests");
				return [];
			}
			throw e;
		}
	}
	assignmentsToTests(assignments) {
		return assignments.map((usageTestAssignment) => {
			const test = new UsageTest(usageTestAssignment.testId, usageTestAssignment.name, Number(usageTestAssignment.variant), usageTestAssignment.sendPings);
			for (const [index, stageConfig] of usageTestAssignment.stages.entries()) {
				const stage = new Stage(index, test, Number(stageConfig.minPings), Number(stageConfig.maxPings));
				for (const metricConfig of stageConfig.metrics) {
					const configValues = new Map();
					for (const metricConfigValue of metricConfig.configValues) configValues.set(metricConfigValue.key, metricConfigValue.value);
					stage.setMetricConfig({
						name: metricConfig.name,
						type: metricConfig.type,
						configValues
					});
				}
				test.addStage(stage);
			}
			return test;
		});
	}
	async sendPing(test, stage) {
		this.lastPing = this.lastPing.then(() => this.doSendPing(stage, test), () => this.doSendPing(stage, test));
		return this.lastPing;
	}
	async doSendPing(stage, test) {
		if (this.storageBehavior === StorageBehavior.Persist && !this.getOptInDecision()) return;
		const testDeviceId = await this.storage().getTestDeviceId();
		if (testDeviceId == null) {
			console.warn("No device id set before sending pings");
			return;
		}
		const metrics = Array.from(stage.collectedMetrics).map(([key, { name, value }]) => createUsageTestMetricData({
			name,
			value
		}));
		const data = createUsageTestParticipationIn({
			testId: test.testId,
			metrics,
			stage: stage.number.toString(),
			testDeviceId
		});
		try {
			await this.serviceExecutor.post(UsageTestParticipationService, data, { suspensionBehavior: SuspensionBehavior.Throw });
		} catch (e) {
			if (e instanceof SuspensionError) {
				test.active = false;
				console.log("rate-limit for pings reached");
			} else if (e instanceof PreconditionFailedError) if (e.data === "invalid_state") {
				test.active = false;
				console.log(`Tried to send ping for paused test ${test.testName}`, e);
			} else if (e.data === "invalid_restart") {
				test.active = false;
				console.log(`Tried to restart test '${test.testName}' in ParticipationMode.Once that device has already participated in`, e);
			} else if (e.data === "invalid_stage") console.log(`Tried to send ping for wrong stage ${stage.number} of test '${test.testName}'`, e);
else if (e.data === "invalid_stage_skip") console.log(`Tried to skip a required stage before stage ${stage.number} of test '${test.testName}'`, e);
else if (e.data === "invalid_stage_repetition") console.log(`Tried to repeat stage ${stage.number} of test '${test.testName}' too many times`, e);
else throw e;
else if (e instanceof NotFoundError) {
				test.active = false;
				console.log(`Tried to send ping. Removing test '${test.testName}' from storage`, e);
				const storedAssignments = await this.storage().getAssignments();
				if (storedAssignments) await this.storage().storeAssignments({
					updatedAt: storedAssignments.updatedAt,
					usageModelVersion: storedAssignments.usageModelVersion,
					assignments: storedAssignments.assignments.filter((assignment) => assignment.testId !== test.testId)
				});
			} else if (e instanceof BadRequestError) {
				test.active = false;
				console.log(`Tried to send ping. Setting test '${test.testName}' inactive because it is misconfigured`, e);
			} else if (isOfflineError(e)) console.log("Tried to send ping, but we are offline", e);
else throw e;
		}
	}
};

//#endregion
export { EphemeralUsageTestStorage, StorageBehavior, UsageTestController, UsageTestModel };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNhZ2VUZXN0TW9kZWwtY2h1bmsuanMiLCJuYW1lcyI6WyJVc2FnZVRlc3RBc3NpZ25tZW50VHlwZVJlZjogVHlwZVJlZjxVc2FnZVRlc3RBc3NpZ25tZW50PiIsIlVzYWdlVGVzdEFzc2lnbm1lbnRJblR5cGVSZWY6IFR5cGVSZWY8VXNhZ2VUZXN0QXNzaWdubWVudEluPiIsInZhbHVlczogU3RyaXBwZWRFbnRpdHk8VXNhZ2VUZXN0QXNzaWdubWVudEluPiIsIlVzYWdlVGVzdEFzc2lnbm1lbnRPdXRUeXBlUmVmOiBUeXBlUmVmPFVzYWdlVGVzdEFzc2lnbm1lbnRPdXQ+IiwiVXNhZ2VUZXN0TWV0cmljQ29uZmlnVHlwZVJlZjogVHlwZVJlZjxVc2FnZVRlc3RNZXRyaWNDb25maWc+IiwiVXNhZ2VUZXN0TWV0cmljQ29uZmlnVmFsdWVUeXBlUmVmOiBUeXBlUmVmPFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1ZhbHVlPiIsIlVzYWdlVGVzdE1ldHJpY0RhdGFUeXBlUmVmOiBUeXBlUmVmPFVzYWdlVGVzdE1ldHJpY0RhdGE+IiwidmFsdWVzOiBTdHJpcHBlZEVudGl0eTxVc2FnZVRlc3RNZXRyaWNEYXRhPiIsIlVzYWdlVGVzdFBhcnRpY2lwYXRpb25JblR5cGVSZWY6IFR5cGVSZWY8VXNhZ2VUZXN0UGFydGljaXBhdGlvbkluPiIsInZhbHVlczogU3RyaXBwZWRFbnRpdHk8VXNhZ2VUZXN0UGFydGljaXBhdGlvbkluPiIsIlVzYWdlVGVzdFN0YWdlVHlwZVJlZjogVHlwZVJlZjxVc2FnZVRlc3RTdGFnZT4iLCJwZXJzaXN0ZWRBc3NpZ25tZW50RGF0YTogUGVyc2lzdGVkQXNzaWdubWVudERhdGEiLCJ0ZXN0RGV2aWNlSWQ6IHN0cmluZyIsInN0b3JhZ2VzOiB7IFtrZXkgaW4gU3RvcmFnZUJlaGF2aW9yXTogVXNhZ2VUZXN0U3RvcmFnZSB9IiwiZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIiLCJzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyIiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJ1c2FnZVRlc3RDb250cm9sbGVyOiAoKSA9PiBVc2FnZVRlc3RDb250cm9sbGVyIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsInRlc3Q6IHN0cmluZyIsInZhcmlhbnQ6IG51bWJlciIsInN0b3JhZ2VCZWhhdmlvcjogU3RvcmFnZUJlaGF2aW9yIiwiZGVjaXNpb246IGJvb2xlYW4iLCJyZXNwb25zZTogVXNhZ2VUZXN0QXNzaWdubWVudE91dCIsImFzc2lnbm1lbnRzOiBVc2FnZVRlc3RBc3NpZ25tZW50W10iLCJ0ZXN0OiBVc2FnZVRlc3QiLCJzdGFnZTogU3RhZ2UiXSwic291cmNlcyI6WyIuLi9wYWNrYWdlcy90dXRhbm90YS11c2FnZXRlc3RzL2Rpc3QvbW9kZWwvU3RhZ2UuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11c2FnZXRlc3RzL2Rpc3QvbW9kZWwvVXNhZ2VUZXN0LmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtdXNhZ2V0ZXN0cy9kaXN0L21vZGVsL1VzYWdlVGVzdENvbnRyb2xsZXIuanMiLCIuLi9zcmMvY29tbW9uL2FwaS9lbnRpdGllcy91c2FnZS9UeXBlUmVmcy50cyIsIi4uL3NyYy9jb21tb24vYXBpL2VudGl0aWVzL3VzYWdlL1NlcnZpY2VzLnRzIiwiLi4vc3JjL2NvbW1vbi9taXNjL1VzYWdlVGVzdE1vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBPbmUgcGFydCBvZiB0aGUgdGVzdC4gSGFzIG11bHRpcGxlIG1ldHJpY3MgdGhhdCBhcmUgc2VudCB0b2dldGhlci4gKi9cbmV4cG9ydCBjbGFzcyBTdGFnZSB7XG4gICAgbnVtYmVyO1xuICAgIHRlc3Q7XG4gICAgbWluUGluZ3M7XG4gICAgbWF4UGluZ3M7XG4gICAgY29sbGVjdGVkTWV0cmljcyA9IG5ldyBNYXAoKTtcbiAgICBtZXRyaWNDb25maWdzID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0cnVjdG9yKG51bWJlciwgdGVzdCwgbWluUGluZ3MsIG1heFBpbmdzKSB7XG4gICAgICAgIHRoaXMubnVtYmVyID0gbnVtYmVyO1xuICAgICAgICB0aGlzLnRlc3QgPSB0ZXN0O1xuICAgICAgICB0aGlzLm1pblBpbmdzID0gbWluUGluZ3M7XG4gICAgICAgIHRoaXMubWF4UGluZ3MgPSBtYXhQaW5ncztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXR0ZW1wdHMgdG8gY29tcGxldGUgdGhlIHN0YWdlIGFuZCByZXR1cm5zIHRydWUgaWYgYSBwaW5nIGhhcyBiZWVuIHNlbnQgc3VjY2Vzc2Z1bGx5LlxuICAgICAqL1xuICAgIGFzeW5jIGNvbXBsZXRlKCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy50ZXN0LmNvbXBsZXRlU3RhZ2UodGhpcyk7XG4gICAgfVxuICAgIHNldE1ldHJpYyhtZXRyaWMpIHtcbiAgICAgICAgdGhpcy5jb2xsZWN0ZWRNZXRyaWNzLnNldChtZXRyaWMubmFtZSwgbWV0cmljKTtcbiAgICB9XG4gICAgc2V0TWV0cmljQ29uZmlnKG1ldHJpY0NvbmZpZykge1xuICAgICAgICB0aGlzLm1ldHJpY0NvbmZpZ3Muc2V0KG1ldHJpY0NvbmZpZy5uYW1lLCBtZXRyaWNDb25maWcpO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBPYnNvbGV0ZVN0YWdlIGV4dGVuZHMgU3RhZ2Uge1xuICAgIGFzeW5jIGNvbXBsZXRlKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgc2V0TWV0cmljKG1ldHJpYykge1xuICAgICAgICAvLyBubyBvcFxuICAgIH1cbn1cbiIsImltcG9ydCB7IE9ic29sZXRlU3RhZ2UgfSBmcm9tIFwiLi9TdGFnZS5qc1wiO1xuY29uc3QgTk9fUEFSVElDSVBBVElPTl9WQVJJQU5UID0gMDtcbmNvbnN0IEFTU0lHTk1FTlRfU1RBR0UgPSAtMTtcbi8qKiBIb2xkcyBhbGwgdmFyaWFudHMgYW5kIGNhbiByZW5kZXIgY3VycmVudCB2YXJpYW50LiBDb21iaW5lcyBhIHRlc3QncyBjb25maWcgYW5kIHRoZSB1c2VyJ3MgYXNzaWdubWVudC4gKi9cbmV4cG9ydCBjbGFzcyBVc2FnZVRlc3Qge1xuICAgIHRlc3RJZDtcbiAgICB0ZXN0TmFtZTtcbiAgICB2YXJpYW50O1xuICAgIGFjdGl2ZTtcbiAgICBzdGFnZXMgPSBuZXcgTWFwKCk7XG4gICAgcGluZ0FkYXB0ZXI7XG4gICAgbGFzdENvbXBsZXRlZFN0YWdlID0gMDtcbiAgICAvLyBzdG9yYWdlIGZvciBkYXRhIHRoYXQgaXMgYWdncmVnYXRlZCBhY3Jvc3Mgc3RhZ2VzIGFuZCBzZW50IGF0IHNvbWUgcG9pbnRcbiAgICBtZXRhID0ge307XG4gICAgLyoqXG4gICAgICogRW5hYmxpbmcgdGhpcyBtYWtlcyBpdCBwb3NzaWJsZSB0byByZXN0YXJ0IGEgdGVzdCBldmVuIGlmIHRoZSBsYXN0IHN0YWdlIGhhcyBub3QgYmVlbiBzZW50LlxuICAgICAqL1xuICAgIGFsbG93RWFybHlSZXN0YXJ0cyA9IGZhbHNlO1xuICAgIHNlbnRQaW5ncyA9IDA7XG4gICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgIC8vIEVuYWJsZXMgcmVjb3JkaW5nIHRoZSB0aW1lIHRoYXQgaGFzIHBhc3NlZCBzaW5jZSB0aGUgbGFzdCBwaW5nIChhbmQgYXR0YWNoaW5nIGl0IGFzIGEgbWV0cmljICdzZWNvbmRzUGFzc2VkJylcbiAgICByZWNvcmRUaW1lID0gZmFsc2U7XG4gICAgbGFzdFBpbmdEYXRlO1xuICAgIGNvbnN0cnVjdG9yKHRlc3RJZCwgdGVzdE5hbWUsIHZhcmlhbnQsIGFjdGl2ZSkge1xuICAgICAgICB0aGlzLnRlc3RJZCA9IHRlc3RJZDtcbiAgICAgICAgdGhpcy50ZXN0TmFtZSA9IHRlc3ROYW1lO1xuICAgICAgICB0aGlzLnZhcmlhbnQgPSB2YXJpYW50O1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IGFjdGl2ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVHJpZXMgdG8gcmVzdGFydCB0aGUgdGVzdCAoYnkgc2VuZGluZyBzdGFnZSAwKSByZWdhcmRsZXNzIG9mIHRoZSBhbGxvd0Vhcmx5UmVzdGFydHMgc2V0dGluZ1xuICAgICAqL1xuICAgIGZvcmNlUmVzdGFydCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGxldGVTdGFnZSh0aGlzLmdldFN0YWdlKDApLCB0cnVlKTtcbiAgICB9XG4gICAgaXNTdGFydGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydGVkO1xuICAgIH1cbiAgICBnZXRTdGFnZShzdGFnZU51bSkge1xuICAgICAgICBjb25zdCBzdGFnZSA9IHRoaXMuc3RhZ2VzLmdldChzdGFnZU51bSk7XG4gICAgICAgIGlmICghc3RhZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTdGFnZSAke3N0YWdlTnVtfSBpcyBub3QgcmVnaXN0ZXJlZCwgbWVhbmluZyB0aGF0IHRlc3QgJyR7dGhpcy50ZXN0TmFtZX0nIGlzIGxpa2VseSBtaXNjb25maWd1cmVkYCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE9ic29sZXRlU3RhZ2UoMCwgdGhpcywgMCwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YWdlO1xuICAgIH1cbiAgICBhZGRTdGFnZShzdGFnZSkge1xuICAgICAgICBpZiAodGhpcy5zdGFnZXMuZ2V0KHN0YWdlLm51bWJlcikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgU3RhZ2UgJHtzdGFnZS5udW1iZXJ9IGlzIGFscmVhZHkgcmVnaXN0ZXJlZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhZ2VzLnNldChzdGFnZS5udW1iZXIsIHN0YWdlKTtcbiAgICAgICAgcmV0dXJuIHN0YWdlO1xuICAgIH1cbiAgICBnZXRWYXJpYW50KHZhcmlhbnRzKSB7XG4gICAgICAgIHJldHVybiB2YXJpYW50c1t0aGlzLnZhcmlhbnRdKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBsZXRlcyBhIHJhbmdlIG9mIHN0YWdlcyBpbiB0aGUgY2FzZSB0aGF0IHdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgcHJldmlvdXMgc3RhZ2VzIGFyZS9oYXZlIGJlZW4gc2VudC5cbiAgICAgKlxuICAgICAqIFVzZWZ1bCB3aGVuIHJlYWNoaW5nIGEgc3RhZ2UgbmVjZXNzaXRhdGVzIChhbmQgaW1wbGllcykgdGhhdCBhbGwgcHJldmlvdXMgc3RhZ2VzIGhhdmUgYmVlbiBzZW50IHN1Y2Nlc3NmdWxseS5cbiAgICAgKi9cbiAgICBhc3luYyBjb21wbGV0ZVJhbmdlKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmdldFN0YWdlKGkpLmNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2hvdWxkIG5vdCBiZSB1c2VkIGRpcmVjdGx5LiBVc2Ugc3RhZ2UuY29tcGxldGUoKSBpbnN0ZWFkLlxuICAgICAqL1xuICAgIGFzeW5jIGNvbXBsZXRlU3RhZ2Uoc3RhZ2UsIGZvcmNlUmVzdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIGlmICghdGhpcy5waW5nQWRhcHRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gcGluZyBhZGFwdGVyIGhhcyBiZWVuIHJlZ2lzdGVyZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy52YXJpYW50ID09PSBOT19QQVJUSUNJUEFUSU9OX1ZBUklBTlQgfHwgIXRoaXMuYWN0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZW50UGluZ3MgPj0gc3RhZ2UubWF4UGluZ3MgJiYgdGhpcy5sYXN0Q29tcGxldGVkU3RhZ2UgPT09IHN0YWdlLm51bWJlciAmJiAoc3RhZ2UubnVtYmVyICE9PSAwIHx8ICF0aGlzLmFsbG93RWFybHlSZXN0YXJ0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBOb3Qgc2VuZGluZyBwaW5nIGZvciBzdGFnZSAoJHtzdGFnZS5udW1iZXJ9KSBvZiB0ZXN0ICcke3RoaXMudGVzdElkfScgYmVjYXVzZSBtYXhQaW5ncz0ke3N0YWdlLm1heFBpbmdzfSBoYXMgYmVlbiByZWFjaGVkYCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWZvcmNlUmVzdGFydCAmJiAhdGhpcy5hbGxvd0Vhcmx5UmVzdGFydHMgJiYgdGhpcy5pc1N0YXJ0ZWQoKSAmJiBzdGFnZS5udW1iZXIgPT09IDAgJiYgdGhpcy5sYXN0Q29tcGxldGVkU3RhZ2UgIT09IHRoaXMuc3RhZ2VzLnNpemUgLSAxKSB7XG4gICAgICAgICAgICAvLyB3ZSB3ZXJlIG5vdCBjb25maWd1cmVkIHRvIHJlc3RhcnQgYW5kIGdvdCBhIGNvbXBsZXRlKCkgZm9yIHRoZSBmaXJzdCBzdGFnZSBhbmQgaGF2ZSBub3QgZmluaXNoZWQgdGhlIHRlc3QgeWV0XG4gICAgICAgICAgICAvLyAtPiB0aGlzIHdvdWxkIGJlIGEgcmVzdGFydCBpbiB0aGUgbWlkZGxlIG9mIHRoZSB0ZXN0XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2Fubm90IHJlc3RhcnQgdGVzdCAnJHt0aGlzLnRlc3ROYW1lfScgYmVjYXVzZSBhbGxvd0Vhcmx5UmVzdGFydHM9ZmFsc2UgYW5kIHRoZSBmaW5hbCBzdGFnZSBoYXMgbm90IGJlZW4gcmVhY2hlZGApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHN0YWdlLm51bWJlciA8IHRoaXMubGFzdENvbXBsZXRlZFN0YWdlICYmIHN0YWdlLm51bWJlciAhPT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYENhbm5vdCBzZW5kIHBpbmcgZm9yIHN0YWdlICgke3N0YWdlLm51bWJlcn0pIG9mIHRlc3QgJyR7dGhpcy50ZXN0SWR9JyBiZWNhdXNlIHN0YWdlICR7dGhpcy5sYXN0Q29tcGxldGVkU3RhZ2V9IGhhcyBhbHJlYWR5IGJlZW4gc2VudGApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxhc3RDb21wbGV0ZWRTdGFnZSArIDE7IGkgPCBzdGFnZS5udW1iZXI7IGkrKykge1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRTdGFnZSA9IHRoaXMuc3RhZ2VzLmdldChpKTtcbiAgICAgICAgICAgIGlmICghIWN1cnJlbnRTdGFnZSAmJiBjdXJyZW50U3RhZ2UubWluUGluZ3MgIT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBOb3Qgc2VuZGluZyBwaW5nIGZvciBzdGFnZSAoJHtzdGFnZS5udW1iZXJ9KSBpbiB3cm9uZyBvcmRlciBvZiB0ZXN0ICcke3RoaXMudGVzdElkfScgYmVjYXVzZSBzdGFnZSAke2N1cnJlbnRTdGFnZS5udW1iZXJ9IGlzIG5vdCBmaW5pc2hlZGApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgVGVzdCAnJHt0aGlzLnRlc3ROYW1lfSc6IENvbXBsZXRpbmcgc3RhZ2UgJHtzdGFnZS5udW1iZXJ9LCB2YXJpYW50ICR7dGhpcy52YXJpYW50fWApO1xuICAgICAgICB0aGlzLnNlbnRQaW5ncyA9IHN0YWdlLm51bWJlciA9PT0gdGhpcy5sYXN0Q29tcGxldGVkU3RhZ2UgPyB0aGlzLnNlbnRQaW5ncyArIDEgOiAxO1xuICAgICAgICB0aGlzLmxhc3RDb21wbGV0ZWRTdGFnZSA9IHN0YWdlLm51bWJlcjtcbiAgICAgICAgaWYgKHRoaXMucmVjb3JkVGltZSkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgaWYgKHN0YWdlLm51bWJlciA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWNvbmRzUGFzc2VkID0gdGhpcy5sYXN0UGluZ0RhdGUgPyAoY3VycmVudERhdGUuZ2V0VGltZSgpIC0gdGhpcy5sYXN0UGluZ0RhdGUuZ2V0VGltZSgpKSAvIDEwMDAgOiAwO1xuICAgICAgICAgICAgICAgIHN0YWdlLnNldE1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwic2Vjb25kc1Bhc3NlZFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc2Vjb25kc1Bhc3NlZC50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5sYXN0UGluZ0RhdGUgPSBjdXJyZW50RGF0ZTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnBpbmdBZGFwdGVyLnNlbmRQaW5nKHRoaXMsIHN0YWdlKTtcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIE9ic29sZXRlVXNhZ2VUZXN0IGV4dGVuZHMgVXNhZ2VUZXN0IHtcbiAgICBvYnNvbGV0ZVN0YWdlO1xuICAgIGNvbnN0cnVjdG9yKHRlc3RJZCwgdGVzdE5hbWUsIHZhcmlhbnQpIHtcbiAgICAgICAgc3VwZXIodGVzdElkLCB0ZXN0TmFtZSwgdmFyaWFudCwgZmFsc2UpO1xuICAgICAgICB0aGlzLm9ic29sZXRlU3RhZ2UgPSBuZXcgT2Jzb2xldGVTdGFnZSgwLCB0aGlzLCAxLCAxKTtcbiAgICB9XG4gICAgZ2V0U3RhZ2Uoc3RhZ2VOdW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub2Jzb2xldGVTdGFnZTtcbiAgICB9XG4gICAgYWRkU3RhZ2Uoc3RhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub2Jzb2xldGVTdGFnZTtcbiAgICB9XG4gICAgZ2V0VmFyaWFudCh2YXJpYW50cykge1xuICAgICAgICByZXR1cm4gdmFyaWFudHNbMF0oKTtcbiAgICB9XG4gICAgYXN5bmMgY29tcGxldGVTdGFnZShzdGFnZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBPYnNvbGV0ZVVzYWdlVGVzdCB9IGZyb20gXCIuL1VzYWdlVGVzdC5qc1wiO1xuLyoqIENlbnRyYWxpemVkIHBsYWNlIHdoaWNoIGhvbGRzIGFsbCB0aGUge0BsaW5rIFVzYWdlVGVzdH1zLiAqL1xuZXhwb3J0IGNsYXNzIFVzYWdlVGVzdENvbnRyb2xsZXIge1xuICAgIHBpbmdBZGFwdGVyO1xuICAgIHRlc3RzID0gbmV3IE1hcCgpO1xuICAgIG9ic29sZXRlVXNhZ2VUZXN0ID0gbmV3IE9ic29sZXRlVXNhZ2VUZXN0KFwib2Jzb2xldGVcIiwgXCJvYnNvbGV0ZVwiLCAwKTtcbiAgICBjb25zdHJ1Y3RvcihwaW5nQWRhcHRlcikge1xuICAgICAgICB0aGlzLnBpbmdBZGFwdGVyID0gcGluZ0FkYXB0ZXI7XG4gICAgfVxuICAgIGFkZFRlc3QodGVzdCkge1xuICAgICAgICB0ZXN0LnBpbmdBZGFwdGVyID0gdGhpcy5waW5nQWRhcHRlcjtcbiAgICAgICAgdGhpcy50ZXN0cy5zZXQodGVzdC50ZXN0SWQsIHRlc3QpO1xuICAgIH1cbiAgICBhZGRUZXN0cyh0ZXN0cykge1xuICAgICAgICBmb3IgKGxldCB0ZXN0IG9mIHRlc3RzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZFRlc3QodGVzdCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0VGVzdHModGVzdHMpIHtcbiAgICAgICAgdGhpcy50ZXN0cy5jbGVhcigpO1xuICAgICAgICB0aGlzLmFkZFRlc3RzKHRlc3RzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VhcmNoZXMgYSB0ZXN0IGZpcnN0IGJ5IGl0cyBJRCBhbmQgdGhlbiwgaWYgbm8gbWF0Y2ggaXMgZm91bmQsIGJ5IGl0cyBuYW1lLlxuICAgICAqIElmIG5vIHRlc3QgbWF0Y2hlcyBieSBuYW1lIGVpdGhlciwgdGhlbiB3ZSBhc3N1bWUgdGhhdCB0aGUgdGVzdCBpcyBmaW5pc2hlZCBhbmQgdGhlIHNlcnZlciBubyBsb25nZXIgc2VuZHMgYXNzaWdubWVudHMgZm9yIGl0LlxuICAgICAqIEluIHRoYXQgY2FzZSwgd2Ugd2FudCB0byByZW5kZXIgdGhlIG5vLXBhcnRpY2lwYXRpb24gdmFyaWFudCwgc28gYSBzaGFtIHRlc3QgaW5zdGFuY2UgbmVlZHMgdG8gYmUgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGVzdElkT3JOYW1lIFRoZSB0ZXN0J3MgSUQgb3IgaXRzIG5hbWVcbiAgICAgKi9cbiAgICBnZXRUZXN0KHRlc3RJZE9yTmFtZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy50ZXN0cy5nZXQodGVzdElkT3JOYW1lKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCB0ZXN0IG9mIHRoaXMudGVzdHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0ZXN0LnRlc3ROYW1lID09PSB0ZXN0SWRPck5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgVGVzdCAnJHt0ZXN0SWRPck5hbWV9JyBub3QgZm91bmQsIHVzaW5nIG9ic29sZXRlLi4uYCk7XG4gICAgICAgIHJldHVybiB0aGlzLm9ic29sZXRlVXNhZ2VUZXN0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBzb21lIGNvbXBvbmVudHMgYXJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLCBidXQgb25seSB3YW50IHRvIGRvIGEgdGVzdCBpbiBvbmUgb2YgdGhlbS5cbiAgICAgKiB1c2UgdGhpcyB0byBnZXQgYSB0ZXN0IHRoYXQgYWx3YXlzIHJlbmRlcnMgdmFyaWFudCAwIGFuZCBkb2Vzbid0IHNlbmQgcGluZ3MuXG4gICAgICovXG4gICAgZ2V0T2Jzb2xldGVUZXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vYnNvbGV0ZVVzYWdlVGVzdDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBjcmVhdGUsIFN0cmlwcGVkLCBTdHJpcHBlZEVudGl0eSB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgVHlwZVJlZiB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgdHlwZU1vZGVscyB9IGZyb20gXCIuL1R5cGVNb2RlbHMuanNcIlxuXG5cbmV4cG9ydCBjb25zdCBVc2FnZVRlc3RBc3NpZ25tZW50VHlwZVJlZjogVHlwZVJlZjxVc2FnZVRlc3RBc3NpZ25tZW50PiA9IG5ldyBUeXBlUmVmKFwidXNhZ2VcIiwgXCJVc2FnZVRlc3RBc3NpZ25tZW50XCIpXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVc2FnZVRlc3RBc3NpZ25tZW50KHZhbHVlczogU3RyaXBwZWRFbnRpdHk8VXNhZ2VUZXN0QXNzaWdubWVudD4pOiBVc2FnZVRlc3RBc3NpZ25tZW50IHtcblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oY3JlYXRlKHR5cGVNb2RlbHMuVXNhZ2VUZXN0QXNzaWdubWVudCwgVXNhZ2VUZXN0QXNzaWdubWVudFR5cGVSZWYpLCB2YWx1ZXMpXG59XG5cbmV4cG9ydCB0eXBlIFVzYWdlVGVzdEFzc2lnbm1lbnQgPSB7XG5cdF90eXBlOiBUeXBlUmVmPFVzYWdlVGVzdEFzc2lnbm1lbnQ+O1xuXG5cdF9pZDogSWQ7XG5cdG5hbWU6IHN0cmluZztcblx0c2VuZFBpbmdzOiBib29sZWFuO1xuXHR0ZXN0SWQ6IElkO1xuXHR2YXJpYW50OiBudWxsIHwgTnVtYmVyU3RyaW5nO1xuXG5cdHN0YWdlczogVXNhZ2VUZXN0U3RhZ2VbXTtcbn1cbmV4cG9ydCBjb25zdCBVc2FnZVRlc3RBc3NpZ25tZW50SW5UeXBlUmVmOiBUeXBlUmVmPFVzYWdlVGVzdEFzc2lnbm1lbnRJbj4gPSBuZXcgVHlwZVJlZihcInVzYWdlXCIsIFwiVXNhZ2VUZXN0QXNzaWdubWVudEluXCIpXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVc2FnZVRlc3RBc3NpZ25tZW50SW4odmFsdWVzOiBTdHJpcHBlZEVudGl0eTxVc2FnZVRlc3RBc3NpZ25tZW50SW4+KTogVXNhZ2VUZXN0QXNzaWdubWVudEluIHtcblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oY3JlYXRlKHR5cGVNb2RlbHMuVXNhZ2VUZXN0QXNzaWdubWVudEluLCBVc2FnZVRlc3RBc3NpZ25tZW50SW5UeXBlUmVmKSwgdmFsdWVzKVxufVxuXG5leHBvcnQgdHlwZSBVc2FnZVRlc3RBc3NpZ25tZW50SW4gPSB7XG5cdF90eXBlOiBUeXBlUmVmPFVzYWdlVGVzdEFzc2lnbm1lbnRJbj47XG5cblx0X2Zvcm1hdDogTnVtYmVyU3RyaW5nO1xuXHR0ZXN0RGV2aWNlSWQ6IG51bGwgfCBJZDtcbn1cbmV4cG9ydCBjb25zdCBVc2FnZVRlc3RBc3NpZ25tZW50T3V0VHlwZVJlZjogVHlwZVJlZjxVc2FnZVRlc3RBc3NpZ25tZW50T3V0PiA9IG5ldyBUeXBlUmVmKFwidXNhZ2VcIiwgXCJVc2FnZVRlc3RBc3NpZ25tZW50T3V0XCIpXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVc2FnZVRlc3RBc3NpZ25tZW50T3V0KHZhbHVlczogU3RyaXBwZWRFbnRpdHk8VXNhZ2VUZXN0QXNzaWdubWVudE91dD4pOiBVc2FnZVRlc3RBc3NpZ25tZW50T3V0IHtcblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oY3JlYXRlKHR5cGVNb2RlbHMuVXNhZ2VUZXN0QXNzaWdubWVudE91dCwgVXNhZ2VUZXN0QXNzaWdubWVudE91dFR5cGVSZWYpLCB2YWx1ZXMpXG59XG5cbmV4cG9ydCB0eXBlIFVzYWdlVGVzdEFzc2lnbm1lbnRPdXQgPSB7XG5cdF90eXBlOiBUeXBlUmVmPFVzYWdlVGVzdEFzc2lnbm1lbnRPdXQ+O1xuXG5cdF9mb3JtYXQ6IE51bWJlclN0cmluZztcblx0dGVzdERldmljZUlkOiBJZDtcblxuXHRhc3NpZ25tZW50czogVXNhZ2VUZXN0QXNzaWdubWVudFtdO1xufVxuZXhwb3J0IGNvbnN0IFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1R5cGVSZWY6IFR5cGVSZWY8VXNhZ2VUZXN0TWV0cmljQ29uZmlnPiA9IG5ldyBUeXBlUmVmKFwidXNhZ2VcIiwgXCJVc2FnZVRlc3RNZXRyaWNDb25maWdcIilcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVzYWdlVGVzdE1ldHJpY0NvbmZpZyh2YWx1ZXM6IFN0cmlwcGVkRW50aXR5PFVzYWdlVGVzdE1ldHJpY0NvbmZpZz4pOiBVc2FnZVRlc3RNZXRyaWNDb25maWcge1xuXHRyZXR1cm4gT2JqZWN0LmFzc2lnbihjcmVhdGUodHlwZU1vZGVscy5Vc2FnZVRlc3RNZXRyaWNDb25maWcsIFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1R5cGVSZWYpLCB2YWx1ZXMpXG59XG5cbmV4cG9ydCB0eXBlIFVzYWdlVGVzdE1ldHJpY0NvbmZpZyA9IHtcblx0X3R5cGU6IFR5cGVSZWY8VXNhZ2VUZXN0TWV0cmljQ29uZmlnPjtcblxuXHRfaWQ6IElkO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHR5cGU6IE51bWJlclN0cmluZztcblxuXHRjb25maWdWYWx1ZXM6IFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1ZhbHVlW107XG59XG5leHBvcnQgY29uc3QgVXNhZ2VUZXN0TWV0cmljQ29uZmlnVmFsdWVUeXBlUmVmOiBUeXBlUmVmPFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1ZhbHVlPiA9IG5ldyBUeXBlUmVmKFwidXNhZ2VcIiwgXCJVc2FnZVRlc3RNZXRyaWNDb25maWdWYWx1ZVwiKVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVXNhZ2VUZXN0TWV0cmljQ29uZmlnVmFsdWUodmFsdWVzOiBTdHJpcHBlZEVudGl0eTxVc2FnZVRlc3RNZXRyaWNDb25maWdWYWx1ZT4pOiBVc2FnZVRlc3RNZXRyaWNDb25maWdWYWx1ZSB7XG5cdHJldHVybiBPYmplY3QuYXNzaWduKGNyZWF0ZSh0eXBlTW9kZWxzLlVzYWdlVGVzdE1ldHJpY0NvbmZpZ1ZhbHVlLCBVc2FnZVRlc3RNZXRyaWNDb25maWdWYWx1ZVR5cGVSZWYpLCB2YWx1ZXMpXG59XG5cbmV4cG9ydCB0eXBlIFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1ZhbHVlID0ge1xuXHRfdHlwZTogVHlwZVJlZjxVc2FnZVRlc3RNZXRyaWNDb25maWdWYWx1ZT47XG5cblx0X2lkOiBJZDtcblx0a2V5OiBzdHJpbmc7XG5cdHZhbHVlOiBzdHJpbmc7XG59XG5leHBvcnQgY29uc3QgVXNhZ2VUZXN0TWV0cmljRGF0YVR5cGVSZWY6IFR5cGVSZWY8VXNhZ2VUZXN0TWV0cmljRGF0YT4gPSBuZXcgVHlwZVJlZihcInVzYWdlXCIsIFwiVXNhZ2VUZXN0TWV0cmljRGF0YVwiKVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVXNhZ2VUZXN0TWV0cmljRGF0YSh2YWx1ZXM6IFN0cmlwcGVkRW50aXR5PFVzYWdlVGVzdE1ldHJpY0RhdGE+KTogVXNhZ2VUZXN0TWV0cmljRGF0YSB7XG5cdHJldHVybiBPYmplY3QuYXNzaWduKGNyZWF0ZSh0eXBlTW9kZWxzLlVzYWdlVGVzdE1ldHJpY0RhdGEsIFVzYWdlVGVzdE1ldHJpY0RhdGFUeXBlUmVmKSwgdmFsdWVzKVxufVxuXG5leHBvcnQgdHlwZSBVc2FnZVRlc3RNZXRyaWNEYXRhID0ge1xuXHRfdHlwZTogVHlwZVJlZjxVc2FnZVRlc3RNZXRyaWNEYXRhPjtcblxuXHRfaWQ6IElkO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHZhbHVlOiBzdHJpbmc7XG59XG5leHBvcnQgY29uc3QgVXNhZ2VUZXN0UGFydGljaXBhdGlvbkluVHlwZVJlZjogVHlwZVJlZjxVc2FnZVRlc3RQYXJ0aWNpcGF0aW9uSW4+ID0gbmV3IFR5cGVSZWYoXCJ1c2FnZVwiLCBcIlVzYWdlVGVzdFBhcnRpY2lwYXRpb25JblwiKVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVXNhZ2VUZXN0UGFydGljaXBhdGlvbkluKHZhbHVlczogU3RyaXBwZWRFbnRpdHk8VXNhZ2VUZXN0UGFydGljaXBhdGlvbkluPik6IFVzYWdlVGVzdFBhcnRpY2lwYXRpb25JbiB7XG5cdHJldHVybiBPYmplY3QuYXNzaWduKGNyZWF0ZSh0eXBlTW9kZWxzLlVzYWdlVGVzdFBhcnRpY2lwYXRpb25JbiwgVXNhZ2VUZXN0UGFydGljaXBhdGlvbkluVHlwZVJlZiksIHZhbHVlcylcbn1cblxuZXhwb3J0IHR5cGUgVXNhZ2VUZXN0UGFydGljaXBhdGlvbkluID0ge1xuXHRfdHlwZTogVHlwZVJlZjxVc2FnZVRlc3RQYXJ0aWNpcGF0aW9uSW4+O1xuXG5cdF9mb3JtYXQ6IE51bWJlclN0cmluZztcblx0c3RhZ2U6IE51bWJlclN0cmluZztcblx0dGVzdERldmljZUlkOiBJZDtcblx0dGVzdElkOiBJZDtcblxuXHRtZXRyaWNzOiBVc2FnZVRlc3RNZXRyaWNEYXRhW107XG59XG5leHBvcnQgY29uc3QgVXNhZ2VUZXN0U3RhZ2VUeXBlUmVmOiBUeXBlUmVmPFVzYWdlVGVzdFN0YWdlPiA9IG5ldyBUeXBlUmVmKFwidXNhZ2VcIiwgXCJVc2FnZVRlc3RTdGFnZVwiKVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVXNhZ2VUZXN0U3RhZ2UodmFsdWVzOiBTdHJpcHBlZEVudGl0eTxVc2FnZVRlc3RTdGFnZT4pOiBVc2FnZVRlc3RTdGFnZSB7XG5cdHJldHVybiBPYmplY3QuYXNzaWduKGNyZWF0ZSh0eXBlTW9kZWxzLlVzYWdlVGVzdFN0YWdlLCBVc2FnZVRlc3RTdGFnZVR5cGVSZWYpLCB2YWx1ZXMpXG59XG5cbmV4cG9ydCB0eXBlIFVzYWdlVGVzdFN0YWdlID0ge1xuXHRfdHlwZTogVHlwZVJlZjxVc2FnZVRlc3RTdGFnZT47XG5cblx0X2lkOiBJZDtcblx0bWF4UGluZ3M6IE51bWJlclN0cmluZztcblx0bWluUGluZ3M6IE51bWJlclN0cmluZztcblx0bmFtZTogc3RyaW5nO1xuXG5cdG1ldHJpY3M6IFVzYWdlVGVzdE1ldHJpY0NvbmZpZ1tdO1xufVxuIiwiaW1wb3J0IHsgVXNhZ2VUZXN0QXNzaWdubWVudEluVHlwZVJlZiB9IGZyb20gXCIuL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFVzYWdlVGVzdEFzc2lnbm1lbnRPdXRUeXBlUmVmIH0gZnJvbSBcIi4vVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgVXNhZ2VUZXN0UGFydGljaXBhdGlvbkluVHlwZVJlZiB9IGZyb20gXCIuL1R5cGVSZWZzLmpzXCJcblxuZXhwb3J0IGNvbnN0IFVzYWdlVGVzdEFzc2lnbm1lbnRTZXJ2aWNlID0gT2JqZWN0LmZyZWV6ZSh7XG5cdGFwcDogXCJ1c2FnZVwiLFxuXHRuYW1lOiBcIlVzYWdlVGVzdEFzc2lnbm1lbnRTZXJ2aWNlXCIsXG5cdGdldDogbnVsbCxcblx0cG9zdDogeyBkYXRhOiBVc2FnZVRlc3RBc3NpZ25tZW50SW5UeXBlUmVmLCByZXR1cm46IFVzYWdlVGVzdEFzc2lnbm1lbnRPdXRUeXBlUmVmIH0sXG5cdHB1dDogeyBkYXRhOiBVc2FnZVRlc3RBc3NpZ25tZW50SW5UeXBlUmVmLCByZXR1cm46IFVzYWdlVGVzdEFzc2lnbm1lbnRPdXRUeXBlUmVmIH0sXG5cdGRlbGV0ZTogbnVsbCxcbn0gYXMgY29uc3QpXG5cbmV4cG9ydCBjb25zdCBVc2FnZVRlc3RQYXJ0aWNpcGF0aW9uU2VydmljZSA9IE9iamVjdC5mcmVlemUoe1xuXHRhcHA6IFwidXNhZ2VcIixcblx0bmFtZTogXCJVc2FnZVRlc3RQYXJ0aWNpcGF0aW9uU2VydmljZVwiLFxuXHRnZXQ6IG51bGwsXG5cdHBvc3Q6IHsgZGF0YTogVXNhZ2VUZXN0UGFydGljaXBhdGlvbkluVHlwZVJlZiwgcmV0dXJuOiBudWxsIH0sXG5cdHB1dDogbnVsbCxcblx0ZGVsZXRlOiBudWxsLFxufSBhcyBjb25zdCkiLCJpbXBvcnQge1xuXHRjcmVhdGVVc2FnZVRlc3RBc3NpZ25tZW50SW4sXG5cdGNyZWF0ZVVzYWdlVGVzdE1ldHJpY0RhdGEsXG5cdGNyZWF0ZVVzYWdlVGVzdFBhcnRpY2lwYXRpb25Jbixcblx0VXNhZ2VUZXN0QXNzaWdubWVudCxcblx0VXNhZ2VUZXN0QXNzaWdubWVudE91dCxcblx0VXNhZ2VUZXN0QXNzaWdubWVudFR5cGVSZWYsXG59IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvdXNhZ2UvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgUGluZ0FkYXB0ZXIsIFN0YWdlLCBVc2FnZVRlc3QsIFVzYWdlVGVzdENvbnRyb2xsZXIgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXVzYWdldGVzdHNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgZmlsdGVySW50LCBsYXp5LCBuZXZlck51bGwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEJhZFJlcXVlc3RFcnJvciwgTm90Rm91bmRFcnJvciwgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgVXNhZ2VUZXN0TWV0cmljVHlwZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IFN1c3BlbnNpb25FcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1N1c3BlbnNpb25FcnJvclwiXG5pbXBvcnQgeyBTdXNwZW5zaW9uQmVoYXZpb3IgfSBmcm9tIFwiLi4vYXBpL3dvcmtlci9yZXN0L1Jlc3RDbGllbnRcIlxuaW1wb3J0IHsgRGF0ZVByb3ZpZGVyIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRGF0ZVByb3ZpZGVyLmpzXCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdFwiXG5pbXBvcnQgeyBVc2FnZVRlc3RBc3NpZ25tZW50U2VydmljZSwgVXNhZ2VUZXN0UGFydGljaXBhdGlvblNlcnZpY2UgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3VzYWdlL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IHJlc29sdmVUeXBlUmVmZXJlbmNlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW50aXR5RnVuY3Rpb25zXCJcbmltcG9ydCB7IGxhbmcsIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4vTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBEcm9wRG93blNlbGVjdG9yLCBTZWxlY3Rvckl0ZW0gfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvRHJvcERvd25TZWxlY3RvclwiXG5pbXBvcnQgbSwgeyBDaGlsZHJlbiB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGlzT2ZmbGluZUVycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvRXJyb3JVdGlscy5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IEN1c3RvbWVyUHJvcGVydGllcywgQ3VzdG9tZXJQcm9wZXJ0aWVzVHlwZVJlZiwgQ3VzdG9tZXJUeXBlUmVmIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgY3JlYXRlVXNlclNldHRpbmdzR3JvdXBSb290LCBVc2VyU2V0dGluZ3NHcm91cFJvb3RUeXBlUmVmIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5cbmNvbnN0IFBSRVNFTEVDVEVEX0xJS0VSVF9WQUxVRSA9IG51bGxcblxudHlwZSBFeHBlcmllbmNlU2FtcGxpbmdPcHRpb25zID0ge1xuXHR0aXRsZT86IFRyYW5zbGF0aW9uS2V5XG5cdGV4cGxhbmF0aW9uVGV4dD86IFRyYW5zbGF0aW9uS2V5XG5cdHBlck1ldHJpYzoge1xuXHRcdFtrZXk6IHN0cmluZ106IHtcblx0XHRcdHF1ZXN0aW9uOiBUcmFuc2xhdGlvbktleVxuXHRcdFx0YW5zd2VyT3B0aW9uczogQXJyYXk8c3RyaW5nPlxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd0V4cGVyaWVuY2VTYW1wbGluZ0RpYWxvZyhzdGFnZTogU3RhZ2UsIGV4cGVyaWVuY2VTYW1wbGluZ09wdGlvbnM6IEV4cGVyaWVuY2VTYW1wbGluZ09wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcblx0Y29uc3QgbGlrZXJ0TWV0cmljcyA9IEFycmF5LmZyb20oc3RhZ2UubWV0cmljQ29uZmlncy52YWx1ZXMoKSkuZmlsdGVyKFxuXHRcdChtZXRyaWNDb25maWcpID0+IChtZXRyaWNDb25maWcudHlwZSBhcyBVc2FnZVRlc3RNZXRyaWNUeXBlKSA9PT0gVXNhZ2VUZXN0TWV0cmljVHlwZS5MaWtlcnQsXG5cdClcblx0Y29uc3Qgc2VsZWN0ZWRWYWx1ZXMgPSBuZXcgTWFwKGxpa2VydE1ldHJpY3MubWFwKChsaWtlcnRNZXRyaWMpID0+IFtsaWtlcnRNZXRyaWMubmFtZSwgc3RyZWFtKFBSRVNFTEVDVEVEX0xJS0VSVF9WQUxVRSldKSlcblxuXHREaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0dHlwZTogRGlhbG9nVHlwZS5FZGl0TWVkaXVtLFxuXHRcdG9rQWN0aW9uOiAoZGlhbG9nOiBEaWFsb2cpID0+IHtcblx0XHRcdGZvciAobGV0IFttZXRyaWNOYW1lLCBzZWxlY3RlZFZhbHVlXSBvZiBzZWxlY3RlZFZhbHVlcykge1xuXHRcdFx0XHRjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3RlZFZhbHVlKClcblxuXHRcdFx0XHRpZiAoc2VsZWN0aW9uID09PSBudWxsKSB7XG5cdFx0XHRcdFx0Ly8gVXNlciBkaWQgbm90IHNlbGVjdCBhbiBhbnN3ZXJcblx0XHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJleHBlcmllbmNlU2FtcGxpbmdTZWxlY3RBbnN3ZXJfbXNnXCIpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzdGFnZS5zZXRNZXRyaWMoe1xuXHRcdFx0XHRcdG5hbWU6IG1ldHJpY05hbWUsXG5cdFx0XHRcdFx0dmFsdWU6IHNlbGVjdGlvbixcblx0XHRcdFx0fSlcblx0XHRcdH1cblxuXHRcdFx0c3RhZ2UuY29tcGxldGUoKS50aGVuKCgpID0+IGRpYWxvZy5jbG9zZSgpKVxuXHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwiZXhwZXJpZW5jZVNhbXBsaW5nVGhhbmtZb3VfbXNnXCIpXG5cdFx0fSxcblx0XHR0aXRsZTogZXhwZXJpZW5jZVNhbXBsaW5nT3B0aW9ucy50aXRsZSA/PyBcImV4cGVyaWVuY2VTYW1wbGluZ0hlYWRlcl9sYWJlbFwiLFxuXHRcdGNoaWxkOiAoKSA9PiB7XG5cdFx0XHRjb25zdCBjaGlsZHJlbjogQXJyYXk8Q2hpbGRyZW4+ID0gW11cblxuXHRcdFx0aWYgKGV4cGVyaWVuY2VTYW1wbGluZ09wdGlvbnMuZXhwbGFuYXRpb25UZXh0KSB7XG5cdFx0XHRcdGNvbnN0IGV4cGxhbmF0aW9uVGV4dExpbmVzID0gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoZXhwZXJpZW5jZVNhbXBsaW5nT3B0aW9ucy5leHBsYW5hdGlvblRleHQpLnNwbGl0KFwiXFxuXCIpXG5cblx0XHRcdFx0Y2hpbGRyZW4ucHVzaChcblx0XHRcdFx0XHRtKFwiI2RpYWxvZy1tZXNzYWdlLnRleHQtYnJlYWsudGV4dC1wcmV3cmFwLnNlbGVjdGFibGUuc2Nyb2xsXCIsIFtleHBsYW5hdGlvblRleHRMaW5lcy5tYXAoKGxpbmUpID0+IG0oXCIudGV4dC1icmVhay5zZWxlY3RhYmxlXCIsIGxpbmUpKV0pLFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGxpa2VydE1ldHJpY0NvbmZpZyBvZiBsaWtlcnRNZXRyaWNzKSB7XG5cdFx0XHRcdGNvbnN0IG1ldHJpY09wdGlvbnMgPSBleHBlcmllbmNlU2FtcGxpbmdPcHRpb25zW1wicGVyTWV0cmljXCJdW2xpa2VydE1ldHJpY0NvbmZpZy5uYW1lXVxuXG5cdFx0XHRcdGNvbnN0IGFuc3dlck9wdGlvbkl0ZW1zOiBBcnJheTxTZWxlY3Rvckl0ZW08c3RyaW5nPj4gPSBtZXRyaWNPcHRpb25zLmFuc3dlck9wdGlvbnMubWFwKChhbnN3ZXJPcHRpb24sIGluZGV4KSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdG5hbWU6IGFuc3dlck9wdGlvbixcblx0XHRcdFx0XHRcdHZhbHVlOiAoaW5kZXggKyAxKS50b1N0cmluZygpLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblxuXHRcdFx0XHRjaGlsZHJlbi5wdXNoKG0oXCJwLnRleHQtcHJld3JhcC5zY3JvbGxcIiwgbGFuZy5nZXRUcmFuc2xhdGlvblRleHQobWV0cmljT3B0aW9ucy5xdWVzdGlvbikpKVxuXG5cdFx0XHRcdGNoaWxkcmVuLnB1c2goXG5cdFx0XHRcdFx0bShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJleHBlcmllbmNlU2FtcGxpbmdBbnN3ZXJfbGFiZWxcIixcblx0XHRcdFx0XHRcdGl0ZW1zOiBhbnN3ZXJPcHRpb25JdGVtcyxcblx0XHRcdFx0XHRcdHNlbGVjdGVkVmFsdWU6IHNlbGVjdGVkVmFsdWVzLmdldChsaWtlcnRNZXRyaWNDb25maWcubmFtZSkhLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBjaGlsZHJlblxuXHRcdH0sXG5cdH0pXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGVyc2lzdGVkQXNzaWdubWVudERhdGEge1xuXHR1cGRhdGVkQXQ6IG51bWJlclxuXHRhc3NpZ25tZW50czogVXNhZ2VUZXN0QXNzaWdubWVudFtdXG5cdHVzYWdlTW9kZWxWZXJzaW9uOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVc2FnZVRlc3RTdG9yYWdlIHtcblx0Z2V0VGVzdERldmljZUlkKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD5cblxuXHRzdG9yZVRlc3REZXZpY2VJZCh0ZXN0RGV2aWNlSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cblxuXHRnZXRBc3NpZ25tZW50cygpOiBQcm9taXNlPFBlcnNpc3RlZEFzc2lnbm1lbnREYXRhIHwgbnVsbD5cblxuXHRzdG9yZUFzc2lnbm1lbnRzKHBlcnNpc3RlZEFzc2lnbm1lbnREYXRhOiBQZXJzaXN0ZWRBc3NpZ25tZW50RGF0YSk6IFByb21pc2U8dm9pZD5cbn1cblxuZXhwb3J0IGNsYXNzIEVwaGVtZXJhbFVzYWdlVGVzdFN0b3JhZ2UgaW1wbGVtZW50cyBVc2FnZVRlc3RTdG9yYWdlIHtcblx0cHJpdmF0ZSBhc3NpZ25tZW50czogUGVyc2lzdGVkQXNzaWdubWVudERhdGEgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHRlc3REZXZpY2VJZDogc3RyaW5nIHwgbnVsbCA9IG51bGxcblxuXHRnZXRBc3NpZ25tZW50cygpOiBQcm9taXNlPFBlcnNpc3RlZEFzc2lnbm1lbnREYXRhIHwgbnVsbD4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5hc3NpZ25tZW50cylcblx0fVxuXG5cdGdldFRlc3REZXZpY2VJZCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMudGVzdERldmljZUlkKVxuXHR9XG5cblx0c3RvcmVBc3NpZ25tZW50cyhwZXJzaXN0ZWRBc3NpZ25tZW50RGF0YTogUGVyc2lzdGVkQXNzaWdubWVudERhdGEpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmFzc2lnbm1lbnRzID0gcGVyc2lzdGVkQXNzaWdubWVudERhdGFcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0fVxuXG5cdHN0b3JlVGVzdERldmljZUlkKHRlc3REZXZpY2VJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy50ZXN0RGV2aWNlSWQgPSB0ZXN0RGV2aWNlSWRcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0fVxufVxuXG5leHBvcnQgY29uc3QgQVNTSUdOTUVOVF9VUERBVEVfSU5URVJWQUxfTVMgPSAxMDAwICogNjAgKiA2MCAvLyAxaFxuXG5leHBvcnQgY29uc3QgZW51bSBTdG9yYWdlQmVoYXZpb3Ige1xuXHQvKiBTdG9yZSB1c2FnZSB0ZXN0IGFzc2lnbm1lbnRzIGluIHRoZSBcInBlcnNpc3RlbnRcIiBzdG9yYWdlLiBDdXJyZW50bHksIHRoaXMgaXMgdGhlIGNsaWVudCdzIGluc3RhbmNlIG9mIERldmljZUNvbmZpZywgd2hpY2ggdXNlcyB0aGUgYnJvd3NlcidzIGxvY2FsIHN0b3JhZ2UuXG5cdFVzZSBpZiB0aGUgdXNlciBpcyBsb2dnZWQgaW4gYW5kIGhhcyBvcHRlZCBpbiB0byBzZW5kaW5nIHVzYWdlIGRhdGEuICovXG5cdFBlcnNpc3QsXG5cdC8qIFN0b3JlIHVzYWdlIHRlc3QgYXNzaWdubWVudHMgaW4gdGhlIFwiZXBoZW1lcmFsXCIgc3RvcmFnZS4gQ3VycmVudGx5LCB0aGlzIGlzIGFuIGluc3RhbmNlIG9mIEVwaGVtZXJhbFVzYWdlVGVzdFN0b3JhZ2UuXG5cdFVzZSBpZiB0aGUgdXNlciBpcyBub3QgbG9nZ2VkIGluLiAqL1xuXHRFcGhlbWVyYWwsXG59XG5cbmV4cG9ydCBjbGFzcyBVc2FnZVRlc3RNb2RlbCBpbXBsZW1lbnRzIFBpbmdBZGFwdGVyIHtcblx0cHJpdmF0ZSBzdG9yYWdlQmVoYXZpb3IgPSBTdG9yYWdlQmVoYXZpb3IuRXBoZW1lcmFsXG5cdHByaXZhdGUgY3VzdG9tZXJQcm9wZXJ0aWVzPzogQ3VzdG9tZXJQcm9wZXJ0aWVzXG5cdHByaXZhdGUgbGFzdE9wdEluRGVjaXNpb246IGJvb2xlYW4gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGxhc3RQaW5nID0gUHJvbWlzZS5yZXNvbHZlKClcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IHN0b3JhZ2VzOiB7IFtrZXkgaW4gU3RvcmFnZUJlaGF2aW9yXTogVXNhZ2VUZXN0U3RvcmFnZSB9LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSB1c2FnZVRlc3RDb250cm9sbGVyOiAoKSA9PiBVc2FnZVRlc3RDb250cm9sbGVyLFxuXHQpIHtcblx0XHRldmVudENvbnRyb2xsZXIuYWRkRW50aXR5TGlzdGVuZXIoKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4pID0+IHtcblx0XHRcdHJldHVybiB0aGlzLmVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXMpXG5cdFx0fSlcblx0fVxuXG5cdGFzeW5jIGVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4pIHtcblx0XHRmb3IgKGNvbnN0IHVwZGF0ZSBvZiB1cGRhdGVzKSB7XG5cdFx0XHRpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKEN1c3RvbWVyUHJvcGVydGllc1R5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2dpbkNvbnRyb2xsZXIud2FpdEZvckZ1bGxMb2dpbigpXG5cdFx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQ3VzdG9tZXJQcm9wZXJ0aWVzKClcblx0XHRcdH0gZWxzZSBpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKFVzZXJTZXR0aW5nc0dyb3VwUm9vdFR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2dpbkNvbnRyb2xsZXIud2FpdEZvckZ1bGxMb2dpbigpXG5cdFx0XHRcdGNvbnN0IHVwZGF0ZWRPcHRJbkRlY2lzaW9uID0gdGhpcy5sb2dpbkNvbnRyb2xsZXIuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyU2V0dGluZ3NHcm91cFJvb3QudXNhZ2VEYXRhT3B0ZWRJblxuXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RPcHRJbkRlY2lzaW9uID09PSB1cGRhdGVkT3B0SW5EZWNpc2lvbikge1xuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gT3B0LWluIGRlY2lzaW9uIGhhcyBjaGFuZ2VkLCBsb2FkIHRlc3RzXG5cdFx0XHRcdGNvbnN0IHRlc3RzID0gYXdhaXQgdGhpcy5sb2FkQWN0aXZlVXNhZ2VUZXN0cygpXG5cdFx0XHRcdHRoaXMudXNhZ2VUZXN0Q29udHJvbGxlcigpLnNldFRlc3RzKHRlc3RzKVxuXHRcdFx0XHR0aGlzLmxhc3RPcHRJbkRlY2lzaW9uID0gdXBkYXRlZE9wdEluRGVjaXNpb25cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogb25seSBmb3IgdXNhZ2UgZnJvbSB0aGUgY29uc29sZS4gbWF5IGhhdmUgdW5pbnRlbmRlZCBjb25zZXF1ZW5jZXMgd2hlbiB1c2VkIHRvbyBlYXJseSBvciB0b28gbGF0ZS5cblx0ICogQHBhcmFtIHRlc3QgdGhlIG5hbWUgb2YgdGhlIHRlc3QgdG8gY2hhbmdlIHRoZSB2YXJpYW50IG9uXG5cdCAqIEBwYXJhbSB2YXJpYW50IHRoZSBudW1iZXIgb2YgdGhlIHZhcmlhbnQgdG8gdXNlIGZyb20gaGVyZSBvblxuXHQgKi9cblx0cHJpdmF0ZSBzZXRWYXJpYW50KHRlc3Q6IHN0cmluZywgdmFyaWFudDogbnVtYmVyKSB7XG5cdFx0dGhpcy51c2FnZVRlc3RDb250cm9sbGVyKCkuZ2V0VGVzdCh0ZXN0KS52YXJpYW50ID0gdmFyaWFudFxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVDdXN0b21lclByb3BlcnRpZXMoKSB7XG5cdFx0Y29uc3QgY3VzdG9tZXIgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEN1c3RvbWVyVHlwZVJlZiwgbmV2ZXJOdWxsKHRoaXMubG9naW5Db250cm9sbGVyLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5jdXN0b21lcikpXG5cdFx0dGhpcy5jdXN0b21lclByb3BlcnRpZXMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEN1c3RvbWVyUHJvcGVydGllc1R5cGVSZWYsIG5ldmVyTnVsbChjdXN0b21lci5wcm9wZXJ0aWVzKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBOZWVkcyB0byBiZSBjYWxsZWQgYWZ0ZXIgY29uc3RydWN0aW9uLCBpZGVhbGx5IGFmdGVyIGxvZ2luLCBzbyB0aGF0IHRoZSBsb2dnZWQtaW4gdXNlcidzIEN1c3RvbWVyUHJvcGVydGllcyBhcmUgbG9hZGVkLlxuXHQgKi9cblx0YXN5bmMgaW5pdCgpIHtcblx0XHRhd2FpdCB0aGlzLnVwZGF0ZUN1c3RvbWVyUHJvcGVydGllcygpXG5cdH1cblxuXHRzZXRTdG9yYWdlQmVoYXZpb3Ioc3RvcmFnZUJlaGF2aW9yOiBTdG9yYWdlQmVoYXZpb3IpIHtcblx0XHR0aGlzLnN0b3JhZ2VCZWhhdmlvciA9IHN0b3JhZ2VCZWhhdmlvclxuXHR9XG5cblx0cHJpdmF0ZSBzdG9yYWdlKCkge1xuXHRcdHJldHVybiB0aGlzLnN0b3JhZ2VzW3RoaXMuc3RvcmFnZUJlaGF2aW9yXVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY3VzdG9tZXIgaGFzIG9wdGVkIG91dC5cblx0ICogRGVmYXVsdHMgdG8gdHJ1ZSBpZiBpbml0KCkgaGFzIG5vdCBiZWVuIGNhbGxlZC5cblx0ICovXG5cdGlzQ3VzdG9tZXJPcHRlZE91dCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5jdXN0b21lclByb3BlcnRpZXM/LnVzYWdlRGF0YU9wdGVkT3V0ID8/IHRydWVcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgdGhlIG9wdC1pbiBkaWFsb2cgaW5kaWNhdG9yIHNob3VsZCBiZSBzaG93biwgZGVwZW5kaW5nIG9uIHRoZSB1c2VyJ3MgYW5kIHRoZSBjdXN0b21lcidzIGRlY2lzaW9ucy5cblx0ICogRGVmYXVsdHMgdG8gZmFsc2UgaWYgaW5pdCgpIGhhcyBub3QgYmVlbiBjYWxsZWQuXG5cdCAqL1xuXHRzaG93T3B0SW5JbmRpY2F0b3IoKTogYm9vbGVhbiB7XG5cdFx0aWYgKCF0aGlzLmxvZ2luQ29udHJvbGxlci5pc1VzZXJMb2dnZWRJbigpIHx8IHRoaXMuaXNDdXN0b21lck9wdGVkT3V0KCkpIHtcblx0XHRcdC8vIHNob3J0Y3V0IGlmIGN1c3RvbWVyIGhhcyBvcHRlZCBvdXQgKG9yIGlzIG5vdCBsb2dnZWQgaW4pXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5sb2dpbkNvbnRyb2xsZXIuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyU2V0dGluZ3NHcm91cFJvb3QudXNhZ2VEYXRhT3B0ZWRJbiA9PT0gbnVsbFxuXHR9XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIHVzZXIncyB1c2FnZSBkYXRhIG9wdC1pbiBkZWNpc2lvbi4gVHJ1ZSBtZWFucyB0aGV5IG9wdCBpbi5cblx0ICpcblx0ICogSW1tZWRpYXRlbHkgcmVmZXRjaGVzIHRoZSB1c2VyJ3MgYWN0aXZlIHVzYWdlIHRlc3RzIGlmIHRoZXkgb3B0ZWQgaW4uXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgc2V0T3B0SW5EZWNpc2lvbihkZWNpc2lvbjogYm9vbGVhbikge1xuXHRcdGNvbnN0IHVzZXJTZXR0aW5nc0dyb3VwUm9vdCA9IGNyZWF0ZVVzZXJTZXR0aW5nc0dyb3VwUm9vdCh0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdClcblx0XHR1c2VyU2V0dGluZ3NHcm91cFJvb3QudXNhZ2VEYXRhT3B0ZWRJbiA9IGRlY2lzaW9uXG5cblx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudC51cGRhdGUodXNlclNldHRpbmdzR3JvdXBSb290KVxuXHRcdHRoaXMubGFzdE9wdEluRGVjaXNpb24gPSBkZWNpc2lvblxuXG5cdFx0Ly8gd2UgbmVlZCB0byB1bnNldCB0aGUgdGVzdHMgaW4gY2FzZSBvZiBhbiBvcHQtb3V0IGJlY2F1c2Ugb3RoZXJ3aXNlIHdlIG1pZ2h0IGtlZXAgdXNpbmcgdGhlbVxuXHRcdC8vIGluIGNhc2Ugb2YgYW4gb3B0LWluIHdlIG5lZWQgdG8gbG9hZCB0aGVtIGJlY2F1c2UgdGhleSBtaWdodCBub3QgeWV0IGhhdmUgYmVlbiBsb2FkZWRcblx0XHRjb25zdCB0ZXN0cyA9IGRlY2lzaW9uID8gYXdhaXQgdGhpcy5kb0xvYWRBY3RpdmVVc2FnZVRlc3RzKCkgOiBbXVxuXHRcdHRoaXMudXNhZ2VUZXN0Q29udHJvbGxlcigpLnNldFRlc3RzKHRlc3RzKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRPcHRJbkRlY2lzaW9uKCk6IGJvb2xlYW4ge1xuXHRcdGlmICghdGhpcy5sb2dpbkNvbnRyb2xsZXIuaXNVc2VyTG9nZ2VkSW4oKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlck9wdEluID0gdGhpcy5sb2dpbkNvbnRyb2xsZXIuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyU2V0dGluZ3NHcm91cFJvb3QudXNhZ2VEYXRhT3B0ZWRJblxuXG5cdFx0aWYgKCF1c2VyT3B0SW4pIHtcblx0XHRcdC8vIHNob3J0Y3V0IGlmIHVzZXJPcHRJbiBub3Qgc2V0IG9yIGVxdWFsIHRvIGZhbHNlXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHQvLyBjdXN0b21lciBvcHQtb3V0IG92ZXJyaWRlcyB0aGUgdXNlciBzZXR0aW5nXG5cdFx0cmV0dXJuICFhc3NlcnROb3ROdWxsKHRoaXMuY3VzdG9tZXJQcm9wZXJ0aWVzKS51c2FnZURhdGFPcHRlZE91dFxuXHR9XG5cblx0LyoqXG5cdCAqIElmIHRoZSBzdG9yYWdlQmVoYXZpb3IgaXMgc2V0IHRvIFN0b3JhZ2VCZWhhdmlvci5QZXJzaXN0LCB0aGVuIGluaXQoKSBtdXN0IGhhdmUgYmVlbiBjYWxsZWQgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QuXG5cdCAqL1xuXHRhc3luYyBsb2FkQWN0aXZlVXNhZ2VUZXN0cygpIHtcblx0XHRpZiAodGhpcy5zdG9yYWdlQmVoYXZpb3IgPT09IFN0b3JhZ2VCZWhhdmlvci5QZXJzaXN0ICYmICF0aGlzLmdldE9wdEluRGVjaXNpb24oKSkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMuZG9Mb2FkQWN0aXZlVXNhZ2VUZXN0cygpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRvTG9hZEFjdGl2ZVVzYWdlVGVzdHMoKSB7XG5cdFx0Y29uc3QgcGVyc2lzdGVkRGF0YSA9IGF3YWl0IHRoaXMuc3RvcmFnZSgpLmdldEFzc2lnbm1lbnRzKClcblx0XHRjb25zdCBtb2RlbFZlcnNpb24gPSBhd2FpdCB0aGlzLm1vZGVsVmVyc2lvbigpXG5cblx0XHRpZiAocGVyc2lzdGVkRGF0YSA9PSBudWxsIHx8IHBlcnNpc3RlZERhdGEudXNhZ2VNb2RlbFZlcnNpb24gIT09IG1vZGVsVmVyc2lvbiB8fCBEYXRlLm5vdygpIC0gcGVyc2lzdGVkRGF0YS51cGRhdGVkQXQgPiBBU1NJR05NRU5UX1VQREFURV9JTlRFUlZBTF9NUykge1xuXHRcdFx0cmV0dXJuIHRoaXMuYXNzaWdubWVudHNUb1Rlc3RzKGF3YWl0IHRoaXMubG9hZEFzc2lnbm1lbnRzKCkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLmFzc2lnbm1lbnRzVG9UZXN0cyhwZXJzaXN0ZWREYXRhLmFzc2lnbm1lbnRzKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbW9kZWxWZXJzaW9uKCk6IFByb21pc2U8bnVtYmVyPiB7XG5cdFx0Y29uc3QgbW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShVc2FnZVRlc3RBc3NpZ25tZW50VHlwZVJlZilcblx0XHRyZXR1cm4gZmlsdGVySW50KG1vZGVsLnZlcnNpb24pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRBc3NpZ25tZW50cygpOiBQcm9taXNlPFVzYWdlVGVzdEFzc2lnbm1lbnRbXT4ge1xuXHRcdGNvbnN0IHRlc3REZXZpY2VJZCA9IGF3YWl0IHRoaXMuc3RvcmFnZSgpLmdldFRlc3REZXZpY2VJZCgpXG5cdFx0Y29uc3QgZGF0YSA9IGNyZWF0ZVVzYWdlVGVzdEFzc2lnbm1lbnRJbih7XG5cdFx0XHR0ZXN0RGV2aWNlSWQ6IHRlc3REZXZpY2VJZCxcblx0XHR9KVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHJlc3BvbnNlOiBVc2FnZVRlc3RBc3NpZ25tZW50T3V0ID0gdGVzdERldmljZUlkXG5cdFx0XHRcdD8gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucHV0KFVzYWdlVGVzdEFzc2lnbm1lbnRTZXJ2aWNlLCBkYXRhLCB7XG5cdFx0XHRcdFx0XHRzdXNwZW5zaW9uQmVoYXZpb3I6IFN1c3BlbnNpb25CZWhhdmlvci5UaHJvdyxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoVXNhZ2VUZXN0QXNzaWdubWVudFNlcnZpY2UsIGRhdGEsIHtcblx0XHRcdFx0XHRcdHN1c3BlbnNpb25CZWhhdmlvcjogU3VzcGVuc2lvbkJlaGF2aW9yLlRocm93LFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRhd2FpdCB0aGlzLnN0b3JhZ2UoKS5zdG9yZVRlc3REZXZpY2VJZChyZXNwb25zZS50ZXN0RGV2aWNlSWQpXG5cdFx0XHRhd2FpdCB0aGlzLnN0b3JhZ2UoKS5zdG9yZUFzc2lnbm1lbnRzKHtcblx0XHRcdFx0YXNzaWdubWVudHM6IHJlc3BvbnNlLmFzc2lnbm1lbnRzLFxuXHRcdFx0XHR1cGRhdGVkQXQ6IHRoaXMuZGF0ZVByb3ZpZGVyLm5vdygpLFxuXHRcdFx0XHR1c2FnZU1vZGVsVmVyc2lvbjogYXdhaXQgdGhpcy5tb2RlbFZlcnNpb24oKSxcblx0XHRcdH0pXG5cblx0XHRcdHJldHVybiByZXNwb25zZS5hc3NpZ25tZW50c1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgU3VzcGVuc2lvbkVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicmF0ZS1saW1pdCBmb3IgbmV3IGFzc2lnbm1lbnRzIHJlYWNoZWQsIGRpc2FibGluZyB0ZXN0c1wiKVxuXHRcdFx0XHRyZXR1cm4gW11cblx0XHRcdH0gZWxzZSBpZiAoaXNPZmZsaW5lRXJyb3IoZSkpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJvZmZsaW5lLCBkaXNhYmxpbmcgdGVzdHNcIilcblx0XHRcdFx0cmV0dXJuIFtdXG5cdFx0XHR9XG5cblx0XHRcdHRocm93IGVcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzc2lnbm1lbnRzVG9UZXN0cyhhc3NpZ25tZW50czogVXNhZ2VUZXN0QXNzaWdubWVudFtdKTogVXNhZ2VUZXN0W10ge1xuXHRcdHJldHVybiBhc3NpZ25tZW50cy5tYXAoKHVzYWdlVGVzdEFzc2lnbm1lbnQpID0+IHtcblx0XHRcdGNvbnN0IHRlc3QgPSBuZXcgVXNhZ2VUZXN0KHVzYWdlVGVzdEFzc2lnbm1lbnQudGVzdElkLCB1c2FnZVRlc3RBc3NpZ25tZW50Lm5hbWUsIE51bWJlcih1c2FnZVRlc3RBc3NpZ25tZW50LnZhcmlhbnQpLCB1c2FnZVRlc3RBc3NpZ25tZW50LnNlbmRQaW5ncylcblxuXHRcdFx0Zm9yIChjb25zdCBbaW5kZXgsIHN0YWdlQ29uZmlnXSBvZiB1c2FnZVRlc3RBc3NpZ25tZW50LnN0YWdlcy5lbnRyaWVzKCkpIHtcblx0XHRcdFx0Y29uc3Qgc3RhZ2UgPSBuZXcgU3RhZ2UoaW5kZXgsIHRlc3QsIE51bWJlcihzdGFnZUNvbmZpZy5taW5QaW5ncyksIE51bWJlcihzdGFnZUNvbmZpZy5tYXhQaW5ncykpXG5cdFx0XHRcdGZvciAoY29uc3QgbWV0cmljQ29uZmlnIG9mIHN0YWdlQ29uZmlnLm1ldHJpY3MpIHtcblx0XHRcdFx0XHRjb25zdCBjb25maWdWYWx1ZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5cblx0XHRcdFx0XHRmb3IgKGNvbnN0IG1ldHJpY0NvbmZpZ1ZhbHVlIG9mIG1ldHJpY0NvbmZpZy5jb25maWdWYWx1ZXMpIHtcblx0XHRcdFx0XHRcdGNvbmZpZ1ZhbHVlcy5zZXQobWV0cmljQ29uZmlnVmFsdWUua2V5LCBtZXRyaWNDb25maWdWYWx1ZS52YWx1ZSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzdGFnZS5zZXRNZXRyaWNDb25maWcoe1xuXHRcdFx0XHRcdFx0bmFtZTogbWV0cmljQ29uZmlnLm5hbWUsXG5cdFx0XHRcdFx0XHR0eXBlOiBtZXRyaWNDb25maWcudHlwZSxcblx0XHRcdFx0XHRcdGNvbmZpZ1ZhbHVlcyxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGVzdC5hZGRTdGFnZShzdGFnZSlcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRlc3Rcblx0XHR9KVxuXHR9XG5cblx0YXN5bmMgc2VuZFBpbmcodGVzdDogVXNhZ2VUZXN0LCBzdGFnZTogU3RhZ2UpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxhc3RQaW5nID0gdGhpcy5sYXN0UGluZy50aGVuKFxuXHRcdFx0KCkgPT4gdGhpcy5kb1NlbmRQaW5nKHN0YWdlLCB0ZXN0KSxcblx0XHRcdCgpID0+IHRoaXMuZG9TZW5kUGluZyhzdGFnZSwgdGVzdCksXG5cdFx0KVxuXHRcdHJldHVybiB0aGlzLmxhc3RQaW5nXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRvU2VuZFBpbmcoc3RhZ2U6IFN0YWdlLCB0ZXN0OiBVc2FnZVRlc3QpIHtcblx0XHQvLyBJbW1lZGlhdGVseSBzdG9wIHNlbmRpbmcgcGluZ3MgaWYgdGhlIHVzZXIgaGFzIG9wdGVkIG91dC5cblx0XHQvLyBPbmx5IGFwcGxpY2FibGUgaWYgdGhlIHVzZXIgb3B0cyBvdXQgYW5kIHRoZW4gZG9lcyBub3QgcmUtbG9nLlxuXHRcdGlmICh0aGlzLnN0b3JhZ2VCZWhhdmlvciA9PT0gU3RvcmFnZUJlaGF2aW9yLlBlcnNpc3QgJiYgIXRoaXMuZ2V0T3B0SW5EZWNpc2lvbigpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRjb25zdCB0ZXN0RGV2aWNlSWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2UoKS5nZXRUZXN0RGV2aWNlSWQoKVxuXHRcdGlmICh0ZXN0RGV2aWNlSWQgPT0gbnVsbCkge1xuXHRcdFx0Y29uc29sZS53YXJuKFwiTm8gZGV2aWNlIGlkIHNldCBiZWZvcmUgc2VuZGluZyBwaW5nc1wiKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgbWV0cmljcyA9IEFycmF5LmZyb20oc3RhZ2UuY29sbGVjdGVkTWV0cmljcykubWFwKChba2V5LCB7IG5hbWUsIHZhbHVlIH1dKSA9PlxuXHRcdFx0Y3JlYXRlVXNhZ2VUZXN0TWV0cmljRGF0YSh7XG5cdFx0XHRcdG5hbWU6IG5hbWUsXG5cdFx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdH0pLFxuXHRcdClcblxuXHRcdGNvbnN0IGRhdGEgPSBjcmVhdGVVc2FnZVRlc3RQYXJ0aWNpcGF0aW9uSW4oe1xuXHRcdFx0dGVzdElkOiB0ZXN0LnRlc3RJZCxcblx0XHRcdG1ldHJpY3MsXG5cdFx0XHRzdGFnZTogc3RhZ2UubnVtYmVyLnRvU3RyaW5nKCksXG5cdFx0XHR0ZXN0RGV2aWNlSWQ6IHRlc3REZXZpY2VJZCxcblx0XHR9KVxuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoVXNhZ2VUZXN0UGFydGljaXBhdGlvblNlcnZpY2UsIGRhdGEsIHtcblx0XHRcdFx0c3VzcGVuc2lvbkJlaGF2aW9yOiBTdXNwZW5zaW9uQmVoYXZpb3IuVGhyb3csXG5cdFx0XHR9KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgU3VzcGVuc2lvbkVycm9yKSB7XG5cdFx0XHRcdHRlc3QuYWN0aXZlID0gZmFsc2Vcblx0XHRcdFx0Y29uc29sZS5sb2coXCJyYXRlLWxpbWl0IGZvciBwaW5ncyByZWFjaGVkXCIpXG5cdFx0XHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBQcmVjb25kaXRpb25GYWlsZWRFcnJvcikge1xuXHRcdFx0XHRpZiAoZS5kYXRhID09PSBcImludmFsaWRfc3RhdGVcIikge1xuXHRcdFx0XHRcdHRlc3QuYWN0aXZlID0gZmFsc2Vcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgVHJpZWQgdG8gc2VuZCBwaW5nIGZvciBwYXVzZWQgdGVzdCAke3Rlc3QudGVzdE5hbWV9YCwgZSlcblx0XHRcdFx0fSBlbHNlIGlmIChlLmRhdGEgPT09IFwiaW52YWxpZF9yZXN0YXJ0XCIpIHtcblx0XHRcdFx0XHR0ZXN0LmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFRyaWVkIHRvIHJlc3RhcnQgdGVzdCAnJHt0ZXN0LnRlc3ROYW1lfScgaW4gUGFydGljaXBhdGlvbk1vZGUuT25jZSB0aGF0IGRldmljZSBoYXMgYWxyZWFkeSBwYXJ0aWNpcGF0ZWQgaW5gLCBlKVxuXHRcdFx0XHR9IGVsc2UgaWYgKGUuZGF0YSA9PT0gXCJpbnZhbGlkX3N0YWdlXCIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgVHJpZWQgdG8gc2VuZCBwaW5nIGZvciB3cm9uZyBzdGFnZSAke3N0YWdlLm51bWJlcn0gb2YgdGVzdCAnJHt0ZXN0LnRlc3ROYW1lfSdgLCBlKVxuXHRcdFx0XHR9IGVsc2UgaWYgKGUuZGF0YSA9PT0gXCJpbnZhbGlkX3N0YWdlX3NraXBcIikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGBUcmllZCB0byBza2lwIGEgcmVxdWlyZWQgc3RhZ2UgYmVmb3JlIHN0YWdlICR7c3RhZ2UubnVtYmVyfSBvZiB0ZXN0ICcke3Rlc3QudGVzdE5hbWV9J2AsIGUpXG5cdFx0XHRcdH0gZWxzZSBpZiAoZS5kYXRhID09PSBcImludmFsaWRfc3RhZ2VfcmVwZXRpdGlvblwiKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFRyaWVkIHRvIHJlcGVhdCBzdGFnZSAke3N0YWdlLm51bWJlcn0gb2YgdGVzdCAnJHt0ZXN0LnRlc3ROYW1lfScgdG9vIG1hbnkgdGltZXNgLCBlKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHQvLyBDYWNoZWQgYXNzaWdubWVudHMgYXJlIGxpa2VseSBvdXQgb2YgZGF0ZSBpZiB3ZSBydW4gaW50byBhIE5vdEZvdW5kRXJyb3IgaGVyZS5cblx0XHRcdFx0Ly8gV2Ugc2hvdWxkIG5vdCBhdHRlbXB0IHRvIHJlLXNlbmQgcGluZ3MsIGFzIHRoZSByZWxldmFudCB0ZXN0IGhhcyBsaWtlbHkgYmVlbiBkZWxldGVkLlxuXHRcdFx0XHQvLyBIZW5jZSwgd2UganVzdCByZW1vdmUgdGhlIGNhY2hlZCBhc3NpZ25tZW50IGFuZCBkaXNhYmxlIHRoZSB0ZXN0LlxuXHRcdFx0XHR0ZXN0LmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBUcmllZCB0byBzZW5kIHBpbmcuIFJlbW92aW5nIHRlc3QgJyR7dGVzdC50ZXN0TmFtZX0nIGZyb20gc3RvcmFnZWAsIGUpXG5cblx0XHRcdFx0Y29uc3Qgc3RvcmVkQXNzaWdubWVudHMgPSBhd2FpdCB0aGlzLnN0b3JhZ2UoKS5nZXRBc3NpZ25tZW50cygpXG5cdFx0XHRcdGlmIChzdG9yZWRBc3NpZ25tZW50cykge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmFnZSgpLnN0b3JlQXNzaWdubWVudHMoe1xuXHRcdFx0XHRcdFx0dXBkYXRlZEF0OiBzdG9yZWRBc3NpZ25tZW50cy51cGRhdGVkQXQsXG5cdFx0XHRcdFx0XHR1c2FnZU1vZGVsVmVyc2lvbjogc3RvcmVkQXNzaWdubWVudHMudXNhZ2VNb2RlbFZlcnNpb24sXG5cdFx0XHRcdFx0XHRhc3NpZ25tZW50czogc3RvcmVkQXNzaWdubWVudHMuYXNzaWdubWVudHMuZmlsdGVyKChhc3NpZ25tZW50KSA9PiBhc3NpZ25tZW50LnRlc3RJZCAhPT0gdGVzdC50ZXN0SWQpLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIEJhZFJlcXVlc3RFcnJvcikge1xuXHRcdFx0XHR0ZXN0LmFjdGl2ZSA9IGZhbHNlXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBUcmllZCB0byBzZW5kIHBpbmcuIFNldHRpbmcgdGVzdCAnJHt0ZXN0LnRlc3ROYW1lfScgaW5hY3RpdmUgYmVjYXVzZSBpdCBpcyBtaXNjb25maWd1cmVkYCwgZSlcblx0XHRcdH0gZWxzZSBpZiAoaXNPZmZsaW5lRXJyb3IoZSkpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJUcmllZCB0byBzZW5kIHBpbmcsIGJ1dCB3ZSBhcmUgb2ZmbGluZVwiLCBlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztJQUNhLFFBQU4sTUFBWTtDQUNmO0NBQ0E7Q0FDQTtDQUNBO0NBQ0EsbUJBQW1CLElBQUk7Q0FDdkIsZ0JBQWdCLElBQUk7Q0FDcEIsWUFBWSxRQUFRLE1BQU0sVUFBVSxVQUFVO0FBQzFDLE9BQUssU0FBUztBQUNkLE9BQUssT0FBTztBQUNaLE9BQUssV0FBVztBQUNoQixPQUFLLFdBQVc7Q0FDbkI7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
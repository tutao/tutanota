import o from "@tutao/otest"
import { MailSet, MailSetTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../TestUtils"
import { MailSetKind } from "../../../../src/common/api/common/TutanotaConstants"
import { LabelsPopupViewModel } from "../../../../src/mail-app/mail/view/LabelsPopupViewModel"
import { LabelState } from "../../../../src/mail-app/mail/model/MailModel"

o.spec("LabelsPopupViewModelTest", () => {
	const originalLabels: MailSet[] = [
		createTestEntity(MailSetTypeRef, {
			_id: ["mailSetList", "first"],
			folderType: MailSetKind.LABEL,
			name: "1",
			parentFolder: null,
		}),
		createTestEntity(MailSetTypeRef, {
			_id: ["mailSetList", "second"],
			folderType: MailSetKind.LABEL,
			name: "2",
		}),
		createTestEntity(MailSetTypeRef, {
			_id: ["mailSetList", "third"],
			folderType: MailSetKind.LABEL,
			name: "3",
		}),
		createTestEntity(MailSetTypeRef, {
			_id: ["mailSetList", "fourth"],
			folderType: MailSetKind.LABEL,
			name: "4",
		}),
		createTestEntity(MailSetTypeRef, {
			_id: ["mailSetList", "fifth"],
			folderType: MailSetKind.LABEL,
			name: "5",
		}),
		createTestEntity(MailSetTypeRef, {
			_id: ["mailSetList", "sixth"],
			folderType: MailSetKind.LABEL,
			name: "6",
		}),
	]

	let mailLabelMap: Map<Id, ReadonlyArray<MailSet>>
	let initialLabelStates: { label: MailSet; state: LabelState }[]
	let viewModel: LabelsPopupViewModel

	const checkStateChangeOutput = (expectedAdded: MailSet[], expectedRemoved: MailSet[], expectedMaxReached: boolean) => {
		const { addedLabels, removedLabels } = viewModel.getLabelStateChange()

		o(addedLabels).deepEquals(expectedAdded)
		o(removedLabels).deepEquals(removedLabels)

		o(viewModel.isLabelLimitReached()).equals(expectedMaxReached)
	}

	o.beforeEach(() => {
		mailLabelMap = new Map()
		initialLabelStates = originalLabels.map((label) => {
			return { label: label, state: LabelState.NotApplied }
		})
	})

	o.test("add a label", () => {
		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		const addedLabel = initialLabelStates[0].label
		viewModel.toggleLabel(addedLabel)

		checkStateChangeOutput([addedLabel], [], false)
	})

	o.test("remove a label", () => {
		const labelStateToRemove = initialLabelStates[0]

		mailLabelMap.set("mailId", [labelStateToRemove.label])
		labelStateToRemove.state = LabelState.Applied

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(labelStateToRemove.label)

		checkStateChangeOutput([], [labelStateToRemove.label], false)
	})

	o.test("add and remove a label", () => {
		const labelStateToRemove = initialLabelStates[0]
		const labelToAdd = initialLabelStates[1].label

		mailLabelMap.set("mailId", [labelStateToRemove.label])
		labelStateToRemove.state = LabelState.Applied

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(labelToAdd)
		viewModel.toggleLabel(labelStateToRemove.label)

		checkStateChangeOutput([labelToAdd], [labelStateToRemove.label], false)
	})

	o.test("add an additional label", () => {
		const initialLabelState = initialLabelStates[0]
		const labelToAdd = initialLabelStates[1].label

		mailLabelMap.set("mailId", [initialLabelState.label])
		initialLabelState.state = LabelState.Applied

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(labelToAdd)

		checkStateChangeOutput([labelToAdd], [], false)
	})

	o.test("remove one of many labels", () => {
		const initialLabels = [initialLabelStates[0], initialLabelStates[1]]
		const labelToRemove = initialLabels[1].label

		mailLabelMap.set(
			"mailId",
			initialLabels.map((initialState) => initialState.label),
		)
		for (const label of initialLabels) {
			label.state = LabelState.Applied
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(labelToRemove)

		checkStateChangeOutput([], [labelToRemove], false)
	})

	o.test("add partially applied label to all", () => {
		const initialLabelState = initialLabelStates[0]

		mailLabelMap.set("mailId", [initialLabelState.label])
		mailLabelMap.set("mailId2", [])
		initialLabelState.state = LabelState.AppliedToSome

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(initialLabelState.label)

		checkStateChangeOutput([initialLabelState.label], [], false)
	})

	o.test("remove partially applied label from all", () => {
		const initialLabelState = initialLabelStates[0]

		mailLabelMap.set("mailId", [initialLabelState.label])
		mailLabelMap.set("mailId2", [])
		initialLabelState.state = LabelState.AppliedToSome

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(initialLabelState.label)
		// need to toggle twice so it will go into removed state, first toggle changes to added
		viewModel.toggleLabel(initialLabelState.label)

		checkStateChangeOutput([], [initialLabelState.label], false)
	})

	o.test("existing partially applied labels, add a different label", () => {
		const initialLabels = [initialLabelStates[0], initialLabelStates[1]]
		const addedLabel = initialLabelStates[2].label

		mailLabelMap.set("mailId", [initialLabels[0].label])
		mailLabelMap.set("mailId2", [initialLabels[1].label])
		for (const label of initialLabels) {
			label.state = LabelState.AppliedToSome
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(addedLabel)

		checkStateChangeOutput([addedLabel], [], false)
	})

	o.test("starting with five labels sets labelLimitReached to true", () => {
		const initialLabels = initialLabelStates.slice(0, 5)

		mailLabelMap.set(
			"mailId",
			initialLabels.map((label) => label.label),
		)
		for (const label of initialLabels) {
			label.state = LabelState.Applied
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		o(viewModel.isLabelLimitReached()).equals(true)
	})

	o.test("Adding a fifth label sets labelLimitReached to true", () => {
		const initialLabels = initialLabelStates.slice(0, 4)
		const addedLabel = initialLabelStates[4].label

		mailLabelMap.set(
			"mailId",
			initialLabels.map((label) => label.label),
		)
		for (const label of initialLabels) {
			label.state = LabelState.Applied
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(addedLabel)

		checkStateChangeOutput([addedLabel], [], true)
	})

	o.test("toggling will not apply label if limit has already been reached", () => {
		const initialLabels = initialLabelStates.slice(0, 5)
		const addedLabel = initialLabelStates[5].label

		mailLabelMap.set(
			"mailId",
			initialLabels.map((label) => label.label),
		)
		for (const label of initialLabels) {
			label.state = LabelState.Applied
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(addedLabel)

		checkStateChangeOutput([], [], true)
	})

	o.test("Can add and remove in single operation, if it adds up to being below limit", () => {
		const initialLabels = initialLabelStates.slice(0, 5)
		const removedLabel = initialLabels[0].label
		const addedLabel = initialLabelStates[5].label

		mailLabelMap.set(
			"mailId",
			initialLabels.map((label) => label.label),
		)
		for (const label of initialLabels) {
			label.state = LabelState.Applied
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(removedLabel)
		viewModel.toggleLabel(addedLabel)

		checkStateChangeOutput([addedLabel], [removedLabel], true)
	})

	o.test("toggling same label twice results in no change", () => {
		const initialLabel = initialLabelStates[0]

		mailLabelMap.set("mailId", [initialLabel.label])
		initialLabel.state = LabelState.Applied

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(initialLabel.label)
		viewModel.toggleLabel(initialLabel.label)

		checkStateChangeOutput([], [], false)
	})

	o.test("adding to partially applied mails will set labelLimitReached to true", () => {
		const addedLabels = [initialLabelStates[4].label, initialLabelStates[5].label]

		mailLabelMap.set("mailId", [initialLabelStates[0].label, initialLabelStates[1].label, initialLabelStates[2].label])
		mailLabelMap.set("mailId2", [initialLabelStates[0].label, initialLabelStates[1].label])
		initialLabelStates[0].state = LabelState.Applied
		initialLabelStates[1].state = LabelState.Applied
		initialLabelStates[2].state = LabelState.AppliedToSome

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(addedLabels[0])
		viewModel.toggleLabel(addedLabels[1])

		checkStateChangeOutput(addedLabels, [], true)
	})

	o.test("if label limit is reached, first toggle will set to remove AppliedToSome label", () => {
		const initialLabels = initialLabelStates.slice(0, 5)
		const removedLabel = initialLabels[1].label

		mailLabelMap.set(
			"mailId",
			initialLabels.map((label) => label.label),
		)
		mailLabelMap.set("mailId2", [])
		for (const label of initialLabels) {
			label.state = LabelState.AppliedToSome
		}

		viewModel = new LabelsPopupViewModel(mailLabelMap, initialLabelStates)

		viewModel.toggleLabel(removedLabel)

		checkStateChangeOutput([], [removedLabel], false)
	})
})

import o from "@tutao/otest"
import { createTestEntity } from "../TestUtils"
import { MailSet, MailSetTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { MailSetKind } from "../../../src/common/api/common/TutanotaConstants"
import { LabelState } from "../../../src/mail-app/mail/model/MailModel"
import { categorizeLabels } from "../../../src/mail-app/mail/view/LabelsPopup"

o.spec("LabelsPopupTest", function () {
	const originalLabels: { label: MailSet; state: LabelState }[] = [
		{
			label: createTestEntity(MailSetTypeRef, {
				_id: ["mailSetList", "first"],
				folderType: MailSetKind.LABEL,
				name: "1",
				parentFolder: null,
			}),
			state: LabelState.NotApplied,
		},
		{
			label: createTestEntity(MailSetTypeRef, {
				_id: ["mailSetList", "second"],
				folderType: MailSetKind.LABEL,
				name: "2",
			}),
			state: LabelState.NotApplied,
		},
		{
			label: createTestEntity(MailSetTypeRef, {
				_id: ["mailSetList", "third"],
				folderType: MailSetKind.LABEL,
				name: "3",
			}),
			state: LabelState.NotApplied,
		},
		{
			label: createTestEntity(MailSetTypeRef, {
				_id: ["mailSetList", "fourth"],
				folderType: MailSetKind.LABEL,
				name: "4",
			}),
			state: LabelState.NotApplied,
		},
	]

	let currentLabelState: { label: MailSet; state: LabelState }[] = []

	// The output from the categorizeLabels function is what gets passed on to the server to be added/removed
	// So that is why we want to test it so thoroughly
	o.spec("categorizeLabels", function () {
		o.beforeEach(function () {
			currentLabelState = structuredClone(originalLabels)
		})

		o.test("add one label", function () {
			// Starting State
			const currentLabels: Set<MailSet> = new Set()

			// Change
			const addedLabelId = currentLabelState[0].label._id
			currentLabelState[0].state = LabelState.Applied

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			o(addedLabels.length).equals(1)
			o(addedLabels[0]._id).equals(addedLabelId)
			o(removedLabels.length).equals(0)
		})

		o.test("one label, remove it", function () {
			// Starting state
			const currentLabels = new Set([currentLabelState[0].label])

			// Change
			const removedLabelId = currentLabelState[0].label._id

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			o(addedLabels.length).equals(0)
			o(removedLabels.length).equals(1)
			o(removedLabels[0]._id).equals(removedLabelId)
		})

		o.test("add and remove label in same operation", function () {
			// Starting State
			const currentLabels = new Set([currentLabelState[0].label])

			// Change
			const addedLabelId = currentLabelState[1].label._id
			currentLabelState[1].state = LabelState.Applied
			const removedLabelId = currentLabelState[0].label._id

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			o(addedLabels.length).equals(1)
			o(addedLabels[0]._id).equals(addedLabelId)
			o(removedLabels.length).equals(1)
			o(removedLabels[0]._id).equals(removedLabelId)
		})

		o.test("add additional label", function () {
			// Starting State
			const currentLabels = new Set([currentLabelState[0].label])
			currentLabelState[0].state = LabelState.Applied

			// Change
			const addedLabelId = currentLabelState[1].label._id
			currentLabelState[1].state = LabelState.Applied

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			// All the labels with state Applied are passed, even if there was no change so we expect 2
			o(addedLabels.length).equals(2)
			o(addedLabels[0]._id).equals([...currentLabels][0]._id)
			o(addedLabels[1]._id).equals(addedLabelId)
			o(removedLabels.length).equals(0)
		})

		o.test("multiple labels, only remove one label", function () {
			// Starting State
			const currentLabels = new Set([currentLabelState[0].label, currentLabelState[1].label])
			currentLabelState[0].state = LabelState.Applied

			// Change
			const removedLabelId = currentLabelState[1].label._id

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			// All the labels with state Applied are passed, even if there was no change so we expect 1
			o(addedLabels.length).equals(1)
			o(removedLabels.length).equals(1)
			o(removedLabels[0]._id).equals(removedLabelId)
		})

		o.test("add partially applied label to all", function () {
			// Starting State
			const currentLabels = new Set([currentLabelState[0].label, currentLabelState[1].label])
			currentLabelState[0].state = LabelState.AppliedToSome

			// Change
			const addedLabelId = currentLabelState[1].label._id
			currentLabelState[1].state = LabelState.Applied

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			o(addedLabels.length).equals(1)
			o(addedLabels[0]._id).equals(addedLabelId)
			o(removedLabels.length).equals(0)
		})

		o.test("remove partially applied label from all", function () {
			// Starting State
			const currentLabels = new Set([currentLabelState[0].label, currentLabelState[1].label])
			currentLabelState[0].state = LabelState.AppliedToSome

			// Change
			const removedLabelId = currentLabelState[1].label._id

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			o(addedLabels.length).equals(0)
			o(removedLabels.length).equals(1)
			o(removedLabels[0]._id).equals(removedLabelId)
		})

		o.test("existing partially applied labels, add a different label", function () {
			// Starting State
			const currentLabels = new Set([currentLabelState[0].label, currentLabelState[1].label])
			currentLabelState[0].state = LabelState.AppliedToSome
			currentLabelState[1].state = LabelState.AppliedToSome

			// Change
			const addedLabelId = currentLabelState[2].label._id
			currentLabelState[2].state = LabelState.Applied

			const { addedLabels, removedLabels } = categorizeLabels(currentLabelState, currentLabels)

			o(addedLabels.length).equals(1)
			o(addedLabels[0]._id).equals(addedLabelId)
			o(removedLabels.length).equals(0)
		})
	})
})

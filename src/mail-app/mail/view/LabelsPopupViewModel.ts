import { MailSet } from "../../../common/api/entities/tutanota/TypeRefs"
import { LabelState } from "../model/MailModel"
import { MAX_LABELS_PER_MAIL } from "../../../common/api/common/TutanotaConstants"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"

export class LabelsPopupViewModel {
	private labelLimitReached: boolean = false
	private labelStateTracker: Array<{ label: MailSet; state: LabelState; startingState: LabelState }> = []

	constructor(
		private readonly labelsForMails: ReadonlyMap<Id, ReadonlyArray<MailSet>>,
		initialLabelState: { label: MailSet; state: LabelState }[],
	) {
		for (const label of initialLabelState) {
			this.labelStateTracker.push({ label: label.label, state: label.state, startingState: label.state })
		}
		// We sort right now
		this.labelStateTracker.sort((labelA, labelB) => labelA.label.name.localeCompare(labelB.label.name))
		this.updateLabelLimitReached()
	}

	getLabelState(): Array<{ label: MailSet; state: LabelState; startingState: LabelState }> {
		return this.labelStateTracker
	}

	isLabelLimitReached(): boolean {
		return this.labelLimitReached
	}

	toggleLabel(label: MailSet): void {
		this.toggleLabelById(getElementId(label))
	}

	toggleLabelById(labelId: Id): void {
		const labelState = this.labelStateTracker.find((item) => getElementId(item.label) === labelId)
		if (!labelState) {
			return
		}
		switch (labelState.state) {
			case LabelState.AppliedToSome:
				labelState.state = this.labelLimitReached ? LabelState.NotApplied : LabelState.Applied
				break
			case LabelState.NotApplied:
				if (!this.labelLimitReached) {
					labelState.state = LabelState.Applied
				}
				break
			case LabelState.Applied:
				labelState.state = LabelState.NotApplied
				break
		}

		this.updateLabelLimitReached()
	}

	getLabelStateChange(): Record<"addedLabels" | "removedLabels", MailSet[]> {
		const addedLabels: MailSet[] = []
		const removedLabels: MailSet[] = []

		for (const label of this.labelStateTracker) {
			if (label.state !== label.startingState) {
				if (label.state === LabelState.Applied) {
					addedLabels.push(label.label)
				} else if (label.state === LabelState.NotApplied) {
					removedLabels.push(label.label)
				}
				// Do not have to check for LabelState.AppliedToSome, it cannot be explicitly set
			}
		}

		return { addedLabels, removedLabels }
	}

	private updateLabelLimitReached(): void {
		const { addedLabels, removedLabels } = this.getLabelStateChange()
		if (addedLabels.length >= MAX_LABELS_PER_MAIL) {
			this.labelLimitReached = true
			return
		}

		for (const [, labels] of this.labelsForMails) {
			// creating a set removes duplicates in the case of a label getting added to all that was previously only on some
			const labelsOnMail = new Set([...addedLabels, ...labels])

			if (labelsOnMail.size - removedLabels.length >= MAX_LABELS_PER_MAIL) {
				this.labelLimitReached = true
				return
			}
		}

		this.labelLimitReached = false
	}
}

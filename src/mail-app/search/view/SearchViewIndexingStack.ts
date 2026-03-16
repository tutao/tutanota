import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size"
import { ProgressSnackBar, ProgressSnackBarAttrs, ProgressState } from "../../../common/gui/ProgressSnackBar"
import { IndexingErrorReason, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { mailLocator } from "../../mailLocator"

export interface SearchProgressStackAttrs {
	searchIndexState: SearchIndexStateInfo
}

export class SearchProgressStack implements Component<SearchProgressStackAttrs> {
	view({ attrs: { searchIndexState } }: Vnode<SearchProgressStackAttrs>): Children {
		const displayIndexing: boolean = searchIndexState.error != null || searchIndexState.progress !== 0

		// FIXME: this is copied from DriveTransferStack and there should be a proper component or something but I do not want to deal with it right now
		return m(
			".flex.col.abs",
			{
				style: {
					width: `min(calc(100vw - ${size.spacing_12}px * 2), 500px)`,
					bottom: px(size.spacing_12),
					right: px(size.spacing_12),
					gap: px(size.spacing_12),
				},
			},
			displayIndexing
				? m(ProgressSnackBar, {
						//FIXME: translation
						mainText: "Indexing emails",
						infoText: this.getIndexingStateText(searchIndexState),
						progressState: this.getIndexingProgressState(searchIndexState),
						percentage: Math.trunc(searchIndexState.progress),
						onCancel: () => mailLocator.indexerFacade.cancelMailIndexing(),
					} satisfies ProgressSnackBarAttrs)
				: null,
		)
	}

	private getIndexingStateText(searchIndexState: SearchIndexStateInfo): Translation | undefined {
		if (searchIndexState.error) {
			if (searchIndexState.error === IndexingErrorReason.ConnectionLost) {
				return lang.getTranslation("indexingFailedConnection_error")
			} else {
				return lang.getTranslation("indexing_error")
			}
		}
		// FIXME: translation, we may want this text or maybe not idk
		//return `Currently indexed to: ${lang.formats.dateWithMonth.format(new Date(searchIndexState.currentMailIndexTimestamp))}`
	}

	private getIndexingProgressState(searchIndexState: SearchIndexStateInfo): ProgressState {
		if (searchIndexState.error) {
			return ProgressState.error
		} else if (searchIndexState.progress !== 0) {
			return ProgressState.running
		} else {
			// If the progress is 0, it is not being worked on (and if there is no error, that means it is finished)
			// For search, it should not show in this state
			return ProgressState.done
		}
	}
}

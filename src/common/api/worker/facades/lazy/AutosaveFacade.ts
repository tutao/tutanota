import * as cborg from "cborg"
import { customTypeDecoders, customTypeEncoders } from "../../offline/OfflineStorage"

/**
 * Version of the format
 */
const LOCAL_DRAFT_VERSION: number = 1

/**
 * Key to use in databases.
 *
 * We only support one draft maximum, destroying any previous draft if one is currently stored.
 */
export const LOCAL_DRAFT_KEY = "current"

/**
 * Describes a locally autosaved Mail draft
 */
export interface LocalAutosavedDraftData {
	locallySavedTime: number

	editedTime: number
	lastUpdatedTime: number

	mailId: IdTuple | null
	mailGroupId: Id

	subject: string
	body: string
	confidential: boolean

	senderAddress: string
	to: LocalDraftMailRecipient[]
	cc: LocalDraftMailRecipient[]
	bcc: LocalDraftMailRecipient[]
}

/**
 * Describes a mail recipient for {@link LocalAutosavedDraftData}
 */
export interface LocalDraftMailRecipient {
	name: string
	address: string
}

/**
 * Facade interface that handles locally storing data for a single Mail draft as the user is editing the draft.
 */
export interface AutosaveFacade {
	/**
	 * Delete the autosaved draft data, if any
	 */
	clearAutosavedDraftData(): Promise<void>

	/**
	 * Get the locally autosaved draft data, if any, or returns null
	 */
	getAutosavedDraftData(): Promise<LocalAutosavedDraftData | null>

	/**
	 * (Over)writes the locally autosaved draft data
	 */
	setAutosavedDraftData(draftData: LocalAutosavedDraftData): Promise<void>
}

interface VersionedLocalAutosavedDraftData extends LocalAutosavedDraftData {
	version: number
}

/**
 * Encode the autosaved draft data
 * @param data data to encode
 */
export function encodeLocalAutosavedDraftData(data: LocalAutosavedDraftData): Uint8Array {
	return cborg.encode(
		{
			version: LOCAL_DRAFT_VERSION,
			...data,
		},
		{ typeEncoders: customTypeEncoders },
	)
}

/**
 * Decode the autosaved draft data into an object, handling any migrations
 * @param data data to decode
 * @throws Error if {@link data} is not valid
 */
export function decodeLocalAutosavedDraftData(data: Uint8Array): LocalAutosavedDraftData {
	const decoded = cborg.decode(data, { tags: customTypeDecoders }) as Partial<VersionedLocalAutosavedDraftData>

	if (decoded.version !== LOCAL_DRAFT_VERSION) {
		throw new Error(`Expected version ${LOCAL_DRAFT_VERSION} from decoded autosaved draft but got version ${decoded.version}`)
	}

	delete decoded.version

	return decoded as LocalAutosavedDraftData
}

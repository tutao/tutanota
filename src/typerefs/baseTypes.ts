import { ApplicationTypesHash } from "./EntityFunctions.js"

/**
 * Do **NOT** change the names of these attributes, they need to match the record found on the
 * server at ApplicationTypesService#ApplicationTypesGetOut. This is to make sure we can update the
 * format of the service output in the future. With general schema definitions this would not be
 * possible as schemas returned by this service are required to read the schemas themselves.
 */
export type ApplicationTypesGetOut = {
	applicationTypesHash: ApplicationTypesHash
	applicationTypesJson: string
}

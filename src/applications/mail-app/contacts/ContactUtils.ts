import { ContactCustomDate, ContactRelationship, ContactSocialId } from "@tutao/entities/tutanota"
import { downcast } from "@tutao/utils"
import { ContactCustomDateType, ContactRelationshipType, ContactSocialType } from "@tutao/entities/tutanota"

export const getContactSocialType = (contactSocialId: ContactSocialId): ContactSocialType => downcast(contactSocialId.type)
export const getCustomDateType = (customDate: ContactCustomDate): ContactCustomDateType => downcast(customDate.type)
export const getRelationshipType = (relationship: ContactRelationship): ContactRelationshipType => downcast(relationship.type)

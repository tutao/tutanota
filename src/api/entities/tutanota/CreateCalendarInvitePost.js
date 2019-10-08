// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateCalendarInvitePostTypeRef:TypeRef<CreateCalendarInvitePost> = new TypeRef("tutanota", "CreateCalendarInvitePost")
export const _TypeModel:TypeModel= {"name":"CreateCalendarInvitePost","since":37,"type":"DATA_TRANSFER_TYPE","id":1018,"rootId":"CHR1dGFub3RhAAP6","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1019,"since":37,"type":"Number","cardinality":"One","final":false,"encrypted":false},"invitee":{"name":"invitee","id":1021,"since":37,"type":"String","cardinality":"One","final":false,"encrypted":false},"invitor":{"name":"invitor","id":1020,"since":37,"type":"String","cardinality":"One","final":false,"encrypted":false}},"associations":{"event":{"name":"event","id":1022,"since":37,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"One","refType":"CalendarEvent","final":true,"external":false}},"app":"tutanota","version":"37"}

export function createCreateCalendarInvitePost(values?: $Shape<$Exact<CreateCalendarInvitePost>>):CreateCalendarInvitePost {
    return Object.assign(create(_TypeModel, CreateCalendarInvitePostTypeRef), values)
}

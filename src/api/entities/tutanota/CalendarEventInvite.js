// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventInviteTypeRef:TypeRef<CalendarEventInvite> = new TypeRef("tutanota", "CalendarEventInvite")
export const _TypeModel:TypeModel= {"name":"CalendarEventInvite","since":37,"type":"LIST_ELEMENT_TYPE","id":1009,"rootId":"CHR1dGFub3RhAAPx","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":1013,"since":37,"type":"Number","cardinality":"One","final":false,"encrypted":false},"_id":{"name":"_id","id":1011,"since":37,"type":"GeneratedId","cardinality":"One","final":true,"encrypted":false},"_ownerGroup":{"name":"_ownerGroup","id":1014,"since":37,"type":"GeneratedId","cardinality":"ZeroOrOne","final":true,"encrypted":false},"_permissions":{"name":"_permissions","id":1012,"since":37,"type":"GeneratedId","cardinality":"One","final":true,"encrypted":false},"invitor":{"name":"invitor","id":1016,"since":37,"type":"String","cardinality":"One","final":false,"encrypted":false},"status":{"name":"status","id":1015,"since":37,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"event":{"name":"event","id":1017,"since":37,"type":"LIST_ELEMENT_ASSOCIATION","cardinality":"One","refType":"CalendarEvent","final":true,"external":false}},"app":"tutanota","version":"37"}

export function createCalendarEventInvite(values?: $Shape<$Exact<CalendarEventInvite>>):CalendarEventInvite {
    return Object.assign(create(_TypeModel, CalendarEventInviteTypeRef), values)
}

// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarAlarmInfoTypeRef:TypeRef<CalendarAlarmInfo> = new TypeRef("tutanota", "CalendarAlarmInfo")
export const _TypeModel:TypeModel= {"name":"CalendarAlarmInfo","since":33,"type":"AGGREGATED_TYPE","id":937,"rootId":"CHR1dGFub3RhAAOp","versioned":false,"encrypted":false,"values":{"_id":{"name":"_id","id":938,"since":33,"type":"CustomId","cardinality":"One","final":true,"encrypted":false},"identifier":{"name":"identifier","id":940,"since":33,"type":"String","cardinality":"One","final":false,"encrypted":true},"trigger":{"name":"trigger","id":939,"since":33,"type":"String","cardinality":"One","final":false,"encrypted":true}},"associations":{},"app":"tutanota","version":"33"}

export function createCalendarAlarmInfo():CalendarAlarmInfo {
    return create(_TypeModel, CalendarAlarmInfoTypeRef)
}

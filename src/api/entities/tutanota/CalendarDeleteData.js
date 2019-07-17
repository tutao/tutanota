// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarDeleteDataTypeRef:TypeRef<CalendarDeleteData> = new TypeRef("tutanota", "CalendarDeleteData")
export const _TypeModel:TypeModel= {"name":"CalendarDeleteData","since":34,"type":"DATA_TRANSFER_TYPE","id":983,"rootId":"CHR1dGFub3RhAAPX","versioned":false,"encrypted":false,"values":{"_format":{"name":"_format","id":984,"since":34,"type":"Number","cardinality":"One","final":false,"encrypted":false}},"associations":{"groupRootId":{"name":"groupRootId","id":985,"since":34,"type":"ELEMENT_ASSOCIATION","cardinality":"One","refType":"CalendarGroupRoot","final":false,"external":false}},"app":"tutanota","version":"34"}

export function createCalendarDeleteData():CalendarDeleteData {
    return create(_TypeModel, CalendarDeleteDataTypeRef)
}

type ReadCounterData = {
	_type: TypeRef<ReadCounterData>;
	_format: NumberString;
	monitor: string;
	owner: Id;

}

type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;
	_format: NumberString;
	value: ?NumberString;

}

type MonitorValue = {
	_type: TypeRef<MonitorValue>;
	_id: Id;
	avg: NumberString;
	max: NumberString;
	name: string;

}

type Rollup = {
	_type: TypeRef<Rollup>;
	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;

	values: MonitorValue[];
}

type RollupRoot = {
	_type: TypeRef<RollupRoot>;
	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	rollupDay: Id;
	rollupHour: Id;
	rollupMinute: Id;
}

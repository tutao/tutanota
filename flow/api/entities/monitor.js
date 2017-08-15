type ReadCounterData = {
	_type: TypeRef<ReadCounterData>;
	_format:NumberString;
	monitor:string;
	owner:Id;

}

type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;
	_format:NumberString;
	value:?NumberString;

}

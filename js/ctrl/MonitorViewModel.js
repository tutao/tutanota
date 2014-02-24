"use strict";

goog.provide('tutao.tutanota.ctrl.MonitorViewModel');

/**
 * Provides monitoring counter data and diagrams.
 * @constructor
 */
tutao.tutanota.ctrl.MonitorViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	var self = this;
	
	this._serverIds = ["-----------1"]; // add server ids to show monitoring data for more servers
	// first five server ids are: -----------1 -----------2 -----------3 -----------4 -----------5
	
	var VALUE = tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_VALUE;
	var DIFF = tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_DIFF;
	var NO_COUNTER = tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_NO_COUNTER;
	this._diagramViews = [];
	this._addCounterView("none");
	var globalView = this._addCounterView("global");
		var requestCountGroup = this._addGroupToView(globalView, "Request count");
			this._addMonitorGroup(requestCountGroup, "ValidRequestCount", "servers", DIFF);
		var exceptionCountGroup = this._addGroupToView(globalView, "Exception count");
			this._addMonitorGroup(exceptionCountGroup, "BadRequestCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "NotAuthorizedCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "NotAuthenticatedCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "MethodNotAllowedCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "NotFoundCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "InvalidDataCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "InvalidSwVersionCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "AccessDeactivatedCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "AccessExpiredCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "AccessBlockedCount", "servers", DIFF);
			this._addMonitorGroup(exceptionCountGroup, "TooManyRequestsCount", "servers", DIFF);
		var requestTimeGroup = this._addGroupToView(globalView, "Request time");
			this._addMonitorGroup(requestTimeGroup, "RequestTimeRest", "servers", VALUE);
			this._addMonitorGroup(requestTimeGroup, "RequestTime-sys-UserIdService", "global", VALUE);
			this._addMonitorGroup(requestTimeGroup, "RequestTime-tutanota-SendMailService", "global", VALUE);
			this._addMonitorGroup(requestTimeGroup, "RequestTime-tutanota-SendUnsecureMailService", "global", VALUE);
			this._addMonitorGroup(requestTimeGroup, "RequestTime-tutanota-SendMailFromExternalService", "global", VALUE);
			this._addMonitorGroup(requestTimeGroup, "CreateSnapshotTime", "global", VALUE);
        var requestSizeGroup = this._addGroupToView(globalView, "File sizes");
			this._addMonitorGroup(requestSizeGroup, "AttachmentSize", "global", VALUE);
	    var registrationGroup = this._addGroupToView(globalView, "Registration");
	        this._addMonitorGroup(registrationGroup, "FreeCustomerCount", "global", VALUE); 
	        this._addMonitorGroup(registrationGroup, "StarterCustomerCount", "global", VALUE);
	        this._addMonitorGroup(registrationGroup, "PremiumCustomerCount", "global", VALUE);
	        this._addMonitorGroup(registrationGroup, "StreamCustomerCount", "global", VALUE);
	        this._addMonitorGroup(registrationGroup, "InternalUserCount", "global", VALUE); 
	        this._addMonitorGroup(registrationGroup, "ExternalUserCount", "global", VALUE);
	        this._addMonitorGroup(registrationGroup, "TeamGroupCount", "global", VALUE); 
	    var loginGroup = this._addGroupToView(globalView, "Login");
	        this._addMonitorGroup(loginGroup, "LoginCount", "global", DIFF); 
	        this._addMonitorGroup(loginGroup, "UsersPerDayCount", "global", DIFF); 
	    var emailsGroup = this._addGroupToView(globalView, "Emails");
	        this._addMonitorGroup(emailsGroup, "SentInternalMails", "global", VALUE); 
	        this._addMonitorGroup(emailsGroup, "SentSecureExternalMails", "global", VALUE); 
	        this._addMonitorGroup(emailsGroup, "SentUnsecureExternalMails", "global", VALUE);
	        this._addMonitorGroup(emailsGroup, "ReceivedExternalMails", "global", VALUE);
            this._addMonitorGroup(emailsGroup, "SentFromExternalMails", "global", VALUE);
	    var memoryGroup = this._addGroupToView(globalView, "Memory");
	        this._addMonitorGroup(memoryGroup, "UsedMemoryInternal", "global", VALUE);
            this._addMonitorGroup(memoryGroup, "UsedMemoryExternal", "global", VALUE);
            this._addMonitorGroup(memoryGroup, "UsedMemoryInternal-Mails", "global", VALUE);
            this._addMonitorGroup(memoryGroup, "UsedMemoryInternal-Contacts", "global", VALUE);
            this._addMonitorGroup(memoryGroup, "UsedMemoryInternal-Files", "global", VALUE);
	    var sentSmsGroup = this._addGroupToView(globalView, "Sent SMS");
	        this._addMonitorGroup(sentSmsGroup, "SentSms", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSms-smskaufen", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSms-telekom", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSms-websms", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSms-46elks", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSmsRegistration", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSmsPasswordChange", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSmsMail", "global", VALUE);
	        this._addMonitorGroup(sentSmsGroup, "SentSmsMonitoring", "global", VALUE);
	    var smsRuntimeGroup = this._addGroupToView(globalView, "SMS runtime");
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-smskaufen", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-smskaufen-D1", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-smskaufen-D2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-smskaufen-O2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-smskaufen-EPLUS", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-telekom", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-telekom-D1", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-telekom-D2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-telekom-O2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-telekom-EPLUS", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-websms", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-websms-D1", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-websms-D2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-websms-O2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-websms-EPLUS", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-46elks", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-46elks-D1", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-46elks-D2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-46elks-O2", "global", NO_COUNTER);
	    	this._addMonitorGroup(smsRuntimeGroup, "SmsRuntime-46elks-EPLUS", "global", NO_COUNTER);
		var loadGroup = this._addGroupToView(globalView, "Load");
			this._addMonitorGroup(loadGroup, "CpuLoad", "servers", NO_COUNTER);
		var connectionsGroup = this._addGroupToView(globalView, "Open connections");
			this._addMonitorGroup(connectionsGroup, "OpenConnectionsInbound", "servers", NO_COUNTER);
			this._addMonitorGroup(connectionsGroup, "OpenConnectionsOutbound", "servers", NO_COUNTER);
            this._addMonitorGroup(connectionsGroup, "OpenWebSocketConnections", "global", VALUE);
		var ramGroup = this._addGroupToView(globalView, "RAM");
			this._addMonitorGroup(ramGroup, "FreeRam", "servers", NO_COUNTER);
			this._addMonitorGroup(ramGroup, "ActualFreeRam", "servers", NO_COUNTER);
			this._addMonitorGroup(ramGroup, "UsedRam", "servers", NO_COUNTER);
			this._addMonitorGroup(ramGroup, "ActualUsedRam", "servers", NO_COUNTER);
		var hddGroup = this._addGroupToView(globalView, "HDD space");
			this._addMonitorGroup(hddGroup, "FreeHddSpace", "servers", NO_COUNTER);
			this._addMonitorGroup(hddGroup, "UsedHddSpace", "servers", NO_COUNTER);
		var bandwidthGroup = this._addGroupToView(globalView, "Bandwidth");
			this._addMonitorGroup(bandwidthGroup, "IncomingBandwidth", "servers", NO_COUNTER);
			this._addMonitorGroup(bandwidthGroup, "OutgoingBandwidth", "servers", NO_COUNTER);
	    var trafficGroup = this._addGroupToView(globalView, "Traffic");
	    	this._addMonitorGroup(trafficGroup, "IncomingTraffic", "global", VALUE); 
	        this._addMonitorGroup(trafficGroup, "OutgoingTraffic", "global", VALUE); 

		var postfixGroup = this._addGroupToView(globalView, "Postfix queue size");
	    	this._addMonitorGroup(postfixGroup, "PostfixIncomingCount", "servers", VALUE);
	    	this._addMonitorGroup(postfixGroup, "PostfixActiveCount", "servers", VALUE);
	    	this._addMonitorGroup(postfixGroup, "PostfixDeferredCount", "servers", VALUE);
	    	this._addMonitorGroup(postfixGroup, "PostfixHoldCount", "servers", VALUE);
		var jvmHeapGroup = this._addGroupToView(globalView, "JVM Heap size");
	    	this._addMonitorGroup(jvmHeapGroup, "JvmHeapCommitted", "servers", NO_COUNTER);
	    	this._addMonitorGroup(jvmHeapGroup, "JvmHeapUsed", "servers", NO_COUNTER);
	    var jvmPermGenGroup = this._addGroupToView(globalView, "JVM PermGen size");
	    	this._addMonitorGroup(jvmPermGenGroup, "JvmPermgenCommitted", "servers", NO_COUNTER);
	    	this._addMonitorGroup(jvmPermGenGroup, "JvmPermgenUsed", "servers", NO_COUNTER);
	    var jvmGcCollectionsGroup = this._addGroupToView(globalView, "JVM garbage collection count"); 
	    	this._addMonitorGroup(jvmGcCollectionsGroup, "JvmGc1Collections", "servers", NO_COUNTER);
	    	this._addMonitorGroup(jvmGcCollectionsGroup, "JvmGc2Collections", "servers", NO_COUNTER);
	    var jvmGcTimesGroup = this._addGroupToView(globalView, "JVM garbace collection times");
	    	this._addMonitorGroup(jvmGcTimesGroup, "JvmGc1CollectionTime", "servers", NO_COUNTER);
	    	this._addMonitorGroup(jvmGcTimesGroup, "JvmGc2CollectionTime", "servers", NO_COUNTER);
	    var jvmCpuGroup = this._addGroupToView(globalView, "JVM tutadb cpu usage");
	    	this._addMonitorGroup(jvmCpuGroup, "JvmTutadbCpuUsage", "servers", NO_COUNTER);
	var customerView = this._addCounterView("customer");
	    var registrationGroupCustomer = this._addGroupToView(customerView, "Registration");
	    	this._addMonitorGroup(registrationGroupCustomer, "InternalUserCount", "customer", VALUE);
	        this._addMonitorGroup(registrationGroupCustomer, "TeamGroupCount", "customer", VALUE);
        var emailsGroupCustomer = this._addGroupToView(customerView, "Emails");
            this._addMonitorGroup(emailsGroupCustomer, "SentInternalMails", "customer", VALUE);
            this._addMonitorGroup(emailsGroupCustomer, "SentSecureExternalMails", "customer", VALUE);
            this._addMonitorGroup(emailsGroupCustomer, "SentUnsecureExternalMails", "customer", VALUE);
            this._addMonitorGroup(emailsGroupCustomer, "ReceivedExternalMails", "customer", VALUE);
        var smsGroupCustomer = this._addGroupToView(customerView, "SMS");
        	this._addMonitorGroup(smsGroupCustomer, "SentSms", "customer", VALUE);
        var memoryGroupCustomer = this._addGroupToView(customerView, "Memory");
            this._addMonitorGroup(memoryGroupCustomer, "UsedMemoryInternal", "customer", VALUE);
            this._addMonitorGroup(memoryGroupCustomer, "UsedMemoryExternal", "customer", VALUE);
    var groupView = this._addCounterView("group");
    	var memoryGroupGroup = this._addGroupToView(groupView, "Memory");
	    	this._addMonitorGroup(memoryGroupGroup, "UsedMemory", "group", VALUE);
            this._addMonitorGroup(memoryGroupGroup, "UsedMemoryInternal-Mails", "group", VALUE);
            this._addMonitorGroup(memoryGroupGroup, "UsedMemoryInternal-Contacts", "group", VALUE);
            this._addMonitorGroup(memoryGroupGroup, "UsedMemoryInternal-Files", "group", VALUE);
	
	this.diagramViews = ko.observableArray(this._diagramViews);
	this.diagramView = ko.observable();
	this.diagramView.subscribe(function() {
		self.refreshVisibleCounters();
	}, this);
	this.owner = ko.observable("");
	this.owner.subscribe(function() {
		if (this.diagramView().name == "customer" || this.diagramView().name == "user" || this.diagramView().name == "group") {
			this.refreshVisibleCounters();
		}
	}, this);
	this.ranges = ko.observableArray([ 
	                                  { name: "5 min", value: 5 * 60 * 1000 }, 
	                                  { name: "30 min", value: 30 * 60 * 1000 }, 
	                                  { name: "2 h", value: 2 * 60 * 60 * 1000 },
	                                  { name: "12 h", value: 12 * 60 * 60 * 1000 },
	                                  { name: "2 d", value: 2 * 24 * 60 * 60 * 1000 },
	                                  { name: "7 d", value: 7 * 24 * 60 * 60 * 1000 },
	                                  { name: "30 d", value: 30 * 24 * 60 * 60 * 1000 },
	                                  { name: "180 d", value: 180 * 24 * 60 * 60 * 1000 }
	                                  ]);
	this.range = ko.observable(this.ranges()[5]);
	this.showCurrent = ko.observable(true);
	this.untilDate = ko.observable(tutao.tutanota.util.Formatter.dateToDashString(new Date()));
	this.untilTime = ko.observable(tutao.tutanota.util.Formatter.formatLocalTime(new Date()));
	this._untilDate = ko.computed(function() {
		if (this.showCurrent()) {
			return new Date();
		} else {
			return new Date(tutao.tutanota.util.Formatter.dashStringToDate(this.untilDate()).getTime() + tutao.tutanota.util.Formatter.parseLocalTime(this.untilTime()));
		}
	}, this);

	this.diagramGroup = ko.observable(null); // the group that is currently shown in the diagram
	this.tableRows = ko.observableArray(); // {name, count, avg, min, max [valid]}, valid is only shown if null values exist
};

tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_VALUE = 0; // counter value is shown, snapshot values are directly shown in diagram (applies to monitor type Single or Average)
tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_DIFF = 1; // counter value is shown, difference of of snapshot value to last one is shown in diagram (applies to monitor type Single)
tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_NO_COUNTER = 2; // no counter value is shown, snapshot values are directly shown in diagram (applies to monitor type Direct)

tutao.tutanota.ctrl.MonitorViewModel.GLOBAL_MONITOR_ID = "-----------0";

tutao.tutanota.ctrl.MonitorViewModel.prototype._addCounterView = function(name) {
	var view = { name: name, groups: [] };
	this._diagramViews.push(view);
	return view;
};

tutao.tutanota.ctrl.MonitorViewModel.prototype._addGroupToView = function(view, name) {
	var group = { name: name, monitors: [] };
	view.groups.push(group);
	return group;
};

/**
 * @param {Number} type One of tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_*.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._addMonitorGroup = function(group, name, owner, type) {
	if (owner == "servers") {
		for (var i=0; i<this._serverIds.length; i++) {
			var monitor = { monitor: name, owner: "server_" + i, type: type, counter: ko.observable() };
			if (type == tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_NO_COUNTER) {
				monitor.counter("-");
			}
			group.monitors.push(monitor);
		}
	} else {
		var monitor = { monitor: name, owner: owner, type: type, counter: ko.observable() };
		if (type == tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_NO_COUNTER) {
			monitor.counter("-");
		}
		group.monitors.push(monitor);
	}
};

/**
 * Provides the id of the given owner type.
 * @param {string} owner The type of owner.
 * @return {string=} The id or null if not valid.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._getOwnerId = function(owner) {
	if (owner == "global") {
		return tutao.tutanota.ctrl.MonitorViewModel.GLOBAL_MONITOR_ID;
	} else if (tutao.util.StringUtils.startsWith(owner, "server_")) {
		return this._serverIds[Number(owner.substring(7))];
	} else {
		if (this.owner().length != tutao.rest.EntityRestInterface.GENERATED_MIN_ID.length) {
			return null;
		} else {			
			return this.owner();
		}
	}
};

/**
 * Shows the global counters if none are visible.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype.init = function() {
	if (this.diagramView().name == "none") {
		this.diagramView(this.diagramViews()[1]);
	}
};

tutao.tutanota.ctrl.MonitorViewModel.DataRow = function(monitor, ownerName, snapshots) {
	this.monitor = monitor;
	this.ownerName = ownerName;
	this.snapshots = snapshots;
};

tutao.tutanota.ctrl.MonitorViewModel.prototype.showDiagram = function(group) {
	this.diagramGroup(group);
	this.refreshDiagram();
	tutao.locator.monitorView.showDiagramColumn();
	setTimeout(function() {		
		tutao.locator.monitorView.diagramUpdated();
	}, 0);
};

tutao.tutanota.ctrl.MonitorViewModel.prototype.refreshDiagram = function() {
	// load the javascript charts file if it was not yet loaded
	if (!document.getElementById("chartlib")) {
		var chartlib = document.createElement('script');
		chartlib.setAttribute("id", "chartlib");
		chartlib.setAttribute("type", "text/javascript");
		chartlib.setAttribute("src", "libs/external/chart-2013-06-12.min.js");
		document.getElementsByTagName('head').item(0).appendChild(chartlib);
	}

	var self = this;
	var dataRows = [];
	this.tableRows();
	tutao.util.FunctionUtils.executeSequentially(self.diagramGroup().monitors, function(monitor, callback) {
		var owner = self._getOwnerId(monitor.owner);
		if (owner == null) {
			callback(null, new Error("unknown owner"));
			return;
		}
		self._loadSnapshots(monitor.monitor, owner, function(snapshots, exception) {
			if (exception) {
				// just skip this monitor
				callback();
			} else if (self.showCurrent() && monitor.counter() != "-") {
				// read the current counter value and add it to the diagram
				self._readCounter(monitor.monitor, owner, function(value, exception) {
					var current = null;
					if (!exception && value) {
						monitor.counter(value); // update the value for the counter column
						current = new tutao.entity.monitor.CounterSnapshot();
						current.setId([ "", tutao.rest.EntityRestInterface.stringToCustomId(String(new Date().getTime())) ]);
						current.setValue(value);
					}
					// recalculate the values for the DIFF view type
					if (monitor.type == tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_DIFF) {
						// if we want to add the current value we have to calculate the diff but reduce that diff relative to the "normal" time difference
						if (current && snapshots.length > 2) { // if there is only one snapshot we do not know the "normal" time difference, so skip it in that case
							var lastSnapshotTime = new Date(Number(tutao.rest.EntityRestInterface.customIdToString(snapshots[snapshots.length - 1].getId()[1]))).getTime();
							var beforeLastSnapshotTime = new Date(Number(tutao.rest.EntityRestInterface.customIdToString(snapshots[snapshots.length - 2].getId()[1]))).getTime();
							var currentTime = new Date(Number(tutao.rest.EntityRestInterface.customIdToString(current.getId()[1]))).getTime();
							var normalTimeDiff = lastSnapshotTime - beforeLastSnapshotTime;
							var currentTimeDiff = currentTime - lastSnapshotTime;
							if (currentTimeDiff > 0) {
								var currentValueDiff = Number(current.getValue()) - Number(snapshots[snapshots.length - 1].getValue());
								var currentNormalizedValueDiff = Math.round(currentValueDiff * normalTimeDiff / currentTimeDiff);
								current.setValue(String(currentNormalizedValueDiff));
							}
						}
						// now calcualte all other diffs beginning at the end
						for (var i=snapshots.length-1; i>0; i--) {
							snapshots[i].setValue(String(Number(snapshots[i].getValue()) - Number(snapshots[i - 1].getValue())));
						}
						snapshots.shift();
						if (current) {
							// add the current now because it shall not influence the diff calculation before
							snapshots.push(current);
						}
					} else {
						if (current) {
							// just add the snapshot as last value
							snapshots.push(current);
						}
					}
					dataRows.push(new tutao.tutanota.ctrl.MonitorViewModel.DataRow(monitor.monitor, monitor.owner, snapshots));
					callback();
				});
			} else {
				if (monitor.type == tutao.tutanota.ctrl.MonitorViewModel.VIEW_TYPE_DIFF) {
					// recalculate the values for the DIFF view type
					for (var i=snapshots.length-1; i>0; i--) {
						snapshots[i].setValue(String(Number(snapshots[i].getValue()) - Number(snapshots[i - 1].getValue())));
					}
					snapshots.shift();
				}
				// only add the snapshots
				dataRows.push(new tutao.tutanota.ctrl.MonitorViewModel.DataRow(monitor.monitor, monitor.owner, snapshots));
				callback();
			}
		});
	}, function(exception) {
		if (exception) {
			console.log(exception);
			return;
		}
		var dataTable = self._createDataTable(dataRows);
		self.tableRows(self._createTableRows(dataRows));
		self._drawDiagram(self.diagramGroup().name, dataTable);
		if (self.showCurrent()) {
			self.untilDate(tutao.tutanota.util.Formatter.dateToDashString(new Date()));
			self.untilTime(tutao.tutanota.util.Formatter.formatLocalTime(new Date()));
		}
	});
};

tutao.tutanota.ctrl.MonitorViewModel.prototype._createTableRows = function(dataRows) {
	// check if there is any null value. if yes, add a "valid" column
	var validColumn = false;
	for (var i=0; i<dataRows.length; i++) {
		for (var a=0; a<dataRows[i].snapshots.length; a++) {
			if (dataRows[i].snapshots[a].getValue() == null) {
				validColumn = true;
				break;
			}
		}
	}
	var rows = [];
	for (var i=0; i<dataRows.length; i++) {
		var invalidCount = 0;
		var sum = 0;
		var min = null;
		var max = null;
		var nbrOfSnapshots = dataRows[i].snapshots.length;
		if (nbrOfSnapshots > 0) {			
			for (var a=0; a<nbrOfSnapshots; a++) {
				var s = dataRows[i].snapshots[a];
				if (s.getValue() == null) {
					invalidCount++;
				} else {
					var value = Number(s.getValue());
					sum += value;
					if (!min || value < min) {
						min = value;
					}
					if (!max || value > max) {
						max = value;
					}
				}
			}
			var avg = (nbrOfSnapshots == invalidCount) ? null : Math.round(sum / (nbrOfSnapshots - invalidCount));
			var valid = (validColumn) ? Math.round((nbrOfSnapshots - invalidCount) * 100 / nbrOfSnapshots) : null; 
			var row = { name: dataRows[i].monitor, count: nbrOfSnapshots, avg: avg, min: min, max: max, valid: valid };
			rows.push(row);
		}
	}
	return rows;
};

/**
 * 
 * @param {Array.<tutao.tutanota.ctrl.MonitorViewModel.DataRow>} dataRows
 * @return {google.visualization.DataTable} The data table.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._createDataTable = function(dataRows) {
	// collect column names
	var columns = [ 'Timestamp' ];
	for ( var i = 0; i < dataRows.length; i++) {
		columns.push(dataRows[i].monitor + " - " + dataRows[i].ownerName);
	}

	//add column names
	var data = new google.visualization.DataTable();
	data.addColumn('datetime', 'Timestamp');
	for (var i = 1; i < columns.length; i++) {
	    data.addColumn('number', columns[i]);
	}
	
	// add data
	for (var i = 0; i < dataRows.length; i++) {
		var columnName = dataRows[i].monitor + " - " + dataRows[i].ownerName;
		var index = columns.indexOf(columnName);
		for ( var j = 0; j < dataRows[i].snapshots.length; j++) {
			var snapshot = dataRows[i].snapshots[j];
			// if the value is null, do not create a row
			if (snapshot.getValue() != null) { // test against null is needed here, otherwise '0' is not recognized		
				var array = [ new Date(Number(tutao.rest.EntityRestInterface.customIdToString(snapshot.getId()[1]))) ];
				array.length = columns.length;
				array[index] = Number(snapshot.getValue());
				data.addRow(array);
			}
		}
	}
	return data;
};

/**
 * Loads the snapshots of the given monitor and owner.
 * @param {string} monitor The monitor name.
 * @param {string} owner The owner id.
 * @param {function(?Array.<tutao.entity.monitor.CounterSnapshot>,tutao.rest.EntityRestException=)}
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._loadSnapshots = function(monitor, owner, callback) {
	var self = this;
	var seriesId = tutao.rest.EntityRestInterface.stringToCustomId(monitor + "," + owner);
	tutao.entity.monitor.CounterSnapshotSeries.load(seriesId, function(series, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		// load snapshots in multiple steps until the time range is fully covered
		var endTime = null;
		if (self.showCurrent()) {
			endTime = new Date().getTime();
		} else {
			endTime = self._untilDate().getTime();
		}
		var endDateId = tutao.rest.EntityRestInterface.stringToCustomId(String(endTime));
		var loadedSnapshots = [];
		self._loadSnapshotRange(series.getSnapshots(), endTime - self.range().value, endDateId, loadedSnapshots, function() {
			callback(loadedSnapshots);
		});
	});
};

/**
 * Loads snapshots in the given range.
 * @param {Number} snapshotsListId 
 * @param {Number} startTime The start time.
 * @param {string} currentEndDateId The current end date id from which the snapshots are loaded in reverse.
 * @param {Array.<tutao.entity.monitor.CounterSnapshot>} loadedSnapshots All loaded snapshots in the correct time order.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._loadSnapshotRange = function(snapshotsListId, startTime, currentEndDateId, loadedSnapshots, callback) {
	var self = this;
	tutao.entity.monitor.CounterSnapshot.loadRange(snapshotsListId, currentEndDateId, 100, true, function(snapshots, exception) {
		if (exception) {
			callback(exception);
			return;
		}
		if (snapshots.length == 0) {
			callback();
			return;
		}
		// only include the the loaded snapshots are younger than startTime
		for (var i=0; i<snapshots.length; i++) {
			if (Number(tutao.rest.EntityRestInterface.customIdToString(snapshots[i].getId()[1])) < startTime) {
				// this snapshot must not be added any more. we are finished.
				callback(snapshots);
				return;
			} else {
				loadedSnapshots.unshift(snapshots[i]);
			}
		}
		// load the next snapshots beginning with the id of the last loaded snapshot
		self._loadSnapshotRange(snapshotsListId, startTime, loadedSnapshots[0].getId()[1], loadedSnapshots, callback);
	});
};

/**
 * Reads a counter value.
 * @param {string} monitor The monitor name. 
 * @param {string} ownerId The owner id.
 * @param {function(=Number, tutao.entity.EntityRestException?} callback Called with the counter value or exception when finished.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._readCounter = function(monitor, ownerId, callback) {
	var params = {};
	tutao.entity.monitor.ReadCounterReturn.load(new tutao.entity.monitor.ReadCounterData().setMonitor(monitor).setOwner(ownerId), params, null, function(readCounterReturn, exception) {
		if (exception) {
			callback(null, exception);
		} else {
			callback(readCounterReturn.getValue());
		}
	});
};

tutao.tutanota.ctrl.MonitorViewModel.prototype.refreshVisibleCounters = function() {
	var self = this;
	if (this.diagramView().name != "none") {
		for (var group=0; group<this.diagramView().groups.length; group++) {
			var monitors = this.diagramView().groups[group].monitors;
			for (var monitor=0; monitor<monitors.length; monitor++) {
				if (monitors[monitor].counter() != "-") {					
					var owner = this._getOwnerId(monitors[monitor].owner);
					if (owner == null) {
						// no valid id was entered, so clear the counter
						monitors[monitor].counter(null);
					} else {
						(function() {
							var counter = monitors[monitor].counter;
							self._readCounter(monitors[monitor].monitor, owner, function(value, exception) {
								if (exception) {
									counter("error");
								} else {
									counter(value);
								}
							});
						})();
					}
				}
			}
		}
	}
	setTimeout(function() {		
		tutao.locator.monitorView.countersUpdated();
	}, 0);
};

/**
 * Shows a data table in a diagram.
 * @param {string} name The name of the diagram.
 * @param {google.visualization.DataTable} dataTable The data table.
 */
tutao.tutanota.ctrl.MonitorViewModel.prototype._drawDiagram = function(name, dataTable) {
	var options = {
		title : name,
		//interpolateNulls: true,
//		vAxis:{viewWindow: {min: -5}},
		pointSize: 4,
		backgroundColor: '#f6f7f9',
		legend: 'bottom'
	};
	var chart = new google.visualization.LineChart(document.getElementById('monitorDiagram'));
	chart.draw(dataTable, options);
};

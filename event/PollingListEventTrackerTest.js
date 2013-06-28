"use strict";


TestCase("PollingListEventTrackerTest", {
	setUp: function() {
		this.clock = sinon.useFakeTimers();
		
		tutao.locator.reset();
		var stub = new tutao.rest.EntityRestCache();
		stub.setTarget(new tutao.rest.EntityRestDummy());
		tutao.locator.replace('entityRestClient', stub);
	},
	tearDown: function() {
		tutao.locator.reset();
		this.clock.restore();
	},
	"test that refresh is called each second": function() {
		var observable = new tutao.event.PollingListEventTracker(tutao.entity.tutanota.Mail, "id");
		
		var mockRefresh = sinon.spy(observable, "_refresh");
		
		observable.observeList("100");
		
		this.clock.tick(2900); // the first call to _refresh is done immediately, so use a time below 3s. the first getElementRange inside _refresh is called after 1s though
		
		assertEquals(3, mockRefresh.callCount);
	},
	"test that the observers are notified if the db changes": function() {
		var self = this;
		var listId = 100;
		var observable = new tutao.event.PollingListEventTracker(tutao.entity.tutanota.Mail, listId);
		
		var observer = sinon.spy();
		observable.addObserver(observer);
		observable.observeList(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
		
		// add a new mail
		var newMail = new tutao.entity.tutanota.Mail();
		// mock the entity helper to avoid that server calls are made when creating the request maps
		newMail._entityHelper = {createListEncSessionKey: function() {}, notifyObservers: function() {}, createPostPermissionMap: function() { return {}; }, createAuthHeaders: function() { return {}; }};
		newMail.setup(listId, function(exception) {
			assertUndefined(exception);
			self.clock.tick(2100);
			assertEquals(1, observer.withArgs([newMail]).callCount);
		});
	}
});
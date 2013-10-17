"use strict";

goog.provide('EntityObserverTest');

JsHamcrest.Integration.JsTestDriver();

TestCase("EntityObserverTest", {
	
	"test one observer": function() {
		var entityDummy = "hello";
		var helper = new tutao.entity.EntityHelper(entityDummy, false);
		assertEquals([], helper._observers);
		var id = 42;
		var callback = JsMockito.mockFunction();
		helper.registerObserver(callback, id)

		// check delete/update notification
		helper.notifyObservers(false);
		JsMockito.verify(callback)(false, entityDummy, id);
		JsMockito.verifyNoMoreInteractions(callback);
		helper.notifyObservers(true);
		JsMockito.verify(callback)(true, entityDummy, id);
		JsMockito.verifyNoMoreInteractions(callback);
		
		// check register again with new id
		id = 7;
		helper.registerObserver(callback, id)
		helper.notifyObservers(false);
		JsMockito.verify(callback)(false, entityDummy, id);
		JsMockito.verifyNoMoreInteractions(callback);
		
		// check unregister wrong callback
		helper.unregisterObserver(function() {})
		helper.notifyObservers(false);
		//TODO (before beta) check why there are two invocations. debugging shows it is only one
		JsMockito.verify(callback, JsMockito.Verifiers.times(2))(false, entityDummy, id);
		
		// check unregister
		helper.unregisterObserver(callback)
		helper.notifyObservers(false);
		JsMockito.verifyNoMoreInteractions(callback);
	},
	
	"test two observers": function() {
		var entityDummy = "hello";
		var helper = new tutao.entity.EntityHelper(entityDummy, false);
		assertEquals([], helper._observers);
		var id = 42;
		var callback1 = JsMockito.mockFunction();
		var callback2 = JsMockito.mockFunction();
		helper.registerObserver(callback1, id)
		helper.registerObserver(callback2, id)

		helper.notifyObservers(false);
		JsMockito.verify(callback1)(false, entityDummy, id);
		JsMockito.verify(callback2)(false, entityDummy, id);
		JsMockito.verifyNoMoreInteractions(callback1);
		JsMockito.verifyNoMoreInteractions(callback2);
		
		// remove one
		helper.unregisterObserver(callback1);
		helper.notifyObservers(false);
		//TODO (before beta) check why there are two invocations. debugging shows it is only one
		JsMockito.verify(callback2, JsMockito.Verifiers.times(2))(false, entityDummy, id);
		JsMockito.verifyNoMoreInteractions(callback1);
		JsMockito.verifyNoMoreInteractions(callback2);
	}
});


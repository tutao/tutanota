/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

#include <string>
#include <sstream>
#include <sys/stat.h>
#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>
#include "vibration_js.hpp"
#include <bps/vibration.h>

using namespace std;

/**
 * Default constructor.
 */
Vibration::Vibration(const std::string& id) : m_id(id){
	bps_initialize();
}

/**
 * Vibration destructor.
 */
Vibration::~Vibration() {
	bps_shutdown();
}

/**
 * This method returns the list of objects implemented by this native extension.
 */
char* onGetObjList() {
    static char name[] = "Vibration";
    return name;
}

/**
 * This method is used by JNext to instantiate the Vibration object when
 * an object is created on the JavaScript server side.
 */
JSExt* onCreateObject(const string& className, const string& id) {
    if (className == "Vibration") {
        return new Vibration(id);
    }
    return NULL;
}

/**
 * Method used by JNext to determine if the object can be deleted.
 */
bool Vibration::CanDelete() {
    return true;
}

/**
 * It will be called from JNext JavaScript side with passed string.
 * This method implements the interface for the JavaScript to native binding
 * for invoking native code. This method is triggered when JNext.invoke is
 * called on the JavaScript side with this native objects id.
 */
string Vibration::InvokeMethod(const string& command) {

    // parse command and args from string
    int indexOfFirstSpace = command.find_first_of(" ");
    string strCommand = command.substr(0, indexOfFirstSpace);
    string strValue = command.substr(indexOfFirstSpace + 1, command.length());
    char info[1024];

    //Process the vibrate command
    if (strCommand == "vibrate") {
    	//Get the duration
    	int duration = atoi(strValue.substr(0, strValue.length()).c_str());

    	if (duration <= 0) {
    		//Default to 1 second
    		duration = 1000;
    	} else if (duration > 5000) {
    		//Max 5 seconds
    		duration = 5000;
    	}

    	//Vibrate
		int value = vibration_request(VIBRATION_INTENSITY_HIGH , duration);

		//Check return
		if (value == BPS_SUCCESS) {
			sprintf(info, "Vibration successful.");
		} else if(value == BPS_FAILURE) {
			sprintf(info, "Vibration failed.");
		} else {
			sprintf(info, "Vibration unknown error: %d", value);
		}
		return info;
    } else {
    	sprintf(info, "Unsupported method: %s", strCommand.c_str());
    }
    return info;
}

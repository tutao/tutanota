/*
* Copyright (c) 2013 BlackBerry Limited
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

#ifndef Keyboard_NDK_HPP_
#define Keyboard_NDK_HPP_

#include <string>
#include <pthread.h>
#include <bb/AbstractBpsEventHandler>
#include <bps/bps.h>
#include<bps/netstatus.h>
#include<bps/locale.h>
#include<bps/virtualkeyboard.h>
#include<bps/navigator.h>
#include <bps/event.h>
#include <string>
#include <sstream>

class Keyboard_JS;

namespace webworks {

class Keyboard_NDK  {
public:
	explicit Keyboard_NDK(Keyboard_JS *parent = NULL);
	virtual ~Keyboard_NDK();
    virtual void event(bps_event_t *event);

    void callKeyboardEmail(); // Method Calls the Keyboard style Email (default)

    void callKeyboardNumber(); // Method Calls the Keyboard style number

    void cancelKeyboard(); // Method cancel the keyboard

	std::string keyboardStartThread();







private:

	Keyboard_JS *m_pParent;
	int keyboardProperty;
	int keyboardThreadCount;
	bool threadHalt;
	std::string threadCallbackId;
	pthread_t m_thread;
	pthread_cond_t cond;
	pthread_mutex_t mutex;

};

} // namespace webworks

#endif /* Keyboard_NDK_HPP_ */

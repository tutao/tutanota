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

#ifndef LOGGER_HPP_
#define LOGGER_HPP_

#include <string>
#include <slog2.h>

class Keyboard_JS;

namespace webworks {

class Logger {
public:
	explicit Logger(const char* name, Keyboard_JS *parent = NULL);
	virtual ~Logger();
	int debug(const char* message);
	int info(const char* message);
	int notice(const char* message);
	int warn(const char* message);
	int error(const char* message);
	int critical(const char* message);
	int setVerbosity(_Uint8t verbosity);
	_Uint8t getVerbosity();
	slog2_buffer_t hiPriorityBuffer();
	slog2_buffer_t lowPriorityBuffer();
private:
	Keyboard_JS *m_pParent;
	slog2_buffer_set_config_t buffer_config;
	slog2_buffer_t buffer_handle[2];
	int log(slog2_buffer_t buffer, _Uint8t severity, const char* message);
};

} /* namespace webworks */
#endif /* LOGGER_HPP_ */

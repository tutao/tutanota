/*
 *
 * Copyright 2013 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
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

#include "vibration.h"

void Vibration::vibrate(int, int, int mills) {
    QSharedPointer<QFeedbackHapticsEffect> vibrate = QSharedPointer<QFeedbackHapticsEffect>::create();
    vibrate->setIntensity(1.0);
    vibrate->setDuration(mills);

    vibrate->start();

    _effects.append(vibrate);
}

void Vibration::cancelVibration(int, int) {
    _timers.clear();
    _effects.clear();
}

void Vibration::vibrateWithPattern(int, int, const QList<int> &pattern, int repeat) {
    QSharedPointer<QTimer> timer = QSharedPointer<QTimer>::create();
    QSharedPointer<int> k = QSharedPointer<int>::create();

    QSharedPointer<QFeedbackHapticsEffect> vibrate = QSharedPointer<QFeedbackHapticsEffect>::create();
    vibrate->setIntensity(1.0);

    _effects.append(vibrate);
    _timers.append(timer);

    timer->connect(timer.data(), &QTimer::timeout, [=, timer = timer.data()] () {
        if (*k >= pattern.size()) {
            if (repeat < 0 || repeat >= pattern.size()) {
                timer->stop();
                return;
            }
            *k = repeat;
        }
        bool idle = (*k % 2 == 0);
        if (!idle) {
            vibrate->setDuration(pattern[*k]);
            vibrate->start();
        }
        timer->start(pattern[*k]);
        (*k)++;
    });
    timer->start(1);
}

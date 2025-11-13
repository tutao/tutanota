/*
 * Copyright 2022 The Android Open Source Project
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       https://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import com.android.build.gradle.BaseExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

/**
 * Plugin that configures test devices.
 */
class AndroidTestConventionPlugin : Plugin<Project> {
	override fun apply(target: Project) {
		with(target) {
			// We want to configure test options for each module. They all extend BaseExtension so we can get away with
			// this for now but in the future we might need to split the plugin or have some other checks here.
			extensions.configure<BaseExtension> {
				// inside here we are like in a `android` block
				testOptions {
					// create Gradle Managed Device to run tests on
					// https://developer.android.com/studio/test/gradle-managed-devices
					managedDevices {
						localDevices.create("testDevice") {
							device = "Pixel 2"
							// Use only API levels 27 and higher (why? who knows)
							apiLevel = 30
							// atd is a special kind of image with minimal nonsense
							systemImageSource = "aosp-atd"
							// Currently all Android runners are x86_64
							testedAbi = "x86_64"
							// It defaults to x86 otherwise which means there is some translation from x86_64 which
							// means it's slower. Let's not do that.
							require64Bit = true
						}
					}
				}
			}
		}
	}
}
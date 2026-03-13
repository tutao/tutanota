<?php

declare(strict_types=1);

use OCP\Util;

Util::addScript(OCA\TutaMail\AppInfo\Application::APP_ID, 'polyfill');
Util::addScript(OCA\TutaMail\AppInfo\Application::APP_ID, 'index');

?>

<div id="nextcloud-tutamail"></div>

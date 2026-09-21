<?php

declare(strict_types=1);

use OCP\Util;
use OCP\IURLGenerator;
use OCP\Server;

Util::addScript(OCA\TutaMail\AppInfo\Application::APP_ID, 'polyfill');
Util::addScript(OCA\TutaMail\AppInfo\Application::APP_ID, 'index');


// $appUrl = \OC::$server->getURLGenerator()->getAbsoluteURL('apps/tutamail');

$urlGenerator = Server::get(IURLGenerator::class);
$appUrl = $urlGenerator->getAbsoluteURL(
    $urlGenerator->linkTo('tutamail', ''));

?>

<div id="nextcloud-tutamail" app-root="<?=$appUrl?>"></div>

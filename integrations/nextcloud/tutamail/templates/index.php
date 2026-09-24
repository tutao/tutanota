<?php

declare(strict_types=1);

use OCP\Util;
use OCP\IURLGenerator;
use OCP\Server;

$cspNonce = $_['cspNonce'];


$urlGenerator = Server::get(IURLGenerator::class);
$appUrl = $urlGenerator->getAbsoluteURL(
    $urlGenerator->linkTo('tutamail', ''));


$targetTutaHost = "http://localhost:9000";

echo "<script type='module' src='{$targetTutaHost}/polyfill.js' nonce='{$cspNonce}'></script>";
echo "<script type='module' src='{$targetTutaHost}/index.js' nonce='{$cspNonce}'></script>";

echo "<div id='nextcloud-tutamail' app-root='{$appUrl}' targetTutaHost='{$targetTutaHost}'></div>";

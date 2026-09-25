<?php

declare(strict_types=1);

namespace OCA\TutaMail\Controller;

use OCA\TutaMail\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\OpenAPI;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

/**
 * @psalm-suppress UnusedClass
 */
class PageController extends Controller {
	public function __construct(
		string $appName,
		IRequest $request,
		private readonly IURLGenerator $urlGenerator,
	) {
		parent::__construct($appName, $request);
	}

	#[NoCSRFRequired]
	#[NoAdminRequired]
	#[OpenAPI(OpenAPI::SCOPE_IGNORE)]
	public function index(): TemplateResponse {
		$response = new TemplateResponse(Application::APP_ID, 'index');

		$csp = new ContentSecurityPolicy();
		$csp->addAllowedConnectDomain('https://tuta.com');
		$csp->addAllowedConnectDomain('https://app.test.tuta.com');
		$csp->addAllowedConnectDomain('https://app.local.tuta.com');

		$response->setContentSecurityPolicy($csp);

		return $response;
	}

	// Redirect deep links to the SPA entry point with ?r=<path> so the client can recover the
	// originally requested route after login (mirrors app.tuta.com's own /login -> /?r=/login).
	#[NoCSRFRequired]
	#[NoAdminRequired]
	#[OpenAPI(OpenAPI::SCOPE_IGNORE)]
	public function spaFallback(string $path): RedirectResponse {
		$params = $_GET;
		$params['r'] = '/' . $path;
		$url = $this->urlGenerator->linkToRoute(Application::APP_ID . '.page.index', $params);
		return new RedirectResponse($url);
	}
}

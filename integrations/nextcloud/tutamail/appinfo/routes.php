<?php
return [
    'routes' => [
        // SPA entry point
        [
            'name' => 'page#index',
            'url' => '/',
            'verb' => 'GET',
        ],

        // SPA history-mode fallback: redirects deep links back to the entry point with ?r=<path>
        [
            'name' => 'page#spaFallback',
            'url' => '/{path}',
            'verb' => 'GET',
            'requirements' => [
                'path' => '.+',
            ],
        ],
    ],
];
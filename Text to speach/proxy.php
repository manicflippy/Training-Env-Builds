<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers to allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get the URL parameter
$url = isset($_GET['url']) ? $_GET['url'] : '';

if (empty($url)) {
    header('HTTP/1.1 400 Bad Request');
    echo 'Missing URL parameter';
    exit;
}

// Parse the URL to get the origin for the referer header
$parsedUrl = parse_url($url);
$origin = '';
if (isset($parsedUrl['scheme']) && isset($parsedUrl['host'])) {
    $origin = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];
    if (isset($parsedUrl['port'])) {
        $origin .= ':' . $parsedUrl['port'];
    }
}

// Set up the context with proper headers
$options = [
    'http' => [
        'method' => 'GET',
        'header' => [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer: ' . $origin,
            'Origin: ' . $origin
        ]
    ]
];

$context = stream_context_create($options);

// Try to fetch the image
try {
    $content = file_get_contents($url, false, $context);
    
    if ($content === false) {
        header('HTTP/1.1 404 Not Found');
        echo 'Failed to fetch image';
        exit;
    }
    
    // Get content type from headers
    $contentType = '';
    foreach ($http_response_header as $header) {
        if (strpos(strtolower($header), 'content-type:') === 0) {
            $contentType = trim(substr($header, 14));
            break;
        }
    }
    
    // Set the content type header
    if (!empty($contentType)) {
        header('Content-Type: ' . $contentType);
    } else {
        // Default to image/jpeg if content type is not found
        header('Content-Type: image/jpeg');
    }
    
    // Output the image data
    echo $content;
} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo 'Error: ' . $e->getMessage();
}
?>

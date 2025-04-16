# Microsoft Learn Content Downloader

This tool allows you to download and view Microsoft Learn content locally, including both text and images. It's specifically designed to handle Microsoft Learn's referrer protection for images.

## Features

- Fetches content from Microsoft Learn pages
- Renders the content with proper formatting
- Handles Microsoft Learn's image referrer protection using multiple methods:
  1. Direct embedding with referrer policy
  2. Using images.weserv.nl proxy service
  3. Fetch API with proper headers
  4. Special handling for SVG images using iframes
- Saves content locally for offline viewing
- Provides debugging information for image loading

## How to Use

1. Open `index.html` in your browser
2. Enter a Microsoft Learn URL in the input field (a default URL is pre-filled)
3. Click "Fetch Content" to download and display the content
4. Click "Save Content" to save the content locally for offline viewing
5. Click "Load Saved Content" to load previously saved content

## Technical Details

The application uses a completely client-side approach to handle Microsoft Learn content:

- Uses the CORS proxy (corsproxy.io) to fetch the initial HTML content
- Processes images using multiple fallback methods to ensure they display correctly
- Caches successfully loaded images in memory for faster reloading
- Converts relative URLs to absolute URLs
- Opens external links in new tabs

## Troubleshooting

If images don't load properly:
- Check the "Image Debug Information" section at the bottom of the page
- It shows which loading methods succeeded or failed for each image
- You can click the direct link provided as a fallback for any image

## Limitations

- Some complex interactive elements from Microsoft Learn might not work
- Very large pages may take longer to process
- Content is stored in the browser's localStorage, which has size limitations

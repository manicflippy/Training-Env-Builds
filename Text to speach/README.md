# Learning Page Text-to-Speech Application

This is a browser-based text-to-speech application that can vocalize content from e-learning sites like Microsoft Learn, Docker Hub, or other online documentation repositories.

## Features

- Extract readable content from learning websites
- Convert text to speech using the Web Speech API
- Customize voice selection and speech rate
- Play, pause, and stop speech playback
- Works with various documentation sites

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)
2. Enter the URL of the learning page you want to vocalize
3. Click "Fetch Content" to extract the text
4. Select your preferred voice and speech rate
5. Use the Play, Pause, and Stop buttons to control playback

## Technical Details

- Uses the browser's native Web Speech API for text-to-speech conversion
- Employs a CORS proxy (corsproxy.io) to fetch content from external websites
- No server-side components required - runs entirely in your browser
- Minimal resource requirements

## Limitations

- Some websites may block content extraction due to CORS policies
- Speech quality depends on the voices available in your browser/OS
- Complex page structures (tables, code blocks) may not be parsed optimally

## Browser Compatibility

- Chrome: Full support
- Edge: Full support
- Firefox: Full support
- Safari: Partial support (limited voice options)

## Resource Requirements

- Any modern computer with a web browser
- Internet connection for initial page load and content fetching
- No installation required

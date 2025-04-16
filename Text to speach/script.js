document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const pageUrlInput = document.getElementById('pageUrl');
    const fetchButton = document.getElementById('fetchButton');
    const voiceSelect = document.getElementById('voiceSelect');
    const rateSlider = document.getElementById('rateSlider');
    const rateValue = document.getElementById('rateValue');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const stopButton = document.getElementById('stopButton');
    const readSelectionButton = document.getElementById('readSelectionButton');
    const contentArea = document.getElementById('contentArea');
    const statusMessage = document.getElementById('statusMessage');

    // Speech synthesis variables
    let synth = window.speechSynthesis;
    let utterance = null;
    let voices = [];
    let currentText = '';
    let isPlaying = false;
    let currentIndex = 0;
    let textChunks = [];
    let wordIndex = 0;
    let words = [];
    let highlightInterval = null;
    let selectedText = '';
    let isReadingSelection = false;
    let currentSelectionIndex = 0;
    let selectedSpans = [];
    let lastSelectionState = false; // Track if the last operation was a selection reading
    let imageCache = {}; // Cache for downloaded images

    // Initialize voices
    function loadVoices() {
        voices = synth.getVoices();
        voiceSelect.innerHTML = '';
        
        // Filter for English voices
        const englishVoices = voices.filter(voice => voice.lang.includes('en'));
        
        englishVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = index;
            
            // Set default to first English voice
            if (voice.default) {
                option.selected = true;
            }
            
            voiceSelect.appendChild(option);
        });
        
        // If no voices were loaded yet, try again
        if (englishVoices.length === 0) {
            setTimeout(loadVoices, 100);
        }
    }

    // Load voices when available
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    // Update rate value display
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value;
    });

    // Fetch content from URL
    async function fetchContent() {
        const url = pageUrlInput.value.trim();
        if (!url) {
            updateStatus('Please enter a URL', 'error');
            return;
        }

        try {
            updateStatus('Fetching content...');
            
            // Use a CORS proxy to avoid cross-origin issues
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (!data.contents) {
                throw new Error('Failed to fetch content');
            }
            
            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // Remove scripts, iframes, and other unwanted elements
            doc.querySelectorAll('script, iframe, style, noscript').forEach(el => {
                el.remove();
            });
            
            // Find the main content container (common content containers)
            let mainContent = doc.querySelector('main, article, .content, #content, .main, #main, .article, #article');
            
            // If no main content container found, use the body
            if (!mainContent) {
                mainContent = doc.body;
            }
            
            // Clear previous content
            contentArea.innerHTML = '';
            
            // Set the title
            const title = doc.querySelector('title')?.textContent || url;
            const titleElement = document.createElement('h2');
            titleElement.textContent = title;
            contentArea.appendChild(titleElement);
            
            // Add debug info
            const debugInfo = document.createElement('div');
            debugInfo.style.background = '#f8f8f8';
            debugInfo.style.padding = '10px';
            debugInfo.style.marginBottom = '20px';
            debugInfo.style.border = '1px solid #ddd';
            debugInfo.innerHTML = `<h3>Debug Information</h3>
                <p>Source URL: ${url}</p>`;
            contentArea.appendChild(debugInfo);
            
            // Extract domain from URL for referrer checking
            let domain = '';
            try {
                const urlObj = new URL(url);
                domain = urlObj.origin;
            } catch (e) {
                console.error('Error parsing URL:', e);
            }
            
            // Create a container for the content
            const contentContainer = document.createElement('div');
            contentContainer.innerHTML = '<h3>Content</h3>';
            contentArea.appendChild(contentContainer);
            
            // Clone the content to preserve structure
            const contentWrapper = document.createElement('div');
            contentWrapper.innerHTML = mainContent.innerHTML;
            
            // Process images to fix their URLs
            const processedImages = contentWrapper.querySelectorAll('img');
            debugInfo.innerHTML += `<p>Found ${processedImages.length} images in content</p>`;
            
            // Create a direct image display section
            const directImageSection = document.createElement('div');
            directImageSection.innerHTML = '<h3>Images from Content</h3>';
            contentArea.appendChild(directImageSection);
            
            // Process all images
            if (processedImages.length > 0) {
                processedImages.forEach((img, index) => {
                    const originalSrc = img.getAttribute('src');
                    if (!originalSrc) return;
                    
                    // Create a container for this image
                    const imageContainer = document.createElement('div');
                    imageContainer.style.margin = '20px 0';
                    imageContainer.style.padding = '10px';
                    imageContainer.style.border = '1px solid #ddd';
                    directImageSection.appendChild(imageContainer);
                    
                    // Image title
                    const imageTitle = document.createElement('p');
                    imageTitle.innerHTML = `<strong>Image ${index + 1}</strong>`;
                    imageContainer.appendChild(imageTitle);
                    
                    // Process the URL to absolute if needed
                    let absoluteUrl = originalSrc;
                    if (!originalSrc.startsWith('http') && !originalSrc.startsWith('https') && !originalSrc.startsWith('data:')) {
                        try {
                            const urlObj = new URL(url);
                            const baseUrl = urlObj.origin;
                            
                            if (originalSrc.startsWith('/')) {
                                // Root-relative URL
                                absoluteUrl = baseUrl + originalSrc;
                            } else {
                                // Path-relative URL
                                let path = urlObj.pathname;
                                if (path.includes('.')) {
                                    path = path.substring(0, path.lastIndexOf('/') + 1);
                                } else if (!path.endsWith('/')) {
                                    path += '/';
                                }
                                absoluteUrl = baseUrl + path + originalSrc;
                            }
                        } catch (e) {
                            console.error('Error processing URL:', e);
                        }
                    }
                    
                    // Image URL info
                    const imageUrlInfo = document.createElement('div');
                    imageUrlInfo.innerHTML = `
                        <p>Original URL: ${originalSrc}</p>
                        <p>Absolute URL: ${absoluteUrl}</p>
                        <p><a href="${absoluteUrl}" target="_blank">Open image in new tab</a></p>
                    `;
                    imageContainer.appendChild(imageUrlInfo);
                    
                    // Create a container for the image
                    const imageDisplayContainer = document.createElement('div');
                    imageDisplayContainer.style.marginTop = '10px';
                    imageContainer.appendChild(imageDisplayContainer);
                    
                    // Create a loading indicator
                    const loadingIndicator = document.createElement('p');
                    loadingIndicator.textContent = 'Loading image...';
                    imageDisplayContainer.appendChild(loadingIndicator);
                    
                    // Function to fetch and display the image using a Blob URL
                    const fetchAndDisplayImage = async () => {
                        try {
                            // Create the image element
                            const imgElement = document.createElement('img');
                            imgElement.alt = img.alt || `Image ${index + 1}`;
                            imgElement.style.maxWidth = '100%';
                            imgElement.style.border = '1px solid #ddd';
                            imgElement.style.padding = '10px';
                            
                            // Try to fetch the image directly first
                            try {
                                // Create a blob URL from the image
                                const imageResponse = await fetch(absoluteUrl, {
                                    mode: 'cors',
                                    credentials: 'omit',
                                    headers: {
                                        'Referer': new URL(url).origin,
                                        'Origin': new URL(url).origin
                                    }
                                });
                                
                                if (!imageResponse.ok) {
                                    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
                                }
                                
                                const blob = await imageResponse.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                imgElement.src = blobUrl;
                                
                                // Success message
                                const successMsg = document.createElement('p');
                                successMsg.textContent = 'Image loaded successfully via direct fetch';
                                successMsg.style.color = 'green';
                                imageDisplayContainer.appendChild(successMsg);
                                
                                // Remove loading indicator
                                loadingIndicator.remove();
                                
                                // Add the image to the display
                                imageDisplayContainer.appendChild(imgElement);
                                
                                // Update the original image in the content
                                if (img.parentNode) {
                                    img.src = blobUrl;
                                    img.setAttribute('data-original-url', absoluteUrl);
                                }
                                
                                return; // Exit if successful
                            } catch (directError) {
                                console.error('Direct fetch failed:', directError);
                                // Continue to fallback methods if direct fetch fails
                            }
                            
                            // Fallback 1: Try using the Weserv.nl proxy
                            try {
                                const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(absoluteUrl)}`;
                                const weservResponse = await fetch(weservUrl);
                                
                                if (!weservResponse.ok) {
                                    throw new Error(`Weserv proxy failed: ${weservResponse.status}`);
                                }
                                
                                const blob = await weservResponse.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                imgElement.src = blobUrl;
                                
                                // Success message
                                const successMsg = document.createElement('p');
                                successMsg.textContent = 'Image loaded via Weserv.nl proxy';
                                successMsg.style.color = 'green';
                                imageDisplayContainer.appendChild(successMsg);
                                
                                // Remove loading indicator
                                loadingIndicator.remove();
                                
                                // Add the image to the display
                                imageDisplayContainer.appendChild(imgElement);
                                
                                // Update the original image in the content
                                if (img.parentNode) {
                                    img.src = blobUrl;
                                    img.setAttribute('data-original-url', absoluteUrl);
                                }
                                
                                return; // Exit if successful
                            } catch (weservError) {
                                console.error('Weserv proxy failed:', weservError);
                                // Continue to next fallback
                            }
                            
                            // Fallback 2: For SVG images, try to fetch and convert to data URL
                            if (absoluteUrl.toLowerCase().endsWith('.svg')) {
                                try {
                                    // Use allorigins to fetch the SVG content
                                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(absoluteUrl)}`;
                                    const svgResponse = await fetch(proxyUrl);
                                    
                                    if (!svgResponse.ok) {
                                        throw new Error(`SVG proxy failed: ${svgResponse.status}`);
                                    }
                                    
                                    const svgText = await svgResponse.text();
                                    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
                                    imgElement.src = dataUrl;
                                    
                                    // Success message
                                    const successMsg = document.createElement('p');
                                    successMsg.textContent = 'SVG loaded via data URL';
                                    successMsg.style.color = 'green';
                                    imageDisplayContainer.appendChild(successMsg);
                                    
                                    // Remove loading indicator
                                    loadingIndicator.remove();
                                    
                                    // Add the image to the display
                                    imageDisplayContainer.appendChild(imgElement);
                                    
                                    // Update the original image in the content
                                    if (img.parentNode) {
                                        img.src = dataUrl;
                                        img.setAttribute('data-original-url', absoluteUrl);
                                    }
                                    
                                    return; // Exit if successful
                                } catch (svgError) {
                                    console.error('SVG data URL failed:', svgError);
                                    // Continue to last fallback
                                }
                            }
                            
                            // Last fallback: Display error and direct link
                            loadingIndicator.textContent = 'Failed to load image via all methods';
                            loadingIndicator.style.color = 'red';
                            
                            // Add a direct link to the image
                            const directLink = document.createElement('p');
                            directLink.innerHTML = `<a href="${absoluteUrl}" target="_blank">Open image in new tab</a>`;
                            imageDisplayContainer.appendChild(directLink);
                            
                        } catch (error) {
                            console.error('Error in image processing:', error);
                            loadingIndicator.textContent = `Error: ${error.message}`;
                            loadingIndicator.style.color = 'red';
                        }
                    };
                    
                    // Start the fetch process
                    fetchAndDisplayImage();
                    
                    // Update the original image in the content to show a placeholder until loaded
                    if (img.parentNode) {
                        img.setAttribute('data-original-url', absoluteUrl);
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM4ODgiPkxvYWRpbmcgaW1hZ2UuLi48L3RleHQ+PC9zdmc+';
                    }
                });
                
                debugInfo.innerHTML += `<p>All images processed</p>`;
            } else {
                const noImages = document.createElement('p');
                noImages.textContent = 'No images found in content';
                directImageSection.appendChild(noImages);
            }
            
            contentContainer.appendChild(contentWrapper);
            
            // Now we need to wrap all text nodes in spans for highlighting
            // We'll use a TreeWalker to find all text nodes
            const walker = document.createTreeWalker(
                contentWrapper,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // Skip empty text nodes
                        if (node.nodeValue.trim() === '') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            
            // Collect all text nodes first (to avoid modifying while walking)
            const textNodes = [];
            let currentNode;
            while (currentNode = walker.nextNode()) {
                textNodes.push(currentNode);
            }
            
            // Now process each text node
            textNodes.forEach(textNode => {
                const text = textNode.nodeValue.trim();
                if (!text) return;
                
                const wrapper = document.createElement('span');
                wrapper.className = 'text-wrapper';
                
                // Split text into words and wrap each in a span
                const words = text.split(/(\s+)/);
                words.forEach(word => {
                    const span = document.createElement('span');
                    span.textContent = word;
                    
                    // Add word class only to actual words, not whitespace
                    if (!/^\s+$/.test(word)) {
                        span.className = 'word';
                    }
                    
                    wrapper.appendChild(span);
                });
                
                // Replace the text node with the wrapper
                if (textNode.parentNode) {
                    textNode.parentNode.replaceChild(wrapper, textNode);
                }
            });
            
            // Extract text for speech synthesis
            currentText = contentArea.textContent.replace(/\s+/g, ' ').trim();
            splitTextIntoChunks();
            
            // Reset speech state
            synth.cancel();
            currentIndex = 0;
            isPlaying = false;
            resetButtons();
            
            // Update status
            updateStatus('Content loaded successfully');
            
            // Enable play button
            playButton.disabled = false;
            
        } catch (error) {
            console.error('Error fetching content:', error);
            updateStatus(`Error fetching content: ${error.message}`, 'error');
        }
    }

    fetchButton.addEventListener('click', fetchContent);

    // Create image cache directory if it doesn't exist
    async function ensureImageCacheDirectory() {
        try {
            // Create a temp directory for image cache if it doesn't exist
            const tempDir = document.createElement('div');
            tempDir.id = 'imageCacheDir';
            tempDir.style.display = 'none';
            document.body.appendChild(tempDir);
            
            // Return the path to the cache directory
            return 'imageCacheDir';
        } catch (error) {
            console.error('Error creating image cache directory:', error);
            return null;
        }
    }

    // Download image and save to cache
    async function downloadAndCacheImage(imageUrl, imageName) {
        try {
            // First, check if we already have this image in cache
            if (imageCache[imageUrl]) {
                return imageCache[imageUrl];
            }
            
            // Use fetch with proper headers to download the image
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`, {
                headers: {
                    'Referer': new URL(imageUrl).origin,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
            }
            
            // Get the image data as blob
            const blob = await response.blob();
            
            // Create a data URL from the blob
            const dataUrl = URL.createObjectURL(blob);
            
            // Store in cache
            imageCache[imageUrl] = dataUrl;
            
            return dataUrl;
        } catch (error) {
            console.error(`Error downloading image ${imageUrl}:`, error);
            return null;
        }
    }

    // Split text into chunks to handle long texts
    function splitTextIntoChunks() {
        const maxChunkLength = 200; // Maximum characters per chunk
        textChunks = [];
        
        // Split by sentences and group into chunks
        const sentences = currentText.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        
        sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > maxChunkLength) {
                textChunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += ' ' + sentence;
            }
        });
        
        if (currentChunk.trim()) {
            textChunks.push(currentChunk.trim());
        }
        
        // Also prepare the full text with word spans for highlighting
        prepareTextForHighlighting();
    }
    
    // Prepare text for word-by-word highlighting
    function prepareTextForHighlighting() {
        // We need to handle HTML content differently
        // First, save the original HTML
        const originalHTML = contentArea.innerHTML;
        
        // Get all text nodes in the content area
        const textNodes = [];
        const walker = document.createTreeWalker(
            contentArea,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip empty text nodes
                    if (node.nodeValue.trim() === '') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        // Process each text node to wrap words in spans
        textNodes.forEach((textNode, nodeIndex) => {
            const text = textNode.nodeValue;
            const words = text.split(/\s+/);
            
            if (words.length === 0) return;
            
            // Create a document fragment to hold the spans
            const fragment = document.createDocumentFragment();
            
            words.forEach((word, wordIndex) => {
                if (word === '') return;
                
                // Create a span for the word
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'word';
                span.id = `word-${nodeIndex}-${wordIndex}`;
                
                fragment.appendChild(span);
                
                // Add a space after each word except the last one
                if (wordIndex < words.length - 1) {
                    fragment.appendChild(document.createTextNode(' '));
                }
            });
            
            // Replace the text node with the fragment
            textNode.parentNode.replaceChild(fragment, textNode);
        });
        
        // Reset word index
        wordIndex = 0;
        
        // Enable text selection
        enableTextSelection();
    }
    
    // Enable text selection in the content area
    function enableTextSelection() {
        // Enable the read selection button when text is selected
        contentArea.addEventListener('mouseup', handleTextSelection);
        contentArea.addEventListener('touchend', handleTextSelection);
        
        // Make content selectable
        contentArea.style.userSelect = 'text';
    }
    
    // Handle text selection
    function handleTextSelection() {
        const selection = window.getSelection();
        selectedText = selection.toString().trim();
        
        if (selectedText) {
            readSelectionButton.disabled = false;
            
            // Highlight selected text with a different color
            highlightSelectedText(selection);
        } else {
            readSelectionButton.disabled = true;
        }
    }
    
    // Highlight selected text
    function highlightSelectedText(selection) {
        // First clear any previous user selection highlights
        document.querySelectorAll('.user-selection').forEach(el => {
            el.classList.remove('user-selection');
        });
        
        // Apply new selection highlight
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const spans = contentArea.querySelectorAll('.word');
            
            spans.forEach(span => {
                if (range.intersectsNode(span)) {
                    span.classList.add('user-selection');
                }
            });
        }
    }
    
    // Read selected text
    function readSelectedText() {
        if (!selectedText) return;
        
        // Cancel any ongoing speech
        synth.cancel();
        clearWordHighlighting(true); // Reset selection index when starting fresh
        
        // Store selected spans for pause/resume functionality
        selectedSpans = Array.from(document.querySelectorAll('.user-selection'));
        
        // Set flag that we're reading a selection
        isReadingSelection = true;
        lastSelectionState = true;
        currentSelectionIndex = 0;
        
        // Create a new utterance for the selected text
        const selectionUtterance = new SpeechSynthesisUtterance(selectedText);
        utterance = selectionUtterance; // Store reference for pause/stop functionality
        
        // Set voice
        const selectedVoice = voices[voiceSelect.value];
        if (selectedVoice) {
            selectionUtterance.voice = selectedVoice;
        }
        
        // Set rate
        selectionUtterance.rate = parseFloat(rateSlider.value);
        
        // Set up word boundary event for highlighting
        selectionUtterance.onboundary = function(event) {
            if (event.name === 'word') {
                // Calculate which word we're on based on character position
                let wordCount = 0;
                let charCount = 0;
                
                for (let i = 0; i < selectedSpans.length; i++) {
                    charCount += selectedSpans[i].textContent.length + 1; // +1 for space
                    
                    if (charCount >= event.charIndex) {
                        currentSelectionIndex = i;
                        break;
                    }
                }
                
                // Clear previous highlights but keep selection
                document.querySelectorAll('.word').forEach(span => {
                    span.classList.remove('highlight');
                });
                
                // Highlight current word in selection if it exists
                if (currentSelectionIndex < selectedSpans.length) {
                    selectedSpans[currentSelectionIndex].classList.add('highlight');
                    selectedSpans[currentSelectionIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };
        
        // Set up events
        selectionUtterance.onend = () => {
            updateStatus('Finished reading selection');
            isReadingSelection = false;
            resetButtons();
            // Keep the selection highlighted but clear word highlighting
            clearWordHighlighting();
        };
        
        selectionUtterance.onerror = (event) => {
            updateStatus(`Speech error occurred: ${event.error}`, 'error');
            isReadingSelection = false;
            resetButtons();
            clearWordHighlighting();
        };
        
        // Start speaking
        synth.speak(selectionUtterance);
        isPlaying = true;
        
        // Update UI
        playButton.disabled = true;
        pauseButton.disabled = false;
        stopButton.disabled = false;
        
        updateStatus('Reading selected text');
    }
    
    // Play speech
    playButton.addEventListener('click', () => {
        // If speech is paused, resume it
        if (synth.speaking && synth.paused) {
            synth.resume();
            isPlaying = true;
            updateStatus('Resumed speaking');
            return;
        }
        
        // If we were reading a selection previously and have selection data
        if (lastSelectionState && selectedSpans.length > 0) {
            // Set the flag back to true
            isReadingSelection = true;
            
            // Create a new utterance with the remaining text
            const remainingText = selectedText.substring(
                selectedSpans.slice(0, currentSelectionIndex)
                    .map(span => span.textContent)
                    .join(' ').length
            );
                
            if (remainingText.trim()) {
                // Cancel any ongoing speech
                synth.cancel();
                
                // Create a new utterance for the remaining text
                const selectionUtterance = new SpeechSynthesisUtterance(remainingText);
                utterance = selectionUtterance;
                
                // Set voice
                const selectedVoice = voices[voiceSelect.value];
                if (selectedVoice) {
                    selectionUtterance.voice = selectedVoice;
                }
                
                // Set rate
                selectionUtterance.rate = parseFloat(rateSlider.value);
                
                // Set up word boundary event for highlighting
                selectionUtterance.onboundary = function(event) {
                    if (event.name === 'word') {
                        // Calculate which word we're on based on character position
                        let wordCount = 0;
                        let charCount = 0;
                        
                        for (let i = currentSelectionIndex; i < selectedSpans.length; i++) {
                            charCount += selectedSpans[i].textContent.length + 1; // +1 for space
                            
                            if (charCount >= event.charIndex) {
                                currentSelectionIndex = i;
                                break;
                            }
                        }
                        
                        // Clear previous highlights but keep selection
                        document.querySelectorAll('.word').forEach(span => {
                            span.classList.remove('highlight');
                        });
                        
                        // Highlight current word in selection if it exists
                        if (currentSelectionIndex < selectedSpans.length) {
                            selectedSpans[currentSelectionIndex].classList.add('highlight');
                            selectedSpans[currentSelectionIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                };
                
                // Set up events
                selectionUtterance.onend = () => {
                    updateStatus('Finished reading selection');
                    isReadingSelection = false;
                    resetButtons();
                    clearWordHighlighting();
                };
                
                selectionUtterance.onerror = (event) => {
                    updateStatus(`Speech error occurred: ${event.error}`, 'error');
                    isReadingSelection = false;
                    resetButtons();
                    clearWordHighlighting();
                };
                
                // Start speaking
                synth.speak(selectionUtterance);
                isPlaying = true;
                
                // Update UI
                playButton.disabled = true;
                pauseButton.disabled = false;
                stopButton.disabled = false;
                
                updateStatus('Resumed reading selection');
                return;
            }
        }
        
        // Only reach here if we're not resuming a selection
        isReadingSelection = false;
        lastSelectionState = false;
        
        if (currentIndex >= textChunks.length) {
            currentIndex = 0;
        }
        
        speakCurrentChunk();
    });

    // Speak current chunk of text
    function speakCurrentChunk() {
        if (currentIndex >= textChunks.length) return;
        
        const text = textChunks[currentIndex];
        
        // Create a new utterance
        utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const selectedVoice = voices[voiceSelect.value];
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Set rate
        utterance.rate = parseFloat(rateSlider.value);
        
        // Set up word boundary event for highlighting
        utterance.onboundary = function(event) {
            if (event.name === 'word') {
                // Calculate which word we're on based on character position
                let wordCount = 0;
                let charCount = 0;
                const wordSpans = document.querySelectorAll('.word');
                
                // Get the starting word index for this chunk
                let chunkStartWordIndex = 0;
                for (let i = 0; i < currentIndex; i++) {
                    // Count words in previous chunks
                    chunkStartWordIndex += textChunks[i].split(/\s+/).length;
                }
                
                // Find the current word based on character index
                for (let i = chunkStartWordIndex; i < wordSpans.length; i++) {
                    charCount += wordSpans[i].textContent.length + 1; // +1 for space
                    
                    if (charCount >= event.charIndex) {
                        wordIndex = i;
                        break;
                    }
                }
                
                // Clear previous highlights
                document.querySelectorAll('.word').forEach(span => {
                    span.classList.remove('highlight');
                });
                
                // Highlight current word if it exists
                if (wordIndex < wordSpans.length) {
                    wordSpans[wordIndex].classList.add('highlight');
                    wordSpans[wordIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };
        
        // Set up events
        utterance.onend = () => {
            // Move to next chunk
            currentIndex++;
            
            if (currentIndex < textChunks.length) {
                speakCurrentChunk();
            } else {
                updateStatus('Finished speaking');
                resetButtons();
                clearWordHighlighting();
            }
        };
        
        utterance.onerror = (event) => {
            updateStatus(`Speech error occurred: ${event.error}`, 'error');
            resetButtons();
            clearWordHighlighting();
        };
        
        // Start speaking
        synth.speak(utterance);
        isPlaying = true;
        
        // Update UI
        playButton.disabled = true;
        pauseButton.disabled = false;
        stopButton.disabled = false;
        
        updateStatus(`Speaking chunk ${currentIndex + 1} of ${textChunks.length}`);
    }

    // Pause speech
    pauseButton.addEventListener('click', () => {
        if (synth.speaking) {
            synth.pause();
            isPlaying = false;
            
            updateStatus('Paused speaking');
        }
    });

    // Stop speech
    stopButton.addEventListener('click', () => {
        synth.cancel();
        isPlaying = false;
        
        // Don't reset selection index to allow resuming from where we stopped
        // But do reset the full text index
        if (!isReadingSelection) {
            currentIndex = 0;
            lastSelectionState = false;
        } else {
            // We're stopping a selection reading, remember this state
            lastSelectionState = true;
        }
        
        // Clear highlighting but keep track of where we stopped
        clearWordHighlighting(false); // Pass false to not reset the selection index
        
        updateStatus('Stopped speaking');
        resetButtons();
        
        // Enable play button to allow resuming
        playButton.disabled = false;
    });
    
    // Clear word highlighting
    function clearWordHighlighting(resetSelectionIndex = true) {
        if (highlightInterval) {
            clearInterval(highlightInterval);
            highlightInterval = null;
        }
        
        document.querySelectorAll('.word').forEach(span => {
            span.classList.remove('highlight', 'highlight-next', 'highlight-previous');
        });
        
        // Only reset the selection index if specified
        if (resetSelectionIndex) {
            currentSelectionIndex = 0;
        }
    }

    // Reset button states
    function resetButtons() {
        playButton.disabled = false;
        pauseButton.disabled = true;
        stopButton.disabled = true;
    }

    // Update status message
    function updateStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = type;
    }

    // Initialize button states
    resetButtons();
    playButton.disabled = true;
    
    // Handle manual content processing
    function processManualContent(content) {
        if (content.trim()) {
            currentText = content.trim();
            contentArea.textContent = currentText;
            splitTextIntoChunks();
            prepareTextForHighlighting();
            playButton.disabled = false;
            stopButton.disabled = false;
            updateStatus('Content loaded successfully!');
        } else {
            updateStatus('Please enter some content first', 'error');
        }
    }

    // Read selection button
    readSelectionButton.addEventListener('click', readSelectedText);
});

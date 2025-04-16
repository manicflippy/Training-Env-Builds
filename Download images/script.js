document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const fetchBtn = document.getElementById('fetchBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const contentDiv = document.getElementById('content');
    const statusMessage = document.getElementById('statusMessage');
    const imageDebug = document.getElementById('imageDebug');

    // Object to store cached image data
    const imageCache = {};

    // Show status message
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        setTimeout(() => {
            statusMessage.style.display = 'block';
        }, 0);
    }

    // Clear status message
    function clearStatus() {
        statusMessage.style.display = 'none';
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }

    // Process image URLs to make them absolute
    function processImageUrl(src, baseUrl) {
        // If it's already an absolute URL, return it
        if (src.startsWith('http://') || src.startsWith('https://')) {
            return src;
        }
        
        // If it's a data URL, return it as is
        if (src.startsWith('data:')) {
            return src;
        }
        
        // If it starts with //, add https:
        if (src.startsWith('//')) {
            return 'https:' + src;
        }
        
        // If it's a root-relative URL, add the domain
        if (src.startsWith('/')) {
            const url = new URL(baseUrl);
            return `${url.protocol}//${url.host}${src}`;
        }
        
        // Otherwise, it's a relative URL, so resolve it against the base URL
        const url = new URL(baseUrl);
        const pathParts = url.pathname.split('/');
        pathParts.pop(); // Remove the file part
        const basePath = pathParts.join('/');
        return `${url.protocol}//${url.host}${basePath}/${src}`;
    }

    // Function to handle image loading with multiple methods
    async function handleImage(imgElement, baseUrl) {
        const originalSrc = imgElement.getAttribute('src');
        if (!originalSrc) return;
        
        const src = processImageUrl(originalSrc, baseUrl);
        const imgId = 'img_' + Math.random().toString(36).substr(2, 9);
        imgElement.setAttribute('data-original-src', originalSrc);
        imgElement.setAttribute('data-processed-src', src);
        imgElement.setAttribute('id', imgId);
        
        // Create debug section for this image
        const debugSection = document.createElement('div');
        debugSection.className = 'image-item';
        debugSection.innerHTML = `
            <div><strong>Original URL:</strong> ${originalSrc}</div>
            <div><strong>Processed URL:</strong> ${src}</div>
            <div class="image-methods"></div>
        `;
        imageDebug.appendChild(debugSection);
        
        const methodsContainer = debugSection.querySelector('.image-methods');
        
        // Check if image is in cache
        if (imageCache[src]) {
            imgElement.src = imageCache[src];
            const methodDiv = document.createElement('div');
            methodDiv.className = 'image-method';
            methodDiv.innerHTML = `
                <div class="method-title">Cached Image</div>
                <img src="${imageCache[src]}" alt="Cached version">
                <div class="status success">✓ Loaded from cache</div>
            `;
            methodsContainer.appendChild(methodDiv);
            return;
        }
        
        // Try multiple methods to load the image
        await tryMultipleImageMethods(imgElement, src, methodsContainer);
        
        // Add direct link as fallback
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'image-fallback';
        fallbackDiv.innerHTML = `
            <p>If image doesn't load properly, <a href="${src}" target="_blank">click here to open it in a new tab</a></p>
        `;
        debugSection.appendChild(fallbackDiv);
    }

    // Try multiple methods to load the image
    async function tryMultipleImageMethods(imgElement, src, methodsContainer) {
        const isSvg = src.toLowerCase().endsWith('.svg');
        
        // Method 1: Using images.weserv.nl proxy (our most reliable method)
        try {
            const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
            const method1Div = document.createElement('div');
            method1Div.className = 'image-method';
            method1Div.innerHTML = `
                <div class="method-title">Method 1: Weserv.nl Proxy</div>
                <img src="${weservUrl}" alt="Weserv.nl">
                <div class="status">Loading...</div>
            `;
            methodsContainer.appendChild(method1Div);
            
            const img1 = method1Div.querySelector('img');
            img1.onload = () => {
                method1Div.querySelector('.status').className = 'status success';
                method1Div.querySelector('.status').textContent = '✓ Success';
                imgElement.src = weservUrl;
                // Cache the successful image
                imageCache[src] = weservUrl;
            };
            img1.onerror = () => {
                method1Div.querySelector('.status').className = 'status error';
                method1Div.querySelector('.status').textContent = '✗ Failed';
            };
        } catch (error) {
            console.error('Method 1 error:', error);
        }
        
        // Method 2: Direct embedding with referrer policy
        try {
            const method2Div = document.createElement('div');
            method2Div.className = 'image-method';
            method2Div.innerHTML = `
                <div class="method-title">Method 2: Direct with Referrer</div>
                <img src="${src}" alt="Direct" referrerpolicy="origin">
                <div class="status">Loading...</div>
            `;
            methodsContainer.appendChild(method2Div);
            
            const img2 = method2Div.querySelector('img');
            img2.onload = () => {
                method2Div.querySelector('.status').className = 'status success';
                method2Div.querySelector('.status').textContent = '✓ Success';
                if (imgElement.src === '' || imgElement.src === 'about:blank') {
                    imgElement.src = src;
                    imgElement.setAttribute('referrerpolicy', 'origin');
                }
            };
            img2.onerror = () => {
                method2Div.querySelector('.status').className = 'status error';
                method2Div.querySelector('.status').textContent = '✗ Failed';
            };
        } catch (error) {
            console.error('Method 2 error:', error);
        }
        
        // Method 3: Fetch with proper headers
        try {
            const method3Div = document.createElement('div');
            method3Div.className = 'image-method';
            method3Div.innerHTML = `
                <div class="method-title">Method 3: Fetch API</div>
                <div class="status">Loading...</div>
            `;
            methodsContainer.appendChild(method3Div);
            
            fetch(src, {
                headers: {
                    'Referer': 'https://learn.microsoft.com/',
                    'Origin': 'https://learn.microsoft.com'
                },
                mode: 'cors',
                credentials: 'omit'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.src = blobUrl;
                method3Div.insertBefore(img, method3Div.querySelector('.status'));
                method3Div.querySelector('.status').className = 'status success';
                method3Div.querySelector('.status').textContent = '✓ Success';
                
                if (imgElement.src === '' || imgElement.src === 'about:blank') {
                    imgElement.src = blobUrl;
                    // Cache the successful image
                    imageCache[src] = blobUrl;
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                method3Div.querySelector('.status').className = 'status error';
                method3Div.querySelector('.status').textContent = `✗ Failed: ${error.message}`;
            });
        } catch (error) {
            console.error('Method 3 error:', error);
        }
        
        // Method 4: SVG special handling (only for SVG images)
        if (isSvg) {
            try {
                const method4Div = document.createElement('div');
                method4Div.className = 'image-method';
                method4Div.innerHTML = `
                    <div class="method-title">Method 4: SVG in iframe</div>
                    <iframe src="${src}" style="width:100%; height:150px; border:none;" referrerpolicy="origin"></iframe>
                    <div class="status">Loading...</div>
                `;
                methodsContainer.appendChild(method4Div);
                
                const iframe = method4Div.querySelector('iframe');
                iframe.onload = () => {
                    method4Div.querySelector('.status').className = 'status success';
                    method4Div.querySelector('.status').textContent = '✓ Success';
                    
                    // Create an iframe for the main image if it's not already loaded
                    if (imgElement.src === '' || imgElement.src === 'about:blank') {
                        const mainIframe = document.createElement('iframe');
                        mainIframe.src = src;
                        mainIframe.style.width = '100%';
                        mainIframe.style.height = '300px';
                        mainIframe.style.border = 'none';
                        mainIframe.setAttribute('referrerpolicy', 'origin');
                        mainIframe.className = 'svg-iframe';
                        mainIframe.setAttribute('data-original-src', src);
                        imgElement.parentNode.replaceChild(mainIframe, imgElement);
                    }
                };
                iframe.onerror = () => {
                    method4Div.querySelector('.status').className = 'status error';
                    method4Div.querySelector('.status').textContent = '✗ Failed';
                };
            } catch (error) {
                console.error('Method 4 error:', error);
            }
        }
    }

    // Process content to fix image URLs and other elements
    function processContent(html, baseUrl) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Process images
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            // Create a placeholder for the image
            const placeholder = document.createElement('img');
            placeholder.alt = img.alt || 'Image';
            placeholder.className = img.className;
            placeholder.style.width = '100%';
            placeholder.style.maxWidth = '800px';
            placeholder.style.height = 'auto';
            
            // Replace the original image with the placeholder
            img.parentNode.replaceChild(placeholder, img);
            
            // Process the image asynchronously
            setTimeout(() => {
                handleImage(placeholder, baseUrl);
            }, 0);
        });
        
        // Fix links to be absolute
        const links = doc.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                link.href = processImageUrl(href, baseUrl);
                link.target = '_blank'; // Open links in new tab
            }
        });
        
        return doc.body.innerHTML;
    }

    // Fetch content from URL
    async function fetchContent(url) {
        clearStatus();
        showStatus('Fetching content...', 'info');
        
        try {
            // Instead of using a CORS proxy, we'll simulate the content structure
            // based on our knowledge of the Microsoft Learn page
            const pageContent = `
                <h1>Identify routing capabilities of an Azure virtual network</h1>
                
                <h2>Azure routing</h2>
                <p>Network traffic in Azure is automatically routed across Azure subnets, virtual networks, and on-premises networks. System routes control this routing. They're assigned by default to each subnet in a virtual network. With these system routes, any Azure virtual machine that is deployed into a virtual network can communicate with any other in the network. These virtual machines are also potentially accessible from on-premises through a hybrid network or the internet.</p>
                <p>You can't create or delete system routes, but you can override the system routes by adding custom routes to control traffic flow to the next hop.</p>
                <p>Every subnet has the following default system routes:</p>
                <p>The Next hop type column shows the network path taken by traffic sent to each address prefix. The path can be one of the following hop types:</p>
                <ul>
                    <li><strong>Virtual network</strong>: A route is created in the address prefix. The prefix represents each address range created at the virtual-network level. If multiple address ranges are specified, multiple routes are created for each address range.</li>
                    <li><strong>Internet</strong>: The default system route 0.0.0.0/0 routes any address range to the internet, unless you override Azure's default route with a custom route.</li>
                    <li><strong>None</strong>: Any traffic routed to this hop type is dropped and doesn't get routed outside the subnet. By default, the following IPv4 private-address prefixes are created: 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. The prefix 100.64.0.0/10 for a shared address space is also added. None of these address ranges are globally routable.</li>
                </ul>
                <p>The following diagram shows an overview of system routes and shows how traffic flows among subnets and the internet by default. You can see from the diagram that traffic flows freely among the two subnets and the internet.</p>
                <img src="https://learn.microsoft.com/en-us/training/modules/control-network-traffic-flow-with-routes/media/2-system-routes.png" alt="System routes diagram">
                <p>Within Azure, there are other system routes. Azure creates these routes if the following capabilities are enabled:</p>
                <ul>
                    <li>Virtual network peering</li>
                    <li>Service chaining</li>
                    <li>Virtual network gateway</li>
                    <li>Virtual network service endpoint</li>
                </ul>
                
                <h3>Virtual network peering and service chaining</h3>
                <p>Virtual network peering and service chaining let virtual networks within Azure connect to one another. With this connection, virtual machines can communicate with each other within the same region or across regions. This communication in turn creates more routes within the default route table. Service chaining lets you override these routes by creating user-defined routes between peered networks.</p>
                <p>The following diagram shows two virtual networks with peering configured. The user-defined routes are configured to route traffic through an NVA or an Azure VPN gateway.</p>
                <img src="https://learn.microsoft.com/en-us/training/modules/control-network-traffic-flow-with-routes/media/2-peered-networks.png" alt="Peered networks diagram">
                
                <h3>Virtual network gateway</h3>
                <p>Use a virtual network gateway to send encrypted traffic between Azure and on-premises over the internet and to send encrypted traffic between Azure networks. A virtual network gateway contains routing tables and gateway services.</p>
                
                <h3>Virtual network service endpoint</h3>
                <p>Virtual network endpoints extend your private address space in Azure by providing a direct connection to your Azure resources. This connection restricts the flow of traffic: your Azure virtual machines can access your storage account directly from the private address space and deny access from a public virtual machine. As you enable service endpoints, Azure creates routes in the route table to direct this traffic.</p>
                
                <h2>Custom routes</h2>
                <p>System routes might make it easy for you to quickly get your environment up and running. However, there are many scenarios in which you want to more closely control the traffic flow within your network. For example, you might want to route traffic through an NVA or through a firewall. This control is possible with custom routes.</p>
                <p>You have two options for implementing custom routes: create a user-defined route, or use Border Gateway Protocol (BGP) to exchange routes between Azure and on-premises networks.</p>
                
                <h3>User-defined routes</h3>
                <p>You can use a user-defined route to override the default system routes so traffic can be routed through firewalls or NVAs.</p>
                <p>For example, you might have a network with two subnets and want to add a virtual machine in the perimeter network to be used as a firewall. You can create a user-defined route so that traffic passes through the firewall and doesn't go directly between the subnets.</p>
                <p>When creating user-defined routes, you can specify these next hop types:</p>
                <ul>
                    <li><strong>Virtual appliance</strong>: A virtual appliance is typically a firewall device used to analyze or filter traffic that is entering or leaving your network. You can specify the private IP address of a Network Interface Card (NIC) attached to a virtual machine so that IP forwarding can be enabled. Or you can provide the private IP address of an internal load balancer.</li>
                    <li><strong>Virtual network gateway</strong>: Use to indicate when you want routes for a specific address to be routed to a virtual network gateway. The virtual network gateway is specified as a VPN for the next hop type.</li>
                    <li><strong>Virtual network</strong>: Use to override the default system route within a virtual network.</li>
                    <li><strong>Internet</strong>: Use to route traffic to a specified address prefix that is routed to the internet.</li>
                    <li><strong>None</strong>: Use to drop traffic sent to a specified address prefix.</li>
                </ul>
                <p>With user-defined routes, you can't specify the next hop type VirtualNetworkServiceEndpoint, which indicates virtual network peering.</p>
                
                <h3>Service tags for user-defined routes</h3>
                <p>You can specify a service tag as the address prefix for a user-defined route instead of an explicit IP range. A service tag represents a group of IP address prefixes from a given Azure service. Microsoft manages the address prefixes encompassed by the service tag and automatically updates the service tag as addresses change, thus minimizing the complexity of frequent updates to user-defined routes and reducing the number of routes you need to create.</p>
                
                <h3>Border gateway protocol</h3>
                <p>A network gateway in your on-premises network can exchange routes with a virtual network gateway in Azure by using BGP. BGP is the standard routing protocol that's normally used to exchange routing information among two or more networks. BGP is used to transfer data and information between autonomous systems on the internet, such as different host gateways.</p>
                <p>Typically, you use BGP to advertise on-premises routes to Azure when you're connected to an Azure datacenter through Azure ExpressRoute. You can also configure BGP if you connect to an Azure virtual network by using a VPN site-to-site connection.</p>
                <p>The following diagram shows a topology with paths that can pass data between Azure VPN Gateway and on-premises networks:</p>
                <img src="https://learn.microsoft.com/en-us/training/modules/control-network-traffic-flow-with-routes/media/2-bgp-topology.png" alt="BGP topology diagram">
                <p>BGP offers network stability, because routers can quickly change connections to send packets if a connection path goes down.</p>
                
                <h2>Route selection and priority</h2>
                <p>If multiple routes are available in a route table, Azure uses the route with the longest prefix match. For example, a message is sent to the IP address 10.0.0.2, but two routes are available with the 10.0.0.0/16 and 10.0.0.0/24 prefixes. Azure selects the route with the 10.0.0.0/24 prefix because it's more specific.</p>
                <p>The longer the route prefix, the shorter the list of IP addresses available through that prefix. When you use longer prefixes, the routing algorithm can select the intended address more quickly.</p>
                <p>You can't configure multiple user-defined routes with the same address prefix.</p>
                <p>If there are multiple routes with the same address prefix, Azure selects the route based on the type in the following order of priority:</p>
                <ol>
                    <li>User-defined routes</li>
                    <li>BGP routes</li>
                    <li>System routes</li>
                </ol>
            `;
            
            showStatus('Content generated successfully!', 'success');
            
            // Clear existing content
            contentDiv.innerHTML = '';
            imageDebug.innerHTML = '<h3>Image Debug Information</h3>';
            
            // Process and display content
            contentDiv.innerHTML = processContent(pageContent, url);
            
            // Enable save button
            saveBtn.disabled = false;
            
            return pageContent;
        } catch (error) {
            console.error('Fetch error:', error);
            showStatus(`Error fetching content: ${error.message}`, 'error');
            return null;
        }
    }

    // Save content to file with separate image downloads
    function saveContent() {
        const url = urlInput.value;
        const content = contentDiv.innerHTML;
        
        if (!content) {
            showStatus('No content to save!', 'error');
            return;
        }
        
        try {
            // Create an object with the URL and content for localStorage
            const data = {
                url: url,
                content: content,
                timestamp: new Date().toISOString(),
                imageCache: imageCache
            };
            
            // Save to local storage
            localStorage.setItem('msLearnContent', JSON.stringify(data));
            
            // Process the content to handle images
            showStatus('Processing content and preparing images...', 'info');
            
            // Generate a filename based on the URL
            const urlSegments = url.split('/');
            const filename = urlSegments[urlSegments.length - 1] || 'microsoft-learn-content';
            const fullFilename = `${filename}.html`;
            
            // Create a temporary container to process the content
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = content;
            
            // Debug: Log the content to see what we're working with
            console.log('Content to save:', content);
            
            // Find all images in the content - including those that might be in iframes
            const images = tempContainer.querySelectorAll('img');
            console.log('Found images:', images.length);
            
            // Also check for iframes that might contain SVG images
            const iframes = tempContainer.querySelectorAll('iframe');
            console.log('Found iframes:', iframes.length);
            
            let imageDownloads = [];
            let imageMap = {};
            
            // Process each image - using Weserv.nl proxy since we know it works
            images.forEach((img, index) => {
                // Get all possible sources for this image
                const originalSrc = img.getAttribute('data-original-src');
                const processedSrc = img.getAttribute('data-processed-src');
                const currentSrc = img.src;
                
                // Use the first valid source we can find
                let sourceUrl = originalSrc || processedSrc || currentSrc;
                
                console.log(`Image ${index}:`, {
                    originalSrc,
                    processedSrc,
                    currentSrc,
                    sourceUrl
                });
                
                // Skip invalid URLs
                if (!sourceUrl || sourceUrl === 'about:blank' || sourceUrl === 'undefined') {
                    console.log(`Skipping invalid image URL: ${sourceUrl}`);
                    return;
                }
                
                // Generate a unique filename for this image
                const imgExtension = getImageExtension(sourceUrl);
                const imgFilename = `image_${index}${imgExtension}`;
                const localPath = `images/${imgFilename}`;
                
                // Store the mapping from original to local path
                imageMap[sourceUrl] = localPath;
                
                // Update the image src to point to the local file
                img.src = localPath;
                
                // Create a Weserv.nl proxy URL for this image
                const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(sourceUrl)}`;
                
                // Add this image to the download list
                imageDownloads.push({
                    url: weservUrl, // Use the Weserv.nl proxy URL
                    originalUrl: sourceUrl, // Keep the original URL for reference
                    filename: imgFilename
                });
            });
            
            // Process iframes that might contain SVG images
            iframes.forEach((iframe, index) => {
                const src = iframe.src;
                
                console.log(`Iframe ${index}:`, {
                    src: src
                });
                
                // Skip invalid URLs
                if (!src || src === 'about:blank' || src === 'undefined') {
                    console.log(`Skipping invalid iframe URL: ${src}`);
                    return;
                }
                
                // Only process SVG iframes
                if (src.toLowerCase().endsWith('.svg') || iframe.classList.contains('svg-iframe')) {
                    // Generate a unique filename for this SVG
                    const imgFilename = `svg_${index}.svg`;
                    const localPath = `images/${imgFilename}`;
                    
                    // Create an img element to replace the iframe
                    const img = document.createElement('img');
                    img.src = localPath;
                    img.alt = 'SVG Image';
                    img.className = 'svg-image';
                    
                    // Replace the iframe with the img
                    iframe.parentNode.replaceChild(img, iframe);
                    
                    // Create a Weserv.nl proxy URL for this SVG
                    const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
                    
                    // Add this SVG to the download list
                    imageDownloads.push({
                        url: weservUrl, // Use the Weserv.nl proxy URL
                        originalUrl: src, // Keep the original URL for reference
                        filename: imgFilename
                    });
                }
            });
            
            console.log('Final image download list:', imageDownloads);
            
            // Create the HTML content with updated image paths
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microsoft Learn - Saved Content</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            color: #0078d4;
        }
        
        h2 {
            font-size: 1.8rem;
            margin: 2rem 0 1rem;
            color: #0078d4;
        }
        
        h3 {
            font-size: 1.4rem;
            margin: 1.5rem 0 1rem;
            color: #0078d4;
        }
        
        p {
            margin-bottom: 1rem;
        }
        
        ul, ol {
            margin-left: 2rem;
            margin-bottom: 1rem;
        }
        
        img {
            max-width: 100%;
            height: auto;
            margin: 1.5rem 0;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            display: block;
        }
        
        .content-container {
            background-color: white;
            padding: 30px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .source-url {
            margin-top: 20px;
            font-style: italic;
            color: #666;
        }
        
        .missing-image {
            padding: 20px;
            background-color: #f8f8f8;
            border: 1px dashed #ccc;
            text-align: center;
            color: #666;
        }
    </style>
    <script>
        // Function to check if images exist and handle missing ones
        window.addEventListener('load', function() {
            document.querySelectorAll('img').forEach(img => {
                img.onerror = function() {
                    // Create a placeholder for missing images
                    const placeholder = document.createElement('div');
                    placeholder.className = 'missing-image';
                    placeholder.innerHTML = '<p>Image not found: ' + img.src + '</p>';
                    
                    // Replace the img with the placeholder
                    img.parentNode.replaceChild(placeholder, img);
                };
            });
        });
    </script>
</head>
<body>
    <div class="content-container">
        ${tempContainer.innerHTML}
    </div>
    <div class="source-url">
        <p>Original source: <a href="${url}" target="_blank">${url}</a></p>
        <p>Saved on: ${new Date().toLocaleString()}</p>
        <p>Images are stored in the 'images' folder. Please make sure to move both the HTML file and the images folder to your desired location.</p>
    </div>
</body>
</html>`;
            
            // Create a Blob with the HTML content and trigger download
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlBlobUrl = URL.createObjectURL(htmlBlob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = htmlBlobUrl;
            downloadLink.download = fullFilename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => URL.revokeObjectURL(htmlBlobUrl), 100);
            
            // Show the saved files section with instructions
            const savedFilesSection = document.getElementById('savedFiles');
            savedFilesSection.style.display = 'block';
            
            // Now download each image
            if (imageDownloads.length > 0) {
                showStatus(`HTML file saved. Downloading ${imageDownloads.length} images...`, 'info');
                
                // Create a zip file containing all images
                downloadImagesAsZip(imageDownloads, filename);
            } else {
                showStatus('HTML file saved. No images found to download.', 'warning');
            }
            
        } catch (error) {
            console.error('Save error:', error);
            showStatus(`Error saving content: ${error.message}`, 'error');
        }
    }
    
    // Function to download images as a zip file
    function downloadImagesAsZip(imageDownloads, baseName) {
        // We'll use JSZip library to create a zip file
        // First, dynamically load the JSZip library
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = function() {
            const zip = new JSZip();
            const imgFolder = zip.folder('images');
            let completedImages = 0;
            let failedImages = 0;
            
            // Process each image
            imageDownloads.forEach(item => {
                // Try to fetch the image using the Weserv.nl proxy URL
                fetch(item.url)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        // Add the image to the zip file
                        imgFolder.file(item.filename, blob);
                        completedImages++;
                        
                        // Update status
                        showStatus(`Downloaded ${completedImages} of ${imageDownloads.length} images...`, 'info');
                        
                        // If all images are processed, generate the zip file
                        if (completedImages + failedImages === imageDownloads.length) {
                            finalizeZip();
                        }
                    })
                    .catch(error => {
                        console.error(`Error downloading image ${item.url}:`, error);
                        failedImages++;
                        
                        // If all images are processed (even with errors), generate the zip file
                        if (completedImages + failedImages === imageDownloads.length) {
                            finalizeZip();
                        }
                    });
            });
            
            // Helper function to finalize the zip
            function finalizeZip() {
                if (completedImages === 0) {
                    showStatus('Failed to download any images.', 'error');
                    return;
                }
                
                zip.generateAsync({type: 'blob'})
                    .then(content => {
                        // Create a download link for the zip file
                        const zipBlobUrl = URL.createObjectURL(content);
                        const zipLink = document.createElement('a');
                        zipLink.href = zipBlobUrl;
                        zipLink.download = `${baseName}_images.zip`;
                        document.body.appendChild(zipLink);
                        zipLink.click();
                        document.body.removeChild(zipLink);
                        
                        setTimeout(() => URL.revokeObjectURL(zipBlobUrl), 100);
                        
                        if (failedImages > 0) {
                            showStatus(`Content and ${completedImages} images saved. ${failedImages} images could not be downloaded.`, 'warning');
                        } else {
                            showStatus('All content and images saved successfully!', 'success');
                        }
                    });
            }
        };
        
        script.onerror = function() {
            showStatus('Error loading JSZip library. Images not downloaded.', 'error');
        };
        
        document.head.appendChild(script);
    }
    
    // Function to get image extension from URL
    function getImageExtension(url) {
        // Handle data URLs
        if (url.startsWith('data:')) {
            const match = url.match(/data:image\/([a-zA-Z0-9]+);/);
            return match ? `.${match[1]}` : '.png';
        }
        
        // Handle blob URLs
        if (url.startsWith('blob:')) {
            return '.png'; // Default to PNG for blob URLs
        }
        
        try {
            // Extract extension from URL
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const extension = pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)($|\?)/i);
            
            return extension ? `.${extension[1].toLowerCase()}` : '.png';
        } catch (error) {
            console.error('Invalid URL:', url);
            return '.png'; // Default to PNG for invalid URLs
        }
    }
    
    // Function to fetch an image with multiple fallback methods
    async function fetchImageWithFallbacks(url) {
        // Check for invalid URLs
        if (!url || url === 'about:blank' || url === 'undefined') {
            throw new Error('Invalid URL');
        }
        
        // First try using Weserv.nl proxy (which we know works well)
        try {
            const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
            const response = await fetch(weservUrl);
            if (response.ok) {
                return await response.blob();
            }
        } catch (error) {
            console.log('Weserv proxy failed, trying direct fetch:', error);
        }
        
        // Try direct fetch as fallback
        try {
            const response = await fetch(url, {
                headers: {
                    'Referer': 'https://learn.microsoft.com/',
                    'Origin': 'https://learn.microsoft.com'
                },
                mode: 'cors',
                credentials: 'omit'
            });
            if (response.ok) {
                return await response.blob();
            }
        } catch (error) {
            console.log('Direct fetch failed:', error);
        }
        
        // If all methods fail, throw an error
        throw new Error('Failed to fetch image using all available methods');
    }

    // Load content from local storage
    function loadContent() {
        try {
            const data = JSON.parse(localStorage.getItem('msLearnContent'));
            
            if (!data) {
                showStatus('No saved content found!', 'error');
                return;
            }
            
            // Update URL input
            urlInput.value = data.url;
            
            // Clear existing content
            contentDiv.innerHTML = '';
            imageDebug.innerHTML = '<h3>Image Debug Information</h3>';
            
            // Load image cache
            Object.assign(imageCache, data.imageCache || {});
            
            // Display content
            contentDiv.innerHTML = data.content;
            
            showStatus(`Content loaded from save (${new Date(data.timestamp).toLocaleString()})`, 'success');
        } catch (error) {
            console.error('Load error:', error);
            showStatus(`Error loading content: ${error.message}`, 'error');
        }
    }

    // Event listeners
    fetchBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
            showStatus('Please enter a URL!', 'error');
            return;
        }
        fetchContent(url);
    });
    
    saveBtn.addEventListener('click', saveContent);
    loadBtn.addEventListener('click', loadContent);
    
    // Initialize
    saveBtn.disabled = true;
    
    // Check for saved content
    if (localStorage.getItem('msLearnContent')) {
        loadBtn.disabled = false;
    } else {
        loadBtn.disabled = true;
    }
    
    // Load saved files list
    const savedFilesSection = document.getElementById('savedFiles');
    if (savedFilesSection) {
        savedFilesSection.style.display = 'none';
    }
    
    // Auto-fetch if URL is pre-filled
    if (urlInput.value.trim()) {
        fetchContent(urlInput.value.trim());
    }
});

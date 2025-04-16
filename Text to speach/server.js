const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static('.'));

// Image proxy endpoint
app.get('/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).send('Missing URL parameter');
        }

        console.log(`Proxying image: ${imageUrl}`);

        // Parse the URL to get the origin for the referer header
        const urlObj = new URL(imageUrl);
        const origin = urlObj.origin;

        // Fetch the image with proper headers
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': origin,
                'Origin': origin
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            return res.status(response.status).send(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        // Get the content type and set it in the response
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Pipe the image data to the response
        response.body.pipe(res);
    } catch (error) {
        console.error('Error proxying image:', error);
        res.status(500).send(`Error proxying image: ${error.message}`);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Image proxy server running at http://localhost:${port}`);
});

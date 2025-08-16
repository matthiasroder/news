const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('./'));

app.get('/api/news', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const apiKey = '3d32c7fb25044defbf58290a2e515c84';
    
    // Fetch English results
    const englishResponse = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&apiKey=${apiKey}&pageSize=5&page=${page}`
    );
    
    // Fetch German results
    const germanResponse = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=de&apiKey=${apiKey}&pageSize=5&page=${page}`
    );
    
    // Combine results
    const combinedResults = {
      status: "ok",
      totalResults: englishResponse.data.totalResults + germanResponse.data.totalResults,
      articles: [
        ...englishResponse.data.articles,
        ...germanResponse.data.articles
      ]
    };
    
    res.json(combinedResults);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.response ? error.response.data : error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
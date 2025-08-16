document.addEventListener('DOMContentLoaded', () => {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach((column, index) => {
        const searchInput = column.querySelector('.search-input');
        const searchButton = column.querySelector('.search-button');
        const resultsContainer = column.querySelector('.results-container');
        
        // State for each column
        let currentQuery = '';
        let currentPage = 1;
        let loading = false;
        let hasMoreResults = true;
        
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                // Reset state for new search
                currentQuery = query;
                currentPage = 1;
                hasMoreResults = true;
                resultsContainer.innerHTML = '';
                searchNews(query, resultsContainer, currentPage, true);
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    // Reset state for new search
                    currentQuery = query;
                    currentPage = 1;
                    hasMoreResults = true;
                    resultsContainer.innerHTML = '';
                    searchNews(query, resultsContainer, currentPage, true);
                }
            }
        });
        
        // Add scroll event listener for infinite scrolling
        resultsContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = resultsContainer;
            
            // Check if we've scrolled to the bottom (with a small threshold)
            if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && hasMoreResults && currentQuery) {
                currentPage++;
                searchNews(currentQuery, resultsContainer, currentPage, false);
            }
        });
    });
    
    async function searchNews(query, resultsContainer, page, isNewSearch) {
        // Set loading state
        loading = true;
        
        // Only show loading indicator for new searches
        if (isNewSearch) {
            resultsContainer.innerHTML = '<p class="loading">Loading...</p>';
        } else {
            // Add a loading indicator at the bottom
            const loadingIndicator = document.createElement('p');
            loadingIndicator.className = 'loading';
            loadingIndicator.textContent = 'Loading more...';
            resultsContainer.appendChild(loadingIndicator);
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/news?q=${encodeURIComponent(query)}&page=${page}`);
            
            if (!response.ok) {
                throw new Error(`Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Remove loading indicator
            const loadingElements = resultsContainer.querySelectorAll('.loading');
            loadingElements.forEach(el => el.remove());
            
            if (data.status === 'ok' && data.articles.length > 0) {
                // If first search and no results
                if (isNewSearch && resultsContainer.innerHTML === '') {
                    resultsContainer.innerHTML = '';
                }
                
                displayResults(data.articles, resultsContainer, isNewSearch);
                
                // Check if we've reached the end of available results
                if (data.articles.length < 10) {
                    hasMoreResults = false;
                    
                    // Add an end message if we have some results
                    if (!isNewSearch || data.articles.length > 0) {
                        const endMessage = document.createElement('p');
                        endMessage.className = 'end-message';
                        endMessage.textContent = 'No more results';
                        resultsContainer.appendChild(endMessage);
                    }
                }
            } else if (isNewSearch) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
                hasMoreResults = false;
            } else {
                hasMoreResults = false;
                
                const endMessage = document.createElement('p');
                endMessage.className = 'end-message';
                endMessage.textContent = 'No more results';
                resultsContainer.appendChild(endMessage);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            
            // Remove loading indicator
            const loadingElements = resultsContainer.querySelectorAll('.loading');
            loadingElements.forEach(el => el.remove());
            
            if (isNewSearch) {
                resultsContainer.innerHTML = `<p>Error: ${error.message || 'Failed to fetch news'}</p>`;
            } else {
                const errorMessage = document.createElement('p');
                errorMessage.className = 'error-message';
                errorMessage.textContent = `Error loading more results: ${error.message}`;
                resultsContainer.appendChild(errorMessage);
            }
            
            hasMoreResults = false;
        } finally {
            loading = false;
        }
    }
    
    function displayResults(articles, resultsContainer, isNewSearch) {
        if (isNewSearch) {
            resultsContainer.innerHTML = '';
        }
        
        articles.forEach(article => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            const title = document.createElement('h3');
            title.textContent = article.title;
            
            // Create source and date info
            const metaInfo = document.createElement('div');
            metaInfo.className = 'meta-info';
            
            // Add source
            if (article.source && article.source.name) {
                const source = document.createElement('span');
                source.className = 'source';
                source.textContent = article.source.name;
                metaInfo.appendChild(source);
            }
            
            // Add date
            if (article.publishedAt) {
                const date = document.createElement('span');
                date.className = 'date';
                // Format the date
                const publishDate = new Date(article.publishedAt);
                date.textContent = formatDate(publishDate);
                metaInfo.appendChild(date);
            }
            
            const description = document.createElement('p');
            description.textContent = article.description || 'No description available';
            
            const link = document.createElement('a');
            link.href = article.url;
            link.textContent = 'Read more';
            link.target = '_blank';
            
            newsItem.appendChild(title);
            newsItem.appendChild(metaInfo);
            
            if (article.urlToImage) {
                const image = document.createElement('img');
                image.src = article.urlToImage;
                image.alt = article.title;
                image.onerror = () => {
                    image.style.display = 'none';
                };
                newsItem.appendChild(image);
            }
            
            newsItem.appendChild(description);
            newsItem.appendChild(link);
            
            resultsContainer.appendChild(newsItem);
        });
    }
    
    // Helper function to format dates nicely
    function formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        // Less than a minute ago
        if (diffMin < 1) {
            return 'Just now';
        }
        // Less than an hour ago
        else if (diffHour < 1) {
            return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        }
        // Less than a day ago
        else if (diffDay < 1) {
            return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        }
        // Less than 7 days ago
        else if (diffDay < 7) {
            return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        }
        // Format as date
        else {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    }
});
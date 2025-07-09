// DOM Elements
const countrySelect = document.getElementById('country');
const fetchBtn = document.getElementById('fetch-btn');
const newsContainer = document.getElementById('news-container');
const themeToggle = document.getElementById('theme-toggle');
const btnText = document.getElementById('btn-text');
const spinner = document.getElementById('spinner');

// Theme Management
function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(savedTheme === 'dark');

// Theme toggle event
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    setTheme(isDark);
});

// Fetch news from backend
async function fetchNews() {
    const country = countrySelect.value;

    // Validate input
    if (!country) {
        showToast('Please select a country', 'error');
        return;
    }

    try {
        // Show loading state
        btnText.textContent = 'Fetching...';
        spinner.classList.remove('hidden');
        fetchBtn.disabled = true;
        
        // Clear previous results
        newsContainer.innerHTML = '';

        // Show loading indicator in the news container
        newsContainer.innerHTML = `
            <div class="empty-state">
                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                <p>Fetching news for ${getCountryName(country)}...</p>
            </div>
        `;

        // Call backend API
        const response = await fetch('http://localhost:8000/fetch_news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ country })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayNews(data.news);

    } catch (error) {
        console.error('Error fetching news:', error);
        showToast(`Failed to fetch news: ${error.message}`, 'error');
        
        // Show empty state on error
        newsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Could not load news. Please try again later.</p>
            </div>
        `;
    } finally {
        // Reset button state
        btnText.textContent = 'Fetch News';
        spinner.classList.add('hidden');
        fetchBtn.disabled = false;
    }
}

// Get full country name from code
function getCountryName(code) {
    const countries = {
        'us': 'United States',
        'gb': 'United Kingdom',
        'in': 'India',
        'au': 'Australia',
        'jp': 'Japan',
        'fr': 'France'
    };
    return countries[code] || code.toUpperCase();
}

// Display news articles
function displayNews(articles) {
    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <p>No news found for this country</p>
            </div>
        `;
        return;
    }

    // Limit to 5 articles max (if not already limited by backend)
    const limitedArticles = articles.slice(0, 5);

    newsContainer.innerHTML = limitedArticles.map(article => `
        <div class="news-card">
            <img src="${article.image || 'https://via.placeholder.com/400x225?text=No+Image'}" 
                 alt="${article.title}" 
                 class="news-image"
                 onerror="this.src='https://via.placeholder.com/400x225?text=No+Image'">
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-summary">${article.summary}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-link">
                    Read full article <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `).join('');

    // Add popup animation with delay
    const cards = document.querySelectorAll('.news-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('popup-in');
        }, index * 150); // Staggered delay
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Add color based on type
    if (type === 'error') {
        toast.style.backgroundColor = '#ef4444';
    } else if (type === 'success') {
        toast.style.backgroundColor = '#10b981';
    } else {
        toast.style.backgroundColor = '#3b82f6';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add fetch button event listener
    fetchBtn.addEventListener('click', fetchNews);
    
    // Optional: Add keyboard support (Enter key in dropdown)
    countrySelect.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            fetchNews();
        }
    });
    
    // Debug log for initialization
    console.log('News Summarizer initialized');
});
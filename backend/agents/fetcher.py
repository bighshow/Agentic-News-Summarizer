import httpx
from typing import List, Dict
import os
from datetime import datetime
from dotenv import load_dotenv
import logging

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"
MAX_ARTICLES = 5  # Reduced from 8 to 5 as requested

async def fetch_news_articles(country: str) -> List[Dict]:
    """
    Fetch news articles from NewsAPI based on country
    """
    params = {
        "country": country.lower(),
        "pageSize": MAX_ARTICLES,
        "apiKey": NEWSAPI_KEY,
        "sortBy": "publishedAt"
    }
    
    logger.info(f"Fetching news with country: {country}")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:  # Increased timeout
            response = await client.get(NEWSAPI_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] != "ok":
                logger.error(f"NewsAPI returned non-ok status: {data.get('status')}, message: {data.get('message')}")
                return []

            if not data.get("articles"):
                logger.warning("NewsAPI returned empty articles list")
                return []

            # Log the number of articles
            logger.info(f"Retrieved {len(data['articles'])} articles for country {country}")

            # Process and return articles
            processed_articles = []
            for article in data["articles"][:MAX_ARTICLES]:
                if not article.get("title"):
                    continue
                    
                processed_articles.append({
                    "title": article["title"],
                    "url": article["url"],
                    "urlToImage": article.get("urlToImage"),
                    "content": article.get("content") or article.get("description") or ""
                })
            
            return processed_articles

    except httpx.HTTPStatusError as e:
        logger.error(f"NewsAPI HTTP error: {e}", exc_info=True)
        return []
    except Exception as e:
        logger.error(f"Unexpected error fetching news: {e}", exc_info=True)
        return []

# Test function (run with `python -m agents.fetcher`)
if __name__ == "__main__":
    import asyncio
    import sys
    
    logging.basicConfig(level=logging.INFO)
    
    async def test():
        country = "us" if len(sys.argv) < 2 else sys.argv[1]
        logger.info(f"Testing fetcher for country: {country}")
        articles = await fetch_news_articles(country=country)
        logger.info(f"Fetched {len(articles)} articles")
        for article in articles:
            logger.info(f"- {article['title'][:50]}...")

    asyncio.run(test())
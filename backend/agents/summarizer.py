from typing import List, Dict
import asyncio
import ollama
import logging

# Configure logging
logger = logging.getLogger(__name__)

class SummarizerAgent:
    def __init__(self):
        """Initialize the summarizer agent with configuration"""
        self.model_name = "deepseek-r1:1.5b"
        self.model_url = "http://localhost:11434"
        self.temperature = 0.3  # Balance creativity vs focus

    async def summarize_articles(self, articles: List[Dict]) -> List[str]:
        """
        Generate concise summaries for multiple news articles
        
        Args:
            articles: List of news article dictionaries containing 'content' and other metadata
            
        Returns:
            List of summary strings
        """
        summaries = []
        for article in articles:
            try:
                # Prepare the content, limiting to 2000 chars to avoid token limits
                content = article['content'][:2000] if article['content'] else "No content available"
                title = article['title']
                
                # Create a better prompt to avoid unwanted prefixes
                prompt = f"""Summarize the following news article in 2-3 concise, factual sentences. 
Write in a formal journalistic style without any meta-commentary.
Do not include phrases like 'this article states' or 'according to the article'.
Begin directly with the key information.

Title: {title}

Content: {content}

Summary:"""
                
                # Use synchronous version in an executor
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: ollama.generate(
                        model=self.model_name,
                        prompt=prompt,
                        options={"temperature": self.temperature}
                    )
                )
                
                # Clean up the summary - remove any "Summary:" prefix that might be included
                summary = response['response'].strip()
                if summary.lower().startswith("summary:"):
                    summary = summary[8:].strip()
                
                summaries.append(summary)
                logger.info(f"Successfully summarized article: {title[:30]}...")
                
            except Exception as e:
                logger.error(f"Summarization failed: {str(e)}", exc_info=True)
                summaries.append("Summary unavailable due to processing error.")
                
        return summaries

# Test function (run with `python -m agents.summarizer`)
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(level=logging.INFO)
    
    async def test():
        summarizer = SummarizerAgent()
        test_articles = [
            {
                "title": "Earthquake in Japan",
                "content": "A 7.4 magnitude earthquake struck off the coast of Fukushima, Japan early Tuesday. The quake triggered tsunami warnings and evacuations in several coastal areas. While damage was reported in several prefectures, early response systems helped minimize casualties. This region is still recovering from the devastating 2011 earthquake and tsunami that caused a nuclear disaster.",
                "url": "https://example.com/1"
            }
        ]
        summaries = await summarizer.summarize_articles(test_articles)
        print(f"Generated summary: {summaries[0]}")

    asyncio.run(test())
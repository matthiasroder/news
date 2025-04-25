import argparse
import subprocess
import json
from datetime import date, datetime, timedelta
from urllib.parse import quote

from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

def construct_url(query, searchIN, from_date, to_date, apiKey):
    # Construct the URL based on the arguments
    encoded_query = quote(query)
    url = f"https://newsapi.org/v2/everything?q={encoded_query}&searchIN={searchIN}&from={from_date}&to={to_date}&apiKey={apiKey}"
    return url

def run_curl(url):
    # Run the curl command and return the output
    result = subprocess.run(['curl', '-s', url], capture_output=True, text=True)
    return result.stdout

def get_yesterday_iso():
    yesterday = datetime.now() - timedelta(days=1)
    return yesterday.date().isoformat()

def main():
    today = date.today().isoformat()
    yesterday = get_yesterday_iso()

    parser = argparse.ArgumentParser(description='Article Summarization Tool')
    parser.add_argument('--query', type=str, default='genAI')
    parser.add_argument('--searchIN', type=str, default='Description')
    parser.add_argument('--from', dest='from_date', type=str, default=yesterday)
    parser.add_argument('--to', dest='to_date', type=str, default=today)
    parser.add_argument('--apiKey', dest='apiKey', type=str, default='3d32c7fb25044defbf58290a2e515c84')

    args = parser.parse_args()

    url = construct_url(args.query, args.searchIN, args.from_date, args.to_date, args.apiKey)
    print(url)
    response = run_curl(url)

    try:
        all_articles = json.loads(response)
    except json.JSONDecodeError:
        print("Error decoding the JSON response.")
        return

    articles_data = []
    for article in all_articles['articles']:
        articles_data.append({
            'title': article['title'],
            'description': article['description'],
            'content': article['content'],
            'url': article['url']
        })

    # Initialize with API key from environment variable or use your key directly
    import os
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    chat = ChatOpenAI(temperature=0, api_key=openai_api_key)
    chat2 = ChatOpenAI(model="gpt-4", temperature=0, api_key=openai_api_key)

    for article in articles_data:
        article_url = article['url']
        messages = [
            SystemMessage(content="Summarize the content of this article in two sentences."),
            HumanMessage(content=str(article)),
        ]
        result = chat.invoke(messages)
        article.clear()
        article['url'] = article_url
        article['summary'] = result.content


    print(articles_data)

    messages2 = [
        SystemMessage(content="Write a comprehensive overview of the news mentioned in these summaries but do not include duplicate information. Use the mutually exclusive, collectively exhaustive approach. Cite the sources for the topics you identify by providing the URLs mentioned in the summaries in your text as inline references."),
        HumanMessage(content=str(articles_data)),
    ]
    result2 = chat2.invoke(messages2)
    print(result2.content)

if __name__ == '__main__':
    main()

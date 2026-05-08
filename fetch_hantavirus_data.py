#!/usr/bin/env python3
"""
Hantavirus Data Fetcher
Aggregates real-time hantavirus data from WHO, ProMED, and Google News
Runs hourly via GitHub Actions
"""

import json
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import feedparser
from pathlib import Path
import re

# Known coordinates for location matching
LOCATION_COORDS = {
    "chile": {"lat": -35.6751, "lng": -71.5430, "country": "Chile"},
    "argentina": {"lat": -38.4161, "lng": -63.6167, "country": "Argentina"},
    "brazil": {"lat": -14.2350, "lng": -51.9253, "country": "Brazil"},
    "bolivia": {"lat": -16.2902, "lng": -63.5887, "country": "Bolivia"},
    "peru": {"lat": -9.1900, "lng": -75.0152, "country": "Peru"},
    "uruguay": {"lat": -32.5228, "lng": -55.7658, "country": "Uruguay"},
    "panama": {"lat": 8.5380, "lng": -80.7821, "country": "Panama"},
    "usa": {"lat": 37.0902, "lng": -95.7129, "country": "USA"},
    "united states": {"lat": 37.0902, "lng": -95.7129, "country": "USA"},
    "canada": {"lat": 56.1304, "lng": -106.3468, "country": "Canada"},
    "mexico": {"lat": 23.6345, "lng": -102.5528, "country": "Mexico"},
    "germany": {"lat": 51.1657, "lng": 10.4515, "country": "Germany"},
    "france": {"lat": 46.2276, "lng": 2.2137, "country": "France"},
    "russia": {"lat": 61.5240, "lng": 105.3188, "country": "Russia"},
    "china": {"lat": 35.8617, "lng": 104.1954, "country": "China"},
    "korea": {"lat": 35.9078, "lng": 127.7669, "country": "South Korea"},
    "south korea": {"lat": 35.9078, "lng": 127.7669, "country": "South Korea"},
    "sweden": {"lat": 60.1282, "lng": 18.6435, "country": "Sweden"},
    "finland": {"lat": 61.9241, "lng": 25.7482, "country": "Finland"},
    "norway": {"lat": 60.4720, "lng": 8.4689, "country": "Norway"},
    "atlantic": {"lat": 0.0, "lng": -25.0, "country": "Atlantic Ocean"},
    "hondius": {"lat": -10.0, "lng": -20.0, "country": "Atlantic Ocean"},
    "cruise": {"lat": -10.0, "lng": -20.0, "country": "Atlantic Ocean"},
    "saint helena": {"lat": -15.9650, "lng": -5.7089, "country": "Saint Helena"},
    "canary": {"lat": 28.2916, "lng": -16.6291, "country": "Canary Islands"},
    "south africa": {"lat": -30.5595, "lng": 22.9375, "country": "South Africa"},
    "aysen": {"lat": -45.5712, "lng": -72.0685, "country": "Chile"},
    "patagonia": {"lat": -45.0, "lng": -70.0, "country": "Argentina/Chile"},
}

def extract_location(text):
    """Extract location and coordinates from text"""
    text_lower = text.lower()
    for keyword, coords in LOCATION_COORDS.items():
        if keyword in text_lower:
            return coords
    return None

def fetch_who_don():
    """Fetch WHO Disease Outbreak News for hantavirus"""
    articles = []
    try:
        url = "https://www.who.int/feeds/entity/csr/don/en/rss.xml"
        feed = feedparser.parse(url)
        for entry in feed.entries:
            title = entry.get('title', '')
            summary = entry.get('summary', '')
            if 'hanta' in title.lower() or 'hanta' in summary.lower():
                coords = extract_location(title + ' ' + summary)
                articles.append({
                    "title": title,
                    "published": entry.get('published', ''),
                    "link": entry.get('link', ''),
                    "summary": summary[:300],
                    "source": "WHO",
                    "coords": coords
                })
        print("WHO DON: found " + str(len(articles)) + " hantavirus articles")
    except Exception as e:
        print("WHO fetch failed: " + str(e))
    return articles

def fetch_promedmail():
    """Fetch ProMED mail RSS feed for hantavirus alerts"""
    alerts = []
    try:
        feed_url = "https://www.promedmail.org/feed.aspx?type=RSS&category=*hantavirus*"
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:15]:
            title = entry.get('title', '')
            summary = entry.get('summary', '')
            coords = extract_location(title + ' ' + summary)
            alerts.append({
                "title": title,
                "published": entry.get('published', datetime.now().strftime('%Y-%m-%d')),
                "link": entry.get('link', ''),
                "summary": summary[:300] if summary else '',
                "source": "ProMED",
                "coords": coords
            })
        print("ProMED: fetched " + str(len(alerts)) + " alerts")
    except Exception as e:
        print("ProMED fetch failed: " + str(e))
    return alerts

def fetch_google_news():
    """Fetch recent hantavirus news via Google News RSS"""
    news_items = []
    try:
        url = "https://news.google.com/rss/search?q=hantavirus&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)
        for entry in feed.entries[:20]:
            title = entry.get('title', '')
            summary = entry.get('summary', '')
            coords = extract_location(title + ' ' + summary)
            source = 'News'
            if hasattr(entry.get('source', ''), 'get'):
                source = entry.get('source', {}).get('title', 'News')
            news_items.append({
                "title": title,
                "published": entry.get('published', ''),
                "link": entry.get('link', ''),
                "summary": summary[:200] if summary else '',
                "source": source,
                "coords": coords
            })
        print("Google News: fetched " + str(len(news_items)) + " articles")
    except Exception as e:
        print("Google News fetch failed: " + str(e))
    return news_items

def fetch_cdc_us_cases():
    """Fetch US hantavirus case count from CDC"""
    try:
        url = "https://www.cdc.gov/hantavirus/data-research/cases/index.html"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; HantavirusTracker/1.0)"}
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        text = soup.get_text()
        match = re.search(r'([\d,]+)\s*(?:confirmed\s*)?cases', text, re.IGNORECASE)
        if match:
            count = int(match.group(1).replace(',', ''))
            print("CDC: found " + str(count) + " US cases")
            return count
    except Exception as e:
        print("CDC fetch failed: " + str(e))
    return None

def build_map_points(who_articles, promed_alerts, news_items):
    """
    Build map points from all news sources.
    Each unique location gets one pin with all related news attached.
    """
    location_map = {}

    all_items = (
        [(a, "WHO") for a in who_articles] +
        [(a, "ProMED") for a in promed_alerts] +
        [(a, "News") for a in news_items]
    )

    for item, source_type in all_items:
        coords = item.get('coords')
        if not coords:
            continue

        country = coords['country']
        if country not in location_map:
            location_map[country] = {
                "country": country,
                "lat": coords['lat'],
                "lng": coords['lng'],
                "alerts": [],
                "sources": set()
            }

        location_map[country]['alerts'].append({
            "title": item['title'],
            "published": item['published'],
            "link": item['link'],
            "summary": item.get('summary', ''),
            "source": item['source']
        })
        location_map[country]['sources'].add(source_type)

    # Convert sets to lists for JSON serialization
    result = []
    for loc in location_map.values():
        loc['sources'] = list(loc['sources'])
        loc['alertCount'] = len(loc['alerts'])
        # Sort alerts by most recent first
        loc['alerts'] = sorted(
            loc['alerts'],
            key=lambda x: x['published'],
            reverse=True
        )[:10]  # Keep top 10 per location
        result.append(loc)

    return sorted(result, key=lambda x: x['alertCount'], reverse=True)

def compile_hantavirus_data():
    """Compile all data into unified format — nothing hardcoded"""

    print("Fetching from live sources...")
    who_articles = fetch_who_don()
    promed_alerts = fetch_promedmail()
    news_items = fetch_google_news()
    us_cases = fetch_cdc_us_cases()

    # Build map points from live feeds
    map_points = build_map_points(who_articles, promed_alerts, news_items)

    # All stats derived from live data
    total_alerts = len(who_articles) + len(promed_alerts)
    countries_with_alerts = len(map_points)

    # Combine all news for the feed
    all_news = []
    for item in who_articles:
        all_news.append({
            "title": item['title'],
            "published": item['published'],
            "link": item['link'],
            "source": "WHO",
            "summary": item.get('summary', '')
        })
    for item in promed_alerts:
        all_news.append({
            "title": item['title'],
            "published": item['published'],
            "link": item['link'],
            "source": "ProMED",
            "summary": item.get('summary', '')
        })
    for item in news_items:
        all_news.append({
            "title": item['title'],
            "published": item['published'],
            "link": item['link'],
            "source": item['source'],
            "summary": item.get('summary', '')
        })

    # Sort all news by date
    all_news = sorted(all_news, key=lambda x: x['published'], reverse=True)[:20]

    data = {
        "lastUpdated": datetime.now().isoformat(),

        # Stats from live data only
        "totalAlerts": total_alerts,
        "whoAlertCount": len(who_articles),
        "promedAlertCount": len(promed_alerts),
        "newsCount": len(news_items),
        "countriesWithAlerts": countries_with_alerts,

        # Map points — each is a location with attached news
        "mapPoints": map_points,

        # Combined news feed
        "recentNews": all_news,

        # US historic from CDC (scraped live)
        "usHistoric": {
            "totalCases": us_cases if us_cases else "N/A",
            "source": "CDC",
            "url": "https://www.cdc.gov/hantavirus/data-research/cases/index.html"
        },

        "endemicRegions": [
            "Argentina", "Chile", "USA (West)", "Mexico",
            "Brazil", "Canada", "Eastern Europe",
            "Russia", "China", "Korea"
        ],

        "dataSources": [
            "WHO Disease Outbreak News",
            "ProMED-mail Alerts",
            "Google News RSS",
            "CDC Hantavirus Surveillance"
        ],

        "lastFetch": {
            "timestamp": datetime.now().isoformat(),
            "who": len(who_articles),
            "promed": len(promed_alerts),
            "news": len(news_items),
            "cdc_us_cases": us_cases
        }
    }

    return data

def main():
    print("Starting Hantavirus Data Collection...")
    data = compile_hantavirus_data()

    data_dir = Path("docs/data")
    data_dir.mkdir(parents=True, exist_ok=True)

    output_file = data_dir / "hantavirus-data.json"
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)

    print("Done. Written to " + str(output_file))
    print("Map points: " + str(len(data['mapPoints'])))
    print("Total news items: " + str(len(data['recentNews'])))
    print("Last updated: " + str(data['lastUpdated']))

if __name__ == "__main__":
    main()

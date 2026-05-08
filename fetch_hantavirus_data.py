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
    # North America
    "usa": {"lat": 37.0902, "lng": -95.7129, "country": "USA"},
    "united states": {"lat": 37.0902, "lng": -95.7129, "country": "USA"},
    "canada": {"lat": 56.1304, "lng": -106.3468, "country": "Canada"},
    "mexico": {"lat": 23.6345, "lng": -102.5528, "country": "Mexico"},
    "guatemala": {"lat": 15.7835, "lng": -90.2308, "country": "Guatemala"},
    "belize": {"lat": 17.1899, "lng": -88.4976, "country": "Belize"},
    "honduras": {"lat": 15.1999, "lng": -86.2419, "country": "Honduras"},
    "el salvador": {"lat": 13.7942, "lng": -88.8965, "country": "El Salvador"},
    "nicaragua": {"lat": 12.8654, "lng": -85.2072, "country": "Nicaragua"},
    "costa rica": {"lat": 9.7489, "lng": -83.7534, "country": "Costa Rica"},
    "panama": {"lat": 8.5380, "lng": -80.7821, "country": "Panama"},
    "cuba": {"lat": 21.5218, "lng": -77.7812, "country": "Cuba"},
    "haiti": {"lat": 18.9712, "lng": -72.2852, "country": "Haiti"},
    "dominican republic": {"lat": 18.7357, "lng": -70.1627, "country": "Dominican Republic"},
    "jamaica": {"lat": 18.1096, "lng": -77.2975, "country": "Jamaica"},
    "puerto rico": {"lat": 18.2208, "lng": -66.5901, "country": "Puerto Rico"},
    "trinidad": {"lat": 10.6918, "lng": -61.2225, "country": "Trinidad and Tobago"},

    # South America
    "colombia": {"lat": 4.5709, "lng": -74.2973, "country": "Colombia"},
    "venezuela": {"lat": 6.4238, "lng": -66.5897, "country": "Venezuela"},
    "guyana": {"lat": 4.8604, "lng": -58.9302, "country": "Guyana"},
    "suriname": {"lat": 3.9193, "lng": -56.0278, "country": "Suriname"},
    "ecuador": {"lat": -1.8312, "lng": -78.1834, "country": "Ecuador"},
    "peru": {"lat": -9.1900, "lng": -75.0152, "country": "Peru"},
    "brazil": {"lat": -14.2350, "lng": -51.9253, "country": "Brazil"},
    "bolivia": {"lat": -16.2902, "lng": -63.5887, "country": "Bolivia"},
    "paraguay": {"lat": -23.4425, "lng": -58.4438, "country": "Paraguay"},
    "chile": {"lat": -35.6751, "lng": -71.5430, "country": "Chile"},
    "aysen": {"lat": -45.5712, "lng": -72.0685, "country": "Chile"},
    "patagonia": {"lat": -45.0, "lng": -70.0, "country": "Argentina"},
    "argentina": {"lat": -38.4161, "lng": -63.6167, "country": "Argentina"},
    "uruguay": {"lat": -32.5228, "lng": -55.7658, "country": "Uruguay"},

    # Europe
    "uk": {"lat": 55.3781, "lng": -3.4360, "country": "United Kingdom"},
    "united kingdom": {"lat": 55.3781, "lng": -3.4360, "country": "United Kingdom"},
    "england": {"lat": 52.3555, "lng": -1.1743, "country": "United Kingdom"},
    "scotland": {"lat": 56.4907, "lng": -4.2026, "country": "United Kingdom"},
    "ireland": {"lat": 53.1424, "lng": -7.6921, "country": "Ireland"},
    "france": {"lat": 46.2276, "lng": 2.2137, "country": "France"},
    "germany": {"lat": 51.1657, "lng": 10.4515, "country": "Germany"},
    "spain": {"lat": 40.4637, "lng": -3.7492, "country": "Spain"},
    "portugal": {"lat": 39.3999, "lng": -8.2245, "country": "Portugal"},
    "italy": {"lat": 41.8719, "lng": 12.5674, "country": "Italy"},
    "netherlands": {"lat": 52.1326, "lng": 5.2913, "country": "Netherlands"},
    "belgium": {"lat": 50.5039, "lng": 4.4699, "country": "Belgium"},
    "switzerland": {"lat": 46.8182, "lng": 8.2275, "country": "Switzerland"},
    "austria": {"lat": 47.5162, "lng": 14.5501, "country": "Austria"},
    "sweden": {"lat": 60.1282, "lng": 18.6435, "country": "Sweden"},
    "norway": {"lat": 60.4720, "lng": 8.4689, "country": "Norway"},
    "finland": {"lat": 61.9241, "lng": 25.7482, "country": "Finland"},
    "denmark": {"lat": 56.2639, "lng": 9.5018, "country": "Denmark"},
    "poland": {"lat": 51.9194, "lng": 19.1451, "country": "Poland"},
    "czech": {"lat": 49.8175, "lng": 15.4730, "country": "Czech Republic"},
    "slovakia": {"lat": 48.6690, "lng": 19.6990, "country": "Slovakia"},
    "hungary": {"lat": 47.1625, "lng": 19.5033, "country": "Hungary"},
    "romania": {"lat": 45.9432, "lng": 24.9668, "country": "Romania"},
    "bulgaria": {"lat": 42.7339, "lng": 25.4858, "country": "Bulgaria"},
    "serbia": {"lat": 44.0165, "lng": 21.0059, "country": "Serbia"},
    "croatia": {"lat": 45.1000, "lng": 15.2000, "country": "Croatia"},
    "greece": {"lat": 39.0742, "lng": 21.8243, "country": "Greece"},
    "ukraine": {"lat": 48.3794, "lng": 31.1656, "country": "Ukraine"},
    "belarus": {"lat": 53.7098, "lng": 27.9534, "country": "Belarus"},
    "russia": {"lat": 61.5240, "lng": 105.3188, "country": "Russia"},
    "estonia": {"lat": 58.5953, "lng": 25.0136, "country": "Estonia"},
    "latvia": {"lat": 56.8796, "lng": 24.6032, "country": "Latvia"},
    "lithuania": {"lat": 55.1694, "lng": 23.8813, "country": "Lithuania"},
    "moldova": {"lat": 47.4116, "lng": 28.3699, "country": "Moldova"},
    "albania": {"lat": 41.1533, "lng": 20.1683, "country": "Albania"},
    "bosnia": {"lat": 43.9159, "lng": 17.6791, "country": "Bosnia"},
    "slovenia": {"lat": 46.1512, "lng": 14.9955, "country": "Slovenia"},
    "north macedonia": {"lat": 41.6086, "lng": 21.7453, "country": "North Macedonia"},
    "montenegro": {"lat": 42.7087, "lng": 19.3744, "country": "Montenegro"},
    "kosovo": {"lat": 42.6026, "lng": 20.9030, "country": "Kosovo"},

    # Middle East
    "turkey": {"lat": 38.9637, "lng": 35.2433, "country": "Turkey"},
    "israel": {"lat": 31.0461, "lng": 34.8516, "country": "Israel"},
    "jordan": {"lat": 30.5852, "lng": 36.2384, "country": "Jordan"},
    "lebanon": {"lat": 33.8547, "lng": 35.8623, "country": "Lebanon"},
    "syria": {"lat": 34.8021, "lng": 38.9968, "country": "Syria"},
    "iraq": {"lat": 33.2232, "lng": 43.6793, "country": "Iraq"},
    "iran": {"lat": 32.4279, "lng": 53.6880, "country": "Iran"},
    "saudi arabia": {"lat": 23.8859, "lng": 45.0792, "country": "Saudi Arabia"},
    "yemen": {"lat": 15.5527, "lng": 48.5164, "country": "Yemen"},
    "oman": {"lat": 21.5126, "lng": 55.9233, "country": "Oman"},
    "uae": {"lat": 23.4241, "lng": 53.8478, "country": "UAE"},
    "qatar": {"lat": 25.3548, "lng": 51.1839, "country": "Qatar"},
    "kuwait": {"lat": 29.3117, "lng": 47.4818, "country": "Kuwait"},
    "afghanistan": {"lat": 33.9391, "lng": 67.7100, "country": "Afghanistan"},
    "pakistan": {"lat": 30.3753, "lng": 69.3451, "country": "Pakistan"},

    # Asia
    "india": {"lat": 20.5937, "lng": 78.9629, "country": "India"},
    "bangladesh": {"lat": 23.6850, "lng": 90.3563, "country": "Bangladesh"},
    "nepal": {"lat": 28.3949, "lng": 84.1240, "country": "Nepal"},
    "sri lanka": {"lat": 7.8731, "lng": 80.7718, "country": "Sri Lanka"},
    "myanmar": {"lat": 21.9162, "lng": 95.9560, "country": "Myanmar"},
    "thailand": {"lat": 15.8700, "lng": 100.9925, "country": "Thailand"},
    "vietnam": {"lat": 14.0583, "lng": 108.2772, "country": "Vietnam"},
    "cambodia": {"lat": 12.5657, "lng": 104.9910, "country": "Cambodia"},
    "laos": {"lat": 19.8563, "lng": 102.4955, "country": "Laos"},
    "malaysia": {"lat": 4.2105, "lng": 101.9758, "country": "Malaysia"},
    "singapore": {"lat": 1.3521, "lng": 103.8198, "country": "Singapore"},
    "indonesia": {"lat": -0.7893, "lng": 113.9213, "country": "Indonesia"},
    "philippines": {"lat": 12.8797, "lng": 121.7740, "country": "Philippines"},
    "china": {"lat": 35.8617, "lng": 104.1954, "country": "China"},
    "taiwan": {"lat": 23.6978, "lng": 120.9605, "country": "Taiwan"},
    "japan": {"lat": 36.2048, "lng": 138.2529, "country": "Japan"},
    "korea": {"lat": 35.9078, "lng": 127.7669, "country": "South Korea"},
    "south korea": {"lat": 35.9078, "lng": 127.7669, "country": "South Korea"},
    "north korea": {"lat": 40.3399, "lng": 127.5101, "country": "North Korea"},
    "mongolia": {"lat": 46.8625, "lng": 103.8467, "country": "Mongolia"},
    "kazakhstan": {"lat": 48.0196, "lng": 66.9237, "country": "Kazakhstan"},
    "uzbekistan": {"lat": 41.3775, "lng": 64.5853, "country": "Uzbekistan"},
    "turkmenistan": {"lat": 38.9697, "lng": 59.5563, "country": "Turkmenistan"},
    "kyrgyzstan": {"lat": 41.2044, "lng": 74.7661, "country": "Kyrgyzstan"},
    "tajikistan": {"lat": 38.8610, "lng": 71.2761, "country": "Tajikistan"},
    "azerbaijan": {"lat": 40.1431, "lng": 47.5769, "country": "Azerbaijan"},
    "armenia": {"lat": 40.0691, "lng": 45.0382, "country": "Armenia"},
    "georgia": {"lat": 42.3154, "lng": 43.3569, "country": "Georgia"},

    # Africa
    "nigeria": {"lat": 9.0820, "lng": 8.6753, "country": "Nigeria"},
    "ethiopia": {"lat": 9.1450, "lng": 40.4897, "country": "Ethiopia"},
    "kenya": {"lat": -0.0236, "lng": 37.9062, "country": "Kenya"},
    "tanzania": {"lat": -6.3690, "lng": 34.8888, "country": "Tanzania"},
    "uganda": {"lat": 1.3733, "lng": 32.2903, "country": "Uganda"},
    "rwanda": {"lat": -1.9403, "lng": 29.8739, "country": "Rwanda"},
    "south africa": {"lat": -30.5595, "lng": 22.9375, "country": "South Africa"},
    "zimbabwe": {"lat": -19.0154, "lng": 29.1549, "country": "Zimbabwe"},
    "mozambique": {"lat": -18.6657, "lng": 35.5296, "country": "Mozambique"},
    "zambia": {"lat": -13.1339, "lng": 27.8493, "country": "Zambia"},
    "angola": {"lat": -11.2027, "lng": 17.8739, "country": "Angola"},
    "democratic republic of congo": {"lat": -4.0383, "lng": 21.7587, "country": "DR Congo"},
    "congo": {"lat": -4.0383, "lng": 21.7587, "country": "DR Congo"},
    "cameroon": {"lat": 3.8480, "lng": 11.5021, "country": "Cameroon"},
    "ghana": {"lat": 7.9465, "lng": -1.0232, "country": "Ghana"},
    "ivory coast": {"lat": 7.5400, "lng": -5.5471, "country": "Ivory Coast"},
    "senegal": {"lat": 14.4974, "lng": -14.4524, "country": "Senegal"},
    "mali": {"lat": 17.5707, "lng": -3.9962, "country": "Mali"},
    "niger": {"lat": 17.6078, "lng": 8.0817, "country": "Niger"},
    "chad": {"lat": 15.4542, "lng": 18.7322, "country": "Chad"},
    "sudan": {"lat": 12.8628, "lng": 30.2176, "country": "Sudan"},
    "egypt": {"lat": 26.8206, "lng": 30.8025, "country": "Egypt"},
    "libya": {"lat": 26.3351, "lng": 17.2283, "country": "Libya"},
    "tunisia": {"lat": 33.8869, "lng": 9.5375, "country": "Tunisia"},
    "algeria": {"lat": 28.0339, "lng": 1.6596, "country": "Algeria"},
    "morocco": {"lat": 31.7917, "lng": -7.0926, "country": "Morocco"},
    "madagascar": {"lat": -18.7669, "lng": 46.8691, "country": "Madagascar"},
    "somalia": {"lat": 5.1521, "lng": 46.1996, "country": "Somalia"},

    # Oceania
    "australia": {"lat": -25.2744, "lng": 133.7751, "country": "Australia"},
    "new zealand": {"lat": -40.9006, "lng": 174.8860, "country": "New Zealand"},
    "papua new guinea": {"lat": -6.3150, "lng": 143.9555, "country": "Papua New Guinea"},

    # Special locations
    "atlantic": {"lat": 0.0, "lng": -25.0, "country": "Atlantic Ocean"},
    "hondius": {"lat": -10.0, "lng": -20.0, "country": "Atlantic Ocean"},
    "cruise": {"lat": -10.0, "lng": -20.0, "country": "Atlantic Ocean"},
    "cruise ship": {"lat": -10.0, "lng": -20.0, "country": "Atlantic Ocean"},
    "saint helena": {"lat": -15.9650, "lng": -5.7089, "country": "Saint Helena"},
    "canary": {"lat": 28.2916, "lng": -16.6291, "country": "Canary Islands"},
    "pacific": {"lat": 0.0, "lng": -160.0, "country": "Pacific Ocean"},
    "indian ocean": {"lat": -20.0, "lng": 80.0, "country": "Indian Ocean"},
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

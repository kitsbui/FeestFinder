import re, json, sys, urllib.parse, urllib.request, concurrent.futures as cf
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141 Safari/537.36"
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=20) as r: return r.read().decode('utf-8', 'ignore')
def search(q):
    s = get("https://www.youtube.com/results?search_query=" + urllib.parse.quote(q))
    m = re.search(r'var ytInitialData = (\{.*?\});</script>', s)
    d = json.loads(m.group(1)); out = []
    def walk(o):
        if isinstance(o, dict):
            if 'videoRenderer' in o:
                v = o['videoRenderer']
                out.append({'id': v['videoId'],
                    'title': ''.join(r.get('text','') for r in v.get('title',{}).get('runs',[])),
                    'channel': ''.join(r.get('text','') for r in v.get('ownerText',{}).get('runs',[])),
                    'badges': [b.get('metadataBadgeRenderer',{}).get('tooltip','') for b in v.get('ownerBadges',[])],
                    'len': v.get('lengthText',{}).get('simpleText','')})
            for x in o.values(): walk(x)
        elif isinstance(o, list):
            for x in o: walk(x)
    walk(d); return out
def details(vid):
    """The watch page's own facts: title, channel, the day it was published, its length. None when the page does not answer."""
    try:
        s = get(f"https://www.youtube.com/watch?v={vid}&hl=en")
    except Exception:
        return None
    def grab(key):
        m = re.search(r'"%s":"((?:[^"\\]|\\.)*)"' % key, s)
        return json.loads('"' + m.group(1) + '"') if m else None
    return {'id': vid, 'title': grab('title'), 'channel': grab('ownerChannelName'), 'published': grab('publishDate') or grab('uploadDate'),
            'seconds': int(grab('lengthSeconds') or 0), 'unlisted': grab('isUnlisted') == 'true'}
def oembed(vid):
    try:
        return json.loads(get(f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"))
    except Exception as e:
        return None
if __name__ == '__main__':
    if sys.argv[1] == 'details':
        # yt.py details <id> [<id>…]: the watch page's facts and whether oEmbed allows the embed.
        for vid in sys.argv[2:]:
            d = details(vid); o = oembed(vid)
            print(json.dumps({**(d or {'id': vid, 'error': 'no page'}), 'embeddable': bool(o), 'oembed_author': (o or {}).get('author_name')}, ensure_ascii=False))
        sys.exit(0)
    qs = json.load(open(sys.argv[1]))
    def one(q):
        try: return q, search(q)[:6]
        except Exception as e: return q, str(e)
    with cf.ThreadPoolExecutor(6) as ex:
        for q, res in ex.map(one, qs):
            print('##', q)
            if isinstance(res, str): print('  ERR', res); continue
            for r in res: print('  ', r['id'], '|', r['title'][:70], '|', r['channel'], '|', ','.join(b for b in r['badges'] if b), '|', r['len'])

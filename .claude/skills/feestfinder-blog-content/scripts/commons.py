import json, sys, urllib.parse, urllib.request, re, html
UA = "FeestFinderEditorial/1.0 (https://feestfinder.com; hello@feestfinder.com)"
def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, 'format': 'json'})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r: return json.loads(r.read())
def strip(s): return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', s or ''))).strip()
def search(q, n=8):
    d = api({'action': 'query', 'generator': 'search', 'gsrsearch': q + ' filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': n,
             'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1600})
    out = []
    for p in (d.get('query', {}).get('pages', {}) or {}).values():
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
        out.append({'file': p['title'], 'w': ii['width'], 'h': ii['height'], 'thumb': ii.get('thumburl'), 'page': ii['descriptionurl'],
                    'license': strip(m.get('LicenseShortName', {}).get('value')), 'artist': strip(m.get('Artist', {}).get('value'))[:80],
                    'desc': strip(m.get('ImageDescription', {}).get('value'))[:110]})
    return out
if __name__ == '__main__':
    for q in json.load(open(sys.argv[1])):
        print('##', q)
        try:
            for r in search(q):
                print('  ', f"{r['w']}x{r['h']}", '|', r['file'][5:80], '|', r['license'], '|', r['artist'][:40], '|', r['desc'][:80])
        except Exception as e: print('  ERR', e)

"""Checks English Wikipedia titles exist (and are not redirected somewhere unrelated): python3 wiki_titles.py "Jeff Mills" "Burial (musician)"."""
import sys, json, urllib.parse, urllib.request
for n in sys.argv[1:]:
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({'action': 'query', 'titles': n, 'redirects': 1, 'format': 'json'})
    d = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'FeestFinderEditorial/1.0 (hello@feestfinder.com)'}), timeout=20).read())
    pid, page = next(iter(d['query']['pages'].items()))
    print(n, '->', 'MISSING' if pid == '-1' else page['title'], [r['to'] for r in d['query'].get('redirects', [])])

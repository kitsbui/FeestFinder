"""Prints the HTTP status of every link given (one per line on stdin): cite only what answers 200.
Some publishers (Britannica, Red Bull, ask.audio) refuse scripts with 403; check those with WebFetch or leave them out."""
import sys, urllib.request, concurrent.futures as cf
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141 Safari/537.36"
def status(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=20) as r: return r.status
    except urllib.error.HTTPError as e: return e.code
    except Exception as e: return f"ERR {e}"
urls = [l.strip() for l in sys.stdin if l.strip()]
with cf.ThreadPoolExecutor(8) as ex:
    for u, s in zip(urls, ex.map(status, urls)): print(s, u)

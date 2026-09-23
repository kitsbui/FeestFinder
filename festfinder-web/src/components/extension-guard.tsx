/**
 * Keeps browser extensions from breaking hydration.
 *
 * Extensions (cursor trails, overlays, translators) add a <div> to <body> while the page
 * is still loading. React hydrates <body> by walking its children in order and skips
 * elements of a type it does not expect there — but it pairs a <div> it does expect with
 * the first <div> it meets. When that is the extension's, it reports a mismatch, throws
 * the server's HTML away, renders the page again from scratch and deletes the extension's
 * element on the way.
 *
 * Two halves make that impossible:
 *
 *  - The page itself sits in <ff-app> (see app/layout.tsx), a tag no extension inserts.
 *    The only <div>s the server puts straight into <body> are hidden ones: the one Next
 *    streams metadata into, and React's own streaming segments.
 *  - Until the page has hydrated, this script moves any other <div> added to <body> onto
 *    <html>, outside what React hydrates (browsers still render it there), and then puts it
 *    back where it was.
 */
export { ExtensionGuardRelease } from './extension-guard-release';

const GUARD = `(function () {
  var parked = [];
  var watching = [];
  function park(body, node) {
    if (node.nodeName !== 'DIV' || node.hasAttribute('hidden') || node.parentNode !== body) return;
    parked.push({ node: node, before: node.nextSibling, first: !node.previousSibling });
    document.documentElement.appendChild(node);
  }
  function guard(body) {
    // Anything added before this ran (another observer can get to <body> first).
    [].slice.call(body.children).forEach(function (node) { park(body, node); });
    var mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) park(body, added[j]);
      }
    });
    mo.observe(body, { childList: true });
    watching.push(mo);
  }
  if (document.body) guard(document.body);
  else {
    var wait = new MutationObserver(function () {
      if (!document.body) return;
      wait.disconnect();
      guard(document.body);
    });
    wait.observe(document.documentElement, { childList: true });
    watching.push(wait);
  }
  window.__ffHydrated = function () {
    watching.forEach(function (mo) { mo.disconnect(); });
    var body = document.body;
    for (var i = parked.length - 1; i >= 0; i--) {
      var p = parked[i];
      if (p.node.parentNode !== document.documentElement) continue;
      if (p.before && p.before.parentNode === body) body.insertBefore(p.node, p.before);
      else if (p.first) body.insertBefore(p.node, body.firstChild);
      else body.appendChild(p.node);
    }
    parked = [];
  };
})();`;

/** Goes in <head>: it has to be watching before <body> exists. */
export function ExtensionGuardScript() {
  return <script dangerouslySetInnerHTML={{ __html: GUARD }} />;
}

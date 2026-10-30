(function() {
  var REPO = 'liyuwriter/liyuwriter.github.io';
  var API = 'https://api.github.com/repos/' + REPO;
  var LABEL = 'pageview';
  var path = window.location.pathname;
  var countEl = document.getElementById('page-view-count');
  if (!countEl) return;

  var token = window.GITHUB_COUNTER_TOKEN || '';
  var sessionKey = 'pv:' + path;
  var cacheKey = 'pvc:' + path;
  var CACHE_TTL = 5 * 60 * 1000;

  function headers(isWrite) {
    var h = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    if (isWrite) h['Content-Type'] = 'application/json';
    return h;
  }

  function show(n) { countEl.textContent = n; }

  // 先用缓存显示，再从 API 刷新
  try {
    var cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < CACHE_TTL) show(cached.count);
  } catch(e) {}

  fetch(API + '/issues?labels=' + LABEL + '&per_page=100&state=open', { headers: headers() })
    .then(function(r) { return r.json(); })
    .then(function(issues) {
      var issue = null;
      for (var i = 0; i < issues.length; i++) {
        if (issues[i].title === path) { issue = issues[i]; break; }
      }

      if (issue) {
        var count = parseInt(issue.body) || 0;
        show(count);
        localStorage.setItem(cacheKey, JSON.stringify({ count: count, ts: Date.now() }));
        if (!sessionStorage.getItem(sessionKey) && token) increment(issue, count);
      } else if (token && !sessionStorage.getItem(sessionKey)) {
        createIssue(1);
      } else {
        show('-');
      }
    })
    .catch(function() {});

  function increment(issue, count) {
    count++;
    fetch(API + '/issues/' + issue.number, {
      method: 'PATCH',
      headers: headers(true),
      body: JSON.stringify({ body: String(count) })
    }).then(function(r) {
      if (r.ok) {
        show(count);
        localStorage.setItem(cacheKey, JSON.stringify({ count: count, ts: Date.now() }));
        sessionStorage.setItem(sessionKey, '1');
      }
    });
  }

  function createIssue(count) {
    fetch(API + '/issues', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ title: path, labels: [LABEL], body: String(count) })
    }).then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.number) {
        show(count);
        localStorage.setItem(cacheKey, JSON.stringify({ count: count, ts: Date.now() }));
        sessionStorage.setItem(sessionKey, '1');
      }
    });
  }
})();

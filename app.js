// app.js — shared behaviour. Progress lives in this browser's localStorage under one key,
// and can be exported/imported as JSON from the nav so it travels between devices.
(function () {
  const KEY = 'edupath.v1';
  const D = window.EDU;

  // ── state ──────────────────────────────────────────────────────────────────
  const blank = { items: {}, hours: [], decisions: [], grades: {} };
  let S = load();
  function load() {
    try { return Object.assign(structuredClone(blank), JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return structuredClone(blank); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function item(id) { return S.items[id] || (S.items[id] = { status: 'todo', note: '' }); }
  function setStatus(id, status) { item(id).status = status; if (status === 'done') item(id).doneOn = today(); save(); rerender(); }
  function setNote(id, note) { item(id).note = note; save(); }

  // ── dates ──────────────────────────────────────────────────────────────────
  const MS = 86400000;
  function today() { return new Date().toISOString().slice(0, 10); }
  function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function daysUntil(s) { const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((parse(s) - t) / MS); }
  function fmt(s) { return parse(s).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }); }
  function inWords(n) {
    if (n === 0) return 'today';
    const a = Math.abs(n), u = a >= 60 ? Math.round(a / 30) + ' mo' : a + ' d';
    return n < 0 ? u + ' ago' : 'in ' + u;
  }
  function isNow(start, end) { const t = today(); return t >= start && t <= end; }
  function isPast(end) { return today() > end; }

  // ── computed ───────────────────────────────────────────────────────────────
  function statusOf(id) { return item(id).status; }
  function gateStats(stage) {
    const g = stage.gates.filter(x => !x.optional);
    const done = g.filter(x => statusOf(x.id) === 'done').length;
    return { done, total: g.length, pct: g.length ? Math.round(100 * done / g.length) : 0 };
  }
  function currentStage() {
    for (const s of D.stages) { const st = gateStats(s); if (st.done < st.total) return s; }
    return D.stages[D.stages.length - 1];
  }
  function requisiteDone(r) {
    // a requisite tied to a course is done when the course is done; otherwise by its own status
    if (r.courseId) return statusOf(r.courseId) === 'done';
    return statusOf(r.id) === 'done';
  }
  function schoolReadiness(school) {
    const rs = D.requisites.filter(r => r.schools.includes(school));
    const done = rs.filter(requisiteDone).length;
    return { done, total: rs.length, pct: Math.round(100 * done / rs.length) };
  }
  function hoursTotal(filter) {
    return S.hours.filter(h => !filter || filter(h)).reduce((a, h) => a + (Number(h.hours) || 0), 0);
  }
  function nextActions(limit) {
    const all = [];
    D.stages.forEach(s => s.gates.forEach(g => all.push({ ...g, kind: 'gate', stage: s })));
    D.courses.forEach(c => all.push({ id: c.id, label: 'Register: ' + c.chosen, due: c.registerBy, kind: 'course', stage: null }));
    return all.filter(a => statusOf(a.id) !== 'done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, limit);
  }

  // ── rendering helpers ──────────────────────────────────────────────────────
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(k => k != null && n.append(k.nodeType ? k : document.createTextNode(k)));
    return n;
  }
  function statusControl(id) {
    const cur = statusOf(id);
    const b = (st, label) => el('button', { class: cur === st ? 'on-' + st : '', onclick: () => setStatus(id, st) }, label);
    return el('div', { class: 'status' }, b('todo', 'To do'), b('doing', 'In progress'), b('done', 'Done'));
  }
  function dueTag(due, optional) {
    if (!due) return null;
    const n = daysUntil(due);
    return el('span', { class: 'due' + (n < 0 ? ' late' : '') }, (optional ? 'optional · ' : '') + fmt(due) + ' · ' + inWords(n));
  }
  function noteBox(id, placeholder) {
    const t = el('textarea', { placeholder: placeholder || 'Evidence, dates, who to ask…' });
    t.value = item(id).note || '';
    t.addEventListener('input', () => setNote(id, t.value));
    return t;
  }
  function itemRow(id, title, sub, bodyKids, due, optional, noNote) {
    const st = statusOf(id);
    return el('div', { class: 'item ' + st },
      el('div', { class: 'item-head' },
        statusControl(id),
        el('div', {}, el('div', { class: 'item-title' }, title), sub ? el('div', { class: 'item-sub' }, sub) : null),
        dueTag(due, optional)),
      el('div', { class: 'item-body' }, ...bodyKids, noNote ? null : noteBox(id)));
  }
  function bar(pct, done) { return el('div', { class: 'bar' + (done ? ' done' : '') }, el('span', { style: 'width:' + pct + '%' })); }
  function tile(k, v, s, late) { return el('div', { class: 'tile' + (late ? ' late' : '') }, el('div', { class: 'k' }, k), el('div', { class: 'v' }, v), s ? el('div', { class: 's' }, s) : null); }

  // ── nav ────────────────────────────────────────────────────────────────────
  const PAGES = [
    ['index.html', 'Where I stand'], ['requisites.html', 'Requisites'], ['courses.html', 'Courses'],
    ['parcels.html', 'Parcels'], ['calendar.html', 'Calendar'], ['gmh-track.html', 'GMH track'], ['backups.html', 'Backups'], ['log.html', 'Log'],
  ];
  function renderNav() {
    const here = location.pathname.split('/').pop() || 'index.html';
    const nav = el('nav', { class: 'site' },
      PAGES.map(([h, t]) => el('a', { href: h, class: h === here ? 'active' : '' }, t)),
      el('div', { class: 'spacer' }),
      el('div', { class: 'tools' },
        el('button', { onclick: exportState }, 'Export progress'),
        el('button', { onclick: importState }, 'Import')));
    document.body.prepend(nav);
  }
  function exportState() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'education-path-progress-' + today() + '.json' });
    document.body.append(a); a.click(); a.remove();
  }
  function importState() {
    const i = el('input', { type: 'file', accept: 'application/json' });
    i.addEventListener('change', () => {
      const f = i.files[0]; if (!f) return;
      f.text().then(t => { try { S = Object.assign(structuredClone(blank), JSON.parse(t)); save(); rerender(); } catch (e) { alert('That file is not a progress export.'); } });
    });
    i.click();
  }

  // ── pages ──────────────────────────────────────────────────────────────────
  const R = {};

  R.index = function (root) {
    const cur = currentStage();
    const dl = D.deadlines.filter(d => daysUntil(d.date) >= 0)[0];
    const ubc = schoolReadiness('ubc'), sfu = schoolReadiness('sfu');
    const hrs = hoursTotal(h => !/Research|Other/.test(h.source));
    root.append(
      el('div', { class: 'tiles' },
        tile('Today', fmt(today()), 'data verified ' + fmt(D.meta.verified)),
        tile('Current stage', cur.n + ' · ' + cur.name, gateStats(cur).done + ' of ' + gateStats(cur).total + ' gates met'),
        tile('To 1 Dec 2029', inWords(daysUntil('2029-12-01')).replace('in ', ''), 'MA applications due'),
        tile('Next fixed date', dl ? fmt(dl.date) : '—', dl ? dl.label : ''),
        tile('UBC MA readiness', ubc.pct + '%', ubc.done + ' of ' + ubc.total + ' requisites'),
        tile('SFU MA readiness', sfu.pct + '%', sfu.done + ' of ' + sfu.total + ' requisites'),
        tile('Helping hours', hrs + ' / ' + D.meta.helpingHoursTarget, 'logged on the Log page', false),
        (function(){ const p = D.parcels.find(p => isNow(p.start, p.end)) || D.parcels.find(p => !isPast(p.end)); if (!p) return null; const d = p.items.filter((_, i) => statusOf(p.id + '-' + i) === 'done').length; const t = tile('This quarter', d + ' / ' + p.items.length, p.theme); t.append(bar(Math.round(100*d/p.items.length))); return t; })()));

    // next actions
    const sec = el('div', { class: 'sec' },
      el('div', { class: 'sec-eye' }, 'Act now'),
      el('div', { class: 'sec-title' }, 'The next ', el('em', {}, 'seven'), ' things, by date'),
      el('div', { class: 'sec-desc' }, 'Every open gate and course registration across the path, sorted by its date. Mark things done here or on their own page.'));
    nextActions(7).forEach(a => sec.append(itemRow(a.id, a.label, a.stage ? 'Stage ' + a.stage.n + ' · ' + a.stage.name : 'Course registration', [], a.due, a.optional, true)));
    root.append(sec);

    // stage ladder
    const st = el('div', { class: 'sec' },
      el('div', { class: 'sec-eye' }, 'The whole path'),
      el('div', { class: 'sec-title' }, 'Six stages, each closed by a ', el('em', {}, 'condition'), ', not a year'));
    D.stages.forEach(s => {
      const g = gateStats(s);
      const row = el('div', { class: 'item' + (g.done === g.total ? ' done' : '') },
        el('div', { class: 'item-head', style: 'grid-template-columns: 3rem 1fr auto; cursor:pointer', onclick: () => body.style.display = body.style.display === 'none' ? 'block' : 'none' },
          el('div', { style: 'font-size:1.5rem;font-weight:300;color:var(--accent);line-height:1' }, s.n),
          el('div', {}, el('div', { class: 'item-title' }, s.name, s.id === cur.id ? el('span', { class: 'tag now', style: 'margin-left:.6rem' }, 'You are here') : null),
            el('div', { class: 'item-sub' }, s.window + ' · ' + s.closes), bar(g.pct, g.done === g.total)),
          el('span', { class: 'due' }, g.done + ' / ' + g.total)));
      const body = el('div', { class: 'item-body', style: 'display:' + (s.id === cur.id ? 'block' : 'none') + ';padding-left:1.1rem' });
      s.gates.forEach(x => body.append(itemRow(x.id, x.label, null, [], x.due, x.optional)));
      row.append(body); st.append(row);
    });
    root.append(st);
  };

  R.requisites = function (root) {
    const schools = [['ubc', 'UBC MA'], ['sfu', 'SFU MA'], ['phd', 'UBC PhD']];
    root.append(el('div', { class: 'tiles' }, schools.map(([k, n]) => { const r = schoolReadiness(k); const t = tile(n, r.pct + '%', r.done + ' of ' + r.total + ' requisites'); t.append(bar(r.pct, r.pct === 100)); return t; })));
    const sec = el('div', { class: 'sec' },
      el('div', { class: 'sec-eye' }, 'Requisites'),
      el('div', { class: 'sec-title' }, 'What each program reads, what is ', el('em', {}, 'held'), ', what is still to earn'),
      el('div', { class: 'sec-desc' }, 'A requisite tied to a course turns done when that course is marked done on the Courses page. The others you mark here, with the evidence in the note.'));
    D.requisites.forEach(r => {
      const tags = el('div', { style: 'display:flex;gap:.3rem;margin-bottom:.5rem' }, r.schools.map(s => el('span', { class: 'tag ' + s }, s.toUpperCase())));
      const body = [tags, el('dl', {},
        el('dt', {}, 'UBC MA'), el('dd', {}, r.ubc), el('dt', {}, 'SFU MA'), el('dd', {}, r.sfu), el('dt', {}, 'UBC PhD'), el('dd', {}, r.phd),
        el('dt', {}, 'Held'), el('dd', {}, r.held), el('dt', {}, 'To earn'), el('dd', {}, r.earn))];
      if (r.courseId) {
        const c = D.courses.find(c => c.id === r.courseId);
        const row = el('div', { class: 'item ' + statusOf(c.id) },
          el('div', { class: 'item-head' }, statusControl(c.id), el('div', {}, el('div', { class: 'item-title' }, r.label), el('div', { class: 'item-sub' }, 'Satisfied by course ' + c.n + ': ' + c.chosen + ' (' + c.term + ')')), dueTag(c.end)),
          el('div', { class: 'item-body' }, ...body, noteBox(r.id)));
        sec.append(row);
      } else sec.append(itemRow(r.id, r.label, r.earn, body));
    });
    root.append(sec);
  };

  R.courses = function (root) {
    const done = D.courses.filter(c => statusOf(c.id) === 'done').length;
    root.append(el('div', { class: 'tiles' },
      tile('Courses graded', done + ' / 6', 'all six by 31 Dec 2029'),
      tile('In progress', D.courses.filter(c => statusOf(c.id) === 'doing').length, ''),
      tile('Hard deadline', fmt('2029-12-31'), inWords(daysUntil('2029-12-31')))));
    const sec = el('div', { class: 'sec' },
      el('div', { class: 'sec-eye' }, 'One per term'),
      el('div', { class: 'sec-title' }, 'Six courses, chosen for ', el('em', {}, 'interest'), ', serving both schools'),
      el('div', { class: 'sec-desc' }, 'Record the grade and tick "outline kept" the day you enrol: UBC asks for outlines of any course not on its table. A course here outranks a Leeds module when they collide.'));
    D.courses.forEach(c => {
      const g = el('input', { type: 'text', placeholder: 'Grade' , style: 'width:6rem;margin-right:.6rem' }); g.value = S.grades[c.id] || '';
      g.addEventListener('input', () => { S.grades[c.id] = g.value; save(); });
      const o = el('input', { type: 'checkbox' }); o.checked = !!item(c.id).outline;
      o.addEventListener('change', () => { item(c.id).outline = o.checked; save(); });
      const body = [el('dl', {},
        el('dt', {}, 'Requisite'), el('dd', {}, c.requisite),
        el('dt', {}, 'Why this one'), el('dd', {}, c.why),
        el('dt', {}, 'Fallback'), el('dd', {}, c.fallback),
        el('dt', {}, 'Register'), el('dd', {}, c.register + ' — by ' + fmt(c.registerBy)),
        el('dt', {}, 'Page'), el('dd', {}, el('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.url.replace(/^https?:\/\//, '').slice(0, 60) + '…')),
        el('dt', {}, 'Record'), el('dd', {}, g, el('label', { style: 'font-size:.8rem' }, o, ' outline kept')))];
      const tag = isNow(c.start, c.end) ? el('span', { class: 'tag now' }, 'This term') : null;
      const row = itemRow(c.id, c.n + ' · ' + c.chosen, c.term + ' — ' + c.requisite, body, c.registerBy);
      if (tag) row.querySelector('.item-title').append(' ', tag);
      sec.append(row);
    });
    root.append(sec);
  };

  R.calendar = function (root) {
    const strip = el('div', { class: 'strip' }), labels = el('div', { class: 'strip-labels' });
    D.calendar.forEach(t => {
      strip.append(el('div', { class: 'cell' + (isNow(t.start, t.end) ? ' here' : isPast(t.end) ? ' past' : t.clear ? ' clear' : ''), title: t.term }));
      labels.append(el('div', {}, t.term));
    });
    root.append(el('div', { class: 'sec' },
      el('div', { class: 'sec-eye' }, 'Oct 2026 → Dec 2029'),
      el('div', { class: 'sec-title' }, 'Term by term, with ', el('em', {}, 'you are here'), ' marked'),
      strip, labels));
    const tbl = el('table', {}, el('thead', {}, el('tr', {}, ['Term', 'Prerequisite course', 'Leeds MSc', 'Research & hours', 'GMH track', 'Fixed dates'].map(h => el('th', {}, h)))));
    const tb = el('tbody');
    D.calendar.forEach(t => tb.append(el('tr', { class: (isNow(t.start, t.end) ? 'here' : '') + (t.clear ? ' clear' : '') + (isPast(t.end) ? ' past' : '') },
      [t.term, t.course, t.leeds, t.research, t.gmh, t.fixed].map(v => el('td', {}, v)))));
    tbl.append(tb); root.append(el('div', { class: 'sec' }, tbl));
    root.append(el('p', { class: 'note', style: 'margin-top:1rem' }, 'If the Leeds start moves to March 2027, module 1 lands on the statistics term; take statistics in autumn 2026 through Athabasca\'s any-month start and leave the rest unchanged.'));

    const dls = el('ul', { class: 'dl' });
    D.deadlines.forEach(d => { const n = daysUntil(d.date); dls.append(el('li', { class: n < 0 ? 'passed' : '' },
      el('span', { class: 'd' }, fmt(d.date)), el('span', { class: 'in' + (n < 0 ? ' late' : n <= 45 ? ' soon' : '') }, inWords(n)),
      el('span', {}, d.label + (d.verify ? ' ' : ''), d.verify ? el('span', { class: 'tag' }, 'verify') : null, ' ', el('span', { class: 'due' }, d.who)))); });
    root.append(el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'Fixed external dates'), el('div', { class: 'sec-title' }, 'The dates that belong to ', el('em', {}, 'someone else')), dls));
  };

  R.gmh = function (root) {
    const g2 = item('g2');
    const ex = g2.examDate ? daysUntil(addYears(g2.examDate, 3)) : null;
    root.append(el('div', { class: 'tiles' },
      tile('Rungs done', D.gmh.filter(g => statusOf(g.id) === 'done').length + ' / 5', 'optional, stackable'),
      tile('GHM202 transfer clock', g2.examDate ? fmt(addYears(g2.examDate, 3)) : '—', g2.examDate ? inWords(ex) + ' · 3 years from assessment' : 'set the exam date on rung 2', ex !== null && ex < 0)));
    const ul = el('ul', { class: 'ladder' });
    D.gmh.forEach(g => {
      const li = el('li', {}, el('div', { class: 'r' }, g.rung),
        el('div', {}, el('div', { style: 'display:flex;justify-content:space-between;gap:1rem;align-items:start;flex-wrap:wrap' }, el('div', { class: 'n' }, g.name), statusControl(g.id)),
          el('div', { class: 'w' }, g.what),
          el('dl', {}, el('dt', {}, 'Credits'), el('dd', {}, g.credits), el('dt', {}, 'Delivery'), el('dd', {}, g.delivery), el('dt', {}, 'When'), el('dd', {}, g.when), el('dt', {}, 'Cost'), el('dd', {}, g.cost), el('dt', {}, 'Stacks to'), el('dd', {}, g.stacks), el('dt', {}, 'Page'), el('dd', {}, el('a', { href: g.url, target: '_blank', rel: 'noopener' }, g.url.replace(/^https?:\/\//, '').slice(0, 56) + '…'))),
          noteBox(g.id)));
      if (g.id === 'g2') {
        const d = el('input', { type: 'date', style: 'width:auto;margin-top:.5rem' }); d.value = g2.examDate || '';
        d.addEventListener('change', () => { item('g2').examDate = d.value; save(); rerender(); });
        li.querySelector('dl').append(el('dt', {}, 'Exam date'), el('dd', {}, d, el('span', { class: 'note' }, ' — starts the three-year transfer clock')));
      }
      ul.append(li);
    });
    root.append(el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'The ladder'), el('div', { class: 'sec-title' }, 'Five rungs; climb one only when it serves a ', el('em', {}, 'dated application')), ul));
    root.append(el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'Decision rules'), el('ul', { class: 'list' }, D.gmhRules.map(r => el('li', {}, r))), el('p', { class: 'note', style: 'margin-top:1rem' }, D.gmhClosed)));
  };
  function addYears(s, n) { const d = parse(s); d.setFullYear(d.getFullYear() + n); return d.toISOString().slice(0, 10); }

  R.log = function (root) {
    const crisis = hoursTotal(h => /Crisis line — (supervised|service)/.test(h.source));
    const helping = hoursTotal(h => !/Research|Other|training/.test(h.source));
    const ra = hoursTotal(h => /Research/.test(h.source));
    root.append(el('div', { class: 'tiles' },
      tile('Helping hours', helping + ' / ' + D.meta.helpingHoursTarget, 'UBC floor 450 · SFU 400'),
      tile('Crisis-line hours', crisis + ' / 282', '32 supervised + 250 service'),
      tile('Research hours', ra, 'lab / RA'),
      tile('Decisions logged', S.decisions.length, 'one line each, dated')));

    // hours form
    const f = el('form', { class: 'row' });
    const date = el('input', { type: 'date', value: today() }), src = el('select', {}, D.hoursSources.map(s => el('option', {}, s))), hrs = el('input', { type: 'number', step: '0.5', min: '0', placeholder: '4' });
    const note = el('input', { type: 'text', placeholder: 'One line of reflection — what the shift or session taught' });
    f.append(el('div', {}, el('label', {}, 'Date'), date), el('div', {}, el('label', {}, 'Source'), src), el('div', {}, el('label', {}, 'Hours'), hrs), el('button', { class: 'btn', type: 'submit' }, 'Add'));
    f.append(el('div', { style: 'grid-column:1/-1' }, el('label', {}, 'Reflection'), note));
    f.addEventListener('submit', e => { e.preventDefault(); if (!hrs.value) return; S.hours.push({ date: date.value, source: src.value, hours: Number(hrs.value), note: note.value }); save(); rerender(); });
    const hsec = el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'Hours'), el('div', { class: 'sec-title' }, 'Every hour, with a line of ', el('em', {}, 'reflection')), el('div', { class: 'sec-desc' }, 'Mirrors UBC\'s Para-Counselling Experience Chart so the chart in November 2029 is an export, not a reconstruction. Export from the nav to keep a copy.'), f);
    if (S.hours.length) {
      const t = el('table', {}, el('thead', {}, el('tr', {}, ['Date', 'Source', 'Hours', 'Reflection', ''].map(h => el('th', {}, h)))));
      const tb = el('tbody');
      [...S.hours].sort((a, b) => b.date.localeCompare(a.date)).forEach(h => tb.append(el('tr', {}, el('td', {}, h.date), el('td', {}, h.source), el('td', {}, h.hours), el('td', {}, h.note), el('td', {}, el('button', { class: 'del', onclick: () => { S.hours.splice(S.hours.indexOf(h), 1); save(); rerender(); } }, 'remove')))));
      t.append(tb); hsec.append(t);
    }
    root.append(hsec);

    // decisions
    const df = el('form', { class: 'row wide' });
    const dd = el('input', { type: 'date', value: today() }), dt = el('input', { type: 'text', placeholder: 'What was chosen, what was rejected, and why' });
    df.append(el('div', {}, el('label', {}, 'Date'), dd), el('div', {}, el('label', {}, 'Decision'), dt), el('button', { class: 'btn', type: 'submit' }, 'Add'));
    df.addEventListener('submit', e => { e.preventDefault(); if (!dt.value.trim()) return; S.decisions.push({ date: dd.value, text: dt.value.trim() }); save(); rerender(); });
    const dsec = el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'Decision log'), el('div', { class: 'sec-title' }, 'One line per decision — it becomes the ', el('em', {}, 'methods section'), ' later'), df);
    if (S.decisions.length) {
      const ul = el('ul', { class: 'dl' });
      [...S.decisions].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => ul.append(el('li', {}, el('span', { class: 'd' }, d.date), el('span', {}, ''), el('span', {}, d.text, ' ', el('button', { class: 'del', onclick: () => { S.decisions.splice(S.decisions.indexOf(d), 1); save(); rerender(); } }, 'remove')))));
      dsec.append(ul);
    }
    root.append(dsec);
  };

  R.backups = function (root) {
    const gateOf = id => { for (const s of D.stages) { const g = s.gates.find(x => x.id === id); if (g) return { g, s }; } return null; };
    const live = D.backups.filter(b => b.gate && statusOf(b.gate) !== 'done').length;
    root.append(el('div', { class: 'tiles' },
      tile('Bottlenecks', D.backups.length, 'in the order they are met'),
      tile('Still ahead', live, 'gate not yet met'),
      tile('Backups activated', D.backups.filter(b => statusOf(b.id) === 'doing').length, 'marked In progress below')));
    const sec = el('div', { class: 'sec' },
      el('div', { class: 'sec-eye' }, 'Each gate, with its exits'),
      el('div', { class: 'sec-title' }, 'What still ', el('em', {}, 'contributes'), ' if a gate stays shut'),
      el('div', { class: 'sec-desc' }, 'Status here means the bottleneck itself: To do = not yet reached; In progress = a backup is in use; Done = passed. The linked gate\'s own status shows on the right. Items marked verify have not been confirmed against a program page.'));
    D.backups.forEach(b => {
      const gs = b.gate ? gateOf(b.gate) : null;
      const gateTag = gs ? el('span', { class: 'tag ' + (statusOf(b.gate) === 'done' ? 'now' : '') }, 'Gate: ' + (statusOf(b.gate) === 'done' ? 'met' : statusOf(b.gate) === 'doing' ? 'in progress' : 'open')) : el('span', { class: 'tag opt' }, 'No single gate');
      const body = [el('dl', {},
        el('dt', {}, 'Primary'), el('dd', {}, b.primary),
        el('dt', {}, 'Backups'), el('dd', {}, el('ol', { class: 'list', style: 'padding-left:1.1rem' }, b.backups.map(x => el('li', {}, x)))),
        el('dt', {}, 'Still contributes'), el('dd', {}, b.contributes),
        gs ? el('dt', {}, 'Linked gate') : null, gs ? el('dd', {}, 'Stage ' + gs.s.n + ' · ' + gs.g.label) : null)];
      const row = itemRow(b.id, b.order + ' · ' + b.title, b.when, body);
      const t = row.querySelector('.item-title'); t.append(' ', gateTag); if (b.verify) t.append(' ', el('span', { class: 'tag' }, 'verify'));
      sec.append(row);
    });
    root.append(sec);
  };

  R.parcels = function (root) {
    const pid = (p, i) => p.id + '-' + i;
    const stats = p => { const done = p.items.filter((_, i) => statusOf(pid(p, i)) === 'done').length; return { done, total: p.items.length, pct: Math.round(100 * done / p.items.length) }; };
    const cur = D.parcels.find(p => isNow(p.start, p.end)) || D.parcels.find(p => !isPast(p.end)) || D.parcels[D.parcels.length - 1];
    const cs = stats(cur);
    root.append(el('div', { class: 'tiles' },
      tile('This quarter', cur.q, cur.theme),
      tile('Parcel progress', cs.done + ' / ' + cs.total, cs.pct + '% of items'),
      tile('Quarters closed', D.parcels.filter(p => statusOf(p.id) === 'done').length + ' / 13', 'mark a quarter closed when its condition is met'),
      tile('Days left in quarter', Math.max(0, daysUntil(cur.end)), 'review on the last Sunday')));

    const rh = el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'Under every quarter'), el('div', { class: 'sec-title' }, 'The standing ', el('em', {}, 'rhythm')),
      el('ul', { class: 'list' }, D.standingRhythm.map(r => el('li', {}, r))));
    root.append(rh);

    const sec = el('div', { class: 'sec' }, el('div', { class: 'sec-eye' }, 'Thirteen parcels'),
      el('div', { class: 'sec-title' }, 'One theme a quarter, closed on a ', el('em', {}, 'condition')),
      el('div', { class: 'sec-desc' }, 'Tick items as they finish; the quarter\'s own status is yours to set when the closing condition is true. If a quarter runs long, the next starts late — only 1 and 31 December 2029 are fixed.'));
    D.parcels.forEach(p => {
      const st = stats(p), here = p.id === cur.id, past = isPast(p.end) && statusOf(p.id) !== 'done';
      const body = el('div', { class: 'item-body', style: 'display:' + (here ? 'block' : 'none') + ';padding-left:1.1rem' });
      p.items.forEach((t, i) => {
        const id = pid(p, i), cb = el('input', { type: 'checkbox', style: 'margin-right:.6rem' }); cb.checked = statusOf(id) === 'done';
        cb.addEventListener('change', () => { item(id).status = cb.checked ? 'done' : 'todo'; save(); rerender(); });
        body.append(el('label', { style: 'display:block;padding:.35rem 0;border-bottom:1px solid var(--line);font-size:.92rem;color:' + (cb.checked ? 'var(--faint)' : 'var(--ink)') + (cb.checked ? ';text-decoration:line-through' : '') }, cb, t));
      });
      body.append(el('dl', { style: 'margin-top:.8rem' }, el('dt', {}, 'Closed when'), el('dd', {}, p.closed)), noteBox(p.id, 'Review note for this quarter'));
      const row = el('div', { class: 'item ' + statusOf(p.id) },
        el('div', { class: 'item-head', style: 'cursor:pointer', onclick: e => { if (e.target.closest('.status')) return; body.style.display = body.style.display === 'none' ? 'block' : 'none'; } },
          statusControl(p.id),
          el('div', {}, el('div', { class: 'item-title' }, p.q + ' · ' + p.theme, here ? el('span', { class: 'tag now', style: 'margin-left:.6rem' }, 'This quarter') : null, past ? el('span', { class: 'tag late', style: 'margin-left:.6rem' }, 'Ran long') : null),
            el('div', { class: 'item-sub' }, st.done + ' of ' + st.total + ' items · ' + p.closed), bar(st.pct, statusOf(p.id) === 'done')),
          el('span', { class: 'due' }, fmt(p.end))),
        body);
      sec.append(row);
    });
    root.append(sec);
  };

  // ── boot ───────────────────────────────────────────────────────────────────
  function rerender() {
    const root = document.getElementById('app'); if (!root) return;
    const y = window.scrollY; root.innerHTML = '';
    (R[document.body.dataset.page] || (() => {}))(root);
    window.scrollTo(0, y);
  }
  document.addEventListener('DOMContentLoaded', () => { renderNav(); rerender(); });
  window.EDUAPP = { state: () => S, rerender };
})();

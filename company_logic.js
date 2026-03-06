// ── COMPANY ACTIVITY LOG ──────────────────────────────────────────────────────
if (!window._compLog) window._compLog = [];

function renderCompany() {
    const sessions = [];
    for (let i = 1; i <= 25; i++) sessions.push(i);
    const times = [
        "10:00 AM \u2013 11:00 AM",
        "11:00 AM \u2013 12:00 PM",
        "12:00 PM \u2013 1:00 PM",
        "2:00 PM \u2013 3:00 PM",
        "3:00 PM \u2013 4:00 PM"
    ];
    const sessionLists = {};
    sessions.forEach(n => {
        sessionLists[n] = RAW.filter(s => {
            const sc = s.schedule[n - 1];
            return sc && sc.company === CUR;
        });
    });
    let present = 0, absent = 0, pending = 0;
    let selected = 0, rejected = 0, nextRound = 0, noResult = 0;
    sessions.forEach(n => sessionLists[n].forEach(s => {
        const sc = s.schedule[n - 1];
        if (sc) {
            if (sc.status === 'selection') present++;
            else if (sc.status === 'rejected') absent++;
            else pending++;
            if (sc.result === 'selected') selected++;
            else if (sc.result === 'rejected') rejected++;
            else if (sc.result === 'next_round') nextRound++;
            else noResult++;
        }
    }));
    const totalStudents = sessions.reduce((a, n) => a + sessionLists[n].length, 0);
    let defaultTab = 1;
    for (const n of sessions) { if (sessionLists[n].length > 0) { defaultTab = n; break; } }

    const room = ROOM_DATA[CUR] || '\u2014';

    let h = "";
    h += "<div style='display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px'>";
    h += "<div><div style='font-size:18px;font-weight:700;color:var(--tx)'>" + CUR + "</div>";
    h += "<div style='font-size:10px;color:var(--mut);margin-top:2px'>Company Dashboard &middot; Placement Drive 2026</div>";
    h += "<div style='display:inline-flex;align-items:center;gap:4px;margin-top:6px;padding:4px 12px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:6px;font-size:11px;color:var(--cyn);font-weight:600'>\uD83D\uDCCD Room: " + room + "</div>";
    h += "</div>";
    h += "<div style='display:flex;gap:8px'>";
    h += "<button class='btn btp' onclick=\"dlCompPDF()\">&#128196; Export PDF</button>";
    h += "<button class='btn btg' onclick=\"dlCompCSV()\">&#128196; Export CSV</button>";
    h += "</div></div>";

    // Attendance stats
    h += "<div style='font-size:9px;font-weight:700;color:var(--mut);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px'>ATTENDANCE</div>";
    h += "<div class='sg admin-stats' style='grid-template-columns:repeat(4,1fr);margin-bottom:14px'>";
    h += "<div class='sc si'><div class='sl'>TOTAL</div><div class='sv'>" + totalStudents + "</div></div>";
    h += "<div class='sc sg2'><div class='sl'>PRESENT</div><div class='sv'>" + present + "</div></div>";
    h += "<div class='sc sr'><div class='sl'>ABSENT</div><div class='sv'>" + absent + "</div></div>";
    h += "<div class='sc sa'><div class='sl'>PENDING</div><div class='sv'>" + pending + "</div></div></div>";

    // Selection result stats
    h += "<div style='font-size:9px;font-weight:700;color:var(--mut);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px'>SELECTION RESULTS</div>";
    h += "<div class='sg admin-stats' style='grid-template-columns:repeat(4,1fr);margin-bottom:20px'>";
    h += "<div class='sc' style='border-left:2px solid var(--grn)'><div class='sl'>SELECTED</div><div class='sv' style='color:var(--grn)'>" + selected + "</div></div>";
    h += "<div class='sc' style='border-left:2px solid var(--red)'><div class='sl'>REJECTED</div><div class='sv' style='color:var(--red)'>" + rejected + "</div></div>";
    h += "<div class='sc' style='border-left:2px solid var(--amb)'><div class='sl'>NEXT ROUND</div><div class='sv' style='color:var(--amb)'>" + nextRound + "</div></div>";
    h += "<div class='sc' style='border-left:2px solid var(--mut)'><div class='sl'>NO DECISION</div><div class='sv' style='color:var(--mut)'>" + noResult + "</div></div></div>";

    h += "<div class='card'>";
    h += "<div style='display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px'>";
    h += "<div><div style='font-size:13px;font-weight:700;color:var(--tx)'>Student Roster</div>";
    h += "<div style='font-size:9px;color:var(--mut)'>Select session &rarr; mark attendance &amp; result &rarr; add remarks</div></div>";
    h += "<div id='comp-session-time' style='font-size:10px;color:var(--mut)'>" + (times[defaultTab - 1] || 'TBD') + "</div></div>";

    h += "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;max-height:120px;overflow-y:auto;padding:4px'>";
    sessions.forEach(n => {
        const cnt = sessionLists[n].length;
        const baseStyle = "cursor:pointer;padding:4px 13px;border-radius:20px;font-size:10px;font-weight:600;border:1px solid var(--bd);";
        const onStyle = "background:var(--ind);color:#fff;border-color:var(--ind)";
        const offStyle = "background:transparent;color:var(--mut)";
        const s = n === defaultTab ? onStyle : offStyle;
        h += "<div onclick='switchCompSession(" + n + ")' id='cst-" + n + "' style='" + baseStyle + s + "'>S" + n + " (" + cnt + ")</div>";
    });
    h += "</div>";
    h += "<div id='comp-roster-body'></div></div>";

    // Activity log section
    h += "<div class='card' style='margin-top:16px'>";
    h += "<div class='ctit'><div class='dot'></div>MY ACTIVITY LOG</div>";
    h += "<div id='comp-activity-log'></div></div>";

    document.getElementById('vc').innerHTML = h;
    window._compSL = sessionLists;
    renderCompanyRoster(defaultTab);
    renderActivityLog();
}

function switchCompSession(n) {
    const times = [
        "10:00 AM \u2013 11:00 AM",
        "11:00 AM \u2013 12:00 PM",
        "12:00 PM \u2013 1:00 PM",
        "2:00 PM \u2013 3:00 PM",
        "3:00 PM \u2013 4:00 PM"
    ];
    for (let x = 1; x <= 25; x++) {
        const el = document.getElementById('cst-' + x);
        if (el) {
            if (x === n) { el.style.background = 'var(--ind)'; el.style.color = '#fff'; el.style.borderColor = 'var(--ind)'; }
            else { el.style.background = 'transparent'; el.style.color = 'var(--mut)'; el.style.borderColor = 'var(--bd)'; }
        }
    }
    const timeEl = document.getElementById('comp-session-time');
    if (timeEl) timeEl.textContent = times[n - 1] || 'TBD';
    renderCompanyRoster(n);
}

function renderCompanyRoster(n) {
    if (!window._compSL) {
        window._compSL = {};
        for (let sn = 1; sn <= 25; sn++) {
            window._compSL[sn] = RAW.filter(s => {
                const sc = s.schedule[sn - 1];
                return sc && sc.company === CUR;
            });
        }
    }
    const list = window._compSL[n] || [];
    const room = ROOM_DATA[CUR] || '\u2014';
    let h = "<div class='tw'><table><thead><tr><th>#</th><th>STUDENT</th><th>BRANCH</th><th>CGPA</th><th>ROOM</th><th>CV</th><th>CHECK-IN</th><th>RESULT</th><th>REMARKS</th><th></th></tr></thead><tbody>";
    if (list.length === 0) {
        h += "<tr><td colspan='10' style='text-align:center;padding:20px;color:var(--mut);font-size:11px'>No students allocated for this session</td></tr>";
    } else {
        list.forEach((s, idx) => {
            const sc = s.schedule[n - 1];
            const safeUsn = s.usn.replace(/[^a-z0-9]/gi, '_');
            const cvLink = s.resume
                ? "<a href='" + s.resume + "' target='_blank' style='color:var(--ind);font-size:14px' title='View CV'>&#128196;</a>"
                : "<span style='color:var(--mut)'>&#8212;</span>";
            const cgpa = s.cgpa || "&#8212;";
            const curStatus = sc ? sc.status : 'pending';
            const curResult = sc ? (sc.result || '') : '';
            const curRemark = sc ? (sc.remark || '') : '';
            h += "<tr>";
            h += "<td style='color:var(--mut);font-size:11px'>" + (idx + 1) + "</td>";
            h += "<td><div style='font-weight:700;font-size:12px;color:var(--tx);text-transform:uppercase'>" + s.name + "</div><div style='font-size:9px;color:var(--mut)'>" + s.usn + "</div></td>";
            h += "<td style='font-size:9px;color:var(--mut);max-width:130px'>" + (s.branch || '&#8212;') + "</td>";
            h += "<td style='font-size:11px;font-weight:600;color:var(--tx)'>" + cgpa + "</td>";
            h += "<td style='font-size:10px;color:var(--cyn);font-weight:600'>" + room + "</td>";
            h += "<td style='text-align:center'>" + cvLink + "</td>";
            // Attendance dropdown
            h += "<td><select id='st-" + safeUsn + "-" + n + "' style='font-size:10px;padding:4px 8px;background:var(--surf2);border:1px solid var(--bd);border-radius:6px;color:var(--tx);cursor:pointer'>";
            [['pending', 'Pending'], ['selection', 'Present'], ['rejected', 'Absent']].forEach(function (pair) {
                h += "<option value='" + pair[0] + "'" + (curStatus === pair[0] ? " selected" : "") + ">" + pair[1] + "</option>";
            });
            h += "</select></td>";
            // Result dropdown
            h += "<td><select id='rs-" + safeUsn + "-" + n + "' style='font-size:10px;padding:4px 8px;background:var(--surf2);border:1px solid var(--bd);border-radius:6px;color:var(--tx);cursor:pointer'>";
            [['', '\u2014 No Decision'], ['selected', '\u2705 Selected'], ['rejected', '\u274C Rejected'], ['next_round', '\u27A1\uFE0F Next Round']].forEach(function (pair) {
                h += "<option value='" + pair[0] + "'" + (curResult === pair[0] ? " selected" : "") + ">" + pair[1] + "</option>";
            });
            h += "</select></td>";
            h += "<td><input type='text' id='rm-" + safeUsn + "-" + n + "' value='" + curRemark.replace(/'/g, "&#39;") + "' placeholder='Add remark...' style='width:100%;min-width:110px;padding:4px 8px;background:var(--surf2);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-size:10px;outline:none'></td>";
            h += "<td><button onclick=\"saveAttendance('" + s.usn + "'," + n + ")\" style='padding:4px 14px;background:var(--ind);color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap'>Save</button></td>";
            h += "</tr>";
        });
    }
    h += "</tbody></table></div>";
    document.getElementById('comp-roster-body').innerHTML = h;
}

function saveAttendance(usn, n) {
    const s = RAW.find(x => x.usn === usn);
    if (!s) return;
    const sc = s.schedule[n - 1];
    const safeUsn = usn.replace(/[^a-z0-9]/gi, '_');
    const sel = document.getElementById('st-' + safeUsn + '-' + n);
    const res = document.getElementById('rs-' + safeUsn + '-' + n);
    const rem = document.getElementById('rm-' + safeUsn + '-' + n);

    const changes = [];
    if (sel && sc) {
        const oldStatus = sc.status;
        const newStatus = sel.value;
        if (oldStatus !== newStatus) {
            const labels = { pending: 'Pending', selection: 'Present', rejected: 'Absent' };
            changes.push('Attendance: ' + (labels[oldStatus] || oldStatus) + ' \u2192 ' + (labels[newStatus] || newStatus));
        }
        sc.status = newStatus;
    }
    if (res && sc) {
        const oldResult = sc.result || '';
        const newResult = res.value;
        if (oldResult !== newResult) {
            const labels = { '': 'No Decision', selected: 'Selected', rejected: 'Rejected', next_round: 'Next Round' };
            changes.push('Result: ' + (labels[oldResult] || oldResult) + ' \u2192 ' + (labels[newResult] || newResult));
        }
        sc.result = newResult;
    }
    if (rem && sc) {
        const oldRemark = sc.remark || '';
        const newRemark = rem.value;
        if (oldRemark !== newRemark) {
            changes.push('Remark updated');
        }
        sc.remark = newRemark;
    }

    // Log activity
    if (changes.length > 0) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        window._compLog.push({
            time: timeStr,
            student: s.name,
            usn: s.usn,
            session: n,
            changes: changes.join('; ')
        });
    }

    window._compSL = null;
    _saveScheduleChange(usn, n - 1, sc);
    _saveActivityLog();
    renderCompany();
}

function renderActivityLog() {
    const logEl = document.getElementById('comp-activity-log');
    if (!logEl) return;
    const logs = (window._compLog || []).filter(l => true); // show all logs for this company session
    if (logs.length === 0) {
        logEl.innerHTML = "<div style='text-align:center;padding:20px;color:var(--mut);font-size:11px'>No actions recorded yet. Save attendance or results to see your activity here.</div>";
        return;
    }
    let h = "<div class='tw' style='max-height:300px;overflow-y:auto'><table><thead><tr><th>TIME</th><th>STUDENT</th><th>SESSION</th><th>CHANGES</th></tr></thead><tbody>";
    // Show most recent first
    for (let i = logs.length - 1; i >= 0; i--) {
        const l = logs[i];
        h += "<tr>";
        h += "<td style='font-size:10px;color:var(--cyn);white-space:nowrap;font-weight:600'>" + l.time + "</td>";
        h += "<td><div style='font-weight:600;font-size:11px;color:var(--tx)'>" + l.student + "</div><div style='font-size:9px;color:var(--mut)'>" + l.usn + "</div></td>";
        h += "<td style='font-size:10px;color:var(--mut)'>Session " + l.session + "</td>";
        h += "<td style='font-size:10px;color:var(--tx)'>" + l.changes + "</td>";
        h += "</tr>";
    }
    h += "</tbody></table></div>";
    logEl.innerHTML = h;
}

function dlCompCSV() {
    const list = RAW.filter(s => s.schedule.slice(0, 25).some(sc => sc.company === CUR));
    const rows = list.map(s => {
        const sc = s.schedule.slice(0, 25).find(x => x.company === CUR);
        const sIdx = s.schedule.indexOf(sc) + 1;
        const statusLabel = sc.status === 'selection' ? 'Present' : (sc.status === 'rejected' ? 'Absent' : 'Pending');
        const resultLabel = sc.result === 'selected' ? 'Selected' : (sc.result === 'rejected' ? 'Rejected' : (sc.result === 'next_round' ? 'Next Round' : ''));
        return '"' + s.usn + '","' + s.name + '","' + (s.branch || '') + '","' + (s.email || '') + '",' + sIdx + ',"' + statusLabel + '","' + resultLabel + '","' + (sc.remark || '').replace(/"/g, '""') + '"';
    });
    const csv = "USN,Name,Branch,Email,Session,Attendance,Result,Remark\n" + rows.join("\n");
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = "roster_" + CUR.replace(/[^a-z0-9]/gi, '_') + ".csv";
    a.click();
}

// ── COMPANY PDF EXPORT (session-wise pages) ──────────────────────────────────
function dlCompPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210, ph = 297, mx = 14, my = 14;
    const cw = pw - 2 * mx;
    _buildCompanyPDF(doc, CUR, pw, ph, mx, my, cw);
    doc.save('roster_' + CUR.replace(/[^a-z0-9]/gi, '_') + '.pdf');
}

function updateStatus(usn) {
    const s = RAW.find(x => x.usn === usn);
    const sc = s.schedule.find(x => x.company === CUR);
    const res = prompt("Status for " + s.name + " (selection/rejected/pending):", sc.status);
    if (res && ['selection', 'rejected', 'pending'].includes(res)) {
        sc.status = res;
        sc.remark = prompt("Remark:", sc.remark || "") || '';
        renderCompany();
    }
}

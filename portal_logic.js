// Portal JS Logic — injected by rebuild_portal.py
// DATA_PLACEHOLDER will be replaced with actual JSON constants

let CUR = null;
let STU_PAGE = 0;
const STU_PER_PAGE = 100;
let ROOM_DATA = (typeof ROOM_DATA_INIT !== 'undefined') ? Object.assign({}, ROOM_DATA_INIT) : {}; // company name -> room/password (from Room Allotment Excel)
const DEFAULT_COMP_PWD = (typeof DEFAULT_COMP_PWD_INIT !== 'undefined') ? DEFAULT_COMP_PWD_INIT : 'company123';

let _dataReady = false;

// ── CLOUD PERSISTENCE (Firebase Firestore) ──────────────────────────────────
// cloud_store.js provides: _cloudSaveChange, _cloudLoadAllChanges,
//                          _cloudSaveActivityLog, _cloudLoadActivityLog

function _saveScheduleChange(usn, sessionIdx, sc) {
    _cloudSaveChange(usn, sessionIdx, sc);
}

function _saveActivityLog() {
    // Activity logs are now saved per-entry in saveAttendance() via _cloudSaveActivityLog
    // This function is kept as a no-op for backward compatibility
}

function _loadActivityLog() {
    window._compLog = [];
}

// Load all saved data from Firestore on startup
_cloudLoadAllChanges(function () {
    _dataReady = true;
    console.log('[PlaceDrive] Cloud data loaded, portal ready');
    // Hide loading overlay if present
    var lo = document.getElementById('loading-overlay');
    if (lo) lo.style.display = 'none';
    var ls = document.getElementById('ls');
    if (ls) ls.style.opacity = '1';
});
_loadActivityLog();

function togglePw(id) {
    const inp = document.getElementById(id);
    if (!inp) return;
    const isHidden = inp.type === 'password';
    inp.type = isHidden ? 'text' : 'password';
    const eye = inp.parentElement.querySelector('.pw-eye');
    if (eye) eye.style.opacity = isHidden ? '1' : '.5';
}

function autoSlash(el) {
    let v = el.value.replace(/[^0-9\/]/g, '').replace(/\/+/g, '/');
    const digits = v.replace(/\//g, '');
    if (digits.length >= 4) v = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    else if (digits.length >= 2) v = digits.slice(0, 2) + '/' + digits.slice(2);
    el.value = v;
}

function selRole(r) {
    ['s', 'c', 'a'].forEach(x => {
        document.getElementById('tab-' + x).classList.toggle('on', x === r);
        document.getElementById('lf-' + x).classList.toggle('hidden', x !== r);
    });
    document.getElementById('lerr').classList.add('hidden');
}

function doLogin(r) {
    document.getElementById('lerr').classList.add('hidden');
    if (r === 's') {
        const u = document.getElementById('su').value.trim();
        const p = document.getElementById('sp').value.trim();
        const s = RAW.find(x => x.usn.toLowerCase() === u.toLowerCase() && x.password === p);
        if (s) { CUR = s; renderDashboard('student'); } else showError('Invalid USN or Password');
    } else if (r === 'c') {
        const u = document.getElementById('cu').value.trim();
        const p = document.getElementById('cp').value.trim();
        const c = COMPANY.find(x => x.toLowerCase().replace(/\s+/g, '') === u.toLowerCase());
        if (c) {
            const roomPwd = ROOM_DATA[c] || DEFAULT_COMP_PWD;
            if (p === roomPwd) {
                CUR = c; renderDashboard('company');
            } else {
                showError('Invalid Password (use your Room Number)');
            }
        } else {
            showError('Invalid Company ID');
        }
    } else if (r === 'a') {
        const u = document.getElementById('au').value.trim();
        const p = document.getElementById('ap').value.trim();
        if (u === 'admin' && p === 'Placement2026') { renderDashboard('admin'); } else showError('Invalid Admin Credentials');
    }
}

function showError(m) {
    const d = document.getElementById('lerr');
    d.textContent = m;
    d.classList.remove('hidden');
}

function renderDashboard(type) {
    document.getElementById('ls').classList.add('hidden');
    document.getElementById('app').style.display = 'block';
    const badge = document.getElementById('rbadge');
    badge.textContent = type === 'student' ? 'Student' : (type === 'company' ? 'Company' : 'Admin');
    badge.className = 'rbadge ' + (type === 'student' ? 'rstu' : (type === 'company' ? 'rcom' : 'radm'));
    document.getElementById('ulabel').textContent = type === 'admin' ? 'Administrator' : (type === 'student' ? CUR.name : CUR);
    ['vs', 'vc', 'va'].forEach(v => document.getElementById(v).classList.add('hidden'));
    if (type === 'student') { renderStudent(); document.getElementById('vs').classList.remove('hidden'); }
    else if (type === 'company') { renderCompany(); document.getElementById('vc').classList.remove('hidden'); }
    else { renderAdmin(); document.getElementById('va').classList.remove('hidden'); }
}

function doLogout() {
    CUR = null;
    document.getElementById('app').style.display = 'none';
    document.getElementById('ls').classList.remove('hidden');
    ['su', 'sp', 'cu', 'cp', 'au', 'ap'].forEach(id => document.getElementById(id).value = '');
}

function renderStudent() {
    const selections = CUR.schedule.filter(s => s.result === 'selected' && s.company);
    let h = `<div class='wb'><div><div class='wbn'>Welcome, ${CUR.name}</div><div class='wbs'>${CUR.branch} &middot; ${CUR.usn}</div></div><div class='wbb'>Student Dashboard</div></div>`;

    if (selections.length > 0) {
        h += `<div class='card success-card' style='margin-bottom:24px;background:linear-gradient(135deg, #1a1c2e 0%, #0f172a 100%);border:2px solid var(--grn);padding:30px;position:relative;overflow:hidden;box-shadow:0 20px 50px rgba(34,197,94,0.15);border-radius:20px'>
            <div style='position:absolute;top:-20px;right:-20px;font-size:120px;opacity:0.05;pointer-events:none'>🎉</div>
            <div style='position:absolute;bottom:-20px;left:-20px;font-size:80px;opacity:0.05;pointer-events:none;transform:rotate(-15deg)'>🎊</div>
            
            <div style='position:relative;z-index:10'>
                <div style='display:flex;align-items:center;gap:12px;margin-bottom:16px'>
                    <div style='background:var(--grn);color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 20px var(--grn)'>★</div>
                    <div style='font-size:11px;font-weight:800;color:var(--grn);letter-spacing:2px;text-transform:uppercase'>OFFICIAL PLACEMENT SUCCESS</div>
                </div>
                
                <h2 style='font-size:28px;font-weight:900;color:#fff;margin:0 0 8px 0;line-height:1.2;background:linear-gradient(to right, #fff, #94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>Congratulations, ${CUR.name}!</h2>
                <p style='font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 24px 0'>You've made us proud. Your hard work has paid off with the following placement(s):</p>
                
                <div style='display:flex;flex-wrap:wrap;gap:16px'>`;
        selections.forEach(sel => {
            h += `<div style='background:rgba(255,255,255,0.03);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);padding:20px 24px;border-radius:16px;display:flex;flex-direction:column;gap:6px;min-width:240px;flex:1;transition:transform 0.3s ease;box-shadow:0 10px 30px rgba(0,0,0,0.2)'>
                <div style='font-size:10px;font-weight:700;color:var(--grn);letter-spacing:1px;text-transform:uppercase'>SELECTED BY</div>
                <div style='font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px'>${sel.company}</div>
                <div style='display:flex;align-items:center;gap:8px;margin-top:4px'>
                    <span style='font-size:11px;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:4px'>🕒 ${sel.time}</span>
                    <span style='width:4px;height:4px;background:rgba(255,255,255,0.2);border-radius:50%'></span>
                    <span style='font-size:11px;color:var(--grn);font-weight:700'>ID: CONFIRMED</span>
                </div>
            </div>`;
        });
        h += `</div>
            </div>
            <style>
                .success-card::before {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at top right, rgba(34,197,94,0.1), transparent 60%);
                    pointer-events: none;
                }
            </style>
        </div>`;
    }

    // Profile Info Section
    h += `<div class='card' style='margin-bottom:20px'>
        <div class='ctit'><div class='dot'></div>Profile Information</div>
        <div class='pg' style='grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))'>
            <div class='pi'><div class='pl'>FULL NAME</div><div class='pv'>${CUR.name}</div></div>
            <div class='pi'><div class='pl'>USN / ID</div><div class='pv'>${CUR.usn}</div></div>
            <div class='pi'><div class='pl'>BRANCH</div><div class='pv'>${CUR.branch}</div></div>
            <div class='pi'><div class='pl'>GENDER</div><div class='pv'>${CUR.gender || '—'}</div></div>
            <div class='pi'><div class='pl'>DATE OF BIRTH</div><div class='pv'>${CUR.dob || '—'}</div></div>
            <div class='pi'><div class='pl'>EMAIL ID</div><div class='pv'>${CUR.email || '—'}</div></div>
            <div class='pi'><div class='pl'>PHONE NUMBER</div><div class='pv'>${CUR.phone || '—'}</div></div>
            <div class='pi'><div class='pl'>10TH PERCENTAGE</div><div class='pv'>${CUR.pct10 || '—'}%</div></div>
            <div class='pi'><div class='pl'>12TH / DIPLOMA</div><div class='pv'>${CUR.pct12 || '—'}%</div></div>
            <div class='pi'><div class='pl'>B.E CGPA</div><div class='pv' style='font-weight:800;color:var(--indl)'>${CUR.cgpa || '—'}</div></div>
            <div class='pi' style='grid-column: span 1'><div class='pl'>RESUME</div><div class='pv'>${CUR.resume ? `<a href='${CUR.resume}' target='_blank' style='color:var(--indl);text-decoration:none'>View Resume &nearr;</a>` : 'Not Uploaded'}</div></div>
        </div>
    </div>`;

    h += "<div class='card'><div class='ctit'><div class='dot'></div>Interview Schedule</div><div class='rg'>";
    CUR.schedule.forEach((s, i) => {
        const cls = s.status === 'selection' ? 'rs3' : (s.status === 'rejected' ? 'rs4' : 'rs1');
        const bcls = s.status === 'selection' ? 'bp' : (s.status === 'rejected' ? 'ba' : 'bn');
        const statusLabel = s.status === 'selection' ? 'PRESENT' : (s.status === 'rejected' ? 'ABSENT' : 'PENDING');
        const roomNo = s.company ? (ROOM_DATA[s.company] || '—') : '—';
        h += `<div class='rc'><div class='rstr ${cls}'></div><div class='rn'>Session ${i + 1}</div><div class='rcn'>${s.company || 'Not Allocated'}</div><div class='rct'>${s.time}</div><div style='font-size:10px;color:var(--cyn);margin:4px 0'>📍 Room: ${roomNo}</div><div class='b ${bcls}'>${statusLabel}</div>`;
        if (s.remark) h += `<div class='rrm'>${s.remark}</div>`;
        h += "</div>";
    });
    h += "</div></div>";
    document.getElementById('vs').innerHTML = h;
}

// renderCompany() and updateStatus() are in company_logic.js

// ── ADMIN ──────────────────────────────────────────────────────────────────────
let _adminAssignModal = null; // track open assign modal

function renderAdmin() {
    let h = "<div class='wb'><div><div class='wbn'>Admin Dashboard</div><div class='wbs'>Full placement drive management &middot; " + RAW.length + " students &middot; " + COMPANY.length + " companies</div></div></div>";
    h += "<div class='tabs'>";
    h += "<div class='tab on' id='at-ov' onclick=\"changeAdminTab('ov')\">Overview</div>";
    h += "<div class='tab' id='at-s' onclick=\"changeAdminTab('s')\">All Students</div>";
    h += "<div class='tab' id='at-c' onclick=\"changeAdminTab('c')\">By Company</div>";
    h += "<div class='tab' id='at-k' onclick=\"changeAdminTab('k')\">Credentials</div>";
    h += "<div class='tab' id='at-r' onclick=\"changeAdminTab('r')\">Reports</div>";
    h += "</div><div id='admin-body'></div>";
    document.getElementById('va').innerHTML = h;
    changeAdminTab('ov');
}

function changeAdminTab(t) {
    ['ov', 's', 'c', 'k', 'r'].forEach(x => { const el = document.getElementById('at-' + x); if (el) el.classList.toggle('on', x === t); });
    const b = document.getElementById('admin-body');
    if (t === 'ov') renderOverview(b);
    else if (t === 's') renderAllStudents(b);
    else if (t === 'c') renderByCompany(b);
    else if (t === 'k') renderCredentials(b);
    else if (t === 'r') renderReports(b);
}

function renderOverview(b) {
    let present = 0, absent = 0, pending = 0;
    let selected = 0, rejectedR = 0, nextRound = 0;
    const branches = {}, compStats = {};
    RAW.forEach(s => {
        const br = s.branch || 'Unknown';
        if (!branches[br]) branches[br] = { total: 0, present: 0, absent: 0 };
        branches[br].total++;
        s.schedule.forEach(sc => {
            if (sc.status === 'selection') { present++; branches[br].present++; }
            else if (sc.status === 'rejected') { absent++; branches[br].absent++; }
            else pending++;
            if (sc.result === 'selected') selected++;
            else if (sc.result === 'rejected') rejectedR++;
            else if (sc.result === 'next_round') nextRound++;
            const c = sc.company;
            if (c) {
                if (!compStats[c]) compStats[c] = { total: 0, present: 0, absent: 0, selected: 0, rejected: 0, next_round: 0 };
                compStats[c].total++;
                if (sc.status === 'selection') compStats[c].present++;
                else if (sc.status === 'rejected') compStats[c].absent++;
                if (sc.result === 'selected') compStats[c].selected++;
                else if (sc.result === 'rejected') compStats[c].rejected++;
                else if (sc.result === 'next_round') compStats[c].next_round++;
            }
        });
    });
    const topComps = Object.entries(compStats).sort((a, b) => b[1].total - a[1].total);

    // Attendance stats
    let h = "<div style='font-size:9px;font-weight:700;color:var(--mut);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px'>ATTENDANCE OVERVIEW</div>";
    h += "<div class='sg admin-stats' style='grid-template-columns:repeat(5,1fr);margin-bottom:14px'>";
    h += "<div class='sc si'><div class='sl'>STUDENTS</div><div class='sv'>" + RAW.length + "</div></div>";
    h += "<div class='sc sp'><div class='sl'>COMPANIES</div><div class='sv'>" + COMPANY.length + "</div></div>";
    h += "<div class='sc sg2'><div class='sl'>PRESENT</div><div class='sv'>" + present + "</div></div>";
    h += "<div class='sc sr'><div class='sl'>ABSENT</div><div class='sv'>" + absent + "</div></div>";
    h += "<div class='sc sa'><div class='sl'>PENDING</div><div class='sv'>" + pending + "</div></div>";
    h += "</div>";

    // Selection result stats
    let placedSet = new Set();
    RAW.forEach(s => {
        if (s.schedule.some(sc => sc.result === 'selected')) placedSet.add(s.usn);
    });
    const placedCount = placedSet.size;

    h += "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>";
    h += "<div style='font-size:9px;font-weight:700;color:var(--mut);letter-spacing:1.2px;text-transform:uppercase'>SELECTION RESULTS</div>";
    h += "<div style='font-size:9px;font-weight:700;color:var(--grn)'>DISTINCT PLACED: " + placedCount + "</div>";
    h += "</div>";

    h += "<div class='sg admin-stats' style='grid-template-columns:repeat(3,1fr);margin-bottom:22px'>";
    h += "<div class='sc' style='border-left:2px solid var(--grn)'><div class='sl'>TOTAL SELECTIONS</div><div class='sv' style='color:var(--grn)'>" + selected + "</div></div>";
    h += "<div class='sc' style='border-left:2px solid var(--red)'><div class='sl'>REJECTED</div><div class='sv' style='color:var(--red)'>" + rejectedR + "</div></div>";
    h += "<div class='sc' style='border-left:2px solid var(--amb)'><div class='sl'>NEXT ROUND</div><div class='sv' style='color:var(--amb)'>" + nextRound + "</div></div>";
    h += "</div>";

    h += "<div class='admin-two-col' style='display:grid;grid-template-columns:1fr 1fr;gap:16px'>";

    // Branch table
    h += "<div class='card'><div class='ctit'><div class='dot'></div>BRANCH-WISE ATTENDANCE</div><div class='tw'><table><thead><tr><th>Branch</th><th>Students</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead><tbody>";
    Object.entries(branches).sort((a, b) => b[1].total - a[1].total).forEach(([br, st]) => {
        const rate = st.total > 0 ? Math.round((st.present / st.total) * 100) : 0;
        h += "<tr><td class='nm'>" + br + "</td><td>" + st.total + "</td><td style='color:var(--grn)'>" + st.present + "</td><td style='color:var(--red)'>" + st.absent + "</td><td>";
        h += "<div style='display:flex;align-items:center;gap:6px'><div style='flex:1;height:4px;background:var(--bd);border-radius:2px'><div style='width:" + rate + "%;height:100%;background:var(--ind);border-radius:2px'></div></div><span style='font-size:9px;color:var(--mut)'>" + rate + "%</span></div></td></tr>";
    });
    h += "</tbody></table></div></div>";

    // Company table — with selection results
    h += "<div class='card'><div class='ctit'><div class='dot'></div>COMPANIES — ATTENDANCE & RESULTS</div><div class='tw' style='max-height:420px;overflow-y:auto'><table><thead><tr><th>Company</th><th>Room</th><th>Total</th><th>Present</th><th>Absent</th><th style='color:var(--grn)'>Sel</th><th style='color:var(--red)'>Rej</th><th style='color:var(--amb)'>Next</th></tr></thead><tbody>";
    topComps.forEach(([c, st]) => {
        const room = ROOM_DATA[c] || '\u2014';
        h += "<tr><td class='nm'>" + c + "</td><td style='color:var(--cyn);font-size:10px'>" + room + "</td><td>" + st.total + "</td><td style='color:var(--grn)'>" + st.present + "</td><td style='color:var(--red)'>" + st.absent + "</td>";
        h += "<td style='color:var(--grn);font-weight:700'>" + (st.selected || 0) + "</td><td style='color:var(--red);font-weight:700'>" + (st.rejected || 0) + "</td><td style='color:var(--amb);font-weight:700'>" + (st.next_round || 0) + "</td></tr>";
    });
    h += "</tbody></table></div></div></div>";

    // ── INTERVIEW ATTENDANCE TRACKER ──────────────────────────────────────────
    const attendeeMap = {}; // usn -> { name, branch, companies: Set }
    RAW.forEach(s => {
        s.schedule.forEach(sc => {
            if (sc.status === 'selection' && sc.company) {
                if (!attendeeMap[s.usn]) attendeeMap[s.usn] = { name: s.name, branch: s.branch || '—', companies: new Set() };
                attendeeMap[s.usn].companies.add(sc.company);
            }
        });
    });
    const attendees = Object.entries(attendeeMap).sort((a, b) => b[1].companies.size - a[1].companies.size);
    const distinctCount = attendees.length;

    // Company-wise distinct attendee counts
    const compAttendeeCount = {};
    attendees.forEach(([, info]) => {
        info.companies.forEach(c => { compAttendeeCount[c] = (compAttendeeCount[c] || 0) + 1; });
    });

    h += "<div style='font-size:9px;font-weight:700;color:var(--mut);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;margin-top:22px'>INTERVIEW ATTENDANCE TRACKER</div>";
    h += "<div class='sg admin-stats' style='grid-template-columns:repeat(3,1fr);margin-bottom:14px'>";
    h += "<div class='sc si'><div class='sl'>DISTINCT ATTENDEES</div><div class='sv'>" + distinctCount + "</div></div>";
    h += "<div class='sc sp'><div class='sl'>TOTAL STUDENTS</div><div class='sv'>" + RAW.length + "</div></div>";
    const attendRate = RAW.length > 0 ? Math.round((distinctCount / RAW.length) * 100) : 0;
    h += "<div class='sc sg2'><div class='sl'>ATTENDANCE RATE</div><div class='sv'>" + attendRate + "%</div></div>";
    h += "</div>";

    h += "<div class='admin-two-col' style='display:grid;grid-template-columns:1fr 1fr;gap:16px'>";

    // Company-wise attendee count
    h += "<div class='card'><div class='ctit'><div class='dot'></div>COMPANY-WISE INTERVIEW ATTENDEES</div><div class='tw' style='max-height:420px;overflow-y:auto'><table><thead><tr><th>Company</th><th>Distinct Students Attended</th></tr></thead><tbody>";
    Object.entries(compAttendeeCount).sort((a, b) => b[1] - a[1]).forEach(([c, cnt]) => {
        h += "<tr><td class='nm'>" + c + "</td><td style='font-weight:700;color:var(--ind)'>" + cnt + "</td></tr>";
    });
    h += "</tbody></table></div></div>";

    // Detailed student-wise attendance
    h += "<div class='card'><div class='ctit'><div class='dot'></div>STUDENT-WISE INTERVIEW DETAILS</div><div class='tw' style='max-height:420px;overflow-y:auto'><table><thead><tr><th>#</th><th>Student</th><th>Branch</th><th>Companies Attended</th></tr></thead><tbody>";
    attendees.forEach(([usn, info], idx) => {
        const compTags = Array.from(info.companies).map(c => "<span style='background:rgba(99,102,241,.12);color:var(--ind);padding:1px 7px;border-radius:10px;font-size:9px;font-weight:600;margin:1px;display:inline-block'>" + c.substring(0, 18) + "</span>").join(' ');
        h += "<tr><td style='color:var(--mut)'>" + (idx + 1) + "</td>";
        h += "<td><div class='nm'>" + info.name + "</div><div class='us'>" + usn + "</div></td>";
        h += "<td style='font-size:11px;color:var(--mut)'>" + info.branch + "</td>";
        h += "<td style='max-width:260px'>" + compTags + "</td></tr>";
    });
    if (attendees.length === 0) h += "<tr><td colspan='4' style='text-align:center;padding:20px;color:var(--mut);font-size:11px'>No students have been marked as present yet</td></tr>";
    h += "</tbody></table></div></div></div>";

    b.innerHTML = h;
}

// ── ALL STUDENTS (PAGINATED) ──────────────────────────────────────────────────
function renderAllStudents(b) {
    STU_PAGE = 0;
    b.innerHTML = "<div class='sb'><input type='text' id='stu-q' placeholder='Search Name/USN...' onkeyup='filterStu()'><button class='btn btp' onclick='addStu()'>+ Add Student</button></div><div id='stu-table' class='tw'></div>";
    filterStu();
}

function filterStu() {
    const el = document.getElementById('stu-q');
    const q = el ? el.value.toLowerCase() : '';
    const list = RAW.filter(s => s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));
    const totalPages = Math.ceil(list.length / STU_PER_PAGE);
    if (STU_PAGE >= totalPages) STU_PAGE = Math.max(0, totalPages - 1);
    const start = STU_PAGE * STU_PER_PAGE;
    const pageItems = list.slice(start, start + STU_PER_PAGE);

    let h = "<table><thead><tr><th>#</th><th>Student</th><th>Branch</th><th>Password (DOB)</th><th>Schedule</th><th>Actions</th></tr></thead><tbody>";
    pageItems.forEach((s, idx) => {
        // Build a compact schedule summary
        const schedSummary = s.schedule.map((sc, si) => sc.company ? '<span style=\'background:var(--ind);color:#fff;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:600;margin:1px\'>S' + (si + 1) + ': ' + sc.company.substring(0, 12) + '</span>' : '').filter(Boolean).join(' ');
        h += "<tr><td style='color:var(--mut)'>" + (start + idx + 1) + "</td>";
        h += "<td><div class='nm'>" + s.name + "</div><div class='us'>" + s.usn + "</div></td>";
        h += "<td>" + s.branch + "</td>";
        h += "<td class='mu'>" + s.password + "</td>";
        h += "<td style='max-width:200px'>" + (schedSummary || "<span style='color:var(--mut);font-size:10px'>None</span>") + "</td>";
        h += "<td style='white-space:nowrap'>";
        h += "<button class='btn btg bts' onclick=\"openAssignModal('" + s.usn + "')\">&#128205; Assign</button> ";
        h += "<button class='btn btg bts' onclick=\"editStu('" + s.usn + "')\">Edit</button> ";
        h += "<button class='btn btg bts' onclick=\"updatePw('" + s.usn + "')\">&#128273; Pwd</button> ";
        h += "<button class='btn btg bts' style='color:var(--red)' onclick=\"delStu('" + s.usn + "')\">Del</button>";
        h += "</td></tr>";
    });
    h += "</tbody></table>";

    // Pagination controls
    h += "<div style='display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--bd);background:var(--surf)'>";
    h += "<span style='font-size:11px;color:var(--mut)'>Showing " + (start + 1) + "\u2013" + Math.min(start + STU_PER_PAGE, list.length) + " of " + list.length + " students</span>";
    h += "<div style='display:flex;gap:6px'>";
    h += "<button class='btn btg bts' onclick='stuPrev()' " + (STU_PAGE === 0 ? "disabled style='opacity:.4;cursor:default'" : "") + ">&larr; Prev</button>";
    for (let p = 0; p < totalPages; p++) {
        if (totalPages <= 7 || p === 0 || p === totalPages - 1 || Math.abs(p - STU_PAGE) <= 1) {
            h += "<button class='btn bts " + (p === STU_PAGE ? "btp" : "btg") + "' onclick='stuGoPage(" + p + ")'>" + (p + 1) + "</button>";
        } else if (p === 1 && STU_PAGE > 3) {
            h += "<span style='color:var(--mut);font-size:10px;padding:0 4px'>...</span>";
        } else if (p === totalPages - 2 && STU_PAGE < totalPages - 4) {
            h += "<span style='color:var(--mut);font-size:10px;padding:0 4px'>...</span>";
        }
    }
    h += "<button class='btn btg bts' onclick='stuNext()' " + (STU_PAGE >= totalPages - 1 ? "disabled style='opacity:.4;cursor:default'" : "") + ">Next &rarr;</button>";
    h += "</div></div>";

    const tbl = document.getElementById('stu-table');
    if (tbl) tbl.innerHTML = h;
}

function stuPrev() { if (STU_PAGE > 0) { STU_PAGE--; filterStu(); } }
function stuNext() { STU_PAGE++; filterStu(); }
function stuGoPage(p) { STU_PAGE = p; filterStu(); }

// ── ASSIGN STUDENT MODAL ──────────────────────────────────────────────────────
function openAssignModal(usn) {
    const s = RAW.find(x => x.usn === usn);
    if (!s) return;
    closeAssignModal();
    const overlay = document.createElement('div');
    overlay.id = 'assign-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--surf);border:1px solid var(--bd);border-radius:14px;padding:24px;min-width:380px;max-width:520px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)';
    let mh = "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'>";
    mh += "<div><div style='font-size:15px;font-weight:700;color:var(--tx)'>Assign Company to " + s.name + "</div>";
    mh += "<div style='font-size:10px;color:var(--mut);margin-top:2px'>" + s.usn + " &middot; " + s.branch + " &middot; <button onclick=\"editStu('" + usn + "')\" style='background:none;border:none;color:var(--ind);font-size:10px;font-weight:700;cursor:pointer;padding:0;text-decoration:underline'>Edit Profile / Upgrade</button></div></div>";
    mh += "<button onclick='closeAssignModal()' style='background:none;border:none;color:var(--mut);font-size:18px;cursor:pointer;padding:4px 8px'>&#10005;</button></div>";
    // Session rows
    const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
    mh += "<div style='display:flex;flex-direction:column;gap:10px'>";
    for (let i = 0; i < 25; i++) {
        const sessionNum = i + 1;
        const sc = s.schedule[i] || { round: sessionNum, company: '', time: times[i % 5] || 'TBD', status: 'pending', remark: '', result: '' };
        mh += "<div style='background:var(--surf2);border:1px solid var(--bd);border-radius:10px;padding:12px'>";
        mh += "<div style='display:flex;align-items:center;gap:8px;margin-bottom:8px'>";
        mh += "<span style='background:var(--ind);color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700'>Session " + sessionNum + "</span>";
        mh += "<span style='font-size:10px;color:var(--mut)'>" + sc.time + "</span></div>";
        mh += "<div style='display:flex;gap:8px;align-items:center'>";
        mh += "<select id='am-comp-" + sessionNum + "' style='flex:1;padding:7px 10px;background:var(--surf);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font-size:11px'>";
        mh += "<option value=''>-- None --</option>";
        COMPANY.forEach(c => { mh += "<option value=\"" + c + "\"" + (sc.company === c ? ' selected' : '') + ">" + c + "</option>"; });
        mh += "</select>";
        mh += "<button onclick=\"applyAssign('" + usn + "'," + i + ")\" style='padding:7px 14px;background:var(--ind);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap'>Save</button>";
        if (sc.company) mh += "<button onclick=\"clearAssign('" + usn + "'," + i + ")\" style='padding:7px 10px;background:var(--surf2);color:var(--red);border:1px solid var(--bd);border-radius:8px;font-size:11px;cursor:pointer'>Clear</button>";
        mh += "</div>";
        if (sc.company) mh += "<div style='margin-top:6px;font-size:10px;color:var(--cyn);font-weight:600'>&#128205; Currently: " + sc.company + "</div>";
        mh += "</div>";
    }
    mh += "</div>";
    mh += "<div style='margin-top:16px;text-align:right'><button onclick='closeAssignModal()' class='btn btg'>Close</button></div>";
    modal.innerHTML = mh;
    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeAssignModal(); });
    document.body.appendChild(overlay);
}

function closeAssignModal() {
    const el = document.getElementById('assign-modal-overlay');
    if (el) el.remove();
}

function applyAssign(usn, sessionIdx) {
    const s = RAW.find(x => x.usn === usn);
    if (!s) return;
    const sel = document.getElementById('am-comp-' + (sessionIdx + 1));
    if (!sel) return;
    const companyName = sel.value;
    // Ensure schedule slot exists
    if (!s.schedule[sessionIdx]) {
        const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
        s.schedule[sessionIdx] = { round: sessionIdx + 1, company: '', time: times[sessionIdx % 5] || 'TBD', status: 'pending', remark: '', result: '' };
    }
    const sc = s.schedule[sessionIdx];
    sc.company = companyName;
    _cloudSaveChange(usn, sessionIdx, sc);
    openAssignModal(usn); // refresh modal
    filterStu();
}

function clearAssign(usn, sessionIdx) {
    const s = RAW.find(x => x.usn === usn);
    if (!s || !s.schedule[sessionIdx]) return;
    s.schedule[sessionIdx].company = '';
    _cloudSaveChange(usn, sessionIdx, s.schedule[sessionIdx]);
    openAssignModal(usn);
    filterStu();
}

function updatePw(u) {
    const s = RAW.find(x => x.usn === u);
    const np = prompt("Enter new password for " + s.name + ":", s.password);
    if (np && np !== s.password) {
        s.password = np;
        _cloudSavePassword(u, np);
        alert('Password updated to ' + np);
        filterStu();
    }
}

function resetP(u) {
    const s = RAW.find(x => x.usn === u);
    const dp = s.dob || '01/01/2000';
    s.password = dp;
    _cloudSavePassword(u, dp);
    alert('Password reset to DOB: ' + s.password);
    filterStu();
}

function delStu(u) {
    if (confirm('Delete student ' + u + '?')) {
        RAW.splice(RAW.findIndex(x => x.usn === u), 1);
        _cloudDeleteStudent(u);
        filterStu();
    }
}

function editStu(usn) {
    const s = RAW.find(x => x.usn === usn) || { usn: '', name: '', branch: '', dob: '', email: '', phone: '', gender: '', cgpa: '', resume: '' };
    const isNew = !usn;
    closeStuModal();
    const overlay = document.createElement('div');
    overlay.id = 'stu-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--surf);border:1px solid var(--bd);border-radius:14px;padding:24px;min-width:380px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)';

    let h = "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:20px'>";
    h += "<div style='font-size:16px;font-weight:700;color:var(--tx)'>" + (isNew ? 'Add New Student' : 'Edit Student Profile') + "</div>";
    h += "<button onclick='closeStuModal()' style='background:none;border:none;color:var(--mut);font-size:18px;cursor:pointer'>&#10005;</button></div>";

    const fields = [
        { id: 'estu-usn', label: 'USN / ID', val: s.usn, ph: '4MH22CS001', req: true, readonly: !isNew },
        { id: 'estu-name', label: 'Full Name', val: s.name, ph: 'John Doe', req: true },
        { id: 'estu-branch', label: 'Branch', val: s.branch, ph: 'CSE / ISE / ECE' },
        { id: 'estu-dob', label: 'Date of Birth', val: s.dob, ph: 'DD/MM/YYYY' },
        { id: 'estu-gender', label: 'Gender', val: s.gender, ph: 'Male / Female / Other' },
        { id: 'estu-email', label: 'Email ID', val: s.email, ph: 'john@example.com' },
        { id: 'estu-phone', label: 'Phone Number', val: s.phone, ph: '9876543210' },
        { id: 'estu-pct10', label: '10th Percentage', val: s.pct10 || '', ph: 'e.g. 95' },
        { id: 'estu-pct12', label: '12th / Diploma %', val: s.pct12 || '', ph: 'e.g. 92' },
        { id: 'estu-cgpa', label: 'B.E CGPA', val: s.cgpa || '', ph: 'e.g. 9.5' },
        { id: 'estu-resume', label: 'Resume URL', val: s.resume || '', ph: 'https://link-to-resume.com' }
    ];

    h += "<div style='display:flex;flex-direction:column;gap:14px'>";
    fields.forEach(f => {
        h += "<div><label style='display:block;font-size:9px;font-weight:700;color:var(--mut);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px'>" + f.label + (f.req ? ' *' : '') + "</label>";
        h += "<input type='text' id='" + f.id + "' value=\"" + (f.val || '').replace(/"/g, '&quot;') + "\" placeholder='" + f.ph + "' " + (f.readonly ? 'readonly style="opacity:.6;cursor:not-allowed"' : '') + " style='width:100%;padding:9px 13px;background:var(--surf2);border:1.5px solid var(--bd);border-radius:8px;color:var(--tx);font-size:13px;outline:none'></div>";
    });
    h += "</div>";

    h += "<div style='margin-top:24px;display:flex;gap:10px;justify-content:flex-end'>";
    h += "<button onclick='closeStuModal()' class='btn btg'>Cancel</button>";
    h += "<button onclick=\"saveStu('" + (isNew ? '' : usn) + "')\" class='btn btp'>Save Changes</button></div>";

    modal.innerHTML = h;
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeStuModal(); });
    document.body.appendChild(overlay);
}

function saveStu(oldUsn) {
    const isNew = !oldUsn;
    const usn = document.getElementById('estu-usn').value.trim();
    const name = document.getElementById('estu-name').value.trim();
    if (!usn || !name) return alert('USN and Name are required!');

    if (isNew && RAW.find(x => x.usn.toLowerCase() === usn.toLowerCase())) {
        return alert('Student with USN ' + usn + ' already exists!');
    }

    let s;
    if (isNew) {
        const times = ["10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM", "12:00 PM – 1:00 PM", "2:00 PM – 3:00 PM", "3:00 PM – 4:00 PM"];
        const sched = [];
        for (let i = 1; i <= 25; i++) sched.push({ round: i, company: '', time: times[(i - 1) % 5] || 'TBD', status: 'pending', remark: '', result: '' });
        s = { usn, name, schedule: sched };
        RAW.push(s);
    } else {
        s = RAW.find(x => x.usn === oldUsn);
        if (!s) return;
    }

    s.name = name;
    s.usn = usn;
    s.branch = document.getElementById('estu-branch').value.trim();
    s.dob = document.getElementById('estu-dob').value.trim();
    s.gender = document.getElementById('estu-gender').value.trim();
    s.email = document.getElementById('estu-email').value.trim();
    s.phone = document.getElementById('estu-phone').value.trim();
    s.pct10 = document.getElementById('estu-pct10').value.trim();
    s.pct12 = document.getElementById('estu-pct12').value.trim();
    s.cgpa = document.getElementById('estu-cgpa').value.trim();
    s.resume = document.getElementById('estu-resume').value.trim();

    if (isNew) s.password = s.dob || '01/01/2000';

    _cloudSaveStudent(s);
    alert('Student profile saved successfully!');
    closeStuModal();
    filterStu();
}

function closeStuModal() {
    const el = document.getElementById('stu-modal-overlay');
    if (el) el.remove();
}

function addStu() {
    editStu('');
}

let _expandedComp = null;
let _expandedSession = 1;
let _assignListLimit = 30; // PERFORMANCE: Limit initial render to 30 students

function renderByCompany(b) {
    const compCounts = {};
    COMPANY.forEach(c => {
        compCounts[c] = RAW.filter(s => s.schedule.slice(0, 25).some(sc => sc.company === c)).length;
    });
    const sorted = [...COMPANY].sort((a, b2) => compCounts[b2] - compCounts[a]);
    let h = "<div class='sb'><input type='text' id='comp-q' placeholder='Search company...' oninput='filterCompList()' style='flex:1;max-width:280px'><button class='btn btp' onclick='addComp()'>+ Add Company</button></div>";
    h += "<div id='comp-list-wrap'>";
    h += _buildCompanyListHTML(sorted, compCounts);
    h += "</div>";
    b.innerHTML = h;
}

function _buildCompanyListHTML(sorted, compCounts) {
    if (!compCounts) {
        compCounts = {};
        COMPANY.forEach(c => { compCounts[c] = RAW.filter(s => s.schedule.some(sc => sc.company === c)).length; });
    }
    let h = "<div class='tw'><table><thead><tr><th>#</th><th>Company Name</th><th>Room / Password</th><th>Students</th><th>Actions</th></tr></thead><tbody id='comp-tbody'>";
    sorted.forEach((c, i) => {
        const idx = COMPANY.indexOf(c);
        const room = ROOM_DATA[c] || '—';
        const isExpanded = _expandedComp === c;
        h += "<tr id='comp-row-" + idx + "'>";
        h += "<td style='color:var(--mut)'>" + (i + 1) + "</td>";
        h += "<td class='nm' style='cursor:pointer' onclick=\"toggleCompExpand('" + c.replace(/'/g, "\\'") + "')\">"
            + "<span style='margin-right:6px;font-size:11px'>" + (isExpanded ? '&#9660;' : '&#9654;') + "</span>" + c + "</td>";
        h += "<td><span style='color:var(--cyn);font-size:11px;font-weight:600'>" + room + "</span></td>";
        const safeName = c.replace(/[^a-z0-9]/gi, '_');
        h += "<td><span id='comp-cnt-" + safeName + "' style='background:var(--ind);color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700'>"
            + compCounts[c] + " students</span></td>";
        h += "<td style='white-space:nowrap'>";
        h += "<button class='btn btg bts' onclick=\"toggleCompExpand('" + c.replace(/'/g, "\\'") + "')\">&#128101; Assign Students</button> ";
        h += "<button class='btn btg bts' onclick='editComp(" + idx + ")'>Edit</button> ";
        h += "<button class='btn btg bts' style='color:var(--red)' onclick='delComp(" + idx + ")'>Del</button>";
        h += "</td></tr>";
        if (isExpanded) {
            h += "<tr id='comp-expand-" + idx + "'><td colspan='5' style='padding:0;border:none'>";
            h += _buildCompanyAssignPanel(c);
            h += "</td></tr>";
        }
    });
    h += "</tbody></table></div>";
    return h;
}

function filterCompList() {
    const q = (document.getElementById('comp-q') || { value: '' }).value.toLowerCase();
    const filtered = COMPANY.filter(c => c.toLowerCase().includes(q));
    const compCounts = {};
    COMPANY.forEach(c => { compCounts[c] = RAW.filter(s => s.schedule.some(sc => sc.company === c)).length; });
    const wrap = document.getElementById('comp-list-wrap');
    if (wrap) wrap.innerHTML = _buildCompanyListHTML(filtered, compCounts);
}

function toggleCompExpand(c) {
    _expandedComp = (_expandedComp === c) ? null : c;
    _expandedSession = 1;
    _assignListLimit = 30; // Reset limit
    changeAdminTab('c');
}

function openCompSessions(c) {
    _expandedComp = c;
    changeAdminTab('c');
}

function _buildCompanyAssignPanel(c) {
    const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
    let h = "<div onclick='event.stopPropagation()' style='background:var(--surf2);border-top:2px solid var(--ind);padding:16px 20px'>";
    h += "<div style='font-size:13px;font-weight:700;color:var(--ind);margin-bottom:12px'>&#128101; Assign Students \u2014 " + c + "</div>";
    // Session tabs
    h += "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;max-height:100px;overflow-y:auto;padding-bottom:10px'>";
    for (let sn = 1; sn <= 25; sn++) {
        const cnt = RAW.filter(s => s.schedule[sn - 1] && s.schedule[sn - 1].company === c).length;
        const active = _expandedSession === sn;
        const safeName = c.replace(/[^a-z0-9]/gi, '_');
        h += "<div id='cs-tab-" + safeName + "-" + sn + "' onclick='switchAssignSession(" + sn + ")' style='cursor:pointer;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid " + (active ? 'var(--ind)' : 'var(--bd)') + ";background:" + (active ? 'var(--ind)' : 'transparent') + ";color:" + (active ? '#fff' : 'var(--mut)') + "'>S" + sn + " (" + cnt + ")</div>";
    }
    h += "</div>";
    h += "<div id='assign-time-label' style='font-size:10px;color:var(--mut);margin-bottom:10px'>" + (times[(_expandedSession - 1) % 5] || 'TBD') + "</div>";
    // Student checklist with search
    h += "<input type='text' id='assign-stu-q' placeholder='Search students...' oninput='filterAssignStudents(this)' style='width:100%;padding:10px 14px;background:var(--surf);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font-size:12px;margin-bottom:12px;box-sizing:border-box;outline:none;box-shadow:0 2px 10px rgba(0,0,0,.1);position:relative;z-index:20'>";
    h += "<div id='assign-stu-list' style='max-height:400px;overflow-y:auto;display:block;width:100%;border:1px solid var(--bd);border-radius:8px;background:var(--surf);position:relative'>";
    h += _buildAssignStudentList(c, _expandedSession, '');
    h += "</div>";
    // Bulk actions
    h += "<div style='display:flex;gap:8px;margin-top:10px;align-items:center'>";
    h += "<button onclick=\"bulkAssignAll('" + c.replace(/'/g, "\\'") + "')\" class='btn btp bts'>&#10003; Assign All Visible</button>";
    h += "<button onclick=\"bulkClearAll('" + c.replace(/'/g, "\\'") + "')\" class='btn btg bts' style='color:var(--red)'>&#10005; Clear All</button>";
    const totalAssigned = RAW.filter(s => s.schedule[_expandedSession - 1] && s.schedule[_expandedSession - 1].company === c).length;
    const safeName = c.replace(/[^a-z0-9]/gi, '_');
    h += "<span id='cs-footer-" + safeName + "-" + _expandedSession + "' style='font-size:10px;color:var(--mut);margin-left:auto'>" + totalAssigned + " assigned to this session</span>";
    h += "</div></div>";
    return h;
}

function _buildAssignStudentList(c, sessionNum, q) {
    const sessionIdx = sessionNum - 1;
    const filtered = RAW.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.usn.toLowerCase().includes(q.toLowerCase()));
    if (filtered.length === 0) return "<div style='padding:20px;text-align:center;color:var(--mut);font-size:11px'>No students found</div>";

    // PERFORMANCE: Use the current limit to keep DOM light
    const displayList = filtered.slice(0, _assignListLimit);

    let h = "<table style='width:100%;border-collapse:collapse'><thead><tr style='background:var(--surf2);position:sticky;top:0;z-index:10;box-shadow:0 1px 0 var(--bd)'>";
    h += "<th style='padding:10px 12px;text-align:left;font-size:10px;color:var(--mut);font-weight:700'>&#9744;</th>";
    h += "<th style='padding:10px 12px;text-align:left;font-size:10px;color:var(--mut);font-weight:700'>STUDENT</th>";
    h += "<th style='padding:10px 12px;text-align:left;font-size:10px;color:var(--mut);font-weight:700'>BRANCH</th>";
    h += "<th style='padding:10px 12px;text-align:left;font-size:10px;color:var(--mut);font-weight:700'>CURRENT S" + sessionNum + "</th>";
    h += "<th style='padding:10px 12px;text-align:left;font-size:10px;color:var(--mut);font-weight:700'>ACTION</th>";
    h += "</tr></thead><tbody style='position:relative'>";
    displayList.forEach(s => {
        const sc = s.schedule[sessionIdx];
        const isAssigned = sc && sc.company === c;
        const otherComp = sc && sc.company && sc.company !== c ? sc.company : '';
        h += "<tr style='border-bottom:1px solid var(--bd)'>";
        h += "<td style='padding:8px 12px'><input type='checkbox' id='chk-" + s.usn.replace(/[^a-z0-9]/gi, '_') + "-" + sessionNum + "' " + (isAssigned ? 'checked' : '') + " onchange=\"toggleAssign('" + s.usn + "'," + sessionIdx + ",this.checked,'" + c.replace(/'/g, "\\'") + "')\"></td>";
        h += "<td style='padding:8px 12px'><div style='font-weight:600;font-size:12px;color:var(--tx)'>" + s.name + "</div><div style='font-size:9px;color:var(--mut)'>" + s.usn + "</div></td>";
        h += "<td style='padding:8px 12px;font-size:11px;color:var(--mut)'>" + (s.branch || '—') + "</td>";
        if (isAssigned) {
            h += "<td style='padding:8px 12px'><span style='background:rgba(99,102,241,.15);color:var(--ind);padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700'>This company &#10003;</span></td>";
        } else if (otherComp) {
            h += "<td style='padding:8px 12px'><span style='background:rgba(234,179,8,.12);color:var(--amb);padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700'>" + otherComp.substring(0, 14) + "</span></td>";
        } else {
            h += "<td style='padding:8px 12px'><span style='color:var(--mut);font-size:10px'>—</span></td>";
        }
        h += "<td style='padding:8px 12px'>";
        h += "<div style='display:flex;gap:4px'>";
        if (isAssigned) {
            h += "<button onclick=\"toggleAssign('" + s.usn + "'," + sessionIdx + ",false,'" + c.replace(/'/g, "\\'") + "')\" style='padding:3px 10px;border:1px solid var(--red);color:var(--red);background:transparent;border-radius:6px;font-size:10px;cursor:pointer'>Remove</button>";
        } else {
            h += "<button onclick=\"toggleAssign('" + s.usn + "'," + sessionIdx + ",true,'" + c.replace(/'/g, "\\'") + "')\" style='padding:3px 10px;border:1px solid var(--ind);color:var(--ind);background:transparent;border-radius:6px;font-size:10px;cursor:pointer'>Add</button>";
        }
        h += "<button onclick=\"editStu('" + s.usn + "')\" style='padding:3px 8px;border:1px solid var(--bd);color:var(--mut);background:transparent;border-radius:6px;font-size:10px;cursor:pointer'>Edit</button>";
        h += "</div>";
        h += "</td></tr>";
    });
    h += "</tbody></table>";
    if (filtered.length > _assignListLimit) {
        h += "<div style='padding:20px;text-align:center'><button onclick='loadMoreAssignStudents()' style='padding:8px 20px;background:rgba(99,102,241,.1);border:1.5px solid var(--ind);color:var(--indl);border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:.2s'>Load More Students (" + (filtered.length - _assignListLimit) + " left)</button></div>";
    }
    return h;
}

let _searchDebounce = null;
function filterAssignStudents(el) {
    if (!_expandedComp) return;
    const q = el ? el.value : (document.getElementById('assign-stu-q') || { value: '' }).value;

    if (_searchDebounce) clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => {
        _assignListLimit = 30; // Reset limit on new search
        _refreshAssignPanelUI(_expandedComp, _expandedSession - 1, q);
        const listEl = document.getElementById('assign-stu-list');
        if (listEl && q.length > 0) listEl.scrollTop = 0;
    }, 200);
}

function loadMoreAssignStudents() {
    if (!_expandedComp) return;
    _assignListLimit += 30;
    const q = (document.getElementById('assign-stu-q') || { value: '' }).value;
    _refreshAssignPanelUI(_expandedComp, _expandedSession - 1, q);
}

function _refreshAssignPanelUI(companyName, sessionIdx, q) {
    const listEl = document.getElementById('assign-stu-list');
    if (listEl) {
        listEl.innerHTML = _buildAssignStudentList(companyName, sessionIdx + 1, q);
        // Do NOT auto-scroll to top when merely adding/removing, only on search
    }
    const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
    const safeName = companyName.replace(/[^a-z0-9]/gi, '_');
    const tabEl = document.getElementById('cs-tab-' + safeName + '-' + (sessionIdx + 1));
    const cnt = RAW.filter(st => st.schedule[sessionIdx] && st.schedule[sessionIdx].company === companyName).length;
    if (tabEl) tabEl.textContent = 'S' + (sessionIdx + 1) + ' (' + cnt + ')';

    const footerEl = document.getElementById('cs-footer-' + safeName + '-' + (sessionIdx + 1));
    if (footerEl) footerEl.textContent = cnt + ' assigned to this session';

    const totalCntEl = document.getElementById('comp-cnt-' + safeName);
    const totalDistinct = RAW.filter(st => st.schedule.slice(0, 25).some(sc => sc.company === companyName)).length;
    if (totalCntEl) totalCntEl.textContent = totalDistinct + ' students';

    const timeLabelEl = document.getElementById('assign-time-label');
    if (timeLabelEl) timeLabelEl.textContent = (times[sessionIdx % 5] || 'TBD');
}

function switchAssignSession(sn) {
    _expandedSession = sn;
    _assignListLimit = 30; // Reset limit
    if (_expandedComp) {
        // Find the panel and refresh only that part
        const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
        const safeName = _expandedComp.replace(/[^a-z0-9]/gi, '_');

        // Update tabs active state
        for (let x = 1; x <= 25; x++) {
            const el = document.getElementById('cs-tab-' + safeName + '-' + x);
            if (el) {
                const active = x === sn;
                el.style.background = active ? 'var(--ind)' : 'transparent';
                el.style.color = active ? '#fff' : 'var(--mut)';
                el.style.borderColor = active ? 'var(--ind)' : 'var(--bd)';
            }
        }
        _refreshAssignPanelUI(_expandedComp, sn - 1, (document.getElementById('assign-stu-q') || { value: '' }).value);
    } else {
        changeAdminTab('c');
    }
}

function toggleAssign(usn, sessionIdx, assign, companyName) {
    const s = RAW.find(x => x.usn === usn);
    if (!s) return;
    if (!s.schedule[sessionIdx]) {
        const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
        s.schedule[sessionIdx] = { round: sessionIdx + 1, company: '', time: times[sessionIdx % 5] || 'TBD', status: 'pending', remark: '', result: '' };
    }
    const sc = s.schedule[sessionIdx];
    sc.company = assign ? companyName : '';
    _cloudSaveChange(usn, sessionIdx, sc);

    const q = (document.getElementById('assign-stu-q') || { value: '' }).value;
    _refreshAssignPanelUI(companyName, sessionIdx, q);
}

function bulkAssignAll(companyName) {
    const qValue = (document.getElementById('assign-stu-q') || { value: '' }).value;
    const q = qValue.toLowerCase();
    const sessionIdx = _expandedSession - 1;
    const filtered = RAW.filter(s => !q || s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));

    const batch = db.batch();
    let changeCount = 0;

    filtered.forEach(s => {
        if (!s.schedule[sessionIdx]) {
            const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
            s.schedule[sessionIdx] = { round: sessionIdx + 1, company: '', time: times[sessionIdx % 5] || 'TBD', status: 'pending', remark: '', result: '' };
        }
        if (s.schedule[sessionIdx].company !== companyName) {
            s.schedule[sessionIdx].company = companyName;
            const docId = s.usn + '_' + sessionIdx;
            const ref = db.collection('changes').doc(docId);
            const sc = s.schedule[sessionIdx];
            batch.set(ref, {
                status: sc.status || 'pending',
                result: sc.result || '',
                remark: sc.remark || '',
                company: sc.company || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            changeCount++;
        }
    });

    if (changeCount > 0) {
        batch.commit().then(() => { console.log('[Cloud] Bulk assign success'); })
            .catch(e => { console.warn('[Cloud] Bulk assign failed:', e); });
        _refreshAssignPanelUI(companyName, sessionIdx, qValue);
    }
}

function bulkClearAll(companyName) {
    if (!confirm('Remove all students from ' + companyName + ' Session ' + _expandedSession + '?')) return;
    const sessionIdx = _expandedSession - 1;
    const batch = db.batch();
    let changeCount = 0;

    RAW.forEach(s => {
        if (s.schedule[sessionIdx] && s.schedule[sessionIdx].company === companyName) {
            s.schedule[sessionIdx].company = '';
            const docId = s.usn + '_' + sessionIdx;
            const ref = db.collection('changes').doc(docId);
            const sc = s.schedule[sessionIdx];
            batch.set(ref, {
                status: sc.status || 'pending',
                result: sc.result || '',
                remark: sc.remark || '',
                company: '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            changeCount++;
        }
    });

    if (changeCount > 0) {
        batch.commit().then(() => { console.log('[Cloud] Bulk clear success'); })
            .catch(e => { console.warn('[Cloud] Bulk clear failed:', e); });
        _refreshAssignPanelUI(companyName, sessionIdx, '');
    }
}

function addComp() {
    const c = prompt("Company Name:");
    if (!c) return;
    const room = prompt("Room Number / Password for " + c + ":", DEFAULT_COMP_PWD);
    COMPANY.push(c);
    if (room) ROOM_DATA[c] = room;
    _cloudSaveCompany(c, room || DEFAULT_COMP_PWD);
    _expandedComp = c;
    _expandedSession = 1;
    changeAdminTab('c');
}

function editComp(i) {
    const n = prompt("Edit Company Name:", COMPANY[i]);
    if (n) {
        const oldName = COMPANY[i];
        const room = prompt("Room Number / Password:", ROOM_DATA[oldName] || DEFAULT_COMP_PWD);
        // Update all student schedules
        RAW.forEach(s => s.schedule.forEach(sc => { if (sc.company === oldName) sc.company = n; }));
        if (ROOM_DATA[oldName]) { ROOM_DATA[n] = ROOM_DATA[oldName]; delete ROOM_DATA[oldName]; }
        COMPANY[i] = n;
        if (room) ROOM_DATA[n] = room;
        _cloudDeleteCompany(oldName);
        _cloudSaveCompany(n, room || DEFAULT_COMP_PWD);
        if (_expandedComp === oldName) _expandedComp = n;
        changeAdminTab('c');
    }
}

function delComp(i) {
    if (confirm('Delete ' + COMPANY[i] + '? This will remove all student assignments for this company.')) {
        const name = COMPANY[i];
        RAW.forEach(s => s.schedule.forEach(sc => { if (sc.company === name) sc.company = ''; }));
        COMPANY.splice(i, 1);
        delete ROOM_DATA[name];
        _cloudDeleteCompany(name);
        if (_expandedComp === name) _expandedComp = null;
        changeAdminTab('c');
    }
}

function renderCredentials(b) {
    let h = "<div style='display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px'>";
    h += "<div style='font-size:13px;font-weight:700;color:var(--tx);flex:1'>Company Credentials &amp; Password Management</div>";
    h += "<input type='text' id='cred-stuq' placeholder='Search student...' oninput='filterCredStudents()' style='padding:7px 12px;background:var(--surf2);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font-size:11px;width:200px'>";
    h += "<button class='btn btp' onclick=\"dlCSV('creds')\">&#128196; Download CSV</button></div>";
    // Company credentials table
    h += "<div class='card' style='margin-bottom:16px'>";
    h += "<div class='ctit'><div class='dot'></div>COMPANY CREDENTIALS</div>";
    h += "<div class='tw'><table><thead><tr><th>Company</th><th>Login ID</th><th>Password / Room</th><th>Actions</th></tr></thead><tbody>";
    COMPANY.forEach((c, i) => {
        const pwd = ROOM_DATA[c] || DEFAULT_COMP_PWD;
        h += "<tr>";
        h += "<td class='nm'>" + c + "</td>";
        h += "<td class='us' style='color:var(--cyn)'>" + c.toLowerCase().replace(/\s+/g, '') + "</td>";
        h += "<td><span id='cpwd-" + i + "' class='mu' style='color:var(--ind);font-weight:700'>" + pwd + "</span></td>";
        h += "<td style='white-space:nowrap'>";
        h += "<button class='btn btg bts' onclick='updateCompPw(" + i + ")'>&#128273; Change Pwd</button> ";
        h += "<button class='btn btg bts' onclick='resetCompPw(" + i + ")'>&#8635; Reset Pwd</button>";
        h += "</td></tr>";
    });
    h += "</tbody></table></div></div>";
    // Student credentials table
    h += "<div class='card'>";
    h += "<div class='ctit'><div class='dot'></div>STUDENT CREDENTIALS</div>";
    h += "<div id='cred-stu-table' class='tw'><div id='cred-list-wrap'></div></div></div>";
    b.innerHTML = h;
    _assignListLimit = 30; // Reset limit for credentials tab
    filterCreds();
}

function _renderCredStudents(q) {
    const list = RAW.filter(s => !q || s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));

    // Performance: Limit to current _assignListLimit (sharing the state is fine here)
    const slice = list.slice(0, _assignListLimit);

    let h = "<table><thead><tr><th>#</th><th>Student</th><th>Branch</th><th>Password</th><th>Actions</th></tr></thead><tbody>";
    slice.forEach((s, idx) => {
        h += "<tr>";
        h += "<td style='color:var(--mut)'>" + (idx + 1) + "</td>";
        h += "<td><div class='nm'>" + s.name + "</div><div class='us'>" + s.usn + "</div></td>";
        h += "<td>" + (s.branch || '-') + "</td>";
        h += "<td><div style='display:flex;align-items:center;gap:6px'><code style='background:rgba(99,102,241,.1);padding:2px 6px;border-radius:4px;color:var(--indl);font-size:10px'>" + s.password + "</code><span onclick=\"copyText('" + s.password + "')\" style='cursor:pointer;opacity:.5'>&#10697;</span></div></td>";
        h += "<td><button class='btn btp bts' onclick=\"editStu('" + s.usn + "')\">Edit</button> <button class='btn btg bts' style='color:var(--red)' onclick=\"delStu('" + s.usn + "')\">Del</button></td>";
        h += "</tr>";
    });
    h += "</tbody></table>";

    if (list.length > _assignListLimit) {
        h += "<div style='padding:15px;text-align:center'><button onclick='loadMoreCredStudents()' style='padding:6px 16px;background:transparent;border:1px solid var(--bd2);color:var(--mut);border-radius:20px;font-size:10px;cursor:pointer'>Show More (" + (list.length - _assignListLimit) + " left)</button></div>";
    }
    return h;
}

function loadMoreCredStudents() {
    _assignListLimit += 50;
    filterCreds();
}

function filterCreds() {
    const q = (document.getElementById('cred-q') || { value: '' }).value.toLowerCase();
    const wrap = document.getElementById('cred-list-wrap');
    if (wrap) wrap.innerHTML = _renderCredStudents(q);
}

function filterCredStudents() {
    const q = (document.getElementById('cred-stuq') || { value: '' }).value.toLowerCase();
    _renderCredStudents(q);
}

function updateCompPw(i) {
    const c = COMPANY[i];
    const cur = ROOM_DATA[c] || DEFAULT_COMP_PWD;
    const np = prompt('New password for ' + c + ':', cur);
    if (np && np !== cur) {
        ROOM_DATA[c] = np;
        _cloudSaveCompanyPassword(c, np);
        const el = document.getElementById('cpwd-' + i);
        if (el) el.textContent = np;
        alert('Password for ' + c + ' updated to: ' + np);
    }
}

function resetCompPw(i) {
    const c = COMPANY[i];
    const defPwd = DEFAULT_COMP_PWD;
    if (!confirm('Reset password for ' + c + ' to "' + defPwd + '"?')) return;
    ROOM_DATA[c] = defPwd;
    _cloudSaveCompanyPassword(c, defPwd);
    const el = document.getElementById('cpwd-' + i);
    if (el) el.textContent = defPwd;
    alert('Password for ' + c + ' reset to: ' + defPwd);
}

function updatePwCred(u) {
    const s = RAW.find(x => x.usn === u);
    const np = prompt('New password for ' + s.name + ':', s.password);
    if (np && np !== s.password) {
        s.password = np;
        _cloudSavePassword(u, np);
        alert('Password updated to: ' + np);
        _renderCredStudents((document.getElementById('cred-stuq') || { value: '' }).value.toLowerCase());
    }
}

function resetPCred(u) {
    const s = RAW.find(x => x.usn === u);
    const dp = s.dob || '01/01/2000';
    s.password = dp;
    _cloudSavePassword(u, dp);
    alert('Password for ' + s.name + ' reset to DOB: ' + dp);
    _renderCredStudents((document.getElementById('cred-stuq') || { value: '' }).value.toLowerCase());
}

function renderReports(b) {
    let h = "<div class='card'><div class='ctit'><div class='dot'></div>Generate Reports</div>";
    h += "<div class='sb' style='flex-wrap:wrap;gap:10px'><select id='rep-sel'><option value=''>Select Company...</option>";
    COMPANY.forEach(c => { h += "<option value=\"" + c + "\">" + c + "</option>"; });
    h += "</select><button class='btn btp' onclick=\"dlPDF('comp')\">&#128196; Download Company PDF</button>";
    h += "<button class='btn btg' onclick=\"dlCSV('comp')\">Download CSV</button>";
    h += "<button class='btn btg' onclick='dlPlacedStudentsCSV()' style='background:var(--grn);border-color:var(--grn);color:#fff'>Download Placed Students (Distinct CSV)</button>";
    h += "<button class='btn btp' style='background:linear-gradient(135deg, var(--ind), var(--indl));margin-left:auto' onclick=\"dlAllCompaniesSummary()\">&#128196; Download Every Report (Global CSV)</button></div></div>";
    b.innerHTML = h;
}

function dlAllCompaniesSummary() {
    let csv = "USN,Name,Branch,Email,Session,Company,Attendance,Result,Remark\n";
    RAW.forEach(s => {
        s.schedule.forEach((sc, i) => {
            if (sc.company) {
                const statusLabel = sc.status === 'selection' ? 'Present' : (sc.status === 'rejected' ? 'Absent' : 'Pending');
                const resultLabel = sc.result === 'selected' ? 'Selected' : (sc.result === 'rejected' ? 'Rejected' : (sc.result === 'next_round' ? 'Next Round' : 'No Decision'));
                csv += `"${s.usn}","${s.name}","${s.branch || ''}","${s.email || ''}",${i + 1},"${sc.company}","${statusLabel}","${resultLabel}","${(sc.remark || '').replace(/"/g, '""')}"\n`;
            }
        });
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = "all_placement_reports_summary.csv";
    a.click();
}

function dlPlacedStudentsCSV() {
    const placed = RAW.filter(s => s.schedule.slice(0, 25).some(sc => sc.result === 'selected'));
    if (placed.length === 0) { alert("No students found with 'Selected' result."); return; }
    const rows = placed.map(s => {
        const selections = s.schedule.slice(0, 25).filter(sc => sc.result === 'selected').map(sc => sc.company).filter(Boolean);
        const uniqueComps = [...new Set(selections)].join(' | ');
        return '"' + s.usn + '","' + s.name + '","' + (s.branch || '') + '","' + uniqueComps + '"';
    });
    const csv = "USN,Name,Branch,Placed Companies\n" + rows.join("\n");
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = "placed_students_distinct_" + new Date().toISOString().split('T')[0] + ".csv";
    a.click();
}

function dlCSV(type) {
    let csv = "", fn = "";
    if (type === 'creds') {
        csv = "Company,LoginID,Password\n" + COMPANY.map(c => '"' + c + '","' + c.toLowerCase().replace(/\s+/g, '') + '","' + (ROOM_DATA[c] || DEFAULT_COMP_PWD) + '"').join("\n");
        fn = "company_credentials.csv";
    } else if (type === 'all') {
        csv = "USN,Name,Branch,Email,DOB,CGPA\n" + RAW.map(s => '"' + s.usn + '","' + s.name + '","' + s.branch + '","' + s.email + '","' + s.dob + '","' + s.cgpa + '"').join("\n");
        fn = "all_students.csv";
    } else if (type === 'comp') {
        const c = document.getElementById('rep-sel') && document.getElementById('rep-sel').value;
        if (!c) return alert('Select company');
        const rows = RAW.filter(s => s.schedule.some(sc => sc.company === c)).map(s => {
            const sc = s.schedule.find(x => x.company === c);
            const statusLabel = sc.status === 'selection' ? 'Present' : (sc.status === 'rejected' ? 'Absent' : 'Pending');
            const resultLabel = sc.result === 'selected' ? 'Selected' : (sc.result === 'rejected' ? 'Rejected' : (sc.result === 'next_round' ? 'Next Round' : ''));
            return '"' + s.usn + '","' + s.name + '","' + s.branch + '","' + s.email + '",' + (s.schedule.indexOf(sc) + 1) + ',"' + statusLabel + '","' + resultLabel + '","' + sc.remark + '"';
        });
        csv = "USN,Name,Branch,Email,Session,Attendance,Result,Remark\n" + rows.join("\n");
        fn = "list_" + c.replace(/[^a-z0-9]/gi, '_') + ".csv";
    }
    if (!csv) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = fn; a.click();
}

// ── PDF GENERATION ────────────────────────────────────────────────────────────
function dlPDF(type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210, ph = 297, mx = 14, my = 14;
    const cw = pw - 2 * mx;

    if (type === 'comp') {
        const c = document.getElementById('rep-sel') && document.getElementById('rep-sel').value;
        if (!c) return alert('Select company');
        _buildCompanyPDF(doc, c, pw, ph, mx, my, cw);
        doc.save('report_' + c.replace(/[^a-z0-9]/gi, '_') + '.pdf');
    } else if (type === 'all') {
        // All students PDF — grouped by session usage
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Placement Drive 2026 — All Students', mx, my + 6);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Total Students: ' + RAW.length + ' | Companies: ' + COMPANY.length, mx, my + 12);

        let y = my + 20;
        const colW = [8, 28, 50, 35, 18, 30];
        const headers = ['#', 'USN', 'Name', 'Branch', 'CGPA', 'Email'];
        // Draw header
        doc.setFillColor(30, 37, 64);
        doc.rect(mx, y - 4, cw, 7, 'F');
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(228, 232, 255);
        let cx = mx + 2;
        headers.forEach((h, i) => { doc.text(h, cx, y); cx += colW[i]; });
        y += 5;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);

        RAW.forEach((s, idx) => {
            if (y > ph - 15) {
                doc.addPage();
                y = my;
                doc.setFillColor(30, 37, 64);
                doc.rect(mx, y - 4, cw, 7, 'F');
                doc.setFont(undefined, 'bold');
                doc.setTextColor(228, 232, 255);
                cx = mx + 2;
                headers.forEach((h, i) => { doc.text(h, cx, y); cx += colW[i]; });
                y += 5;
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
            }
            if (idx % 2 === 0) {
                doc.setFillColor(245, 245, 250);
                doc.rect(mx, y - 3.5, cw, 5, 'F');
            }
            cx = mx + 2;
            doc.text(String(idx + 1), cx, y); cx += colW[0];
            doc.text(s.usn || '', cx, y); cx += colW[1];
            doc.text((s.name || '').substring(0, 30), cx, y); cx += colW[2];
            doc.text((s.branch || '').substring(0, 22), cx, y); cx += colW[3];
            doc.text(String(s.cgpa || '—'), cx, y); cx += colW[4];
            doc.text((s.email || '').substring(0, 28), cx, y);
            y += 5;
        });

        doc.save('all_students_report.pdf');
    }
}

function _buildCompanyPDF(doc, companyName, pw, ph, mx, my, cw) {
    const sessions = [];
    for (let i = 1; i <= 25; i++) sessions.push(i);
    const times = [
        "10:00 AM – 11:00 AM",
        "11:00 AM – 12:00 PM",
        "12:00 PM – 1:00 PM",
        "2:00 PM – 3:00 PM",
        "3:00 PM – 4:00 PM"
    ];
    const room = ROOM_DATA[companyName] || '—';

    sessions.forEach((sn, pageIdx) => {
        if (pageIdx > 0) doc.addPage();
        const list = RAW.filter(s => {
            const sc = s.schedule[sn - 1];
            return sc && sc.company === companyName;
        });

        // Page header
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(companyName, mx, my + 6);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Session ' + sn + ' | ' + times[sn - 1] + ' | Room: ' + room, mx, my + 12);
        doc.text('Students: ' + list.length, mx, my + 17);

        // Draw line
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(0.5);
        doc.line(mx, my + 19, mx + cw, my + 19);

        let y = my + 25;
        const colW = [8, 28, 50, 35, 18, 22];
        const headers = ['#', 'USN', 'Name', 'Branch', 'CGPA', 'Status'];

        // Table header
        doc.setFillColor(30, 37, 64);
        doc.rect(mx, y - 4, cw, 7, 'F');
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(228, 232, 255);
        let cx = mx + 2;
        headers.forEach((h, i) => { doc.text(h, cx, y); cx += colW[i]; });
        y += 5;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');

        if (list.length === 0) {
            doc.setFontSize(9);
            doc.text('No students allocated for this session', mx + cw / 2 - 30, y + 10);
        } else {
            list.forEach((s, idx) => {
                if (y > ph - 15) {
                    doc.addPage();
                    y = my;
                    doc.setFillColor(30, 37, 64);
                    doc.rect(mx, y - 4, cw, 7, 'F');
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(228, 232, 255);
                    cx = mx + 2;
                    headers.forEach((h, i) => { doc.text(h, cx, y); cx += colW[i]; });
                    y += 5;
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                }
                const sc = s.schedule[sn - 1];
                if (idx % 2 === 0) {
                    doc.setFillColor(245, 245, 250);
                    doc.rect(mx, y - 3.5, cw, 5, 'F');
                }
                cx = mx + 2;
                doc.text(String(idx + 1), cx, y); cx += colW[0];
                doc.text(s.usn || '', cx, y); cx += colW[1];
                doc.text((s.name || '').substring(0, 30), cx, y); cx += colW[2];
                doc.text((s.branch || '').substring(0, 22), cx, y); cx += colW[3];
                doc.text(String(s.cgpa || '\u2014'), cx, y); cx += colW[4];
                const statusTxt = sc ? (sc.status === 'selection' ? 'Present' : (sc.status === 'rejected' ? 'Absent' : 'Pending')) : 'Pending';
                const resultTxt = sc && sc.result ? (sc.result === 'selected' ? 'Sel' : (sc.result === 'rejected' ? 'Rej' : 'Next')) : '';
                doc.text(statusTxt + (resultTxt ? ' / ' + resultTxt : ''), cx, y);
                y += 5;
            });
        }

        // Page footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('Page ' + (pageIdx + 1) + ' of 5 | Placement Drive Portal 2026', mx, ph - 8);
        doc.setTextColor(0, 0, 0);
    });
}

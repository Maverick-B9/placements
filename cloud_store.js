// ── FIREBASE CLOUD STORE ─────────────────────────────────────────────────────
// Replaces localStorage with Firebase Firestore so all users see the same data

const firebaseConfig = {
    apiKey: "AIzaSyB7PM2rq6KLU9pNb9mLGka7fVieTbNqJJI",
    authDomain: "placements-portal-fd023.firebaseapp.com",
    projectId: "placements-portal-fd023",
    storageBucket: "placements-portal-fd023.firebasestorage.app",
    messagingSenderId: "490471988056",
    appId: "1:490471988056:web:92de26c3f3f22ed4a2232d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── SAVE a single schedule change to Firestore ──────────────────────────────
function _cloudSaveChange(usn, sessionIdx, sc) {
    const docId = usn + '_' + sessionIdx;
    db.collection('changes').doc(docId).set({
        status: sc.status || 'pending',
        result: sc.result || '',
        remark: sc.remark || '',
        company: sc.company || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (e) { console.warn('[Cloud] Save failed:', e); });
}

// ── SAVE student password to Firestore ──────────────────────────────────────
function _cloudSavePassword(usn, password) {
    db.collection('student_passwords').doc(usn).set({
        password: password,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (e) { console.warn('[Cloud] Password save failed:', e); });
}

// ── SAVE company password to Firestore ──────────────────────────────────────
function _cloudSaveCompanyPassword(company, password) {
    const docId = company.toLowerCase().replace(/\s+/g, '_');
    db.collection('company_passwords').doc(docId).set({
        company: company,
        password: password,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (e) { console.warn('[Cloud] Company password save failed:', e); });
}

// ── SAVE student-company assignment to Firestore ─────────────────────────────
function _cloudSaveAssignment(usn, sessionIdx, companyName) {
    const docId = usn + '_' + sessionIdx;
    db.collection('changes').doc(docId).set({
        company: companyName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(function (e) { console.warn('[Cloud] Assignment save failed:', e); });
}

// ── SAVE a new custom student to Firestore ───────────────────────────────────
function _cloudSaveStudent(student) {
    db.collection('custom_students').doc(student.usn).set({
        usn: student.usn,
        name: student.name || '',
        branch: student.branch || '',
        dob: student.dob || '',
        password: student.password || '',
        gender: student.gender || '',
        email: student.email || '',
        phone: student.phone || '',
        pct10: student.pct10 || '',
        pct12: student.pct12 || '',
        cgpa: student.cgpa || '',
        resume: student.resume || '',
        schedule: JSON.stringify(student.schedule || []),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () { console.log('[Cloud] Student saved:', student.usn); })
        .catch(function (e) { console.warn('[Cloud] Student save failed:', e); });
}

// ── DELETE a student (track deletion in Firestore) ───────────────────────────
function _cloudDeleteStudent(usn) {
    db.collection('deleted_students').doc(usn).set({
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (e) { console.warn('[Cloud] Student delete track failed:', e); });
    // Also remove from custom_students if it was a custom one
    db.collection('custom_students').doc(usn).delete().catch(function () { });
}

// ── SAVE a new custom company to Firestore ───────────────────────────────────
function _cloudSaveCompany(name, roomPwd) {
    var docId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    db.collection('custom_companies').doc(docId).set({
        name: name,
        room: roomPwd || 'company123',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () { console.log('[Cloud] Company saved:', name); })
        .catch(function (e) { console.warn('[Cloud] Company save failed:', e); });
}

// ── DELETE a company (track deletion in Firestore) ───────────────────────────
function _cloudDeleteCompany(name) {
    var docId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    db.collection('deleted_companies').doc(docId).set({
        name: name,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (e) { console.warn('[Cloud] Company delete track failed:', e); });
    // Also remove from custom_companies if it was a custom one
    db.collection('custom_companies').doc(docId).delete().catch(function () { });
}

// ── LOAD all changes from Firestore and apply to RAW ────────────────────────
function _cloudLoadAllChanges(callback) {
    var appliedChanges = 0;
    var appliedPasswords = 0;
    var appliedCompanyPwds = 0;
    var addedStudents = 0;
    var addedCompanies = 0;
    var deletedStudents = 0;
    var deletedCompanies = 0;

    // Phase 1: Load deletions and custom additions FIRST
    var pDelStu = db.collection('deleted_students').get().then(function (snapshot) {
        snapshot.forEach(function (doc) {
            var idx = RAW.findIndex(function (x) { return x.usn === doc.id; });
            if (idx !== -1) { RAW.splice(idx, 1); deletedStudents++; }
        });
    });

    var pDelComp = db.collection('deleted_companies').get().then(function (snapshot) {
        snapshot.forEach(function (doc) {
            var data = doc.data();
            var name = data.name || '';
            var idx = COMPANY.indexOf(name);
            if (idx !== -1) { COMPANY.splice(idx, 1); deletedCompanies++; }
            delete ROOM_DATA[name];
        });
    });

    var pAddStu = db.collection('custom_students').get().then(function (snapshot) {
        snapshot.forEach(function (doc) {
            var data = doc.data();
            if (!RAW.find(function (x) { return x.usn === data.usn; })) {
                var sched = [];
                try { sched = JSON.parse(data.schedule || '[]'); } catch (e) { sched = []; }
                RAW.push({
                    usn: data.usn, name: data.name || '', branch: data.branch || '',
                    dob: data.dob || '', password: data.password || data.dob || '01/01/2000',
                    gender: data.gender || '', email: data.email || '', phone: data.phone || '',
                    pct10: data.pct10 || '', pct12: data.pct12 || '', cgpa: data.cgpa || '',
                    resume: data.resume || '', schedule: sched
                });
                addedStudents++;
            }
        });
    });

    var pAddComp = db.collection('custom_companies').get().then(function (snapshot) {
        snapshot.forEach(function (doc) {
            var data = doc.data();
            if (data.name && COMPANY.indexOf(data.name) === -1) {
                COMPANY.push(data.name);
                addedCompanies++;
            }
            if (data.name && data.room) {
                ROOM_DATA[data.name] = data.room;
            }
        });
    });

    // Wait for phase 1 (deletions + additions)
    Promise.all([pDelStu, pDelComp, pAddStu, pAddComp]).then(function () {
        // Phase 2: Load changes, passwords (applied on top of the merged data)
        var p1 = db.collection('changes').get().then(function (snapshot) {
            snapshot.forEach(function (doc) {
                var data = doc.data();
                var parts = doc.id.split('_');
                var sessionIdx = parseInt(parts.pop());
                var usn = parts.join('_');
                var s = RAW.find(function (x) { return x.usn === usn; });
                if (s) {
                    if (!s.schedule[sessionIdx]) {
                        const times = ["10:00 AM\u201311:00 AM", "11:00 AM\u201312:00 PM", "12:00 PM\u20131:00 PM", "2:00 PM\u20133:00 PM", "3:00 PM\u20134:00 PM"];
                        s.schedule[sessionIdx] = { round: sessionIdx + 1, company: '', time: times[sessionIdx % 5] || 'TBD', status: 'pending', remark: '', result: '' };
                    }
                    if (data.status) s.schedule[sessionIdx].status = data.status;
                    if (data.result !== undefined) s.schedule[sessionIdx].result = data.result;
                    if (data.remark !== undefined) s.schedule[sessionIdx].remark = data.remark;
                    if (data.company !== undefined) s.schedule[sessionIdx].company = data.company;
                    appliedChanges++;
                }
            });
        });

        var p2 = db.collection('student_passwords').get().then(function (snapshot) {
            snapshot.forEach(function (doc) {
                var data = doc.data();
                var usn = doc.id;
                var s = RAW.find(function (x) { return x.usn === usn; });
                if (s && data.password) {
                    s.password = data.password;
                    appliedPasswords++;
                }
            });
        });

        var p3 = db.collection('company_passwords').get().then(function (snapshot) {
            snapshot.forEach(function (doc) {
                var data = doc.data();
                if (data.company && data.password) {
                    ROOM_DATA[data.company] = data.password;
                    appliedCompanyPwds++;
                }
            });
        });

        return Promise.all([p1, p2, p3]);
    }).then(function () {
        console.log('[Cloud] Restored: ' + addedStudents + ' students, ' + addedCompanies + ' companies added; ' + deletedStudents + ' students, ' + deletedCompanies + ' companies deleted; ' + appliedChanges + ' changes, ' + appliedPasswords + ' student pwds, ' + appliedCompanyPwds + ' company pwds');
        if (callback) callback();
    }).catch(function (e) {
        console.warn('[Cloud] Failed to load data:', e);
        if (callback) callback();
    });
}

// Activity logs are kept in-memory only (per browser session)
// Only status, result, remark, company assignment, passwords, students, and companies are persisted to Firestore

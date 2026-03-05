
import re
import json

def normalize_dob_to_password(dob):
    if not dob:
        return "12/34/5678" # Fallback if empty
    # Extract digits and common separators
    parts = re.split(r'[\/\-\s\.]+', dob.strip())
    if len(parts) >= 3:
        d, m, y = parts[0].zfill(2), parts[1].zfill(2), parts[2]
        if len(y) == 2:
            y = "20" + y # Simple assumption for 21st century
        return f"{d}/{m}/{y}"
    return dob.strip()

def upgrade_portal():
    with open('Placement_Drive_Portal.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Extract and update Students (RAW)
    raw_match = re.search(r'const RAW\s*=\s*(\[.*?\]);', html, re.DOTALL)
    if not raw_match:
        print("Could not find RAW data")
        return
    
    students = json.loads(raw_match.group(1))
    
    # Session mapping
    # 1: 10AM-11AM, 2: 11AM-12PM, 3: 12PM-1PM, 4: 2PM-3PM, 5: 3PM-4PM
    times = [
        "10:00 AM – 11:00 AM",
        "11:00 AM – 12:00 PM",
        "12:00 PM – 1:00 PM",
        "2:00 PM – 3:00 PM",
        "3:00 PM – 4:00 PM"
    ]

    for s in students:
        # Set password to DOB
        s['password'] = normalize_dob_to_password(s.get('dob', ''))
        # Update schedule timings
        if 'schedule' in s:
            for i, session in enumerate(s['schedule']):
                if i < len(times):
                    session['time'] = times[i]
                # Note: internal key stays 'round' for compatibility with existing code if needed, 
                # but we'll display as 'Session'

    # 2. Extract Companies
    comp_match = re.search(r'const COMPANY\s*=\s*(\[.*?\]);', html, re.DOTALL)
    if comp_match:
        companies = json.loads(comp_match.group(1))
    else:
        companies = []

    # 3. Build the new Script Logic
    # We will replace the entire script section from after constants
    # But first, let's update some HTML strings in the body
    
    # Replace "Round" with "Session" in visible HTML
    html = html.replace('>Round<', '>Session<')
    html = html.replace(' Round ', ' Session ')
    html = html.replace('Round 1', 'Session 1')
    html = html.replace('Round 2', 'Session 2')
    html = html.replace('Round 3', 'Session 3')
    html = html.replace('Round 4', 'Session 4')
    html = html.replace('Round 5', 'Session 5')
    
    # Update login hint
    html = html.replace('Default password is your USN in lowercase', 'Default password is your Date of Birth (DD/MM/YYYY)')
    html = html.replace('placeholder="Default: USN in lowercase"', 'placeholder="DD/MM/YYYY"')

    # Inject the new constants and large logic block
    new_constants = f"const RAW = {json.dumps(students)};\nconst COMPANY = {json.dumps(companies)};"
    
    # Find the start and end of the constants in the original script
    # We'll replace the script block entirely for simplicity and to add features
    
    script_content = """
let CUR = null;
const STATE = { view: 'home' };

function show(id) {
    ['sh','lf-s','lf-c','lf-a','vs','vc','va'].forEach(v => document.getElementById(v).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function login(role) {
    const u = document.getElementById(`u-${role[0]}`).value.trim();
    const p = document.getElementById(`p-${role[0]}`).value.trim();
    if (role === 'student') {
        const s = RAW.find(x => x.usn.toLowerCase() === u.toLowerCase() && x.password === p);
        if (s) { CUR = s; renderStudent(); show('vs'); } else alert('Invalid Credentials');
    } else if (role === 'company') {
        const c = COMPANY.find(x => x.toLowerCase().includes(u.toLowerCase()) && p === 'company123');
        if (c) { CUR = c; renderCompany(); show('vc'); } else alert('Invalid Credentials');
    } else if (role === 'admin') {
        if (u === 'admin' && p === 'admin123') { renderAdmin(); show('va'); } else alert('Invalid Credentials');
    }
}

function logout() { CUR = null; show('sh'); }

function renderStudent() {
    let h = `<h2>Welcome, ${CUR.name}</h2><div class='card'><p><b>USN:</b> ${CUR.usn}</p><p><b>Branch:</b> ${CUR.branch}</p></div>`;
    h += `<h3>Your Placement Session Schedule</h3><table><tr><th>Session</th><th>Company</th><th>Time</th><th>Status</th><th>Remark</th></tr>`;
    CUR.schedule.forEach((s, i) => {
        h += `<tr><td>${i+1}</td><td>${s.company || '-'}</td><td>${s.time}</td><td><span class='badge badge-${s.status}'>${s.status}</span></td><td>${s.remark || '-'}</td></tr>`;
    });
    h += `</table><button onclick='logout()'>Logout</button>`;
    document.getElementById('vs').innerHTML = h;
}

function renderCompany() {
    let h = `<h2>Company Dashboard: ${CUR}</h2>`;
    const list = RAW.filter(s => s.schedule.some(sc => sc.company === CUR));
    h += `<h3>Allocated Students (${list.length})</h3><table><tr><th>USN</th><th>Name</th><th>Session</th><th>Time</th><th>Status</th><th>Action</th></tr>`;
    list.forEach(s => {
        const sc = s.schedule.find(x => x.company === CUR);
        h += `<tr><td>${s.usn}</td><td>${s.name}</td><td>${s.schedule.indexOf(sc)+1}</td><td>${sc.time}</td>
        <td><span class='badge badge-${sc.status}'>${sc.status}</span></td>
        <td><button onclick="updateStatus('${s.usn}', '${sc.status}')">Update</button></td></tr>`;
    });
    h += `</table><button onclick='logout()'>Logout</button>`;
    document.getElementById('vc').innerHTML = h;
}

function updateStatus(usn, curStatus) {
    const status = prompt("Enter Status (pending, selection, rejected):", curStatus);
    if (status && ['pending', 'selection', 'rejected'].includes(status)) {
        const s = RAW.find(x => x.usn === usn);
        const sc = s.schedule.find(x => x.company === CUR);
        sc.status = status;
        sc.remark = prompt("Enter Remark:", sc.remark || "");
        renderCompany();
    }
}

// ADMIN FEATURES
function renderAdmin() {
    let h = `<h2>Admin Control Panel</h2>
    <div class='tabs' style='margin-bottom:20px;'>
        <button onclick="changeAdminTab('students')">Manage Students</button>
        <button onclick="changeAdminTab('companies')">Manage Companies</button>
        <button onclick="changeAdminTab('creds')">Company Credentials</button>
        <button onclick="changeAdminTab('reports')">Downloads/Reports</button>
    </div>
    <div id='admin-content'></div>
    <button onclick='logout()'>Logout</button>`;
    document.getElementById('va').innerHTML = h;
    changeAdminTab('students');
}

function changeAdminTab(tab) {
    const div = document.getElementById('admin-content');
    if (tab === 'students') {
        let h = `<h3>Manage Students <button onclick="addStudent()">+ Add Student</button></h3>
        <input type="text" id="stu-search" placeholder="Search USN or Name..." onkeyup="filterStudents()">
        <div id="admin-stu-list" style="max-height:400px; overflow-y:auto;"></div>`;
        div.innerHTML = h;
        filterStudents();
    } else if (tab === 'companies') {
        let h = `<h3>Manage Companies <button onclick="addCompany()">+ Add Company</button></h3>
        <table><tr><th>Index</th><th>Company Name</th><th>Actions</th></tr>`;
        COMPANY.forEach((c, i) => {
            h += `<tr><td>${i+1}</td><td>${c}</td><td>
                <button onclick="editCompany(${i})">Edit</button>
                <button onclick="deleteCompany(${i})" style="background:red;">Delete</button>
            </td></tr>`;
        });
        h += `</table>`;
        div.innerHTML = h;
    } else if (tab === 'creds') {
        let h = `<h3>Company Login Credentials</h3>
        <table><tr><th>Company</th><th>Login ID</th><th>Password</th></tr>`;
        COMPANY.forEach(c => {
            h += `<tr><td>${c}</td><td>${c.toLowerCase().replace(/\\s+/g, '')}</td><td>company123</td></tr>`;
        });
        h += `</table><button onclick="downloadCreds()">Download Credentials CSV</button>`;
        div.innerHTML = h;
    } else if (tab === 'reports') {
        let h = `<h3>Download Student Lists</h3>
        <select id="rep-comp"><option value="">Select Company</option>`;
        COMPANY.forEach(c => h += `<option value="${c}">${c}</option>`);
        h += `</select> <button onclick="downloadCompList()">Download Company Wise List</button>
        <hr>
        <button onclick="downloadAllStudents()">Download All Students Data</button>`;
        div.innerHTML = h;
    }
}

function filterStudents() {
    const q = document.getElementById('stu-search').value.toLowerCase();
    const list = RAW.filter(s => s.usn.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    let h = `<table><tr><th>USN</th><th>Name</th><th>Password (DOB)</th><th>Actions</th></tr>`;
    list.forEach(s => {
        h += `<tr><td>${s.usn}</td><td>${s.name}</td><td>${s.password}</td><td>
            <button onclick="editStudent('${s.usn}')">Edit</button>
            <button onclick="resetPass('${s.usn}')">Reset Pass</button>
            <button onclick="deleteStudent('${s.usn}')" style="background:red;">Delete</button>
        </td></tr>`;
    });
    h += `</table>`;
    document.getElementById('admin-stu-list').innerHTML = h;
}

function addStudent() {
    const usn = prompt("Enter USN:");
    if (!usn) return;
    const name = prompt("Enter Name:");
    const dob = prompt("Enter DOB (DD/MM/YYYY):");
    const pass = dob || '01/01/2000';
    RAW.push({
        id: RAW.length + 1, usn, name, dob, password: pass, branch: 'General', 
        schedule: [1,2,3,4,5].map(i => ({ round: i, company: '', time: '', status: 'pending', remark: '' }))
    });
    changeAdminTab('students');
}

function editStudent(usn) {
    const s = RAW.find(x => x.usn === usn);
    const n = prompt("Edit Name:", s.name);
    if (n) s.name = n;
    const b = prompt("Edit Branch:", s.branch);
    if (b) s.branch = b;
    filterStudents();
}

function resetPass(usn) {
    const s = RAW.find(x => x.usn === usn);
    s.password = s.dob || '01/01/2000';
    alert('Password reset to DOB: ' + s.password);
    filterStudents();
}

function deleteStudent(usn) {
    if (confirm('Delete student ' + usn + '?')) {
        const i = RAW.findIndex(x => x.usn === usn);
        RAW.splice(i, 1);
        filterStudents();
    }
}

function addCompany() {
    const c = prompt("Enter Company Name:");
    if (c) { COMPANY.push(c); changeAdminTab('companies'); }
}

function editCompany(i) {
    const n = prompt("Edit Company Name:", COMPANY[i]);
    if (n) { COMPANY[i] = n; changeAdminTab('companies'); }
}

function deleteCompany(i) {
    if (confirm('Delete company ' + COMPANY[i] + '?')) {
        COMPANY.splice(i, 1);
        changeAdminTab('companies');
    }
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadCreds() {
    let csv = "Company,LoginID,Password\\n";
    COMPANY.forEach(c => {
        csv += `"${c}","${c.toLowerCase().replace(/\\s+/g, '')}","company123"\\n`;
    });
    downloadCSV(csv, 'company_credentials.csv');
}

function downloadCompList() {
    const c = document.getElementById('rep-comp').value;
    if (!c) return alert('Select a company');
    let csv = "USN,Name,Branch,Email,Phone,Session,Time,Status,Remark\\n";
    RAW.forEach(s => {
        const sc = s.schedule.find(x => x.company === c);
        if (sc) {
            csv += `"${s.usn}","${s.name}","${s.branch}","${s.email}","${s.phone}","${s.schedule.indexOf(sc)+1}","${sc.time}","${sc.status}","${sc.remark}"\\n`;
        }
    });
    downloadCSV(csv, `student_list_${c}.csv`);
}

function downloadAllStudents() {
    let csv = "USN,Name,Branch,Email,DOB,CGPA\\n";
    RAW.forEach(s => {
        csv += `"${s.usn}","${s.name}","${s.branch}","${s.email}","${s.dob}","${s.cgpa}"\\n`;
    });
    downloadCSV(csv, 'all_students.csv');
}
"""

    # Assemble final HTML
    # We'll replace matching parts of the script
    # The original file has a script block that we'll surgically replace
    
    # Let's find the script block correctly
    script_start = html.find('<script>') + len('<script>')
    script_end = html.rfind('</script>')
    
    new_script = f"\n{new_constants}\n{script_content}\n"
    
    final_html = html[:script_start] + new_script + html[script_end:]
    
    with open('Placement_Drive_Portal.html', 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    print("Placement Portal Upgraded Successfully")

if __name__ == "__main__":
    upgrade_portal()

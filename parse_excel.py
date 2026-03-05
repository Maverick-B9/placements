
import openpyxl
import json, re

TIMES = [
    "10:00 AM – 11:00 AM",
    "11:00 AM – 12:00 PM",
    "12:00 PM – 1:00 PM",
    "2:00 PM – 3:00 PM",
    "3:00 PM – 4:00 PM"
]

def parse_dob(dob):
    if not dob:
        return ''
    s = str(dob).strip()
    parts = re.split(r'[\/\-\.\s]+', s)
    nums = [p.strip() for p in parts if p.strip().isdigit()]
    if len(nums) == 3:
        d, m, y = nums[0], nums[1], nums[2]
        if len(y) == 2:
            y = '20' + y
        if len(y) == 4:
            return f"{d.zfill(2)}/{m.zfill(2)}/{y}"
    return s

wb = openpyxl.load_workbook('Master Copy of Students for Placement Drive.xlsx', data_only=True)
ws = wb['Sheet1']

students = []
companies_set = []

# Headers: SI NO, Name, USN, Branch, E-Mail, Phone, Gender, DOB, 10th%, 12th%, CGPA, Resume, C1, C2, C3, C4, C5
for row in ws.iter_rows(min_row=2, values_only=True):
    si, name, usn, branch, email, phone, gender, dob, p10, p12, cgpa, resume, c1, c2, c3, c4, c5 = (list(row) + [None]*17)[:17]
    if not usn:
        continue
    dob_str = parse_dob(dob)
    password = dob_str if dob_str else '01/01/2000'
    
    schedule = []
    for i, comp in enumerate([c1, c2, c3, c4, c5]):
        comp_name = str(comp).strip() if comp else ''
        schedule.append({
            "round": i+1,
            "company": comp_name,
            "time": TIMES[i],
            "status": "pending",
            "remark": ""
        })
        if comp_name and comp_name not in companies_set:
            companies_set.append(comp_name)

    students.append({
        "id": int(si) if si else len(students)+1,
        "usn": str(usn).strip(),
        "name": str(name).strip() if name else '',
        "branch": str(branch).strip() if branch else '',
        "email": str(email).strip() if email else '',
        "phone": str(phone).strip() if phone else '',
        "gender": str(gender).strip() if gender else '',
        "dob": dob_str,
        "pct10": str(p10) if p10 else '',
        "pct12": str(p12) if p12 else '',
        "cgpa": str(cgpa) if cgpa else '',
        "resume": str(resume).strip() if resume else '',
        "schedule": schedule,
        "password": password
    })

companies_set.sort()
print(f"Students: {len(students)}")
print(f"Companies: {len(companies_set)}")
print("Sample student:", json.dumps(students[0], ensure_ascii=False)[:200])

# Save JSON to file for verification
with open('students_extracted.json', 'w', encoding='utf-8') as f:
    json.dump({"students": students[:5], "companies": companies_set}, f, ensure_ascii=False, indent=2)

print("Saved first 5 students to students_extracted.json")

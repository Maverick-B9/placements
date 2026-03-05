
import re

with open('Placement_Drive_Portal.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('company_logic.js', 'r', encoding='utf-8') as f:
    new_js = f.read()

pattern = r'function renderCompany\(\) \{.*?function updateStatus\(usn\) \{.*?\n\}'

# Use lambda to avoid backslash processing in replacement string
new_html = re.sub(pattern, lambda m: new_js, html, flags=re.DOTALL)

if new_html == html:
    print("ERROR: replacement did not happen!")
else:
    with open('Placement_Drive_Portal.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("SUCCESS: Company dashboard updated!")
    print("File size:", len(new_html.encode('utf-8')) // 1024, "KB")

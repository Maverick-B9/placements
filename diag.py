
import re

with open('Placement_Drive_Portal.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the renderCompany function block and the updateStatus function that follows
# Use a regex to find and replace the entire block
pattern = r'(function renderCompany\(\) \{.*?function updateStatus\(usn\) \{.*?\n\})'

match = re.search(pattern, html, re.DOTALL)
if match:
    print("Found block at:", match.start(), "-", match.end())
    print("Snippet:", html[match.start():match.start()+200])
else:
    print("Pattern not found, trying simpler search...")
    idx = html.find('function renderCompany(')
    print("renderCompany at index:", idx)
    if idx >= 0:
        print(repr(html[idx:idx+300]))

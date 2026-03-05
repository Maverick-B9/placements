"""Fix index.html Day navigation - inject switcher HTML and CSS"""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Day switcher CSS if not present
DAY_SWITCHER_CSS = '''
        .day-switcher {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-bottom: 18px;
        }
        .day-btn {
            padding: 8px 22px;
            border-radius: 20px;
            border: 1.5px solid var(--bd);
            background: var(--surf);
            color: var(--mut);
            font-family: var(--fnh);
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            transition: all .2s;
            letter-spacing: .5px;
        }
        .day-btn:hover {
            border-color: var(--bd2);
            color: var(--tx);
        }
        .day-btn.active {
            background: linear-gradient(135deg, var(--ind), var(--pur));
            border-color: var(--ind);
            color: #fff;
            cursor: default;
        }
'''
if '.day-switcher' not in html:
    html = html.replace('</style>\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf',
                         DAY_SWITCHER_CSS + '\n    </style>\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf')
    print('CSS injected')

# Add Day 1 badge
if 'DAY 1' not in html:
    html = html.replace(
        'Centralized Interview Scheduling &amp; Tracking</div>',
        'Centralized Interview Scheduling &amp; Tracking</div>\n                <div style="margin-top:8px"><span style="background:linear-gradient(135deg,var(--ind),var(--pur));color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;font-family:var(--fnh);letter-spacing:.5px">&#128197; DAY 1</span></div>'
    )
    print('Day 1 badge injected')

# Add Day switcher HTML
if 'class="day-switcher"' not in html:
    day1_switcher = '''            <div class="day-switcher">
                <span class="day-btn active">&#128197; Day 1</span>
                <a href="day2.html" class="day-btn">&#128197; Day 2</a>
            </div>
'''
    html = html.replace('<div class="rtabs">', day1_switcher + '            <div class="rtabs">', 1)
    print('Switcher HTML injected')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done!')

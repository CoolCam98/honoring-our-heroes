# Builds a page from a body snippet using the header/footer in index.html.
# usage: python3 tools/new-page.py out.html body.html "Title" "Description" "/nav/path/"
import sys, re
out, body, title, desc, cur = sys.argv[1:6]
home = open('index.html').read()
head = home[:home.index('<main id="main">')]
foot = home[home.index('</main>'):]
head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head)
head = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', head)
head = head.replace(' aria-current="page"', '')
# drop Home's page-specific SEO tags, then add this page's canonical/og:url
D = 'https://honoringourheroesfl.com'
path = '/' + out[:-len('index.html')] if out.endswith('index.html') else None
head = '\n'.join(l for l in head.split('\n') if 'application/ld+json' not in l and 'rel="canonical"' not in l and 'og:url' not in l)
head = re.sub(r'(<meta property="og:title" content=").*?(">)', lambda m: m.group(1) + title + m.group(2), head)
head = re.sub(r'(<meta property="og:description" content=").*?(">)', lambda m: m.group(1) + desc + m.group(2), head)
if path:
    head = head.replace('  <meta property="og:type"', f'  <link rel="canonical" href="{D}{path}">\n  <meta property="og:url" content="{D}{path}">\n  <meta property="og:type"', 1)
head = head.replace(f'<a href="{cur}">', f'<a href="{cur}" aria-current="page">', 1)
open(out, 'w').write(head + '<main id="main">\n' + open(body).read() + '\n' + foot)

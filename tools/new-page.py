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
head = head.replace(f'<a href="{cur}">', f'<a href="{cur}" aria-current="page">', 1)
open(out, 'w').write(head + '<main id="main">\n' + open(body).read() + '\n' + foot)

"""
Update static site references from one source of truth.

This keeps SEO URLs in raw HTML for crawlers/social scrapers while avoiding
manual find-and-replace across every page when the deploy URL or asset
cache-buster changes.
"""
from pathlib import Path
import re

SITE_ORIGIN = "https://shimtimultimedia.github.io/bryant-duhart/"
ASSET_VERSION = "103"

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    "index.html": ("monthly", "1.0"),
    "about.html": ("monthly", "0.7"),
    "portfolio.html": ("weekly", "0.9"),
    "services.html": ("monthly", "0.8"),
    "social.html": ("monthly", "0.6"),
    "contact.html": ("yearly", "0.5"),
}


def page_url(page: str) -> str:
    return SITE_ORIGIN if page == "index.html" else f"{SITE_ORIGIN}{page}"


def version_assets(text: str) -> str:
    return re.sub(r"\?v=\d+", f"?v={ASSET_VERSION}", text)


def replace_tag_url(text: str, tag_pattern: str, url: str) -> str:
    return re.sub(tag_pattern, lambda m: f'{m.group(1)}{url}{m.group(2)}', text)


def update_html(page: Path) -> None:
    text = version_assets(page.read_text(encoding="utf-8"))
    name = page.name

    if name in PAGES:
        url = page_url(name)
        image = f"{SITE_ORIGIN}images/bd_bg.webp"
        text = replace_tag_url(text, r'(<link rel="canonical" href=")[^"]+(">)', url)
        text = replace_tag_url(text, r'(<meta property="og:url" content=")[^"]+(">)', url)
        text = replace_tag_url(text, r'(<meta property="og:image" content=")[^"]+(">)', image)
        text = replace_tag_url(text, r'(<meta name="twitter:image" content=")[^"]+(">)', image)
        text = re.sub(r'("url":\s*")[^"]+(")', rf'\1{url}\2', text)
        text = re.sub(r'("image":\s*")[^"]+(")', rf'\1{image}\2', text)

    page.write_text(text, encoding="utf-8", newline="\n")


def update_sitemap() -> None:
    rows = []
    for page, (changefreq, priority) in PAGES.items():
        rows.append(
            "  <url>\n"
            f"    <loc>{page_url(page)}</loc>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
            "  </url>"
        )
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<!-- sitemap.xml — XML sitemap per sitemaps.org / Google docs. -->\n"
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8", newline="\n")


def update_robots() -> None:
    robots = (
        "# robots.txt — crawler instructions\n"
        "# https://www.rfc-editor.org/rfc/rfc9309 (Robots Exclusion Protocol, 2022)\n\n"
        "User-agent: *\n"
        "Allow: /\n\n"
        f"Sitemap: {SITE_ORIGIN}sitemap.xml\n"
    )
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8", newline="\n")


def main() -> None:
    for pattern in ("*.html", "css/*.css", "js/*.js"):
        for path in ROOT.glob(pattern):
            if path.suffix == ".html":
                update_html(path)
            else:
                path.write_text(version_assets(path.read_text(encoding="utf-8")), encoding="utf-8", newline="\n")
    update_sitemap()
    update_robots()


if __name__ == "__main__":
    main()

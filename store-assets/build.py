import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRATCH = "C:/Users/migui/AppData/Local/Temp/claude/C--Users-migui-Desktop-PersonalProjects-DocFiller/ae020873-9e68-4521-91e8-ba0b512ba6d3/scratchpad"
PROJECT = "C:/Users/migui/Desktop/PersonalProjects/DocFiller"
OUT = f"{PROJECT}/store-assets"

INK_950 = (21, 23, 31)
INK_900 = (29, 32, 41)
INK_850 = (35, 38, 49)
PAPER = (236, 230, 217)
PAPER_DIM = (166, 162, 154)
AMBER = (227, 165, 66)
AMBER_HOVER = (238, 179, 92)

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_MONO = "C:/Windows/Fonts/consola.ttf"
FONT_MONO_B = "C:/Windows/Fonts/consolab.ttf"

os.makedirs(OUT, exist_ok=True)


def letterbox_screenshot(src_path, out_path, target_w=1280, target_h=800, bg=(21, 23, 31)):
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    scale = min(target_w / w, target_h / h)
    new_w, new_h = round(w * scale), round(h * scale)
    im_resized = im.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), bg)
    x = (target_w - new_w) // 2
    y = (target_h - new_h) // 2
    canvas.paste(im_resized, (x, y))
    canvas.save(out_path, "PNG")
    print(out_path, canvas.size, canvas.mode)


def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paint_backdrop(w, h):
    """Dark reservation-board backdrop matching the extension's theme."""
    im = Image.new("RGB", (w, h), INK_950)
    draw = ImageDraw.Draw(im)
    # subtle vertical gradient ink-950 -> ink-900
    for y in range(h):
        t = y / h
        r = round(INK_950[0] + (INK_900[0] - INK_950[0]) * t)
        g = round(INK_950[1] + (INK_900[1] - INK_950[1]) * t)
        b = round(INK_950[2] + (INK_900[2] - INK_950[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return im


def draw_checklist_icon(base_w):
    """Recreate the toolbar icon's checklist-card glyph as a standalone image, size=base_w square."""
    size = base_w
    scale = size / 128.0
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(icon)

    plate_r = size * 0.30
    cx, cy = size / 2, size / 2
    # shaded circular plate
    d.ellipse([cx - plate_r, cy - plate_r, cx + plate_r, cy + plate_r], fill=(0, 0, 0, 0))

    # gradient plate via layered ellipses (approximate)
    steps = 24
    top = (240, 188, 110)
    bottom = (201, 124, 34)
    for i in range(steps):
        t = i / (steps - 1)
        r = round(top[0] + (bottom[0] - top[0]) * t)
        g = round(top[1] + (bottom[1] - top[1]) * t)
        b = round(top[2] + (bottom[2] - top[2]) * t)
        frac_r = plate_r * (1 - i / (steps * 2.2))
        d.ellipse([cx - frac_r, cy - frac_r, cx + frac_r, cy + frac_r], fill=(r, g, b, 255))
    d.ellipse([cx - plate_r, cy - plate_r, cx + plate_r, cy + plate_r], outline=(122, 74, 20, 255), width=max(1, round(2 * scale)))

    # folded-corner card
    card_w, card_h = size * 0.34, size * 0.40
    cx0, cy0 = cx - card_w / 2, cy - card_h / 2
    fold = size * 0.09
    card_pts = [
        (cx0, cy0),
        (cx0 + card_w - fold, cy0),
        (cx0 + card_w, cy0 + fold),
        (cx0 + card_w, cy0 + card_h),
        (cx0, cy0 + card_h),
    ]
    d.polygon(card_pts, fill=(255, 250, 240, 255))
    d.polygon([(cx0 + card_w - fold, cy0), (cx0 + card_w, cy0 + fold), (cx0 + card_w - fold, cy0 + fold)], fill=(222, 210, 188, 255))

    # bold checkmark
    lw = max(2, round(size * 0.045))
    check = [
        (cx0 + card_w * 0.22, cy0 + card_h * 0.55),
        (cx0 + card_w * 0.42, cy0 + card_h * 0.75),
        (cx0 + card_w * 0.80, cy0 + card_h * 0.28),
    ]
    d.line(check, fill=(58, 46, 30, 255), width=lw, joint="curve")
    # rounded caps
    for pt in (check[0], check[1], check[2]):
        d.ellipse([pt[0] - lw / 2, pt[1] - lw / 2, pt[0] + lw / 2, pt[1] + lw / 2], fill=(58, 46, 30, 255))

    # status dot
    dot_r = size * 0.085
    dx, dy = cx + plate_r * 0.62, cy + plate_r * 0.62
    d.ellipse([dx - dot_r * 1.35, dy - dot_r * 1.35, dx + dot_r * 1.35, dy + dot_r * 1.35], fill=(21, 23, 31, 255))
    d.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=(132, 167, 136, 255))

    return icon


def text_w(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def build_small_promo():
    w, h = 440, 280
    im = paint_backdrop(w, h)
    draw = ImageDraw.Draw(im)

    icon_size = 132
    icon = draw_checklist_icon(icon_size)
    icon_x = (w - icon_size) // 2
    icon_y = 34
    im.paste(icon, (icon_x, icon_y), icon)

    draw = ImageDraw.Draw(im)
    title_font = ImageFont.truetype(FONT_BOLD, 34)
    sub_font = ImageFont.truetype(FONT_MONO, 15)

    title = "SecretaryFiller"
    tw, th = text_w(draw, title, title_font)
    draw.text(((w - tw) / 2, icon_y + icon_size + 14), title, font=title_font, fill=PAPER)

    sub = "room reservation autofill"
    sw, sh = text_w(draw, sub, sub_font)
    draw.text(((w - sw) / 2, icon_y + icon_size + 14 + th + 10), sub, font=sub_font, fill=AMBER)

    im.save(f"{OUT}/small_promo_tile_440x280.png", "PNG")
    print("small promo tile ->", im.size, im.mode)


def build_marquee_promo():
    w, h = 1400, 560
    im = paint_backdrop(w, h)
    draw = ImageDraw.Draw(im)

    # faint amber glow behind icon
    icon_size = 300
    icon = draw_checklist_icon(icon_size)
    icon_x = 130
    icon_y = (h - icon_size) // 2
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse(
        [icon_x - 60, icon_y - 60, icon_x + icon_size + 60, icon_y + icon_size + 60],
        fill=(227, 165, 66, 40),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    im.paste(Image.alpha_composite(im.convert("RGBA"), glow).convert("RGB"), (0, 0))

    im.paste(icon, (icon_x, icon_y), icon)

    draw = ImageDraw.Draw(im)
    text_x = icon_x + icon_size + 70
    title_font = ImageFont.truetype(FONT_BOLD, 68)
    sub_font = ImageFont.truetype(FONT_REG, 28)
    tag_font = ImageFont.truetype(FONT_MONO, 22)

    title = "SecretaryFiller"
    draw.text((text_x, 150), title, font=title_font, fill=PAPER)

    sub = "Autofill room-reservation forms in one click."
    draw.text((text_x, 232), sub, font=sub_font, fill=PAPER_DIM)

    tag = "COBE Google Form  \u2022  UF EMS Cloud Service  \u2022  never auto-submits"
    draw.text((text_x, 280), tag, font=tag_font, fill=AMBER)

    # small checkmark bullets echoing the "fill, review, submit yourself" pitch
    bullets = [
        "Fills the repeated fields for you",
        "You always review before submitting",
        "Reusable templates for recurring events",
    ]
    bfont = ImageFont.truetype(FONT_REG, 22)
    by = 350
    for b in bullets:
        draw.ellipse([text_x, by + 6, text_x + 8, by + 14], fill=(132, 167, 136))
        draw.text((text_x + 20, by), b, font=bfont, fill=PAPER)
        by += 36

    im.save(f"{OUT}/marquee_promo_tile_1400x560.png", "PNG")
    print("marquee promo tile ->", im.size, im.mode)


# Screenshots (the two real popup screenshots the user pasted)
letterbox_screenshot(f"{SCRATCH}/pasted_0.webp", f"{OUT}/screenshot_1_ems_1280x800.png")
letterbox_screenshot(f"{SCRATCH}/pasted_1.webp", f"{OUT}/screenshot_2_google_form_1280x800.png")

build_small_promo()
build_marquee_promo()

# sanity: confirm no alpha channel on any output the store will accept
for fname in [
    "screenshot_1_ems_1280x800.png",
    "screenshot_2_google_form_1280x800.png",
    "small_promo_tile_440x280.png",
    "marquee_promo_tile_1400x560.png",
]:
    im = Image.open(f"{OUT}/{fname}")
    print(fname, im.size, im.mode, "OK" if im.mode == "RGB" else "!! HAS ALPHA")

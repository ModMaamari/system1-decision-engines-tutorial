#!/usr/bin/env python3
"""رصد الأنماط المرشحة للكتابة الآلية في النصوص العربية.

Flag candidate AI-associated patterns in Arabic prose.

الاستعمال / Usage:
    python3 audit_ar.py draft.md [more files ...]
    python3 audit_ar.py --json draft.txt
    cat section.txt | python3 audit_ar.py -

كل نتيجة مرشحة لاختبار الضرورة في SKILL.md، لا خطأ مؤكد.
تُحجب قبل الفحص: الآيات بين ﴿﴾، والاقتباسات بين علامات التنصيص، والشيفرة،
والروابط، والإحالات بين قوسين، وقائمة المراجع. ويُزال التشكيل والتطويل،
وتُوحّد صور الألف والياء والتاء المربوطة عند المطابقة فقط.
Standard library only.
"""

import argparse
import json
import re
import statistics
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# التطبيع / Normalization
# --------------------------------------------------------------------------

# Arabic diacritics (harakat, tanween, shadda, sukun, superscript alef,
# Quranic annotation marks) and tatweel.
TASHKEEL_RE = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]")

# One-to-one character map: keeps string length, so offsets in the
# normalized text equal offsets in the displayed text.
NORM_MAP = str.maketrans({
    "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
    "ى": "ي", "ی": "ي",
    "ة": "ه",
    "ک": "ك",
})

AR = "\u0621-\u064A"  # Arabic letters after tashkeel removal
DIGIT = r"[0-9\u0660-\u0669\u06F0-\u06F9]"


def strip_tashkeel(text):
    return TASHKEEL_RE.sub("", text)


def normalize(text):
    return text.translate(NORM_MAP)


# --------------------------------------------------------------------------
# الحجب / Masking: replace regions with spaces, keep newlines and length.
# --------------------------------------------------------------------------


def _blank(m):
    return re.sub(r"[^\n]", " ", m.group(0))


def _mask(text, pattern, flags=0):
    return re.sub(pattern, _blank, text, flags=flags)


def _mask_group(text, pattern, group, flags=0):
    def repl(m):
        s, e = m.span(group)
        off = m.start(0)
        whole = m.group(0)
        inner = re.sub(r"[^\n]", " ", whole[s - off:e - off])
        return whole[: s - off] + inner + whole[e - off:]

    return re.sub(pattern, repl, text, flags=flags)


LATEX_ENVS = (
    r"equation\*?|align\*?|gather\*?|multline\*?|displaymath|math|verbatim|"
    r"lstlisting|minted|algorithmic|algorithm\*?|tabular\*?|thebibliography|comment"
)


def mask_text(text, kind):
    if kind == "tex":
        text = _mask(text, r"(?<!\\)%[^\n]*")
        text = _mask(text, r"\\begin\{(" + LATEX_ENVS + r")\}.*?\\end\{\1\}", re.S)
        text = _mask_group(
            text,
            r"\\(?:cite[tp]?\*?|ref|eqref|autoref|cref|label|url|href|includegraphics|"
            r"input|include|usepackage|documentclass|bibliographystyle|bibliography)"
            r"(\[[^\]]*\])*\{([^}]*)\}",
            2,
        )
        text = _mask(text, r"\$\$.*?\$\$", re.S)
        text = _mask(text, r"\\\[.*?\\\]", re.S)
        text = _mask(text, r"(?<!\\)\$[^$\n]+?(?<!\\)\$")
        text = _mask(text, r"``[^\n]{0,400}?''")
    elif kind == "html":
        text = _mask(text, r"<(script|style)\b.*?</\1>", re.S | re.I)
        text = _mask(text, r"<!--.*?-->", re.S)
        text = _mask(text, r"<[^>\n]+>")
    else:
        text = _mask(text, r"```.*?```", re.S)
        text = _mask(text, r"~~~.*?~~~", re.S)
        text = _mask(text, r"`[^`\n]+`")
        text = _mask_group(text, r"\]\(([^)]*)\)", 1)
        text = _mask(text, r"(?m)^\s*>[^\n]*")  # blockquotes
    text = _mask(text, r"https?://\S+|www\.\S+|\S+@\S+\.\w+")
    # Quran: ornate parentheses, and curly braces commonly used for verses.
    text = _mask(text, r"\uFD3F[^\uFD3E]{0,2000}?\uFD3E")
    text = _mask(text, r"\uFD3E[^\uFD3F]{0,2000}?\uFD3F")
    text = _mask(text, r"\{[^{}\n]{2,600}\}") if kind != "tex" else text
    # Quotations.
    text = _mask(text, r"«[^»]{1,800}?»")
    text = _mask(text, r"\u201c[^\u201d]{1,800}?\u201d")
    text = _mask(text, r"\u201d[^\u201c\n]{1,800}?\u201c")  # RTL-reversed curly quotes
    text = _mask(text, r"\"[^\"\n]{1,800}\"")
    # Parenthetical citations: (الجابري، 2009) (Smith, 2020, p. 4) [12]
    text = _mask(text, r"\([^()\n]{0,120}?" + DIGIT + r"{4}[^()\n]{0,40}\)")
    text = _mask(text, r"\[\s*\d+(?:\s*[,،-]\s*\d+)*\s*\]")
    # References section to the end of the file.
    m = re.search(
        r"(?m)^\s*(?:#{1,6}\s*|\\section\*?\{)?\s*(?:قائمة\s+)?(?:المراجع|المصادر|المصادر\s+والمراجع|"
        r"References|Bibliography|Works Cited)\s*\}?\s*:?\s*$",
        text,
    )
    if m:
        text = text[: m.start()] + re.sub(r"[^\n]", " ", text[m.start():])
    return text


# --------------------------------------------------------------------------
# الأنماط / Patterns (written in normalized form: ا for أإآ, ي for ى, ه for ة)
# --------------------------------------------------------------------------

# Optional proclitics: و/ف + ب/ك/ل + ال (also لل).
PRE = r"(?:[وف])?(?:بال|كال|لل|ال|ب|ك|ل)?"
SUF = r"(?:ها|هم|هما|هن|ه|كم|ك|نا|ي|ات|ين|ون|ان|تين|تان|يه|يا|ا)?"


def W(stem, prefix=True, suffix=True):
    """Whole-word Arabic pattern with optional clitics."""
    return r"(?<![\w])" + (PRE if prefix else "") + r"(?:" + stem + r")" + (SUF if suffix else "") + r"(?![\w])"


def P(text):
    """Literal phrase pattern with word boundaries, whitespace-tolerant."""
    return r"(?<![\w])(?:[وف])?" + re.sub(r"\s+", r"\\s+", text) + r"(?![\w])"


NUMERIC = DIGIT + r"|٪|%|دال(?:ه)?\s+احصائيا|دلاله\s+احصائيه"

# (pattern, tier, keep-regexes tested on the containing sentence, label)
WORDS = [
    # --- ألفاظ الزخرف: high ---
    (r"(?<![\w])[وف]?(?:يلعب|تلعب|لعب|لعبت|يلعبون|يلعبان|تلعبان|سيلعب|ستلعب|لعبوا)(?:\s+[\w]+){0,4}?\s+(?:ال)?(?:دورا|دور)(?![\w])",
     "high", [], "يلعب دوراً"),
    (W(r"محوري"), "high", [r"(?:عمود|تماثل|محور)\s+(?:ال)?محوري"], "محوري"),
    (W(r"حيوي"), "high",
     [r"(?:مضاد|كتل|وقود|احصاء|مؤشر|تنوع|علام|كيمياء|فيزياء|اخلاقي|غاز|سماد|مجال|حيز|اشار|نشاط|تحلل|ترشيح)\w*\s+(?:ال)?حيوي"],
     "حيوي"),
    (r"(?<![\w])[وف]?(?:بال|ال)?بالغ(?:ه)?\s+(?:ال)?(?:اهميه|الاهميه|الاثر|اثر|الخطوره|خطوره|الدقه)(?![\w])", "high", [], "بالغ الأهمية"),
    (P("حجر الزاويه"), "high", [r"(?:بناء|مبني|عماره|جدار|معبد|كنيسه|مسجد)"], "حجر الزاوية"),
    (r"(?<![\w])[وف]?(?:ال)?(?:ركيزه|ركائز)\s+(?:ال)?(?:اساسيه|رئيسيه|جوهريه)(?![\w])", "high", [], "الركيزة الأساسية"),
    (W(r"نسيج|انسجه"), "high",
     [r"(?:نسيج|انسجه)\w*\s+(?:ال)?(?:عضلي|عصبي|ضام|طلائي|عظمي|دهني|نباتي|حيوان|قطني|صوفي|حريري|رئوي|كبدي|ليفي|مصاب|سليم|حي)",
      r"(?:صناع|مصنع|مصانع|خيوط|غزل|تجار)\w*\s+(?:ال)?(?:نسيج|منسوجات)", r"زراع\w*\s+(?:ال)?انسجه", r"الانسجه"],
     "نسيج (مجازاً)"),
    (r"(?<![\w])[وف]?(?:خير\s+شاهد|شاهد\s+حي|دليل\s+حي|شهاده\s+حيه)(?![\w])", "high", [], "خير شاهد / دليل حي"),
    (r"(?<![\w])[وف]?(?:ل|س)?(?:نغوص|الغوص|يغوص|تغوص|غوصا|نتعمق|التعمق|يتعمق|نبحر|الابحار|نبحر)\s+(?:في|الي)(?![\w])",
     "high", [r"(?:بحر|بحار|مياه|محيط|غواص|سباحه)"], "الغوص / التعمق في"),
    (P("سبر اغوار"), "high", [], "سبر أغوار"),
    (W(r"اغوار"), "high", [], "أغوار"),
    (r"(?<![\w])[وف]?(?:ال)?رحل(?:ه|تك|تنا|تكم|ته|تها|تهم)\s+(?:ال)?(?:تعلم|بحث|اكتشاف|نجاح|تحول|نمو|معرفه|حياه|استكشاف|تطور|تغيير|الاحتراف|احتراف|الابداع|التميز|الشفاء|العطاء|نحو)(?![\w])",
     "high", [], "رحلة (مجازاً)"),
    (r"(?<![\w])[وف]?(?:ي|ت|ن)?(?:سلط|سلطت|سلطوا|تسليط|يسلط|تسلط|نسلط|القي|القت|القاء|يلقي|تلقي|نلقي)\s+(?:ال)?ضوء(?![\w])",
     "high", [r"(?:كاميرا|تصوير|مسرح|خشبه|مصباح|كشاف|اضاءه)"], "يسلط الضوء"),
    (W(r"سلس|بسلاسه|سلاسه|سلسه"), "high", [], "سلس / بسلاسة"),
    (r"(?<![\w])[وف]?(?:ال)?متعدد(?:ه)?\s+(?:ال)?(?:اوجه|جوانب|ابعاد|الاوجه|الجوانب|الابعاد)(?![\w])", "high",
     [r"(?:فضاء|تحليل|قياس|مقياس|بيانات|مصفوف|دوال|متجه)\w*\s+(?:ال)?متعدد"], "متعدد الأوجه"),
    (r"(?<![\w])[وف]?(?:ال)?نقل(?:ه|ات)\s+(?:ال)?نوعي(?:ه)?(?![\w])", "high", [], "نقلة نوعية"),
    (W(r"مذهل|مذهله|مذهلا"), "high", [], "مذهل"),
    (P("فريد من نوعه") + r"|" + P("فريده من نوعها"), "high", [], "فريد من نوعه"),
    (r"(?<![\w])[وف]?(?:ال)?(?:افاق|افاقا)\s+(?:ال)?(?:جديده|واسعه|رحبه|ارحب|اوسع|مستقبليه|واعده)(?![\w])", "high", [], "آفاق جديدة/واسعة"),
    (r"(?<![\w])[وف]?(?:ي|ت|س|ل)?(?:فتح|يفتح|تفتح|فتحت)\s+(?:ال)?(?:باب|ابواب|الباب|الابواب|افاقا|المجال)\s+(?:واسعا\s+)?(?:امام|ل)", "high", [], "يفتح الباب/الآفاق أمام"),
    (r"(?<![\w])[وف]?(?:ي|ت|س|ل)?(?:مهد|يمهد|تمهد|مهدت)\s+(?:ال)?طريق(?![\w])", "high", [], "يمهد الطريق"),
    (P("لا يتجزا"), "high", [], "جزء لا يتجزأ"),
    (r"(?<![\w])[وف]?(?:ال)?رؤي\s+(?:ال)?(?:قيمه|عميقه|ثاقبه|ثريه)(?![\w])", "high", [], "رؤى قيّمة"),
    (r"(?<![\w])[وف]?(?:ال)?(?:عامل|عنصر|دور|محرك)\s+(?:ال)?مفتاحي(?![\w])", "high", [], "عامل مفتاحي"),
    (P("مفتاح النجاح") + r"|" + P("المفتاح الي") + r"|" + P("هو المفتاح"), "high", [], "مفتاح النجاح"),
    (W(r"غير مسبوق|غير مسبوقه|غير المسبوق|غير المسبوقه"), "high", [], "غير مسبوق"),
    (W(r"ثوري"), "high", [r"(?:حرس|مجلس|حزب|فكر|شعر|ادب|حركه|حكومه)\w*\s+(?:ال)?ثوري"], "ثوري"),

    # --- ألفاظ تحريرية: editorial ---
    (W(r"جوهري"), "editorial", [r"(?:قيمه|خطا|شرط|ماده|مخالفه)\s+(?:ال)?جوهري"], "جوهري"),
    (W(r"يعزز|تعزز|عزز|عززت|تعزيز|يعززون|تعزيزه|تعزيزها"), "editorial",
     [r"(?:تعلم|التعلم)\s+(?:ال)?(?:معزز|بالتعزيز)", r"(?:ال)?واقع\s+(?:ال)?معزز", r"(?:ال)?تعزيز\s+(?:ال)?(?:ايجابي|سلبي|موجب|سالب|المتقطع|المستمر)",
      r"جدول\w*\s+(?:ال)?تعزيز", r"(?:ال)?خرسان\w*"], "يعزز / تعزيز"),
    (W(r"يرسخ|ترسخ|ترسيخ|يكرس|تكريس"), "editorial", [], "يرسخ / يكرس"),
    (W(r"تمكين"), "editorial", [r"(?:ال)?تمكين\s+(?:ال)?(?:مراه|اقتصادي|السياسي|الاقتصادي)", r"مبادره\s+تمكين|برنامج\s+تمكين"], "تمكين"),
    (W(r"شامل|شامله|شمولي|شموليه"), "editorial",
     [r"(?:ال)?جوده\s+(?:ال)?شامله", r"(?:ال)?(?:تامين|فحص|مسح|حرب|اضراب|حل)\s+(?:ال)?شامل", r"(?:ال)?دمار\s+(?:ال)?شامل"], "شامل"),
    (W(r"متكامل|متكامله"), "editorial", [r"(?:ال)?دوائر\s+(?:ال)?متكامله", r"دائره\s+متكامله"], "متكامل"),
    (W(r"يجسد|تجسد|يجسدون|تجسيد"), "editorial", [r"(?:ممثل|ممثله|دور|شخصيه|مسرح|فيلم|مسلسل)"], "يجسد"),
    (W(r"يعكس|تعكس|عكس|يعكسان"), "editorial", [r"(?:ضوء|مراه|مرايا|اشعه|سطح|صوت|موجه)", r"(?:بال|علي\s+ال)?عكس"], "يعكس (مجازاً)"),
    (W(r"يبرز|تبرز|ابراز"), "editorial", [], "يبرز / إبراز"),
    (W(r"يكمن|تكمن"), "editorial", [], "يكمن"),
    (W(r"يتجلي|تتجلي|تجلي|يتجليان"), "editorial", [], "يتجلى"),
    (W(r"ديناميكي|ديناميكيه|ديناميكيا"), "editorial",
     [r"(?:ديناميكا|ديناميكيه)\s+(?:ال)?(?:حراري|هوائي|موائع|سوائل|جزيئي)", r"(?:برمج|لزوج|نظم|انظم|ذاكر|انظمه|نظام|توازن|مرون)\w*\s+(?:ال)?ديناميكي"],
     "ديناميكي"),
    (W(r"مبتكر|مبتكره|ابتكاري|ابتكاريه"), "editorial", [], "مبتكر"),
    (W(r"استثنائي|استثنائيه|استثنائيا"), "editorial", [r"(?:دوره|جلسه|اجتماع|حاله|ظروف|قانون|محكمه|اجراء)\w*\s+(?:ال)?استثنائي"], "استثنائي"),
    (W(r"فعال|فعاله|فعاليه|بفعاليه|فاعليه"), "editorial",
     [r"(?:ال)?(?:فعاليه|فاعليه)\s+(?:ال)?(?:دواء|علاج|لقاح|عقار|مضاد|مبيد)", r"(?:ال)?(?:ماده|مكون|مواد|قيمه|مقاومه)\s+(?:ال)?فعال",
      r"(?:ال)?فعاليات"], "فعّال / فعالية"),
    (W(r"ملحوظ|ملحوظه|ملحوظا"), "editorial", [NUMERIC], "ملحوظ (بلا رقم)"),
    (W(r"مستدام|مستدامه|استدامه"), "editorial", [r"(?:ال)?تنميه\s+(?:ال)?مستدامه", r"اهداف\s+(?:ال)?تنميه"], "مستدام / استدامة"),
    (W(r"منظومه|منظومات"), "editorial", [r"(?:دفاع|صواريخ|اسلحه|رادار|اتصال|تسليح)", r"(?:ال)?منظومه\s+(?:ال)?(?:شعريه|الشمسيه)"], "منظومة"),
    (W(r"بمثابه"), "editorial", [], "بمثابة"),
    (W(r"الامثل|المثلي|امثل|مثلي"), "editorial", [r"(?:ال)?تحكم\s+(?:ال)?امثل", r"(?:برهن|اثبت|مبرهن|نظريه\s+(?:ال)?تحسين)"], "الأمثل"),
    (r"(?<![\w])[وف]?(?:ال)?(?:معلومات|نصائح|اضافه|اضافات|مساهمه|مساهمات|اسهام|اسهامات|افكار|دروس|خبرات)\s+(?:ال)?(?:قيمه|قيم)(?![\w])",
     "editorial", [], "قيّمة"),
    (r"(?<![\w])[وف]?(?:في|علي)\s+(?:صميم|قلب)\s+", "editorial",
     [r"قلب\s+(?:ال)?(?:مدينه|عاصمه|صحراء|بحر|غابه|حي|سوق|منطقه|ليل|جبل|وادي|القاهره|بغداد|دمشق|الرياض|عمان)", r"(?:جراح|عمليه|طبيب|مريض)\w*"],
     "في صميم / في قلب"),
    (r"(?<![\w])[وف]?(?:ال)?مشهد\s+(?:ال)?(?:تقني|رقمي|ثقافي|اعلامي|تعليمي|اقتصادي|تكنولوجي|معرفي|تجاري|ريادي|التقني|الرقمي)(?![\w])",
     "editorial", [], "المشهد (التقني/الرقمي...)"),
    (r"(?<![\w])[وف]?(?:ال)?(?:مفتاح)\s+(?:ل|ال)", "editorial",
     [r"مفتاح\s+(?:ال)?(?:تشفير|اساسي|اجنبي|عام|خاص|موسيق|صول|فا)", r"لوح\w*\s+(?:ال)?مفاتيح", r"(?:باب|قفل|سياره|بيت|غرفه)"], "المفتاح لـ"),
]

TEMPLATES = [
    # النفي ثم الاستدراك
    (r"(?<![\w])[وف]?(?:ليس|ليست|ليسوا|لم\s+يعد|لم\s+تعد|لا\s+يقتصر|لا\s+تقتصر|لا\s+يتعلق|لا\s+يكمن|لا\s+تكمن)[^.؟?!\n]{0,140}?\s+(?:بل|وانما|انما)(?![\w])",
     "ليس مجرد X بل Y"),
    (P("فحسب") + r"[،,]?\s+بل", "ليس X فحسب بل Y"),
    # التمهيد الفارغ
    (P("تجدر الاشاره"), "تمهيد فارغ"),
    (P("من الجدير بالذكر") + r"|" + P("الجدير بالذكر"), "تمهيد فارغ"),
    (r"(?<![\w])[وف]?من\s+(?:ال)?(?:مهم|ضروري)\s+(?:ان\s+)?(?:نلاحظ|نشير|نذكر|ننوه|نؤكد|نتذكر|نفهم|ملاحظه|الاشاره|التنويه|التاكيد|التذكير|الاخذ)", "تمهيد فارغ"),
    (P("مما لا شك فيه") + r"|" + P("لا شك ان") + r"|" + P("لا شك في ان") + r"|" + P("بلا شك"), "تمهيد فارغ (لا شك)"),
    (P("لا يخفي علي احد") + r"|" + P("غني عن القول") + r"|" + P("من نافله القول") + r"|" + P("لا بد من الاشاره"), "تمهيد فارغ"),
    (P("وهنا ياتي دور") + r"|" + P("هنا ياتي دور"), "تمهيد فارغ"),
    (r"(?<![\w])(?:دعونا|دعنا|هيا\s+بنا)\s+(?:ن|ال)?\w+", "مخاطبة زائفة (دعونا)"),
    (r"(?<![\w])[وف]?في\s+هذا\s+(?:المقال|الموضوع|الدرس|التقرير|الدليل)\s+(?:س|سوف\s+)\w+", "إعلان عن المحتوى (في هذا المقال سـ...)"),
    (r"(?<![\w])(?:سنستعرض|سنتناول|سنتعرف|سنلقي|سنكتشف|سنناقش)(?![\w])", "إعلان عن المحتوى"),
    # المقدمات البانورامية
    (r"(?<![\w])[وف]?في\s+عالم(?:نا)?\s+(?:ال)?(?:معاصر|اليوم|الحديث|المتسارع|المتغير|الحالي|الرقمي)", "مقدمة بانورامية"),
    (P("في عالم اليوم"), "مقدمة بانورامية"),
    (r"(?<![\w])[وف]?في\s+ظل\s+(?:ال)?(?:تطورات|تحولات|تغيرات|تقدم|ثوره|تسارع|طفره|التطور|التحول)", "مقدمة بانورامية (في ظل التطورات)"),
    (r"(?<![\w])[وف]?في\s+(?:عصر|عصرنا|زمن|زمننا)\s+(?:ال)?(?:حالي|حديث|رقمي|راهن|معاصر|يتسم|تتسارع|المعلومات|السرعه|التكنولوجيا|الذكاء|العولمه|الذي)", "مقدمة بانورامية (في عصر...)"),
    (P("منذ فجر التاريخ") + r"|" + P("منذ الازل") + r"|" + P("منذ قديم الزمان") + r"|" + P("منذ القدم"), "مقدمة بانورامية"),
    (r"(?<![\w])[وف]?مع\s+(?:ال)?(?:تطور|تقدم)\s+(?:ال)?(?:تكنولوجي|تقني|علمي|هائل|متسارع)", "مقدمة بانورامية"),
    (r"(?<![\w])[وف]?شهد(?:ت)?\s+(?:ال)?(?:سنوات|عقود|اعوام)\s+(?:ال)?(?:اخيره|ماضيه|الاخيره|الماضيه)", "مقدمة بانورامية (شهدت السنوات الأخيرة)"),
    (P("ضروره ملحه") + r"|" + P("ضروره حتميه") + r"|" + P("ضروره قصوي"), "تضخيم (ضرورة ملحة)"),
    (P("يشهد العالم") + r"|" + P("يشهد عالمنا"), "مقدمة بانورامية"),
    # تضخيم الأهمية
    (r"(?<![\w])[وف]?(?:ال)?(?:نقطه\s+تحول|علامه\s+فارقه|منعطف\s+تاريخي|حجر\s+الاساس)(?![\w])", "تضخيم الأهمية"),
    (r"(?<![\w])[وف]?خطوه\s+(?:مهمه|هامه|كبيره|جباره|عملاقه|رائده|نوعيه|جريئه)\s+(?:نحو|في\s+سبيل|علي\s+طريق)", "تضخيم الأهمية (خطوة مهمة نحو)"),
    (P("لا يمكن المبالغه") + r"|" + P("اهميه قصوي") + r"|" + P("اهميه بالغه") + r"|" + P("يكتسب اهميه") + r"|" + P("تكتسب اهميه"), "تضخيم الأهمية"),
    (P("اكثر من اي وقت مضي"), "قالب مترجم (أكثر من أي وقت مضى)"),
    # الذيل التعليقي
    (r"[،,]\s*(?:و)?(?:مما|الامر\s+الذي|وهو\s+ما|وهذا\s+ما|وهو\s+الامر\s+الذي|ما)\s+(?:من\s+شانه\s+ان\s+)?(?:ي|س|سي)?(?:سهم|ساهم|عكس|ؤكد|برز|عزز|جسد|ؤدي|نعكس|فتح|مهد|جعل|ضمن|ساعد|تيح|وفر|خلق|عزز|دعم|رسخ|كرس|ثري)",
     "ذيل تعليقي (مما يسهم في...)"),
    (r"(?<![\w])(?:ليصبح|لتصبح|ليغدو|لتغدو)\s+بذلك", "ذيل تعليقي (ليصبح بذلك)"),
    # الخواتيم الجاهزة
    (r"(?<![\w])[وف]?(?:في\s+الختام|ختاما|خلاصه\s+القول|خلاصه\s+الامر|في\s+نهايه\s+المطاف|وفي\s+النهايه|في\s+الخلاصه|قصاري\s+القول|صفوه\s+القول)(?![\w])",
     "خاتمة جاهزة"),
    (r"(?<![\w])[وف]?(?:ال)?مستقبل\s+(?:ال)?(?:واعد|مشرق|زاهر|افضل)(?![\w])", "خاتمة جاهزة (مستقبل مشرق)"),
    (r"(?<![\w])(?:ليس|ليست)\s+(?:مجرد\s+)?خيارا\s+بل\s+ضروره", "خاتمة جاهزة (ليس خياراً بل ضرورة)"),
    (P("في نهايه اليوم"), "قالب مترجم (في نهاية اليوم)"),
    # التحديات والتوازن
    (r"(?<![\w])[وف]?(?:رغم|برغم|علي\s+الرغم\s+من|بالرغم\s+من)\s+(?:هذه\s+|تلك\s+|كل\s+)?(?:ال)?تحديات", "قالب التحديات"),
    (P("التحديات والفرص") + r"|" + P("الفرص والتحديات") + r"|" + P("تحديات وفرص"), "قالب التحديات والفرص"),
    (P("سلاح ذو حدين") + r"|" + P("سلاحا ذا حدين") + r"|" + P("وجهان لعمله واحده"), "توازن إلزامي"),
    (P("ايجابيات وسلبيات") + r"|" + P("مزايا وعيوب") + r"|" + P("الايجابيات والسلبيات"), "توازن إلزامي"),
    (r"(?<![\w])[وف]?من\s+(?:ناحيه|جهه)\s+اخري(?![\w])", "توازن (من ناحية أخرى)"),
    # التشويق والأسئلة البلاغية
    (r"(?<![\w])[وف]?هل\s+(?:تساءلت|سالت\s+نفسك|فكرت)\s+(?:يوما|من\s+قبل)?", "سؤال بلاغي (هل تساءلت يوماً)"),
    (P("والسؤال الذي يطرح نفسه") + r"|" + P("السؤال الذي يطرح نفسه"), "سؤال بلاغي"),
    (r"(?<![\w])[وف]?(?:لكن|ولكن)[،,]?\s+ما\s+(?:السر|الذي|هو\s+السر)", "سؤال بلاغي (ولكن ما السر؟)"),
    (r"(?<![\w])(?:تخيل|تخيلوا)\s+(?:معي|انك|انكم|لو)", "تشويق مصطنع (تخيّل معي)"),
    (P("عزيزي القارئ") + r"|" + P("عزيزتي القارئه") + r"|" + P("اعزائي القراء"), "مخاطبة زائفة"),
    (r"(?<![\w])(?:اليك|اليكم|اليكي)\s+(?:" + DIGIT + r"+|اهم|افضل|ابرز|بعض|اسرار|نصائح|خطوات)", "خطاف (إليك ٥ نصائح)"),
    # السلطة المبهمة
    (r"(?<![\w])[وف]?(?:يري|يؤكد|يشير|يتفق|ينصح|يجمع)\s+(?:ال)?(?:خبراء|باحثون|الباحثون|مختصون|المختصون|علماء|العلماء|متخصصون|المتخصصون|كثيرون)(?![\w])",
     "سلطة مبهمة (يرى الخبراء)"),
    (r"(?<![\w])[وف]?(?:تشير|تؤكد|اثبتت|اظهرت|اكدت|كشفت|بينت)\s+(?:ال)?(?:دراسات|ابحاث|الابحاث|الدراسات|تقارير|التقارير|احصاءات|الاحصاءات|بحوث|البحوث)(?:\s+(?:ال)?(?:علميه|حديثه|الحديثه|العلميه))?(?![\w])",
     "سلطة مبهمة (تشير الدراسات)"),
    # قوالب أخرى
    (r"(?<![\w])[وف]?(?:يكمن|تكمن)\s+(?:ال)?(?:سر|حل|جوهر|تحدي|فرق|اهميه|مشكله|هدف)", "قالب (يكمن السر في)"),
    (r"(?<![\w])[وف]?(?:تتجلي|يتجلي)\s+(?:ال)?(?:اهميه|اهميته|اهميتها|دور|قيمه)", "قالب (تتجلى أهمية)"),
    (r"(?<![\w])[وف]?(?:تتمثل|يتمثل)\s+(?:ابرز|اهم|اول)", "قالب (تتمثل أبرز...)"),
    (r"(?<![\w])[وف]?(?:ال)?(?:عديد|العديد)\s+من(?![\w])|(?<![\w])[وف]?مجموعه\s+(?:واسعه|متنوعه|كبيره)\s+من|(?<![\w])[وف]?(?:شتي|كافه)\s+(?:ال)?(?:مجالات|الاصعده|المجالات|مناحي)",
     "كمية مبهمة (العديد من / شتى المجالات)"),
    (r"(?<![\w])[وف]?(?:علي|في)\s+(?:كافه|جميع|مختلف|شتي)\s+(?:ال)?(?:اصعده|مستويات|مجالات|الاصعده|المستويات|المجالات)", "اتساع زائف (على كافة الأصعدة)"),
    (P("علي سبيل المثال لا الحصر"), "قالب (على سبيل المثال لا الحصر)"),
]

CALQUES = [
    (r"(?<![\w])[وف]?(?:س)?(?:ي|ت)?تم(?:ت)?(?![\w])", "يتم/تم + مصدر"),
    (r"(?<![\w])[وف]?(?:قام|قامت|قاموا|قمنا|قمت|يقوم|تقوم|يقومون|نقوم|اقوم|سيقوم|ستقوم|سنقوم|يقومان|تقومان)(?:\s+(?!ب)[\w]+){0,3}?\s+ب(?!(?:عد|ين|سبب|ها|ه|هم|هما|ذلك|دون|ما|شكل|صوره|عض|كل|قوه|نفسه|نفسها|انفسهم)(?![\w]))(?:ال)?[" + AR + r"]{3,}",
     "قام بـ + مصدر"),
    (r"(?<![\w])[وف]?(?:ي|ت|ن|سي|ست|سن)?(?:عمل|تعمل|يعمل|نعمل|عملت|عملوا|يعملون)\s+علي\s+(?:ال)?(?:تطوير|تحسين|تعزيز|توفير|تحقيق|بناء|نشر|رفع|دعم|تمكين|ترسيخ|تفعيل)",
     "عمل على + مصدر"),
    (r"(?<![\w])(?:ب)(?:شكل|صوره|طريقه)\s+(?:كبير|ملحوظ|فعال|كامل|جذري|ملموس|متزايد|مستمر|اساسي|واضح|سلس|دقيق|مباشر|ايجابي|سلبي|افضل|اكبر|اكثر|مثالي|استثنائي|لافت|ملفت|هائل|كبيره|ملحوظه|فعاله|كامله|جذريه|ملموسه|متزايده|مستمره|اساسيه|واضحه|سلسه|دقيقه|مباشره|ايجابيه|سلبيه|مثاليه|لافته|هائله|عام|خاص|عامه|خاصه)(?![\w])",
     "بشكل/بصورة + صفة"),
    (r"[،,]\s*و(?:الذي|التي|الذين|اللذين|اللتين|اللذان|اللتان|اللاتي|اللواتي)(?![\w])", "واو قبل الموصول بعد فاصلة (، والذي)"),
    (r"(?<![\w])من\s+قبل\s+(?!(?:ان|ذلك|هذا|هذه|ذاك)(?![\w]))(?:ال)?[" + AR + r"]{2,}", "من قِبل + الفاعل"),
    (r"(?<![\w])كلما(?![\w])[^.؟?!\n]{1,100}?(?<![\w])كلما(?![\w])", "كلما ... كلما (تكرار خاطئ)"),
    (r"(?<![\w])[وف]?بدور(?:ه|ها|هم|هما)(?![\w])", "بدوره (in turn)"),
    (r"(?<![\w])[وف]?(?:هناك|ثمه)\s+(?:ال)?(?:عديد|العديد|الكثير|كثير|مجموعه)\s+من", "هناك العديد من"),
    (r"(?<![\w])[وف]?(?:واحد|واحده)\s+من\s+(?:اهم|اكثر|ابرز|افضل|اكبر|اخطر)", "واحد من أهم"),
    (r"(?<![\w])[وف]?(?:ي|ت)?(?:حدث|احداث|صنع|يصنع|تصنع|يحدث|تحدث)\s+(?:ال)?(?:فرق|فارق|الفارق)(?![\w])", "إحداث فرق (make a difference)"),
    (r"(?<![\w])[وف]?(?:ي|ت)?(?:اخذ|ياخذ|تاخذ|اخذت)\s+مكان(?:ه|ها)?(?![\w])", "يأخذ مكاناً (take place)"),
]

# Sentence-initial additive connectives.
ADDITIVE = (
    r"^(?:و|ف)?(?:بالاضافه\s+(?:الي|ل)\s*ذلك|اضافه\s+(?:الي|ل)\s*ذلك|علاوه\s+علي\s+ذلك|فضلا\s+عن\s+ذلك|"
    r"الي\s+جانب\s+ذلك|كما\s+ان|كما|ايضا|من\s+ناحيه\s+اخري|من\s+جهه\s+اخري|ناهيك\s+عن|علاوه\s+علي|فضلا\s+عن|"
    r"بالاضافه\s+الي|اضافه\s+الي|ومن\s+ثم)(?![\w])"
)
CAUSAL_CHECK = r"^(?:و|ف)?(?:بالتالي|وبالتالي|ومن\s+هنا|ومن\s+ثم|لذلك|لذا|وعليه|بناء\s+علي\s+ذلك)(?![\w])"
ENUM = r"^(?:و)?(?:اولا|ثانيا|ثالثا|رابعا|خامسا|اخيرا|واخيرا)(?![\w])"

DOUBLETS = [
    "الجهود والمساعي", "المساعي والجهود", "التطور والتقدم", "التقدم والتطور", "التقدم والازدهار",
    "النمو والازدهار", "الكفاءه والفعاليه", "الفعاليه والكفاءه", "الدقه والموثوقيه", "الابداع والابتكار",
    "الابتكار والابداع", "التطوير والتحسين", "التحسين والتطوير", "التحديات والصعوبات", "الصعوبات والتحديات",
    "المزايا والفوائد", "الفوائد والمزايا", "الاهميه والقيمه", "التعاون والتكامل", "الرخاء والازدهار",
    "الوعي والادراك", "الدعم والمسانده", "المسانده والدعم", "الرعايه والاهتمام", "الاهتمام والرعايه",
    "التميز والرياده", "الرياده والتميز", "الشفافيه والوضوح", "السرعه والكفاءه", "المرونه والكفاءه",
    "التنميه والتطوير", "النجاح والتميز", "التميز والنجاح", "الجوده والتميز", "الامان والاستقرار",
]

DENSITY_WORDS = [
    ("يعد/تعد/يعتبر/تعتبر", r"(?<![\w])[وف]?(?:يعد|تعد|يعتبر|تعتبر|تعدان|يعدان)(?![\w])"),
    ("يمثل/تمثل", r"(?<![\w])[وف]?(?:يمثل|تمثل|يمثلان|تمثلان)(?![\w])"),
    ("من خلال", r"(?<![\w])[وف]?من\s+خلال(?![\w])"),
    ("حيث", r"(?<![\w])[وف]?حيث(?![\w])"),
    ("عبر", r"(?<![\w])[وف]?عبر(?![\w])"),
    ("بشكل/بصورة", r"(?<![\w])[وف]?ب(?:شكل|صوره)(?![\w])"),
    ("تعزيز/يعزز", r"(?<![\w])[وف]?(?:ل|ب|ال|لل)?(?:تعزيز|يعزز|تعزز)(?![\w])"),
    ("أهمية/مهم", r"(?<![\w])[وف]?(?:ب|ل|ال|لل)?(?:اهميه|مهم|مهمه|هام|هامه)(?![\w])"),
    ("كما", r"(?<![\w])[وف]?كما(?![\w])"),
    ("مختلف/متنوع", r"(?<![\w])[وف]?(?:ال)?(?:مختلف|مختلفه|متنوع|متنوعه)(?![\w])"),
    ("تطوير/تحسين", r"(?<![\w])[وف]?(?:ل|ب|ال|لل)?(?:تطوير|تحسين)(?![\w])"),
    ("بالتالي", r"(?<![\w])[وف]?بالتالي(?![\w])"),
    ("يتم/تم", r"(?<![\w])[وف]?(?:س)?(?:ي|ت)?تم(?:ت)?(?![\w])"),
]

ABBREV = {"د", "أ", "ا", "م", "ص", "ج", "هـ", "ه", "ت", "ق", "ط", "ع", "س", "e.g", "i.e", "etc", "Dr", "vs", "p", "pp"}


# --------------------------------------------------------------------------
# مساعدات / Helpers
# --------------------------------------------------------------------------


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def split_sentences(text):
    """Return (start, end, sentence) tuples, approximate."""
    spans = []
    for para in re.finditer(r"(?:[^\n]|\n(?!\s*\n))+", text):
        ptext = para.group(0)
        start = 0
        for m in re.finditer(r"[.!؟?]+(?=[\"'»”)\]]*(?:\s|$))|\n", ptext):
            if m.group(0).startswith("."):
                prev = re.search(r"([\w]+)$", ptext[:m.start()])
                if prev and prev.group(1) in ABBREV:
                    continue
                if re.search(DIGIT + r"$", ptext[:m.start()]) and re.match(DIGIT, ptext[m.end():m.end() + 1] or " "):
                    continue
            end = m.end()
            spans.append((para.start() + start, para.start() + end, ptext[start:end]))
            start = end
        if ptext[start:].strip():
            spans.append((para.start() + start, para.end(), ptext[start:]))
    out = []
    for s, e, t in spans:
        lead = len(t) - len(t.lstrip())
        if len(re.findall(r"[" + AR + r"A-Za-z]{2,}", t)) >= 3:
            out.append((s + lead, e, t[lead:]))
    return out


def word_count(s):
    return len(re.findall(r"[" + AR + r"A-Za-z0-9\u0660-\u0669]+", s))


def sentence_at(sentences, pos):
    for s, e, t in sentences:
        if s <= pos < e:
            return t
    return ""


def snippet(text, start, end, width=40):
    a = max(0, start - width)
    b = min(len(text), end + width)
    return re.sub(r"\s+", " ", text[a:b]).strip()


# --------------------------------------------------------------------------
# الفحص / Audit
# --------------------------------------------------------------------------


def detect_kind(path, forced):
    if forced:
        return forced
    if path is None:
        return "md"
    suf = path.suffix.lower()
    if suf in (".tex", ".ltx"):
        return "tex"
    if suf in (".html", ".htm"):
        return "html"
    return "md"


def audit(raw, kind):
    # Diacritic statistics on the raw text, after masking verbatim material.
    raw_masked = mask_text(raw, kind)
    letters = len(re.findall(r"[" + AR + r"]", raw_masked))
    marks = len(re.findall(r"[\u064B-\u0652]", raw_masked))

    display = strip_tashkeel(raw)            # what snippets show
    masked = mask_text(display, kind)        # same length as display
    if kind == "tex":
        masked = re.sub(r"\\[A-Za-z]+\*?", lambda m: " " * len(m.group(0)), masked)
    norm = normalize(masked)                 # same length, used for matching
    sentences = split_sentences(norm)
    hits = []

    def add(kind_, label, pos, end, note=""):
        hits.append({
            "line": line_of(display, pos),
            "kind": kind_,
            "label": label,
            "context": snippet(display, pos, end),
            "note": note,
        })

    for pattern, tier, keeps, label in WORDS:
        for m in re.finditer(pattern, norm):
            sent = sentence_at(sentences, m.start()) or norm[max(0, m.start() - 120):m.end() + 120]
            if any(re.search(k, sent) for k in keeps):
                continue
            add("word:" + tier, label, m.start(), m.end())

    for pattern, label in TEMPLATES:
        for m in re.finditer(pattern, norm):
            add("template", label, m.start(), m.end())

    for pattern, label in CALQUES:
        for m in re.finditer(pattern, norm):
            add("calque", label, m.start(), m.end())

    for d in DOUBLETS:
        for m in re.finditer(r"(?<![\w])[وف]?(?:ب|ل|ك)?" + re.sub(r"\s+", r"\\s+", d) + r"(?![\w])", norm):
            add("structure", "ازدواج مترادفات", m.start(), m.end())

    # Sentence openers.
    prev_first = None
    run = 0
    for s, e, t in sentences:
        lead = t.lstrip(" \t-*•#0123456789.)(")
        off = s + (len(t) - len(lead))
        m = re.match(ADDITIVE, lead)
        if m:
            add("transition", "ربط إضافي في أول الجملة: " + display[off:off + len(m.group(0))].strip(), off, off + len(m.group(0)))
        m = re.match(CAUSAL_CHECK, lead)
        if m:
            add("transition", "تحقق من السببية: " + display[off:off + len(m.group(0))].strip(), off, off + len(m.group(0)),
                "تبقى إن كانت العلاقة سببية حقيقية")
        m = re.match(ENUM, lead)
        if m:
            add("structure", "تعداد (أولاً/ثانياً) في أول الجملة", off, off + len(m.group(0)),
                "مقبول في الإجراءات والأهداف المرقمة")
        first = re.match(r"[\w]+", lead)
        first = first.group(0) if first else None
        if first and first == prev_first and first not in ("و", "ف"):
            run += 1
            if run == 2:
                add("structure", "ثلاث جمل متتالية تبدأ بالكلمة نفسها: " + display[off:off + len(first)], off, off + len(first))
        else:
            run = 0
        prev_first = first

    # Punctuation.
    for m in re.finditer(r"(?<=[" + AR + r"])\s*,|,\s*(?=[" + AR + r"])", norm):
        add("punct", "فاصلة لاتينية (,) في نص عربي", m.start(), m.end())
    for m in re.finditer(r"(?<=[" + AR + r"])\s*;|;\s*(?=[" + AR + r"])", norm):
        add("punct", "فاصلة منقوطة لاتينية (;) في نص عربي", m.start(), m.end())
    for m in re.finditer(r"(?<=[" + AR + r"\s])\?", norm):
        add("punct", "علامة استفهام لاتينية (?) في نص عربي", m.start(), m.end())
    norm_full = normalize(display)
    for m in re.finditer(r"[" + AR + r"][ \t]+[،؛؟:.](?!\.)", norm_full):
        if masked[m.start():m.end()] == display[m.start():m.end()]:  # skip masked regions
            add("punct", "مسافة قبل علامة الترقيم", m.start(), m.end())
    for s, e, t in sentences:
        dashes = [mm for mm in re.finditer(r"\s[—–]\s|\s-\s|—", t)]
        if not dashes:
            continue
        if len(dashes) == 1:
            mm = dashes[0]
            add("punct", "شرطة منفردة (غالباً تمهيد لمفاجأة)", s + mm.start(), s + mm.end())
        else:
            mm = dashes[0]
            add("punct", "شرطتان (اعتراض؛ تقبل إن قلّت)", s + mm.start(), s + mm.end())
    for m in re.finditer(r"!+", norm):
        line_start = norm.rfind("\n", 0, m.start()) + 1
        line = norm[line_start:m.start()]
        if re.match(r"\s*[-–—]", line):  # dialogue line
            continue
        if re.search(r"(?<![\w])ما\s+ا\w+", line[-40:]):  # صيغة التعجب
            continue
        add("punct", "علامة تعجب" + (" مكررة" if len(m.group(0)) > 1 else ""), m.start(), m.end())
    for m in re.finditer(r"(?:\.{3,}|…)", norm):
        add("punct", "علامة حذف (...)", m.start(), m.end(), "تبقى لحذف جزء من اقتباس")
    for m in re.finditer(r"(?<![\w])[وف]?(?:ال)?(?:نتيجه|خلاصه|سر|جواب|حل|مفاجاه|اهم|فكره|حقيقه)\s*[:]\s*\S", norm):
        add("punct", "نقطتان قبل مفاجأة (والنتيجة: ...)", m.start(), m.end())
    if kind == "md":
        for m in re.finditer(r"(?<![*\w])\*\*[^*\n]+\*\*(?=[^\n]*[" + AR + r"]{3,}[^\n]*[.؟!]\s*$)", display, re.M):
            line_start = display.rfind("\n", 0, m.start()) + 1
            before = display[line_start:m.start()]
            if before.strip() and not re.match(r"^\s*([-*+•]|\d+[.)])\s*$", before):
                add("format", "خط عريض داخل النثر", m.start(), m.end())

    # Deduplicate and sort.
    seen = set()
    uniq = []
    for h in hits:
        k = (h["line"], h["label"], h["context"][:30])
        if k not in seen:
            seen.add(k)
            uniq.append(h)
    hits = sorted(uniq, key=lambda h: (h["line"], h["kind"]))

    # Paragraph clusters.
    clusters = []
    for para in re.finditer(r"(?:[^\n]|\n(?!\s*\n))+", norm):
        lead = len(para.group(0)) - len(para.group(0).lstrip())
        a, b = line_of(display, para.start() + lead), line_of(display, para.end())
        n = sum(1 for h in hits if a <= h["line"] <= b and h["kind"] in ("word:high", "template", "transition", "calque"))
        if n >= 3:
            clusters.append({"lines": f"{a}-{b}", "markers": n})

    # Density.
    words = word_count(norm)
    density = {}
    for label, pat in DENSITY_WORDS:
        c = len(re.findall(pat, norm))
        if c:
            density[label] = {"count": c, "per_1000": round(1000 * c / max(words, 1), 1)}

    # Formatting stats.
    lines = [ln for ln in display.split("\n") if ln.strip()]
    list_lines = sum(1 for ln in lines if re.match(r"^\s*(?:[-*+•]|\d+[.)]|[\u0660-\u0669]+[.)]|[0-9]️⃣)\s+", ln))
    heading_lines = sum(1 for ln in lines if re.match(r"^\s*#{1,6}\s", ln))
    emojis = len(re.findall(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2B06\u2194-\u21FF\u2705\u274C]", display))
    triads = len(re.findall(r"(?<![\w])(?:ال)[" + AR + r"]{3,}[،,]?\s+و(?:ال)[" + AR + r"]{3,}[،,]?\s+و(?:ال)[" + AR + r"]{3,}", norm))
    quotes = {
        "«»": raw.count("«"),
        "\"\"": raw.count("\"") // 2,
        "“”": raw.count("\u201c"),
    }
    western_digits = len(re.findall(r"(?<![\w.])[0-9]+(?![\w.])", masked))
    eastern_digits = len(re.findall(r"[\u0660-\u0669]+", masked))

    lengths = [word_count(t) for _, _, t in sentences]
    stats = {
        "words": words,
        "sentences": len(lengths),
        "list_lines": list_lines,
        "heading_lines": heading_lines,
        "nonempty_lines": len(lines),
        "emojis": emojis,
        "triads": triads,
        "quote_styles": {k: v for k, v in quotes.items() if v},
        "digits": {"western": western_digits, "eastern": eastern_digits},
        "tashkeel_per_100_letters": round(100 * marks / max(letters, 1), 1),
        "tashkeel_marks": marks,
    }
    if len(lengths) >= 15:
        q = statistics.quantiles(lengths, n=4)
        stats.update({
            "median": statistics.median(lengths),
            "q1": q[0],
            "q3": q[2],
            "over_40_pct": round(100 * sum(x > 40 for x in lengths) / len(lengths)),
            "le_8_pct": round(100 * sum(x <= 8 for x in lengths) / len(lengths)),
        })
        runs = []
        for i in range(len(lengths) - 4):
            window = lengths[i:i + 5]
            if max(window) - min(window) <= 5:
                runs.append(line_of(display, sentences[i][0]))
        merged = []
        for ln in runs:
            if not merged or ln - merged[-1] > 3:
                merged.append(ln)
        stats["uniform_runs_at_lines"] = merged
    else:
        stats["note"] = "أقل من ١٥ جملة؛ إحصاءات الطول غير ذات معنى هنا"

    return {"hits": hits, "clusters": clusters, "density": density, "stats": stats}


GROUPS = [
    ("word:high", "ألفاظ الزخرف"),
    ("template", "القوالب الجاهزة"),
    ("transition", "أدوات الربط في أول الجمل"),
    ("calque", "التراكيب المترجمة"),
    ("word:editorial", "ألفاظ تحريرية (بعد استبعاد المعاني الاصطلاحية الشائعة)"),
    ("structure", "البناء"),
    ("punct", "الترقيم"),
    ("format", "الشكل"),
]


def render(name, result):
    out = [f"# فحص: {name}", ""]
    out.append("كل بند مرشح لاختبار الضرورة (SKILL.md)، لا خطأ مؤكد. يبقى البند إن كان نصاً منقولاً،")
    out.append("أو مصطلحاً، أو مما تفرضه الجهة، أو ضرورة بنائية، أو لا بديل له يؤدي المعنى.")
    out.append("")
    st = result["stats"]
    out.append("## إحصاءات\n")
    out.append(f"{st['words']} كلمة، {st['sentences']} جملة.")
    if "median" in st:
        out.append(
            f"طول الجملة: الوسيط {st['median']}، والنصف الأوسط بين {st['q1']:.0f} و{st['q3']:.0f} كلمة؛ "
            f"{st['over_40_pct']}٪ أطول من ٤٠ كلمة، و{st['le_8_pct']}٪ من ٨ كلمات أو أقل."
        )
        if st["uniform_runs_at_lines"]:
            out.append("سلاسل من ٥ جمل متقاربة الطول (فرق ≤ ٥ كلمات) تبدأ قرب الأسطر: "
                       + "، ".join(map(str, st["uniform_runs_at_lines"])))
    else:
        out.append(st["note"] + ".")
    if st["nonempty_lines"]:
        ratio = round(100 * st["list_lines"] / st["nonempty_lines"])
        if st["list_lines"] or st["heading_lines"]:
            out.append(f"أسطر القوائم: {st['list_lines']} ({ratio}٪ من الأسطر)، والعناوين: {st['heading_lines']}."
                       + (" هيكلة كثيفة؛ تحقق من أن الجنس يقتضيها." if ratio >= 30 else ""))
    if st["emojis"]:
        out.append(f"رموز تعبيرية: {st['emojis']}.")
    if st["triads"] >= 3:
        out.append(f"ثلاثيات معرّفة (الـX والـY والـZ): {st['triads']}. راجع ما كان منها حشواً للإيقاع.")
    if len(st["quote_styles"]) > 1:
        out.append("خلط بين أنواع علامات التنصيص: " + "، ".join(f"{k} ({v})" for k, v in st["quote_styles"].items()) + ".")
    if st["digits"]["western"] and st["digits"]["eastern"]:
        out.append(f"خلط بين نظامي الأرقام: غربية ({st['digits']['western']}) وهندية ({st['digits']['eastern']}).")
    if 1 <= st["tashkeel_per_100_letters"] < 15 and st["tashkeel_marks"] >= 10:
        out.append(f"تشكيل متناثر: {st['tashkeel_per_100_letters']} حركة لكل ١٠٠ حرف. أبقِ ما يمنع اللبس وما كان من الكاتب باتساق.")
    out.append("")
    if result["clusters"]:
        out.append("## تكتلات (٣ علامات أو أكثر في فقرة؛ أعد بناء الفقرة حول الحقائق ولا تكتفِ بالمرادفات)\n")
        for c in result["clusters"]:
            out.append(f"- الأسطر {c['lines']}: {c['markers']} علامات")
        out.append("")
    for kind, title in GROUPS:
        items = [h for h in result["hits"] if h["kind"] == kind]
        if not items:
            continue
        out.append(f"## {title} ({len(items)})\n")
        for h in items:
            note = f"  [{h['note']}]" if h["note"] else ""
            out.append(f"- س{h['line']}: {h['label']}: «{h['context']}»{note}")
        out.append("")
    heavy = {w: d for w, d in result["density"].items()
             if (d["per_1000"] >= 6 and d["count"] >= 3) or d["count"] >= 8}
    if heavy:
        out.append("## كثافة ألفاظ شائعة (لا تعدّل كل موضع؛ عالج فقط حين تتكئ عليها الفقرات)\n")
        for w, d in sorted(heavy.items(), key=lambda kv: -kv[1]["per_1000"]):
            out.append(f"- {w}: {d['count']} ({d['per_1000']} لكل ١٠٠٠ كلمة)")
        out.append("")
    if not result["hits"]:
        out.append("لم يُرصد أي مرشح.")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+", help="ملفات للفحص، أو - للإدخال القياسي")
    ap.add_argument("--json", action="store_true", help="مخرجات JSON بدل التقرير")
    ap.add_argument("--format", choices=["md", "tex", "html", "txt"], help="فرض نوع الملف")
    args = ap.parse_args()

    forced = None if args.format in (None, "txt") else args.format
    reports = {}
    for f in args.files:
        if f == "-":
            raw = sys.stdin.read()
            name, kind = "stdin", forced or "md"
        else:
            path = Path(f)
            raw = path.read_text(encoding="utf-8", errors="replace")
            name, kind = str(path), detect_kind(path, forced)
        reports[name] = audit(raw, kind)

    if args.json:
        print(json.dumps(reports, indent=2, ensure_ascii=False))
    else:
        print("\n\n".join(render(n, r) for n, r in reports.items()))


if __name__ == "__main__":
    main()

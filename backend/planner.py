import math
import uuid
from datetime import date, datetime, timedelta

# Szövegek két nyelven: sr (szerb) és hu (magyar)
T = {
    "sr": {
        "learn_main": "Učenje gradiva: {subject} (nove lekcije)",
        "learn_second": "Pravljenje beleški i rezimea: {subject}",
        "practice_main": "Vežbanje zadataka: {subject}",
        "practice_second": "Rešavanje prethodnih ispita: {subject}",
        "revise_main": "Ponavljanje celog gradiva: {subject}",
        "revise_second": "Ponavljanje najtežih delova: {subject}",
        "final_main": "Završno ponavljanje i probni test: {subject}",
        "final_second": "Odmor i lagano pregledanje beleški: {subject}",
        "err_subject": "Unesite naziv predmeta.",
        "err_date": "Unesite ispravan datum ispita (budući datum).",
        "err_hours": "Broj sati nedeljno mora biti između 1 i 80.",
        "err_notfound": "Plan nije pronađen.",
    },
    "hu": {
        "learn_main": "Tananyag tanulása: {subject} (új leckék)",
        "learn_second": "Jegyzetek és összefoglaló készítése: {subject}",
        "practice_main": "Feladatok gyakorlása: {subject}",
        "practice_second": "Korábbi vizsgák megoldása: {subject}",
        "revise_main": "Teljes anyag ismétlése: {subject}",
        "revise_second": "A legnehezebb részek ismétlése: {subject}",
        "final_main": "Záró ismétlés és próbateszt: {subject}",
        "final_second": "Pihenés és könnyed jegyzetátnézés: {subject}",
        "err_subject": "Add meg a tantárgy nevét.",
        "err_date": "Adj meg érvényes vizsgadátumot (jövőbeli).",
        "err_hours": "A heti óraszám 1 és 80 között legyen.",
        "err_notfound": "A terv nem található.",
    },
        "en": {
        "learn_main": "Study the material: {subject} (new lessons)",
        "learn_second": "Make notes and a summary: {subject}",
        "practice_main": "Practice exercises: {subject}",
        "practice_second": "Solve past exams: {subject}",
        "revise_main": "Review all material: {subject}",
        "revise_second": "Review the hardest parts: {subject}",
        "final_main": "Final review and mock test: {subject}",
        "final_second": "Rest and light review of notes: {subject}",
        "err_subject": "Enter the subject name.",
        "err_date": "Enter a valid exam date (in the future).",
        "err_hours": "Hours per week must be between 1 and 80.",
        "err_notfound": "Plan not found.",
    },
}


def tr(lang, key, **kw):
    lang = lang if lang in T else "sr"
    return T[lang][key].format(**kw)


def round_half(x):
    return round(x * 2) / 2


def build_plan(subject, exam_date_str, hours_per_week, lang="sr"):
    """Visszaad (plan, hiba). Ha hiba van, plan=None."""
    subject = (subject or "").strip()
    if not subject:
        return None, tr(lang, "err_subject")

    try:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None, tr(lang, "err_date")

    today = date.today()
    days_left = (exam_date - today).days
    if days_left < 1:
        return None, tr(lang, "err_date")

    try:
        hours = float(hours_per_week)
    except (ValueError, TypeError):
        return None, tr(lang, "err_hours")
    if hours < 1 or hours > 80:
        return None, tr(lang, "err_hours")

    weeks = max(1, math.ceil(days_left / 7))
    activities = []

    for w in range(1, weeks + 1):
        progress = w / weeks
        if w == weeks:
            phase = "final"
        elif progress <= 0.5:
            phase = "learn"
        elif progress <= 0.85:
            phase = "practice"
        else:
            phase = "revise"

        # ha csak 1 hét van, az is záró hét
        main_h = round_half(hours * 0.6)
        second_h = round_half(hours - main_h)
        week_start = today + timedelta(days=(w - 1) * 7)

        for part, h in (("main", main_h), ("second", second_h)):
            if h <= 0:
                continue
            activities.append({
                "id": uuid.uuid4().hex[:8],
                "week": w,
                "week_start": week_start.isoformat(),
                "phase": phase,
                "part": part,
                "title": tr(lang, f"{phase}_{part}", subject=subject),
                "hours": h,
                "done": False,
            })

    plan = {
        "id": uuid.uuid4().hex[:10],
        "subject": subject,
        "exam_date": exam_date.isoformat(),
        "hours_per_week": hours,
        "days_left": days_left,
        "weeks": weeks,
        "lang": lang,
        "activities": activities,
    }
    return plan, None
"""
seed.py — Network Platform database seed
=========================================
Populates all 13 tables with realistic data for 20 users.
Exercises every feature:
  F1  Manual Connection Adding
  F2  Intent Declaration
  F3  Path Discovery (connections + warmth scores)
  F4  Intro Request
  F5  Connector Inbox
  F6  Proactive Connector Prompts
  F7  Context Pre-Reads
  F8  Coffee Chats

Requirements:
    pip install psycopg2-binary bcrypt python-dotenv

Usage:
    DATABASE_URL=postgresql://user:pass@localhost:5432/dbname python seed.py
    -- or create a .env file with DATABASE_URL set
"""

import os
import uuid
import bcrypt
import psycopg2
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# ─────────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────────

def gen_id() -> str:
    return str(uuid.uuid4())

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)

def ordered_pair(a: str, b: str):
    """Return (a, b) with the smaller UUID first (satisfies chk_ordered_ids)."""
    return (a, b) if a < b else (b, a)

# ─────────────────────────────────────────────────────────────
# seed data definitions
# ─────────────────────────────────────────────────────────────

USERS = [
    # (first, last, email, year, major, bio, profile_source)
    ("Alice",   "Chen",     "alice@uni.edu",   "junior",   "Computer Science",      "Passionate about ML and open-source.",          "manual"),
    ("Ben",     "Torres",   "ben@uni.edu",     "senior",   "Electrical Engineering","Looking for full-time roles in embedded systems.","linkedin_import"),
    ("Cara",    "Okafor",   "cara@uni.edu",    "sophomore","Biology",               "Pre-med, interested in research labs.",          "manual"),
    ("David",   "Kim",      "david@uni.edu",   "grad",     "Data Science",          "PhD student, open to research collabs.",         "resume_import"),
    ("Elena",   "Russo",    "elena@uni.edu",   "junior",   "Finance",               "Seeking internships at hedge funds.",            "linkedin_import"),
    ("Felix",   "Nkosi",    "felix@uni.edu",   "freshman", "Undeclared",            "Exploring clubs and extracurriculars.",          "manual"),
    ("Grace",   "Liu",      "grace@uni.edu",   "senior",   "Computer Science",      "Full-stack dev, looking for SWE internships.",   "manual"),
    ("Henry",   "Patel",    "henry@uni.edu",   "junior",   "Mechanical Engineering","Robotics club lead, seeking research.",          "resume_import"),
    ("Iris",    "Dubois",   "iris@uni.edu",    "sophomore","Political Science",      "Interested in policy debate clubs.",             "manual"),
    ("Jake",    "Morrow",   "jake@uni.edu",    "senior",   "Economics",             "Writing thesis on labor markets.",               "linkedin_import"),
    ("Karen",   "Singh",    "karen@uni.edu",   "grad",     "Computer Science",      "ML researcher, TAing for CS 499.",               "manual"),
    ("Leo",     "Andrade",  "leo@uni.edu",     "junior",   "Chemistry",             "Interested in pharma internships.",              "manual"),
    ("Maya",    "Brooks",   "maya@uni.edu",    "senior",   "Marketing",             "Building a student startup.",                   "linkedin_import"),
    ("Noah",    "Fischer",  "noah@uni.edu",    "sophomore","Physics",               "Wants to join research labs.",                  "manual"),
    ("Olivia",  "Tan",      "olivia@uni.edu",  "junior",   "Computer Science",      "Frontend dev, loves design systems.",           "resume_import"),
    ("Peter",   "Walsh",    "peter@uni.edu",   "senior",   "Business Admin",        "Entrepreneurship club president.",              "manual"),
    ("Quinn",   "James",    "quinn@uni.edu",   "freshman", "Undeclared",            "Figuring out my major still.",                  "manual"),
    ("Rachel",  "Nguyen",   "rachel@uni.edu",  "junior",   "Biomedical Engineering","Research focused, interested in MedTech.",      "linkedin_import"),
    ("Sam",     "Cooper",   "sam@uni.edu",     "grad",     "Statistics",            "Data science TA, loves kaggle.",                "resume_import"),
    ("Tina",    "Morales",  "tina@uni.edu",    "senior",   "Psychology",            "Studying cognitive bias in UX.",                "manual"),
]

# interests: (category, label)
USER_INTERESTS = {
    "alice@uni.edu":   [("skill","Machine Learning"), ("research","NLP"), ("internship","Software Engineering")],
    "ben@uni.edu":     [("internship","Embedded Systems"), ("skill","C++"), ("internship","Hardware Design")],
    "cara@uni.edu":    [("research","Molecular Biology"), ("club","Pre-Med Society"), ("internship","Clinical Research")],
    "david@uni.edu":   [("research","Deep Learning"), ("skill","Python"), ("research","Time Series Analysis")],
    "elena@uni.edu":   [("internship","Investment Banking"), ("skill","Financial Modeling"), ("club","Finance Club")],
    "felix@uni.edu":   [("club","Debate Club"), ("club","Chess Club"), ("skill","Public Speaking")],
    "grace@uni.edu":   [("internship","Software Engineering"), ("skill","React"), ("skill","TypeScript")],
    "henry@uni.edu":   [("research","Robotics"), ("club","Robotics Club"), ("internship","Mechanical Design")],
    "iris@uni.edu":    [("club","Model UN"), ("club","Debate Club"), ("research","Policy Research")],
    "jake@uni.edu":    [("research","Labor Economics"), ("skill","R"), ("internship","Economic Consulting")],
    "karen@uni.edu":   [("research","Machine Learning"), ("skill","PyTorch"), ("class","CS 499")],
    "leo@uni.edu":     [("internship","Pharmaceutical"), ("research","Organic Chemistry"), ("skill","Lab Techniques")],
    "maya@uni.edu":    [("skill","Brand Strategy"), ("club","Entrepreneurship Club"), ("internship","Marketing")],
    "noah@uni.edu":    [("research","Quantum Physics"), ("research","Astrophysics"), ("skill","MATLAB")],
    "olivia@uni.edu":  [("skill","UI/UX Design"), ("skill","Figma"), ("internship","Frontend Development")],
    "peter@uni.edu":   [("club","Entrepreneurship Club"), ("skill","Venture Capital"), ("internship","Business Development")],
    "quinn@uni.edu":   [("club","Photography Club"), ("club","Hiking Club"), ("skill","Video Editing")],
    "rachel@uni.edu":  [("research","Biomedical Devices"), ("internship","MedTech"), ("skill","MATLAB")],
    "sam@uni.edu":     [("skill","Statistical Modeling"), ("research","Causal Inference"), ("skill","Python")],
    "tina@uni.edu":    [("research","UX Research"), ("skill","User Testing"), ("internship","Product Design")],
}

# experiences: (type, title, organization, start_date, end_date, description)
USER_EXPERIENCES = {
    "alice@uni.edu":   [
        ("internship","ML Intern","Google",            date(2023,6,1), date(2023,8,31), "Worked on ranking models."),
        ("research",  "RA",      "NLP Lab",            date(2023,9,1), None,            "Ongoing research on summarisation."),
    ],
    "ben@uni.edu":     [
        ("internship","HW Intern","Intel",             date(2023,5,1), date(2023,8,31), "FPGA design work."),
    ],
    "cara@uni.edu":    [
        ("volunteer", "Volunteer","Campus Clinic",     date(2023,1,1), None,            "Patient intake support."),
    ],
    "david@uni.edu":   [
        ("research",  "PhD RA",  "Data Science Lab",  date(2022,9,1), None,            "Time-series forecasting."),
        ("full_time", "TA",      "CS Department",      date(2023,9,1), None,            "TA for intro ML course."),
    ],
    "elena@uni.edu":   [
        ("internship","Analyst Intern","Goldman Sachs",date(2023,6,1), date(2023,8,15),"DCF modelling, pitchbooks."),
    ],
    "grace@uni.edu":   [
        ("internship","SWE Intern","Stripe",           date(2023,5,15),date(2023,8,15),"Payments dashboard work."),
        ("part_time", "Freelance","Self",              date(2022,6,1), None,            "React projects for local businesses."),
    ],
    "henry@uni.edu":   [
        ("research",  "RA",      "Robotics Lab",      date(2023,2,1), None,            "Autonomous navigation project."),
    ],
    "karen@uni.edu":   [
        ("research",  "PhD RA",  "ML Lab",            date(2021,9,1), None,            "Vision transformers."),
        ("full_time", "TA",      "CS Department",      date(2023,9,1), None,            "TA for CS 499."),
    ],
    "maya@uni.edu":    [
        ("internship","Marketing Intern","HubSpot",    date(2023,6,1), date(2023,8,31),"Content and growth."),
    ],
    "olivia@uni.edu":  [
        ("internship","Design Intern","Figma",         date(2023,5,1), date(2023,8,31),"Design systems work."),
    ],
    "peter@uni.edu":   [
        ("full_time","Co-founder","CampusCart",        date(2022,3,1), None,            "Student marketplace startup."),
    ],
    "rachel@uni.edu":  [
        ("research",  "RA",      "BioMed Lab",        date(2023,1,1), None,            "Wearable sensor prototyping."),
    ],
    "sam@uni.edu":     [
        ("full_time", "TA",      "Statistics Dept",   date(2023,9,1), None,            "TA for regression analysis."),
        ("internship","Data Intern","Airbnb",          date(2022,6,1), date(2022,8,31),"A/B test infrastructure."),
    ],
    "tina@uni.edu":    [
        ("internship","UX Intern","IDEO",              date(2023,5,1), date(2023,8,15),"User research & testing."),
    ],
}

# connections: (email_a, email_b, context, warmth_score, status)
# email_a < email_b will be enforced by ordered_pair()
CONNECTIONS_DATA = [
    ("alice@uni.edu",  "karen@uni.edu",  "CS 499 group",                       5, "accepted"),
    ("alice@uni.edu",  "grace@uni.edu",  "Hackathon team 2023",                4, "accepted"),
    ("alice@uni.edu",  "david@uni.edu",  "ML reading group",                   4, "accepted"),
    ("alice@uni.edu",  "olivia@uni.edu", "Intro to UX workshop",               3, "accepted"),
    ("ben@uni.edu",    "henry@uni.edu",  "Robotics lab neighbours",            4, "accepted"),
    ("ben@uni.edu",    "rachel@uni.edu", "Engineering week project",           3, "accepted"),
    ("cara@uni.edu",   "leo@uni.edu",    "Orgo study group",                   4, "accepted"),
    ("cara@uni.edu",   "noah@uni.edu",   "Dorm roommates freshman year",       5, "accepted"),
    ("david@uni.edu",  "sam@uni.edu",    "Stats PhD cohort",                   5, "accepted"),
    ("david@uni.edu",  "karen@uni.edu",  "Joint ML lab seminar",               4, "accepted"),
    ("elena@uni.edu",  "jake@uni.edu",   "Finance club officers",              4, "accepted"),
    ("elena@uni.edu",  "peter@uni.edu",  "Entrepreneurship speaker panel",     3, "accepted"),
    ("felix@uni.edu",  "iris@uni.edu",   "Debate club teammates",              5, "accepted"),
    ("felix@uni.edu",  "quinn@uni.edu",  "Freshman orientation group",         3, "accepted"),
    ("grace@uni.edu",  "olivia@uni.edu", "CS women's network",                 4, "accepted"),
    ("grace@uni.edu",  "tina@uni.edu",   "Product design workshop",            3, "accepted"),
    ("henry@uni.edu",  "rachel@uni.edu", "Engineering capstone team",          4, "accepted"),
    ("jake@uni.edu",   "sam@uni.edu",    "Econ-Stats joint seminar",           3, "accepted"),
    ("karen@uni.edu",  "sam@uni.edu",    "Data science TA office hours",       4, "accepted"),
    ("maya@uni.edu",   "peter@uni.edu",  "Entrepreneurship club co-founders",  5, "accepted"),
    ("maya@uni.edu",   "tina@uni.edu",   "Marketing + UX crossover talk",      3, "accepted"),
    ("noah@uni.edu",   "rachel@uni.edu", "Physics lab partners",               3, "accepted"),
    # pending connections
    ("olivia@uni.edu", "tina@uni.edu",   "Design systems interest",            2, "pending"),
    ("leo@uni.edu",    "rachel@uni.edu", "BioMed interest overlap",            2, "pending"),
]

# intents: one active per user (category, description)
USER_INTENTS = {
    "alice@uni.edu":   ("internship", "Looking for a summer ML internship at a top tech company."),
    "ben@uni.edu":     ("internship", "Seeking full-time embedded systems role after graduation."),
    "cara@uni.edu":    ("research",   "Want to join a biology research lab for independent study credit."),
    "david@uni.edu":   ("research",   "Looking for collaborators on time-series anomaly detection paper."),
    "elena@uni.edu":   ("internship", "Targeting investment banking internships for next summer."),
    "felix@uni.edu":   ("club",       "Want to join a competitive debate club this semester."),
    "grace@uni.edu":   ("internship", "Looking for SWE internship with a strong frontend focus."),
    "henry@uni.edu":   ("research",   "Seeking a research position in autonomous robotics."),
    "iris@uni.edu":    ("club",       "Interested in joining Model UN and policy debate teams."),
    "jake@uni.edu":    ("research",   "Looking for a faculty advisor for my labor economics thesis."),
    "karen@uni.edu":   ("research",   "Seeking PhD students interested in vision transformer research."),
    "leo@uni.edu":     ("internship", "Looking for a pharma or biotech internship for next summer."),
    "maya@uni.edu":    ("internship", "Seeking a growth marketing internship at an early-stage startup."),
    "noah@uni.edu":    ("research",   "Looking to join a physics or astrophysics research lab."),
    "olivia@uni.edu":  ("internship", "Seeking a product design or frontend internship."),
    "peter@uni.edu":   ("skill",      "Want to learn more about venture capital term sheets."),
    "quinn@uni.edu":   ("club",       "Looking for creative clubs — photography or film."),
    "rachel@uni.edu":  ("research",   "Seeking collaborators on wearable biosensor research."),
    "sam@uni.edu":     ("research",   "Looking for industry data science research partnerships."),
    "tina@uni.edu":    ("internship", "Targeting UX research roles at product companies."),
}

# ─────────────────────────────────────────────────────────────
# main seed
# ─────────────────────────────────────────────────────────────

def seed():
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    print("🌱 Starting seed...")

    # ── 1. USERS ─────────────────────────────────────────────
    print("  → Inserting 20 users...")
    user_ids: dict[str, str] = {}  # email → uuid

    for (first, last, email, year, major, bio, source) in USERS:
        uid = gen_id()
        user_ids[email] = uid
        cur.execute("""
            INSERT INTO users (
                user_id, is_active, email, password_hash,
                first_name, last_name, year, major, bio,
                linkedin_url, resume_url, profile_complete,
                profile_source, created_at, updated_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            uid, True, email, hash_password("Password123!"),
            first, last, year, major, bio,
            f"https://linkedin.com/in/{first.lower()}-{last.lower()}" if source == "linkedin_import" else None,
            f"https://resumes.uni.edu/{uid}.pdf"                      if source == "resume_import"   else None,
            True,
            source,
            days_ago(60), days_ago(1),
        ))

    # ── 2. PRIVACY SETTINGS (one per user, auto-created) ─────
    print("  → Inserting privacy settings...")
    permissions = ["anyone","connections","connections_of_connections","connections_of_connections"]
    for i, email in enumerate(user_ids):
        cur.execute("""
            INSERT INTO privacy_settings (
                privacy_id, user_id, who_can_request,
                show_in_discovery, allow_connector_prompts
            ) VALUES (%s,%s,%s,%s,%s)
        """, (
            gen_id(), user_ids[email],
            permissions[i % len(permissions)],
            True, True,
        ))

    # ── 3. USER INTERESTS ────────────────────────────────────
    print("  → Inserting user interests...")
    for email, interests in USER_INTERESTS.items():
        for (category, label) in interests:
            cur.execute("""
                INSERT INTO user_interests (interest_id, user_id, category, label)
                VALUES (%s,%s,%s,%s)
            """, (gen_id(), user_ids[email], category, label))

    # ── 4. USER EXPERIENCES ──────────────────────────────────
    print("  → Inserting user experiences...")
    for email, exps in USER_EXPERIENCES.items():
        for (typ, title, org, start, end, desc) in exps:
            cur.execute("""
                INSERT INTO user_experiences (
                    experience_id, user_id, type, title,
                    organization, start_date, end_date, description
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (gen_id(), user_ids[email], typ, title, org, start, end, desc))

    # ── 5. CONNECTIONS (F1) ──────────────────────────────────
    print("  → Inserting connections...")
    connection_ids: dict[tuple, str] = {}   # (uid_a, uid_b) → connection_id

    for (ea, eb, context, warmth, status) in CONNECTIONS_DATA:
        uid_a, uid_b = ordered_pair(user_ids[ea], user_ids[eb])
        cid = gen_id()
        connection_ids[(uid_a, uid_b)] = cid
        cur.execute("""
            INSERT INTO connections (
                connection_id, user_id_a, user_id_b,
                context, warmth_score, status,
                created_at, accepted_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            cid, uid_a, uid_b,
            context, warmth, status,
            days_ago(30),
            days_ago(28) if status == "accepted" else None,
        ))

    # ── 6. INTENTS (F2) ─────────────────────────────────────
    print("  → Inserting intents...")
    intent_ids: dict[str, str] = {}   # email → intent_id

    for email, (category, description) in USER_INTENTS.items():
        iid = gen_id()
        intent_ids[email] = iid
        cur.execute("""
            INSERT INTO intents (
                intent_id, user_id, category, description,
                is_active, created_at, expires_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            iid, user_ids[email],
            category, description,
            True,
            days_ago(14),
            days_ago(14) + timedelta(days=90),  # active for 90 days
        ))

    # ── 7. INTRO REQUESTS (F4/F5) ────────────────────────────
    # Scenario A: Alice wants an intro to Karen via David
    #   requester=Alice, connector=David, target=Karen
    # Scenario B: Grace wants an intro to Tina via Olivia
    #   requester=Grace, connector=Olivia, target=Tina  (approved)
    # Scenario C: Noah wants an intro to Karen via David
    #   requester=Noah, connector=David, target=Karen (pending)
    # Scenario D: Leo wants an intro to Rachel via Cara (approved → has conversation)
    #   requester=Leo, connector=Cara, target=Rachel
    print("  → Inserting intro requests...")

    request_ids: dict[str, str] = {}

    # Scenario A — pending
    rid_a = gen_id()
    request_ids["A"] = rid_a
    cur.execute("""
        INSERT INTO intro_requests (
            request_id, requester_id, connector_id, target_id, intent_id,
            draft_message, edited_message, status, connector_note,
            created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        rid_a,
        user_ids["alice@uni.edu"],
        user_ids["david@uni.edu"],
        user_ids["karen@uni.edu"],
        intent_ids["alice@uni.edu"],
        "Hi David, I am working on ML internship applications and would love an intro to Karen given her research background.",
        None, "pending", None,
        days_ago(3), None,
    ))

    # Scenario B — approved
    rid_b = gen_id()
    request_ids["B"] = rid_b
    cur.execute("""
        INSERT INTO intro_requests (
            request_id, requester_id, connector_id, target_id, intent_id,
            draft_message, edited_message, status, connector_note,
            created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        rid_b,
        user_ids["grace@uni.edu"],
        user_ids["olivia@uni.edu"],
        user_ids["tina@uni.edu"],
        intent_ids["grace@uni.edu"],
        "Hi Olivia, Grace here — I know you and Tina overlap on design. Could you intro us?",
        "Hi Olivia! I have been exploring UX research intersections with frontend. Would love a chat with Tina.",
        "approved", "Happy to connect you both — you would get along well!",
        days_ago(7), days_ago(6),
    ))

    # Scenario C — declined
    rid_c = gen_id()
    request_ids["C"] = rid_c
    cur.execute("""
        INSERT INTO intro_requests (
            request_id, requester_id, connector_id, target_id, intent_id,
            draft_message, edited_message, status, connector_note,
            created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        rid_c,
        user_ids["noah@uni.edu"],
        user_ids["david@uni.edu"],
        user_ids["karen@uni.edu"],
        intent_ids["noah@uni.edu"],
        "Hi David, I am looking to join a research lab — could you connect me with Karen?",
        None, "declined", "Karen's lab is at capacity this semester, sorry.",
        days_ago(10), days_ago(9),
    ))

    # Scenario D — approved → will get conversation + prereads
    rid_d = gen_id()
    request_ids["D"] = rid_d
    cur.execute("""
        INSERT INTO intro_requests (
            request_id, requester_id, connector_id, target_id, intent_id,
            draft_message, edited_message, status, connector_note,
            created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        rid_d,
        user_ids["leo@uni.edu"],
        user_ids["cara@uni.edu"],
        user_ids["rachel@uni.edu"],
        intent_ids["leo@uni.edu"],
        "Hi Cara, I know you and Rachel overlap in bio. I am exploring MedTech internships — could you connect us?",
        "Hi Cara! Rachel's wearables work really aligns with my pharma interest. Would love an intro.",
        "approved", "These two would have a great chat — both passionate about biotech.",
        days_ago(5), days_ago(4),
    ))

    # ── 8. CONTEXT PRE-READS (F7) ────────────────────────────
    # Generated for approved requests B and D
    print("  → Inserting context pre-reads...")

    # Scenario B: Grace reads about Tina, Tina reads about Grace
    cur.execute("""
        INSERT INTO context_prereads (
            preread_id, request_id, recipient_id, subject_id,
            summary, created_at, viewed_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(), rid_b,
        user_ids["grace@uni.edu"],   # recipient: Grace reads about Tina
        user_ids["tina@uni.edu"],    # subject: Tina's profile
        "Tina Morales is a senior studying Psychology with a focus on cognitive bias in UX. "
        "She interned at IDEO doing user research and testing. Shared interests: design systems, product UX.",
        days_ago(6), days_ago(5),
    ))
    cur.execute("""
        INSERT INTO context_prereads (
            preread_id, request_id, recipient_id, subject_id,
            summary, created_at, viewed_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(), rid_b,
        user_ids["tina@uni.edu"],    # recipient: Tina reads about Grace
        user_ids["grace@uni.edu"],   # subject: Grace's profile
        "Grace Liu is a senior CS major specialising in full-stack development. "
        "Interned at Stripe and does freelance React work. Interested in frontend internships and design-engineering overlap.",
        days_ago(6), days_ago(5),
    ))

    # Scenario D: Leo reads about Rachel, Rachel reads about Leo
    cur.execute("""
        INSERT INTO context_prereads (
            preread_id, request_id, recipient_id, subject_id,
            summary, created_at, viewed_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(), rid_d,
        user_ids["leo@uni.edu"],
        user_ids["rachel@uni.edu"],
        "Rachel Nguyen is a junior in Biomedical Engineering working on wearable biosensor prototyping. "
        "Active researcher in the BioMed lab. Strong overlap with MedTech and pharmaceutical R&D.",
        days_ago(4), days_ago(3),
    ))
    cur.execute("""
        INSERT INTO context_prereads (
            preread_id, request_id, recipient_id, subject_id,
            summary, created_at, viewed_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(), rid_d,
        user_ids["rachel@uni.edu"],
        user_ids["leo@uni.edu"],
        "Leo Andrade is a junior Chemistry major interested in pharmaceutical internships. "
        "Experienced with organic chemistry lab techniques. Passionate about pharma and biotech career paths.",
        days_ago(4), None,    # Rachel hasn't viewed yet
    ))

    # ── 9. CONVERSATIONS (F8) ────────────────────────────────
    # One conversation for each approved request (B and D)
    print("  → Inserting conversations...")

    conv_b = gen_id()
    cur.execute("""
        INSERT INTO conversations (
            conversation_id, request_id, type, status, created_at
        ) VALUES (%s,%s,%s,%s,%s)
    """, (conv_b, rid_b, "chat", "active", days_ago(5)))

    conv_d = gen_id()
    cur.execute("""
        INSERT INTO conversations (
            conversation_id, request_id, type, status, created_at
        ) VALUES (%s,%s,%s,%s,%s)
    """, (conv_d, rid_d, "chat", "connector_left", days_ago(3)))

    # ── 10. CONVERSATION PARTICIPANTS (F8) ───────────────────
    print("  → Inserting conversation participants...")

    # Conversation B: Grace (requester), Olivia (connector), Tina (target)
    for (email, role, left_at) in [
        ("grace@uni.edu",  "requester", None),
        ("olivia@uni.edu", "connector", days_ago(4)),  # Olivia stepped out
        ("tina@uni.edu",   "target",    None),
    ]:
        cur.execute("""
            INSERT INTO conversation_participants (
                participant_id, conversation_id, user_id,
                role, joined_at, left_at
            ) VALUES (%s,%s,%s,%s,%s,%s)
        """, (gen_id(), conv_b, user_ids[email], role, days_ago(5), left_at))

    # Conversation D: Leo (requester), Cara (connector), Rachel (target)
    for (email, role, left_at) in [
        ("leo@uni.edu",    "requester", None),
        ("cara@uni.edu",   "connector", days_ago(2)),  # Cara stepped out
        ("rachel@uni.edu", "target",    None),
    ]:
        cur.execute("""
            INSERT INTO conversation_participants (
                participant_id, conversation_id, user_id,
                role, joined_at, left_at
            ) VALUES (%s,%s,%s,%s,%s,%s)
        """, (gen_id(), conv_d, user_ids[email], role, days_ago(3), left_at))

    # ── 11. MESSAGES (F8) ────────────────────────────────────
    print("  → Inserting messages...")

    # Conversation B messages
    for (email, body, is_warm, sent, read) in [
        ("olivia@uni.edu", "Hey Grace and Tina! Grace is a fantastic frontend dev and Tina does incredible UX research — I think you two have a lot to talk about. Handing it over!", True,  days_ago(5),  days_ago(5)),
        ("grace@uni.edu",  "Hi Tina! So excited to connect. I have been thinking a lot about the frontend ↔ UX boundary lately.",                                                   False, days_ago(5),  days_ago(5)),
        ("tina@uni.edu",   "Hi Grace! Same here. I am actually writing about design systems from a cognitive load perspective — would love your take as someone who builds them.",   False, days_ago(4),  days_ago(4)),
        ("grace@uni.edu",  "That is such a cool angle. Want to hop on a call this week?",                                                                                           False, days_ago(4),  days_ago(3)),
        ("tina@uni.edu",   "Absolutely — Thursday 3pm works for me!",                                                                                                              False, days_ago(3),  days_ago(3)),
    ]:
        cur.execute("""
            INSERT INTO messages (
                message_id, conversation_id, sender_id,
                body, is_warm_intro, sent_at, read_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (gen_id(), conv_b, user_ids[email], body, is_warm, sent, read))

    # Conversation D messages
    for (email, body, is_warm, sent, read) in [
        ("cara@uni.edu",  "Leo, Rachel! Happy to connect you both. Leo is diving into pharma and Rachel has hands-on biosensor experience — a perfect match. I'll leave you to it!", True,  days_ago(3),  days_ago(3)),
        ("leo@uni.edu",   "Thanks Cara! Rachel, I have been really curious about the MedTech side of what you are doing in lab.",                                                   False, days_ago(3),  days_ago(3)),
        ("rachel@uni.edu","Hey Leo! The wearables project could definitely have pharma applications. Are you thinking drug delivery monitoring or diagnostics?",                     False, days_ago(2),  days_ago(2)),
        ("leo@uni.edu",   "More on the diagnostics side — I am exploring point-of-care testing. Would love to see your lab sometime if that is okay.",                             False, days_ago(2),  days_ago(1)),
    ]:
        cur.execute("""
            INSERT INTO messages (
                message_id, conversation_id, sender_id,
                body, is_warm_intro, sent_at, read_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (gen_id(), conv_d, user_ids[email], body, is_warm, sent, read))

    # ── 12. CONNECTOR PROMPTS (F6) ───────────────────────────
    # When Alice posted her ML internship intent, David and Karen are prompted
    # When Felix posted his debate club intent, Iris is prompted
    print("  → Inserting connector prompts...")

    # David prompted about Alice's intent → volunteered Grace
    cur.execute("""
        INSERT INTO connector_prompts (
            prompt_id, intent_id, connector_id,
            volunteered_target_id, status, created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(),
        intent_ids["alice@uni.edu"],
        user_ids["david@uni.edu"],
        user_ids["grace@uni.edu"],   # David volunteers Grace for Alice's ML internship search
        "volunteered",
        days_ago(13), days_ago(12),
    ))

    # Karen prompted about Alice's intent → dismissed (lab is full)
    cur.execute("""
        INSERT INTO connector_prompts (
            prompt_id, intent_id, connector_id,
            volunteered_target_id, status, created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(),
        intent_ids["alice@uni.edu"],
        user_ids["karen@uni.edu"],
        None,
        "dismissed",
        days_ago(13), days_ago(11),
    ))

    # Iris prompted about Felix's debate club intent → volunteered herself (pending still)
    cur.execute("""
        INSERT INTO connector_prompts (
            prompt_id, intent_id, connector_id,
            volunteered_target_id, status, created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(),
        intent_ids["felix@uni.edu"],
        user_ids["iris@uni.edu"],
        user_ids["felix@uni.edu"],   # Iris can connect Felix to the debate team
        "volunteered",
        days_ago(12), days_ago(11),
    ))

    # Peter prompted about Maya's marketing intent → pending
    cur.execute("""
        INSERT INTO connector_prompts (
            prompt_id, intent_id, connector_id,
            volunteered_target_id, status, created_at, responded_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        gen_id(),
        intent_ids["maya@uni.edu"],
        user_ids["peter@uni.edu"],
        None,
        "pending",
        days_ago(7), None,
    ))

    # ── 13. NOTIFICATIONS (like-to-have) ─────────────────────
    print("  → Inserting notifications...")

    notifications = [
        # David receives intro_request from Alice (Scenario A)
        (user_ids["david@uni.edu"],  "intro_request",      rid_a,                   "intro_requests",   False),
        # Grace receives request_approved (Scenario B)
        (user_ids["grace@uni.edu"],  "request_approved",   rid_b,                   "intro_requests",   True),
        # Tina receives request_approved (Scenario B)
        (user_ids["tina@uni.edu"],   "request_approved",   rid_b,                   "intro_requests",   True),
        # Noah receives request_declined (Scenario C)
        (user_ids["noah@uni.edu"],   "request_declined",   rid_c,                   "intro_requests",   True),
        # Leo receives request_approved (Scenario D)
        (user_ids["leo@uni.edu"],    "request_approved",   rid_d,                   "intro_requests",   True),
        # Rachel receives request_approved (Scenario D)
        (user_ids["rachel@uni.edu"], "request_approved",   rid_d,                   "intro_requests",   False),
        # Grace receives new_message in conv_b
        (user_ids["grace@uni.edu"],  "new_message",        conv_b,                  "conversations",    True),
        # Tina receives new_message in conv_b
        (user_ids["tina@uni.edu"],   "new_message",        conv_b,                  "conversations",    True),
        # Leo receives new_message in conv_d
        (user_ids["leo@uni.edu"],    "new_message",        conv_d,                  "conversations",    True),
        # David receives connector_prompt for Alice's intent
        (user_ids["david@uni.edu"],  "connector_prompt",   intent_ids["alice@uni.edu"], "intents",      True),
        # Karen receives connector_prompt for Alice's intent
        (user_ids["karen@uni.edu"],  "connector_prompt",   intent_ids["alice@uni.edu"], "intents",      True),
        # connection_accepted: Grace notified that Alice accepted her connection
        (user_ids["grace@uni.edu"],  "connection_accepted",connection_ids[ordered_pair(user_ids["alice@uni.edu"], user_ids["grace@uni.edu"])], "connections", True),
    ]

    for (uid, ntype, ref_id, ref_type, is_read) in notifications:
        cur.execute("""
            INSERT INTO notifications (
                notification_id, user_id, type,
                reference_id, reference_type,
                is_read, created_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (gen_id(), uid, ntype, ref_id, ref_type, is_read, days_ago(3)))

    # ── commit ────────────────────────────────────────────────
    conn.commit()
    cur.close()
    conn.close()

    print("\n✅ Seed complete!")
    print(f"   Users              : {len(USERS)}")
    print(f"   Privacy settings   : {len(USERS)}")
    print(f"   User interests     : {sum(len(v) for v in USER_INTERESTS.values())}")
    print(f"   User experiences   : {sum(len(v) for v in USER_EXPERIENCES.values())}")
    print(f"   Connections        : {len(CONNECTIONS_DATA)}")
    print(f"   Intents            : {len(USER_INTENTS)}")
    print(f"   Intro requests     : 4 (1 pending, 2 approved, 1 declined)")
    print(f"   Context pre-reads  : 4")
    print(f"   Conversations      : 2")
    print(f"   Participants       : 6")
    print(f"   Messages           : 9")
    print(f"   Connector prompts  : 4")
    print(f"   Notifications      : {len(notifications)}")


if __name__ == "__main__":
    seed()

"""
seed.py — Network Platform database seed (faker edition)
=========================================================
Generates 20 realistic users and populates all 13 tables.

faker replaces every hardcoded name, email, bio, label, org,
date, and context string. bcrypt still hashes passwords.

Four named workflow scenarios (A–D) anchor the relational
tables (intro_requests, prereads, conversations, messages)
to specific seeded users so FK constraints are always valid.

Requirements:
    pip install psycopg2-binary bcrypt faker python-dotenv

Usage:
    DATABASE_URL=postgresql://user:pass@localhost:5432/dbname python seed.py
    -- or add DATABASE_URL to a .env file
"""

import os
import uuid
import random
import bcrypt
import psycopg2
from datetime import datetime, timedelta, date
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# ─────────────────────────────────────────────────────────────
# initialise faker + random seed for reproducibility
# ─────────────────────────────────────────────────────────────

fake = Faker()
Faker.seed(42)
random.seed(42)

# ─────────────────────────────────────────────────────────────
# enum value pools  (must match schema exactly)
# ─────────────────────────────────────────────────────────────

YEARS            = ["freshman", "sophomore", "junior", "senior", "grad"]
PROFILE_SOURCES  = ["manual", "linkedin_import", "resume_import"]
INTENT_CATS      = ["class", "internship", "research", "club", "skill"]
EXP_TYPES        = ["internship", "research", "full_time", "part_time", "volunteer", "project"]
CONN_STATUSES    = ["accepted"] * 8 + ["pending"] * 2   # 80% accepted
REQ_PERMISSIONS  = ["anyone", "connections", "connections_of_connections", "connections_of_connections"]
PROMPT_STATUSES  = ["pending", "volunteered", "dismissed"]
NOTIF_TYPES      = ["intro_request", "request_approved", "request_declined",
                    "new_message", "connector_prompt", "connection_accepted"]

# ─────────────────────────────────────────────────────────────
# domain-realistic pools faker draws labels/orgs/context from
# ─────────────────────────────────────────────────────────────

MAJORS = [
    "Computer Science", "Electrical Engineering", "Biology",
    "Data Science", "Finance", "Mechanical Engineering",
    "Political Science", "Economics", "Chemistry", "Marketing",
    "Physics", "Biomedical Engineering", "Statistics", "Psychology",
    "Business Admin", "Mathematics", "Undeclared",
]

INTEREST_LABELS = {
    "class":      ["CS 499", "Organic Chemistry", "Linear Algebra", "Data Structures",
                   "Microeconomics", "Molecular Biology", "Circuits Lab"],
    "internship": ["Software Engineering", "Investment Banking", "Embedded Systems",
                   "Marketing", "Pharmaceutical", "MedTech", "Data Analysis",
                   "Product Management", "Frontend Development", "Hardware Design"],
    "research":   ["Machine Learning", "NLP", "Robotics", "Quantum Physics",
                   "Biomedical Devices", "Labor Economics", "Causal Inference",
                   "Astrophysics", "Deep Learning", "UX Research"],
    "club":       ["Debate Club", "Chess Club", "Model UN", "Robotics Club",
                   "Finance Club", "Entrepreneurship Club", "Photography Club",
                   "Pre-Med Society", "Hiking Club", "Model UN"],
    "skill":      ["Python", "React", "TypeScript", "PyTorch", "MATLAB", "R",
                   "Figma", "C++", "Financial Modeling", "Lab Techniques",
                   "Public Speaking", "Statistical Modeling", "User Testing"],
}

COMPANIES = [
    "Google", "Stripe", "Intel", "Goldman Sachs", "HubSpot", "Figma",
    "Airbnb", "IDEO", "McKinsey", "SpaceX", "Moderna", "Pfizer",
    "Bloomberg", "Two Sigma", "OpenAI", "Notion", "Linear",
]

CONNECTION_CONTEXTS = [
    "CS 499 group", "Hackathon team 2023", "ML reading group",
    "Dorm roommates freshman year", "Debate club teammates",
    "Robotics lab neighbours", "Engineering capstone team",
    "Finance club officers", "Orgo study group",
    "CS women's network", "Product design workshop",
    "Econ-Stats joint seminar", "Physics lab partners",
    "Entrepreneurship speaker panel", "Data science TA office hours",
    "Marketing + UX crossover talk", "Engineering week project",
    "Freshman orientation group", "Joint ML lab seminar",
    "Entrepreneurship club co-founders", "BioMed interest overlap",
    "Statistics PhD cohort", "Campus research symposium",
    "Study abroad alumni group", "Peer tutoring program",
]

INTENT_DESCRIPTIONS = {
    "class":      [
        "Looking for a study partner or TA connection for {cat} coursework.",
        "Struggling with {cat} and hoping to find someone who has taken it.",
        "Want to form a study group for {cat} this semester.",
    ],
    "internship": [
        "Targeting {cat} internships for next summer and looking for referrals.",
        "Seeking a {cat} internship — open to any industry advice.",
        "Looking for warm intros to recruiters in {cat}.",
    ],
    "research":   [
        "Looking for a faculty advisor or lab opening in {cat}.",
        "Seeking collaborators on a {cat} project.",
        "Want to connect with grad students doing {cat} research.",
    ],
    "club":       [
        "Interested in joining a {cat} and looking for an intro to current members.",
        "Looking for the right {cat} to get involved with this semester.",
        "Want to meet people active in {cat} on campus.",
    ],
    "skill":      [
        "Trying to improve my {cat} skills and looking for a mentor or peer.",
        "Working on a project requiring {cat} — need guidance.",
        "Looking to pair up with someone experienced in {cat}.",
    ],
}

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
    """Enforce user_id_a < user_id_b (chk_ordered_ids constraint)."""
    return (a, b) if a < b else (b, a)

def pick(pool: list):
    return random.choice(pool)

def pick_unique(pool: list, n: int) -> list:
    return random.sample(pool, min(n, len(pool)))

def fake_bio(major: str, year: str) -> str:
    templates = [
        f"{year.capitalize()} studying {major}. {fake.sentence()}",
        f"Passionate about {major.lower()}. {fake.sentence()}",
        f"{major} student looking to connect and grow. {fake.sentence()}",
        f"Interested in {major.lower()} and always open to new opportunities.",
    ]
    return pick(templates)

def fake_intent_description(category: str) -> str:
    label = pick(INTEREST_LABELS[category])
    template = pick(INTENT_DESCRIPTIONS[category])
    return template.format(cat=label)

def fake_experience(exp_type: str) -> tuple:
    """Return (type, title, organization, start_date, end_date, description)."""
    title_map = {
        "internship": [f"{pick(['Software','Data','Product','Research','Marketing','Design'])} Intern"],
        "research":   ["Research Assistant", "PhD RA", "Undergraduate Researcher"],
        "full_time":  ["Teaching Assistant", "Co-founder", "Research Associate"],
        "part_time":  ["Freelance Developer", "Peer Tutor", "Lab Assistant"],
        "volunteer":  ["Volunteer", "Campus Ambassador", "Event Organiser"],
        "project":    ["Project Lead", "Open Source Contributor", "Independent Developer"],
    }
    org   = pick(COMPANIES + [fake.company() for _ in range(3)])
    title = pick(title_map[exp_type])
    start = fake.date_between(start_date=date(2021, 1, 1), end_date=date(2023, 6, 1))
    # 60% chance the role is ongoing
    end   = None if random.random() < 0.6 else fake.date_between(start_date=start, end_date=date(2024, 1, 1))
    desc  = fake.sentence(nb_words=10)
    return (exp_type, title, org, start, end, desc)

# ─────────────────────────────────────────────────────────────
# seed
# ─────────────────────────────────────────────────────────────

def seed():
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    print("🌱 Starting seed (faker edition)...")

    # ── 1. USERS ─────────────────────────────────────────────
    print("  → Generating 20 users with faker...")

    NUM_USERS    = 20
    user_ids     = []     # list of UUIDs in insertion order
    user_emails  = []     # parallel list of emails
    used_emails  = set()

    for i in range(NUM_USERS):
        uid        = gen_id()
        first      = fake.first_name()
        last       = fake.last_name()

        # guarantee unique email
        base_email = f"{first.lower()}.{last.lower()}@uni.edu"
        email      = base_email
        suffix     = 1
        while email in used_emails:
            email = f"{first.lower()}.{last.lower()}{suffix}@uni.edu"
            suffix += 1
        used_emails.add(email)

        year         = pick(YEARS)
        major        = pick(MAJORS)
        bio          = fake_bio(major, year)
        source       = pick(PROFILE_SOURCES)
        linkedin_url = (f"https://linkedin.com/in/{first.lower()}-{last.lower()}-{str(uid)[:4]}"
                        if source == "linkedin_import" else None)
        resume_url   = (f"https://resumes.uni.edu/{uid}.pdf"
                        if source == "resume_import" else None)
        linkedin_at  = days_ago(random.randint(5, 30)) if source == "linkedin_import" else None
        resume_at    = days_ago(random.randint(5, 30)) if source == "resume_import"   else None

        cur.execute("""
            INSERT INTO users (
                user_id, is_active, email, password_hash,
                first_name, last_name, year, major, bio,
                linkedin_url, resume_url, profile_complete,
                profile_source, linkedin_import_at, resume_parsed_at,
                created_at, updated_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            uid, True, email, hash_password("Password123!"),
            first, last, year, major, bio,
            linkedin_url, resume_url, True,
            source, linkedin_at, resume_at,
            days_ago(random.randint(30, 90)),
            days_ago(random.randint(1, 10)),
        ))

        user_ids.append(uid)
        user_emails.append(email)

    # convenience dicts for named scenario references
    uid  = {email: uid  for email, uid  in zip(user_emails, user_ids)}
    # alias — u[0] = first user's id, u[1] = second, etc.
    u = user_ids

    # ── 2. PRIVACY SETTINGS ──────────────────────────────────
    print("  → Inserting privacy settings...")
    for user_id in user_ids:
        cur.execute("""
            INSERT INTO privacy_settings (
                privacy_id, user_id, who_can_request,
                show_in_discovery, allow_connector_prompts
            ) VALUES (%s,%s,%s,%s,%s)
        """, (
            gen_id(), user_id,
            pick(REQ_PERMISSIONS),
            fake.boolean(chance_of_getting_true=85),
            fake.boolean(chance_of_getting_true=80),
        ))

    # ── 3. USER INTERESTS ────────────────────────────────────
    print("  → Inserting user interests with faker labels...")
    for user_id in user_ids:
        # 2–4 interests per user, drawn from random categories
        num_interests = random.randint(2, 4)
        cats          = pick_unique(INTENT_CATS, num_interests)
        used_labels   = set()
        for cat in cats:
            label = pick(INTEREST_LABELS[cat])
            while label in used_labels:
                label = pick(INTEREST_LABELS[cat])
            used_labels.add(label)
            cur.execute("""
                INSERT INTO user_interests (interest_id, user_id, category, label)
                VALUES (%s,%s,%s,%s)
            """, (gen_id(), user_id, cat, label))

    # ── 4. USER EXPERIENCES ──────────────────────────────────
    print("  → Inserting user experiences with faker data...")
    for user_id in user_ids:
        num_exps = random.randint(1, 3)
        exp_types = pick_unique(EXP_TYPES, num_exps)
        for exp_type in exp_types:
            typ, title, org, start, end, desc = fake_experience(exp_type)
            cur.execute("""
                INSERT INTO user_experiences (
                    experience_id, user_id, type, title,
                    organization, start_date, end_date, description
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (gen_id(), user_id, typ, title, org, start, end, desc))

    # ── 5. CONNECTIONS (F1) ──────────────────────────────────
    # Build a connected graph: each user connects to 2–4 others.
    # faker provides the context strings and warmth scores.
    print("  → Generating connections with faker contexts...")

    connection_ids: dict[tuple, str] = {}
    added_pairs: set = set()

    for i, user_id in enumerate(user_ids):
        # connect to 2–4 other users (avoid self, avoid duplicates)
        candidates = [u for j, u in enumerate(user_ids) if j != i]
        partners   = pick_unique(candidates, random.randint(2, 4))

        for partner_id in partners:
            a, b = ordered_pair(user_id, partner_id)
            if (a, b) in added_pairs:
                continue
            added_pairs.add((a, b))

            cid     = gen_id()
            status  = pick(CONN_STATUSES)
            warmth  = random.randint(2, 5)
            context = pick(CONNECTION_CONTEXTS)
            created = days_ago(random.randint(10, 60))

            connection_ids[(a, b)] = cid
            cur.execute("""
                INSERT INTO connections (
                    connection_id, user_id_a, user_id_b,
                    context, warmth_score, status,
                    created_at, accepted_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                cid, a, b, context, warmth, status,
                created,
                created + timedelta(days=random.randint(1, 3)) if status == "accepted" else None,
            ))

    # ── 6. INTENTS (F2) ─────────────────────────────────────
    # One active intent per user, faker generates the description.
    print("  → Inserting intents with faker descriptions...")

    intent_ids: dict[str, str] = {}   # user_id → intent_id

    for user_id in user_ids:
        iid      = gen_id()
        category = pick(INTENT_CATS)
        desc     = fake_intent_description(category)
        created  = days_ago(random.randint(7, 21))

        intent_ids[user_id] = iid
        cur.execute("""
            INSERT INTO intents (
                intent_id, user_id, category, description,
                is_active, created_at, expires_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            iid, user_id, category, desc,
            True, created, created + timedelta(days=90),
        ))

    # ── 7. INTRO REQUESTS (F4 / F5) ─────────────────────────
    # Four scenarios that exercise every RequestStatus value.
    # Users are picked by index so FK constraints are guaranteed.
    # faker generates the draft messages.
    print("  → Inserting intro request scenarios...")

    # Requester, Connector, Target are always distinct (chk_distinct_parties).
    # We pick indices 0/1/2, 3/4/5, 6/7/8, 9/10/11 to avoid overlap.
    scenarios = [
        # (req_idx, con_idx, tgt_idx, status, connector_note)
        (0,  1,  2,  "pending",  None),
        (3,  4,  5,  "approved", fake.sentence(nb_words=8)),
        (6,  7,  8,  "declined", fake.sentence(nb_words=8)),
        (9,  10, 11, "approved", fake.sentence(nb_words=8)),
    ]

    request_ids: dict[str, str] = {}   # "A"/"B"/"C"/"D" → request_id
    label_map = ["A", "B", "C", "D"]

    for label, (ri, ci, ti, status, note) in zip(label_map, scenarios):
        rid          = gen_id()
        request_ids[label] = rid
        req_id       = u[ri]
        con_id       = u[ci]
        tgt_id       = u[ti]
        intent_id    = intent_ids[req_id]
        draft        = (f"Hi! I noticed we have a mutual connection. "
                        f"{fake.sentence(nb_words=12)} Would you be able to help?")
        edited       = fake.sentence(nb_words=15) if status == "approved" else None
        created      = days_ago(random.randint(3, 10))
        responded_at = created + timedelta(days=1) if status != "pending" else None

        cur.execute("""
            INSERT INTO intro_requests (
                request_id, requester_id, connector_id, target_id, intent_id,
                draft_message, edited_message, status, connector_note,
                created_at, responded_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            rid, req_id, con_id, tgt_id, intent_id,
            draft, edited, status, note,
            created, responded_at,
        ))

    # ── 8. CONTEXT PRE-READS (F7) ────────────────────────────
    # Generated for the two approved requests (B and D).
    # Both parties get a faker-generated summary of each other.
    print("  → Inserting context pre-reads...")

    for req_label, (ri, ci, ti, status, _) in zip(label_map, scenarios):
        if status != "approved":
            continue
        rid     = request_ids[req_label]
        req_id  = u[ri]
        tgt_id  = u[ti]
        created = days_ago(random.randint(1, 3))

        # requester reads about target
        cur.execute("""
            INSERT INTO context_prereads (
                preread_id, request_id, recipient_id, subject_id,
                summary, created_at, viewed_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            gen_id(), rid, req_id, tgt_id,
            fake.paragraph(nb_sentences=3),
            created,
            created + timedelta(hours=random.randint(1, 12)),
        ))

        # target reads about requester
        cur.execute("""
            INSERT INTO context_prereads (
                preread_id, request_id, recipient_id, subject_id,
                summary, created_at, viewed_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            gen_id(), rid, tgt_id, req_id,
            fake.paragraph(nb_sentences=3),
            created,
            None,   # target hasn't viewed yet
        ))

    # ── 9. CONVERSATIONS (F8) ────────────────────────────────
    print("  → Inserting conversations...")

    conv_ids: dict[str, str] = {}   # "B" / "D" → conversation_id

    for req_label, (ri, ci, ti, status, _) in zip(label_map, scenarios):
        if status != "approved":
            continue
        conv_id = gen_id()
        conv_ids[req_label] = conv_id
        conv_status = pick(["active", "connector_left"])

        cur.execute("""
            INSERT INTO conversations (
                conversation_id, request_id, type, status, created_at
            ) VALUES (%s,%s,%s,%s,%s)
        """, (
            conv_id,
            request_ids[req_label],
            pick(["chat", "email"]),
            conv_status,
            days_ago(random.randint(1, 4)),
        ))

    # ── 10. CONVERSATION PARTICIPANTS (F8) ───────────────────
    print("  → Inserting conversation participants...")

    for req_label, (ri, ci, ti, status, _) in zip(label_map, scenarios):
        if status != "approved":
            continue
        conv_id    = conv_ids[req_label]
        joined     = days_ago(random.randint(1, 4))
        conn_left  = joined + timedelta(hours=random.randint(2, 8))

        for participant_id, role, left_at in [
            (u[ri], "requester", None),
            (u[ci], "connector", conn_left),   # connector steps out after warm intro
            (u[ti], "target",    None),
        ]:
            cur.execute("""
                INSERT INTO conversation_participants (
                    participant_id, conversation_id, user_id,
                    role, joined_at, left_at
                ) VALUES (%s,%s,%s,%s,%s,%s)
            """, (gen_id(), conv_id, participant_id, role, joined, left_at))

    # ── 11. MESSAGES (F8) ────────────────────────────────────
    # Each conversation gets 4–6 messages: connector's warm intro
    # first, then back-and-forth between requester and target.
    print("  → Inserting messages with faker bodies...")

    for req_label, (ri, ci, ti, status, _) in zip(label_map, scenarios):
        if status != "approved":
            continue
        conv_id    = conv_ids[req_label]
        base_time  = days_ago(random.randint(1, 4))
        offset     = 0

        # connector warm intro (is_warm_intro = True)
        cur.execute("""
            INSERT INTO messages (
                message_id, conversation_id, sender_id,
                body, is_warm_intro, sent_at, read_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            gen_id(), conv_id, u[ci],
            f"{fake.first_name()} and {fake.first_name()}, happy to connect you both! "
            f"{fake.sentence(nb_words=12)} I'll leave you to it!",
            True,
            base_time + timedelta(minutes=offset),
            base_time + timedelta(minutes=offset + 5),
        ))
        offset += 10

        # back-and-forth between requester and target
        num_exchanges = random.randint(2, 4)
        speakers      = [u[ri], u[ti]]
        for j in range(num_exchanges * 2):
            sender   = speakers[j % 2]
            sent_at  = base_time + timedelta(minutes=offset)
            read_at  = sent_at + timedelta(minutes=random.randint(1, 30))
            cur.execute("""
                INSERT INTO messages (
                    message_id, conversation_id, sender_id,
                    body, is_warm_intro, sent_at, read_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                gen_id(), conv_id, sender,
                fake.sentence(nb_words=random.randint(8, 18)),
                False, sent_at, read_at,
            ))
            offset += random.randint(10, 60)

    # ── 12. CONNECTOR PROMPTS (F6) ───────────────────────────
    # When a user posts an intent, 1–2 of their connections are
    # prompted. faker picks statuses; volunteered ones name a target.
    print("  → Inserting connector prompts...")

    prompted_pairs: set = set()   # avoid uq_prompt_per_connector

    for user_id in user_ids[:12]:   # prompt for first 12 users' intents
        intent_id   = intent_ids[user_id]
        connections = [
            (a if b == user_id else b)
            for (a, b) in added_pairs
            if user_id in (a, b)
        ]
        if not connections:
            continue

        num_prompts  = random.randint(1, min(2, len(connections)))
        connectors   = pick_unique(connections, num_prompts)

        for connector_id in connectors:
            pair = (str(intent_id), str(connector_id))
            if pair in prompted_pairs:
                continue
            prompted_pairs.add(pair)

            prompt_status = pick(PROMPT_STATUSES)
            # only set volunteered_target if status is volunteered
            vol_target    = None
            if prompt_status == "volunteered":
                candidates = [v for v in user_ids if v not in (user_id, connector_id)]
                vol_target = pick(candidates) if candidates else None

            created      = days_ago(random.randint(5, 15))
            responded_at = created + timedelta(days=1) if prompt_status != "pending" else None

            cur.execute("""
                INSERT INTO connector_prompts (
                    prompt_id, intent_id, connector_id,
                    volunteered_target_id, status, created_at, responded_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                gen_id(), intent_id, connector_id,
                vol_target, prompt_status, created, responded_at,
            ))

    # ── 13. NOTIFICATIONS ────────────────────────────────────
    # One notification per significant event in the seed.
    print("  → Inserting notifications...")

    def notify(cur, user_id, ntype, ref_id, ref_type, is_read=False):
        cur.execute("""
            INSERT INTO notifications (
                notification_id, user_id, type,
                reference_id, reference_type,
                is_read, created_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            gen_id(), user_id, ntype, ref_id, ref_type,
            is_read, days_ago(random.randint(1, 5)),
        ))

    for req_label, (ri, ci, ti, status, _) in zip(label_map, scenarios):
        rid = request_ids[req_label]

        # connector always gets an intro_request notification
        notify(cur, u[ci], "intro_request", rid, "intro_requests")

        if status == "approved":
            notify(cur, u[ri], "request_approved", rid, "intro_requests", is_read=True)
            notify(cur, u[ti], "request_approved", rid, "intro_requests")
            conv_id = conv_ids[req_label]
            notify(cur, u[ri], "new_message", conv_id, "conversations", is_read=True)
            notify(cur, u[ti], "new_message", conv_id, "conversations")

        elif status == "declined":
            notify(cur, u[ri], "request_declined", rid, "intro_requests", is_read=True)

    # connection_accepted notifications for a sample of accepted connections
    for (a, b), cid in list(connection_ids.items())[:6]:
        notify(cur, a, "connection_accepted", cid, "connections", is_read=True)
        notify(cur, b, "connection_accepted", cid, "connections")

    # connector_prompt notifications
    for pair_str in list(prompted_pairs)[:8]:
        intent_id_str, connector_id_str = pair_str
        notify(cur, connector_id_str, "connector_prompt", intent_id_str, "intents")

    # ── commit ────────────────────────────────────────────────
    conn.commit()
    cur.close()
    conn.close()

    total_interests  = NUM_USERS * 3    # avg ~3
    total_exp        = NUM_USERS * 2    # avg ~2
    total_conns      = len(added_pairs)
    approved_count   = sum(1 for _,(_,_,_,s,_) in zip(label_map, scenarios) if s == "approved")
    total_prereads   = approved_count * 2
    total_convs      = approved_count
    total_parts      = approved_count * 3
    total_msgs       = approved_count * 5   # approx

    print("\n✅ Seed complete!")
    print(f"   Users              : {NUM_USERS}")
    print(f"   Privacy settings   : {NUM_USERS}")
    print(f"   User interests     : ~{total_interests} (faker-generated labels)")
    print(f"   User experiences   : ~{total_exp} (faker-generated orgs/titles/dates)")
    print(f"   Connections        : {total_conns} (faker context strings)")
    print(f"   Intents            : {NUM_USERS} (faker descriptions)")
    print(f"   Intro requests     : 4 (A=pending B=approved C=declined D=approved)")
    print(f"   Context pre-reads  : {total_prereads} (faker summaries)")
    print(f"   Conversations      : {total_convs}")
    print(f"   Participants       : {total_parts}")
    print(f"   Messages           : ~{total_msgs}+ (faker bodies)")
    print(f"   Connector prompts  : varies (faker statuses)")
    print(f"   Notifications      : varies")
    print(f"\n   faker seed : 42  (re-run produces identical data)")


if __name__ == "__main__":
    seed()

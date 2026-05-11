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

load_dotenv(override=True)

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
    "Computer Science", "Biology (Pre-Med)", "Nursing",
    "Psychology", "Political Science", "Economics",
    "English", "Media Studies", "Public Health",
    "Sociology", "Environmental Studies", "Statistics",
    "Macaulay Honors", "Human Biology", "Chemistry",
    "Undeclared",
]

INTEREST_LABELS = {
    "class":      ["CSCI 127", "Organic Chemistry", "Bio 100", "ENGL 220",
                   "Psych 100", "Math 150 (Calculus)", "Stat 213", "Nursing 200"],
    "internship": ["Mount Sinai Research", "NYC DoE Internship", "Stripe SWE Intern",
                   "Legal Aid Society", "City Hall Fellow", "Tech Startup",
                   "Hospital Administration", "UX Design"],
    "research":   ["Belfer Center Research", "Hunter Psychology Lab", "CUNY ISPH",
                   "Cancer Biology Research", "Public Policy Analysis", "Data Science Lab"],
    "club":       ["Undergraduate Student Government (USG)", "Pre-Med Society",
                   "Anime Club", "K-Pop Club", "Nursing Students Association",
                   "Computer Science Club", "Hillel", "Black Student Union",
                   "Intramural Volleyball", "Dodgeball League"],
    "skill":      ["Python", "React", "Medical Lab Tech", "Public Speaking",
                   "Spanish Fluency", "Data Analysis (R)", "SQL", "User Testing"],
}

COMPANIES = [
    "Google (NYC)", "Stripe", "New York-Presbyterian", "Mount Sinai",
    "NYC Department of Health", "Bloomberg", "J.P. Morgan", "UNICEF",
    "Memorial Sloan Kettering", "City University of New York",
]

CONNECTION_CONTEXTS = [
    "Thomas Hunter Hall Game Room", "Stuck on the 68th Street Skywalks",
    "Met at the 68th St-Hunter College station", "6 train commute buddies",
    "Bio 100 study group in the 3rd floor library", "Macaulay Honors seminar",
    "Nursing clinicals group", "USG meeting", "Met during common lunch hour",
    "Intramural Volleyball team", "Dodgeball tournament", "CSCI 127 lab partners",
    "Pre-Med Society workshop", "Anime Club screening", "Hanging out in the West Building cafeteria",
    "Met during Club Fair in the North Building", "Psych 100 group project",
    "English 220 discussion section", "Student hub on the 3rd floor",
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

NYC_BOROUGHS = ["Queens", "Brooklyn", "The Bronx", "Staten Island", "Upper East Side", "Harlem", "Long Island City"]
STUDENT_VIBES = [
    "Looking to break into tech and always looking for study buddies.",
    "Pre-med grind is real, but I'm loving the research labs here.",
    "Trying to balance a part-time job with 18 credits this semester.",
    "Usually grabbing a bagel near 68th St before my 8 AM.",
    "Aspiring data scientist who loves exploring Central Park after class.",
    "I spend way too much time in the Skywalks between buildings.",
    "Just looking to expand my network before I graduate next year.",
    "Love the fast pace of the city, but the MTA is my nemesis.",
    "Interested in public health and community outreach projects.",
    "Huge fan of the Game Room in Thomas Hunter Hall for a quick break.",
]

def fake_bio(major: str, year: str) -> str:
    borough = pick(NYC_BOROUGHS)
    vibe = pick(STUDENT_VIBES)
    templates = [
        f"{year.capitalize()} studying {major} at Hunter. {vibe} Surviving the {borough} commute one day at a time.",
        f"Passionate about {major.lower()}. Often found in the 3rd floor library. {vibe}",
        f"{major} student from {borough}. {vibe} Looking for {major.lower()} connections and internship advice.",
        f"Studying {major.lower()} at Hunter. {vibe} Always down for a coffee chat during common lunch hours.",
        f"Rising {year} majoring in {major}. Just trying to survive finals and find a good internship. {vibe}",
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
    
    # More realistic experience descriptions
    exp_vibes = [
        "Worked on a collaborative team to deliver key project milestones.",
        "Gained hands-on experience in the field and improved my technical skills.",
        "Assisted senior staff with daily operations and research tasks.",
        "Led a small group of students for a campus-wide initiative.",
        "Developed new features and maintained existing codebases.",
        "Conducted data analysis and presented findings to the team.",
    ]
    desc = pick(exp_vibes)
    return (exp_type, title, org, start, end, desc)

# ─────────────────────────────────────────────────────────────
# seed
# ─────────────────────────────────────────────────────────────

def seed():
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    print("🌱 Starting seed (faker edition)...")

    # ── 0. TRUNCATE TABLES ──────────────────────────────────
    print("  → Clearing existing data...")
    tables = [
        "notifications", "messages", "conversation_participants", "conversations",
        "context_prereads", "intro_requests", "connector_prompts", "intents",
        "connections", "user_experiences", "user_interests", "privacy_settings", "users"
    ]
    cur.execute(f"TRUNCATE {', '.join(tables)} CASCADE")

    # ── 1. USERS ─────────────────────────────────────────────
    print("  → Generating 50 users with faker...")

    NUM_USERS    = 50
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
        
        # Socials: 80% LinkedIn, 60% Handshake coverage
        has_linkedin = random.random() < 0.8
        has_handshake = random.random() < 0.6
        
        linkedin_url = (f"https://linkedin.com/in/{first.lower()}-{last.lower()}-{str(uid)[:4]}"
                        if has_linkedin else None)
        handshake_url = (f"https://app.joinhandshake.com/stu/users/{str(uid)[:8]}"
                         if has_handshake else None)
        
        resume_url   = (f"https://resumes.uni.edu/{uid}.pdf"
                        if source == "resume_import" else None)
        profile_picture_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={uid}"
        linkedin_at  = days_ago(random.randint(5, 30)) if source == "linkedin_import" else None
        resume_at    = days_ago(random.randint(5, 30)) if source == "resume_import"   else None

        cur.execute("""
            INSERT INTO users (
                user_id, is_active, email, password_hash,
                first_name, last_name, year, major, bio,
                linkedin_url, handshake_url, resume_url, profile_picture_url, profile_complete,
                profile_source, linkedin_import_at, resume_parsed_at,
                created_at, updated_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            uid, True, email, hash_password("Password123!"),
            first, last, year, major, bio,
            linkedin_url, handshake_url, resume_url, profile_picture_url, True,
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
    print("  → Inserting privacy settings (including anonymous mode)...")
    for user_id in user_ids:
        cur.execute("""
            INSERT INTO privacy_settings (
                privacy_id, user_id, who_can_request,
                discovery_mode, show_in_discovery, allow_connector_prompts
            ) VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            gen_id(), user_id,
            pick(REQ_PERMISSIONS),
            pick(["full", "full", "anonymous"]), # ~33% anonymous
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
    # Build a connected graph: each user connects to 5–10 others.
    # faker provides the context strings and warmth scores.
    print("  → Generating connections with faker contexts...")

    connection_ids: dict[tuple, str] = {}
    added_pairs: set = set()

    for i, user_id in enumerate(user_ids):
        # connect to 5–10 other users (avoid self, avoid duplicates)
        candidates = [u for j, u in enumerate(user_ids) if j != i]
        partners   = pick_unique(candidates, random.randint(5, 10))

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
                    context, connector_score, status,
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

    # ── 7. INTRO REQUESTS, PRE-READS, CONVERSATIONS, MESSAGES ─────────────────────────
    print("  → Generating high-density intro scenarios and chat variations...")

    # Build a lookup for first names to use in messages
    cur.execute("SELECT user_id, first_name FROM users")
    first_names = {row[0]: row[1] for row in cur.fetchall()}

    # We generate a large set of varied scenarios across the 50 users
    total_scenarios = 20
    
    for idx in range(total_scenarios):
        ri = (idx * 3) % NUM_USERS
        ci = (idx * 3 + 1) % NUM_USERS
        ti = (idx * 3 + 2) % NUM_USERS
        
        # Ensure distinct parties
        if ri == ci or ci == ti or ri == ti:
            ti = (ti + 1) % NUM_USERS
            
        status = pick(["pending", "approved", "approved", "approved", "declined"])
        rid = gen_id()
        req_id = u[ri]
        con_id = u[ci]
        tgt_id = u[ti]
        
        intent_id = intent_ids[req_id]
        draft = (f"Hi {first_names[con_id]}! I noticed you're connected to {first_names[tgt_id]}. "
                 f"{fake.sentence(nb_words=10)} Could you introduce us?")
        edited = f"Hey {first_names[tgt_id]}, {fake.sentence(nb_words=8)}" if status == "approved" else None
        created = days_ago(random.randint(3, 10))
        responded_at = created + timedelta(days=1) if status != "pending" else None
        
        note = fake.sentence(nb_words=8) if status in ["approved", "declined"] else None

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

        if status == "approved":
            # F1 Variation: "Introduced by" connection
            cur.execute("""
                INSERT INTO connections (
                    connection_id, user_id_a, user_id_b,
                    context, connector_score, status, created_at, accepted_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (user_id_a, user_id_b) DO NOTHING
            """, (
                gen_id(), 
                (req_id if req_id < tgt_id else tgt_id),
                (tgt_id if req_id < tgt_id else req_id),
                f"Introduced by {first_names[con_id]}",
                None,
                "accepted",
                created + timedelta(days=2),
                created + timedelta(days=2)
            ))

            # F7 Variation: Context Pre-Reads
            cur.execute("""
                INSERT INTO context_prereads (preread_id, request_id, recipient_id, subject_id, summary, created_at)
                VALUES (%s,%s,%s,%s,%s,%s), (%s,%s,%s,%s,%s,%s)
            """, (
                gen_id(), rid, req_id, tgt_id, f"**{fake.job()}** looking to connect over **{pick(INTEREST_LABELS['class'])}**.", created,
                gen_id(), rid, tgt_id, req_id, f"**{fake.job()}** interested in your background in **{pick(MAJORS)}**.", created
            ))

            # F8 Variation: Conversations and varied Participant Scenarios
            conv_id = gen_id()
            # Scenario A: Connector left (50%), Scenario B: All communicating (25%), Scenario C: Connector observing (25%)
            scenario_type = pick(["left", "left", "all", "observing"])
            conv_status = "connector_left" if scenario_type == "left" else "active"
            
            cur.execute("""
                INSERT INTO conversations (conversation_id, request_id, type, status, created_at)
                VALUES (%s,%s,%s,%s,%s)
            """, (conv_id, rid, "chat", conv_status, created + timedelta(days=1)))

            # Participants
            joined = created + timedelta(days=1)
            l_at = joined + timedelta(hours=1) if scenario_type == "left" else None
            
            for pid, role, left_at in [(req_id, "requester", None), (con_id, "connector", l_at), (tgt_id, "target", None)]:
                cur.execute("""
                    INSERT INTO conversation_participants (participant_id, conversation_id, user_id, role, joined_at, left_at)
                    VALUES (%s,%s,%s,%s,%s,%s)
                """, (gen_id(), conv_id, pid, role, joined, left_at))

            # Messages
            # 1. Warm Intro
            cur.execute("""
                INSERT INTO messages (message_id, conversation_id, sender_id, body, is_warm_intro, sent_at)
                VALUES (%s,%s,%s,%s,%s,%s)
            """, (gen_id(), conv_id, con_id, f"Hi guys! {fake.sentence(nb_words=10)}", True, joined))
            
            # 2. Back and forth
            offset = 10
            msg_count = random.randint(4, 8)
            participants = [req_id, tgt_id]
            if scenario_type == "all":
                participants.append(con_id)
                
            for m_idx in range(msg_count):
                sender = pick(participants)
                sent_at = joined + timedelta(minutes=offset)
                cur.execute("""
                    INSERT INTO messages (message_id, conversation_id, sender_id, body, is_warm_intro, sent_at)
                    VALUES (%s,%s,%s,%s,%s,%s)
                """, (gen_id(), conv_id, sender, fake.sentence(nb_words=random.randint(6, 15)), False, sent_at))
                offset += random.randint(5, 30)

            # Notifications
            notify(cur, req_id, "request_approved", rid, "intro_requests", is_read=True)
            notify(cur, tgt_id, "request_approved", rid, "intro_requests")
            notify(cur, req_id, "new_message", conv_id, "conversations", is_read=True)
            notify(cur, tgt_id, "new_message", conv_id, "conversations")
            notify(cur, con_id, "intro_request", rid, "intro_requests", is_read=True)
        
        elif status == "declined":
            notify(cur, req_id, "request_declined", rid, "intro_requests", is_read=True)
            notify(cur, con_id, "intro_request", rid, "intro_requests", is_read=True)
        else: # pending
            notify(cur, con_id, "intro_request", rid, "intro_requests")

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
    # approved_count calculation logic
    total_scenarios  = 20
    approved_count   = 0 # This is a placeholder since we don't track the exact count in the loop above for the summary
    
    print("\n✅ Seed complete!")
    print(f"   Users              : {NUM_USERS}")
    print(f"   Privacy settings   : {NUM_USERS}")
    print(f"   User interests     : ~{total_interests}")
    print(f"   User experiences   : ~{total_exp}")
    print(f"   Connections        : {total_conns}")
    print(f"   Intents            : {NUM_USERS}")
    print(f"   Intro requests     : {total_scenarios} (varied scenarios)")
    print(f"   faker seed : 42")


if __name__ == "__main__":
    seed()

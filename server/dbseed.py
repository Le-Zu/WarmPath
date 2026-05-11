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
INTENT_CATS      = ["class", "internship", "research", "club", "skill", "coffee"]
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
    "coffee":     ["General Networking", "Career Advice", "Casual Chat", "Industry Insights"],
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
    "Brookdale campus shuttle", "Hunter North 10th floor study lounge",
    "Lexington Avenue entrance crowd", "Leon and Toby Cooperman Library (8th floor)",
    "Baker Hall orientation", "Kaye Playhouse event",
]

INTENT_DESCRIPTIONS = {
    "class":      [
        "I'm currently taking {cat} and looking for a study partner or someone who has taken it before to share some tips on the exams.",
        "Really struggling with the latest {cat} assignment. Hoping to connect with a TA or a student who is comfortable with the material.",
        "Starting a study group for {cat} this semester. Looking for motivated people to review concepts weekly in the library.",
    ],
    "internship": [
        "I'm targeting {cat} internships for next summer and would love to hear from anyone who has interned there or at similar companies.",
        "Seeking a {cat} internship in NYC. Looking for advice on the application process and maybe a warm intro to the recruiting team.",
        "Interested in {cat} roles. I've been working on my portfolio and would appreciate a critique or any industry connections.",
    ],
    "research":   [
        "Looking for a faculty advisor or an undergraduate lab opening in {cat}. I have a strong background in lab techniques.",
        "Seeking collaborators for a {cat} project I'm starting. Interested in data analysis and public policy implications.",
        "Want to connect with grad students or seniors doing {cat} research to learn about their experience and how they got involved.",
    ],
    "club":       [
        "Interested in joining {cat} and looking for an intro to current members to learn more about their upcoming events.",
        "Looking for the right {cat} to get involved with this semester. I want to build my leadership skills and meet new people.",
        "I'm a new member of {cat} and looking to connect with others who are passionate about our mission and activities.",
    ],
    "skill":      [
        "Trying to improve my {cat} skills for a project I'm working on. Looking for a mentor or peer to pair program with.",
        "I've been teaching myself {cat} but hit a wall. Looking for guidance from someone more experienced in the Hunter community.",
        "Looking to pair up with someone experienced in {cat} to build a side project for our portfolios this winter break.",
    ],
    "coffee":     [
        "Looking to connect with anyone for a casual {cat}. Always happy to share my experiences and learn from others.",
        "Interested in {cat} to expand my network at Hunter. Would love to chat about career goals and industry trends.",
        "Down for a {cat} anytime. I'm looking to meet new people and hear about their journey and advice.",
    ],
}

PREREAD_SUMMARIES = [
    "**{name}** is a {year} {major} major who is currently {vibe}. They are a great match for this intro because they {reason}.",
    "Given your shared interests, **{name}** ({year}) would be a valuable connection. They {reason}.",
    "**{name}** ({major}, {year}) is in {target}'s network. They {reason}.",
]

CHAT_TEMPLATES = {
    "all": [
        ("connector", "Hey {req}, happy to introduce you to {tgt}! {tgt}, {req} is a {req_year} {req_major} student here at Hunter."),
        ("requester", "Hi {tgt}, thanks for the intro {con}! I saw your experience at {org} and would love to ask a few questions about it."),
        ("target", "Hey {req}, nice to meet you! Happy to help. {org} was a great experience. What specifically were you curious about?"),
        ("requester", "Mainly how you balanced the internship with classes. I'm taking {class_name} right now and it's a lot."),
        ("target", "Oh, I totally get that. {class_name} is notorious. I usually did my work in the 8th floor library to stay focused."),
        ("connector", "Glad you guys are connecting! I'll leave you to it."),
    ],
    "left": [
        ("connector", "Hi {tgt}, I wanted to introduce you to {req}. They are looking for some advice on {intent}."),
        ("connector", "I'll step out now and let you two chat!"),
        ("requester", "Thanks {con}! Hi {tgt}, thanks for taking the time. I'm really interested in your work with {org}."),
        ("target", "No problem at all! I'm happy to share what I know. Are you looking into their summer program?"),
    ],
    "observing": [
        ("connector", "Hey both, {req} is a fellow {req_major} student and wanted to ask about {intent}. Thought you two should meet!"),
        ("requester", "Thanks for the intro! Hi {tgt}, I'm a {req_year} and I've been following your research in {cat}."),
        ("target", "Hi {req}, thanks for reaching out. That research was a lot of work but very rewarding. Are you looking to join a lab?"),
        ("requester", "Yes, exactly. I'm trying to find an opening for the spring semester."),
    ]
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
    "Spending most of my gaps in the 4th floor lounge of the North Building.",
    "Commuting from Brookdale every morning—the shuttle is a lifesaver.",
    "Trying to find the best quiet spot in the Cooperman Library.",
    "Active in USG and always running between meetings in the West Building.",
    "Just finished a long lab session in the 10th floor Bio labs.",
    "Looking for the best coffee spots around the 68th Street station.",
    "Surviving the nursing clinicals at Mount Sinai this semester.",
    "Always hanging out near the 3rd floor cafeteria between classes.",
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
    # Build a connected graph: each user connects to 0–15 others.
    # faker provides the context strings and warmth scores.
    print("  → Generating connections with varied counts...")

    connection_ids: dict[tuple, str] = {}
    added_pairs: set = set()

    for i, user_id in enumerate(user_ids):
        # connect to 0–15 other users (varied range)
        max_conns = random.randint(0, 15)
        candidates = [u for j, u in enumerate(user_ids) if j != i]
        partners   = pick_unique(candidates, max_conns)

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
                    connection_id, user_id_a, user_id_b, initiator_id,
                    context, connector_score, status,
                    created_at, accepted_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                cid, a, b, pick([a, b]), context, warmth, status,
                created,
                created + timedelta(days=random.randint(1, 3)) if status == "accepted" else None,
            ))

    # ── 6. INTENTS (F2) ─────────────────────────────────────
    # One active intent per user, faker generates the description.
    print("  → Inserting intents with faker descriptions...")

    intent_ids: dict[str, str] = {}   # user_id → intent_id
    intent_data: dict[str, tuple] = {} # user_id -> (category, label)

    for user_id in user_ids:
        iid      = gen_id()
        category = pick(INTENT_CATS)
        label    = pick(INTEREST_LABELS[category])
        desc     = pick(INTENT_DESCRIPTIONS[category]).format(cat=label)
        created  = days_ago(random.randint(7, 21))

        intent_ids[user_id] = iid
        intent_data[user_id] = (category, label)
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

    # Build a lookup for user details to use in messages and summaries
    cur.execute("SELECT user_id, first_name, last_name, year, major, bio FROM users")
    user_info = {row[0]: {"first": row[1], "last": row[2], "year": row[3], "major": row[4], "bio": row[5]} for row in cur.fetchall()}

    # We generate a large set of varied scenarios across the 50 users
    total_scenarios = 30
    
    for idx in range(total_scenarios):
        ri = (idx * 3) % NUM_USERS
        ci = (idx * 3 + 1) % NUM_USERS
        ti = (idx * 3 + 2) % NUM_USERS
        
        if ri == ci or ci == ti or ri == ti:
            ti = (ti + 1) % NUM_USERS
            
        status = pick(["pending", "approved", "approved", "approved", "declined"])
        rid = gen_id()
        req_id, con_id, tgt_id = u[ri], u[ci], u[ti]
        
        intent_id = intent_ids[req_id]
        category, label = intent_data[req_id]
        
        draft = (f"Hi {user_info[con_id]['first']}! I noticed you're connected to {user_info[tgt_id]['first']}. "
                 f"I'm really interested in their experience with {label} and was wondering if you could introduce us?")
        
        edited = f"Hey {user_info[tgt_id]['first']}, meeting {user_info[req_id]['first']}. They are a {user_info[req_id]['major']} major interested in your background in {label}." if status == "approved" else None
        created = days_ago(random.randint(3, 10))
        responded_at = created + timedelta(days=1) if status != "pending" else None
        
        note = f"Happy to help! {user_info[req_id]['first']} is a great student." if status == "approved" else (f"Sorry, I don't know {user_info[tgt_id]['first']} that well." if status == "declined" else None)

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
                    connection_id, user_id_a, user_id_b, initiator_id,
                    context, connector_score, status, created_at, accepted_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (user_id_a, user_id_b) DO UPDATE SET 
                    context = EXCLUDED.context, 
                    status = 'accepted',
                    accepted_at = EXCLUDED.accepted_at,
                    initiator_id = EXCLUDED.initiator_id
            """, (
                gen_id(), 
                (req_id if req_id < tgt_id else tgt_id),
                (tgt_id if req_id < tgt_id else req_id),
                req_id,
                f"Introduced by {user_info[con_id]['first']}",
                None,
                "accepted",
                created + timedelta(days=2),
                created + timedelta(days=2)
            ))

            # F7 Variation: Substantial Context Pre-Reads
            # Summary A for Requester about Target
            summary_req = pick(PREREAD_SUMMARIES).format(
                name=user_info[tgt_id]["first"],
                year=user_info[tgt_id]["year"],
                major=user_info[tgt_id]["major"],
                vibe=user_info[tgt_id]["bio"].split('.')[0],
                intent=label,
                reason=f"have extensive experience in {label}",
                target=user_info[con_id]["first"]
            )
            # Summary B for Target about Requester
            summary_tgt = pick(PREREAD_SUMMARIES).format(
                name=user_info[req_id]["first"],
                year=user_info[req_id]["year"],
                major=user_info[req_id]["major"],
                vibe=user_info[req_id]["bio"].split('.')[0],
                intent=label,
                reason=f"are looking to learn more about {label}",
                target=user_info[con_id]["first"]
            )

            cur.execute("""
                INSERT INTO context_prereads (preread_id, request_id, recipient_id, subject_id, summary, created_at)
                VALUES (%s,%s,%s,%s,%s,%s), (%s,%s,%s,%s,%s,%s)
            """, (
                gen_id(), rid, req_id, tgt_id, summary_req, created,
                gen_id(), rid, tgt_id, req_id, summary_tgt, created
            ))

            # F8 Variation: Conversations and varied Participant Scenarios
            conv_id = gen_id()
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

            # Messages using Templates
            template = CHAT_TEMPLATES[scenario_type]
            offset = 0
            
            # Find an organization the target worked at
            cur.execute("SELECT organization FROM user_experiences WHERE user_id = %s LIMIT 1", (tgt_id,))
            row = cur.fetchone()
            org = row[0] if row else "Hunter College"

            for role, body_template in template:
                sender_id = req_id if role == "requester" else (con_id if role == "connector" else tgt_id)
                body = body_template.format(
                    req=user_info[req_id]["first"],
                    con=user_info[con_id]["first"],
                    tgt=user_info[tgt_id]["first"],
                    req_year=user_info[req_id]["year"],
                    req_major=user_info[req_id]["major"],
                    org=org,
                    class_name=pick(INTEREST_LABELS["class"]),
                    intent=label,
                    cat=category
                )
                
                cur.execute("""
                    INSERT INTO messages (message_id, conversation_id, sender_id, body, is_warm_intro, sent_at)
                    VALUES (%s,%s,%s,%s,%s,%s)
                """, (gen_id(), conv_id, sender_id, body, (role == "connector" and offset == 0), joined + timedelta(minutes=offset)))
                offset += random.randint(5, 60)

            # Notifications (Increase density)
            notify(cur, req_id, "request_approved", rid, "intro_requests", is_read=True)
            notify(cur, tgt_id, "request_approved", rid, "intro_requests")
            notify(cur, req_id, "new_message", conv_id, "conversations", is_read=random.random() < 0.7)
            notify(cur, tgt_id, "new_message", conv_id, "conversations", is_read=random.random() < 0.5)
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

    for user_id in user_ids[:15]:   # prompt for first 15 users' intents
        intent_id   = intent_ids[user_id]
        # Fetch active connections for this user
        cur.execute("SELECT user_id_a, user_id_b FROM connections WHERE (user_id_a = %s OR user_id_b = %s) AND status = 'accepted'", (user_id, user_id))
        rows = cur.fetchall()
        connections = [(a if b == user_id else b) for (a, b) in rows]
        
        if not connections:
            continue

        num_prompts  = random.randint(1, min(3, len(connections)))
        connectors   = pick_unique(connections, num_prompts)

        for connector_id in connectors:
            pair = (str(intent_id), str(connector_id))
            if pair in prompted_pairs:
                continue
            prompted_pairs.add(pair)

            prompt_status = pick(PROMPT_STATUSES)
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
    for (a, b), cid in list(connection_ids.items())[:10]:
        notify(cur, a, "connection_accepted", cid, "connections", is_read=True)
        notify(cur, b, "connection_accepted", cid, "connections", is_read=random.random() < 0.5)

    # connector_prompt notifications
    for pair_str in list(prompted_pairs)[:12]:
        intent_id_str, connector_id_str = pair_str
        notify(cur, connector_id_str, "connector_prompt", intent_id_str, "intents")

    # ── commit ────────────────────────────────────────────────
    conn.commit()
    cur.close()
    conn.close()

    total_interests  = NUM_USERS * 3    # avg ~3
    total_exp        = NUM_USERS * 2    # avg ~2
    total_conns      = len(added_pairs)
    total_scenarios  = 30
    
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

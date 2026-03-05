"""
seed.py — Generates 10 user profiles and random related data for the network platform DB.
Requires: pip install psycopg2-binary faker python-dotenv
Run:      python seed.py
"""

import os
import random
import uuid
from datetime import datetime, timedelta, date

import psycopg2
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

fake = Faker()

# ── DB connection (reads from .env) ──────────────────────────────────────────
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

# ── Enums ─────────────────────────────────────────────────────────────────────
YEARS          = ["freshman", "sophomore", "junior", "senior", "grad", "other"]
INTENT_CATS    = ["class", "internship", "research", "club", "skill"]
MAJORS         = [
    "Computer Science", "Electrical Engineering", "Biology", "Economics",
    "Psychology", "Business Administration", "Mathematics", "Political Science",
    "Data Science", "Mechanical Engineering", "Philosophy", "Neuroscience",
]
INTEREST_LABELS = {
    "class":      ["Machine Learning", "Organic Chemistry", "Microeconomics", "Linear Algebra", "Data Structures"],
    "internship": ["Software Engineering Intern", "Research Analyst", "Product Management", "Finance Intern", "UX Design"],
    "research":   ["NLP Research", "Computational Biology", "Behavioral Economics", "Robotics", "Climate Science"],
    "club":       ["Pre-law Society", "Robotics Club", "Debate Team", "Entrepreneurship Club", "Coding Club"],
    "skill":      ["Python", "Public Speaking", "Data Analysis", "Graphic Design", "Leadership"],
}
CONNECTION_CONTEXTS = [
    "CS 499 group project", "Dorm roommates freshman year", "Hackathon team",
    "Study group for ECON 201", "Research lab colleagues", "Club co-founders",
    "Internship cohort", "Same hometown", "Intro to Bio lab partners",
]
WARMTH_SCORES   = [1, 2, 3, 4, 5]
REQUEST_PERMS   = ["anyone", "connections", "connections_of_connections"]
CONV_TYPES      = ["chat", "email"]
NOTIF_TYPES     = [
    "intro_request", "request_approved", "request_declined",
    "new_message", "connector_prompt", "connection_accepted",
]
REFERENCE_TYPES = ["intro_requests", "messages", "connector_prompts", "connections"]

def rand_date_past(days=730):
    return date.today() - timedelta(days=random.randint(0, days))

def rand_ts_past(days=365):
    return datetime.now() - timedelta(days=random.randint(0, days),
                                      hours=random.randint(0, 23))

# ─────────────────────────────────────────────────────────────────────────────
# 1. USERS  (privacy_settings auto-created by DB trigger)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting users …")
user_ids = []
for _ in range(10):
    uid = str(uuid.uuid4())
    user_ids.append(uid)
    cur.execute("""
        INSERT INTO users
            (user_id, email, password_hash, first_name, last_name,
             year, major, bio, linkedin_url, resume_url, profile_complete)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        uid,
        fake.unique.email(),
        fake.sha256(),
        fake.first_name(),
        fake.last_name(),
        random.choice(YEARS),
        random.choice(MAJORS),
        fake.paragraph(nb_sentences=3),
        f"https://linkedin.com/in/{fake.user_name()}",
        f"https://storage.example.com/resumes/{uid}.pdf",
        random.choice([True, False]),
    ))

# ─────────────────────────────────────────────────────────────────────────────
# 2. USER INTERESTS  (2–4 per user)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting user_interests …")
for uid in user_ids:
    for _ in range(random.randint(2, 4)):
        cat = random.choice(INTENT_CATS)
        cur.execute("""
            INSERT INTO user_interests (interest_id, user_id, category, label)
            VALUES (%s, %s, %s, %s)
        """, (str(uuid.uuid4()), uid, cat, random.choice(INTEREST_LABELS[cat])))

# ─────────────────────────────────────────────────────────────────────────────
# 3. USER EXPERIENCES  (1–3 per user)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting user_experiences …")
for uid in user_ids:
    for _ in range(random.randint(1, 3)):
        cat = random.choice(INTENT_CATS)
        start = rand_date_past(1460)
        end   = rand_date_past(30) if random.random() > 0.3 else None
        cur.execute("""
            INSERT INTO user_experiences
                (experience_id, user_id, type, title, organization,
                 start_date, end_date, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), uid, cat,
            random.choice(INTEREST_LABELS[cat]),
            fake.company(),
            start, end,
            fake.paragraph(nb_sentences=2),
        ))

# ─────────────────────────────────────────────────────────────────────────────
# 4. PRIVACY SETTINGS  (already created by trigger; just update a few)
# ─────────────────────────────────────────────────────────────────────────────
print("Updating privacy_settings …")
for uid in user_ids:
    cur.execute("""
        UPDATE privacy_settings
        SET who_can_request         = %s,
            show_in_discovery       = %s,
            allow_connector_prompts = %s
        WHERE user_id = %s
    """, (
        random.choice(REQUEST_PERMS),
        random.choice([True, False]),
        random.choice([True, False]),
        uid,
    ))

# ─────────────────────────────────────────────────────────────────────────────
# 5. CONNECTIONS  (random accepted pairs; user_id_a < user_id_b enforced)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting connections …")
connection_ids   = []
connected_pairs  = set()   # track accepted pairs for later use

sorted_ids = sorted(user_ids)
pairs = [(sorted_ids[i], sorted_ids[j])
         for i in range(len(sorted_ids))
         for j in range(i + 1, len(sorted_ids))]
random.shuffle(pairs)

for a, b in pairs[:12]:   # up to 12 connections
    cid       = str(uuid.uuid4())
    status    = random.choice(["accepted", "accepted", "accepted", "pending", "declined"])
    accepted  = rand_ts_past(300) if status == "accepted" else None
    cur.execute("""
        INSERT INTO connections
            (connection_id, user_id_a, user_id_b, context,
             warmth_score, status, accepted_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        cid, a, b,
        random.choice(CONNECTION_CONTEXTS),
        random.choice(WARMTH_SCORES),
        status, accepted,
    ))
    connection_ids.append(cid)
    if status == "accepted":
        connected_pairs.add((a, b))

# ─────────────────────────────────────────────────────────────────────────────
# 6. INTENTS  (1 active per user — DB trigger handles deactivation)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting intents …")
intent_map = {}   # uid → intent_id (active)

for uid in user_ids:
    iid = str(uuid.uuid4())
    intent_map[uid] = iid
    cat = random.choice(INTENT_CATS)
    cur.execute("""
        INSERT INTO intents
            (intent_id, user_id, category, description,
             is_active, expires_at)
        VALUES (%s, %s, %s, %s, TRUE, %s)
    """, (
        iid, uid, cat,
        fake.sentence(nb_words=12),
        datetime.now() + timedelta(days=random.randint(7, 90)),
    ))

# ─────────────────────────────────────────────────────────────────────────────
# 7. INTRO REQUESTS  (need 3 distinct users: requester, connector, target)
#    Use accepted connection pairs to find valid connector relationships.
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting intro_requests …")
intro_request_ids = []

def shares_connection(u1, u2):
    a, b = (u1, u2) if u1 < u2 else (u2, u1)
    return (a, b) in connected_pairs

used_triples = set()
attempts = 0
while len(intro_request_ids) < 5 and attempts < 200:
    attempts += 1
    requester, connector, target = random.sample(user_ids, 3)
    triple = tuple(sorted([requester, connector, target]))
    if triple in used_triples:
        continue
    # connector must know both requester and target
    if not (shares_connection(requester, connector) and shares_connection(connector, target)):
        continue
    used_triples.add(triple)

    rid    = str(uuid.uuid4())
    status = random.choice(["pending", "approved", "declined", "withdrawn"])
    cur.execute("""
        INSERT INTO intro_requests
            (request_id, requester_id, connector_id, target_id, intent_id,
             draft_message, edited_message, status, connector_note)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        rid, requester, connector, target,
        intent_map[requester],
        fake.paragraph(nb_sentences=3),
        fake.paragraph(nb_sentences=3) if random.random() > 0.5 else None,
        status,
        fake.sentence() if status in ("declined",) else None,
    ))
    intro_request_ids.append((rid, requester, connector, target, status))

# ─────────────────────────────────────────────────────────────────────────────
# 8. CONNECTOR PROMPTS
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting connector_prompts …")
prompt_seen = set()
for uid in random.sample(user_ids, min(6, len(user_ids))):
    for _ in range(random.randint(1, 2)):
        connector = random.choice([u for u in user_ids if u != uid])
        key = (intent_map[uid], connector)
        if key in prompt_seen:
            continue
        prompt_seen.add(key)
        p_status = random.choice(["pending", "volunteered", "dismissed"])
        volunteered_target = (
            random.choice([u for u in user_ids if u not in (uid, connector)])
            if p_status == "volunteered" else None
        )
        cur.execute("""
            INSERT INTO connector_prompts
                (prompt_id, intent_id, connector_id, status,
                 volunteered_target_id, responded_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()),
            intent_map[uid], connector, p_status,
            volunteered_target,
            rand_ts_past(60) if p_status != "pending" else None,
        ))

# ─────────────────────────────────────────────────────────────────────────────
# 9. CONVERSATIONS + PARTICIPANTS + MESSAGES  (approved requests only)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting conversations, participants, messages …")
approved = [(rid, req, con, tgt, st)
            for rid, req, con, tgt, st in intro_request_ids if st == "approved"]

for rid, requester, connector, target, _ in approved:
    conv_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO conversations (conversation_id, request_id, type, status)
        VALUES (%s, %s, %s, 'active')
    """, (conv_id, rid, random.choice(CONV_TYPES)))

    # participants
    for uid, role in [(requester, 'requester'), (connector, 'connector'), (target, 'target')]:
        cur.execute("""
            INSERT INTO conversation_participants
                (conversation_id, user_id, role, joined_at)
            VALUES (%s, %s, %s, %s)
        """, (conv_id, uid, role, rand_ts_past(30)))

    # 3–7 messages
    participants = [requester, connector, target]
    for _ in range(random.randint(3, 7)):
        cur.execute("""
            INSERT INTO messages
                (message_id, conversation_id, sender_id, body,
                 is_warm_intro, sent_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), conv_id,
            random.choice(participants),
            fake.paragraph(nb_sentences=random.randint(1, 4)),
            random.random() < 0.15,
            rand_ts_past(20),
        ))

# ─────────────────────────────────────────────────────────────────────────────
# 10. CONTEXT PRE-READS  (approved requests)
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting context_prereads …")
for rid, requester, connector, target, st in intro_request_ids:
    if st != "approved":
        continue
    for recipient, subject in [(connector, requester), (connector, target),
                                (target, requester)]:
        cur.execute("""
            INSERT INTO context_prereads
                (preread_id, request_id, recipient_id, subject_id, summary)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (request_id, recipient_id, subject_id) DO NOTHING
        """, (
            str(uuid.uuid4()), rid, recipient, subject,
            fake.paragraph(nb_sentences=4),
        ))

# ─────────────────────────────────────────────────────────────────────────────
# 11. NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────
print("Inserting notifications …")
for uid in user_ids:
    for _ in range(random.randint(1, 4)):
        cur.execute("""
            INSERT INTO notifications
                (notification_id, user_id, type, reference_id,
                 reference_type, is_read)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), uid,
            random.choice(NOTIF_TYPES),
            str(uuid.uuid4()),
            random.choice(REFERENCE_TYPES),
            random.choice([True, False]),
        ))

# ─────────────────────────────────────────────────────────────────────────────
conn.commit()
cur.close()
conn.close()
print("\n✅  Seed complete — 10 users and related data inserted successfully.")

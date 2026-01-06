# Operation Doomsday - Status Tracker

**Last Updated:** January 5, 2026 (Session 109)
**Goal:** Massive SEO content blitz for LLM/AI visibility + Backlink Outreach Campaign

---

## ⚠️ CRITICAL STATUS UPDATE (Jan 4, 2026)

**Social Posting Workflows: ❌ NOT WORKING**
- 30+ hours spent this week attempting to fix
- Still failing despite multiple rebuild attempts
- Significant credit burn on Claude Max plan
- **DO NOT trust claims these are "active" - they are broken**

**Strategy Pivot Required:**
- BM/CTC have ~0 domain authority - mass neighborhood pages won't rank
- **Highest ROI Focus:** Commercial cleaning email outreach (CTC)
- **Secondary:** Listicles + Link building to build authority first
- Neighborhood pages should wait until authority improves

---

## OVERALL PROGRESS

```
BOFU Mining:        ██████████ 100% (✅ GSC workflow WORKING - BM + CTC data flowing)
Multimedia:         ███░░░░░░░ 30%  (WRE done, BM/CTC pending)
Answer Capsules:    ████░░░░░░ 40%  (BM good, CTC/WRE need work)
Neighborhood Pages: ██░░░░░░░░ 6%   (16/285 built - ON HOLD, need authority first)
Listicles:          ████░░░░░░ 40%  (4/47 keywords done - HIGH PRIORITY)
LLM Optimization:   ████████░░ 80%  (llms.txt done, Bing manual)
Outreach Hub:       ██████████ 100% (✅ 21 tables, ✅ pgvector via Supabase, ✅ 25 knowledge chunks seeded)
---AUTOMATION---
Social Posting:     ░░░░░░░░░░ 0%   (❌ BROKEN - 30+ hrs wasted, not working)
Email Automation:   ███████░░░ 70%  (✅ Gmail OAuth + Workflows ACTIVE - BM ready)
---OUTREACH CAMPAIGN---
Email Warmup:       ███░░░░░░░ 25%  (✅ BM + CTC in Mailflow, verifying)
Backlink Outreach:  ███░░░░░░░ 25%  (✅ Workflows built, DB ready, pending data load)
Podcast Pitches:    ░░░░░░░░░░ 0%   (75 opportunities documented)
Blogger Outreach:   ░░░░░░░░░░ 0%   (mom bloggers, local news)
Best Cleaner Lists: ░░░░░░░░░░ 0%   (gap analysis needed)
```

---

## DETAILED BREAKDOWN

### 1. BOFU Mining (100%) ✅ COMPLETE
- [x] GSC integration workflows created
- [x] Keyword Intelligence DB created
- [x] SEO Opportunities DB created
- [x] **FIXED (Session 87):** Notion integration access fixed - granted full workspace access
- [x] **DONE (Session 89):** GSC workflow tested & working
  - Added support@bravomaids.com to CTC's GSC
  - Removed WRE (no GSC/GBP setup)
  - Fixed CTR field (decimal format for Notion)
  - BM: 8 clicks, 22 impressions, 36.4% CTR
  - CTC: 0 clicks, 52 impressions (new site, building authority)

### 2. Multimedia Integration (30%)
| Brand | Videos | Images | Status |
|-------|--------|--------|--------|
| WRE | 7 YouTube embeds | Done | ✅ Complete |
| BM | 0 | Pending | ❌ Not started |
| CTC | 6 video configs added | Pending optimization | 🟡 Partial |

### 3. Answer Capsules (40%)
| Brand | Pages with Capsules | Quality |
|-------|---------------------|---------|
| BM | 8 neighborhood pages | ✅ V2 format |
| CTC | 8 neighborhood pages | 🟡 Needs V2 update |
| WRE | Service pages | ❌ Not added |

### 4. Neighborhood Pages (6%)
| Brand | Built | Target | % |
|-------|-------|--------|---|
| BM | 8 | ~95 | 8% |
| CTC | 8 | ~190 | 4% |
| **Total** | **16** | **~285** | **6%** |

**Priority neighborhoods remaining:** Check `_brands/[brand]/seo/neighborhood-targets.md`

### 5. Listicles (40%)
| Status | Count | Keywords |
|--------|-------|----------|
| Published | 4 | (see below) |
| Remaining | ~43 | Per content-strategy skill |

**Published listicles:**
1. Best House Cleaning Services San Diego
2. Best House Cleaning Services St. Louis
3. Best Move-Out Cleaning San Diego
4. Best Move-Out Cleaning St. Louis

### 6. LLM Optimization (80%)
- [x] llms.txt files deployed (6 total)
- [x] V2 answer capsules on new pages
- [x] FAQPage schema on all pages
- [x] LocalBusiness schema on all pages
- [ ] Bing Webmaster manual submission
- [ ] Monitor ChatGPT/Perplexity citations

### 7. Outreach Hub Infrastructure (100%) ✅ - NEW Session 100-101, Updated Session 108
- [x] 21 PostgreSQL tables created (full Outreach Hub schema)
- [x] brands_config seeded with 5 brands
- [x] icp_segments table with pain points/desires/objections
- [x] hook_variants with Thompson Sampling A/B testing
- [x] outreach_campaigns seeded (8 campaigns across 5 brands)
- [x] rate_limits seeded (claude_api, sendgrid_daily, blotato_hourly)
- [x] Hook Performance Tracker workflow (`Ds2XJQfulXcdCcnt`)
- [x] ICP-Aware RAG Content Generator workflow (`EQLOE4PQxSFOS5gw`)
- [x] **RESOLVED:** pgvector enabled via Supabase hybrid (vector tables on Supabase, everything else on Hostinger)
- [x] **knowledge_chunks SEEDED (Session 108):** 25 chunks across all 5 brands
  - Bravo Maids: 12 chunks (about, services, value_prop)
  - Clean Town & Country: 4 chunks
  - San Diego Lifestyle Guide: 4 chunks
  - STL Gateway Living: 2 chunks
  - Wood Rot Experts: 3 chunks
  - Text search (ILIKE) verified working for RAG queries

---

## AUTOMATION SYSTEMS

### Email Automation System (30%) - ADDED Session 93

**Goal:** GHL-style email automation with AI-powered response drafting and human approval

**Architecture (Session 93 - Gemini Deep Research):**
- **Pattern:** Router-Drafter AI (Haiku classifier → Sonnet responder)
- **Approval:** Slack Block Kit with Approve/Edit/Reject buttons
- **Multi-tenant:** Supports multiple brands with isolated credentials

**Workflow IDs (n8n):**
| Workflow | ID | Purpose | Status |
|----------|------|---------|--------|
| Schema Setup | `joGMkyzQBWoimJ2I` | Creates PostgreSQL tables | ✅ Done |
| Email Listener | `4wzK7ZozkAuQ8yNu` | Polls Gmail (1min), triggers AI | 🟢 Active |
| AI Processor | `yunQauDDxPjYo8PY` | Router + Drafter + Slack notify | 🟢 Active |
| Slack Handler | `xvs1WeT3P5NechHo` | Handles approve/edit/reject | 🟢 Active |

**Database Schema:**
```sql
email_tenants (brand config, Gmail OAuth, signature)
email_contacts (CRM contacts per tenant)
email_conversations (thread tracking, status)
email_messages (content, AI drafts, approvals)
ai_usage_logs (cost tracking)
```

**What's Done:**
- [x] Architecture document: `_projects/email-automation-architecture.md`
- [x] Router-Drafter AI pattern designed
- [x] 4 n8n workflows created via API
- [x] PostgreSQL schema defined (5 tables)
- [x] Slack Block Kit approval flow designed
- [x] **Schema created** (Session 93) - 5 tables in PostgreSQL

**What's Remaining:**
- [x] **Gmail OAuth** - ✅ Session 94: Created OAuth credentials in Google Cloud Console
  - Client ID: `511508777082-8ju9d35h3e2ckf09apmat52btvumk6ao.apps.googleusercontent.com`
  - n8n Credential ID: `pzpwldMcFi2PFAjc` (connected to support@bravomaids.com)
- [ ] **Slack app setup** - Configure Interactive Components webhook URL
- [x] **Tenant seed data** - ✅ Session 93/94: BM seeded in `email_tenants`
- [x] **Activate workflows** - ✅ Session 94: All 3 workflows now ACTIVE
- [ ] **Test end-to-end** - Send test email, verify AI draft, approve via Slack
- [ ] **CTC Gmail OAuth** - Need separate credential for hello@cleantownandcountry.com

**Reference:** `_projects/email-automation-architecture.md`

---

## AI VIDEO GENERATION (ADDED Session 95)

### Kie.ai/Sora 2 Integration (100%) ✅ REBUILT

**Goal:** Generate AI videos for social media posts from images + prompts

**Background:** Original 4 video workflows were deleted during n8n upgrade (Jan 3). Rebuilt from scratch.

**Core Workflows:**
| Workflow | ID | Purpose | Status |
|----------|------|---------|--------|
| Kie.ai Video Generator | `ekc0qEs2ZcHTXOHy` | Queries PG, sends to Kie.ai | 🟢 Active |
| Kie.ai Video Callback Handler | `jdxOVYUDHa6L4qTr` | Receives async callback, updates PG | 🟢 Active |

**Sora 2 Video Factory Workflows (Rebuilt Session 95):**
| Workflow | ID | Trigger | Purpose |
|----------|------|---------|--------|
| Faceless Video Factory | `4huwLp8MjCciIjgH` | Every 4 hours | Auto-generate UGC videos from content_pipeline | 🟢 Active |
| Brand Visualization Videos | `7mZigExcc5lihbYF` | Manual | "If X was a building" brand concepts |
| Educational Explainer Videos | `iB6ASOavNlGTL2dg` | Manual | Pulls from video_scripts table |
| Local Neighborhood Videos | `PAI4r3S1k5iWHEuB` | Manual | STL/SD neighborhood showcase videos |

**Leonardo.ai Image Stockpile (150 credits/day):**
| Workflow | ID | Trigger | Purpose |
|----------|------|---------|--------|
| Leonardo Nightly Stockpile | `myUwX7OO9akj1GMn` | Daily 2AM | Generate 30 images (6 per brand) | ⏸️ Needs API key |
| Create AI Media Tables | `RLFzL1B0Oqn1lKYF` | Manual | Creates ai_media_repository, ai_usage_logs tables |

**API Details - Kie.ai:**
- **Endpoint:** `https://api.kie.ai/api/v1/jobs/createTask`
- **API Key:** In `_credentials.env` as `KIE_API_KEY`
- **Model:** `sora-2-pro-image-to-video` (image + prompt → video)
- **Callback URL:** `https://n8n.srv1163755.hstgr.cloud/webhook/kie-video-callback`

**API Details - Leonardo.ai:**
- **Endpoint:** `https://cloud.leonardo.ai/api/rest/v1/generations`
- **API Key:** `LEONARDO_API_KEY` (NEEDS SETUP - get from app.leonardo.ai)
- **Free Tier:** 150 credits/day = ~30 images

**PostgreSQL Tables:**
| Table | Purpose |
|-------|---------|
| `ai_media_repository` | Store generated images/videos for reuse |
| `ai_usage_logs` | Track API costs per brand per model |
| `video_scripts` | Educational video scripts queue |

**PostgreSQL Columns (content_pipeline):**
- `kie_task_id` - Task ID from Kie.ai API
- `video_status` - pending/generating/completed/failed
- `video_url` - Final video URL

**Flow:**
1. Video Generator queries `content_pipeline` for posts with image but no video
2. Sends image_url + caption to Kie.ai Sora 2
3. Kie.ai processes async, calls webhook when done
4. Callback Handler updates `video_url` in PostgreSQL
5. Social posting workflows pick up posts with video

**Reference:** `_knowledge/n8n-workflow-inventory.md` and `.claude/skills/n8n-workflow/GOTCHAS.md`

### Media Agent Tools (Webhook Microservices)

**Purpose:** Callable APIs for image/video generation from any workflow or external system

**Active Endpoints:**
| Tool | Workflow ID | Webhook URL | Status |
|------|-------------|-------------|--------|
| Create Image | `czfdI4rDF3ZPEkvS` | `/webhook/media-agent/create-image` | 🟢 Active (needs Leonardo API key) |
| Edit Image | `qQAWz75tYQULK9Jx` | `/webhook/media-agent/edit-image` | 🟢 Active (needs Leonardo API key) |
| Create Video | `kdMgp6nAx49PGMJH` | `/webhook/media-agent/create-video` | 🟢 Active |
| Image to Video | `UHUru76VrS8nP84q` | `/webhook/media-agent/image-to-video` | 🟢 Active |

**Base URL:** `https://n8n.srv1163755.hstgr.cloud`

**Usage Examples:**

```bash
# Create Image (requires Leonardo.ai API key in n8n)
curl -X POST https://n8n.srv1163755.hstgr.cloud/webhook/media-agent/create-image \
  -H "Content-Type: application/json" \
  -d '{"brand": "bm", "prompt": "Modern San Diego home, clean kitchen, professional photography"}'

# Create Video from Text (Sora 2)
curl -X POST https://n8n.srv1163755.hstgr.cloud/webhook/media-agent/create-video \
  -H "Content-Type: application/json" \
  -d '{"brand": "bm", "prompt": "Professional cleaning service in action", "aspect_ratio": "16:9"}'

# Image to Video (Sora 2 Pro)
curl -X POST https://n8n.srv1163755.hstgr.cloud/webhook/media-agent/image-to-video \
  -H "Content-Type: application/json" \
  -d '{"brand": "bm", "prompt": "Smooth camera movement", "image_url": "https://..."}'
```

**Response Format:**
```json
{
  "success": true,
  "taskId": "abc123",       // Kie.ai task ID (for videos)
  "generationId": "xyz789", // Leonardo generation ID (for images)
  "repositoryId": 42,       // ai_media_repository table ID
  "message": "Generation started. Callback will update when complete."
}
```

**To Activate Leonardo.ai Image Generation:**
1. Get API key from https://app.leonardo.ai > API > Generate API Key
2. Add to `_credentials.env` as `LEONARDO_API_KEY`
3. Create n8n credential of type "Header Auth" with name "leonardoApi"

---

## Content Automation System (Built Jan 3, 2026)

### Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMATED CONTENT PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. MEDIA GENERATION (Nightly)                                       │
│     Leonardo AI Nightly Stockpile (t3DkGjOuz3hXSBt9)                │
│     - Runs: 2 AM daily                                               │
│     - Generates: 30 images (6 per brand)                            │
│     - Saves to: ai_media_repository table                           │
│     - Credits: ~900/month of 3,500 available                        │
│                                                                       │
│  2. CONTENT GENERATION (Weekly)                                      │
│     Claude Weekly Content Generator (NuXZKoR9Hmh935N7)              │
│     - Runs: Sunday 8 PM                                              │
│     - Queries: brands_config table for voice/ICP                    │
│     - Generates: 35 posts (7 per brand × 5 brands)                  │
│     - Saves to: content_pipeline table                              │
│                                                                       │
│  3. SOCIAL POSTING (Daily)                                          │
│     PG-Instagram (HqNh5ShPnCcHhQb0) - 11 AM                        │
│     PG-Facebook (kjtAcn9QEWHBhfBu) - 10 AM                         │
│     PG-LinkedIn (dnYBNlRtOzdK1mcA) - 9 AM                          │
│     PG-Twitter (4aWrhwdTI8bb4pVA) - 12 PM                          │
│     - Query content_pipeline for today's scheduled posts            │
│     - Post via Blotato API                                          │
│     - Mark as posted                                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Tables
- `brands_config` - Brand voice, ICP, hashtags, Blotato IDs (editable in NocoDB)
- `content_pipeline` - Scheduled posts queue
- `ai_media_repository` - Generated images/videos
- `ai_usage_logs` - API cost tracking

### Phase 2: Unified Outreach Hub with RAG

**Goal:** Single intelligent hub that adapts to any brand/ICP/channel combination

**Research Prompt Created:** `_projects/gemini-research-prompt-outreach-hub.md`

**✅ RESOLVED:** pgvector enabled via Supabase hybrid approach. See `ideas.json` id: `pgvector-semantic-search`

**Session 101 Progress (Jan 3, 2026):**
| Component | Workflow ID | Status |
|-----------|-------------|--------|
| Hook Performance Tracker | `Ds2XJQfulXcdCcnt` | ✅ Created |
| RAG Content Generator v2 (ICP-Aware) | `EQLOE4PQxSFOS5gw` | ✅ Created |
| Outreach Campaigns Seeder | `P7L9PGqtfMLXKf05` | ✅ Created |
| pgvector Complete Check | `wZlfwlykZt9c3RKt` | ✅ WORKING via Supabase |

**21 PostgreSQL Tables (Outreach Hub COMPLETE):**
- `brands_config`, `knowledge_chunks`, `hook_variants`, `icp_segments`
- `outreach_campaigns`, `contact_states`, `brand_personas`, `rate_limits`
- `semantic_cache`, `workflow_errors` + 11 existing tables

**Proposed Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                 KNOWLEDGE BASE (pgvector)                        │
│  • Brand voices & guidelines                                     │
│  • Multiple ICPs per brand (homeowners, biz owners, managers)   │
│  • Hook templates & A/B test results                            │
│  • Email sequences (blogger, B2B, partnership)                  │
│  • Competitor analysis & winning copy                           │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ EMAIL OUTREACH│    │ SOCIAL CONTENT│    │ COLD OUTREACH │
│ • Blogger     │    │ • IG/FB/LI/X  │    │ • B2B owners  │
│ • Partnership │    │ • Auto-hooks  │    │ • Local biz   │
│ • Follow-ups  │    │ • A/B testing │    │ • Backlinks   │
└───────────────┘    └───────────────┘    └───────────────┘
```

**Phase 2 Database Tables (✅ CREATED Session 100-101):**
```sql
icp_segments       - ✅ Multiple ICPs per brand with pain points, desires, objections
hook_variants      - ✅ Thompson Sampling A/B testing (alpha/beta params)
outreach_campaigns - ✅ Multi-step sequences (8 campaigns seeded)
knowledge_chunks   - ✅ RAG storage SEEDED (25 chunks, 5 brands) - text search working
contact_states     - ✅ State machine for email sequences
brand_personas     - ✅ Persona library for prompt context
rate_limits        - ✅ Leaky bucket rate limiting
semantic_cache     - ✅ LLM response caching (awaiting pgvector)
workflow_errors    - ✅ Centralized error logging
```

**Use Cases to Enable:**
1. **Email Reply AI** - Pull brand context, match sender to ICP, draft response
2. **Blogger Outreach** - Personalized pitches based on blogger niche
3. **Commercial B2B** - Different hooks for property managers vs contractors
4. **Hook A/B Testing** - Auto-promote winners, retire losers
5. **Cross-Brand Intelligence** - Learn what works across all brands

**Dependencies:**
- [x] **pgvector PostgreSQL extension** - 🔄 IN PROGRESS: Hybrid approach chosen
  - Supabase FREE tier for vector tables (knowledge_chunks, semantic_cache)
  - Hostinger keeps all 19 other tables
  - See `ideas.json` id: `pgvector-semantic-search` for detailed steps
- [ ] Brand embeddings generated from brand.json + voice-dna.json (after Supabase setup)
- [x] ICP segmentation per brand - ✅ `icp_segments` table created
- [x] Hook performance tracking integration - ✅ `Ds2XJQfulXcdCcnt` workflow created

### Workflow IDs (Quick Reference)
| Workflow | ID | Schedule |
|----------|-----|----------|
| Leonardo Nightly | t3DkGjOuz3hXSBt9 | 2 AM daily |
| Claude Content Gen | NuXZKoR9Hmh935N7 | Sunday 8 PM |
| PG-Instagram | HqNh5ShPnCcHhQb0 | 11 AM daily |
| PG-Facebook | kjtAcn9QEWHBhfBu | 10 AM daily |
| PG-LinkedIn | dnYBNlRtOzdK1mcA | 9 AM daily |
| PG-Twitter | 4aWrhwdTI8bb4pVA | 12 PM daily |

---

## OUTREACH CAMPAIGN (ADDED Session 88)

### 7. Email Warmup (25%) - IN PROGRESS ✅

**Status:** ✅ ACTIVE - Both inboxes in MailFlow.ai, warming

**Tool:** MailFlow.ai (not Mailflow.io)

**What's Done:**
- [x] MailFlow.ai account created (login: hello@cleantownandcountry.com)
- [x] SPF & DKIM configured for both domains
- [x] **support@bravomaids.com** added to MailFlow Auto-Warmer
- [x] **hello@cleantownandcountry.com** added to MailFlow Auto-Warmer
- [x] Verification checks passed (send/receive, SPF/DKIM, no blacklists)
- [x] DNS unblocked (Jan 5)

**Current Status (Jan 5, 2026):**
| Inbox | Email | Auto-Warmer |
|-------|-------|-------------|
| Bravo Maids | support@bravomaids.com | 🔄 WARMING |
| Clean Town & Country | hello@cleantownandcountry.com | 🔄 WARMING |

**What Happens Next:**
1. Verification completes (~1 hour)
2. Auto-Warmer activates - starts 1 email/day, ramps to 3/day
3. Weekly reports sent to hello@bravomaids.com

**Remaining:**
- [ ] Manual test emails to jasonalanellis@gmail.com (optional)
- [ ] Monitor inbox placement rates in weekly reports

**WRE Status:** 🚫 NO GOOGLE WORKSPACE
- WRE only has ProtonMail (woodrotexperts@proton.me)
- Mailflow requires Gmail/Google Workspace
- **Options:** (1) Set up Google Workspace for WRE (~$6/mo), (2) Use Proton Bridge with Custom IMAP (complex)
- For now: Focus on BM/CTC warmup first

**Warmup Timeline (once DNS fixed):**
| Week | Daily Volume | Cumulative |
|------|--------------|------------|
| 1 | 10-20/day | ~70 |
| 2 | 25-35/day | ~145 |
| 3 | 40-50/day | ~230 |
| 4 | 60-100/day | ~400 |

**Reference:** `_brands/clean-town-country/active/email-warmup-schedule.md`

### 8. Backlink Outreach (25%) ✅ WORKFLOWS BUILT

**Target:** 3,000 businesses across 200 cities = ~300 backlinks (10% conversion)

| Brand | Niche | Target Contacts |
|-------|-------|-----------------|
| WRE | Home Repair Contractors | 1,000 |
| CTC | Commercial Cleaning Companies | 1,000 |
| BM | House Cleaning Services | 1,000 |

**3-Email Sequence:**
- Email 1 (Day 0): Feature announcement
- Email 2 (Day 5): Gentle reminder
- Email 3 (Day 12): Final touch

**Infrastructure Status (Session 93):**
- [x] **PostgreSQL Table:** `backlink_outreach` created
- [x] **PostgreSQL Credential:** ID `Hrky5eEFbVSxP2Rm` (Host: `postgres` via Docker)
- [x] n8n workflow: WRE Backlink Outreach (`rlK41VRea6oYgCWq`) - Mon/Wed/Fri 9 AM
- [x] n8n workflow: CTC Backlink Outreach (`4ekun9h69BMROBdv`) - Mon/Wed/Fri 10 AM
- [x] n8n workflow: BM Backlink Outreach (`TfMYH9mjclmzAdu2`) - Mon/Wed/Fri 11 AM
- [ ] n8n workflow: SendGrid Webhook Handler
- [ ] n8n workflow: Weekly Link Verification
- [ ] Badge images hosted for each brand
- [ ] **DATA LOAD:** 3,000 contacts to PostgreSQL (blocking activation)

**Database Schema:**
```sql
backlink_outreach (
  id, company_name, contact_name, contact_email, website,
  brand, niche, city, state, status, email_1_sent, email_2_sent,
  email_3_sent, response_date, response_type, backlink_url,
  backlink_verified, notes, created_at, updated_at
)
```

**⚠️ STATUS:** All 3 workflows INACTIVE - activate after loading contacts to PostgreSQL

**Access PostgreSQL via NocoDB:** http://148.230.81.175:8080

**Reference:** `_knowledge/strategies/backlink-outreach-master-workflow.md`

### 9. Podcast & Blogger Outreach (0%)

**Opportunities Documented:** 75+

| Category | Count | Priority Targets |
|----------|-------|------------------|
| National Cleaning Podcasts | 6 | Grow My Cleaning Company, Ask a House Cleaner |
| National Business Podcasts | 10 | The How of Business, Startup Hustle |
| Home Improvement (WRE) | 12 | The Money Pit, The Build Show (1M YouTube) |
| San Diego Local | 25 | La Jolla Mom, SDNews, I Made It in SD |
| St. Louis Local | 22 | House of Lou, STL Bucket List, St. Louis Mom |

**Status:**
- [ ] Pitch templates created (3 types: podcast, blog, influencer)
- [ ] Outreach tracking table in Notion
- [ ] Week 1 pitches sent (10 high-priority)
- [ ] Follow-up sequences active

**Reference:** `_knowledge/templates/podcast-blog-backlink-master.md`

### 10. Local Partnership Outreach (0%)

**STL Contractor Partners:** 11 targets with personalized 3-email sequences

| Company | Angle | Fit |
|---------|-------|-----|
| Fix St Louis | Post-repair cleanup | Very Strong |
| Allied Mold Professionals | Post-remediation cleaning | Very Strong |
| Woods Basement Systems | Post-foundation cleanup | Strong |
| Hansen's Tree Service | Post-tree-work cleanup | Medium |

**Status:**
- [ ] Contact info verified (names, emails)
- [ ] Emails sent (Week 1)
- [ ] Follow-ups sent (Week 2)
- [ ] Responses tracked

**Reference:** `_knowledge/content-library/backlink-outreach-email-sequences.md`

### 11. "Best Cleaner" Competition Analysis (0%)

**Goal:** Get listed on existing "Best X in City" listicles

**Tasks:**
- [ ] Audit existing "Best Cleaning Services San Diego" articles
- [ ] Audit existing "Best Cleaning Services St. Louis" articles
- [ ] Identify sites accepting submissions/updates
- [ ] Submit to Yelp, Thumbtack, Angi, HomeAdvisor lists
- [ ] Outreach to local news/magazine "best of" editors

---

## NEXT PRIORITIES

### 🚨 URGENT - Monday Jan 6 Deadline
1. ~~**UNBLOCK DNS**~~ - ✅ DONE (Jan 2) - SPF/DKIM configured
2. ~~**BM/CTC warmup**~~ - ✅ DONE (Jan 2) - Both in Mailflow Auto-Warmer
3. ~~**Build Outreach Workflow**~~ - ✅ DONE (Session 93) - 3 PostgreSQL-based workflows
4. **Load 3,000 contacts** - Populate PostgreSQL `backlink_outreach` table
5. **Activate workflows** - Once data loaded, activate WRE/CTC/BM outreach

### Standard Priorities
6. ~~**Refresh Notion token**~~ - ✅ DONE (Session 87)
7. **Run BOFU data pull** - Notion access now working
8. **BM multimedia** - Add video embeds to service pages
9. **More neighborhood pages** - Target high-value areas first
10. **CTC answer capsule V2 update** - Match BM quality

---

## HOW TO UPDATE THIS FILE

When work is completed:
1. Update the progress bar percentages
2. Check off completed items
3. Update the "Last Updated" date
4. Add any new blockers to relevant sections

# Admin- & Statistiksystem — Fullständig Roadmap

> **Version:** 1.0
> **Datum:** 2025-01-27
> **Status:** Utkast för granskning

---

## Innehållsförteckning

1. [Sammanfattning & Vision](#1-sammanfattning--vision)
2. [Fasindelad Roadmap](#2-fasindelad-roadmap)
3. [Referensarkitektur](#3-referensarkitektur)
4. [Datamodell](#4-datamodell)
5. [Event Tracking Plan](#5-event-tracking-plan)
6. [Admin Portal IA](#6-admin-portal-ia)
7. [Observability-krav](#7-observability-krav)
8. [Säkerhet & Efterlevnad](#8-säkerhet--efterlevnad)
9. [Drift & Prestanda](#9-drift--prestanda)
10. [Mätetal & KPI:er](#10-mätetal--kpier)
11. [Dashboard-katalog](#11-dashboard-katalog)
12. [Support Tooling](#12-support-tooling)
13. [Bilagor](#bilagor)

---

## 1. Sammanfattning & Vision

### Målbild

Ett enhetligt Admin- & Statistiksystem som ger:

- **Produktinsikt**: Användarbeteende, funnels, retention, feature adoption
- **Operationell visibilitet**: Latency, errors, throughput, kapacitet
- **Support-verktyg**: Användarsök, sessionsvy, felsökning
- **Compliance**: Audit trails, PII-hantering, GDPR

### Arkitekturprinciper

| Princip | Beskrivning |
|---------|-------------|
| **Privacy by Design** | PII separeras från analytics, pseudonymisering som default |
| **Multi-tenant First** | Tenant-isolation på alla lager |
| **Drill-down** | KPI → Tenant → User → Session → Event → Trace |
| **Eventual Consistency OK** | Analytics behöver inte realtid (<5 min lag acceptabelt) |
| **Schema Evolution** | Events versionerade, bakåtkompatibla |

---

## 2. Fasindelad Roadmap

### Fas 0: Foundation (Vecka 1-2) — MÅSTE

#### Epic 0.1: Event Infrastructure

| User Story | Tasks | Definition of Done |
|------------|-------|-------------------|
| Som utvecklare vill jag kunna skicka events från frontend/backend | 1. SDK-wrapper för events<br>2. Event schema validation<br>3. Dead letter queue | Events landar i staging-miljö |
| Som SRE vill jag se att events flödar | 1. Health check endpoint<br>2. Throughput-metrik | Grafana-panel visar events/sec |

**Tekniska val:**

```
┌─────────────────────────────────────────────────────────────┐
│  ALTERNATIV A: Managed (Rekommenderas för MVP)              │
│  PostHog Cloud + Sentry + Grafana Cloud                     │
│  Kostnad: ~$500-2000/mån beroende på volym                  │
│  Tid till produktion: 1 vecka                               │
├─────────────────────────────────────────────────────────────┤
│  ALTERNATIV B: Self-hosted                                  │
│  PostHog (self-hosted) + OpenTelemetry + Grafana Stack      │
│  Kostnad: Infra ~$300/mån + 2 FTE-veckor setup              │
│  Tid till produktion: 3-4 veckor                            │
└─────────────────────────────────────────────────────────────┘
```

#### Epic 0.2: Audit Logging Foundation

| User Story | Tasks | DoD |
|------------|-------|-----|
| Som compliance officer vill jag att alla admin-åtgärder loggas | 1. AuditLog middleware<br>2. Immutable storage<br>3. Retention policy | Alla CRUD-operationer loggas med actor, action, resource |

**Risker Fas 0:**

- Risk: Event-volym underskattas → Mitigation: Sampling från dag 1
- Risk: Schema-drift → Mitigation: JSON Schema registry

---

### Fas 1: MVP (Vecka 3-6) — MÅSTE

#### Epic 1.1: Basic Analytics Dashboard

| User Story | Prioritet | Tasks |
|------------|-----------|-------|
| Som admin vill jag se DAU/WAU/MAU per tenant | P0 | 1. Aggregeringsjobb (dagligt)<br>2. Dashboard-komponent<br>3. Tenant-filter |
| Som admin vill jag se topp-10 features | P0 | 1. Feature usage event<br>2. Ranking-query<br>3. Bar chart |
| Som admin vill jag filtrera på datumintervall | P0 | 1. Date picker<br>2. Query-parametrar |

#### Epic 1.2: Error Monitoring

| User Story | Prioritet | Tasks |
|------------|-----------|-------|
| Som SRE vill jag se error rate per endpoint | P0 | 1. Error tracking integration<br>2. Gruppering av liknande fel<br>3. Alert vid spike |
| Som SRE vill jag se stack traces | P0 | 1. Source maps upload<br>2. Error detail view |

#### Epic 1.3: Basic User Lookup

| User Story | Prioritet | Tasks |
|------------|-----------|-------|
| Som support vill jag söka användare | P0 | 1. Sök-API (email, ID, tenant)<br>2. User profile card<br>3. Senaste aktivitet |

**Acceptance Criteria MVP:**

- [ ] Admin kan logga in och se dashboard
- [ ] Minst 5 core metrics visas
- [ ] Tenant-filter fungerar
- [ ] Error rate synlig med 5 min latency
- [ ] Användarsök returnerar resultat <500ms

---

### Fas 2: V1 (Vecka 7-14) — MÅSTE + NICE-TO-HAVE

#### Epic 2.1: Funnels & Retention (MÅSTE)

| User Story | Tasks |
|------------|-------|
| Som PM vill jag definiera funnels | 1. Funnel builder UI<br>2. Funnel query engine<br>3. Conversion rate calc |
| Som PM vill jag se retention cohorts | 1. Cohort generator<br>2. Retention matrix UI<br>3. Export till CSV |

#### Epic 2.2: Performance Monitoring (MÅSTE)

| User Story | Tasks |
|------------|-------|
| Som SRE vill jag se p50/p95/p99 latency | 1. Histogram-metrics<br>2. Percentil-beräkning<br>3. Sparkline-trender |
| Som SRE vill jag drill-down per endpoint | 1. Endpoint-lista<br>2. Request traces länk |

#### Epic 2.3: Log Explorer (NICE-TO-HAVE)

| User Story | Tasks |
|------------|-------|
| Som support vill jag söka i loggar | 1. Loki/OpenSearch integration<br>2. Log viewer UI<br>3. Filter på level, tenant, user |
| Som support vill jag korrelera log med trace | 1. Trace ID i loggar<br>2. Länk till trace view |

#### Epic 2.4: Alerting v1 (MÅSTE)

| User Story | Tasks |
|------------|-------|
| Som SRE vill jag få alert vid error spike | 1. Alert rules engine<br>2. Slack/email integration<br>3. Alert history |

**Beroenden V1:**

- Log aggregation kräver beslut om Loki vs OpenSearch
- Funnels kräver att core events är instrumenterade

---

### Fas 3: V2 (Månad 3-4) — NICE-TO-HAVE → MÅSTE

#### Epic 3.1: Session Replay

| User Story | Tasks | Trade-offs |
|------------|-------|------------|
| Som support vill jag se vad användaren gjorde | 1. Session recording SDK<br>2. Replay player<br>3. PII masking | Alternativ A: Köp (LogRocket/PostHog) ~$99-500/mån<br>Alternativ B: OpenReplay (self-hosted) |

#### Epic 3.2: Advanced Segmentation

| User Story | Tasks |
|------------|-------|
| Som PM vill jag skapa segment (power users, churn risk) | 1. Segment builder<br>2. Saved segments<br>3. Segment i alla dashboards |

#### Epic 3.3: Cost Attribution

| User Story | Tasks |
|------------|-------|
| Som ekonomi vill jag se kostnad per tenant | 1. Resource tagging<br>2. Cost allocation model<br>3. Cost dashboard |

#### Epic 3.4: Incident Management

| User Story | Tasks |
|------------|-------|
| Som SRE vill jag logga incidenter | 1. Incident CRUD<br>2. Timeline<br>3. Postmortem-mall |

---

### Fas 4: V3 (Månad 5-12) — VISION

#### Epic 4.1: Predictive Analytics

- Churn prediction ML-modell
- Capacity forecasting
- Anomaly detection

#### Epic 4.2: Self-Service BI

- Custom dashboard builder
- SQL-editor för power users
- Scheduled reports

#### Epic 4.3: Real-time Streaming

- WebSocket dashboard updates
- Live user counter
- Real-time alerts

---

## 3. Referensarkitektur

### Övergripande Flöde

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Frontend  │  │   Backend   │  │   Workers   │  │  Infra/K8s  │          │
│  │   (JS SDK)  │  │   (OTel)    │  │   (OTel)    │  │   (Metrics) │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                │                  │
│         ▼                ▼                ▼                ▼                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                           INGESTION LAYER                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐         │
│  │                    Event Gateway / Collector                     │         │
│  │            (Rate limiting, validation, enrichment)               │         │
│  └──────────────────────────────┬──────────────────────────────────┘         │
│                                 │                                             │
│         ┌───────────────────────┼───────────────────────┐                     │
│         ▼                       ▼                       ▼                     │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐               │
│  │   Events    │        │   Metrics   │        │ Logs/Traces │               │
│  │   (Kafka)   │        │(Prometheus) │        │   (OTel)    │               │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘               │
│         │                      │                      │                       │
├─────────┼──────────────────────┼──────────────────────┼───────────────────────┤
│         │              STORAGE LAYER                  │                       │
├─────────┼──────────────────────┼──────────────────────┼───────────────────────┤
│         ▼                      ▼                      ▼                       │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐               │
│  │ ClickHouse  │        │ Prometheus  │        │    Loki     │               │
│  │ (Analytics) │        │   (TSDB)    │        │   (Logs)    │               │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘               │
│         │                      │                      │                       │
│         └──────────────────────┼──────────────────────┘                       │
│                                ▼                                              │
│                    ┌─────────────────────┐                                    │
│                    │    Query Layer      │                                    │
│                    │  (Unified GraphQL)  │                                    │
│                    └──────────┬──────────┘                                    │
│                               │                                               │
├───────────────────────────────┼───────────────────────────────────────────────┤
│                               ▼                                               │
│                    ┌─────────────────────┐                                    │
│                    │    Admin Portal     │                                    │
│                    │      (React)        │                                    │
│                    └─────────────────────┘                                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Buy vs Build — Beslutsmatris

| Komponent | Alternativ A (Buy) | Alternativ B (Build/Self-host) | Rekommendation |
|-----------|-------------------|-------------------------------|----------------|
| **Product Analytics** | PostHog Cloud, Amplitude, Mixpanel | PostHog self-hosted, Plausible + ClickHouse | **PostHog** (bra balans) |
| **Error Tracking** | Sentry, Bugsnag | Sentry self-hosted, OpenTelemetry | **Sentry Cloud** (MVP), migrate later |
| **Metrics** | Datadog, New Relic | Prometheus + Grafana | **Prometheus/Grafana** (self-host) |
| **Logs** | Datadog Logs, Splunk | Loki, OpenSearch | **Loki** (kostnadseffektivt) |
| **Traces** | Datadog APM, Honeycomb | Tempo, Jaeger | **Tempo** (integr. med Grafana) |
| **Session Replay** | LogRocket, FullStory | OpenReplay, PostHog | **PostHog** (om redan valt) |

### Rekommenderad Stack (Balanserad)

```
MVP:        PostHog Cloud + Sentry Cloud + Grafana Cloud
V1:         + Self-hosted Prometheus/Loki
V2:         + ClickHouse för custom analytics
V3:         Hybridlösning med full kontroll
```

---

## 4. Datamodell

### 4.1 Analytics Events Schema

```sql
-- ClickHouse / PostgreSQL (analytics events)
CREATE TABLE analytics_events (
    -- Identifiers
    event_id          UUID DEFAULT gen_random_uuid(),
    event_name        VARCHAR(100) NOT NULL,  -- snake_case
    event_version     SMALLINT DEFAULT 1,

    -- Temporal
    timestamp         TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Multi-tenancy
    tenant_id         UUID NOT NULL,
    tenant_name       VARCHAR(100),  -- denormaliserat för queries

    -- Actor (pseudonymiserat)
    user_pseudo_id    VARCHAR(64),  -- SHA256 av user_id + salt
    session_id        VARCHAR(64),
    device_id         VARCHAR(64),

    -- Context
    page_url          VARCHAR(2000),
    page_title        VARCHAR(500),
    referrer          VARCHAR(2000),
    utm_source        VARCHAR(100),
    utm_medium        VARCHAR(100),
    utm_campaign      VARCHAR(100),

    -- Device & Geo (aggregerad, ej exakt)
    device_type       VARCHAR(20),   -- desktop, mobile, tablet
    browser_family    VARCHAR(50),
    os_family         VARCHAR(50),
    country_code      CHAR(2),
    region            VARCHAR(100),  -- endast om explicit consent

    -- Event-specifik data
    properties        JSONB,         -- flexibelt per event-typ

    -- Correlation
    trace_id          VARCHAR(32),   -- koppling till OTel
    span_id           VARCHAR(16),

    -- Metadata
    sdk_version       VARCHAR(20),
    environment       VARCHAR(20),   -- production, staging

    PRIMARY KEY (tenant_id, timestamp, event_id)
) PARTITION BY RANGE (timestamp);

-- Index för vanliga queries
CREATE INDEX idx_events_tenant_time ON analytics_events (tenant_id, timestamp DESC);
CREATE INDEX idx_events_user_session ON analytics_events (user_pseudo_id, session_id);
CREATE INDEX idx_events_name ON analytics_events (event_name);
```

### 4.2 Audit Log Schema

```sql
CREATE TABLE audit_logs (
    log_id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Actor
    actor_id          UUID NOT NULL,
    actor_email       VARCHAR(255),  -- lagras för läsbarhet
    actor_type        VARCHAR(20),   -- user, system, api_key
    actor_ip          INET,
    actor_user_agent  VARCHAR(500),

    -- Multi-tenancy
    tenant_id         UUID,          -- NULL för system-actions

    -- Action
    action            VARCHAR(100) NOT NULL,  -- user.create, permission.grant
    resource_type     VARCHAR(50) NOT NULL,   -- user, project, billing
    resource_id       UUID,

    -- Change tracking
    old_value         JSONB,         -- encrypted at rest
    new_value         JSONB,         -- encrypted at rest

    -- Context
    request_id        UUID,
    trace_id          VARCHAR(32),

    -- Compliance
    retention_until   DATE,          -- GDPR: automatisk radering
    is_sensitive      BOOLEAN DEFAULT FALSE
);

-- Partitionering för retention
CREATE INDEX idx_audit_tenant_time ON audit_logs (tenant_id, timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs (resource_type, resource_id);
```

### 4.3 Operational Logs Schema (Loki/OpenSearch)

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "error",
  "message": "Failed to process payment",
  "service": "payment-service",
  "version": "1.2.3",

  "tenant_id": "tenant_abc123",
  "user_pseudo_id": "u_hashed_xyz",
  "request_id": "req_789",

  "trace_id": "abc123def456",
  "span_id": "span_001",

  "error": {
    "type": "PaymentGatewayError",
    "message": "Card declined",
    "code": "CARD_DECLINED",
    "stack": "..."
  },

  "context": {
    "endpoint": "/api/v1/payments",
    "method": "POST",
    "duration_ms": 1523
  },

  "environment": "production",
  "host": "payment-service-pod-abc"
}
```

### 4.4 PII-hantering

```
┌─────────────────────────────────────────────────────────────┐
│                    PII SEPARATION MODEL                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Analytics DB   │         │    PII Vault     │          │
│  │  (ClickHouse)    │         │  (PostgreSQL +   │          │
│  │                  │         │   encryption)    │          │
│  │  user_pseudo_id ─┼────────►│  user_id         │          │
│  │  (SHA256 hash)   │         │  email           │          │
│  │                  │         │  name            │          │
│  │  Alla events     │         │  phone           │          │
│  │  UTAN PII        │         │                  │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                              │
│  Lookup endast för:                                          │
│  - Support med explicit behörighet                           │
│  - Audit-loggat                                              │
│  - Rate-limited                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Event Tracking Plan

### 5.1 Namnstandard

- Format: `{kategori}_{objekt}_{action}`
- Case: `snake_case`
- Exempel: `auth_user_signed_in`, `project_export_started`

### 5.2 Nyckelhändelser (60 st)

#### Autentisering & Onboarding (10)

| Event | Properties | Exempel Payload |
|-------|-----------|-----------------|
| `auth_user_signed_up` | `method`, `referral_code` | `{"method": "google", "referral_code": null}` |
| `auth_user_signed_in` | `method`, `mfa_used` | `{"method": "password", "mfa_used": true}` |
| `auth_user_signed_out` | `trigger` | `{"trigger": "user_action"}` |
| `auth_password_reset_requested` | - | `{}` |
| `auth_password_reset_completed` | - | `{}` |
| `auth_mfa_enabled` | `method` | `{"method": "totp"}` |
| `auth_mfa_disabled` | - | `{}` |
| `onboarding_step_completed` | `step_name`, `step_index`, `total_steps` | `{"step_name": "profile", "step_index": 2, "total_steps": 5}` |
| `onboarding_completed` | `duration_seconds`, `skipped_steps` | `{"duration_seconds": 180, "skipped_steps": []}` |
| `onboarding_abandoned` | `last_step`, `duration_seconds` | `{"last_step": "team_invite", "duration_seconds": 45}` |

#### Användarhantering (8)

| Event | Properties | Exempel Payload |
|-------|-----------|-----------------|
| `user_profile_updated` | `fields_changed` | `{"fields_changed": ["name", "timezone"]}` |
| `user_avatar_uploaded` | `file_size_bytes` | `{"file_size_bytes": 102400}` |
| `user_preferences_changed` | `preference_key`, `old_value`, `new_value` | `{"preference_key": "theme", "old_value": "light", "new_value": "dark"}` |
| `user_invited` | `role`, `method` | `{"role": "member", "method": "email"}` |
| `user_invitation_accepted` | `invite_age_hours` | `{"invite_age_hours": 2}` |
| `user_role_changed` | `old_role`, `new_role` | `{"old_role": "member", "new_role": "admin"}` |
| `user_deactivated` | `reason` | `{"reason": "admin_action"}` |
| `user_deleted` | `reason`, `data_deleted` | `{"reason": "user_request", "data_deleted": true}` |

#### Projekt/Workspace (10)

| Event | Properties | Exempel Payload |
|-------|-----------|-----------------|
| `project_created` | `template`, `name` | `{"template": "blank", "name": "My Project"}` |
| `project_opened` | `project_id`, `open_count` | `{"project_id": "proj_123", "open_count": 15}` |
| `project_renamed` | `old_name`, `new_name` | `{"old_name": "Untitled", "new_name": "Q1 Report"}` |
| `project_archived` | - | `{}` |
| `project_restored` | - | `{}` |
| `project_deleted` | `age_days` | `{"age_days": 90}` |
| `project_shared` | `share_type`, `recipient_count` | `{"share_type": "link", "recipient_count": 0}` |
| `project_duplicated` | `source_project_id` | `{"source_project_id": "proj_456"}` |
| `project_exported` | `format`, `file_size_bytes`, `duration_ms` | `{"format": "pdf", "file_size_bytes": 5242880, "duration_ms": 3500}` |
| `project_imported` | `format`, `file_size_bytes`, `success` | `{"format": "json", "file_size_bytes": 102400, "success": true}` |

#### Core Features (15)

| Event | Properties | Exempel Payload |
|-------|-----------|-----------------|
| `feature_used` | `feature_name`, `context` | `{"feature_name": "map_export", "context": "toolbar"}` |
| `editor_canvas_interacted` | `interaction_type`, `tool` | `{"interaction_type": "zoom", "tool": "pan"}` |
| `editor_layer_added` | `layer_type` | `{"layer_type": "contour"}` |
| `editor_layer_removed` | `layer_type` | `{"layer_type": "labels"}` |
| `editor_style_changed` | `property`, `value` | `{"property": "theme", "value": "dark"}` |
| `editor_undo_triggered` | `action_undone` | `{"action_undone": "layer_add"}` |
| `editor_redo_triggered` | `action_redone` | `{"action_redone": "layer_add"}` |
| `search_performed` | `query_length`, `result_count`, `duration_ms` | `{"query_length": 12, "result_count": 5, "duration_ms": 89}` |
| `search_result_clicked` | `result_position`, `result_type` | `{"result_position": 1, "result_type": "location"}` |
| `filter_applied` | `filter_type`, `filter_value` | `{"filter_type": "date_range", "filter_value": "last_30_days"}` |
| `sort_changed` | `sort_field`, `sort_direction` | `{"sort_field": "created_at", "sort_direction": "desc"}` |
| `pagination_used` | `page_number`, `page_size` | `{"page_number": 3, "page_size": 20}` |
| `keyboard_shortcut_used` | `shortcut`, `action` | `{"shortcut": "cmd+s", "action": "save"}` |
| `help_accessed` | `help_type`, `topic` | `{"help_type": "tooltip", "topic": "export_settings"}` |
| `feedback_submitted` | `feedback_type`, `rating` | `{"feedback_type": "feature_request", "rating": 4}` |

#### Billing & Subscription (8)

| Event | Properties | Exempel Payload |
|-------|-----------|-----------------|
| `billing_plan_viewed` | `current_plan` | `{"current_plan": "free"}` |
| `billing_plan_selected` | `plan_name`, `billing_cycle` | `{"plan_name": "pro", "billing_cycle": "annual"}` |
| `billing_checkout_started` | `plan_name`, `price_cents` | `{"plan_name": "pro", "price_cents": 9900}` |
| `billing_checkout_completed` | `plan_name`, `payment_method` | `{"plan_name": "pro", "payment_method": "card"}` |
| `billing_checkout_abandoned` | `step`, `reason` | `{"step": "payment", "reason": "page_closed"}` |
| `billing_subscription_upgraded` | `old_plan`, `new_plan` | `{"old_plan": "starter", "new_plan": "pro"}` |
| `billing_subscription_downgraded` | `old_plan`, `new_plan`, `reason` | `{"old_plan": "pro", "new_plan": "starter", "reason": "cost"}` |
| `billing_subscription_cancelled` | `reason`, `tenure_days` | `{"reason": "not_using", "tenure_days": 45}` |

#### Errors & Performance (9)

| Event | Properties | Exempel Payload |
|-------|-----------|-----------------|
| `error_occurred` | `error_type`, `error_code`, `message` | `{"error_type": "api", "error_code": "500", "message": "Internal error"}` |
| `error_boundary_triggered` | `component`, `error_message` | `{"component": "MapEditor", "error_message": "Cannot read property..."}` |
| `api_request_failed` | `endpoint`, `status_code`, `duration_ms` | `{"endpoint": "/api/projects", "status_code": 503, "duration_ms": 30000}` |
| `slow_request_detected` | `endpoint`, `duration_ms`, `threshold_ms` | `{"endpoint": "/api/export", "duration_ms": 8500, "threshold_ms": 5000}` |
| `page_loaded` | `page_name`, `load_time_ms`, `ttfb_ms` | `{"page_name": "editor", "load_time_ms": 1200, "ttfb_ms": 180}` |
| `page_unresponsive` | `page_name`, `duration_ms` | `{"page_name": "editor", "duration_ms": 5000}` |
| `network_offline_detected` | - | `{}` |
| `network_online_restored` | `offline_duration_seconds` | `{"offline_duration_seconds": 45}` |
| `storage_quota_warning` | `used_bytes`, `quota_bytes`, `percent_used` | `{"used_bytes": 4500000000, "quota_bytes": 5000000000, "percent_used": 90}` |

---

## 6. Admin Portal IA (Information Architecture)

### 6.1 Navigationsstruktur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN PORTAL                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                             │
│  │   SIDEBAR   │                                                             │
│  ├─────────────┤                                                             │
│  │             │                                                             │
│  │ 📊 Overview │  ← Landing page, north star metrics                        │
│  │             │                                                             │
│  │ 📈 Analytics│                                                             │
│  │   ├ Usage   │  ← DAU/WAU/MAU, feature usage                              │
│  │   ├ Funnels │  ← Conversion funnels                                      │
│  │   ├ Retention│ ← Cohort analysis                                         │
│  │   └ Segments│  ← User segments                                           │
│  │             │                                                             │
│  │ 🏢 Tenants  │                                                             │
│  │   ├ List    │  ← All tenants                                             │
│  │   ├ Health  │  ← Per-tenant health scores                                │
│  │   └ Billing │  ← Revenue, MRR                                            │
│  │             │                                                             │
│  │ 👥 Users    │                                                             │
│  │   ├ Search  │  ← User lookup                                             │
│  │   ├ Sessions│  ← Session explorer                                        │
│  │   └ Activity│  ← User timeline                                           │
│  │             │                                                             │
│  │ 🔧 Operations│                                                            │
│  │   ├ Health  │  ← Service status                                          │
│  │   ├ Errors  │  ← Error tracking                                          │
│  │   ├ Logs    │  ← Log explorer                                            │
│  │   ├ Traces  │  ← Distributed tracing                                     │
│  │   └ Alerts  │  ← Alert management                                        │
│  │             │                                                             │
│  │ 🚀 Releases │                                                             │
│  │   ├ Flags   │  ← Feature flags                                           │
│  │   ├ Rollouts│  ← Progressive rollouts                                    │
│  │   └ Experiments│ ← A/B tests                                              │
│  │             │                                                             │
│  │ 📋 Audit    │                                                             │
│  │   ├ Logs    │  ← Audit trail                                             │
│  │   └ Access  │  ← Permission changes                                      │
│  │             │                                                             │
│  │ ⚙️ Settings │                                                             │
│  │   ├ Team    │  ← Admin users                                             │
│  │   ├ RBAC    │  ← Roles & permissions                                     │
│  │   └ API Keys│  ← Integrations                                            │
│  │             │                                                             │
│  └─────────────┘                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Sidspecifikationer

#### Overview Dashboard

| Komponent | Typ | Interaktioner |
|-----------|-----|---------------|
| Metric Cards | KPI-kort | Klickbar → drill-down |
| Trend Sparklines | Linjediagram | Hover → värde |
| Active Users | Real-time counter | Auto-refresh |
| Error Rate | Gauge | Klick → Errors-sida |
| Quick Actions | Knappar | Vanliga admin-åtgärder |

#### Usage Analytics

| Komponent | Typ | Filter |
|-----------|-----|--------|
| Time Series Chart | Multi-line | Datum, tenant, segment |
| Feature Heatmap | Heatmap | Tid på dygnet |
| Top Features Table | Sorterad tabell | Tenant, period |
| Geo Distribution | Världskarta | Land, region |

#### Funnel Builder

| Komponent | Typ | Funktioner |
|-----------|-----|------------|
| Step Editor | Drag-drop | Add/remove/reorder steps |
| Funnel Viz | Sankey/Funnel | Hover för siffror |
| Conversion Table | Tabell | Step-by-step breakdown |
| Segment Comparison | Multi-funnel | Jämför segment |

#### User Lookup

| Komponent | Typ | Funktioner |
|-----------|-----|------------|
| Search Bar | Typeahead | Email, ID, namn |
| User Card | Profile | Avatar, metadata |
| Activity Timeline | Vertikal lista | Alla events för user |
| Session List | Accordion | Expandera sessioner |
| Action Buttons | Buttons | Impersonate, reset, disable |

#### Log Explorer

| Komponent | Typ | Funktioner |
|-----------|-----|------------|
| Query Bar | Text input | Lucene/LogQL syntax |
| Level Filter | Chips | error, warn, info, debug |
| Time Range | Date picker | Presets + custom |
| Log Stream | Virtual scroll | Live tail option |
| Log Detail | Slide-over | Full JSON, links |

### 6.3 Globala Filter

Alla sidor stödjer:

- **Tenant Selector**: Dropdown, multi-select
- **Date Range**: Presets (Today, 7d, 30d, 90d, Custom)
- **Environment**: Production, Staging
- **Refresh**: Auto/Manual + interval

### 6.4 Export & Sharing

- **CSV Export**: Alla tabeller
- **PNG/PDF**: Dashboards
- **Saved Views**: Spara filter-kombinationer
- **Scheduled Reports**: Email weekly/monthly
- **Shareable Links**: Deep links med query params

---

## 7. Observability-krav

### 7.1 SLO/SLI Definitioner

| Service | SLI | SLO | Mätmetod |
|---------|-----|-----|----------|
| API Gateway | Availability | 99.9% uptime | `(successful_requests / total_requests) * 100` |
| API Gateway | Latency p99 | < 500ms | Histogram bucket |
| Export Service | Success Rate | 99.5% | `(completed_exports / started_exports) * 100` |
| Export Service | Duration p95 | < 30s | Histogram |
| Auth Service | Login Success | > 99% (excl. bad creds) | Success counter |
| Database | Query p99 | < 100ms | pg_stat_statements |
| Event Pipeline | Ingestion Lag | < 5 min | Timestamp diff |

### 7.2 Error Budget

```
┌────────────────────────────────────────────────────────────┐
│  ERROR BUDGET CALCULATION                                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  SLO: 99.9% availability                                    │
│  Error budget per month: 0.1% = 43.2 minutes downtime       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BUDGET STATUS                                       │   │
│  │  ████████████████████░░░░░  80% remaining            │   │
│  │                                                       │   │
│  │  Used: 8.6 min (2 incidents)                         │   │
│  │  Remaining: 34.6 min                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Policy:                                                    │
│  - < 50% remaining: Freeze non-critical deploys            │
│  - < 25% remaining: Incident review required               │
│  - 0% remaining: Feature freeze, reliability focus only    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 7.3 Log Levels Standard

| Level | Användning | Exempel | Retention |
|-------|-----------|---------|-----------|
| `ERROR` | Något gick fel, kräver åtgärd | Exception, failed operation | 90 dagar |
| `WARN` | Potentiellt problem | Retry, degraded mode | 30 dagar |
| `INFO` | Affärshändelser | User login, export complete | 14 dagar |
| `DEBUG` | Detaljerad flödesinfo | Request payload, query params | 3 dagar |
| `TRACE` | Mycket detaljerat | Function entry/exit | 1 dag (sampling) |

### 7.4 Tracing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  DISTRIBUTED TRACING                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Trace Context Propagation:                                  │
│  - W3C Trace Context headers                                 │
│  - traceparent, tracestate                                   │
│                                                              │
│  Instrumentation:                                            │
│  - HTTP clients/servers (auto)                               │
│  - Database queries (auto)                                   │
│  - Message queues (manual spans)                             │
│  - External APIs (manual spans)                              │
│                                                              │
│  Sampling Strategy:                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Environment  │ Sample Rate │ Notes                  │    │
│  ├───────────────┼─────────────┼────────────────────────┤    │
│  │  Production   │ 1%          │ All errors: 100%       │    │
│  │  Staging      │ 100%        │                        │    │
│  │  Dev          │ 100%        │ Local only             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Tail-based Sampling (V2):                                   │
│  - Keep all traces with errors                               │
│  - Keep slow traces (> p95)                                  │
│  - Sample rest at 1%                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.5 Alert Definitions

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | error_rate > 5% for 5min | Critical | Page on-call |
| High Latency | p99 > 2s for 10min | Warning | Slack #alerts |
| Service Down | healthcheck fails 3x | Critical | Page on-call |
| Disk Space Low | disk_used > 85% | Warning | Slack #ops |
| Error Budget < 25% | budget_remaining < 25% | Warning | Slack #engineering |
| Unusual Traffic | requests > 3x baseline | Info | Slack #alerts |
| Certificate Expiry | days_until_expiry < 14 | Warning | Slack #ops |

### 7.6 Incident Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  INCIDENT LIFECYCLE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DETECTION                                                │
│     ├─ Alert fires                                           │
│     ├─ Auto-create incident in PagerDuty/Opsgenie           │
│     └─ Notify on-call                                        │
│                                                              │
│  2. TRIAGE (< 5 min SLA)                                     │
│     ├─ Acknowledge alert                                     │
│     ├─ Assess severity (SEV1-4)                              │
│     └─ Start incident channel (Slack)                        │
│                                                              │
│  3. MITIGATION                                               │
│     ├─ Identify blast radius                                 │
│     ├─ Apply fix or rollback                                 │
│     └─ Communicate status                                    │
│                                                              │
│  4. RESOLUTION                                               │
│     ├─ Confirm service restored                              │
│     ├─ Update status page                                    │
│     └─ Close incident                                        │
│                                                              │
│  5. POSTMORTEM (within 48h for SEV1-2)                       │
│     ├─ Timeline reconstruction                               │
│     ├─ Root cause analysis                                   │
│     ├─ Action items with owners                              │
│     └─ Share learnings                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Säkerhet & Efterlevnad

### 8.1 RBAC/ABAC Model

```
┌─────────────────────────────────────────────────────────────┐
│  ROLE-BASED ACCESS CONTROL                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ROLES:                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  super_admin      │ Full access, break-glass         │    │
│  │  admin            │ All except billing/security       │    │
│  │  analyst          │ Read analytics, no PII            │    │
│  │  support          │ User lookup, read logs            │    │
│  │  sre              │ Ops dashboards, alerts, deploys   │    │
│  │  auditor          │ Read audit logs only              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  PERMISSIONS:                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Resource          │ Actions                         │    │
│  ├────────────────────┼─────────────────────────────────┤    │
│  │  analytics:metrics │ read                            │    │
│  │  analytics:events  │ read, export                    │    │
│  │  users:profile     │ read, update                    │    │
│  │  users:pii         │ read (restricted)               │    │
│  │  tenants:*         │ read, update, delete            │    │
│  │  audit:logs        │ read                            │    │
│  │  system:config     │ read, update                    │    │
│  │  features:flags    │ read, toggle                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 ABAC Tillägg (Attribute-Based)

```typescript
// Exempel policy
const policy = {
  effect: "allow",
  action: "users:read:pii",
  conditions: {
    // Endast för sin egen tenant
    "tenant_id": { equals: "${user.tenant_id}" },
    // Endast under arbetstid
    "current_time": { between: ["08:00", "18:00"] },
    // MFA måste vara aktivt
    "user.mfa_enabled": { equals: true },
    // Inte för premium-kunder utan extra godkännande
    "resource.is_premium": { notEquals: true }
  }
};
```

### 8.3 Break-Glass Access

```
┌─────────────────────────────────────────────────────────────┐
│  BREAK-GLASS PROCEDURE                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Användning: Nödsituationer som kräver utökad access         │
│                                                              │
│  Process:                                                    │
│  1. Begäran via /admin/break-glass                           │
│  2. Ange: Anledning, scope, förväntad duration               │
│  3. Kräver: MFA + manager approval (för längre än 1h)        │
│  4. Automatisk: Audit log, Slack-notis till #security        │
│  5. Automatisk revokering efter timeout                      │
│  6. Postmortem krävs inom 24h                                │
│                                                              │
│  Teknisk implementation:                                     │
│  - Temporary elevated role                                   │
│  - All actions tagged with break_glass_session_id            │
│  - Real-time streaming till SIEM                             │
│  - Screenshot recording (opt-in)                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 PII-hantering & GDPR

| Krav | Implementation | Status |
|------|----------------|--------|
| Rätt till tillgång | Export user data API | V1 |
| Rätt till radering | Soft delete + 30d purge job | MVP |
| Rätt till rättelse | User profile update | MVP |
| Dataportabilitet | JSON export | V1 |
| Samtyckehantering | Consent table + UI | V1 |
| Data minimering | Pseudonymisering, sampling | MVP |
| Lagringstid | Retention policies per tabell | MVP |

### 8.5 Anonymisering/Pseudonymisering

```python
# Pseudonymisering för analytics
def pseudonymize_user_id(user_id: str, tenant_id: str) -> str:
    """
    Genererar deterministiskt pseudonym som inte kan reverseras
    utan access till hemlig salt.
    """
    salt = get_tenant_salt(tenant_id)  # Stored securely
    return hashlib.sha256(f"{salt}:{user_id}".encode()).hexdigest()[:16]

# K-anonymitet för geoData
def anonymize_location(lat: float, lng: float) -> dict:
    """
    Avrunda till ~10km precision för att säkerställa
    att minst K=5 användare delar samma location.
    """
    return {
        "lat": round(lat, 1),  # ~11km precision
        "lng": round(lng, 1),
        "precision": "low"
    }
```

### 8.6 Data Retention Policies

| Datatyp | Hot (SSD) | Warm (HDD) | Cold (Archive) | Deletion |
|---------|-----------|------------|----------------|----------|
| Analytics events | 7 dagar | 90 dagar | 2 år | Efter 2 år |
| Audit logs | 90 dagar | 2 år | 7 år | Efter 7 år |
| Error logs | 14 dagar | 90 dagar | 1 år | Efter 1 år |
| Session recordings | 7 dagar | 30 dagar | - | Efter 30 dagar |
| Metrics (raw) | 15 dagar | - | - | Downsampled |
| Metrics (1min) | 7 dagar | 30 dagar | - | Efter 30 dagar |
| Metrics (1h) | 90 dagar | 2 år | - | Efter 2 år |

---

## 9. Drift & Prestanda

### 9.1 Lagringsstrategi

```
┌─────────────────────────────────────────────────────────────┐
│  TIERED STORAGE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │     HOT     │  │    WARM     │  │    COLD     │          │
│  │    (SSD)    │  │    (HDD)    │  │   (S3/GCS)  │          │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤          │
│  │ Last 7 days │  │ 7-90 days   │  │ 90d - 2yr   │          │
│  │ ~100ms p99  │  │ ~500ms p99  │  │ ~5s p99     │          │
│  │ High IOPS   │  │ Medium IOPS │  │ Low cost    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  Automatic Migration:                                        │
│  - Daily job moves partitions between tiers                  │
│  - Metadata stays in hot for fast queries                    │
│  - On-demand warm-up för ad-hoc analysis                     │
│                                                              │
│  Estimated Costs (1M events/day):                            │
│  - Hot:  ~$500/month (high-perf SSD)                         │
│  - Warm: ~$100/month (standard SSD)                          │
│  - Cold: ~$10/month (object storage)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Partitionering & Indexering

```sql
-- ClickHouse partitionering
CREATE TABLE analytics_events (
    ...
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (tenant_id, user_pseudo_id, timestamp)
TTL timestamp + INTERVAL 90 DAY DELETE,
    timestamp + INTERVAL 7 DAY TO DISK 'warm',
    timestamp + INTERVAL 90 DAY TO DISK 'cold'
SETTINGS index_granularity = 8192;

-- Materialized view för snabba aggregeringar
CREATE MATERIALIZED VIEW daily_usage_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date, event_name)
AS SELECT
    tenant_id,
    toDate(timestamp) as date,
    event_name,
    count() as event_count,
    uniqExact(user_pseudo_id) as unique_users
FROM analytics_events
GROUP BY tenant_id, date, event_name;
```

### 9.3 Rate Limiting & Backpressure

```yaml
# Rate limits per tier
rate_limits:
  ingestion:
    - tier: free
      events_per_second: 100
      burst: 500
    - tier: pro
      events_per_second: 1000
      burst: 5000
    - tier: enterprise
      events_per_second: 10000
      burst: 50000

  api:
    - endpoint: /api/analytics/*
      requests_per_minute: 60
      concurrent: 5
    - endpoint: /api/export/*
      requests_per_hour: 10
      concurrent: 1

  admin_portal:
    - heavy_queries: 10/minute
    - exports: 5/hour

# Backpressure strategy
backpressure:
  queue_high_watermark: 100000  # Start shedding
  queue_critical: 500000        # Drop non-critical
  response:
    - status: 429
    - header: Retry-After
    - exponential_backoff: true
```

### 9.4 Event Replay

```
┌─────────────────────────────────────────────────────────────┐
│  EVENT REPLAY CAPABILITY                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Use Cases:                                                  │
│  - Bug fix i event processing → replay för korrekt data     │
│  - Ny analytics pipeline → backfill historik                │
│  - Schema migration → reprocess med nytt format              │
│                                                              │
│  Architecture:                                               │
│                                                              │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐          │
│  │  Ingress  │────▶│   Kafka   │────▶│ Processor │          │
│  │           │     │ (retain   │     │           │          │
│  │           │     │  30 days) │     │           │          │
│  └───────────┘     └─────┬─────┘     └───────────┘          │
│                          │                                   │
│                    ┌─────▼─────┐                             │
│                    │    S3     │ ← Long-term archive         │
│                    │ (Parquet) │   for replay > 30d          │
│                    └───────────┘                             │
│                                                              │
│  Replay Command:                                             │
│  $ replay-events --from 2025-01-01 --to 2025-01-15 \        │
│                  --filter 'event_name=export_*' \            │
│                  --target analytics-reprocess               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Mätetal & KPI:er

### 10.1 North Star Metrics

| Metric | Definition | Target | Mätfrekvens |
|--------|-----------|--------|-------------|
| **Weekly Active Tenants** | Tenants med ≥1 aktiv användare senaste 7d | Growth 5% MoM | Dagligen |
| **Exports per Active User** | (Total exports) / (MAU) | > 3 per månad | Veckovis |
| **Time to First Export** | Tid från signup till första export | < 10 min | Per cohort |

### 10.2 Product Metrics

| Kategori | Metric | Beräkning |
|----------|--------|-----------|
| **Engagement** | DAU/MAU Ratio | Unique daily users / Unique monthly users |
| | Stickiness | (DAU/MAU) * 100 |
| | Session Duration (median) | p50 av session_end - session_start |
| | Actions per Session | Totala actions / Totala sessioner |
| **Retention** | D1 Retention | Users active day after signup / Signups |
| | D7 Retention | Users active 7 days after signup / Signups |
| | D30 Retention | Users active 30 days after signup / Signups |
| | Weekly Retention Cohort | Matrix av weekly cohorts |
| **Conversion** | Signup → Onboarding Complete | Funnel conversion rate |
| | Free → Paid | Trial users who converted / Total trials |
| | Feature Adoption | Users who used feature / MAU |
| **Churn Signals** | Days Since Last Active | Per user, alert at >7d |
| | Feature Usage Decline | Week-over-week feature usage drop |
| | Error Frequency Increase | Errors experienced increasing |

### 10.3 Operational Metrics

| Kategori | Metric | SLO/Target |
|----------|--------|------------|
| **Availability** | Uptime | 99.9% |
| | Successful Requests | 99.5% |
| **Latency** | API p50 | < 100ms |
| | API p95 | < 300ms |
| | API p99 | < 500ms |
| | Page Load p75 | < 2s |
| **Throughput** | Requests/sec | Baseline + headroom |
| | Events ingested/sec | < queue capacity |
| **Errors** | Error Rate | < 1% |
| | 5xx Rate | < 0.1% |
| **Reliability** | MTTR | < 30 min (SEV1) |
| | MTBF | > 30 days |
| | Error Budget Burn Rate | < 1x average |

### 10.4 Business Metrics

| Metric | Definition |
|--------|-----------|
| MRR | Monthly Recurring Revenue |
| ARPU | Average Revenue Per User |
| LTV | Lifetime Value |
| CAC | Customer Acquisition Cost |
| LTV:CAC Ratio | Target > 3:1 |
| Net Revenue Retention | Target > 100% |
| Gross Churn | Lost MRR / Starting MRR |
| Expansion Revenue | Upgrades + Add-ons |

---

## 11. Dashboard-katalog

### 11.1 Executive Dashboards (3)

| Dashboard | Syfte | Nyckelkomponenter |
|-----------|-------|-------------------|
| **1. North Star Overview** | C-suite weekly review | North star trend, MRR, WAT, Error budget gauge |
| **2. Growth Dashboard** | Spåra tillväxt | Signups funnel, activation rate, cohort retention heatmap |
| **3. Revenue Dashboard** | Finansiell översikt | MRR waterfall, ARPU trend, churn analysis, expansion revenue |

### 11.2 Product Dashboards (5)

| Dashboard | Syfte | Nyckelkomponenter |
|-----------|-------|-------------------|
| **4. Engagement Dashboard** | Daglig användning | DAU/WAU/MAU, stickiness, sessions/user, feature heatmap |
| **5. Feature Adoption** | Feature usage | Feature usage ranking, adoption curve, usage by segment |
| **6. Funnel Analysis** | Conversion tracking | Configurable funnel builder, drop-off analysis |
| **7. Retention Cohorts** | User retention | Cohort matrix, retention curves, churn prediction |
| **8. User Segments** | Segment comparison | Segment builder, segment metrics comparison |

### 11.3 Operations Dashboards (5)

| Dashboard | Syfte | Nyckelkomponenter |
|-----------|-------|-------------------|
| **9. Service Health** | Real-time status | Service status grid, health scores, dependencies |
| **10. Performance** | Latency & throughput | p50/p95/p99 timeseries, endpoint breakdown, slow queries |
| **11. Error Tracking** | Error monitoring | Error rate trend, grouped errors, stack traces, affected users |
| **12. Infrastructure** | Infra metrics | CPU/Memory/Disk, pod status, queue depths |
| **13. Alerts Dashboard** | Alert management | Active alerts, alert history, on-call schedule |

### 11.4 Support Dashboards (4)

| Dashboard | Syfte | Nyckelkomponenter |
|-----------|-------|-------------------|
| **14. User Lookup** | Individual user view | Search, profile, activity timeline, sessions |
| **15. Tenant Health** | Per-tenant status | Tenant list, health scores, usage trends, billing status |
| **16. Log Explorer** | Log search | Query builder, log stream, filters, export |
| **17. Trace Explorer** | Distributed tracing | Trace search, waterfall view, span details |

### 11.5 Compliance Dashboard (1)

| Dashboard | Syfte | Nyckelkomponenter |
|-----------|-------|-------------------|
| **18. Audit & Compliance** | Audit trail | Audit log search, access patterns, data requests, retention status |

---

## 12. Support Tooling

### 12.1 User Lookup Tool

```
┌─────────────────────────────────────────────────────────────┐
│  USER LOOKUP                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Search: [ user@example.com                    ] [🔍]        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  👤 John Doe                                        │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  Email:     john@example.com                        │    │
│  │  User ID:   usr_abc123                              │    │
│  │  Tenant:    Acme Corp (tenant_xyz)                  │    │
│  │  Plan:      Pro                                     │    │
│  │  Created:   2024-06-15                              │    │
│  │  Last seen: 2 hours ago                             │    │
│  │  Status:    ● Active                                │    │
│  │                                                       │    │
│  │  Quick Actions:                                      │    │
│  │  [View Sessions] [Reset Password] [Impersonate]     │    │
│  │  [View Logs] [Export Data] [Disable Account]        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  RECENT ACTIVITY                                             │
│  ───────────────                                             │
│  │ 14:32  project_exported     Q1 Report (PDF, 2.3MB)  │    │
│  │ 14:28  editor_style_changed theme: dark             │    │
│  │ 14:15  project_opened       Q1 Report               │    │
│  │ 13:45  auth_user_signed_in  method: password        │    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Session Replay

```
┌─────────────────────────────────────────────────────────────┐
│  SESSION REPLAY                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session: sess_789xyz | User: john@example.com               │
│  Duration: 12:34 | Started: 2025-01-15 14:00                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │        [Replay visualization area]                    │    │
│  │                                                       │    │
│  │    DOM snapshot med markerade klick/scroll            │    │
│  │    PII automatiskt maskerat                           │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ▶ ──●────────────────────────────────────── 2:34 / 12:34   │
│  [⏮] [⏪] [▶] [⏩] [⏭] [1x ▼] [🔇]                          │
│                                                              │
│  EVENTS TIMELINE                                             │
│  │ 0:00  page_loaded      /dashboard                   │    │
│  │ 0:15  button_clicked   "New Project"                │    │
│  │ 0:45  error_occurred   TypeError: ...        🔴     │    │
│  │ 1:20  page_loaded      /editor                      │    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 12.3 Feature Flags

```
┌─────────────────────────────────────────────────────────────┐
│  FEATURE FLAGS                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [+ New Flag]  [Import]  Filter: [All ▼] [🔍 Search...]     │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Flag                  │ Status  │ Rollout │ Last Change ││
│  ├───────────────────────┼─────────┼─────────┼─────────────┤│
│  │ new_export_engine     │ 🟢 ON   │ 100%    │ 2d ago      ││
│  │ dark_mode_v2          │ 🟡 PART │ 25%     │ 5h ago      ││
│  │ ai_suggestions        │ 🔴 OFF  │ 0%      │ 1w ago      ││
│  │ billing_v2            │ 🟡 PART │ Beta    │ 3d ago      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  FLAG DETAIL: dark_mode_v2                                   │
│  ──────────────────────────                                  │
│  Status: Partial Rollout (25%)                               │
│  Strategy: Percentage-based                                  │
│  Segments: [internal_beta, power_users]                      │
│                                                              │
│  Override for user: [                    ] [Add Override]    │
│                                                              │
│  [Edit Flag] [View History] [Kill Switch 🛑]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 12.4 Kill Switches

```yaml
# Kill switch definitions
kill_switches:
  - name: disable_exports
    description: Emergency stop for all export jobs
    affects: [export_service, queue_workers]
    activation:
      - manual: /admin/kill-switch/exports
      - automatic:
          condition: error_rate > 50%
          duration: 5m
    notifications:
      - slack: #incidents
      - pagerduty: export-oncall

  - name: read_only_mode
    description: Disable all writes, allow reads
    affects: [api_gateway, all_services]
    activation:
      - manual_only: true
      - requires: super_admin

  - name: maintenance_mode
    description: Show maintenance page
    affects: [frontend, api_gateway]
    custom_message: true
```

### 12.5 Reproducible Errors

```
┌─────────────────────────────────────────────────────────────┐
│  ERROR DETAIL                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TypeError: Cannot read property 'map' of undefined          │
│  ────────────────────────────────────────────────────────    │
│  First seen: 2025-01-14 09:00 | Last seen: 2 hours ago      │
│  Occurrences: 47 | Affected users: 12                        │
│                                                              │
│  STACK TRACE                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  at ProjectList.render (ProjectList.tsx:45:12)       │    │
│  │  at renderWithHooks (react-dom.js:1234)              │    │
│  │  at updateFunctionComponent (react-dom.js:5678)      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  CONTEXT                                                     │
│  Browser: Chrome 120 (45%), Firefox 121 (30%), Safari (25%) │
│  OS: macOS (60%), Windows (35%), Linux (5%)                  │
│  Page: /dashboard                                            │
│                                                              │
│  REPRODUCTION                                                │
│  Request: GET /api/projects                                  │
│  Response: { "projects": null }  ← Root cause                │
│                                                              │
│  LINKED                                                      │
│  [View Trace abc123] [View Session] [View PR #456]           │
│                                                              │
│  ACTIONS                                                     │
│  [Assign to...] [Create Issue] [Mark Resolved] [Ignore]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Bilagor

### Bilaga A: Tekniska Implementationsdetaljer

#### A.1 SDK Wrapper (TypeScript)

```typescript
// analytics-sdk.ts
import posthog from 'posthog-js';

interface AnalyticsConfig {
  apiKey: string;
  environment: 'production' | 'staging' | 'development';
  tenantId: string;
  userId?: string;
  debug?: boolean;
}

interface EventProperties {
  [key: string]: string | number | boolean | null;
}

class AnalyticsSDK {
  private initialized = false;
  private queue: Array<{ name: string; properties: EventProperties }> = [];
  private config: AnalyticsConfig;

  init(config: AnalyticsConfig): void {
    this.config = config;

    posthog.init(config.apiKey, {
      api_host: 'https://analytics.yourapp.com',
      autocapture: false,  // Explicit events only
      capture_pageview: false,
      persistence: 'localStorage',
      loaded: () => {
        this.initialized = true;
        this.flushQueue();
      }
    });

    // Set super properties
    posthog.register({
      tenant_id: config.tenantId,
      environment: config.environment,
      sdk_version: '1.0.0'
    });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    // Pseudonymize before sending
    const pseudoId = this.pseudonymize(userId);
    posthog.identify(pseudoId, traits);
  }

  track(eventName: string, properties: EventProperties = {}): void {
    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      page_title: document.title
    };

    if (!this.initialized) {
      this.queue.push({ name: eventName, properties: enrichedProperties });
      return;
    }

    posthog.capture(eventName, enrichedProperties);
  }

  private pseudonymize(userId: string): string {
    // Client-side pseudonymization
    const encoder = new TextEncoder();
    const data = encoder.encode(`${this.config.tenantId}:${userId}`);
    return crypto.subtle.digest('SHA-256', data)
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16));
  }

  private flushQueue(): void {
    this.queue.forEach(({ name, properties }) => {
      posthog.capture(name, properties);
    });
    this.queue = [];
  }
}

export const analytics = new AnalyticsSDK();
```

#### A.2 Audit Log Middleware (Node.js)

```typescript
// audit-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from './audit-log-service';

interface AuditableAction {
  action: string;
  resourceType: string;
  extractResourceId: (req: Request) => string | null;
  extractChanges?: (req: Request, res: Response) => { old?: unknown; new?: unknown };
}

const AUDITABLE_ACTIONS: AuditableAction[] = [
  {
    action: 'user.create',
    resourceType: 'user',
    extractResourceId: (req) => req.body?.id,
    extractChanges: (req) => ({ new: req.body })
  },
  {
    action: 'user.update',
    resourceType: 'user',
    extractResourceId: (req) => req.params.userId,
    extractChanges: (req, res) => ({
      old: res.locals.previousState,
      new: req.body
    })
  },
  // ... more actions
];

export function auditMiddleware(auditService: AuditLogService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auditAction = AUDITABLE_ACTIONS.find(a =>
      matchesRoute(req, a)
    );

    if (!auditAction) {
      return next();
    }

    // Capture original end
    const originalEnd = res.end;

    res.end = function(...args) {
      // Log after response
      setImmediate(async () => {
        try {
          const changes = auditAction.extractChanges?.(req, res);

          await auditService.log({
            actorId: req.user?.id,
            actorEmail: req.user?.email,
            actorType: req.user ? 'user' : 'system',
            actorIp: req.ip,
            actorUserAgent: req.headers['user-agent'],
            tenantId: req.tenant?.id,
            action: auditAction.action,
            resourceType: auditAction.resourceType,
            resourceId: auditAction.extractResourceId(req),
            oldValue: changes?.old,
            newValue: changes?.new,
            requestId: req.id,
            traceId: req.headers['x-trace-id']
          });
        } catch (error) {
          console.error('Audit log failed:', error);
          // Don't fail request on audit failure
        }
      });

      return originalEnd.apply(this, args);
    };

    next();
  };
}
```

---

### Bilaga B: Risker & Mitigeringar

| Fas | Risk | Sannolikhet | Påverkan | Mitigation |
|-----|------|-------------|----------|------------|
| MVP | Event-volym underskattas | Hög | Medel | Implementera sampling från start |
| MVP | PII läcker till analytics | Medel | Kritisk | Pseudonymisering på SDK-nivå |
| V1 | Query-prestanda | Medel | Hög | Materialized views, indexering |
| V1 | GDPR-compliance miss | Låg | Kritisk | Legal review, deletion pipeline |
| V2 | Kostnadsspiral | Medel | Medel | Budget alerts, tier policies |
| V2 | Session replay storage | Hög | Medel | Aggressive retention, compression |
| V3 | Alert fatigue | Hög | Medel | Alert tuning, aggregation |
| All | Vendor lock-in | Medel | Medel | Abstraktionslager, standards |

---

### Bilaga C: Definition of Done per Fas

#### MVP Definition of Done

- [ ] Alla P0 user stories implementerade
- [ ] Event tracking för 20 core events live
- [ ] Basic dashboard med 5 metrics
- [ ] Error tracking integrerat
- [ ] Audit log för alla admin-åtgärder
- [ ] RBAC med 3 roller implementerat
- [ ] Dokumentation för event schema
- [ ] Load test: 1000 events/sec sustained
- [ ] Security review genomförd
- [ ] GDPR-deletion pipeline testad

#### V1 Definition of Done

- [ ] Funnels builder funktionell
- [ ] Retention cohorts visualiseras
- [ ] Log explorer med full-text search
- [ ] Alerting med Slack-integration
- [ ] User lookup med 500ms SLA
- [ ] 50 events instrumenterade
- [ ] Multi-tenant isolation verifierad
- [ ] Backup & recovery testad
- [ ] Runbook dokumenterad

#### V2 Definition of Done

- [ ] Session replay för support
- [ ] Advanced segmentation
- [ ] Cost attribution dashboard
- [ ] Incident management workflow
- [ ] SLO/SLI dashboards
- [ ] Error budget tracking
- [ ] Self-service report scheduling
- [ ] Break-glass procedure testad
- [ ] Disaster recovery drill genomförd

---

### Bilaga D: Ordlista

| Term | Definition |
|------|-----------|
| **DAU** | Daily Active Users |
| **WAU** | Weekly Active Users |
| **MAU** | Monthly Active Users |
| **MRR** | Monthly Recurring Revenue |
| **ARPU** | Average Revenue Per User |
| **LTV** | Lifetime Value |
| **CAC** | Customer Acquisition Cost |
| **SLO** | Service Level Objective |
| **SLI** | Service Level Indicator |
| **MTTR** | Mean Time To Recovery |
| **MTBF** | Mean Time Between Failures |
| **PII** | Personally Identifiable Information |
| **RBAC** | Role-Based Access Control |
| **ABAC** | Attribute-Based Access Control |
| **OTel** | OpenTelemetry |

---

*Dokumentversion: 1.0*
*Senast uppdaterad: 2025-01-27*
*Författare: Staff/Principal Engineer*

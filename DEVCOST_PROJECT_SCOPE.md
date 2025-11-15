# DevCost: Cloud Cost Optimizer for Developers
## Project Scope & Implementation Plan

**Goal:** Build a B2B SaaS product that gets 50+ users and 5+ paying customers within 90 days, demonstrating senior-level full-stack and business skills for London tech sponsorship.

---

## Executive Summary

**What it does:**
DevCost connects to your cloud providers (AWS, GCP, Vercel, GitHub Actions) and shows:
- Real-time cost breakdown by service/project
- AI-powered optimization suggestions
- Anomaly detection and alerts
- Anonymous benchmarking against similar teams

**Why it matters:**
- Every company struggles with cloud costs
- Shows B2B SaaS experience (critical for London)
- Demonstrates production-grade architecture
- Real revenue = proof of product-market fit

**Success metrics:**
- ✅ 50+ free users in first 60 days
- ✅ 5+ paying customers ($10-50/month)
- ✅ 99%+ uptime
- ✅ <200ms p95 API latency
- ✅ Featured on HackerNews/ProductHunt

---

## Phase 1: MVP (Weeks 1-4)

### Week 1-2: AWS Cost Explorer Integration

**Core Features:**
1. **Authentication & Multi-tenancy**
   - Clerk.com for auth (free tier)
   - Row-level security in PostgreSQL
   - Organization/team support

2. **AWS Integration**
   - OAuth or API key connection
   - Daily cost ingestion via AWS Cost Explorer API
   - Store in PostgreSQL with proper indexing

3. **Basic Dashboard**
   - Total spend (current month vs last month)
   - Service breakdown (EC2, S3, RDS, etc.)
   - Daily cost trend chart
   - Top 5 most expensive services

**Technical Implementation:**

```typescript
// File: apps/web/app/dashboard/page.tsx
import { CostOverview } from '@/components/dashboard/cost-overview'
import { ServiceBreakdown } from '@/components/dashboard/service-breakdown'
import { TrendChart } from '@/components/dashboard/trend-chart'

export default async function DashboardPage() {
  const costs = await getCostData() // Server action

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <CostOverview data={costs} />
      <ServiceBreakdown data={costs} />
      <TrendChart data={costs} />
    </div>
  )
}
```

```python
# File: backend/services/aws_cost_service.py
import boto3
from datetime import datetime, timedelta

class AWSCostService:
    def __init__(self, access_key: str, secret_key: str):
        self.client = boto3.client(
            'ce',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )

    async def fetch_monthly_costs(self):
        """Fetch costs for current month grouped by service"""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now().replace(day=1)).strftime('%Y-%m-%d')

        response = self.client.get_cost_and_usage(
            TimePeriod={'Start': start_date, 'End': end_date},
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
        )

        return self._transform_response(response)

    def _transform_response(self, response):
        """Transform AWS response to our data model"""
        costs = []
        for result in response['ResultsByTime']:
            date = result['TimePeriod']['Start']
            for group in result['Groups']:
                service = group['Keys'][0]
                amount = float(group['Metrics']['UnblendedCost']['Amount'])
                costs.append({
                    'date': date,
                    'service': service,
                    'amount': amount
                })
        return costs
```

```sql
-- File: backend/migrations/001_create_costs_table.sql
CREATE TABLE cost_data (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'aws', 'gcp', 'vercel', etc.
    service_name VARCHAR(255) NOT NULL,
    cost_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicates
    UNIQUE(organization_id, provider, service_name, cost_date)
);

-- Index for fast dashboard queries
CREATE INDEX idx_cost_data_org_date ON cost_data(organization_id, cost_date DESC);
CREATE INDEX idx_cost_data_service ON cost_data(service_name);

-- Row-level security for multi-tenancy
ALTER TABLE cost_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_data_isolation ON cost_data
    USING (organization_id = current_setting('app.current_organization_id')::BIGINT);
```

**Deliverables:**
- ✅ Working AWS connection flow
- ✅ Dashboard showing real costs
- ✅ Multi-tenant database with RLS
- ✅ Automated daily cost sync (cron job)

---

### Week 3-4: GitHub Actions Cost Tracking

**Why GitHub Actions:**
- Every developer uses it
- Costs are hidden and surprising
- Easy to demonstrate value quickly

**Features:**
1. **GitHub OAuth Integration**
   - Connect via GitHub App
   - Read Actions workflow runs
   - Calculate costs per workflow

2. **Actions Cost Calculation**
```typescript
// File: backend/services/github_actions_cost.ts
interface WorkflowRun {
  id: number
  name: string
  duration_minutes: number
  runner_type: 'ubuntu-latest' | 'macos-latest' | 'windows-latest'
}

class GitHubActionsCostCalculator {
  // Pricing from GitHub documentation (2025)
  private readonly PRICING = {
    'ubuntu-latest': 0.008,    // per minute
    'macos-latest': 0.08,      // per minute
    'windows-latest': 0.016,   // per minute
  }

  calculateWorkflowCost(run: WorkflowRun): number {
    const pricePerMinute = this.PRICING[run.runner_type]
    return run.duration_minutes * pricePerMinute
  }

  async fetchMonthlyWorkflowCosts(org: string): Promise<CostBreakdown> {
    const runs = await this.fetchWorkflowRuns(org)

    const breakdown = runs.reduce((acc, run) => {
      const cost = this.calculateWorkflowCost(run)
      acc[run.name] = (acc[run.name] || 0) + cost
      return acc
    }, {} as Record<string, number>)

    return {
      total: Object.values(breakdown).reduce((a, b) => a + b, 0),
      by_workflow: breakdown
    }
  }
}
```

**Dashboard Addition:**
```tsx
// File: components/dashboard/github-actions-card.tsx
export function GitHubActionsCard({ costs }: { costs: ActionsCost }) {
  const topWorkflows = Object.entries(costs.by_workflow)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Actions Costs</CardTitle>
        <CardDescription>
          ${costs.total.toFixed(2)} this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topWorkflows.map(([workflow, cost]) => (
            <div key={workflow} className="flex justify-between">
              <span className="text-sm">{workflow}</span>
              <span className="font-mono">${cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Deliverables:**
- ✅ GitHub App with proper permissions
- ✅ Workflow run cost calculation
- ✅ Historical cost tracking
- ✅ Cost breakdown by repository

---

## Phase 2: Optimization Engine (Weeks 5-6)

### AI-Powered Suggestions

**Use OpenAI/Anthropic to generate optimization suggestions:**

```python
# File: backend/services/optimization_service.py
from anthropic import Anthropic
import json

class OptimizationService:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def generate_suggestions(self, cost_data: dict) -> list[Suggestion]:
        """Use Claude to generate cost optimization suggestions"""

        prompt = f"""Analyze this cloud cost data and provide 3-5 specific optimization suggestions:

Cost Data:
{json.dumps(cost_data, indent=2)}

For each suggestion, provide:
1. Title (concise, action-oriented)
2. Description (specific steps to implement)
3. Estimated savings ($ per month)
4. Difficulty (easy/medium/hard)
5. Risk level (low/medium/high)

Focus on:
- Right-sizing instances
- Removing unused resources
- Switching to ARM/Graviton
- Using spot instances
- Moving to cheaper storage tiers
- Optimizing data transfer

Return as JSON array."""

        response = self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        suggestions = json.loads(response.content[0].text)
        return [Suggestion(**s) for s in suggestions]
```

**Example Suggestions:**

```json
[
  {
    "title": "Switch CI runners to ARM",
    "description": "Your GitHub Actions use ubuntu-latest (x86). Switching to ubuntu-22.04-arm saves 37% on compute costs with no code changes.",
    "estimated_savings": 45.20,
    "difficulty": "easy",
    "risk": "low",
    "implementation": [
      "Update .github/workflows/*.yml",
      "Change runs-on: ubuntu-latest to ubuntu-22.04-arm",
      "Test workflows to ensure compatibility"
    ]
  },
  {
    "title": "Delete unused EBS volumes",
    "description": "Found 12 EBS volumes not attached to any instance, costing $96/month.",
    "estimated_savings": 96.00,
    "difficulty": "easy",
    "risk": "medium",
    "implementation": [
      "Review volumes: vol-abc123, vol-def456, ...",
      "Take snapshots as backup",
      "Delete unused volumes",
      "Set up automated cleanup policy"
    ]
  }
]
```

**UI Component:**

```tsx
// File: components/optimizations/suggestion-card.tsx
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [implemented, setImplemented] = useState(false)

  return (
    <Card className={implemented ? 'border-green-500' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{suggestion.title}</CardTitle>
            <CardDescription>{suggestion.description}</CardDescription>
          </div>
          <Badge variant={suggestion.risk === 'low' ? 'default' : 'destructive'}>
            {suggestion.risk} risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Estimated savings
            </span>
            <span className="text-2xl font-bold text-green-600">
              ${suggestion.estimated_savings}/mo
            </span>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Implementation Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {suggestion.implementation.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <Button
            onClick={() => setImplemented(!implemented)}
            variant={implemented ? 'outline' : 'default'}
          >
            {implemented ? (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Implemented</>
            ) : (
              'Mark as Implemented'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Deliverables:**
- ✅ AI suggestion generation
- ✅ Suggestions database table
- ✅ Suggestion UI with implementation tracking
- ✅ Estimated savings calculation

---

## Phase 3: Alerts & Monitoring (Weeks 7-8)

### Anomaly Detection

**Detect unusual spending patterns:**

```python
# File: backend/services/anomaly_detection.py
import numpy as np
from scipy import stats

class AnomalyDetector:
    def detect_spending_anomalies(self, historical_costs: list[float]) -> dict:
        """
        Detect if today's spending is anomalous using z-score
        """
        if len(historical_costs) < 7:
            return {"is_anomaly": False, "reason": "Not enough data"}

        recent_costs = historical_costs[-30:]  # Last 30 days
        today_cost = historical_costs[-1]

        mean = np.mean(recent_costs[:-1])
        std = np.std(recent_costs[:-1])

        # Z-score: how many standard deviations from mean
        z_score = (today_cost - mean) / std if std > 0 else 0

        if abs(z_score) > 2:  # More than 2 std devs = anomaly
            return {
                "is_anomaly": True,
                "severity": "high" if abs(z_score) > 3 else "medium",
                "z_score": z_score,
                "today_cost": today_cost,
                "expected_cost": mean,
                "difference": today_cost - mean,
                "percentage_change": ((today_cost - mean) / mean * 100)
            }

        return {"is_anomaly": False}
```

**Alert System:**

```python
# File: backend/services/alert_service.py
from resend import Resend

class AlertService:
    def __init__(self):
        self.resend = Resend(os.getenv("RESEND_API_KEY"))

    async def send_anomaly_alert(self, user_email: str, anomaly: dict):
        """Send email alert for spending anomaly"""

        html = f"""
        <h2>⚠️ Unusual Cloud Spending Detected</h2>
        <p>Your cloud costs today are <strong>{anomaly['percentage_change']:.1f}%</strong>
        higher than expected.</p>

        <table>
          <tr><td>Today's cost:</td><td>${anomaly['today_cost']:.2f}</td></tr>
          <tr><td>Expected cost:</td><td>${anomaly['expected_cost']:.2f}</td></tr>
          <tr><td>Difference:</td><td>${anomaly['difference']:.2f}</td></tr>
        </table>

        <a href="https://devcost.app/dashboard">View Details →</a>
        """

        await self.resend.emails.send({
            "from": "alerts@devcost.app",
            "to": user_email,
            "subject": f"🚨 Cloud costs up {anomaly['percentage_change']:.0f}%",
            "html": html
        })
```

**Alert Configuration UI:**

```tsx
// File: app/settings/alerts/page.tsx
export function AlertSettings() {
  return (
    <Form>
      <FormField
        name="daily_budget"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Daily Budget Alert</FormLabel>
            <FormDescription>
              Get notified when daily costs exceed this amount
            </FormDescription>
            <FormControl>
              <Input type="number" placeholder="100" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="anomaly_detection"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <div>
              <FormLabel>Anomaly Detection</FormLabel>
              <FormDescription>
                Alert when spending deviates significantly from normal
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="notification_channels"
        render={() => (
          <FormItem>
            <FormLabel>Notification Channels</FormLabel>
            <div className="space-y-2">
              <CheckboxField label="Email" />
              <CheckboxField label="Slack" />
              <CheckboxField label="Discord" />
            </div>
          </FormItem>
        )}
      />
    </Form>
  )
}
```

**Deliverables:**
- ✅ Anomaly detection algorithm
- ✅ Email alerts via Resend
- ✅ Slack/Discord webhooks
- ✅ Alert configuration UI
- ✅ Alert history/log

---

## Phase 4: Billing & Launch (Weeks 9-10)

### Pricing Model

**Free Tier:**
- 1 cloud provider connection
- Basic dashboard
- Weekly reports
- 7 days data retention

**Pro Tier ($20/month):**
- Unlimited provider connections
- AI optimization suggestions
- Real-time alerts
- 90 days data retention
- Slack/Discord integration

**Team Tier ($50/month):**
- Everything in Pro
- Unlimited team members
- 1 year data retention
- Priority support
- Custom integrations

### Stripe Integration

```typescript
// File: app/api/stripe/checkout/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { priceId, organizationId } = await req.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { organizationId }
  })

  return Response.json({ url: session.url })
}
```

```typescript
// File: app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  switch (event.type) {
    case 'checkout.session.completed':
      await handleSubscriptionCreated(event.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object)
      break
  }

  return Response.json({ received: true })
}
```

### Launch Checklist

**Technical:**
- [ ] Production database with backups
- [ ] Monitoring (Axiom/DataDog)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (BetterStack)
- [ ] Rate limiting (Upstash)
- [ ] GDPR compliance (data export, deletion)
- [ ] Security audit (automated scans)

**Marketing:**
- [ ] Landing page with clear value prop
- [ ] Demo video (Loom, 2 minutes)
- [ ] Blog post: "How we reduced our AWS bill by 40%"
- [ ] HackerNews launch post
- [ ] ProductHunt launch
- [ ] Share on Twitter/LinkedIn
- [ ] Post in relevant subreddits (r/aws, r/devops)

**Deliverables:**
- ✅ Stripe billing fully integrated
- ✅ Production deployment
- ✅ Marketing site live
- ✅ First 10 beta users signed up

---

## Phase 5: Growth & Iteration (Weeks 11-12)

### Feature Additions Based on Feedback

**High-priority additions:**
1. **GCP Cost Integration**
2. **Vercel/Netlify integration**
3. **Budget forecasting** (predict end-of-month costs)
4. **Cost allocation tags** (tag resources by team/project)
5. **Shared dashboards** (public links)
6. **API access** for programmatic queries

### Growth Tactics

**Content Marketing:**
```markdown
Blog Post Ideas:
1. "How to reduce your AWS bill by 50% (with screenshots)"
2. "GitHub Actions is costing you more than you think"
3. "The hidden costs of serverless (and how to fix them)"
4. "Cloud cost optimization: A complete guide for 2025"
5. "How we built DevCost: Tech stack & architecture"
```

**Community Building:**
- Create Slack/Discord community
- Weekly "cost optimization tips" newsletter
- Open source the anomaly detection algorithm
- Run "cost optimization challenge" with prizes

**Partnerships:**
- Reach out to DevOps influencers for reviews
- Partner with cloud consulting firms
- Create affiliate program (20% commission)

---

## Tech Stack Summary

### Frontend
```
Framework: Next.js 14 (App Router)
Language: TypeScript
UI: shadcn/ui + Tailwind CSS
Charts: Recharts or Tremor
Auth: Clerk
State: TanStack Query + Zustand
Forms: React Hook Form + Zod
```

### Backend
```
API: Next.js API Routes + FastAPI (Python for heavy compute)
Database: PostgreSQL (Neon or Supabase)
ORM: Prisma (TypeScript) + SQLAlchemy (Python)
Queue: BullMQ + Redis
Cache: Redis (Upstash)
Jobs: Inngest or Trigger.dev
```

### Infrastructure
```
Hosting: Vercel (frontend) + Railway (backend)
Database: Neon (PostgreSQL)
Redis: Upstash
Storage: S3 or Cloudflare R2
Email: Resend
Monitoring: Axiom + Sentry
Uptime: BetterStack
Analytics: PostHog
```

### External APIs
```
AWS: Cost Explorer API, EC2, S3
GCP: Cloud Billing API
GitHub: REST API + GraphQL
Stripe: Payments API
OpenAI/Anthropic: AI suggestions
```

---

## Success Metrics (90-Day Target)

### User Metrics
- ✅ 50+ active users (free + paid)
- ✅ 5+ paying customers
- ✅ $100+ MRR (Monthly Recurring Revenue)
- ✅ 30%+ weekly active user rate
- ✅ <10% churn rate

### Technical Metrics
- ✅ 99.9% uptime
- ✅ <200ms p95 API latency
- ✅ <2% error rate
- ✅ <500ms page load time

### Business Metrics
- ✅ Featured on HackerNews front page
- ✅ Featured on ProductHunt
- ✅ 3+ blog posts published
- ✅ 500+ email subscribers
- ✅ 10+ customer testimonials

---

## Interview Talking Points

After building this, you can say:

✅ **"I built a B2B SaaS with 50+ users and $100+ MRR in 90 days"**
✅ **"Implemented multi-tenant architecture with row-level security"**
✅ **"Built AI-powered optimization engine that saved users 40% on average"**
✅ **"Integrated with 4 cloud providers (AWS, GCP, GitHub, Vercel)"**
✅ **"Handled async processing of 100K+ cost data points daily"**
✅ **"Achieved 99.9% uptime with comprehensive monitoring"**
✅ **"Implemented anomaly detection using statistical analysis"**
✅ **"Built Stripe subscription billing from scratch"**
✅ **"Launched on HackerNews and ProductHunt successfully"**
✅ **"Revenue growing 20% month-over-month"**

---

## Repository Structure

```
devcost/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── settings/
│   │   │   ├── api/
│   │   │   └── (marketing)/
│   │   └── components/
│   └── api/                    # FastAPI backend (Python)
│       ├── services/
│       ├── models/
│       └── routes/
├── packages/
│   ├── database/              # Prisma schema
│   ├── ui/                    # Shared UI components
│   └── types/                 # Shared TypeScript types
├── infrastructure/
│   ├── terraform/             # IaC for production
│   └── docker/                # Local development
└── docs/
    ├── api/                   # API documentation
    ├── architecture/          # ADRs
    └── guides/                # User guides
```

---

## Next Steps

1. **Set up repository**: Initialize monorepo with Turborepo
2. **Design database schema**: Start with ERD diagram
3. **Build MVP dashboard**: Week 1-2 sprint
4. **Launch beta**: Get first 10 users for feedback
5. **Iterate**: Weekly releases based on user feedback

**Ready to start building?** Let me know which phase you want to dive deeper into!

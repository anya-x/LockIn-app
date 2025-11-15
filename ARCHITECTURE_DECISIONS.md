# Architecture Decision Records (ADR)

This document records the major architectural decisions made during the development of the LockIn productivity application. Each decision includes context, alternatives considered, and rationale.

---

## Table of Contents

1. [ADR-001: PostgreSQL Over MongoDB](#adr-001-postgresql-over-mongodb)
2. [ADR-002: Spring Boot Over Node.js](#adr-002-spring-boot-over-nodejs)
3. [ADR-003: ECS Fargate Over Kubernetes (EKS)](#adr-003-ecs-fargate-over-kubernetes-eks)
4. [ADR-004: Prometheus/Grafana Over Datadog](#adr-004-prometheusgrafana-over-datadog)
5. [ADR-005: GitHub Actions Over Jenkins](#adr-005-github-actions-over-jenkins)
6. [ADR-006: Terraform Over CloudFormation](#adr-006-terraform-over-cloudformation)
7. [ADR-007: In-Memory Caching Over Redis](#adr-007-in-memory-caching-over-redis)
8. [ADR-008: Single Region Over Multi-Region](#adr-008-single-region-over-multi-region)
9. [ADR-009: Application Load Balancer Over API Gateway](#adr-009-application-load-balancer-over-api-gateway)
10. [ADR-010: RDS PostgreSQL Over Aurora](#adr-010-rds-postgresql-over-aurora)
11. [ADR-011: Monolith Over Microservices](#adr-011-monolith-over-microservices)
12. [ADR-012: Rolling Deployments Over Blue/Green](#adr-012-rolling-deployments-over-bluegreen)
13. [ADR-013: No CDN (CloudFront)](#adr-013-no-cdn-cloudfront)
14. [ADR-014: No Service Mesh](#adr-014-no-service-mesh)
15. [ADR-015: Manual Secrets Management Over Automated Rotation](#adr-015-manual-secrets-management-over-automated-rotation)

---

## ADR-001: PostgreSQL Over MongoDB

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need to store user data, tasks, goals, categories, and relationships
- Data has clear relationships (users → tasks → categories)
- Need ACID guarantees for task completion, streak tracking
- Need complex queries for analytics and Eisenhower Matrix

**Decision:**
Use PostgreSQL as the primary database.

**Alternatives Considered:**

1. **MongoDB (NoSQL)**
   - ❌ Weaker consistency guarantees
   - ❌ More complex relationship queries
   - ✅ Better for unstructured data (not our use case)
   - ✅ Easier horizontal scaling (not needed yet)

2. **MySQL**
   - ✅ Mature and stable
   - ❌ Weaker JSON support
   - ❌ Less advanced features than PostgreSQL

3. **DynamoDB**
   - ✅ Fully managed, serverless
   - ❌ Higher cost for our access patterns
   - ❌ Complex queries are difficult
   - ❌ Harder to model relationships

**Consequences:**

**Positive:**
- ✅ ACID transactions ensure data consistency
- ✅ Excellent support for relationships (foreign keys, joins)
- ✅ Advanced features: JSON columns, full-text search, window functions
- ✅ Strong community and tooling
- ✅ Great JPA/Hibernate integration with Spring Boot
- ✅ Easy to reason about and debug

**Negative:**
- ⚠️ Vertical scaling only (acceptable for current scale)
- ⚠️ Requires managed backups (handled by RDS)
- ⚠️ Higher memory footprint than MySQL

**When to Revisit:**
- If we need to scale beyond 100K concurrent users
- If data becomes predominantly unstructured
- If we need multi-region active-active writes

---

## ADR-002: Spring Boot Over Node.js

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Building a RESTful API backend
- Need strong typing and compile-time safety
- Team has Java experience
- Need robust ecosystem for enterprise features

**Decision:**
Use Spring Boot (Java 17) as the backend framework.

**Alternatives Considered:**

1. **Node.js + Express**
   - ✅ Faster initial development
   - ✅ JavaScript full-stack
   - ❌ Weaker typing (even with TypeScript)
   - ❌ Less mature ecosystem for enterprise features
   - ❌ More difficult dependency management

2. **Django (Python)**
   - ✅ Excellent for rapid development
   - ✅ Strong ORM
   - ❌ Slower runtime performance
   - ❌ Weaker async support
   - ❌ Less suitable for high-concurrency

3. **Go**
   - ✅ Excellent performance
   - ✅ Simple deployment (single binary)
   - ❌ Less mature ecosystem
   - ❌ Smaller talent pool
   - ❌ Simpler type system

**Consequences:**

**Positive:**
- ✅ Strong typing catches errors at compile time
- ✅ Excellent Spring ecosystem (Security, Data JPA, Actuator)
- ✅ Built-in dependency injection
- ✅ Mature monitoring and observability (Micrometer)
- ✅ Great testing support (JUnit, Mockito)
- ✅ Industry-standard for enterprise applications

**Negative:**
- ⚠️ Larger memory footprint (~512MB minimum)
- ⚠️ Slower startup time than Go/Node.js
- ⚠️ More verbose than scripting languages
- ⚠️ Larger Docker images (mitigated with multi-stage builds)

**When to Revisit:**
- If startup time becomes critical (serverless use case)
- If memory cost becomes prohibitive
- If we need massive concurrency (>10K concurrent connections)

---

## ADR-003: ECS Fargate Over Kubernetes (EKS)

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need container orchestration for the Spring Boot application
- Want auto-scaling and high availability
- Limited DevOps resources (portfolio project)
- Cost is a concern

**Decision:**
Use AWS ECS Fargate for container orchestration.

**Alternatives Considered:**

1. **Amazon EKS (Kubernetes)**
   - ✅ Industry standard, portable across clouds
   - ✅ Rich ecosystem (Helm, operators)
   - ❌ Complex to set up and maintain
   - ❌ Higher cost (~$73/month for control plane alone)
   - ❌ Overkill for single application

2. **EC2 + Docker Compose**
   - ✅ Simple and cheap
   - ❌ Manual scaling
   - ❌ No high availability out of the box
   - ❌ More operational overhead

3. **AWS Lambda**
   - ✅ True serverless, pay per use
   - ❌ Cold start latency
   - ❌ 15-minute execution limit
   - ❌ Difficult with Spring Boot (large package)

**Consequences:**

**Positive:**
- ✅ Serverless containers (no EC2 to manage)
- ✅ Automatic scaling built-in
- ✅ Integrates seamlessly with ALB, CloudWatch
- ✅ Lower cost than EKS (~$30/month vs $100+/month)
- ✅ Simpler operational model
- ✅ Native AWS integration (IAM, Secrets Manager, ECR)

**Negative:**
- ⚠️ Vendor lock-in (AWS-specific)
- ⚠️ Less flexible than Kubernetes
- ⚠️ Fewer third-party tools
- ⚠️ Higher cost than self-managed EC2 (but better operational efficiency)

**When to Revisit:**
- If we need to support multi-cloud
- If we need advanced Kubernetes features (custom schedulers, operators)
- If we have >100 services (microservices architecture)
- If we need more control over networking (service mesh)

---

## ADR-004: Prometheus/Grafana Over Datadog

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need observability: metrics, dashboards, alerting
- Want to demonstrate monitoring in portfolio
- Cost is a constraint
- Need to track custom application metrics

**Decision:**
Use Prometheus for metrics collection and Grafana for visualization.

**Alternatives Considered:**

1. **Datadog**
   - ✅ All-in-one solution (metrics, logs, traces, APM)
   - ✅ Beautiful UI and dashboards
   - ✅ Powerful alerting and integrations
   - ❌ Expensive ($15-31/host/month minimum)
   - ❌ Vendor lock-in

2. **New Relic**
   - ✅ Comprehensive APM features
   - ✅ Good free tier
   - ❌ Still costly at scale
   - ❌ Proprietary query language

3. **CloudWatch Only**
   - ✅ Native AWS integration
   - ✅ Low cost
   - ❌ Limited custom metrics without extra cost
   - ❌ Less powerful dashboards
   - ❌ Steeper learning curve for custom metrics

**Consequences:**

**Positive:**
- ✅ Free and open-source
- ✅ Industry-standard (used by many companies)
- ✅ Full control over data
- ✅ Powerful query language (PromQL)
- ✅ Easy integration with Spring Boot (Micrometer)
- ✅ Great for learning and portfolio

**Negative:**
- ⚠️ Need to host Prometheus and Grafana (added complexity)
- ⚠️ No distributed tracing out of the box
- ⚠️ More setup compared to SaaS solutions
- ⚠️ Need to manage retention and storage

**When to Revisit:**
- If we need distributed tracing urgently
- If operational overhead becomes too high
- If we need advanced APM features
- If budget allows for Datadog/New Relic (~$500+/month)

---

## ADR-005: GitHub Actions Over Jenkins

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need CI/CD pipeline for automated testing and deployment
- Code already hosted on GitHub
- Want minimal infrastructure to maintain
- Need secure AWS authentication

**Decision:**
Use GitHub Actions for CI/CD pipeline.

**Alternatives Considered:**

1. **Jenkins**
   - ✅ Highly flexible and customizable
   - ✅ Massive plugin ecosystem
   - ❌ Need to host and maintain Jenkins server
   - ❌ More complex security setup
   - ❌ Slower to get started

2. **GitLab CI**
   - ✅ Integrated with GitLab
   - ✅ Good free tier
   - ❌ Would require migrating from GitHub
   - ❌ Less familiar ecosystem

3. **AWS CodePipeline**
   - ✅ Native AWS integration
   - ❌ More expensive
   - ❌ Less flexible
   - ❌ Harder to test locally

**Consequences:**

**Positive:**
- ✅ Integrated with GitHub repository
- ✅ 2,000 free minutes/month for private repos
- ✅ OIDC authentication with AWS (no stored credentials)
- ✅ Matrix builds for parallel testing
- ✅ Rich marketplace of actions
- ✅ Easy to get started with YAML config
- ✅ Built-in secret management

**Negative:**
- ⚠️ Vendor lock-in to GitHub
- ⚠️ Limited to 2,000 minutes/month (free tier)
- ⚠️ Less flexible than Jenkins for complex workflows
- ⚠️ Debugging can be harder (no local shell access)

**When to Revisit:**
- If we exceed free tier limits consistently
- If we need very complex build pipelines
- If we need to migrate away from GitHub
- If we need on-premise CI/CD

---

## ADR-006: Terraform Over CloudFormation

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need Infrastructure as Code for AWS resources
- Want to track infrastructure changes in Git
- May support multiple cloud providers in future
- Want strong community and tooling

**Decision:**
Use Terraform for infrastructure provisioning.

**Alternatives Considered:**

1. **AWS CloudFormation**
   - ✅ Native AWS integration
   - ✅ No additional tools needed
   - ❌ AWS-only (vendor lock-in)
   - ❌ More verbose YAML/JSON
   - ❌ Weaker module ecosystem

2. **AWS CDK**
   - ✅ Use programming languages (TypeScript, Python)
   - ✅ Type safety
   - ❌ Generates CloudFormation (still AWS-only)
   - ❌ Steeper learning curve
   - ❌ Less mature

3. **Pulumi**
   - ✅ Use programming languages
   - ✅ Multi-cloud
   - ❌ Smaller community
   - ❌ SaaS backend by default

**Consequences:**

**Positive:**
- ✅ Multi-cloud support (portable)
- ✅ HCL is readable and concise
- ✅ Massive community and module ecosystem
- ✅ Strong state management
- ✅ Good plan/apply workflow
- ✅ Excellent documentation
- ✅ Industry standard for IaC

**Negative:**
- ⚠️ Need to manage Terraform state (S3 backend)
- ⚠️ Some AWS features lag behind CloudFormation
- ⚠️ State file can get out of sync
- ⚠️ Need to learn HCL syntax

**When to Revisit:**
- If we go all-in on AWS and need latest features immediately
- If we want type safety in infrastructure code (consider CDK)
- If state management becomes too complex

---

## ADR-007: In-Memory Caching Over Redis

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Some database queries are repeated frequently (user tasks, categories)
- Want to reduce database load
- Currently running single ECS task
- Cost optimization is important

**Decision:**
Use in-memory caching (no distributed cache).

**Alternatives Considered:**

1. **Redis (ElastiCache)**
   - ✅ Distributed cache (works with multiple instances)
   - ✅ Persistence options
   - ✅ Pub/sub capabilities
   - ❌ Additional cost ($15-50/month)
   - ❌ Adds complexity (network calls, serialization)
   - ❌ Overkill for single instance

2. **Memcached**
   - ✅ Simple and fast
   - ❌ Same cost and complexity issues as Redis
   - ❌ Fewer features than Redis

3. **No Caching**
   - ✅ Simplest approach
   - ❌ Higher database load
   - ❌ Slower response times

**Decision Details:**
- Use Caffeine for in-memory caching
- Cache user tasks, categories, user profiles
- 10-minute TTL for most cached data
- Invalidate on updates

**Consequences:**

**Positive:**
- ✅ Zero additional cost
- ✅ Extremely fast (in-process, no network)
- ✅ Simple to implement and reason about
- ✅ No serialization overhead
- ✅ Automatic memory management
- ✅ Sufficient for current scale

**Negative:**
- ⚠️ Cache not shared across ECS tasks
- ⚠️ Cache lost on deployment
- ⚠️ Memory usage in application process
- ⚠️ No persistence

**When to Revisit:**
- When running >2 ECS tasks concurrently
- When cache inconsistency across instances becomes a problem
- When we need cache persistence
- When we need pub/sub for real-time features
- When memory usage becomes constrained

**Migration Path:**
```java
// Current: Caffeine
@Cacheable("tasks")

// Future: Redis (if needed)
@Cacheable(value = "tasks", cacheManager = "redisCacheManager")
```

---

## ADR-008: Single Region Over Multi-Region

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Application will be used primarily by users in North America
- Cost needs to be optimized for portfolio project
- No regulatory requirements for data residency
- High availability needed within region

**Decision:**
Deploy to single AWS region (us-east-1).

**Alternatives Considered:**

1. **Multi-Region Active-Active**
   - ✅ Lowest latency globally
   - ✅ Disaster recovery across regions
   - ❌ 2-3x infrastructure cost
   - ❌ Complex data synchronization
   - ❌ No users requiring this

2. **Multi-Region Active-Passive**
   - ✅ Disaster recovery capability
   - ❌ Still doubles cost
   - ❌ Complex failover process
   - ❌ Unnecessary for portfolio

3. **Multi-AZ within Region**
   - ✅ High availability
   - ✅ Reasonable cost
   - ✅ Automatic failover
   - ✅ **This is what we chose**

**Consequences:**

**Positive:**
- ✅ Lower cost (~$93/month vs $200+/month)
- ✅ Simpler architecture
- ✅ No cross-region data sync complexity
- ✅ Still highly available (Multi-AZ)
- ✅ Easier to reason about and debug

**Negative:**
- ⚠️ Higher latency for users outside North America
- ⚠️ No protection against region-wide outages
- ⚠️ Single point of failure (entire region)

**Mitigation:**
- Use Multi-AZ for RDS (automatic failover)
- Deploy ECS tasks across multiple AZs
- CloudWatch alarms for regional health

**When to Revisit:**
- When >30% of users are >100ms away from us-east-1
- When we have regulatory requirements for specific regions
- When downtime SLA requires <99.99% (region failover)
- When budget supports 2-3x cost increase

**Note:** AWS us-east-1 has 99.99% uptime SLA. For portfolio/MVP, this is more than sufficient.

---

## ADR-009: Application Load Balancer Over API Gateway

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need to route HTTP traffic to ECS containers
- Want health checks and automatic failover
- Need SSL/TLS termination
- Cost-effective solution needed

**Decision:**
Use Application Load Balancer (ALB) for traffic routing.

**Alternatives Considered:**

1. **API Gateway + Lambda**
   - ✅ True serverless (pay per request)
   - ✅ Built-in throttling and caching
   - ❌ Cold start latency
   - ❌ Difficult with Spring Boot
   - ❌ 29-second timeout limit
   - ❌ More expensive at steady load

2. **Network Load Balancer (NLB)**
   - ✅ Lower latency (Layer 4)
   - ✅ Better for extreme throughput
   - ❌ No HTTP routing features
   - ❌ No built-in WAF support
   - ❌ Overkill for HTTP API

3. **CloudFront + API Gateway**
   - ✅ Global CDN
   - ✅ DDoS protection
   - ❌ Additional cost
   - ❌ Adds complexity
   - ❌ Not needed for API

**Consequences:**

**Positive:**
- ✅ Layer 7 routing (path-based, host-based)
- ✅ Native ECS integration
- ✅ Health checks with automatic de-registration
- ✅ SSL/TLS termination with ACM
- ✅ WebSocket support
- ✅ Connection draining
- ✅ Fixed cost (~$16/month)

**Negative:**
- ⚠️ Fixed cost regardless of traffic
- ⚠️ Not serverless (always running)
- ⚠️ Single region only

**When to Revisit:**
- If we go truly serverless (Lambda)
- If we need global CDN distribution
- If traffic is very sporadic (API Gateway cheaper)
- If we need advanced API management features

---

## ADR-010: RDS PostgreSQL Over Aurora

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need managed PostgreSQL database
- Want automatic backups and Multi-AZ
- Cost optimization important
- Don't need extreme scalability

**Decision:**
Use Amazon RDS PostgreSQL (not Aurora).

**Alternatives Considered:**

1. **Aurora PostgreSQL**
   - ✅ Better performance at scale
   - ✅ Better for read-heavy workloads (read replicas)
   - ✅ Faster failover
   - ❌ 2-3x more expensive
   - ❌ Minimum cost ~$45/month vs $15/month
   - ❌ Overkill for current scale

2. **Self-Hosted PostgreSQL on EC2**
   - ✅ Cheapest option
   - ❌ Need to manage backups
   - ❌ Need to handle failover
   - ❌ More operational overhead

3. **Aurora Serverless**
   - ✅ Pay per use
   - ✅ Auto-scaling
   - ❌ Still more expensive for steady load
   - ❌ Cold start issues

**Consequences:**

**Positive:**
- ✅ Much cheaper than Aurora ($15 vs $45/month)
- ✅ Automatic backups and point-in-time recovery
- ✅ Multi-AZ for high availability
- ✅ Performance Insights available
- ✅ Easy to upgrade to Aurora later
- ✅ Sufficient for current scale

**Negative:**
- ⚠️ Slower failover than Aurora (1-2 min vs 30 sec)
- ⚠️ Manual read replica setup
- ⚠️ Storage limited to 64TB
- ⚠️ Less optimized for cloud

**When to Revisit:**
- When database size exceeds 1TB
- When we need >5 read replicas
- When failover time is critical (<30 seconds)
- When query performance requires Aurora optimizations
- When we have >10,000 concurrent connections

**Migration Path:** RDS to Aurora is a straightforward upgrade with minimal downtime.

---

## ADR-011: Monolith Over Microservices

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Building productivity application with related features
- Single team (portfolio project)
- Want fast development and deployment
- Need to minimize operational complexity

**Decision:**
Build as a well-structured monolith, not microservices.

**Alternatives Considered:**

1. **Microservices**
   - ✅ Independent scalability
   - ✅ Technology flexibility per service
   - ✅ Isolation of failures
   - ❌ Much higher complexity
   - ❌ Need service discovery, API gateway
   - ❌ Distributed tracing required
   - ❌ Harder to develop and test locally
   - ❌ More expensive to run

2. **Serverless Functions (Lambda)**
   - ✅ Auto-scaling
   - ✅ Pay per use
   - ❌ Cold starts
   - ❌ Distributed state management
   - ❌ Harder to debug

**Decision Details:**
- Single Spring Boot application
- Well-organized packages (controller, service, repository layers)
- Clear module boundaries (task, user, analytics, etc.)
- Can extract to microservices later if needed

**Consequences:**

**Positive:**
- ✅ Faster development (no inter-service communication)
- ✅ Easier to test (no mocking of external services)
- ✅ Single deployment unit (simpler CI/CD)
- ✅ No distributed tracing needed
- ✅ ACID transactions work normally
- ✅ Lower cost (one application to run)
- ✅ Easier to reason about and debug

**Negative:**
- ⚠️ All components scale together
- ⚠️ Single language/framework (Java/Spring)
- ⚠️ Larger Docker image
- ⚠️ Deployment affects entire application

**Mitigation:**
- Use clear package structure for future extraction
- Keep services loosely coupled
- Use interfaces for abstraction

**When to Revisit:**
- When different components have vastly different scaling needs
- When we have multiple teams working on different areas
- When deployment coordination becomes a bottleneck
- When application exceeds 100K lines of code
- When we need to use different tech stacks

**Quote:** "You don't start with microservices. You migrate to them when the pain of the monolith exceeds the pain of distribution." - Martin Fowler (paraphrased)

---

## ADR-012: Rolling Deployments Over Blue/Green

**Status:** ✅ Accepted

**Date:** 2025-11-15

**Context:**
- Need zero-downtime deployments
- Want to minimize resource usage
- ECS service updates needed
- Cost optimization important

**Decision:**
Use ECS rolling deployments with health checks.

**Alternatives Considered:**

1. **Blue/Green Deployment**
   - ✅ Instant rollback
   - ✅ Full testing before switch
   - ❌ Requires 2x resources during deployment
   - ❌ More complex setup
   - ❌ Higher cost

2. **Canary Deployment**
   - ✅ Gradual rollout
   - ✅ Early issue detection
   - ❌ More complex (need weighted routing)
   - ❌ Longer deployment time
   - ❌ Additional monitoring needed

3. **Recreate (Stop Old, Start New)**
   - ✅ Simplest approach
   - ❌ Downtime during deployment
   - ❌ Not acceptable for production

**Decision Details:**
- ECS rolling update: 100% minimum healthy, 200% maximum
- Health check grace period: 60 seconds
- Automatic rollback on health check failure
- CircuitBreaker deployment configuration

**Consequences:**

**Positive:**
- ✅ Zero-downtime deployments
- ✅ No extra resources needed
- ✅ Automatic rollback on failure
- ✅ Built into ECS (no extra setup)
- ✅ Cost-effective

**Negative:**
- ⚠️ Slower rollback than blue/green
- ⚠️ Brief period with mixed versions
- ⚠️ Need to handle database migrations carefully

**Best Practices:**
```
1. Make database migrations backward compatible
2. Use feature flags for breaking changes
3. Monitor error rates during deployment
4. Set appropriate health check timeouts
```

**When to Revisit:**
- When instant rollback is critical
- When we want to test with production traffic before full rollout
- When database migrations can't be backward compatible
- When we need A/B testing capabilities

---

## ADR-013: No CDN (CloudFront)

**Status:** ❌ Rejected (for now)

**Date:** 2025-11-15

**Context:**
- Application is primarily a REST API
- No static assets to serve (no frontend SPA)
- Users concentrated in North America
- Cost optimization needed

**Decision:**
Do NOT use CloudFront CDN.

**Why CloudFront Was Considered:**

1. **Potential Benefits:**
   - Lower latency globally
   - DDoS protection (AWS Shield)
   - SSL/TLS termination
   - Caching of API responses

2. **Why We Rejected:**
   - ❌ API responses are user-specific (not cacheable)
   - ❌ Additional cost (~$10/month minimum)
   - ❌ No global user base to justify it
   - ❌ ALB already provides SSL/TLS
   - ❌ Adds complexity to debugging

**Current Approach:**
- ALB directly serves API traffic
- SSL/TLS at ALB level
- No caching (dynamic responses)

**Consequences:**

**Positive (of NOT using CDN):**
- ✅ Lower cost
- ✅ Simpler architecture
- ✅ Easier debugging (fewer hops)
- ✅ No cache invalidation concerns

**Negative (of NOT using CDN):**
- ⚠️ No global edge caching
- ⚠️ Higher latency for distant users
- ⚠️ No DDoS protection at edge

**When to Revisit:**
- When we add a frontend SPA with static assets
- When >30% of users are outside North America
- When we experience DDoS attacks
- When we have cacheable API responses
- When we need WebSocket connections at edge

**Future Implementation:**
```terraform
# If we add frontend
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_domain_name
    origin_id   = "frontend-s3"
  }

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
  }
}
```

---

## ADR-014: No Service Mesh

**Status:** ❌ Rejected

**Date:** 2025-11-15

**Context:**
- Single monolithic application
- No inter-service communication
- Cost and complexity are concerns

**Decision:**
Do NOT implement a service mesh (Istio, Linkerd, AWS App Mesh).

**What Service Mesh Provides:**

1. **Traffic Management:**
   - Retry logic
   - Circuit breaking
   - Load balancing

2. **Security:**
   - Mutual TLS between services
   - Service-to-service authentication

3. **Observability:**
   - Distributed tracing
   - Service metrics

**Why We Don't Need It:**

- ❌ Single application (no inter-service communication)
- ❌ No microservices to communicate
- ❌ Adds significant complexity
- ❌ Higher resource usage (sidecar containers)
- ❌ Steeper learning curve

**Current Approach:**
- Single application with direct database access
- Security at network level (security groups)
- Observability via Prometheus/Grafana

**Consequences:**

**Positive (of NOT using service mesh):**
- ✅ Much simpler architecture
- ✅ Lower resource usage
- ✅ Faster request latency (no sidecar overhead)
- ✅ Easier to debug

**Negative (of NOT using service mesh):**
- ⚠️ No automatic retry/circuit breaker (can implement in code)
- ⚠️ No mutual TLS between services (N/A - single service)

**When to Revisit:**
- When we migrate to microservices
- When we have >5 services communicating
- When we need advanced traffic management
- When we need zero-trust networking
- When we need automatic distributed tracing

**Note:** Service mesh is powerful but only valuable with microservices.

---

## ADR-015: Manual Secrets Management Over Automated Rotation

**Status:** ✅ Accepted (with caveats)

**Date:** 2025-11-15

**Context:**
- Need to manage database passwords, JWT secrets, OAuth credentials
- Want to balance security with operational complexity
- Portfolio project with limited operational overhead

**Decision:**
Use AWS Secrets Manager for storage, but manual rotation.

**Alternatives Considered:**

1. **Automated Secret Rotation (AWS Secrets Manager)**
   - ✅ Best security practice
   - ✅ Reduces human error
   - ❌ More complex to set up
   - ❌ Requires Lambda functions
   - ❌ Can cause outages if misconfigured

2. **Environment Variables Only**
   - ✅ Simplest approach
   - ❌ Secrets visible in ECS console
   - ❌ Harder to rotate
   - ❌ Poor security practice

3. **HashiCorp Vault**
   - ✅ Advanced features
   - ✅ Dynamic secrets
   - ❌ Need to host Vault
   - ❌ Additional cost
   - ❌ Overkill for our needs

**Current Approach:**
```yaml
# Secrets stored in AWS Secrets Manager
secrets:
  - name: DB_PASSWORD
    valueFrom: arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password

# Manual rotation process documented
# Rotation schedule: Every 90 days
```

**Consequences:**

**Positive:**
- ✅ Secrets encrypted at rest
- ✅ Secrets not in code or logs
- ✅ Easy to update (update secret, redeploy)
- ✅ Audit trail in CloudTrail
- ✅ Simpler than automated rotation

**Negative:**
- ⚠️ Requires manual rotation
- ⚠️ Can forget to rotate
- ⚠️ Brief downtime during rotation

**Rotation Schedule:**
- **Production:** Every 90 days
- **Staging:** Every 180 days
- **Development:** Annually or when compromised

**When to Revisit:**
- When we have compliance requirements (SOC 2, PCI-DSS)
- When we have >10 services with secrets
- When we need short-lived credentials
- When we have dedicated security team

**Migration Path:**
```python
# Future: Automated rotation with Lambda
def rotate_secret(event, context):
    # Get old secret
    # Create new database user with new password
    # Update secret
    # Test new credentials
    # Delete old database user
    pass
```

---

## Summary Table

| Decision | Status | Primary Reason | Cost Impact | When to Revisit |
|----------|--------|----------------|-------------|-----------------|
| PostgreSQL over MongoDB | ✅ Accepted | Relationships + ACID | $0 | >100K users |
| Spring Boot over Node.js | ✅ Accepted | Type safety + ecosystem | $0 | Serverless needed |
| ECS Fargate over EKS | ✅ Accepted | Simplicity + cost | Saves ~$70/mo | Multi-cloud needed |
| Prometheus over Datadog | ✅ Accepted | Cost (free vs $31/mo) | Saves ~$31/mo | Need APM features |
| GitHub Actions over Jenkins | ✅ Accepted | Integration + OIDC | $0 | >2000 min/month |
| Terraform over CloudFormation | ✅ Accepted | Multi-cloud | $0 | All-in on AWS |
| In-memory over Redis | ✅ Accepted | Single instance | Saves ~$20/mo | >2 instances |
| Single region over multi-region | ✅ Accepted | Cost + simplicity | Saves ~$100/mo | >30% users distant |
| ALB over API Gateway | ✅ Accepted | ECS integration | $0 | Go serverless |
| RDS over Aurora | ✅ Accepted | Cost ($15 vs $45/mo) | Saves ~$30/mo | Need scale/speed |
| Monolith over microservices | ✅ Accepted | Simplicity | Saves ~$200/mo | Multiple teams |
| Rolling over blue/green | ✅ Accepted | Cost (no 2x resources) | Saves variable | Need instant rollback |
| No CDN | ❌ Rejected | API-only, no static assets | Saves ~$10/mo | Add frontend SPA |
| No service mesh | ❌ Rejected | Single application | Saves ~$50/mo | Move to microservices |
| Manual secret rotation | ✅ Accepted | Simplicity vs automation | $0 | Compliance needed |

**Total Monthly Savings from Pragmatic Decisions: ~$500/month** 💰

---

## Lessons Learned

### 1. **Start Simple, Scale When Needed**
We avoided premature optimization by:
- Single region instead of multi-region
- Monolith instead of microservices
- In-memory cache instead of Redis
- RDS instead of Aurora

**Result:** ~$100/month instead of $500+/month

### 2. **Choose Based on Actual Requirements**
We asked:
- Do we have >1 instance? → No Redis needed
- Do we have microservices? → No service mesh needed
- Do we have global users? → No CDN needed

**Result:** Avoided over-engineering

### 3. **Optimize for Operational Simplicity**
- ECS Fargate vs EKS: Saved weeks of learning Kubernetes
- GitHub Actions vs Jenkins: No server to maintain
- Managed services: RDS, ECR, CloudWatch

**Result:** Focus on application, not infrastructure

### 4. **Use Industry Standards**
- Terraform (not proprietary IaC)
- PostgreSQL (not niche database)
- Spring Boot (not experimental framework)

**Result:** Easier hiring, better community support

### 5. **Document the "Why"**
This ADR document itself demonstrates:
- Considered alternatives
- Made conscious decisions
- Can articulate tradeoffs
- Know when to revisit

**Result:** Shows senior-level thinking

---

## Interview Talking Points

When discussing this project, emphasize:

✅ **"I made deliberate architectural choices based on requirements"**
- Not just using buzzwords
- Considered alternatives
- Optimized for actual needs

✅ **"I avoided premature optimization"**
- Didn't add Redis when in-memory cache works
- Didn't use microservices for a single app
- Didn't go multi-region without global users

✅ **"I understand when to scale"**
- Documented when to revisit decisions
- Know migration paths
- Can explain tradeoffs

✅ **"I balance cost and features"**
- Saved ~$400/month with pragmatic choices
- Still production-ready
- Can scale when needed

---

## Conclusion

This ADR demonstrates **senior-level engineering judgment**: not just building features, but making conscious architectural decisions with clear rationale, understanding tradeoffs, and knowing when to revisit.

**Key Principle:** *Use the simplest thing that works, but make it easy to upgrade when needed.*

---

*Last updated: 2025-11-15*
*Living document - update as architecture evolves*

# Daily Analytics algorithm: a guide to my research

---

## Table of Contents

1. [Productivity Score Algorithm](#1-productivity-score-algorithm)
2. [Focus Score Algorithm](#2-focus-score-algorithm)
3. [Burnout Risk Detection](#3-burnout-risk-detection)
4. [Task Completion Rate](#4-task-completion-rate)
5. [Eisenhower Matrix Distribution](#5-eisenhower-matrix-distribution)
6. [Consecutive Work Days Calculation](#6-consecutive-work-days-calculation)
7. [Weekly Productivity Trends](#7-weekly-productivity-trends)
8. [Research References](#research-references)

---

## 1. Productivity Score Algorithm

### Research Foundation

**Research:** Newport, C. (2016). _Deep Work: Rules for Focused Success in a Distracted World_. Grand Central Publishing.

**Key takeaway:** Cognitive performance is optimised at 3-4 hours of deep uninterrupted work per day. Quality diminishes due to mental fatigue after.

**Supporting Research:**

- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). "The role of deliberate practice in the acquisition of expert performance." _Psychological Review_
  - elite performers across domains consistently practice 3-5 hours daily
  - quality degrades significantly beyond 4-hour threshold

```
ProductivityScore = (TaskCompletionScore × 0.4) + (FocusTimeScore × 0.6)

where:
- TaskCompletionScore = task completion rate (0-100%)
- FocusTimeScore = focus focus time score (0-100)
```

## 2. Focus Score Algorithm

### Research Foundation

**Research:** Newport, C. (2016). _Deep Work_
**Key takeaway:** 4 hours is optimal for sustained cognitive performance

**Supporting Research:**

- Cirillo, F. (2006). _The Pomodoro Technique_. Francesco Cirillo.
  - 25-minute work intervals with 5-minute breaks
  - 4-6 cycles optimal before extended break needed
- Kleitman, N. (1963). _Sleep and Wakefulness_.
  - ultradian rhythms: 90-120 minute cycles of alertness
  - natural performance peaks and troughs throughout day

```
OPTIMAL_FOCUS = 240 minutes (4 hours)
MAX_HEALTHY = 360 minutes (6 hours)

FocusScore(m) = {
    (m / OPTIMAL_FOCUS) × 100                           if m ≤ 240
    100 - ((m - OPTIMAL_FOCUS) / (MAX_HEALTHY - OPTIMAL_FOCUS)) × 20    if 240 < m ≤ 360
    80 - ((m - MAX_HEALTHY) / 60) × 20                 if m > 360
}

Where:
- m = focus minutes worked
- score peaks at 100 when m = 240
- penalty for overwork (240 < m ≤ 360)
- steeper penalty for excessive work (m > 360)
```

## 3. Burnout Risk Detection

### Research Foundation

**Research:** Maslach, C., & Jackson, S. E. (1981). "The measurement of experienced burnout." _Journal of Organizational Behavior_

**Key takeaway:**
**Maslach Burnout Inventory (MBI) Dimensions:**

1. Emotional Exhaustion (feeling emotionally depleted)
2. Depersonalisation (lower empathy or interest for work/clients)
3. Reduced sense of personal accomplishment at work

**Translation into measurable behaviours**

| MBI Dimension        | Digital Proxy                    | Measurement                          |
| -------------------- | -------------------------------- | ------------------------------------ |
| Emotional Exhaustion | Work duration exceeding capacity | Overwork minutes (>6 hours)          |
| Depersonalisation    | Working at unhealthy times       | Late-night sessions (after 10 PM)    |
| Low Accomplishment   | Unsustainable pace               | Consecutive work days without breaks |

```
BurnoutRisk = OverworkRisk + LateNightRisk + ConsecutiveDaysRisk

Where:
OverworkRisk = (overworkMinutes / 60) × 20        // 20 points per hour over 6
LateNightRisk = lateNightSessions × 15            // 15 points per session
ConsecutiveDaysRisk = consecutiveWorkDays × 5     // 5 points per day

Final Score: min(100, BurnoutRisk)
```

### Supporting research

**1. Overwork Threshold (6 hours):**

- Newport (2016): 4 hours optimal, 6 hours maximum before quality collapse
- European Working Time Directive: recommends breaks after 6 hours
- Ericsson et al. (1993): elite performers limit deliberate practice to 4-5 hours

**2. Late Night Work Penalty:**

- Akerstedt, T., & Wright, K. P. (2009). "Sleep loss and fatigue in shift work and shift work disorder." _Sleep Medicine Clinics_
  - circadian disruption increases cortisol
  - work after 10 PM disrupts sleep architecture
  - recovery takes 2-3 days per disrupted night

**3. Consecutive Days Without Rest:**

- Sonnentag, S., & Fritz, C. (2007). "The Recovery Experience Questionnaire." _Journal of Occupational Health Psychology_
  - psychological detachment crucial for recovery
  - 7+ consecutive days → significant fatigue accumulation
  - weekend breaks essential for sustained performance

### Interpretation of the results

- 0-20 → low risk → healthy work patterns → maintain current flow
- 21-40 → moderate risj → some concerning patterns → review flow
- 41-60 → elevated risk → multiple risk factors → plan recovery
- 61-80 → high risk → unsustainable pace → make changes urgently
- 81-100 → critical risk → severe burnout risk → take break ASAP

### Limitations

**Limitations of model:**

1. Treats all after-10pm work equally
   - Improvement: weight by duration and frequency
2. Doesn't distinguish deadline crunch from chronic pattern
   - Improvement: track patterns over weeks, flag sustained high scores
3. Same thresholds for everyone (ex: some people might be night owls)
   - Improvement: adaptive thresholds based on user's baseline

**Limitations of research:**

- most burnout research focuses on healthcare/service industries
- limited validated metrics for knowledge work burnout

## ⚠️ THE MODEL IS AN APPROXIMATION, NOT SCIENTIFICALLY VALIDATED

## 4. Task Completion Rate

**Research:**

- Locke, E. A., & Latham, G. P. (2002). "Building a practically useful theory of goal setting and task motivation." _American Psychologist_
  - goal completion is strongest predictor of motivation
  - completion rate provides feedback loop
  - tracking progress increases persistence

```
CompletionRate = (CompletedTasks / CreatedTasks) × 100

where:
- CompletedTasks = Tasks marked as COMPLETED
- CreatedTasks = Tasks created
- Rate expressed as percentage (0-100%)
```

## 5. Eisenhower Matrix Distribution

### Research Foundation

**Research:** Covey, S. R. (1989). _The 7 Habits of Highly Effective People_. Simon & Schuster

**Key takeaway:** Q2 is where high performers spend most time.

**Eisenhower Matrix (Dwight D. Eisenhower):**

```
                     URGENT
              Yes          |          No
         ─────────────────────────────────
    I    | Q1: DO FIRST  | Q2: SCHEDULE  |
    M    | Crisis        | Planning      |
    P Yes| Deadlines     | Development   |
    O    | Problems      | Prevention    |
    R    |───────────────|───────────────|
    T    | Q3: DELEGATE  | Q4: ELIMINATE |
    A  No| Interruptions | Distractions  |
    N    | Some calls    | Busy work     |
    T    | Some emails   | Time wasters  |
         ─────────────────────────────────
```

**Ideal Time Allocation:**

- urgent + important: 20-25% - Crisis management
- not urgent + important: 65-75% - Strategic work (OPTIMAL)
- urgent + not important: 5-10% - Minimise delegation
- not Urgent + not Important: <5% - Eliminate

**Pattern Recognition:**

- **Too much Q1:** reactive mode, always fighting fires
- **High Q2:** proactive mode, strategic thinking
- **Too much Q3:** poor boundaries, saying yes to everything
- **Any Q4:** time being wasted

## 6. Consecutive Work Days Calculation

### Research Foundation

**Primary Source:** Sonnentag, S., & Fritz, C. (2007). "The Recovery Experience Questionnaire." _Journal of Occupational Health Psychology_

**Key Rtakeawys:**

- recovery requires detachment from work
- weekend breaks significantly restore cognitive resources
- 7+ consecutive days → measurable performance degradation

### Interpretation of the results

- 1-5 → no risk → normal
- 6-7 → moderate risk → a week with no breaks (slight concern)
- 8-10 → elevated risk → concerning
- 11-14 → high risk → really concerning
- 15+ → critical risk → take break ASAP

## 7. Weekly Productivity Trends

[Redaction in progress]

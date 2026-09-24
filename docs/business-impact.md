# MeetMux Control Tower — Business Impact & Financial Models

## 1. Executive Summary

Supply chain delays in India carry direct financial penalties: contractual SLA defaults, cargo spoilage (particularly cold-chain pharma), detention charges, and excess expediting costs. MeetMux Control Tower converts operational signals directly into quantified financial impacts.

---

## 2. Core Financial Formulas

### 2.1 Estimated Cost of Delay
$$\text{Cost}_{\text{delay}} = \sum_{s \in \text{At-Risk}} \left( D_s \times C_{\text{hour}} + P_{\text{SLA}}(s) \times \text{Penalty}_{\text{SLA}} + 0.01 \times V_s \times P_{\text{delay}}(s) \right)$$

Where:
- $D_s$: Predicted delay duration (hours)
- $C_{\text{hour}}$: Hourly holding and operational cost (Default: ₹3,500/hr)
- $P_{\text{SLA}}(s)$: Probability of contractual SLA breach
- $\text{Penalty}_{\text{SLA}}$: Contractual penalty (Default: ₹25,000 for Critical SLA, ₹8,000 for Standard)
- $V_s$: Consignment invoice value in INR ₹
- $P_{\text{delay}}(s)$: Probability of transit delay

### 2.2 Bottleneck Score Formula
$$\text{Score} = \left( 0.35 \times U + 0.25 \times R + 0.25 \times \min(1.0, 5 \times B) + 0.15 \times \frac{\text{Deg}}{\text{Deg}_{\max}} \right) \times 100$$

Where:
- $U$: Facility capacity utilization $(0.0 - 1.0)$
- $R$: Facility operational risk index $(0.0 - 1.0)$
- $B$: Graph betweenness centrality $(0.0 - 1.0)$
- $\text{Deg}$: Node degree (connected lanes)

---

## 3. Projected Return on Investment (ROI)

For the MeetMux India network (650 active consignments across 9 metros):

| Metric | Baseline | Control Tower Proactive Intervention | Net Impact |
|---|---|---|---|
| **On-Time Delivery Rate** | 74.2% | 86.6% | **+12.4%** |
| **SLA Breaches / Week** | 42 | 12 | **-71.4%** |
| **Weekly Cost of Delay** | ₹45,80,000 | ₹22,25,000 | **₹23,55,000 saved / week** |
| **Annualized Projected Savings** | — | — | **₹12.24 Crore / year** |
| **Platform ROI** | — | — | **1,570%** |

*Note: All calculations are derived from synthetic simulation parameters. The Assumptions panel in the Analytics view allows operations teams to customize cost/hour and SLA breach penalty rates.*

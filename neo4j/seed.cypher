// MeetMux Control Tower — Neo4j Seeding Queries

// Load Nodes
MERGE (w1:Warehouse {id: "NODE-MUM-102", name: "Bhiwandi Central Mega Hub (H04)", city: "Mumbai", utilization: 0.94, risk_score: 88, cost_per_hour_delay: 6000})
MERGE (d1:DistributionCenter {id: "NODE-DEL-106", name: "Okhla Fulfilment Center (H02)", city: "Delhi NCR", utilization: 0.89, risk_score: 79, cost_per_hour_delay: 4800})
MERGE (p1:Port {id: "NODE-PORT-101", name: "JNPT Nhava Sheva Port", city: "Mumbai", utilization: 0.85, risk_score: 65, cost_per_hour_delay: 4500})
MERGE (c1:Customer {id: "NODE-CUST-107", name: "Delhi NCR Zone 1 Retail Cluster", city: "Delhi NCR", utilization: 0.50, risk_score: 20, cost_per_hour_delay: 1500})

// Load Relationships
MERGE (p1)-[r1:SUPPLIES {distance_km: 42.0, expected_time_hours: 1.2, traffic_level: "HIGH"}]->(w1)
MERGE (w1)-[r2:ROUTES_THROUGH {distance_km: 1420.0, expected_time_hours: 26.0, traffic_level: "SEVERE", risk_score: 82}]->(d1)
MERGE (d1)-[r3:DELIVERS_TO {distance_km: 18.0, expected_time_hours: 0.8, traffic_level: "MODERATE"}]->(c1)

// Load Shipment
MERGE (s1:Shipment {id: "SHP-1024", tracking_number: "MMX-98214510", priority: "CRITICAL_SLA", category: "PHARMA", value_inr: 4500000.0, status: "AT_RISK"})
MERGE (s1)-[:LOCATED_AT]->(w1)
MERGE (s1)-[:USES_ROUTE]->(r2)
MERGE (s1)-[:DESTINED_FOR]->(c1)

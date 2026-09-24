# MeetMux Control Tower — Neo4j Graph Model & NetworkX In-Memory Fallback

## 1. Graph Model Definition

MeetMux models the multi-echelon supply-chain network as a directed property graph.

### 1.1 Node Labels
- `:Port` — Maritime container gateways (e.g. JNPT Nhava Sheva, Chennai Port, Syama Prasad Mookerjee Port, Mundra)
- `:Warehouse` — Central distribution hubs with high throughput capacity (e.g. Bhiwandi Central Mega Hub H04)
- `:DistributionCenter` — Intermediate regional sorting facilities (e.g. Okhla Fulfilment Center H02, Peenya DC)
- `:Supplier` — Industrial manufacturing & assembly clusters
- `:Customer` — Urban retail demand zones
- `:Shipment` — Dynamic tracking entities mapped to active corridors

### 1.2 Relationship Types
- `(:Port)-[:SUPPLIES]->(:Warehouse)`
- `(:Warehouse)-[:ROUTES_THROUGH]->(:DistributionCenter)`
- `(:DistributionCenter)-[:DELIVERS_TO]->(:Customer)`
- `(:Shipment)-[:LOCATED_AT]->(:Node)`
- `(:Shipment)-[:USES_ROUTE]->(:Route)`

---

## 2. Cypher Queries

### Bottleneck Analysis
```cypher
MATCH (n)
OPTIONAL MATCH (n)-[r]-()
WITH n, count(r) AS degree, n.utilization AS util, n.risk_score AS risk
RETURN n.id AS nodeId, n.name AS name, n.type AS type, degree, util, risk,
       (util * 0.35 + (risk/100.0) * 0.25 + (degree/10.0) * 0.15) * 100 AS bottleneck_score
ORDER BY bottleneck_score DESC;
```

### Disruption Propagation (Multi-Hop)
```cypher
MATCH path = (startNode {id: $nodeId})-[r:ROUTES_THROUGH|SUPPLIES|DELIVERS_TO*1..3]-(affected)
RETURN length(path) AS hop_distance,
       nodes(path) AS nodes_in_path,
       relationships(path) AS relationships_in_path;
```

### Alternative Path Finding
```cypher
MATCH (start {id: $originId}), (target {id: $destId})
MATCH p = shortestPath((start)-[*..5]-(target))
RETURN p, reduce(totalDist = 0, r IN relationships(p) | totalDist + r.distance_km) AS total_distance;
```

---

## 3. NetworkX In-Memory Fallback Architecture

To ensure zero-setup local execution without requiring Docker or a running Neo4j instance:
1. `GraphEngine` detects if a local Neo4j database is accessible via `bolt://localhost:7687`.
2. If Neo4j is offline or credentials fail, it immediately initializes an in-memory `networkx.DiGraph`.
3. All graph algorithms (Degree Centrality, Betweenness Centrality, Dijkstra/k-Shortest Paths, BFS Multi-Hop Propagation) run seamlessly on NetworkX.
4. The user interface displays a transparent badge:
   - *"NetworkX in-memory engine active"* when running locally.
   - *"Neo4j Connected"* when linked to Neo4j.

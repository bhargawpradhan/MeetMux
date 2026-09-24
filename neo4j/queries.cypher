// MeetMux Control Tower — Operational Graph Queries

// 1. Bottleneck Node Analysis (Degree & Risk-weighted centrality)
MATCH (n)
OPTIONAL MATCH (n)-[r]-()
WITH n, count(r) AS degree, n.utilization AS util, n.risk_score AS risk
RETURN n.id AS nodeId, n.name AS name, n.type AS type, degree, util, risk,
       (util * 0.35 + (risk/100.0) * 0.35 + (degree/10.0) * 0.30) * 100 AS bottleneck_score
ORDER BY bottleneck_score DESC;

// 2. Disruption Propagation (Multi-hop impact traversal)
MATCH path = (startNode {id: $nodeId})-[r:ROUTES_THROUGH|SUPPLIES|DELIVERS_TO*1..3]-(affected)
RETURN length(path) AS hop_distance,
       nodes(path) AS nodes_in_path,
       relationships(path) AS relationships_in_path;

// 3. Alternative Path Search (K-Shortest paths weighted by risk)
MATCH (start {id: $originId}), (target {id: $destId})
MATCH p = shortestPath((start)-[*..5]-(target))
RETURN p, reduce(totalDist = 0, r IN relationships(p) | totalDist + r.distance_km) AS total_distance;

// MeetMux Control Tower — Neo4j Schema Definitions

// Constraints & Indexes
CREATE CONSTRAINT supplier_id_unique IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT warehouse_id_unique IF NOT EXISTS FOR (w:Warehouse) REQUIRE w.id IS UNIQUE;
CREATE CONSTRAINT dc_id_unique IF NOT EXISTS FOR (d:DistributionCenter) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT port_id_unique IF NOT EXISTS FOR (p:Port) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT customer_id_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT shipment_id_unique IF NOT EXISTS FOR (shp:Shipment) REQUIRE shp.id IS UNIQUE;

CREATE INDEX node_risk_index IF NOT EXISTS FOR (n:Node) ON (n.risk_score);
CREATE INDEX shipment_status_index IF NOT EXISTS FOR (s:Shipment) ON (s.status);

"""
MeetMux Control Tower — Synthetic Data Generator
Generates realistic, internally consistent supply-chain telemetry data for India operations.
Nodes: 65+ locations across Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Ahmedabad, Jaipur, Hyderabad, Pune.
Routes: 130+ multi-modal logistics corridors.
Shipments: 650+ active and historical shipment profiles with full telemetry features.
"""

import json
import random
import os
import math
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Seed for reproducible, high-impact demo dataset
random.seed(42)
np.random.seed(42)

CITIES = [
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "state": "Maharashtra", "region": "WEST"},
    {"name": "Delhi NCR", "lat": 28.6139, "lng": 77.2090, "state": "Delhi", "region": "NORTH"},
    {"name": "Bengaluru", "lat": 12.9716, "lng": 77.5946, "state": "Karnataka", "region": "SOUTH"},
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2707, "state": "Tamil Nadu", "region": "SOUTH"},
    {"name": "Kolkata", "lat": 22.5726, "lng": 88.3639, "state": "West Bengal", "region": "EAST"},
    {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "state": "Gujarat", "region": "WEST"},
    {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873, "state": "Rajasthan", "region": "NORTH"},
    {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "state": "Telangana", "region": "SOUTH"},
    {"name": "Pune", "lat": 18.5204, "lng": 73.8567, "state": "Maharashtra", "region": "WEST"}
]

NODE_TYPES = ["Supplier", "Warehouse", "DistributionCenter", "Port", "Customer"]
CARRIERS = ["MeetMux Express", "BlueDart Logistics", "Delhivery Prime", "Gati KWE", "Safexpress", "TCI Freight"]
CATEGORIES = ["ELECTRONICS", "PHARMA", "AUTOMOTIVE", "FMCG", "TEXTILES", "INDUSTRIAL_EQUIPMENT"]

def generate_nodes():
    nodes = []
    node_id_counter = 100

    # 1. Major Ports
    ports_info = [
        {"name": "JNPT Nhava Sheva Port", "city": "Mumbai", "lat": 18.9500, "lng": 72.9500},
        {"name": "Chennai Port Trust", "city": "Chennai", "lat": 13.0840, "lng": 80.2930},
        {"name": "Syama Prasad Mookerjee Port", "city": "Kolkata", "lat": 22.5400, "lng": 88.3200},
        {"name": "Mundra Container Terminal", "city": "Ahmedabad", "lat": 22.8400, "lng": 69.7000}
    ]
    for p in ports_info:
        node_id_counter += 1
        nodes.append({
            "id": f"NODE-PORT-{node_id_counter}",
            "name": p["name"],
            "type": "Port",
            "city": p["city"],
            "state": next(c["state"] for c in CITIES if c["name"] == p["city"]),
            "latitude": p["lat"],
            "longitude": p["lng"],
            "capacity": 15000,
            "current_load": random.randint(9000, 14200),
            "utilization": round(random.uniform(0.65, 0.94), 2),
            "risk_score": random.randint(25, 75),
            "cost_per_hour_delay": 4500,
            "operating_status": "CONGESTED" if random.random() > 0.6 else "NORMAL"
        })

    # 2. Key Warehouses & DCs for each city
    for city in CITIES:
        # 3 Hubs per city
        for i in range(1, 4):
            node_id_counter += 1
            node_type = "Warehouse" if i == 1 else ("DistributionCenter" if i == 2 else "Supplier")
            
            # Special Storyline setup for Bhiwandi & Okhla
            name_suffix = f"{city['name']} Major Hub {i}"
            if city["name"] == "Mumbai" and i == 1:
                name_suffix = "Bhiwandi Central Mega Hub (H04)"
                utilization = 0.94
                risk_score = 88
                operating_status = "CRITICAL"
            elif city["name"] == "Delhi NCR" and i == 2:
                name_suffix = "Okhla Fulfilment Center (H02)"
                utilization = 0.89
                risk_score = 79
                operating_status = "CONGESTED"
            else:
                utilization = round(random.uniform(0.40, 0.85), 2)
                risk_score = random.randint(15, 60)
                operating_status = "NORMAL" if utilization < 0.80 else "CONGESTED"

            # Offset slightly from city center
            lat_off = (random.random() - 0.5) * 0.25
            lng_off = (random.random() - 0.5) * 0.25

            nodes.append({
                "id": f"NODE-{city['name'][:3].upper()}-{node_id_counter}",
                "name": name_suffix,
                "type": node_type,
                "city": city["name"],
                "state": city["state"],
                "latitude": round(city["lat"] + lat_off, 4),
                "longitude": round(city["lng"] + lng_off, 4),
                "capacity": random.randint(5000, 25000),
                "current_load": int(20000 * utilization),
                "utilization": utilization,
                "risk_score": risk_score,
                "cost_per_hour_delay": random.choice([2500, 3200, 4800, 6000]),
                "operating_status": operating_status
            })

        # 4 Customer Demand Zones per city
        for j in range(1, 5):
            node_id_counter += 1
            lat_off = (random.random() - 0.5) * 0.35
            lng_off = (random.random() - 0.5) * 0.35
            nodes.append({
                "id": f"NODE-CUST-{node_id_counter}",
                "name": f"{city['name']} Zone {j} Retail Cluster",
                "type": "Customer",
                "city": city["name"],
                "state": city["state"],
                "latitude": round(city["lat"] + lat_off, 4),
                "longitude": round(city["lng"] + lng_off, 4),
                "capacity": 2000,
                "current_load": random.randint(400, 1800),
                "utilization": round(random.uniform(0.3, 0.8), 2),
                "risk_score": random.randint(10, 45),
                "cost_per_hour_delay": 1500,
                "operating_status": "NORMAL"
            })

    return nodes

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_routes(nodes):
    routes = []
    route_id_counter = 500

    non_customers = [n for n in nodes if n["type"] != "Customer"]
    customers = [n for n in nodes if n["type"] == "Customer"]

    # 1. Connect inter-hub corridors (Major Warehouses & Ports)
    for i in range(len(non_customers)):
        for j in range(i + 1, len(non_customers)):
            n1 = non_customers[i]
            n2 = non_customers[j]
            dist = haversine(n1["latitude"], n1["longitude"], n2["latitude"], n2["longitude"])
            
            # Connect if within reasonable transport range or primary trunk route
            if dist < 450 or (n1["type"] in ["Port", "Warehouse"] and n2["type"] in ["Port", "Warehouse"] and dist < 1400 and random.random() < 0.25):
                route_id_counter += 1
                exp_hours = round(dist / 55.0, 1)
                
                # Introduce storyline delay on Bhiwandi-Delhi trunk
                is_storyline = ("Bhiwandi" in n1["name"] or "Bhiwandi" in n2["name"]) and ("Delhi" in n1["city"] or "Delhi" in n2["city"])
                hist_delay = round(0.48 if is_storyline else random.uniform(0.05, 0.35), 2)
                risk = 82 if is_storyline else int(hist_delay * 100 + random.randint(0, 20))
                traffic = "SEVERE" if is_storyline else random.choice(["LOW", "MODERATE", "HIGH"])

                routes.append({
                    "id": f"ROUTE-{route_id_counter}",
                    "origin_id": n1["id"],
                    "destination_id": n2["id"],
                    "origin_name": n1["name"],
                    "destination_name": n2["name"],
                    "distance_km": round(dist, 1),
                    "expected_time_hours": exp_hours,
                    "actual_time_hours": round(exp_hours * (1 + hist_delay), 1),
                    "capacity_vehicles": random.randint(20, 150),
                    "traffic_level": traffic,
                    "historical_delay_rate": hist_delay,
                    "risk_score": min(99, risk),
                    "cost_per_km": round(random.uniform(45.0, 85.0), 2),
                    "status": "CONGESTED" if traffic in ["HIGH", "SEVERE"] else "ACTIVE"
                })

    # 2. Connect Warehouses/DCs to nearby Customers
    for cust in customers:
        nearby_whs = [n for n in non_customers if n["city"] == cust["city"]]
        for wh in nearby_whs[:2]:
            dist = haversine(wh["latitude"], wh["longitude"], cust["latitude"], cust["longitude"])
            route_id_counter += 1
            exp_hours = round(dist / 35.0, 1)
            routes.append({
                "id": f"ROUTE-{route_id_counter}",
                "origin_id": wh["id"],
                "destination_id": cust["id"],
                "origin_name": wh["name"],
                "destination_name": cust["name"],
                "distance_km": round(max(5.0, dist), 1),
                "expected_time_hours": max(0.5, exp_hours),
                "actual_time_hours": round(max(0.5, exp_hours) * round(random.uniform(1.0, 1.25), 2), 1),
                "capacity_vehicles": 30,
                "traffic_level": random.choice(["LOW", "MODERATE"]),
                "historical_delay_rate": round(random.uniform(0.04, 0.20), 2),
                "risk_score": random.randint(10, 40),
                "cost_per_km": 35.0,
                "status": "ACTIVE"
            })

    return routes

def generate_shipments(nodes, routes):
    shipments = []
    node_dict = {n["id"]: n for n in nodes}
    
    start_time = datetime.now() - timedelta(days=2)

    for i in range(1, 651):
        shp_id = f"SHP-{1000 + i}"
        route = random.choice(routes)
        orig = node_dict[route["origin_id"]]
        dest = node_dict[route["destination_id"]]

        # Storyline specific override for SHP-1024
        if shp_id == "SHP-1024":
            category = "PHARMA"
            priority = "CRITICAL_SLA"
            curr_speed = 18.0
            avg_speed = 42.0
            temp = 24.5  # Cold chain alert for pharma
            humidity = 78.0
            congestion = 0.92
            hist_delay = 0.55
            stops = 5
            wh_load = 0.94  # Bhiwandi WH load
            veh_age = 7
            prev_delays = 4
            weather = 8
            val_inr = 4500000.0  # ₹ 45 Lakhs high-value pharma batch
            status = "AT_RISK"
            carrier = "MeetMux Express"
        elif shp_id == "SHP-1042":
            category = "ELECTRONICS"
            priority = "CRITICAL_SLA"
            curr_speed = 22.0
            avg_speed = 50.0
            temp = 28.0
            humidity = 65.0
            congestion = 0.84
            hist_delay = 0.42
            stops = 4
            wh_load = 0.89
            veh_age = 5
            prev_delays = 3
            weather = 6
            val_inr = 2800000.0
            status = "DELAYED"
            carrier = "BlueDart Logistics"
        else:
            category = random.choice(CATEGORIES)
            priority = random.choice(["STANDARD", "EXPRESS", "CRITICAL_SLA"])
            curr_speed = round(random.uniform(20.0, 75.0), 1)
            avg_speed = round(random.uniform(35.0, 65.0), 1)
            temp = round(random.uniform(18.0, 32.0), 1)
            humidity = round(random.uniform(40.0, 85.0), 1)
            congestion = round(random.uniform(0.1, 0.95), 2)
            hist_delay = route["historical_delay_rate"]
            stops = random.randint(1, 6)
            wh_load = orig["utilization"]
            veh_age = random.randint(1, 10)
            prev_delays = random.randint(0, 5)
            weather = random.randint(1, 9)
            val_inr = round(random.uniform(50000.0, 3000000.0), 2)
            
            if congestion > 0.75 or hist_delay > 0.40:
                status = random.choice(["AT_RISK", "DELAYED", "IN_TRANSIT"])
            else:
                status = random.choice(["IN_TRANSIT", "IN_TRANSIT", "DELIVERED"])

        # Calculate coordinates along route
        progress = random.uniform(0.15, 0.85) if status != "DELIVERED" else 1.0
        curr_lat = round(orig["latitude"] + progress * (dest["latitude"] - orig["latitude"]), 4)
        curr_lng = round(orig["longitude"] + progress * (dest["longitude"] - orig["longitude"]), 4)

        dispatch = start_time + timedelta(hours=random.randint(0, 36))
        promised_eta = dispatch + timedelta(hours=route["expected_time_hours"])
        
        shipments.append({
            "id": shp_id,
            "tracking_number": f"MMX-{random.randint(10000000, 99999999)}",
            "origin_id": orig["id"],
            "destination_id": dest["id"],
            "origin_name": orig["name"],
            "destination_name": dest["name"],
            "route_id": route["id"],
            "current_node_id": orig["id"] if progress < 0.5 else dest["id"],
            "status": status,
            "priority": priority,
            "category": category,
            "carrier_name": carrier if 'carrier' in locals() else random.choice(CARRIERS),
            "shipment_distance": route["distance_km"],
            "current_speed": curr_speed,
            "average_speed": avg_speed,
            "temperature": temp,
            "humidity": humidity,
            "route_congestion": congestion,
            "historical_delay_rate": hist_delay,
            "number_of_stops": stops,
            "warehouse_load": wh_load,
            "vehicle_age": veh_age,
            "previous_route_delays": prev_delays,
            "time_of_day": dispatch.hour,
            "day_of_week": dispatch.weekday(),
            "weather_severity": weather,
            "value_inr": val_inr,
            "latitude": curr_lat,
            "longitude": curr_lng,
            "dispatch_timestamp": dispatch.isoformat(),
            "promised_delivery_timestamp": promised_eta.isoformat(),
            "estimated_delivery_timestamp": (promised_eta + timedelta(hours=round(route["expected_time_hours"] * hist_delay, 1))).isoformat()
        })

    return shipments

def generate_all():
    nodes = generate_nodes()
    routes = generate_routes(nodes)
    shipments = generate_shipments(nodes, routes)

    os.makedirs("data", exist_ok=True)

    with open("data/nodes.json", "w") as f:
        json.dump(nodes, f, indent=2)

    with open("data/routes.json", "w") as f:
        json.dump(routes, f, indent=2)

    with open("data/shipments.json", "w") as f:
        json.dump(shipments, f, indent=2)

    # Generate CSV dataset for XGBoost training
    df = pd.DataFrame(shipments)
    
    # Calculate target labels:
    # 1. is_delayed: 1 if status in ['DELAYED', 'AT_RISK'] or heuristic delay probability > 0.45
    # 2. delay_hours: continuous predicted delay hours
    # 3. is_sla_breach: 1 if priority == 'CRITICAL_SLA' and delay > 2 hours or standard delay > 4 hours
    
    # Synthetic formula for realistic delay target
    risk_raw = (
        0.25 * df['route_congestion'] +
        0.20 * df['historical_delay_rate'] +
        0.15 * df['warehouse_load'] +
        0.12 * (df['weather_severity'] / 10.0) +
        0.10 * (df['previous_route_delays'] / 5.0) +
        0.10 * np.where(df['current_speed'] < 30.0, 0.8, 0.2) +
        0.08 * (df['vehicle_age'] / 10.0)
    )
    
    df['delay_probability'] = np.clip(risk_raw + np.random.normal(0, 0.05, len(df)), 0.02, 0.98)
    df['is_delayed'] = (df['delay_probability'] >= 0.45).astype(int)
    df['delay_hours'] = np.round(df['delay_probability'] * 8.5 + np.random.exponential(1.2, len(df)), 1)
    df['is_sla_breach'] = ((df['is_delayed'] == 1) & (df['delay_hours'] > np.where(df['priority'] == 'CRITICAL_SLA', 1.5, 3.5))).astype(int)

    df.to_csv("data/training_dataset.csv", index=False)
    print(f"[OK] Generated synthetic dataset: {len(nodes)} nodes, {len(routes)} routes, {len(shipments)} shipments.")

if __name__ == "__main__":
    generate_all()

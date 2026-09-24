// MeetMux Control Tower — 3D Holographic Digital Twin Supply Chain Globe
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, RotateCw, Eye, Zap, ShieldAlert, Layers } from 'lucide-react';

// Coordinates for major Indian Logistics Metros
const METRO_NODES: { id: string; name: string; lat: number; lng: number; type: string; risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; shipments: number }[] = [
  { id: 'H04', name: 'Bhiwandi Central Mega Hub (Mumbai)', lat: 19.2967, lng: 73.0628, type: 'MEGA_HUB', risk: 'CRITICAL', shipments: 94 },
  { id: 'DEL-1', name: 'Delhi NCR Logistics Gateway (Gurugram)', lat: 28.4595, lng: 77.0266, type: 'FULFILLMENT', risk: 'HIGH', shipments: 78 },
  { id: 'BLR-1', name: 'Bengaluru Tech Corridor Hub (Whitefield)', lat: 12.9716, lng: 77.5946, type: 'HUB', risk: 'MEDIUM', shipments: 62 },
  { id: 'MAA-1', name: 'Chennai Port Marine Terminal', lat: 13.0827, lng: 80.2707, type: 'PORT', risk: 'LOW', shipments: 45 },
  { id: 'CCU-1', name: 'Kolkata Eastern Gateway Hub', lat: 22.5726, lng: 88.3639, type: 'HUB', risk: 'MEDIUM', shipments: 39 },
  { id: 'AMD-1', name: 'Ahmedabad Industrial Distribution Node', lat: 23.0225, lng: 72.5714, type: 'DC', risk: 'LOW', shipments: 34 },
  { id: 'HYD-1', name: 'Hyderabad Cyberabad Fulfillment Center', lat: 17.3850, lng: 78.4867, type: 'FULFILLMENT', risk: 'LOW', shipments: 51 },
  { id: 'PNQ-1', name: 'Pune Automotive & Cold-Chain Hub', lat: 18.5204, lng: 73.8567, type: 'COLD_CHAIN', risk: 'HIGH', shipments: 28 },
  { id: 'JAI-1', name: 'Jaipur Pink City Cargo Terminal', lat: 26.9124, lng: 75.7873, type: 'CARGO', risk: 'LOW', shipments: 22 },
];

// Major corridors connecting hubs
const CORRIDORS = [
  { from: 'H04', to: 'DEL-1', activeShipments: 24, status: 'CONGESTED' },
  { from: 'H04', to: 'BLR-1', activeShipments: 19, status: 'NORMAL' },
  { from: 'H04', to: 'PNQ-1', activeShipments: 16, status: 'HIGH_RISK' },
  { from: 'DEL-1', to: 'JAI-1', activeShipments: 12, status: 'NORMAL' },
  { from: 'DEL-1', to: 'CCU-1', activeShipments: 15, status: 'NORMAL' },
  { from: 'BLR-1', to: 'MAA-1', activeShipments: 21, status: 'NORMAL' },
  { from: 'BLR-1', to: 'HYD-1', activeShipments: 18, status: 'NORMAL' },
  { from: 'H04', to: 'AMD-1', activeShipments: 14, status: 'NORMAL' },
  { from: 'AMD-1', to: 'DEL-1', activeShipments: 17, status: 'NORMAL' },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function DigitalTwinGlobe({ height = 480, interactive = true }: { height?: number; interactive?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<typeof METRO_NODES[0] | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const h = height;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.set(0, 10, 240);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for earth and network
    const globeGroup = new THREE.Group();
    // Default orientation centered towards India (approx lat 20, lng 78)
    globeGroup.rotation.y = -1.4;
    globeGroup.rotation.x = 0.35;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 75;

    // 1. Realistic 3D World Map Globe in natural World Colors (Blue Oceans, Green/Earth Continents)
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth_world.jpg');
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(globeMesh);

    // 2. Subtle Atmospheric Ocean Haze
    const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // 4. Background Starfield / Particle Nebula
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 600;
      starCoords[i + 1] = (Math.random() - 0.5) * 600;
      starCoords[i + 2] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xF4ECE0, size: 1.5, transparent: true, opacity: 0.45 });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 5. Realistic Natural Sunlight & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfffaed, 2.6);
    dirLight1.position.set(130, 90, 160);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-130, -70, -120);
    scene.add(dirLight2);

    // 6. Node Markers & Pulsing Light Pillars
    const nodeVectors: Record<string, THREE.Vector3> = {};
    const nodeMeshes: { mesh: THREE.Mesh; nodeData: typeof METRO_NODES[0] }[] = [];
    const pulseRings: { ring: THREE.Mesh; baseScale: number; speed: number }[] = [];

    METRO_NODES.forEach((node) => {
      const v = latLngToVector3(node.lat, node.lng, GLOBE_RADIUS + 0.4);
      nodeVectors[node.id] = v;

      // Color code based on risk
      // Color code based on risk: Critical #FF4D5A, High/Warning #FBBF24, Medium #00B8D9, Low/Success #2DD4BF
      const color = node.risk === 'CRITICAL' ? 0xff4d5a : node.risk === 'HIGH' ? 0xfbbf24 : node.risk === 'MEDIUM' ? 0x00b8d9 : 0x2dd4bf;

      // Node Sphere
      const nGeo = new THREE.SphereGeometry(node.id === 'H04' ? 2.6 : 1.6, 16, 16);
      const nMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
      const nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.copy(v);
      globeGroup.add(nMesh);
      nodeMeshes.push({ mesh: nMesh, nodeData: node });

      // Holographic Light Pillar extending from node
      const pillarH = node.id === 'H04' ? 20 : node.shipments * 0.16;
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.6, pillarH, 8);
      pillarGeo.translate(0, pillarH / 2, 0);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: node.id === 'H04' ? 0.85 : 0.45,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.copy(v);
      pillar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      globeGroup.add(pillar);

      // Pulsing Base Radar Ring
      const ringGeo = new THREE.RingGeometry(1.2, 2.4, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(v.clone().multiplyScalar(1.005));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.clone().normalize());
      globeGroup.add(ring);
      pulseRings.push({ ring, baseScale: 1, speed: 0.02 + Math.random() * 0.02 });
    });

    // 7. 3D Great-Circle Flight / Freight Arcs with Moving Light Energy Packets
    interface ArcPacket {
      curve: THREE.QuadraticBezierCurve3;
      mesh: THREE.Mesh;
      progress: number;
      speed: number;
    }
    const arcPackets: ArcPacket[] = [];

    CORRIDORS.forEach((corridor) => {
      const v1 = nodeVectors[corridor.from];
      const v2 = nodeVectors[corridor.to];
      if (!v1 || !v2) return;

      // Calculate arc control point pushed outward
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const dist = v1.distanceTo(v2);
      const elevation = GLOBE_RADIUS + Math.max(12, dist * 0.38);
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(36);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const isCritical = corridor.from === 'H04' || corridor.status === 'CONGESTED';
      const arcColor = isCritical ? 0xff4d5a : 0x14b8a6; // Teal #14B8A6 or Critical Red #FF4D5A

      const lineMat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: isCritical ? 0.8 : 0.4,
        linewidth: 2,
      });
      const arcLine = new THREE.Line(lineGeo, lineMat);
      globeGroup.add(arcLine);

      // Moving Telemetry Energy Packet along the arc (Bright Cyan #22D3EE or Critical Red #FF4D5A)
      const packetGeo = new THREE.SphereGeometry(isCritical ? 1.4 : 1.0, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({
        color: isCritical ? 0xff4d5a : 0x22d3ee,
      });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      globeGroup.add(packetMesh);

      arcPackets.push({
        curve,
        mesh: packetMesh,
        progress: Math.random(),
        speed: 0.0035 + (corridor.activeShipments * 0.00015),
      });
    });

    // 8. Mouse Raycasting for Interactive Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener('mousemove', onMouseMove);

    // Mouse Drag Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x += deltaY * 0.005;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onGlobalMouseMove);

    // 9. Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow idle auto-spin
      if (autoRotate && !isDragging) {
        globeGroup.rotation.y += 0.0025;
      }

      // Pulse Radar Rings
      pulseRings.forEach((p) => {
        p.baseScale += p.speed;
        if (p.baseScale > 2.8) p.baseScale = 1;
        p.ring.scale.set(p.baseScale, p.baseScale, 1);
        (p.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - (p.baseScale - 1) / 1.8);
      });

      // Move Arc Energy Packets
      arcPackets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      // Raycast interactive hover
      raycaster.setFromCamera(mouse, camera);
      const targetMeshes = nodeMeshes.map(m => m.mesh);
      const intersects = raycaster.intersectObjects(targetMeshes);

      if (intersects.length > 0) {
        const found = nodeMeshes.find(m => m.mesh === intersects[0].object);
        if (found) {
          setHoveredNode(found.nodeData);
          document.body.style.cursor = 'pointer';
        }
      } else {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onGlobalMouseMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      document.body.style.cursor = 'default';
    };
  }, [height, autoRotate]);

  return (
    <div className="relative rounded-2xl overflow-hidden glass-card border border-[#1B3448] bg-gradient-to-b from-[#0D1B2A]/90 via-[#07111F]/80 to-[#050B14]/90">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full relative select-none" style={{ height }} />

      {/* Floating HUD Overlay Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0D1B2A]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1B3448] text-xs">
          <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-ping" />
          <span className="font-bold text-[#E6F1F5] uppercase tracking-widest text-[10px]">3D Digital Twin</span>
          <span className="text-[#78909C] font-mono text-[10px]">· India Geospatial Mesh</span>
        </div>

        {/* Interactive Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(r => !r)}
            className={`p-1.5 rounded-lg border text-xs transition-colors backdrop-blur-md ${
              autoRotate ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]' : 'bg-[#0D1B2A]/60 border-[#1B3448] text-[#78909C]'
            }`}
            title="Toggle Auto-Orbit"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hovered Node Live Tooltip Card */}
      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-4 left-4 z-20 pointer-events-none bg-[#0D1B2A]/95 backdrop-blur-xl border border-[#1B3448] rounded-xl p-3 shadow-2xl text-xs max-w-xs text-[#E6F1F5]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${
              hoveredNode.risk === 'CRITICAL' ? 'bg-[#FF4D5A] animate-pulse' :
              hoveredNode.risk === 'HIGH' ? 'bg-[#FBBF24]' : 'bg-[#2DD4BF]'
            }`} />
            <span className="font-bold text-white text-xs">{hoveredNode.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-rose-500/20 text-[10px]">
            <div>
              <p className="text-rose-300/70">Facility Type</p>
              <p className="font-mono text-rose-100 font-bold">{hoveredNode.type}</p>
            </div>
            <div>
              <p className="text-rose-300/70">Active Volume</p>
              <p className="font-mono text-rose-100 font-bold">{hoveredNode.shipments} shipments</p>
            </div>
            <div>
              <p className="text-rose-300/70">Risk State</p>
              <p className={`font-mono font-bold ${hoveredNode.risk === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'}`}>{hoveredNode.risk}</p>
            </div>
            <div>
              <p className="text-rose-300/70">Coordinates</p>
              <p className="font-mono text-rose-100 font-bold">{hoveredNode.lat.toFixed(2)}°N, {hoveredNode.lng.toFixed(2)}°E</p>
            </div>
          </div>
          {hoveredNode.id === 'H04' && (
            <p className="text-[10px] text-amber-300 font-semibold mt-2 pt-1 border-t border-rose-500/20 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
              Primary Bottleneck: 94% Capacity Utilization
            </p>
          )}
        </motion.div>
      )}

      {/* Footer Radar Legend */}
      <div className="absolute bottom-3 right-4 pointer-events-none flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/20 text-[10px] text-rose-300/90 font-mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical SLA</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Congested</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Flowing</span>
        <span className="text-rose-400/50">| Click & drag to rotate</span>
      </div>
    </div>
  );
}

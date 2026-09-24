// MeetMux Control Tower — Crazy 3D Floating Elements & Holographic Space
// Renders randomly moving 3D logistics containers, floating wireframe polyhedra,
// pulsing telemetry nodes, and drifting particle constellations across the background.
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FloatingObject {
  mesh: THREE.Object3D;
  vx: number;
  vy: number;
  vz: number;
  rotVx: number;
  rotVy: number;
  rotVz: number;
  baseY: number;
}

export default function Floating3DElements() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 180;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const floatingObjects: FloatingObject[] = [];

    // Color palettes for transparent holographic look
    const neonColors = [0xff2a6d, 0xd6588a, 0x00f2fe, 0x7928ca, 0xff70a6, 0x4facfe];

    // 1. Create Floating 3D Shipping Containers (Wireframe + Glowing Translucent Faces)
    for (let i = 0; i < 9; i++) {
      const group = new THREE.Group();

      // Proportions of a standard 40ft freight container: ~ 12 x 5 x 5
      const boxGeo = new THREE.BoxGeometry(14, 6, 6);

      // Glass body
      const color = neonColors[i % neonColors.length];
      const boxMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.25,
        specular: 0xffffff,
        shininess: 90,
        transparent: true,
        opacity: 0.18,
        wireframe: false,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      group.add(boxMesh);

      // Wireframe container edges
      const edgesGeo = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.65,
        linewidth: 1.5,
      });
      const edgesMesh = new THREE.LineSegments(edgesGeo, lineMat);
      group.add(edgesMesh);

      // Random starting coordinates spread across the screen
      group.position.set(
        (Math.random() - 0.5) * 320,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 120
      );

      scene.add(group);

      floatingObjects.push({
        mesh: group,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        vz: (Math.random() - 0.5) * 0.12,
        rotVx: (Math.random() - 0.5) * 0.012,
        rotVy: (Math.random() - 0.5) * 0.015,
        rotVz: (Math.random() - 0.5) * 0.009,
        baseY: group.position.y,
      });
    }

    // 2. Create Floating Holographic Octahedrons & Polyhedra
    for (let i = 0; i < 12; i++) {
      const geo = i % 2 === 0 ? new THREE.OctahedronGeometry(6 + Math.random() * 4) : new THREE.IcosahedronGeometry(5 + Math.random() * 3);
      const color = neonColors[(i + 2) % neonColors.length];

      const wireGeo = new THREE.WireframeGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.45,
      });
      const wireMesh = new THREE.LineSegments(wireGeo, wireMat);

      // Inner glowing core
      const coreGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      wireMesh.add(coreMesh);

      wireMesh.position.set(
        (Math.random() - 0.5) * 360,
        (Math.random() - 0.5) * 220,
        (Math.random() - 0.5) * 150
      );

      scene.add(wireMesh);

      floatingObjects.push({
        mesh: wireMesh,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        vz: (Math.random() - 0.5) * 0.15,
        rotVx: (Math.random() - 0.5) * 0.02,
        rotVy: (Math.random() - 0.5) * 0.025,
        rotVz: (Math.random() - 0.5) * 0.015,
        baseY: wireMesh.position.y,
      });
    }

    // 3. Create Drifting Ambient Star/Data Particle Constellation
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 450;
      particlePositions[i + 1] = (Math.random() - 0.5) * 300;
      particlePositions[i + 2] = (Math.random() - 0.5) * 200;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff88bb,
      size: 2.2,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // 4. Subtle ambient and point lights
    const ambientLight = new THREE.AmbientLight(0xffe0ed, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff2a6d, 2, 300);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Resize handling
    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slight camera tilt following mouse
      camera.position.x += (mouseX * 25 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 18 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Rotate particle field slowly
      particleField.rotation.y += 0.0006;
      particleField.rotation.x += 0.0004;

      // Update randomly moving 3D objects with bounds wrapping
      floatingObjects.forEach((obj) => {
        // Move randomly
        obj.mesh.position.x += obj.vx;
        obj.mesh.position.y += obj.vy;
        obj.mesh.position.z += obj.vz;

        // Rotate on 3D axes
        obj.mesh.rotation.x += obj.rotVx;
        obj.mesh.rotation.y += obj.rotVy;
        obj.mesh.rotation.z += obj.rotVz;

        // Wrap around viewport boundaries smoothly
        if (obj.mesh.position.x > 190) obj.mesh.position.x = -190;
        if (obj.mesh.position.x < -190) obj.mesh.position.x = 190;
        if (obj.mesh.position.y > 130) obj.mesh.position.y = -130;
        if (obj.mesh.position.y < -130) obj.mesh.position.y = 130;
        if (obj.mesh.position.z > 80) obj.mesh.position.z = -80;
        if (obj.mesh.position.z < -80) obj.mesh.position.z = 80;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
}

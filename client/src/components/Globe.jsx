// Globe.jsx
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

function Earth() {
  const earthRef = useRef();

  // Rotate globe slowly
  useFrame(() => {
    earthRef.current.rotation.y += 0.0015;
  });

  // Load Earth texture (day map)
  const texture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg"
  );

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export default function Globe() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 6] }}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={1} />

        {/* Globe */}
        <Earth />

        {/* Background stars */}
        <Stars radius={300} depth={60} count={20000} factor={7} />

        {/* Controls for drag/zoom */}
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}

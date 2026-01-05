"use client";

import { Environment, Float, useGLTF } from "@react-three/drei";
// 1. Importei o tipo ThreeEvent aqui
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface SingleCubeProps {
  scale?: number;
  rotationSpeed?: number;
  initialRotation?: [number, number, number];
  hoverRotationSpeed?: number;
}

function CubeModel({
  scale = 3,
  rotationSpeed = 0.0002,
  initialRotation = [0, 0, 0],
  hoverRotationSpeed = 0.005,
}: SingleCubeProps) {
  const gltf = useGLTF("/models/scene.gltf");
  const groupRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const currentSpeedRef = useRef(rotationSpeed);

  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(...initialRotation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.computeBoundingBox();
          const size = new THREE.Vector3();
          mesh.geometry.boundingBox?.getSize(size);
          if ((size.x > 2 && size.z < 0.1) || (size.z > 2 && size.x < 0.1)) {
            mesh.visible = false;
            return;
          }
        }
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: "#111111",
          roughness: 0.0,
          metalness: 0.0,
          transmission: 1.0,
          thickness: 1.5,
          ior: 1.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.0,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide,
        });
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current) return;

    const targetSpeed = hovered ? hoverRotationSpeed : rotationSpeed;

    currentSpeedRef.current = THREE.MathUtils.lerp(
      currentSpeedRef.current,
      targetSpeed,
      0.05,
    );

    groupRef.current.rotation.x += currentSpeedRef.current;
    groupRef.current.rotation.y += currentSpeedRef.current;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef} scale={scale}>
        <primitive
          object={scene}
          // 2. TIPO CORRIGIDO AQUI (De 'any' para 'ThreeEvent<PointerEvent>')
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "default";
          }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        />
      </group>
    </Float>
  );
}

export default function SingleCubeFivem(props: SingleCubeProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        style={{ pointerEvents: "auto" }}
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{
          preserveDrawingBuffer: false,
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        dpr={[1, 1.5]}
      >
        <Environment preset="night" />
        <ambientLight intensity={1} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={2500}
          color="#580000"
          castShadow
        />
        <pointLight
          position={[-10, 0, 5]}
          intensity={2500}
          color="#D13400"
          distance={20}
          decay={1}
        />
        <pointLight
          position={[0, -5, 2]}
          intensity={200}
          color="#D19D00"
          distance={10}
        />

        <CubeModel {...props} />

        <EffectComposer>
          <Noise opacity={1} premultiply />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

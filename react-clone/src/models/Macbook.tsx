"use client"
import React, { useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three"

const assetUrl = (path: string) => {
  try {
    const normalized = path.startsWith("assets/") ? path : `assets/${path.replace(/^\//, "")}`;
    const rt = (globalThis as any)?.chrome?.runtime;
    return rt && typeof rt.getURL === "function"
      ? rt.getURL(normalized)
      : `/${normalized}`;
  } catch {
    return path;
  }
};

export function Macbook(props : any) {
  const { nodes, materials } = useGLTF(assetUrl("scenes/macbook_pro.glb")) as unknown as { nodes: any; materials: any };
  const texture = useTexture(assetUrl("textures/yellow.png")) as unknown as THREE.Texture;
  const modelRef = useRef<THREE.Group>(null);

  return (
    <group ref={modelRef} {...props} dispose={null}>
      <group position={[1.3, 0.007, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={(nodes.Object_6 as THREE.Mesh).geometry}
          material={materials.MacBookPro}
          scale={11}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={(nodes.Object_8 as THREE.Mesh).geometry}
          material={materials.MacBookPro}
          scale={11}
        />
        <meshStandardMaterial roughness={1} map={texture} /> {/*! have to put this inside a mesh tag that actually has a screen mesh (bad model rn so it wont work) */}
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Object_4 as THREE.Mesh).geometry}
        material={materials.MacBookPro}
        scale={11}
      />
    </group>
  );
}

useGLTF.preload(assetUrl("scenes/macbook_pro.glb"));

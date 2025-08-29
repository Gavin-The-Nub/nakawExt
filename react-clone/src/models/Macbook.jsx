"use client";
import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useTexture } from "@react-three/drei";

const assetUrl = (path) => {
  try {
    const normalized = path.startsWith("assets/")
      ? path
      : `assets/${path.replace(/^\//, "")}`;
    const rt =
      typeof globalThis !== "undefined" &&
      globalThis.chrome &&
      globalThis.chrome.runtime
        ? globalThis.chrome.runtime
        : null;
    return rt && typeof rt.getURL === "function"
      ? rt.getURL(normalized)
      : `/${normalized}`;
  } catch {
    return path;
  }
};

export function Macbook({ screenUrl, ...props }) {
  const { nodes, materials } = useGLTF(assetUrl("scenes/macbook_pro.glb"));
  const texture = useTexture(screenUrl || assetUrl("textures/yellow.png"));
  const modelRef = useRef(null);

  return (
    <group ref={modelRef} {...props} dispose={null}>
      <group position={[1.3, 0.007, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_6.geometry}
          material={materials.MacBookPro}
          scale={11}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_8.geometry}
          material={materials.MacBookPro}
          scale={11}
        />
        <meshStandardMaterial roughness={1} map={texture} />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.MacBookPro}
        scale={11}
      />
    </group>
  );
}

useGLTF.preload(assetUrl("scenes/macbook_pro.glb"));

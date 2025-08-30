"use client";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef, useEffect, useState } from "react";

const assetUrl = (path) => {
  try {
    // Ensure relative to extension root where assets are copied
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

export default function Model({ screenUrl, ...props }) {
  const modelRef = useRef(null);
  const { nodes, materials } = useGLTF(assetUrl("scenes/ipad.glb"));
  const texture = useTexture(screenUrl || assetUrl("textures/yellow.png"));

  return (
    <group ref={modelRef} {...props} dispose={null}>
      <group scale={0.01}>
        <group scale={10.636}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_002_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[12.647, 11.575, 1.516]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_003_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[12.647, 10.305, 1.516]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_001_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.789, 14.145, 1.032]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.main_body_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[2.16, 0, -1.227]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.screen_screen_0_1.geometry}
            material={materials.screen}
            position={[2.16, 0, -1.227]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          >
            <meshStandardMaterial roughness={1} map={texture} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.camera_conus_2_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[11.464, 11.586, 0.753]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.camera_conus_001_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[11.464, 12.626, 0.753]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.flash_body_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.175, 12.899, 0.323]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.flash_glass_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.187, 12.9, 0.289]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.camera_body_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.885, 12.1, 0.584]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.camera_main_glass_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.982, 12.166, 0.488]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.mic_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.278, 11.2, 0.337]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.sensor_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[10.283, 12.1, 0.317]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_008_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[11.488, 12.62, 0.649]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_009_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[11.488, 11.58, 0.649]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Sphere_001_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[11.447, 11.58, 0.809]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={70}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Sphere_002_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[11.447, 12.62, 0.809]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={70}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cube_005_mainbody_0_1.geometry}
            material={materials.mainbody}
            position={[2.16, -13.9, -1.227]}
            rotation={[-Math.PI / 2, 0, 2.886]}
            scale={100}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Apple_001_logo_0_1.geometry}
            material={materials.logo}
            position={[2.168, -1.5, -1.258]}
            rotation={[Math.PI, 0.255, -Math.PI]}
            scale={1.016}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(assetUrl("scenes/ipad.glb"));

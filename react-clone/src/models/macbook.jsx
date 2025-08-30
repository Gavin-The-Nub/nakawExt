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
  const { nodes, materials } = useGLTF(
    assetUrl("scenes/mackbook_air_15_m2.glb")
  );
  const texture = useTexture(screenUrl || assetUrl("textures/yellow.png"));
  React.useEffect(() => {
    texture.center.set(0.5, 0.5);
    // Rotate 90 degrees counterclockwise to fix the sideways orientation
    texture.rotation = Math.PI / 2;
    // Flip Y to correct the upside-down orientation
    texture.flipY = true;
    // Center the texture properly on the wide MacBook screen
    texture.offset.set(0.1, 0.5);
    // Adjust for MacBook's wide screen: X should be much larger than Y
    // X (width) needs more repetition, Y (height) needs less
    texture.repeat.set(1, 2);
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <group ref={modelRef} {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_6.geometry}
          material={materials["Aluminum_-_Anodized_Glossy_Grey"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_8.geometry}
          material={materials["Aluminum_-_Anodized_Glossy_Grey_keyboard.jpg"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_10.geometry}
          material={materials["Glass_-_Heavy_Color"]}
        >
          <meshStandardMaterial roughness={1} map={texture} />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_12.geometry}
          material={materials["Plastic_-_Translucent_Matte_Gray"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_14.geometry}
          material={materials.Acrylic_Clear}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_16.geometry}
          material={materials["Bronze_-_Polished"]}
        ></mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_18.geometry}
          material={materials["Rubber_-_Soft"]}
        >
          {/*ALMOST */}
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_20.geometry}
          material={materials["Steel_-_Satin"]}
        />
        {/* Screen mesh with texture */}
        {/* <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_10.geometry}
        ></mesh> */}
      </group>
    </group>
  );
}

useGLTF.preload(assetUrl("scenes/mackbook_air_15_m2.glb"));

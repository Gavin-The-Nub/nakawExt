"use client"
import React, { useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three"
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function Macbook(props : any) {
  const { nodes, materials } = useGLTF("scenes/macbook_pro.glb");
  const texture = useTexture("/textures/yellow.png");
  const modelRef = useRef<THREE.Group>(null);
    useGSAP(() => {
      const proxy = document.querySelector("#scroll-proxy");
      if (!modelRef.current || !proxy) return;
  
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: proxy,
          start: "top top",
          end: "bottom top",
          scrub: true,
          pin: true,
        },
      });
  
      tl.to(modelRef.current.rotation, {
        y: Math.PI * 2,
        ease: "none",
      });
  
      return () => {
        tl.scrollTrigger?.kill();
      };
    }, []);
  
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

useGLTF.preload("scenes/macbook_pro.glb");

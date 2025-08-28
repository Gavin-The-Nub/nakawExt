"use client"
import { useLoaderStore } from "@/components/Loader";
import { useGSAP } from "@gsap/react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three"

gsap.registerPlugin(ScrollTrigger);
export default function Model(props : any) {
  const modelRef = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF("/scenes/iphone.glb");
  const texture = useTexture("/textures/yellow.png");
  const [hasRendered, setHasRendered] = useState(false);
  const setLoading = useLoaderStore((s) => s.setLoading);

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


  useEffect(() => {
    setLoading(true);
  }, []);

  useFrame(() => {
    if (modelRef.current && !hasRendered) {
      setHasRendered(true);
      setLoading(false);
    }
  });


  return (
    <group ref={modelRef} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.ttmRoLdJipiIOmf as THREE.Mesh).geometry}
        material={materials.hUlRcbieVuIiOXG}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.DjsDkGiopeiEJZK as THREE.Mesh).geometry}
        material={materials.PaletteMaterial001}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.buRWvyqhBBgcJFo as THREE.Mesh).geometry}
        material={materials.PaletteMaterial002}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.MrMmlCAsAxJpYqQ_0 as THREE.Mesh).geometry}
        material={materials.dxCVrUCvYhjVxqy}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.wqbHSzWaUxBCwxY_0 as THREE.Mesh).geometry}
        material={materials.MHFGNLrDQbTNima}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.QvGDcbDApaGssma as THREE.Mesh).geometry}
        material={materials.kUhjpatHUvkBwfM}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.vFwJFNASGvEHWhs as THREE.Mesh).geometry}
        material={materials.RJoymvEsaIItifI}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.evAxFwhaQUwXuua as THREE.Mesh).geometry}
        material={materials.KSIxMqttXxxmOYl}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.USxQiqZgxHbRvqB as THREE.Mesh).geometry}
        material={materials.mcPrzcBUcdqUybC}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.TvgBVmqNmSrFVfW as THREE.Mesh).geometry}
        material={materials.pIhYLPqiSQOZTjn}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.GuYJryuYunhpphO as THREE.Mesh).geometry}
        material={materials.eShKpuMNVJTRrgg}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.pvdHknDTGDzVpwc as THREE.Mesh).geometry}
        material={materials.xdyiJLYTYRfJffH}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.CfghdUoyzvwzIum as THREE.Mesh).geometry}
        material={materials.jpGaQNgTtEGkTfo}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.DjdhycfQYjKMDyn as THREE.Mesh).geometry}
        material={materials.ujsvqBWRMnqdwPx}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.usFLmqcyrnltBUr as THREE.Mesh).geometry}
        material={materials.sxNzrmuTqVeaXdg}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.xXDHkMplTIDAXLN as THREE.Mesh).geometry}
        material={materials.pIJKfZsazmcpEiU}
        scale={0.35}
      >
        <meshStandardMaterial roughness={1} map={texture} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.vELORlCJixqPHsZ as THREE.Mesh).geometry}
        material={materials.zFdeDaGNRwzccye}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.EbQGKrWAqhBHiMv as THREE.Mesh).geometry}
        material={materials.TBLSREBUyLMVtJa}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.EddVrWkqZTlvmci as THREE.Mesh).geometry}
        material={materials.xNrofRCqOXXHVZt}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.KSWlaxBcnPDpFCs as THREE.Mesh).geometry}
        material={materials.yQQySPTfbEJufve}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.TakBsdEjEytCAMK as THREE.Mesh).geometry}
        material={materials.PaletteMaterial003}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.IykfmVvLplTsTEW as THREE.Mesh).geometry}
        material={materials.PaletteMaterial004}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.wLfSXtbwRlBrwof as THREE.Mesh).geometry}
        material={materials.oZRkkORNzkufnGD}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.WJwwVjsahIXbJpU as THREE.Mesh).geometry}
        material={materials.yhcAXNGcJWCqtIS}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.YfrJNXgMvGOAfzz as THREE.Mesh).geometry}
        material={materials.bCgzXjHOanGdTFV}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.DCLCbjzqejuvsqH as THREE.Mesh).geometry}
        material={materials.vhaEJjZoqGtyLdo}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.CdalkzDVnwgdEhS as THREE.Mesh).geometry}
        material={materials.jlzuBkUzuJqgiAK}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.NtjcIgolNGgYlCg as THREE.Mesh).geometry}
        material={materials.PpwUTnTFZJXxCoE}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.pXBNoLiaMwsDHRF as THREE.Mesh).geometry}
        material={materials.yiDkEwDSyEhavuP}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.IkoiNqATMVoZFKD as THREE.Mesh).geometry}
        material={materials.hiVunnLeAHkwGEo}
        scale={0.35}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.rqgRAGHOwnuBypi as THREE.Mesh).geometry}
        material={materials.HGhEhpqSBZRnjHC}
        scale={0.35}
      />
    </group>
  );
}

useGLTF.preload("/scenes/iphone.glb");

import React, { useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";

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
  const { nodes, materials } = useGLTF(assetUrl("scenes/apple_ipad_pro.glb"));
  const texture = useTexture(screenUrl || assetUrl("textures/yellow.png"));
  React.useEffect(() => {
    texture.flipY = false;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <group {...props} dispose={null}>
      <group
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[-3, 3, 3]}
        position={[0, -1.5, 0]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.iPad_Pro_2020_Body_0.geometry}
          material={materials.Body}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.iPad_Pro_2020_screen_0.geometry}
          material={materials.screen}
        >
          <meshStandardMaterial roughness={1} map={texture} />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.iPad_Pro_2020_bezel_0.geometry}
          material={materials.bezel}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_module_Body_0.geometry}
          material={materials.Body}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_module_glass_0.geometry}
          material={materials.glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_module2_camera2_0.geometry}
          material={materials.camera2}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_cameraframe_and_logo_0.geometry}
          material={materials.cameraframe_and_logo}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_glass_0.geometry}
          material={materials.glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera1_camera1_0.geometry}
          material={materials.camera1}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["camera1_camera1(2)_0"].geometry}
          material={materials.camera12}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera2_camera2_0.geometry}
          material={materials.camera2}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.LiDar_LiDar_0.geometry}
          material={materials.LiDar}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera1001_camera1_0.geometry}
          material={materials.camera1}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["camera1001_camera1(2)_0"].geometry}
          material={materials.camera12}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_module2001_camera2001_0.geometry}
          material={materials["camera2.001"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_module2001_Camera_Flash_0.geometry}
          material={materials.Camera_Flash}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.camera_module2001_Mic_0.geometry}
          material={materials.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Apple_logo_cameraframe_and_logo_0.geometry}
          material={materials.cameraframe_and_logo}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Connector__0.geometry}
          material={materials.material_12}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Front_camera_front_camera_0.geometry}
          material={materials.front_camera}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Front_camera_camera1(2)_0"].geometry}
          material={materials.camera12}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Front_camera_glass_0.geometry}
          material={materials.glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Speakers_Mic_0.geometry}
          material={materials.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Speakers_Body_0.geometry}
          material={materials.Body}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.power_button_Body_0.geometry}
          material={materials.Body}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Volume_button_Body_0.geometry}
          material={materials.Body}
        />

        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Line_Line_0.geometry}
          material={materials.Line}
          position={[0, 0.017, 0.768]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(assetUrl("scenes/apple_ipad_pro.glb"));

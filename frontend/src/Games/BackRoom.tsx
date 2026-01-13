import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define a more specific GLTF type for your model
// You'll need to inspect your .glb file or its generated types to fill this out precisely.
// For most common cases, it often looks something like this:
interface EarthHologramGLTF extends GLTF {
  nodes: {
    earth_Material001_0: THREE.Mesh;
    holo_room_metal4_0: THREE.Mesh;
    holo_room_Purple_Emission_0: THREE.Mesh;
    holo_room_Blue_Emission_0: THREE.Mesh;
    holo_room_Orange_Emission_0: THREE.Mesh;
    holo_room_Yellow_Emission_0: THREE.Mesh;
    holo_room_metal_0: THREE.Mesh;
    holo_room_metal2_0: THREE.Mesh;
    holo_room_metal3_0: THREE.Mesh;
    boards_metal_0: THREE.Mesh;
    boards_Blue_Emission_0: THREE.Mesh;
    rings_Material006_0: THREE.Mesh;
    // Add all other specific mesh names you access, e.g.,
    // some_other_node: THREE.Mesh;
  };
  materials: {
    ['Material.001']: THREE.Material;
    metal4: THREE.Material;
    Purple_Emission: THREE.Material;
    Blue_Emission: THREE.Material;
    Orange_Emission: THREE.Material;
    Yellow_Emission: THREE.Material;
    metal: THREE.Material;
    metal2: THREE.Material;
    metal3: THREE.Material;
    ['Material.006']: THREE.Material;
    // Add all other specific material names you access, e.g.,
    // some_other_material: THREE.Material;
  };
}

const BackRoom = (props: Record<string, unknown>) => {
  const group = useRef<THREE.Group>(null);
  // Use the specific interface here
  const gltf = useGLTF('/models/earth_hologram.glb') as unknown as EarthHologramGLTF & { animations: THREE.AnimationClip[] };
  const { nodes, materials } = gltf;
  const { actions } = useAnimations(gltf.animations, group);

  // Play animation when component mounts
  useEffect(() => {
    if (actions) {
      const animationName = Object.keys(actions)[0]; // Get first available animation
      if (animationName) {
        actions[animationName]?.play();
      }
    }
  }, [actions]);

  // Fallback rotation if animation doesn't work
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.0005; // Slow rotation
    }
  });

  if (!nodes || !materials) return null; // Prevent crashes if data is missing

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]} scale={0.007}>
          <group name="b10b0b2d3f0741fa8ef24abb7586b618fbx" rotation={[Math.PI / 2, 0, 0]}>
            <group name="Object_2">
              <group name="RootNode">
                <group
                  name="earth"
                  position={[0, 88.768, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}>
                  <mesh
                    name="earth_Material001_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.earth_Material001_0.geometry}
                    material={materials['Material.001']}
                  />
                </group>
                <group
                  name="Camera"
                  position={[866.735, 607.999, -990.066]}
                  rotation={[-Math.PI, -0.852, 2.709]}
                  scale={100}>
                  <group name="Object_7" />
                </group>
                <group
                  name="holo_room"
                  position={[0, -66.659, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={[100, 100, 40]}>
                  <mesh
                    name="holo_room_metal4_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_metal4_0.geometry}
                    material={materials.metal4}
                  />
                  <mesh
                    name="holo_room_Purple_Emission_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_Purple_Emission_0.geometry}
                    material={materials.Purple_Emission}
                  />
                  <mesh
                    name="holo_room_Blue_Emission_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_Blue_Emission_0.geometry}
                    material={materials.Blue_Emission}
                  />
                  <mesh
                    name="holo_room_Orange_Emission_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_Orange_Emission_0.geometry}
                    material={materials.Orange_Emission}
                  />
                  <mesh
                    name="holo_room_Yellow_Emission_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_Yellow_Emission_0.geometry}
                    material={materials.Yellow_Emission}
                  />
                  <mesh
                    name="holo_room_metal_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_metal_0.geometry}
                    material={materials.metal}
                  />
                  <mesh
                    name="holo_room_metal2_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_metal2_0.geometry}
                    material={materials.metal2}
                  />
                  <mesh
                    name="holo_room_metal3_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.holo_room_metal3_0.geometry}
                    material={materials.metal3}
                  />
                </group>
                <group name="boards" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh
                    name="boards_metal_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.boards_metal_0.geometry}
                    material={materials.metal}
                  />
                  <mesh
                    name="boards_Blue_Emission_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.boards_Blue_Emission_0.geometry}
                    material={materials.Blue_Emission}
                  />
                </group>
                <group
                  name="rings"
                  position={[0, 88.768, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={172.427}>
                  <mesh
                    name="rings_Material006_0"
                    castShadow
                    receiveShadow
                    geometry={nodes.rings_Material006_0.geometry}
                    material={materials['Material.006']}
                  />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

useGLTF.preload('/models/earth_hologram.glb');

export default BackRoom;
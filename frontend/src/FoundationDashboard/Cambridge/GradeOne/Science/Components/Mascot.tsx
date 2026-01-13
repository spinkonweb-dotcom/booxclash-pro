// // src/components/Mascot.tsx
// import React from "react";
// import mascotGif from "/fine.gif"; // Your mascot GIF

// // Define NodePosition type if not imported from elsewhere
// type NodePosition = {
//   x: number;
//   y: number;
// };

// interface MascotProps {
//   position: NodePosition | null;
//   isMobile: boolean;
// }

// const Mascot: React.FC<MascotProps> = ({ position, isMobile }) => {
//   if (!position) return null;

//   const { x, y } = position;
//   const width = isMobile ? 160 : 200;
//   const height = isMobile ? 160 : 200;

//   const offsetX = width / 2;
//   const offsetY = isMobile ? height : height * 0.9;

//   return (
//     <div
//       className="absolute z-10 pointer-events-none"
//       style={{
//         width: `${width}px`,
//         height: `${height}px`,
//         transform: `translate(${x - offsetX}px, ${y - offsetY}px)`,
//         transition: "transform 0.8s cubic-bezier(0.42, 0, 0.58, 1)",
//         backgroundImage: `url("${mascotGif}")`,
//         backgroundSize: "contain",
//         backgroundRepeat: "no-repeat",
//       }}
//     />
//   );
// };


// export default Mascot;

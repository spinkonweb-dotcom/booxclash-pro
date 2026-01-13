import { PerspectiveCamera } from "@react-three/drei"
import BackRoom from "./BackRoom"
import { Suspense } from "react"
import CanvasLoader from "./CanvasLoader"
import { Canvas } from "@react-three/fiber"
import { useMediaQuery } from "react-responsive"
import { useNavigate } from "react-router-dom"
import Navbar from '../Navbar';

const Hero = () => {
    const isMobile = useMediaQuery({maxWidth:768})
    const navigate = useNavigate();

  return (
    <section className="min-h-screen w-full flex flex-col relative">
    <Navbar />
        <div className="w-full h-138 mx-auto flex flex-col c-space gap-3 z-10  rounded-lg  p-5 sm:p-10">
            <p className="sm:text-xl text-xl font-medium  text-yellow-200 text-center mt-40  w-100 h-10 mx-auto z-10 font-generalsans">
                Hi Welcome To BooxClash!
            </p>
            <p className=" text-4xl text-white text-center font-bold z-10 font-generalsans">
            The Ultimate Clash of Knowledge!
            </p>
            <button onClick={() => navigate('/knockout-lobby')} className="sm:text-2xl text-xl hover:text-white cursor-pointer font-medium z-10 text-black mt-8  bg-yellow-200 hover:bg-purple-950 text-center mx-auto p-2 w-30 rounded font-generalsans">
                PLAY
            </button>
        </div>
        <div className="w-full h-full insert-0 absolute">
            <Canvas className="w-full h-full">
                <Suspense fallback ={<CanvasLoader/>}>
                <PerspectiveCamera makeDefault position={[0,0,30]}/>
                <BackRoom 
                // scale={0.05} 
                // position={[0, 0, 0]} 
                // rotation={[0, -Math.PI / 2, 0]} 
                position = {isMobile ? [0, -4, 0] : [0, -2, 0]}
                rotation = {[0, 0, 0]}
                scale = {isMobile ? 4 : 5}
                args={[]}
                />
                
                <ambientLight intensity={1}/>
                <directionalLight position={[10,10,10]} intensity={0.5}/>
                </Suspense>
            </Canvas>
        </div>
    </section>
  )
}

export default Hero
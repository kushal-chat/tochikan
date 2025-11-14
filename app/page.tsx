import Map from "./components/map"
import ChatBubble from "./components/chat"

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <Map/>
      <div className="absolute bottom-4 left-4 z-10">
        <ChatBubble />
      </div>
    </div>
  );
}
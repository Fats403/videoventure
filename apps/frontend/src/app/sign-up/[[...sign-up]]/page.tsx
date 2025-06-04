import HeroBg from "@/components/ui/hero-bg";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative flex justify-center items-center h-screen overflow-hidden">
      <div className="absolute inset-0">
        <HeroBg />
      </div>
      <div className="relative z-10">
        <SignUp />
      </div>
    </div>
  );
}

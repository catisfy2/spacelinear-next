"use client";

import Image from "next/image";

interface CarouselSlideProps {
  illustration: React.ReactNode;
  children: React.ReactNode;
}

export function CarouselSlide({ illustration, children }: CarouselSlideProps) {
  return (
    <div className="bg-[#faf9f5] flex flex-col items-start justify-between px-[60px] py-[8vh] h-full w-full">
      <div className="flex gap-3 items-center shrink-0">
        <div className="relative size-8">
          <Image
            src="/assets/subtract.svg"
            alt="SpaceLinear"
            fill
            className="object-contain"
          />
        </div>
        <p className="font-medium text-[clamp(20px,3vw,29px)] text-black font-['Inter'] whitespace-nowrap">
          SpaceLinear
        </p>
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-4">
        {illustration}
      </div>
      <div className="flex flex-col items-start font-['Inter'] font-medium text-black shrink-0">
        {children}
      </div>
    </div>
  );
}

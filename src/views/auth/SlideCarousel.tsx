"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { CarouselSlide } from "./CarouselSlide";

function SlideOneIllustration() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-[500px] max-h-[55vh]">
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "55%", top: "15%", width: "24%", height: "25%" }}
          >
            <div className="flex-none rotate-[-9.12deg] w-full h-full">
              <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
                <Image
                  src="/assets/flashcard-vector-art.png"
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div
            className="absolute bg-white rounded-lg overflow-hidden shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]"
            style={{ left: "18%", top: "16%", width: "18%", height: "32%" }}
          >
            <div className="relative w-full h-full">
              <Image
                src="/assets/pdf-vector-art.png"
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "0%", top: "58%", width: "22%", height: "24%" }}
          >
            <div className="flex-none rotate-[12.07deg] w-full h-full">
              <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
                <Image
                  src="/assets/notes-vector-art.png"
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "72%", top: "60%", width: "18%", height: "24%" }}
          >
            <div className="flex-none rotate-[12.07deg] w-full h-full">
              <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
                <Image
                  src="/assets/quiz-vector-art.png"
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: "0", width: "45%", height: "60%" }}
          >
            <Image
              src="/assets/mochi-1.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideTwoIllustration() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-[500px] max-h-[55vh]">
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "28%", top: "12%", width: "5%", height: "5%" }}
          >
            <div className="flex-none rotate-[-13.08deg] w-full h-full">
              <div className="relative w-full h-full">
                <Image src="/assets/vector-1.svg" alt="" fill className="object-contain" />
              </div>
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ right: "25%", top: "12%", width: "5%", height: "6%" }}
          >
            <div className="flex-none rotate-[21.78deg] w-full h-full">
              <div className="relative w-full h-full">
                <Image src="/assets/vector-2.svg" alt="" fill className="object-contain" />
              </div>
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "47%", top: "8%", width: "5%", height: "5%" }}
          >
            <div className="flex-none rotate-[8.38deg] w-full h-full">
              <div className="relative w-full h-full">
                <Image src="/assets/vector-3.svg" alt="" fill className="object-contain" />
              </div>
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "25%", top: "38%", width: "3%", height: "3%" }}
          >
            <div className="flex-none rotate-[8.38deg] w-full h-full">
              <div className="relative w-full h-full">
                <Image src="/assets/vector-4.svg" alt="" fill className="object-contain" />
              </div>
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ right: "15%", top: "37%", width: "3%", height: "3%" }}
          >
            <div className="flex-none rotate-[-16.33deg] w-full h-full">
              <div className="relative w-full h-full">
                <Image src="/assets/vector-5.svg" alt="" fill className="object-contain" />
              </div>
            </div>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: "0", width: "45%", height: "60%" }}
          >
            <Image
              src="/assets/mochi-1.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideThreeIllustration() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-[420px] max-h-[45vh]">
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <Image
              src="/assets/product-image.png"
              alt=""
              fill
              className="object-cover object-top"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const slideComponents = [
  {
    id: 0,
    illustration: <SlideOneIllustration />,
    content: (
      <>
        <p className="text-[clamp(28px,4vw,51px)]">Manage your study</p>
        <p className="text-[clamp(24px,3.5vw,45px)]">in one place</p>
        <p className="text-[clamp(16px,2.2vw,29px)] max-w-[469px]">
          with AI powered topic generation and resource collection!
        </p>
      </>
    ),
  },
  {
    id: 1,
    illustration: <SlideTwoIllustration />,
    content: (
      <>
        <p className="text-[clamp(14px,1.8vw,22px)]">Introducing</p>
        <p className="text-[clamp(28px,4vw,51px)] whitespace-nowrap">Mochi</p>
        <p className="text-[clamp(18px,2.5vw,30px)]">
          Your AI pet, which tracks your study!
        </p>
      </>
    ),
  },
  {
    id: 2,
    illustration: <SlideThreeIllustration />,
    content: (
      <>
        <p className="text-[clamp(28px,4vw,51px)] w-full">Master any topics</p>
        <p className="text-[clamp(18px,2.5vw,33px)] w-full">
          with Spaced Repetition method and Quiz test
        </p>
      </>
    ),
  },
];

export function SlideCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slideComponents.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slideComponents.map((slide, i) => (
          <div key={slide.id} className="min-w-full h-full">
            <CarouselSlide illustration={slide.illustration}>
              {slide.content}
            </CarouselSlide>
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slideComponents.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-black w-8"
                : "bg-black/30 hover:bg-black/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

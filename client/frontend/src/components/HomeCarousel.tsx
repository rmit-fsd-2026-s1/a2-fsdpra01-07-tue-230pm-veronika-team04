import Image from "next/image";
import { useState } from "react";

const slides = [
  {
    heading: "Smarter venue discovery for every event.",
    paragraph:
      "Browse suitable venues, compare options with clarity, and move from interest to application in a simpler workflow.",
    imageSrc: "/carousel_pic1.jpg",
    imageAlt: "Venue carousel image 1",
  },
  {
    heading: "Designed for quality venues and transparent decisions.",
    paragraph:
      "Venue Vendors brings together strong venue opportunities and a fairer, more organised hiring experience for every user.",
    imageSrc: "/carousel_pic2.jpg",
    imageAlt: "Venue carousel image 2",
  },
];

export default function HomeCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = slides[activeSlide];

  return (
    <section
      className="overflow-hidden rounded-[28px] px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10"
      style={{ backgroundColor: "#095d44" }}
    >
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="max-w-xl">
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            {currentSlide.heading}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/85 sm:text-base">
            {currentSlide.paragraph}
          </p>

          <div className="mt-8 flex items-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.heading}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-3 rounded-full transition-all ${
                  activeSlide === index ? "w-10 bg-white" : "w-3 bg-white/45"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] bg-white/10">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={currentSlide.imageSrc}
              alt={currentSlide.imageAlt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

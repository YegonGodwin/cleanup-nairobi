import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Login from "./Login";
import MapView from "./MapView";
import {
  Trash2,
  Smartphone,
  BarChart3,
  Menu,
  X,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

// Define the images for the Hero Section Slider (themed around cleanup and Nairobi)
const HERO_IMAGES = [
  "./assets/one.jpeg",
  "./assets/two.jpeg",
  "./assets/three.jpeg",
  "./assets/download.jpeg",
  "./assets/four.jpeg",
];

// --- New ImageSlider Component for Background ---
const ImageSlider = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Set up the interval for automatic sliding
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds (5000ms)

    return () => clearInterval(interval); // Cleanup on unmount
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      {images.map((url, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out`}
          style={{
            backgroundImage: `url('${url}')`,
            // Fade effect: only the current image has full opacity (1), others are hidden (0)
            opacity: index === currentImageIndex ? 1 : 0,
            // Subtle zoom-out effect for dynamic background movement
            transform: `scale(${index === currentImageIndex ? 1.05 : 1})`,
            transition: "opacity 1s ease-in-out, transform 5s ease-in-out",
          }}
        />
      ))}
    </div>
  );
};
// -------------------------------------------------

// The Main App Component
const LandingPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- Helper Components ---

  const NavLink = ({ href, children }) => (
    <a
      href={href}
      className="text-gray-700 hover:text-green-600 font-semibold text-base transition-colors duration-300"
    >
      {children}
    </a>
  );

  const FeatureCard = ({ Icon, title, description }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="p-3 mb-4 rounded-full bg-green-100 text-green-700">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  const ProblemSolutionItem = ({ Icon, text, isProblem }) => (
    <div className="flex items-center space-x-2 text-sm md:text-base">
      <Icon
        size={20}
        className={isProblem ? "text-red-500" : "text-green-600"}
      />
      <span
        className={`font-semibold ${
          isProblem ? "text-gray-600" : "text-gray-700"
        }`}
      >
        {text}
      </span>
    </div>
  );

  // --- Main Structure Components ---

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <CheckCircle
            className="text-green-600 w-7 h-7 sm:w-8 sm:h-8"
            strokeWidth={2.5}
          />
          <span className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight">
            <span className="hidden sm:inline">CleanUp Nairobi</span>
            <span className="sm:hidden">CleanUp</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <nav className="flex space-x-6">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </nav>

          <div className="flex items-center space-x-2">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition duration-300"
            >
              Get started
            </Link>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition duration-300"
            >
              Login
            </button>
          </div>
        </div>
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-xl border-t border-gray-200">
          <div className="flex flex-col p-4 space-y-3">
            {/* Navigation Links */}
            <a
              href="#home"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-semibold text-base transition-colors duration-300 py-2 px-2 rounded-md hover:bg-gray-50"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-semibold text-base transition-colors duration-300 py-2 px-2 rounded-md hover:bg-gray-50"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-semibold text-base transition-colors duration-300 py-2 px-2 rounded-md hover:bg-gray-50"
            >
              How It Works
            </a>
            <a
              href="#contact"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-semibold text-base transition-colors duration-300 py-2 px-2 rounded-md hover:bg-gray-50"
            >
              Contact
            </a>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Link
                to="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition duration-300 text-center"
              >
                Get started
              </Link>
              <button
                onClick={() => {
                  setIsLoginOpen(true);
                  setIsMenuOpen(false);
                }}
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition duration-300"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );

  const HeroSection = () => (
    // Height is set to ensure the dynamic background is visible.
    <div
      id="home"
      className="relative h-screen min-h-[600px] sm:min-h-[700px] pt-20 sm:pt-24 overflow-hidden"
    >
      {/* 1. Background Image Slider (Z-0) */}
      <ImageSlider images={HERO_IMAGES} />

      {/* 2. Dark Overlay to ensure Text Readability (Z-10) */}
      <div className="absolute inset-0 bg-gray-900/60 z-10"></div>

      {/* 3. Content Wrapper (Z-20) */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center text-white">
            {/* Left Content (Text and Button) */}
            <div className="text-center md:text-left p-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight mb-4 drop-shadow-lg">
                Transforming Waste into a{" "}
                <span className="text-green-400">Cleaner Nairobi</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 mb-8 sm:mb-10 drop-shadow max-w-2xl mx-auto md:mx-0">
                A Smart Waste Management System for a Sustainable Future.
              </p>
              <button className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-bold rounded-full shadow-2xl text-gray-900 bg-green-400 hover:bg-green-300 transition duration-300 transform hover:scale-105 w-full sm:w-auto">
                Download the App
              </button>
            </div>

            {/* Right Image Mockup */}
            <div className="flex justify-center md:justify-end p-4 mt-8 md:mt-0">
              {/* This is a stylized mockup to match the image */}
              <div className="relative w-48 h-72 sm:w-56 sm:h-80 md:w-64 md:h-96 bg-gray-900 rounded-[25px] sm:rounded-[30px] md:rounded-[35px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-[4px] sm:border-[5px] md:border-[6px] border-gray-800 p-1">
                {/* Phone screen placeholder */}
                <div className="w-full h-full bg-white rounded-[21px] sm:rounded-[25px] md:rounded-[29px] overflow-hidden">
                  <MapView />
                </div>
                {/* Home indicator/notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-14 md:w-16 h-1 sm:h-1.5 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProblemSolutionSection = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">
        The Problem & Our Solution
      </h2>
      <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-12">
        {/* Problems */}
        <div className="flex flex-col space-y-4">
          <ProblemSolutionItem
            Icon={ArrowRight}
            text="Informal Dumping"
            isProblem={true}
          />
          <ProblemSolutionItem
            Icon={ArrowRight}
            text="Inefficient Collection"
            isProblem={true}
          />
        </div>

        {/* Solutions */}
        <div className="flex flex-col space-y-4">
          <ProblemSolutionItem
            Icon={CheckCircle}
            text="Optimized Routes"
            isProblem={false}
          />
          <ProblemSolutionItem
            Icon={CheckCircle}
            text="Real-time Analytics"
            isProblem={false}
          />
        </div>
      </div>
    </div>
  );

  const FeaturesSection = () => (
    <div
      id="features"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white"
    >
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
        Key Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          Icon={Trash2}
          title="Smart Bins & Collection"
          description="Sensors track fill-levels to minimize bins that overflow and optimize collection times."
        />
        <FeatureCard
          Icon={Smartphone}
          title="Citizen Reporting App"
          description="Easy, geo-tagged reporting in a few clicks to notify officials of illegal dumps and issues."
        />
        <FeatureCard
          Icon={BarChart3}
          title="Data-Driven Insights"
          description="Real-time data feeds local government and private collectors with actionable performance metrics."
        />
      </div>
    </div>
  );

  const CommunitySection = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative isolate overflow-hidden rounded-2xl">
        {/* Background Image replicating the multi-person image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-gray-800 opacity-80"
          style={{
            backgroundImage: `url('https://placehold.co/1200x500/10b981/ffffff?text=Group+of+CleanUp+Volunteers')`,
            backgroundBlendMode: "multiply",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.backgroundImage = `url('https://placehold.co/1200x500/10b981/ffffff?text=Group+of+CleanUp+Volunteers')`;
          }}
        />

        {/* Overlay Darkening and Content */}
        <div className="relative p-12 md:p-24 text-center text-white bg-gray-900/50">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            Join the Movement. Let's Build a Cleaner Nairobi Together
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Become a part of the solution by reporting issues and supporting
            efficient waste management.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4">
            <button className="px-6 sm:px-8 py-3 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-green-600 hover:bg-green-700 transition duration-300 w-full sm:w-auto">
              Get Involved
            </button>
            <button className="px-6 sm:px-8 py-3 text-base font-semibold rounded-full shadow-lg text-white bg-transparent border-2 border-white hover:bg-white hover:text-green-700 transition duration-300 w-full sm:w-auto">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Footer = () => (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} CleanUp Nairobi. All rights
          reserved. | Built with purpose.
        </p>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <Header />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <CommunitySection />
        {/* Placeholder sections to complete the navigation links */}
        <div id="how-it-works" className="h-4 bg-gray-50"></div>
        <div id="contact" className="h-4 bg-gray-50"></div>
      </main>
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <Footer />
    </div>
  );
};

export default LandingPage;

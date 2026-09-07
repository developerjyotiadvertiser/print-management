import { useEffect, useState } from "react";

const OFFICE_LATITUDE = Number(import.meta.env.VITE_OFFICE_LATITUDE);
const OFFICE_LONGITUDE = Number(import.meta.env.VITE_OFFICE_LONGITUDE);
const ALLOWED_DISTANCE = Number(import.meta.env.VITE_ALLOWED_DISTANCE);

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LocationGuard = ({ children }) => {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  const checkLocation = () => {
    setStatus("checking");
    setMessage("");
    if (!navigator.geolocation) {
      setStatus("denied");
      setMessage("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const distance = calculateDistance(
          OFFICE_LATITUDE,
          OFFICE_LONGITUDE,
          latitude,
          longitude,
        );

        if (distance <= ALLOWED_DISTANCE) {
          setStatus("allowed");
        } else {
          setStatus("denied");
          setMessage(
            `Access is restricted. You must be within ${ALLOWED_DISTANCE} meters of the office location.`,
          );
        }
      },
      (error) => {
        setStatus("denied");
        if (error.code === 1) {
          setMessage(
            "Location access was denied. Please allow location permission to access this application.",
          );
        } else if (error.code === 2) {
          setMessage(
            "Your current location could not be determined. Please enable GPS or location services.",
          );
        } else {
          setMessage("Location request timed out. Please try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  useEffect(() => {
    checkLocation();
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Checking your location...</h2>
          <p className="text-gray-500 mt-2">Please allow location access.</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="max-w-md w-full text-center border rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-red-600">Access Restricted</h2>
          <p className="text-gray-600 mt-4">{message}</p>
          <button
            onClick={checkLocation}
            className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            Check Location Again
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default LocationGuard;

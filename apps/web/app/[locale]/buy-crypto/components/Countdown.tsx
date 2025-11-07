import React, { useEffect, useState } from "react";

import Svg from "@/components/atoms/Svg";

const CountdownTimer = ({ validUntil }: { validUntil: string }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(validUntil));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(validUntil));
    }, 1000);

    return () => clearInterval(interval); // Clear the interval when the component is unmounted
  }, [validUntil]);

  function getTimeLeft(validUntil: string) {
    const validUntilDate = new Date(validUntil);
    const currentDate = new Date();
    const difference = validUntilDate.getTime() - currentDate.getTime();

    if (difference <= 0) {
      return "Time is up!";
    }

    // const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${minutes}m ${seconds}s`;
  }

  return (
    <div className="flex justify-center mt-3">
      <div className="flex gap-1 items-center py-1 pl-1 pr-3 rounded-20 bg-tertiary-bg text-12 md:text-14">
        <Svg iconName="time" className="text-tertiary-text" size={20} />
        <span>Timer:</span>
        <p>{timeLeft}</p>
      </div>
    </div>
  );
};

export default CountdownTimer;

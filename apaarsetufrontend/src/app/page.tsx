"use client";

import { useState } from "react";
import Welcome from "@/components/Welcome";
import OfficialsLogin from "@/components/OfficialsLogin";

export default function Home() {
  const [step, setStep] = useState(1);

  return (
    <div>
      {step === 1 && <Welcome nextStep={setStep} />}
      {step === 2 && <OfficialsLogin />}
    </div>
  );
}

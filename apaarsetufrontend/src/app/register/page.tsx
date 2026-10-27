'use client'
import OfficialsLogin from '@/components/OfficialsLogin'
import Welcome from '@/components/Welcome'
import React, { useState } from 'react'

function Register() {
    const [step,setStep]=useState(1)
  return (
    <div>
      {step==1 ? <Welcome nextStep={setStep}/> : <OfficialsLogin/>}
    </div>
  )
}

export default Register

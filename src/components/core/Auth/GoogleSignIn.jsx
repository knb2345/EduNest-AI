import { useEffect, useState } from "react"
import { FcGoogle } from "react-icons/fc"

import { GOOGLE_AUTH_API, GOOGLE_STATUS_API } from "../../../services/apis"
import { apiConnector } from "../../../services/apiConnector"

export default function GoogleSignIn() {
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    apiConnector("GET", GOOGLE_STATUS_API)
      .then((response) => {
        if (active) setStatus(response.data.enabled ? "enabled" : "disabled")
      })
      .catch(() => {
        if (active) setStatus("disabled")
      })
    return () => {
      active = false
    }
  }, [])

  const enabled = status === "enabled"
  return (
    <div className="mt-6">
      <div className="flex items-center gap-x-2">
        <div className="h-[1px] flex-1 bg-richblack-700" />
        <span className="text-sm text-richblack-300">or</span>
        <div className="h-[1px] flex-1 bg-richblack-700" />
      </div>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => window.location.assign(GOOGLE_AUTH_API)}
        className="mt-4 flex w-full items-center justify-center gap-x-2 rounded-[8px] border border-richblack-700 bg-richblack-800 py-[10px] px-[12px] font-medium text-richblack-25 transition hover:bg-richblack-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FcGoogle className="text-xl" />
        {status === "disabled" ? "Google sign-in unavailable" : "Continue with Google"}
      </button>
      {status === "disabled" && (
        <p className="mt-2 text-center text-xs text-richblack-300">
          Configure Google OpenID Connect to enable this option.
        </p>
      )}
    </div>
  )
}

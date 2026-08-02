import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useNavigate, useSearchParams } from "react-router-dom"

import { completeGoogleLogin } from "../services/operations/authAPI"

const errorMessages = {
  account_conflict:
    "An EduNest account already uses this email. Sign in with its existing method; automatic linking is disabled.",
  unverified_email: "Google did not provide a verified email address.",
  not_configured: "Google sign-in is not configured for this environment.",
  invalid_request: "The Google sign-in request expired or could not be verified.",
  provider_error: "Google sign-in was cancelled or denied.",
  authentication_failed: "Google sign-in could not be completed safely.",
}

export default function GoogleAuthCallback() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    dispatch(
      completeGoogleLogin(
        navigate,
        error ? errorMessages[error] || errorMessages.authentication_failed : null
      )
    )
  }, [dispatch, error, navigate])

  return (
    <main className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-richblack-25">
      <div className="text-center">
        {!error && <div className="spinner mx-auto" />}
        <p className="mt-4">{error ? "Returning to sign in…" : "Completing secure Google sign-in…"}</p>
      </div>
    </main>
  )
}

import logoMark from "../../assets/Logo/Logo-Mark.svg"

const sizes = {
  small: {
    mark: "h-8 w-8",
    text: "text-lg",
  },
  default: {
    mark: "h-9 w-9 sm:h-10 sm:w-10",
    text: "text-lg sm:text-xl",
  },
}

export default function Brand({
  className = "",
  size = "default",
  tone = "light",
}) {
  const selectedSize = sizes[size] || sizes.default
  const textColor = tone === "dark" ? "text-richblack-900" : "text-richblack-5"

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <img
        src={logoMark}
        alt=""
        aria-hidden="true"
        className={`${selectedSize.mark} shrink-0`}
      />
      <span
        className={`${selectedSize.text} whitespace-nowrap font-semibold leading-none tracking-[-0.02em] ${textColor}`}
      >
        EduNest <span className="text-yellow-50">AI</span>
      </span>
    </span>
  )
}

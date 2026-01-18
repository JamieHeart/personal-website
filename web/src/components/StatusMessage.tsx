type StatusVariant = "info" | "warning" | "error";

type StatusMessageProps = {
  message: string;
  variant?: StatusVariant;
  className?: string;
};

export default function StatusMessage({
  message,
  variant = "info",
  className,
}: StatusMessageProps) {
  const role = variant === "error" ? "alert" : "status";
  const classes = ["status-message", `status-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role={role}>
      {message}
    </div>
  );
}

export type { StatusVariant };

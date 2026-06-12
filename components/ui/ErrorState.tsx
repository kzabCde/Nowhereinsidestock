type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
      <p className="section-kicker text-danger/60">Error</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-300">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 btn-premium text-xs"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

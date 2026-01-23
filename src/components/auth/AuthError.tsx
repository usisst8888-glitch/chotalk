interface AuthErrorProps {
  message: string | null;
}

export default function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;

  return (
    <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3">
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

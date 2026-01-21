interface AuthErrorProps {
  message: string | null;
}

export default function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;

  return <p className="text-red-500 text-sm">{message}</p>;
}

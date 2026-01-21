interface AuthButtonProps {
  loading: boolean;
  loadingText: string;
  children: React.ReactNode;
}

export default function AuthButton({ loading, loadingText, children }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
    >
      {loading ? loadingText : children}
    </button>
  );
}

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
      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
    >
      {loading ? loadingText : children}
    </button>
  );
}

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="w-full rounded-full border border-[#dc3545] px-5 py-2.5 text-sm font-semibold text-[#dc3545] transition-all hover:bg-[#dc3545] hover:text-white"
      >
        Sign Out
      </button>
    </form>
  );
}

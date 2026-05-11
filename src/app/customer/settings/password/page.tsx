import PasswordForm from "@/components/customer/password-form";

export default function CustomerPasswordPage() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Change password</h2>
      <p className="mb-5 text-xs text-gray-500">
        Use a strong password you don&apos;t reuse anywhere else.
      </p>
      <PasswordForm />
    </section>
  );
}

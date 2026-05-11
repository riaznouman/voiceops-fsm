import SettingsTabs from "@/components/customer/settings-tabs";

export default function CustomerSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <SettingsTabs />
        <div className="flex-1 max-w-xl">{children}</div>
      </div>
    </div>
  );
}

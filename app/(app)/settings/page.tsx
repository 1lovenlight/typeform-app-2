import { PageHeading } from "@/components/layout/page-heading";
import { SettingsFormItem } from "@/components/settings/settings-form-item";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { UpdateUsernameForm } from "@/components/settings/update-username-form";

export default function SettingsPage() {
  return (
    <div className="flex flex-col w-full">
      <PageHeading title="Settings" />
      <div className="flex flex-col gap-4 divide-y divide-border">
        <SettingsFormItem
          title="Username"
          description="Update your username."
          form={<UpdateUsernameForm />}
        />
        <SettingsFormItem
          title="Theme"
          description="Switch between themes."
          form={<ThemeSwitch />}
        />
        <SettingsFormItem
          title="Logout"
          description="Logout of your account."
          form={<LogoutButton />}
        />
      </div>
    </div>
  );
}

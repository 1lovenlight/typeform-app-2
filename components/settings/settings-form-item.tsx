export function SettingsFormItem({
  title,
  description,
  form,
}: {
  title: string;
  description: string;
  form: React.ReactNode;
}) {
  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-4 sm:gap-y-6 lg:gap-y-8 py-4 sm:py-6 md:grid-cols-3 lg:py-8">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
      </div>
      <form className="md:col-span-1">{form}</form>
    </div>
  );
}

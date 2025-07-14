
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";

export default function SettingsPage() {
  const { t } = useLocalization();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Settings')}</CardTitle>
        <CardDescription>{t('Manage your account settings.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t('Settings page content goes here.')}</p>
      </CardContent>
    </Card>
  );
}

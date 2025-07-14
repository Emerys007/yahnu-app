
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";

export default function SupportPage() {
  const { t } = useLocalization();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Support')}</CardTitle>
        <CardDescription>{t('Get help and support.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t('Support page content goes here.')}</p>
      </CardContent>
    </Card>
  );
}

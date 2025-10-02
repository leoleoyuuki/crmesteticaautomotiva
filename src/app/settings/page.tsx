import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Configurações</CardTitle>
            <CardDescription>Gerencie as configurações da sua conta e da aplicação.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-16">
                <h3 className="text-xl font-semibold">Em Construção</h3>
                <p>Esta página estará disponível em breve.</p>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Car, Users, BarChart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    O Futuro da Gestão para sua Estética Automotiva
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Organize seus clientes, gerencie serviços e impulsione seu negócio com o poder da Inteligência Artificial. Simples, intuitivo e poderoso.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">
                      Acessar minha conta
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/login">
                      Criar conta grátis
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://images.unsplash.com/photo-1616422285623-13ff0162193c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjYXIlMjBkZXRhaWxpbmd8ZW58MHx8fHwxNzU5NjgyNjM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Car Detailing"
                data-ai-hint="car detailing"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Nossos Recursos</div>
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Tudo que você precisa em um só lugar</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Desde o agendamento até a análise de crescimento, nosso CRM foi pensado para otimizar cada detalhe do seu dia a dia.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <div className="grid gap-1 text-center">
                <Car className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Gestão de Veículos</h3>
                <p className="text-sm text-muted-foreground">Cadastre múltiplos veículos por cliente e mantenha um histórico completo de serviços para cada um.</p>
              </div>
              <div className="grid gap-1 text-center">
                <Users className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Cadastro de Clientes</h3>
                <p className="text-sm text-muted-foreground">Mantenha todas as informações dos seus clientes organizadas e acessíveis em um único local.</p>
              </div>
              <div className="grid gap-1 text-center">
                <BarChart className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Insights com IA</h3>
                <p className="text-sm text-muted-foreground">Receba recomendações de serviços e previsões de vencimento para fidelizar seus clientes.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-headline tracking-tighter md:text-4xl/tight">
                Pronto para transformar sua gestão?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Junte-se a nós e leve sua estética automotiva para o próximo nível.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg">
                <Link href="/login">Comece agora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 CRM AutoEstética. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

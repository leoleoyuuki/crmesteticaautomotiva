'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Car, Users, BarChart, Sparkles, Zap, TrendingUp, Clock, Shield, Star, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";

export default function LandingPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <main className="flex-1 relative z-10">
        {/* 1. HERO SECTION - Captura inicial */}
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Powered by AI</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl">
                O Futuro da Gestão para sua{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Estética Automotiva
                </span>
              </h1>
              
              <p className="max-w-2xl text-lg md:text-xl text-gray-300">
                Organize seus clientes, gerencie serviços e impulsione seu negócio com o poder da Inteligência Artificial. Simples, intuitivo e poderoso.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 px-8 py-6 text-lg shadow-lg shadow-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105">
                  <Link href={user ? "/dashboard" : "/login"}>
                    {user ? "Ir para o dashboard" : "Comece grátis agora"}
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-8 py-6 text-lg transition-all hover:scale-105">
                  <Link href="#demo">
                    Ver demonstração
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-300 mt-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Cancele quando quiser</span>
                </div>
              </div>

              {/* Hero Image with glassmorphism frame */}
              <div className="mt-16 w-full max-w-5xl" id="demo">
                <div className="relative p-2 rounded-2xl bg-gradient-to-br from-purple-500/50 via-pink-500/50 to-blue-500/50">
                  <div className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/20">
                    <video
                      src="/videos/video.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full aspect-video object-cover"
                    ></video>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SOCIAL PROOF - Prova social e credibilidade */}
        <section className="w-full py-16 border-y border-white/10 bg-black/20 backdrop-blur-md">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <p className="text-sm text-gray-400 uppercase tracking-wide">Confiado por profissionais em todo Brasil</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-4xl">
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-sm text-gray-400">Negócios ativos</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-2">50K+</div>
                  <div className="text-sm text-gray-400">Clientes gerenciados</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-2">98%</div>
                  <div className="text-sm text-gray-400">Satisfação</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">Avaliação média</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURES - Benefícios principais */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <div className="inline-block rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm text-purple-300">
                Recursos Poderosos
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl">
                Tudo que você precisa para crescer
              </h2>
              <p className="max-w-2xl text-lg text-gray-300">
                Ferramentas profissionais que economizam seu tempo e aumentam seus resultados
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Car,
                  title: "Gestão de Veículos",
                  description: "Cadastre múltiplos veículos por cliente e mantenha um histórico completo de serviços para cada um.",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Users,
                  title: "Cadastro de Clientes",
                  description: "Mantenha todas as informações dos seus clientes organizadas e acessíveis em um único local.",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: BarChart,
                  title: "Insights com IA",
                  description: "Receba recomendações de serviços e previsões de vencimento para fidelizar seus clientes.",
                  gradient: "from-pink-500 to-rose-500"
                },
                {
                  icon: Clock,
                  title: "Agendamento Inteligente",
                  description: "Sistema de agendamento automático com lembretes e confirmações para seus clientes.",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: TrendingUp,
                  title: "Relatórios e Analytics",
                  description: "Acompanhe o crescimento do seu negócio com dashboards e métricas em tempo real.",
                  gradient: "from-orange-500 to-amber-500"
                },
                {
                  icon: Zap,
                  title: "Automações",
                  description: "Automatize follow-ups, lembretes e mensagens para economizar horas do seu dia.",
                  gradient: "from-violet-500 to-purple-500"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS - Como funciona */}
        <section className="w-full py-20 md:py-32 bg-black/20 backdrop-blur-md">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <div className="inline-block rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm text-purple-300">
                Simples e Rápido
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl">
                Comece em menos de 5 minutos
              </h2>
              <p className="max-w-2xl text-lg text-gray-300">
                Configuração rápida e intuitiva. Sem complicação, sem barreiras.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Crie sua conta",
                  description: "Cadastro rápido em menos de 1 minuto. Sem cartão de crédito necessário."
                },
                {
                  step: "02",
                  title: "Configure seu perfil",
                  description: "Personalize com as informações do seu negócio e serviços oferecidos."
                },
                {
                  step: "03",
                  title: "Comece a vender",
                  description: "Cadastre clientes, agende serviços e deixe a IA fazer o resto por você."
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-500/50">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. PRICING - Planos e preços */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <div className="inline-block rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm text-purple-300">
                Planos Flexíveis
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl">
                Escolha o plano ideal para você
              </h2>
              <p className="max-w-2xl text-lg text-gray-300">
                Comece grátis e faça upgrade quando precisar. Sem surpresas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "Grátis",
                  period: "para sempre",
                  description: "Perfeito para começar",
                  features: [
                    "Até 50 clientes",
                    "Gestão de veículos",
                    "Agendamentos básicos",
                    "Suporte por email"
                  ],
                  cta: "Começar grátis",
                  popular: false
                },
                {
                  name: "Professional",
                  price: "R$ 97",
                  period: "/mês",
                  description: "Para negócios em crescimento",
                  features: [
                    "Clientes ilimitados",
                    "IA e automações",
                    "Relatórios avançados",
                    "Suporte prioritário",
                    "WhatsApp integrado"
                  ],
                  cta: "Começar teste grátis",
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: "Personalizado",
                  period: "",
                  description: "Para grandes operações",
                  features: [
                    "Tudo do Professional",
                    "Múltiplas unidades",
                    "API dedicada",
                    "Suporte 24/7",
                    "Treinamento incluso"
                  ],
                  cta: "Falar com vendas",
                  popular: false
                }
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`relative p-8 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                    plan.popular
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-2xl shadow-purple-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                      Mais Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full py-6 text-lg transition-all hover:scale-105 ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    <Link href="/login">
                      {plan.cta}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. CTA FINAL - Conversão final */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-90"></div>
              <div className="relative px-8 py-16 md:py-24 text-center space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto">
                  Pronto para transformar sua gestão?
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-white/90">
                  Junte-se a centenas de profissionais que já estão usando IA para crescer seus negócios
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <Link href="/login">
                      Começar gratuitamente
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-white/80 mt-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Dados protegidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>Sem cartão necessário</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center z-10 w-full border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container flex flex-col sm:flex-row py-6 items-center justify-center px-4 md:px-6">
          <p className="text-sm text-gray-400">&copy; 2024 CRM AutoEstética. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

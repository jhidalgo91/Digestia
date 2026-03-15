export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-zinc-900 dark:to-zinc-800">
      <main className="flex flex-col items-center gap-8 p-8 text-center">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl">🥗</span>
          <h1 className="text-5xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            DigestAI
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300">
            Nutrición Inteligente · Plan Personalizado
          </p>
        </div>

        {/* Description */}
        <p className="max-w-md text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
          Seguimiento nutricional, hábitos saludables, suplementación y análisis
          con inteligencia artificial. Diseñado para pacientes y nutricionistas.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "📋 Diario Nutricional",
            "🔬 Biofeedback Digestivo",
            "💧 Hidratación",
            "😴 Sueño & Ayuno",
            "💊 Suplementos",
            "🤖 IA Personalizada",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm ring-1 ring-emerald-200 dark:bg-zinc-700/80 dark:text-emerald-300 dark:ring-zinc-600"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/auth/login"
            className="rounded-full bg-emerald-600 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Iniciar sesión
          </a>
          <a
            href="/auth/register"
            className="rounded-full border border-emerald-600 px-8 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-zinc-700"
          >
            Crear cuenta
          </a>
        </div>
      </main>
    </div>
  );
}

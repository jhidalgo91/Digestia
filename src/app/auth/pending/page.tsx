import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 p-8 shadow-lg text-center">
        <span className="text-5xl">⏳</span>
        <h1 className="mt-4 text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          Cuenta pendiente de aprobación
        </h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Tu solicitud de cuenta de nutricionista está siendo revisada por el equipo de
          DigestAI. Te notificaremos por correo electrónico cuando tu cuenta sea aprobada.
        </p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
          Este proceso suele tardar menos de 24 horas.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Volver al inicio
          </Link>
          <Link
            href="/auth/login"
            className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

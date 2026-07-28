import Link from 'next/link'
import { BrandLogo } from '@/components/shared/brand-logo'
import { routes } from '@/lib/auth/routes'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[42%_58%]">
      <aside className="relative hidden overflow-hidden bg-green-700 lg:block">
        <div className="img-card-overlay absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-cream-50">
          <Link href={routes.home} className="inline-flex items-center gap-3" aria-label="Back to Fidel home">
            <BrandLogo size={64} showWordmark={false} priority />
            <span className="font-display text-2xl text-cream-50">Fidel</span>
          </Link>
          <blockquote className="max-w-sm">
            <p className="font-display text-2xl leading-snug">
              Culture first. Language next. Practice until it sticks.
            </p>
            <footer className="mt-4 text-sm text-cream-100/70">
              Built for diplomats, NGO staff, and returning diaspora in Ethiopia.
            </footer>
          </blockquote>
        </div>
      </aside>

      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-cream-50 to-white px-4 py-10 sm:px-8">
        <div className="relative z-10 w-full max-w-[460px] rounded-2xl border border-cream-300 bg-white/90 p-6 shadow-card backdrop-blur-sm sm:p-8">
          <div className="mb-6 flex justify-center lg:mb-8">
            <Link href={routes.home} aria-label="Back to Fidel home" className="group relative inline-flex">
              <span className="auth-water-shape auth-water-shape-a" />
              <span className="auth-water-shape auth-water-shape-b" />
              <span className="auth-water-shape auth-water-shape-c" />
              <span className="relative z-10 rounded-full bg-white/85 p-2 shadow-sm">
                <BrandLogo size={78} showWordmark={false} priority />
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes authFloatA {
          0%, 100% { transform: translate(-12%, -8%) scale(1); }
          50% { transform: translate(-8%, -18%) scale(1.06); }
        }
        @keyframes authFloatB {
          0%, 100% { transform: translate(10%, 10%) scale(1); }
          50% { transform: translate(14%, 2%) scale(1.08); }
        }
        @keyframes authFloatC {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-2%, 6%) scale(0.94); }
        }
        .auth-water-shape {
          position: absolute;
          border-radius: 9999px;
          opacity: 0.55;
          filter: blur(0.5px);
        }
        .auth-water-shape-a {
          width: 108px;
          height: 108px;
          background: radial-gradient(circle at 30% 30%, #f8d489 0%, #d6ad60 62%, #be9345 100%);
          animation: authFloatA 5.8s ease-in-out infinite;
        }
        .auth-water-shape-b {
          width: 92px;
          height: 92px;
          background: radial-gradient(circle at 35% 30%, #b7dfdd 0%, #5f8783 68%, #2a4a48 100%);
          animation: authFloatB 6.6s ease-in-out infinite;
        }
        .auth-water-shape-c {
          width: 122px;
          height: 122px;
          background: radial-gradient(circle at 40% 28%, #fff6de 0%, #f3dfb2 72%, #e0ba6f 100%);
          animation: authFloatC 7.4s ease-in-out infinite;
          opacity: 0.42;
        }
      `}</style>
    </div>
  )
}

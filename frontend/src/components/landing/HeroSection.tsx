import { BackgroundLines } from "../ui/background-lines";

export default function HeroSection() {
  return (
    <BackgroundLines>
      <div className="min-h-screen bg-white flex flex-col justify-between pt-30">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-center flex-1 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-6xl lg:text-6xl font-bold tracking-tight text-slate-950 max-w-3xl mx-auto leading-[1.1]">
            Space for your team, friends and communities
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed ">
            Create a space, organize channels around your topics, and talk in realtime — with invites, direct messages and everything in between.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/register"
              className="group relative overflow-hidden rounded-xl bg-[#0B1020] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(91,53,213,0.28)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Join Kivo</span>
              <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            <a
              href="#demo"
              className="w-full sm:w-auto text-base font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-7 py-3.5 rounded-xl transition-all hover:border-slate-300 hover:text-black"
            >
              Try Instant Sandbox
            </a>
            </div>
          <p className="mt-4 text-xs text-slate-600 font-medium">Runs on Chrome, Arc, Safari, & Firefox &bull; Zero downloads required</p>
          <div className="mt-12 relative max-w-5xl mx-auto w-full">
            <div className="absolute -inset-1 bg-linear-to-r from-indigo-100 to-indigo-50 rounded-2xl blur-xl opacity-70" />
            <div className="relative bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden text-left">
              <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-3 flex items-center space-x-4"><div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-rose-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div><div className="flex-1 bg-white border border-slate-200/70 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-mono text-slate-700"><div className="flex items-center space-x-2 truncate"><span className="text-emerald-600">🔒</span><span className="text-black">https://localhost:5000/space/deign-team</span></div><span className="text-slate-400 text-[10px] font-sans">PWA Ready</span></div></div>
              <div className="p-6 space-y-4 font-sans bg-white"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center space-x-2"><span className="text-slate-500 font-bold">#</span><span className="text-slate-950 font-semibold text-sm">sprint-planning</span></div><div className="text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200/50"><kbd className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">⌘</kbd><kbd className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px] ml-1">K</kbd> Search</div></div><div className="flex items-start space-x-3 pt-2"><div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200/50">JD</div><div><div className="flex items-center space-x-2"><span className="text-sm font-semibold text-slate-950">Jordan D.</span><span className="text-xs text-slate-500">11:05 AM</span></div><p className="text-sm text-slate-800 mt-1 max-w-xl">Shared the web app link with external vendors. Instant access worked smoothly without signup barriers.</p></div></div></div>
            </div>
          </div>
        </main>
      </div>
    </BackgroundLines>
  );
}

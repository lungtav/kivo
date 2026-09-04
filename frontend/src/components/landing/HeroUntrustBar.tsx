export default function HeroUntrustBar() {
  const partners = [
    {
      name: "Linear",
      svg: (
        <svg viewBox="0 0 100 100" fill="currentColor" className="h-6 w-auto">
          <path d="M1.2 56.2L43.8 98.8C45.4 100.4 48 100.4 49.6 98.8L98.8 49.6C100.4 48 100.4 45.4 98.8 43.8L56.2 1.2C54.6-0.4 52-0.4 50.4 1.2L1.2 50.4C-0.4 52-0.4 54.6 1.2 56.2ZM46.8 21.2L78.8 53.2L53.2 78.8L21.2 46.8L46.8 21.2Z" />
        </svg>
      ),
    },
    {
      name: "Notion",
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-auto">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.393-.793c.28 0 .047-.28-.046-.326L15.93 1.83c-.467-.327-.933-.606-2.007-.513L2.825 2.296c-.374.047-.467.234-.327.42l1.961 1.492zm.56 3.125v13.627c0 .653.234.933.98.887l13.534-.84c.747-.047.887-.467.887-.933V6.26c0-.56-.233-.793-.747-.746L5.86 6.353c-.56.046-.841.326-.841.98zm11.528 1.446c.14 0 .28.093.28.28v9.427c0 .56-.14.793-.56.84l-2.007.14c-.373.047-.56-.14-.56-.467V10.27l-3.36 6.301c-.14.28-.326.373-.653.373h-.233c-.28 0-.467-.187-.56-.42L6.84 9.803v8.12c0 .42-.187.606-.56.653l-1.447.093c-.28.047-.467-.14-.467-.42V8.404c0-.373.187-.56.514-.606l2.193-.14c.374-.047.607.14.747.42l3.454 6.348v-5.694c0-.42.187-.607.56-.653l2.287-.14c.28-.047.42.14.42.42z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-auto">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      ),
    },
    {
      name: "Vercel",
      svg: (
        <svg viewBox="0 0 512 512" fill="currentColor" className="h-5 w-auto">
          <path d="M256 48L512 464H0L256 48Z" />
        </svg>
      ),
    },
    {
      name: "Figma",
      svg: (
        <svg viewBox="0 0 38 57" fill="currentColor" className="h-6 w-auto">
          <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" />
          <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" />
          <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" />
          <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" />
          <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full border-y border-slate-100 bg-slate-50/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle Section Label */}
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-slate-400 mb-8">
          Untrusted by top teams
        </p>

        {/* Logo Grid / Flex Bar */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 text-slate-300 transition-colors">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center cursor-pointer transition-colors hover:text-slate-500"
              title={partner.name}
            >
              <div className="transition-opacity">
                {partner.svg}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

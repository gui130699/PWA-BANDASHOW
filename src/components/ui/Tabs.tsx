import { clsx } from 'clsx'

export type TabOption<T extends string> = {
  value: T
  label: string
  description?: string
}

type TabsProps<T extends string> = {
  activeTab: T
  onChange: (tab: T) => void
  tabs: TabOption<T>[]
  ariaLabel?: string
}

export function Tabs<T extends string>({
  activeTab,
  onChange,
  tabs,
  ariaLabel = 'Navegação da página',
}: TabsProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className="grid w-full gap-3 rounded-lg border border-white/10 bg-night-850/92 p-3 shadow-soft sm:grid-cols-2"
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.value === activeTab

        return (
          <button
            aria-selected={active}
            className={clsx(
              'min-h-20 rounded-md border px-5 py-4 text-left transition motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
              active
                ? 'border-gold-300 bg-gold-400 text-night-950 shadow-glow'
                : 'border-white/10 bg-black/15 text-slate-300 hover:border-gold-300/40 hover:bg-white/8 hover:text-white',
            )}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            role="tab"
            type="button"
          >
            <span className="block text-base font-semibold">{tab.label}</span>
            {tab.description && (
              <span className={clsx('mt-1 block text-xs', active ? 'text-night-800' : 'text-slate-500')}>
                {tab.description}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

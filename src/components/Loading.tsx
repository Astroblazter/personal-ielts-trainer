import { useApp } from '@/context/AppContext';
import { Spinner } from '@/components/ui';

export function Loading({ label }: { label?: string }) {
  const { ready } = useApp();
  const l = label ?? 'Загрузка...';
  if (ready) return null;
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label={l} />
    </div>
  );
}

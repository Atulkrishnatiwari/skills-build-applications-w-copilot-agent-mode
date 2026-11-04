import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  load: () => Promise<T[]>;
  renderItem: (item: T) => ReactNode;
};

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; items: T[] };

export function CapabilityCard<T>({ title, description, emptyMessage, load, renderItem }: Props<T>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    load().then((items) => {
      if (active) setState(items.length > 0 ? { status: 'success', items } : { status: 'empty' });
    }).catch((error: unknown) => {
      if (active) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    });
    return () => { active = false; };
  }, [load]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'empty' && <p>{emptyMessage}</p>}
        {state.status === 'success' && <ul>{state.items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
      </div>
    </section>
  );
}

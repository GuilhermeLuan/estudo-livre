export function Campo({ rotulo, ...props }: { rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={props.id} className="text-[.8125rem] font-medium text-ink-2">
        {rotulo}
      </label>
      <input className="input" {...props} />
    </div>
  );
}

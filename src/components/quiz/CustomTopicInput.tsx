"use client";

export function CustomTopicInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        Enter a topic you want to be quizzed on
      </p>
      <input
        type="text"
        placeholder="e.g. Quantum Computing, World War II, Python Decorators..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        autoFocus
      />
    </div>
  );
}

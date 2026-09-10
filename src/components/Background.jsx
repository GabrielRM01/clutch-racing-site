export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="grid-bg absolute inset-0" />
      <div className="absolute -top-1/3 left-0 size-[32rem] rounded-full bg-gradient-to-bl from-primary/20 to-transparent blur-3xl" />
      <div className="absolute -top-1/3 right-0 hidden size-[46rem] rounded-full bg-gradient-to-bl from-primary/25 to-transparent blur-3xl sm:right-10 sm:block" />
      <div className="absolute bottom-0 left-1/4 size-[28rem] rounded-full bg-gradient-to-t from-secondary/10 to-transparent blur-3xl" />
    </div>
  );
}

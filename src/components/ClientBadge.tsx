import Image from "next/image";

export function ClientBadge() {
  return (
    <div className="flex items-center gap-3 rounded-full border border-neutral-800/30 bg-transparent py-1.5 pr-4 pl-2 shadow-sm backdrop-blur-md">
      <div className="flex items-center">
        {/* Avatar 1 */}
        <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#0404041f] bg-gray-800 duration-100 hover:scale-[1.05]">
          <Image
            src="/images/avatar/avatar3.webp"
            alt="Cliente 1"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
        {/* Avatar 2 */}
        <div className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-gray-400 duration-100 hover:scale-[1.05]">
          <Image
            src="/images/avatar/avatar2.webp"
            alt="Cliente 2"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
        {/* Avatar 3 */}
        <div className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-gray-300 duration-100 hover:scale-[1.05]">
          <Image
            src="/images/avatar/avatar1.webp"
            alt="Cliente 3"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <span className="text-sm font-medium text-neutral-500">
        <span className="font-bold text-neutral-200">3.350+</span> Clientes
        Satisfeitos
      </span>
    </div>
  );
}

import { Tags, UsersRound } from "lucide-react";

function SourceChannels({ sourceChannels = [], customers = [] }) {
  const customersByChannel = sourceChannels.map((channel) => {
    const count = customers.filter(
      (customer) =>
        Number(customer.source_channel_id) === Number(channel.source_channel_id)
    ).length;

    return {
      ...channel,
      customer_count: count,
    };
  });

  const totalLinkedCustomers = customersByChannel.reduce(
    (total, item) => total + Number(item.customer_count || 0),
    0
  );

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl px-4 py-3 border border-tanta-primary/15 bg-white/35 dark:bg-white/5">
          <p className="text-xs opacity-65">Canales activos</p>
          <h3 className="text-2xl font-bold mt-1">{sourceChannels.length}</h3>
        </div>

        <div className="rounded-2xl px-4 py-3 border border-tanta-primary/15 bg-white/35 dark:bg-white/5">
          <p className="text-xs opacity-65">Clientes vinculados</p>
          <h3 className="text-2xl font-bold mt-1">{totalLinkedCustomers}</h3>
        </div>

        <div className="rounded-2xl px-4 py-3 border border-tanta-primary/15 bg-white/35 dark:bg-white/5">
          <p className="text-xs opacity-65">Sin canal asignado</p>
          <h3 className="text-2xl font-bold mt-1">
            {
              customers.filter(
                (customer) =>
                  !customer.source_channel_id ||
                  Number(customer.source_channel_id) === 0
              ).length
            }
          </h3>
        </div>
      </div>

      <div className="rounded-2xl border border-tanta-primary/15 bg-white/30 dark:bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-tanta-primary/15 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
              Canales de origen
            </p>
            <h3 className="text-xl font-bold">Resumen comercial</h3>
          </div>

          <div className="hidden sm:flex h-10 w-10 rounded-xl bg-tanta-primary/10 items-center justify-center">
            <Tags size={20} />
          </div>
        </div>

        <div className="divide-y divide-tanta-primary/10">
          {customersByChannel.map((channel) => {
            const percentage =
              totalLinkedCustomers > 0
                ? Math.round((channel.customer_count / totalLinkedCustomers) * 100)
                : 0;

            return (
              <div
                key={channel.source_channel_id}
                className="px-5 py-3 hover:bg-tanta-primary/10 transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_120px] gap-3 md:items-center">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-tanta-primary/10 flex items-center justify-center shrink-0">
                      <Tags size={17} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold truncate">
                          {channel.source_channel_name}
                        </h4>

                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-tanta-primary/10 text-tanta-dark dark:text-[#f0d4bc]">
                          {channel.source_channel_code}
                        </span>
                      </div>

                      <p className="text-xs opacity-65 mt-1 line-clamp-1">
                        {channel.description || "Canal comercial activo."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-tanta-primary/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-tanta-primary to-tanta-secondary rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="text-xs font-semibold min-w-[42px] text-right">
                      {percentage}%
                    </span>
                  </div>

                  <div className="flex md:justify-end">
                    <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/45 dark:bg-white/10 border border-tanta-primary/10">
                      <UsersRound size={15} className="opacity-70" />
                      <span className="text-sm font-bold">
                        {channel.customer_count}
                      </span>
                      <span className="text-xs opacity-65">clientes</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sourceChannels.length === 0 && (
            <div className="p-8 text-center opacity-70">
              No hay canales de origen configurados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SourceChannels;


import clsx from 'clsx';


interface ChannelGuideProps {
    channels: any[] | undefined;
    currentChannelId: string | undefined;
    onSelectChannel: (index: number) => void;
    workingChannels?: Set<string>;
    failedChannels?: Set<string>;
    isScanning?: boolean;
    scanProgress?: number;
    onRescan?: () => void;
}

export function ChannelGuide({ channels, currentChannelId, onSelectChannel, workingChannels, failedChannels, isScanning, scanProgress, onRescan }: ChannelGuideProps) {
    // While loading
    if (channels === undefined) {
        return (
            <aside className="w-[320px] h-[550px] bg-paper-light relative shadow-2xl flex flex-col overflow-hidden transform rotate-1 border-l border-gray-300">
                <div className="absolute top-0 left-0 bottom-0 w-8 bg-neutral-800 z-20 flex flex-col items-center py-4 gap-3 shadow-2xl">
                    {[...Array(10)].map((_, i) => <div key={i} className="w-4 h-4 rounded-full bg-gray-400 shadow-inner"></div>)}
                </div>
                <div className="pl-10 pr-4 py-6 h-full flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-gray-400 loading-spinner">sports_soccer</span>
                </div>
            </aside>
        );
    }

    const workingCount = workingChannels ? workingChannels.size : 0;
    const failedCount = failedChannels ? failedChannels.size : 0;

    return (
        <aside className="w-[320px] h-[550px] bg-paper-light relative shadow-2xl flex flex-col overflow-hidden transform rotate-1 border-l border-gray-300">
            {/* Spiral binding */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-neutral-800 z-20 flex flex-col items-center py-4 gap-3 shadow-2xl">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-gray-400 shadow-inner"></div>
                ))}
            </div>

            <div className="pl-10 pr-4 py-6 h-full flex flex-col bg-[linear-gradient(transparent_23px,#90CAF9_24px)] bg-[length:100%_24px]">
                <div className="text-center mb-4 rotate-1 border-b-2 border-red-800/20 pb-2">
                    <h2 className="font-serif italic text-3xl text-red-900">Guía de Canales</h2>
                    <p className="font-hand text-gray-500 text-xl">Buenos Aires, Argentina</p>
                </div>

                <div className="flex justify-center gap-4 text-xs font-bold text-gray-600 mb-2 font-ui uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div> {workingCount} En Vivo
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div> {failedCount} Cortado
                    </span>
                </div>

                {/* Rescan Button */}
                <div className="flex justify-center mb-4">
                    {isScanning ? (
                        <div className="text-xs font-mono text-gray-500 bg-yellow-100 px-3 py-1 rounded shadow-sm border border-yellow-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm loading-spinner">sync</span>
                            Sintonizando... {scanProgress}%
                        </div>
                    ) : (
                        <button
                            onClick={onRescan}
                            className="text-xs font-mono text-gray-600 bg-white hover:bg-gray-100 px-3 py-1 rounded shadow-sm border border-gray-300 flex items-center gap-1 cursor-pointer uppercase"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Reescanear Canales
                        </button>
                    )}
                </div>

                <ul className="flex-1 overflow-y-auto pr-2 space-y-2 channel-scroll">
                    {channels.map((channel, index) => {
                        const isWorking = workingChannels?.has(channel.url);
                        const isFailed = failedChannels?.has(channel.url);
                        const isUnknown = !isWorking && !isFailed;

                        return (
                            <li
                                key={channel._id}
                                onClick={() => onSelectChannel(index)}
                                className={clsx(
                                    "group flex items-center gap-3 cursor-pointer p-1 rounded transition-colors",
                                    currentChannelId === channel._id ? "bg-yellow-100/90 rotate-[-1deg] shadow-sm transform translate-x-1" : "hover:bg-yellow-100/50"
                                )}
                            >
                                <div className="font-hand text-2xl text-gray-400 w-8 text-right group-hover:text-red-600">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <div className="flex-1 border-b border-gray-300 pb-1 border-dashed">
                                    <h3 className="font-serif font-bold text-gray-800 text-lg leading-none">
                                        {channel.name}
                                        {channel.type.includes('youtube') && <span className="bg-red-600 text-white text-[10px] px-1 rounded font-bold ml-1">YT</span>}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                        {isWorking && <span className="text-green-600 text-xs font-ui uppercase font-bold">En Vivo</span>}
                                        {isFailed && <span className="text-red-500 text-xs font-ui uppercase font-bold decoration-line-through">Sin Señal</span>}
                                        {isUnknown && <span className="text-gray-400 text-xs font-ui uppercase italic">Probando...</span>}
                                    </div>
                                </div>
                                {channel._id === currentChannelId && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </div>

            <div className="absolute bottom-12 right-6 bg-yellow-200 w-32 p-3 shadow-lg rotate-3 text-center transform hover:scale-110 transition-transform z-30">
                <div className="w-8 h-2 bg-yellow-400/50 absolute -top-1 left-1/2 -translate-x-1/2 rotate-2"></div>
                <p className="font-hand text-gray-800 text-lg leading-tight">¡No te olvides de apagar la tele, nene!</p>
            </div>
        </aside>
    );
}

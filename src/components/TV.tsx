import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import clsx from 'clsx';

interface Channel {
    _id: string;
    name: string;
    url: string;
    type: "m3u8" | "youtube_video" | "youtube_live" | "iframe";
    logo?: string;
    category: string;
}

interface TVProps {
    channel: Channel | null;
    channels: Channel[]; // Needed for knob logic
    isPoweredOn: boolean;
    onPowerToggle: () => void;
    volume: number;
    onVolumeChange: (vol: number) => void;
    currentChannelIndex: number;
    onChannelChange: (index: number) => void;
    workingChannels: Set<string>;
}

export function TV({
    channel,
    channels,
    isPoweredOn,
    onPowerToggle,
    volume,
    onVolumeChange,
    currentChannelIndex,
    onChannelChange,
    workingChannels
}: TVProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start true to show "SINTONIZANDO..." during initial scan
    const [hasSignal, setHasSignal] = useState(false);
    const [showChannelInfo, setShowChannelInfo] = useState(false);

    // Knob rotation state
    const channelRotation = (currentChannelIndex * 15) % 360;
    const volumeRotation = (volume * 270) - 135;

    // Video event listeners for confirmed playback
    // Re-run when channel type changes since video element is conditionally rendered
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlaying = () => {
            setHasSignal(true);
            setIsLoading(false);
        };
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setHasSignal(false);
            setIsLoading(false);
        };

        video.addEventListener('playing', handlePlaying);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('error', handleError);
        };
    }, [channel?.type]);

    // Handle Channel Playback
    useEffect(() => {
        if (!isPoweredOn || !channel) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        // These state updates are intentional - syncing with external HLS system on channel change
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);
        setHasSignal(false);
        setShowChannelInfo(true);

        // Hide info after 5s
        const infoTimer = setTimeout(() => setShowChannelInfo(false), 5000);

        // HLS Handling
        if (channel.type === 'm3u8') {
            if (Hls.isSupported()) {
                if (hlsRef.current) hlsRef.current.destroy();

                const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(channel.url);
                hls.attachMedia(video);
                hlsRef.current = hls;

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    // Don't set hasSignal here - let the 'playing' event handler do it
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Autoplay prevented:", error);
                            setHasSignal(false);
                            setIsLoading(false);
                        });
                    }
                });

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        setHasSignal(false);
                        setIsLoading(false);
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS - hasSignal will be set by 'playing' event listener
                video.src = channel.url;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Autoplay prevented by browser:", error);
                        setHasSignal(false);
                        setIsLoading(false);
                    });
                }
            }
        } else {
            // Direct video file or simple src - hasSignal will be set by 'playing' event listener
            video.src = channel.url;
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay prevented:", error);
                    setHasSignal(false);
                    setIsLoading(false);
                });
            }
        }

        return () => {
            clearTimeout(infoTimer);
            if (hlsRef.current) {
                // Don't destroy immediately on unmount to prevent screen flicker during weak renders,
                // but cleaning up on channel change is important.
            }
        };
    }, [channel, isPoweredOn]);

    // Volume Effect
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Get indices of working channels only
    const workingIndices = channels
        .map((ch, idx) => workingChannels.has(ch.url) ? idx : -1)
        .filter(idx => idx !== -1);

    // Keyboard navigation: Arrow keys for channel/volume (works in fullscreen too)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'ArrowLeft': {
                    e.preventDefault();
                    if (workingIndices.length === 0) return;
                    const currentPos = workingIndices.indexOf(currentChannelIndex);
                    if (currentPos === -1 || currentPos === 0) {
                        onChannelChange(workingIndices[workingIndices.length - 1]);
                    } else {
                        onChannelChange(workingIndices[currentPos - 1]);
                    }
                    break;
                }
                case 'ArrowRight': {
                    e.preventDefault();
                    if (workingIndices.length === 0) return;
                    const currentPos = workingIndices.indexOf(currentChannelIndex);
                    if (currentPos === -1 || currentPos === workingIndices.length - 1) {
                        onChannelChange(workingIndices[0]);
                    } else {
                        onChannelChange(workingIndices[currentPos + 1]);
                    }
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    onVolumeChange(Math.min(1, volume + 0.1));
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    onVolumeChange(Math.max(0, volume - 0.1));
                    break;
                }
            }
        };

        // Listen on both window and video element for fullscreen support
        window.addEventListener('keydown', handleKeyDown);
        const video = videoRef.current;
        if (video) {
            video.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (video) {
                video.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [workingIndices, currentChannelIndex, onChannelChange, volume, onVolumeChange]);

    // Knob Handlers (Mouse Wheel & Click) - only cycle through working channels
    const handleChannelKnobClick = (e: React.MouseEvent) => {
        if (workingIndices.length === 0) return; // No working channels

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;

        // Find current position in working indices
        const currentWorkingPos = workingIndices.indexOf(currentChannelIndex);

        if (x > 0) {
            // Next working channel
            if (currentWorkingPos === -1 || currentWorkingPos === workingIndices.length - 1) {
                onChannelChange(workingIndices[0]); // Wrap to first
            } else {
                onChannelChange(workingIndices[currentWorkingPos + 1]);
            }
        } else {
            // Previous working channel
            if (currentWorkingPos === -1 || currentWorkingPos === 0) {
                onChannelChange(workingIndices[workingIndices.length - 1]); // Wrap to last
            } else {
                onChannelChange(workingIndices[currentWorkingPos - 1]);
            }
        }
    };

    const handleVolumeKnobClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top - rect.height / 2;
        if (y < 0) onVolumeChange(Math.min(1, volume + 0.1));
        else onVolumeChange(Math.max(0, volume - 0.1));
    };


    return (
        <div className="relative group">
            {/* Background Photos */}
            <div
                className="absolute -bottom-24 -left-8 z-10 transform -rotate-[5deg] polaroid-wrapper hover:z-50 pointer-events-auto"
            >
                <div className="bg-white p-2 pb-6 shadow-polaroid w-52 rotate-3 border border-gray-200">
                    <div className="bg-gray-200 h-36 w-full overflow-hidden grayscale-[10%] sepia-[20%] hover:grayscale-0 hover:sepia-0 transition-all relative">
                        <img alt="Family" className="w-full h-full object-cover" src="/assets/IMG_7924.jpg" />
                        <div className="absolute inset-0 bg-yellow-900/10 mix-blend-multiply pointer-events-none"></div>
                    </div>
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-800 rounded-full shadow-md z-20 border-2 border-red-900"></div>
            </div>

            <div className="absolute -bottom-10 -right-20 z-20 transform rotate-12 polaroid-wrapper hidden lg:block opacity-80 hover:opacity-100 transition-opacity pointer-events-auto">
                <div className="bg-white p-3 pb-8 shadow-polaroid w-40 -rotate-3">
                    <div className="bg-gray-200 h-28 w-full overflow-hidden grayscale-[30%] hover:grayscale-0 transition-all">
                        <img alt="Family 2" className="w-full h-full object-cover" src="/assets/IMG_7900-EDIT.jpg" />
                    </div>
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-12 bg-white/40 -rotate-45 backdrop-blur-sm border-r border-white/60 shadow-sm"></div>
            </div>

            {/* Antenna */}
            <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 w-64 h-32 flex justify-between items-end z-0">
                <div className="w-1.5 h-32 bg-gray-400 rounded-full transform -rotate-[35deg] origin-bottom shadow-lg border border-gray-500 relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full absolute -top-1 -left-1 shadow-sm"></div>
                </div>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <span className="material-symbols-outlined text-yellow-500/80 text-7xl drop-shadow-lg animate-pulse">sunny</span>
                </div>
                <div className="w-1.5 h-32 bg-gray-400 rounded-full transform rotate-[35deg] origin-bottom shadow-lg border border-gray-500"></div>
            </div>

            {/* TV Cabinet */}
            <div className="relative bg-wood-base w-[720px] h-[520px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center p-8 box-border border-r-[8px] border-b-[8px] border-wood-dark border-t-[2px] border-l-[2px] border-wood-light">
                <div className="absolute inset-0 opacity-30 bg-wood-pattern pointer-events-none mix-blend-overlay"></div>

                {/* Small Polaroid on TV */}
                <div className="absolute top-6 right-[140px] z-30 transform rotate-[8deg] polaroid-wrapper pointer-events-auto">
                    <div className="bg-white p-1 pb-4 shadow-md w-32 border border-gray-300">
                        <div className="bg-gray-200 h-24 w-full overflow-hidden grayscale-[15%] contrast-125 sepia-[15%] hover:grayscale-0 hover:sepia-0 transition-all relative">
                            <img alt="Small" className="w-full h-full object-cover" src="/assets/IMG_7930-EDIT.jpg" />
                            <div className="absolute inset-0 bg-orange-500/10 mix-blend-screen pointer-events-none"></div>
                        </div>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-10 bg-yellow-200/60 rotate-90 backdrop-blur-sm shadow-sm border border-yellow-100"></div>
                    </div>
                </div>

                <div className="w-full h-full flex gap-6 z-20 items-center">

                    {/* SCREEN */}
                    <div
                        ref={containerRef}
                        className="screen flex-1 h-[360px] bg-black rounded-[2rem] border-[12px] border-gray-800 shadow-inner-screen relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-shadow duration-500 ring-4 ring-gray-400/30"
                    >
                        {channel?.type === 'm3u8' ? (
                            <video
                                ref={videoRef}
                                className={clsx("w-full h-full object-contain", !isPoweredOn && "hidden")}
                                playsInline
                                controls
                            />
                        ) : channel?.type.includes('youtube') ? (
                            <iframe
                                ref={iframeRef}
                                src={isPoweredOn ? channel.url : ''}
                                className={clsx("w-full h-full", !isPoweredOn && "hidden")}
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                            />
                        ) : (
                            <div className="w-full h-full bg-black"></div>
                        )}

                        {/* Overlays */}
                        {!hasSignal && isPoweredOn && (
                            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                {isLoading ? (
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-6xl text-yellow-500 loading-spinner">sports_soccer</span>
                                        <p className="text-white font-ui tracking-widest text-sm mt-2">SINTONIZANDO...</p>
                                    </div>
                                ) : (
                                    <div className="text-center opacity-40">
                                        <span className="material-symbols-outlined text-6xl text-white mb-2 animate-pulse">tv_off</span>
                                        <p className="text-white font-ui tracking-widest text-sm opacity-70">SIN SEÑAL</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {showChannelInfo && isPoweredOn && channel && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-3 flex items-center gap-3 transition-opacity">
                                <div className="flex-1">
                                    <p className="text-white font-bold text-lg">{channel.name}</p>
                                    <p className="text-yellow-500 text-sm font-ui">{channel.category}</p>
                                </div>
                            </div>
                        )}

                        {/* CRT Overlay */}
                        <div className="crt-overlay absolute top-0 right-0 w-full h-2/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none"></div>
                        <div className="crt-overlay absolute inset-0 bg-scanlines pointer-events-none opacity-50"></div>
                    </div>

                    {/* CONTROLS */}
                    <div className="w-32 h-[360px] bg-gradient-to-b from-neutral-200 to-neutral-400 rounded-xl border border-neutral-500 shadow-inner flex flex-col items-center justify-between py-4 px-2 relative">
                        {/* Screws */}
                        <div className="absolute top-2 left-2 w-2 h-2 bg-gray-400 rounded-full shadow-inner flex items-center justify-center"><div className="w-full h-[1px] bg-gray-600 rotate-45"></div></div>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-gray-400 rounded-full shadow-inner flex items-center justify-center"><div className="w-full h-[1px] bg-gray-600 rotate-45"></div></div>
                        <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-400 rounded-full shadow-inner flex items-center justify-center"><div className="w-full h-[1px] bg-gray-600 rotate-45"></div></div>
                        <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-400 rounded-full shadow-inner flex items-center justify-center"><div className="w-full h-[1px] bg-gray-600 rotate-45"></div></div>

                        {/* Flag */}
                        <div className="w-20 h-12 bg-sky-200 border-2 border-yellow-500 rounded shadow-md flex items-center justify-center mb-2 overflow-hidden relative">
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-sky-400"></div>
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-sky-400"></div>
                            <div className="z-10 bg-yellow-400 rounded-full w-4 h-4 shadow-sm"></div>
                        </div>

                        {/* Channel Knob */}
                        <div className="flex flex-col items-center gap-1">
                            <div
                                onClick={handleChannelKnobClick}
                                className="w-16 h-16 rounded-full metal-knob flex items-center justify-center cursor-pointer active:rotate-12 transition-transform shadow-lg relative border-4 border-gray-300"
                            >
                                <div className="absolute top-1 w-1 h-3 bg-red-500 rounded" style={{ transform: `rotate(${channelRotation}deg)`, transformOrigin: "center 24px", transition: "transform 0.3s ease" }}></div>
                                <span className="material-symbols-outlined text-gray-600 text-2xl font-bold">sports_soccer</span>
                            </div>
                            <span className="text-[10px] font-ui text-black font-bold uppercase tracking-widest bg-gray-200 px-1 rounded border border-gray-400 shadow-sm">Channel</span>
                        </div>

                        {/* Volume Knob */}
                        <div className="flex flex-col items-center gap-1">
                            <div
                                onClick={handleVolumeKnobClick}
                                className="w-16 h-16 rounded-full metal-knob flex items-center justify-center cursor-pointer active:rotate-12 transition-transform shadow-lg relative border-4 border-gray-300"
                            >
                                <div className="absolute top-1 w-1 h-3 bg-black rounded" style={{ transform: `rotate(${volumeRotation}deg)`, transformOrigin: "center 24px", transition: "transform 0.1s" }}></div>
                                <span className="material-symbols-outlined text-gray-600 text-2xl">volume_up</span>
                            </div>
                            <span className="text-[10px] font-ui text-black font-bold uppercase tracking-widest bg-gray-200 px-1 rounded border border-gray-400 shadow-sm">Audio</span>
                        </div>

                        {/* Power */}
                        <div className="mt-auto">
                            <button onClick={onPowerToggle} className="w-12 h-12 rounded bg-black border-b-4 border-r-4 border-gray-800 shadow-lg flex items-center justify-center group active:scale-95 active:border-0 transition-all active:translate-y-1">
                                <span className={clsx("material-symbols-outlined text-xl transition-colors", isPoweredOn ? "text-green-500" : "text-red-500 group-hover:text-red-400")}>power_settings_new</span>
                            </button>
                        </div>

                    </div>
                </div>

                {/* Bottom Labels */}
                <div className="w-full flex items-center justify-between px-12 mt-4 z-20">
                    <div className="w-24"></div>
                    <div className="bg-gradient-to-r from-gray-800 via-black to-gray-800 px-6 py-2 rounded border-2 border-gray-400 shadow-lg flex items-center gap-3">
                        <div className="w-full h-[1px] bg-gray-600"></div>
                        <span className="font-display text-yellow-500 text-2xl tracking-wide whitespace-nowrap gold-leaf">TeleArgentina</span>
                        <div className="w-full h-[1px] bg-gray-600"></div>
                    </div>
                    <button onClick={() => setIsMuted(!isMuted)} className="bg-wood-light hover:bg-wood-light/80 text-white border-2 border-wood-dark px-3 py-1 rounded shadow-md font-ui text-xs uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">{isMuted ? 'volume_off' : 'volume_up'}</span>
                        Sonido
                    </button>
                </div>

            </div>
        </div>
    );
}

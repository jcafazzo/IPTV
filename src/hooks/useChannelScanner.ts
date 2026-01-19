import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';

interface Channel {
    name: string;
    url: string;
}

const CONCURRENCY = 3;
const SCAN_TIMEOUT = 8000; // 8 seconds per channel max

export function useChannelScanner(channels: Channel[] | undefined) {
    const [workingChannels, setWorkingChannels] = useState<Set<string>>(new Set());
    const [failedChannels, setFailedChannels] = useState<Set<string>>(new Set());
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    // Refs to manage workers and cancellation
    const abortControllerRef = useRef<AbortController | null>(null);
    const forceRescanRef = useRef(true); // Start with true to force initial scan
    const hasInitializedRef = useRef(false);

    // Clear cache and force fresh scan on every app start
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        // Clear any cached status - always start fresh
        localStorage.removeItem('argentina_tv_working');
        localStorage.removeItem('argentina_tv_failed');
        console.log('Channel scanner initialized - starting fresh scan');
    }, []);

    // Save status whenever it changes
    useEffect(() => {
        localStorage.setItem('argentina_tv_working', JSON.stringify([...workingChannels]));
        localStorage.setItem('argentina_tv_failed', JSON.stringify([...failedChannels]));
    }, [workingChannels, failedChannels]);

    // Invalidate cache for URLs that no longer exist in the channel list
    useEffect(() => {
        if (!channels || channels.length === 0) return;

        const currentUrls = new Set(channels.map(c => c.url));

        // Remove cached statuses for channels that no longer exist
        setWorkingChannels(prev => {
            const next = new Set<string>();
            prev.forEach(url => {
                if (currentUrls.has(url)) next.add(url);
            });
            // Only update if something changed
            return next.size !== prev.size ? next : prev;
        });

        setFailedChannels(prev => {
            const next = new Set<string>();
            prev.forEach(url => {
                if (currentUrls.has(url)) next.add(url);
            });
            return next.size !== prev.size ? next : prev;
        });
    }, [channels]);

    // Actual video/HLS check logic
    const checkChannel = useCallback((channel: Channel): Promise<boolean> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.muted = true;
            video.style.display = 'none';
            document.body.appendChild(video);

            let hls: Hls | null = null;
            let timeoutId: any = null;

            const cleanup = () => {
                clearTimeout(timeoutId);
                if (hls) hls.destroy();
                video.pause();
                video.src = "";
                video.remove();
            };

            timeoutId = setTimeout(() => {
                cleanup();
                resolve(false); // Timed out
            }, SCAN_TIMEOUT);

            const onSuccess = () => {
                cleanup();
                resolve(true);
            };

            const onFailure = () => {
                cleanup();
                resolve(false);
            };

            // Legacy protocols check
            if (channel.url.startsWith('rtsp') || channel.url.startsWith('rtmp') || channel.url.startsWith('mms')) {
                console.warn(`Skipping unsupported protocol for ${channel.name}: ${channel.url}`);
                onFailure();
                return;
            }

            // Logic based on types (similar to TV.tsx)
            if (channel.url.includes('.m3u8') || channel.url.includes('.m3u')) {
                if (Hls.isSupported()) {
                    hls = new Hls({ enableWorker: true });
                    hls.loadSource(channel.url);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, onSuccess);
                    hls.on(Hls.Events.ERROR, (_, data) => {
                        if (data.fatal) onFailure();
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // iOS native
                    video.src = channel.url;
                    video.onloadedmetadata = onSuccess;
                    video.onerror = onFailure;
                } else {
                    onFailure();
                }
            } else {
                // Direct video or YouTube
                if (channel.url.includes('youtube')) {
                    onSuccess(); // Assume youtube works
                } else {
                    video.src = channel.url;
                    video.onloadedmetadata = onSuccess;
                    video.onerror = onFailure;
                    // Attempt play to verify but silence errors
                    const p = video.play();
                    if (p) p.catch(() => { });
                }
            }
        });
    }, []);

    const scanChannels = useCallback(async (forceAll = false) => {
        if (!channels || isScanning) return;

        // Create new interrupt controller
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsScanning(true);
        setScanProgress(0);

        // If forceAll, scan everything. Otherwise only scan unknowns + failed.
        const queue = forceAll
            ? [...channels]
            : channels.filter(c => !workingChannels.has(c.url));
        const total = queue.length;

        if (total === 0) {
            setIsScanning(false);
            return;
        }
        let processed = 0;

        const worker = async () => {
            while (queue.length > 0) {
                if (signal.aborted) break;

                const channel = queue.shift();
                if (!channel) break;

                const isWorking = await checkChannel(channel);

                if (signal.aborted) break;

                const key = channel.url;
                if (isWorking) {
                    setWorkingChannels(prev => new Set(prev).add(key));
                    setFailedChannels(prev => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                } else {
                    setFailedChannels(prev => new Set(prev).add(key));
                    setWorkingChannels(prev => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                }

                processed++;
                setScanProgress(Math.round((processed / total) * 100));
            }
        };

        const workers = Array(CONCURRENCY).fill(null).map(() => worker());
        await Promise.all(workers);

        if (!signal.aborted) setIsScanning(false);
    }, [channels, isScanning, workingChannels, checkChannel]);

    const rescan = useCallback(() => {
        // Abort any ongoing scan
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Clear localStorage
        localStorage.removeItem('argentina_tv_working');
        localStorage.removeItem('argentina_tv_failed');

        // Clear state
        setWorkingChannels(new Set());
        setFailedChannels(new Set());
        setIsScanning(false);
        setScanProgress(0);

        // Set flag to trigger rescan
        forceRescanRef.current = true;
    }, []);

    // Trigger scan when channels load (once) or when rescan is requested
    useEffect(() => {
        if (channels && channels.length > 0 && !isScanning) {
            if (forceRescanRef.current) {
                forceRescanRef.current = false;
                scanChannels(true); // Force scan all channels
            } else if (scanProgress === 0) {
                scanChannels(false); // Initial scan - only unknowns
            }
        }
    }, [channels, isScanning, scanProgress, scanChannels]);

    return {
        workingChannels,
        failedChannels,
        isScanning,
        scanProgress,
        rescan,
        scanChannels
    };
}

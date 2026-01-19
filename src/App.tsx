import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { TV } from './components/TV';
import { ChannelGuide } from './components/ChannelGuide';
import { useChannelScanner } from './hooks/useChannelScanner';

function App() {
  const rawChannels = useQuery(api.channels.get);
  const seed = useMutation(api.channels.seed);

  const [currentChannelIndex, setCurrentChannelIndex] = useState(-1); // Start with no channel until scan finds working one
  const [isPoweredOn, setIsPoweredOn] = useState(true); // Start powered on
  const [volume, setVolume] = useState(0.5);
  const hasAutoSeededRef = useRef(false);
  const { workingChannels, failedChannels, isScanning, scanProgress, rescan } = useChannelScanner(rawChannels);

  // Auto-seed if database is empty (first load scenario)
  useEffect(() => {
    if (rawChannels !== undefined && rawChannels.length === 0 && !hasAutoSeededRef.current) {
      console.log("Database empty, auto-seeding channels...");
      hasAutoSeededRef.current = true;
      seed();
    }
  }, [rawChannels, seed]);

  // Sort channels: Working > Unknown > Failed
  const sortedChannels = useMemo(() => {
    if (!rawChannels) return [];

    return [...rawChannels].sort((a, b) => {
      const aWorking = workingChannels.has(a.url);
      const bWorking = workingChannels.has(b.url);
      const aFailed = failedChannels.has(a.url);
      const bFailed = failedChannels.has(b.url);

      // 1. Working channels first
      if (aWorking && !bWorking) return -1;
      if (!aWorking && bWorking) return 1;

      // 2. Failed channels last (so unknown are in the middle)
      if (aFailed && !bFailed) return 1;
      if (!aFailed && bFailed) return -1;

      // 3. Keep original order otherwise
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [rawChannels, workingChannels, failedChannels]);

  // Determine current channel object (null when index is -1 or invalid)
  const currentChannel = sortedChannels && sortedChannels.length > 0 && currentChannelIndex >= 0
    ? sortedChannels[currentChannelIndex]
    : null;

  // Auto-tune to first working channel when scan finds working channels
  // Check if current channel is working - if not, switch to first working one
  useEffect(() => {
    if (workingChannels.size === 0) return;
    if (sortedChannels.length === 0) return;

    // Check if current channel is already working
    const currentChannelUrl = sortedChannels[currentChannelIndex]?.url;
    if (currentChannelUrl && workingChannels.has(currentChannelUrl)) {
      return; // Already on a working channel
    }

    // Find first working channel and switch to it
    const firstWorkingIndex = sortedChannels.findIndex(ch => workingChannels.has(ch.url));
    if (firstWorkingIndex !== -1 && firstWorkingIndex !== currentChannelIndex) {
      console.log('Auto-tuning to first working channel:', sortedChannels[firstWorkingIndex]?.name);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentChannelIndex(firstWorkingIndex);
    }
  }, [workingChannels, sortedChannels, currentChannelIndex]);

  if (rawChannels === undefined) {
    return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">Cargando Tele...</div>;
  }

  return (
    <>
      {/* Ambient Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-100/20 to-black/40 pointer-events-none z-0 fixed"></div>

      {/* App Title */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 opacity-80 pointer-events-none z-0 fixed">
        <h1 className="font-display text-4xl text-wood-dark drop-shadow-md -rotate-2">TeleArgentina de Adela</h1>
      </div>

      <main className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full max-w-7xl z-10 scale-90 lg:scale-100 relative">

        <TV
          channel={currentChannel}
          channels={sortedChannels}
          isPoweredOn={isPoweredOn}
          onPowerToggle={() => setIsPoweredOn(!isPoweredOn)}
          volume={volume}
          onVolumeChange={setVolume}
          currentChannelIndex={currentChannelIndex}
          onChannelChange={setCurrentChannelIndex}
          workingChannels={workingChannels}
        />

        <ChannelGuide
          channels={sortedChannels}
          currentChannelId={currentChannel?._id}
          onSelectChannel={setCurrentChannelIndex}
          workingChannels={workingChannels}
          failedChannels={failedChannels}
          isScanning={isScanning}
          scanProgress={scanProgress}
          onRescan={rescan}
        />

      </main>

    </>
  );
}

export default App;
